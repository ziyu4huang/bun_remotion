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
}

const DEFAULT_CONFIG: AIClientConfig = {
  provider: "zai",
  model: "glm-5",
  jsonMode: false,
  maxRetries: 1,
  timeout: 60_000,
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

function stripMarkdownFence(text: string): string {
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  return match ? match[1].trim() : text.trim();
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
      console.error(`[ai-client] Calling ${config.provider}/${config.model} (timeout: ${config.timeout}ms, prompt: "${promptPreview}...")`);
      let response;
      try {
        response = await complete(model, context, { apiKey, signal: controller.signal });
        console.error(`[ai-client] Response received from ${config.provider}/${config.model}`);
      } finally {
        clearTimeout(timer);
      }

      const textBlock = response.content.find(b => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        console.error(`[ai-client] No text content in response (stopReason: ${response.stopReason})`);
        if (attempt < config.maxRetries) continue;
        return null;
      }

      let result = textBlock.text;

      if (config.jsonMode) {
        result = stripMarkdownFence(result);
        JSON.parse(result); // validate
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

      if (config.jsonMode && attempt < config.maxRetries) {
        console.error(`[ai-client] JSON parse failed, retrying... (${attempt + 1}/${config.maxRetries})`);
        await sleep(1000);
        continue;
      }

      console.error(`[ai-client] Error: ${msg}`);
      if (attempt < config.maxRetries) continue;
      return null;
    }
  }

  return null;
}
