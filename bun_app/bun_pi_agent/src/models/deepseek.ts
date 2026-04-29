import type { Model } from "@mariozechner/pi-ai";

/** DeepSeek API base URL (OpenAI-compatible). */
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

/** Custom DeepSeek models not yet in pi-ai's built-in registry. */
export interface DeepSeekModel {
  id: string;
  name: string;
  /** Input price per 1M tokens */
  inputCost: number;
  /** Output price per 1M tokens */
  outputCost: number;
  /** Cache-hit price per 1M tokens */
  cacheCost: number;
}

const MODELS: Record<string, DeepSeekModel> = {
  "deepseek-v4-pro": {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    inputCost: 3.0,
    outputCost: 6.0,
    cacheCost: 0.025,
  },
  "deepseek-v4-flash": {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    inputCost: 1.0,
    outputCost: 2.0,
    cacheCost: 0.02,
  },
};

/** Build a pi-ai Model object for a DeepSeek model. */
export function getDeepSeekModel(modelId: string): Model<"openai-completions"> {
  const info = MODELS[modelId];
  if (!info) {
    const available = Object.keys(MODELS).join(", ");
    throw new Error(`Unknown DeepSeek model: "${modelId}". Available: ${available}`);
  }

  return {
    id: info.id,
    name: info.name,
    api: "openai-completions",
    provider: "deepseek",
    baseUrl: DEEPSEEK_BASE_URL,
    reasoning: true,
    input: ["text"],
    cost: {
      input: info.inputCost,
      output: info.outputCost,
      cacheRead: info.cacheCost,
      cacheWrite: 0,
    },
    contextWindow: 1_000_000,
    maxTokens: 384_000,
    compat: {
      supportsReasoningEffort: true,
      thinkingFormat: "openai",       // DeepSeek uses reasoning_effort like OpenAI
      maxTokensField: "max_completion_tokens",
      supportsUsageInStreaming: true,
    },
  } as Model<"openai-completions">;
}

/** Get DEEPSEEK_API_KEY from environment. */
export function getDeepSeekApiKey(): string | undefined {
  return process.env.DEEPSEEK_API_KEY;
}

/** List available DeepSeek model IDs. */
export function listDeepSeekModels(): string[] {
  return Object.keys(MODELS);
}

/** Check if a modelId is a DeepSeek model. */
export function isDeepSeekModel(modelId: string): boolean {
  return modelId in MODELS;
}
