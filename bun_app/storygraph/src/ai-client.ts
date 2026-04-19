/**
 * pi-ai SDK wrapper for storygraph AI pipeline.
 *
 * Provides `callAI()` for direct LLM calls and `parseArgsForAI()` for
 * extracting --mode/--provider/--model from CLI args.
 *
 * Default: zai provider, glm-5 model (best extraction quality), hybrid mode.
 */

import { getModel, getEnvApiKey, complete } from "@mariozechner/pi-ai";
import type { Context, Provider } from "@mariozechner/pi-ai";

export interface AIClientConfig {
  provider: string;
  model: string;
  jsonMode: boolean;
  maxRetries: number;
  /** Per-call timeout in ms (default: 60_000) */
  timeout: number;
  /** Max output tokens (default: 4096) */
  maxTokens: number;
}

const DEFAULT_CONFIG: AIClientConfig = {
  provider: "zai",
  model: "glm-5",
  jsonMode: false,
  maxRetries: 1,
  timeout: 60_000,
  maxTokens: 4096,
};

export function parseArgsForAI(args: string[]): {
  mode: "regex" | "ai" | "hybrid";
  provider: string;
  model: string;
} {
  let mode: "regex" | "ai" | "hybrid" = "hybrid";
  let provider = DEFAULT_CONFIG.provider;
  let model = DEFAULT_CONFIG.model;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--mode" && args[i + 1]) {
      const v = args[i + 1];
      mode = v === "ai" ? "ai" : v === "hybrid" ? "hybrid" : "regex";
      i++;
    } else if (args[i] === "--provider" && args[i + 1]) {
      provider = args[i + 1];
      i++;
    } else if (args[i] === "--model" && args[i + 1]) {
      model = args[i + 1];
      i++;
    }
  }

  return { mode, provider, model };
}

/**
 * Strip markdown code fences from AI responses.
 *
 * GLM-5 wraps JSON in ```json...``` but may include nested backticks
 * inside string values (e.g. code snippets). A non-greedy match stops
 * at the first inner ```, breaking the parse. Greedy matching finds
 * the LAST ``` which is the actual closing fence.
 */
export function stripMarkdownFence(text: string): string {
  const trimmed = text.trim();

  // Greedy match: finds last closing ``` (handles nested backticks)
  const match = trimmed.match(/```[a-z]*\s*\n([\s\S]*)\n```/);
  if (match) return match[1].trim();

  // Fallback: no fence — extract raw JSON by finding balanced braces
  return extractBalancedJSON(trimmed);
}

function extractBalancedJSON(text: string): string {
  const start = text.search(/[{[]/);
  if (start < 0) return text;
  const openCh = text[start];
  const closeCh = openCh === "{" ? "}" : "]";

  let depth = 0;
  let inStr = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\\" && inStr) { i++; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === openCh) depth++;
    else if (ch === closeCh && --depth === 0) return text.slice(start, i + 1);
  }
  return text.slice(start);
}

/**
 * Attempt to repair truncated JSON by closing open structures.
 * GLM-5 responses may be cut off mid-object when hitting token limits.
 * Strategy: truncate at last comma boundary, then close open braces/brackets.
 */
export function repairTruncatedJSON(text: string): string {
  let inStr = false;
  let lastCommaPos = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\\" && inStr) { i++; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === ",") lastCommaPos = i;
  }

  // If in a truncated string, cut back to last comma
  if (inStr && lastCommaPos >= 0) {
    text = text.slice(0, lastCommaPos);
  }

  // Strip trailing comma + whitespace
  text = text.replace(/,\s*$/, "");

  // Close remaining open structures
  const stack: string[] = [];
  let inStr2 = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\\" && inStr2) { i++; continue; }
    if (ch === '"') { inStr2 = !inStr2; continue; }
    if (inStr2) continue;
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if ((ch === "}" || ch === "]") && stack.length > 0) stack.pop();
  }

  return text + stack.reverse().join("");
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function callAI(
  prompt: string,
  overrides?: Partial<AIClientConfig>,
): Promise<string | null> {
  const config = { ...DEFAULT_CONFIG, ...overrides };

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const model = getModel(config.provider as Provider, config.model as any);
      const apiKey = getEnvApiKey(config.provider as Provider);

      if (!apiKey) {
        console.error(`[ai-client] No API key found for provider "${config.provider}". Set the appropriate env var.`);
        return null;
      }

      const systemSuffix = config.jsonMode
        ? "\n\nYou MUST respond with valid JSON only. No markdown, no explanation, just the JSON object or array."
        : "";

      const context: Context = {
        systemPrompt: `You are a story analysis assistant for a knowledge graph pipeline.${systemSuffix}`,
        messages: [{ role: "user", content: prompt, timestamp: Date.now() }],
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeout);
      const promptPreview = prompt.slice(0, 60).replace(/\n/g, " ");
      console.error(`[ai-client] Calling ${config.provider}/${config.model} (timeout: ${config.timeout}ms, maxTokens: ${config.maxTokens}, prompt: "${promptPreview}...")`);
      let response;
      try {
        response = await complete(model, context, { apiKey, signal: controller.signal, maxTokens: config.maxTokens });
        console.error(`[ai-client] Response received (stopReason: ${response.stopReason})`);
      } finally {
        clearTimeout(timer);
      }

      const textBlock = response.content.find(b => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        console.error(`[ai-client] No text content in response`);
        if (attempt < config.maxRetries) continue;
        return null;
      }

      let result = textBlock.text;

      if (config.jsonMode) {
        result = stripMarkdownFence(result);
        try {
          JSON.parse(result);
        } catch {
          // Truncated response — attempt repair
          console.error(`[ai-client] JSON parse failed, attempting repair (${result.length} chars)`);
          const repaired = repairTruncatedJSON(result);
          try {
            JSON.parse(repaired);
            result = repaired;
            console.error(`[ai-client] Repair successful (${repaired.length} chars)`);
          } catch (repairErr: any) {
            console.error(`[ai-client] Repair failed: ${repairErr.message}`);
            if (attempt < config.maxRetries) {
              console.error(`[ai-client] Retrying... (${attempt + 1}/${config.maxRetries})`);
              await sleep(1000);
              continue;
            }
            return null;
          }
        }
      }

      return result;
    } catch (err: any) {
      const msg = err?.message ?? String(err);

      if (err?.name === "AbortError") {
        console.error(`[ai-client] Timeout after ${config.timeout}ms for ${config.provider}/${config.model}`);
        if (attempt < config.maxRetries) continue;
        return null;
      }
      const isRateLimit = /rate.limit|429|too.many.request/i.test(msg);
      const isAuth = /auth|401|403|invalid.api.key/i.test(msg);

      if (isAuth) {
        console.error(`[ai-client] Auth error for ${config.provider}: ${msg}`);
        return null;
      }

      if (isRateLimit && attempt < config.maxRetries) {
        console.error(`[ai-client] Rate limited, retrying in 2s... (${attempt + 1}/${config.maxRetries})`);
        await sleep(2000);
        continue;
      }

      console.error(`[ai-client] Error: ${msg}`);
      if (attempt < config.maxRetries) continue;
      return null;
    }
  }

  return null;
}
