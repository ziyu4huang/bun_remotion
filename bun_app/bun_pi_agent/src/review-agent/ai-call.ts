/**
 * Thin AI call wrapper for review-agent.
 *
 * Uses @mariozechner/pi-ai directly — no cross-app dependency on storygraph.
 * Reimplements stripMarkdownFence + repairTruncatedJSON (small utilities).
 */

import { getModel, getEnvApiKey, complete } from "@mariozechner/pi-ai";
import type { Context, Provider } from "@mariozechner/pi-ai";

export interface AICallConfig {
  provider: string;
  model: string;
  maxRetries: number;
  timeout: number;
  maxTokens: number;
}

const DEFAULT_CONFIG: AICallConfig = {
  provider: "zai",
  model: "glm-5-turbo",
  maxRetries: 1,
  timeout: 60_000,
  maxTokens: 4096,
};

/**
 * Strip markdown code fences from AI responses.
 * Greedy match to handle nested backticks in string values.
 */
export function stripMarkdownFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/```[a-z]*\s*\n([\s\S]*)\n```/);
  if (match) return match[1].trim();

  // No fence — try balanced brace extraction
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
 * Repair truncated JSON by closing open structures.
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

  if (inStr && lastCommaPos >= 0) {
    text = text.slice(0, lastCommaPos);
  }

  text = text.replace(/,\s*$/, "");

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
  overrides?: Partial<AICallConfig>,
): Promise<string | null> {
  const config = { ...DEFAULT_CONFIG, ...overrides };

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const model = getModel(config.provider as Provider, config.model as any);
      const apiKey = getEnvApiKey(config.provider as Provider);

      if (!apiKey) {
        console.error(`[review-agent] No API key for provider "${config.provider}".`);
        return null;
      }

      const context: Context = {
        systemPrompt:
          "You are a quality reviewer for a narrative video production pipeline.\n\n" +
          "You MUST respond with valid JSON only. No markdown, no explanation, just the JSON object.",
        messages: [{ role: "user", content: prompt, timestamp: Date.now() }],
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeout);
      const promptPreview = prompt.slice(0, 80).replace(/\n/g, " ");
      console.error(
        `[review-agent] Calling ${config.provider}/${config.model} (prompt: "${promptPreview}...")`,
      );

      let response;
      try {
        response = await complete(model, context, {
          apiKey,
          signal: controller.signal,
          maxTokens: config.maxTokens,
        });
      } finally {
        clearTimeout(timer);
      }

      const textBlock = response.content.find(b => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        if (attempt < config.maxRetries) continue;
        return null;
      }

      let result = stripMarkdownFence(textBlock.text);
      try {
        JSON.parse(result);
      } catch {
        console.error(`[review-agent] JSON parse failed, attempting repair (${result.length} chars)`);
        const repaired = repairTruncatedJSON(result);
        try {
          JSON.parse(repaired);
          result = repaired;
        } catch {
          if (attempt < config.maxRetries) {
            await sleep(1000);
            continue;
          }
          return null;
        }
      }

      return result;
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (err?.name === "AbortError") {
        if (attempt < config.maxRetries) continue;
        return null;
      }
      const isRateLimit = /rate.limit|429|too.many.request/i.test(msg);
      if (isRateLimit && attempt < config.maxRetries) {
        await sleep(2000);
        continue;
      }
      console.error(`[review-agent] Error: ${msg}`);
      if (attempt < config.maxRetries) continue;
      return null;
    }
  }

  return null;
}
