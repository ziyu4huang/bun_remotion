import { describe, test, expect } from "bun:test";
import { getModel, getEnvApiKey, complete } from "@mariozechner/pi-ai";
import type { Context } from "@mariozechner/pi-ai";

const ZAI_MODELS = [
  "glm-4.5-air",
  "glm-4.7",
  "glm-5-turbo",
  "glm-5.1",
] as const;

const ZAI_BASE_URL = "https://api.z.ai/api/coding/paas/v4";

function hasApiKey(): boolean {
  return !!getEnvApiKey("zai");
}

describe("zai model registry", () => {
  for (const modelId of ZAI_MODELS) {
    test(`${modelId}: getModel resolves with correct config`, () => {
      const model = getModel("zai", modelId as any);
      expect(model).toBeDefined();
      expect(model.id).toBe(modelId);
      expect(model.api).toBe("openai-completions");
      expect(model.baseUrl).toBe(ZAI_BASE_URL);
    });
  }
});

describe("zai model live connection", () => {
  const apiKey = getEnvApiKey("zai");

  for (const modelId of ZAI_MODELS) {
    test(`${modelId}: completes a simple prompt`, async () => {
      if (!apiKey) return expect(true).toBe(true); // skip

      const model = getModel("zai", modelId as any);
      const context: Context = {
        systemPrompt: "Reply with exactly: OK",
        messages: [{ role: "user", content: "Say OK", timestamp: Date.now() }],
      };

      const response = await complete(model, context, { apiKey });

      expect(response).toBeDefined();
      expect(response.stopReason).toBe("stop");

      const text = response.content.find(b => b.type === "text");
      expect(text).toBeDefined();
      expect(text!.type).toBe("text");
      expect((text as any).text.toLowerCase()).toContain("ok");
    }, { timeout: 30_000 });
  }
});
