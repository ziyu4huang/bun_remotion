import { describe, test, expect, beforeEach } from "bun:test";

// Pure logic functions — no JSX dependency
const PROVIDER_ENV_VARS: Record<string, string> = {
  glm: "Z_AI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  google: "GOOGLE_API_KEY",
};

function providerFromModel(model: string): string | null {
  if (model.startsWith("zai/")) return "glm";
  if (model.startsWith("deepseek/")) return "deepseek";
  if (model.startsWith("google/")) return "google";
  return null;
}

function getProviderEnvVar(provider: string): string {
  return PROVIDER_ENV_VARS[provider];
}

const STORAGE_KEYS: Record<string, string> = {
  glm: "remotion_studio_key_glm",
  deepseek: "remotion_studio_key_deepseek",
  google: "remotion_studio_key_google",
};

function saveApiKey(key: string, provider: string) {
  const sk = STORAGE_KEYS[provider];
  if (!sk) return;
  if (key) localStorage.setItem(sk, key);
  else localStorage.removeItem(sk);
}

function loadApiKeyForProvider(provider: string): string {
  const sk = STORAGE_KEYS[provider];
  if (!sk) return "";
  try { return localStorage.getItem(sk) || ""; } catch { return ""; }
}

// Clean up between tests
beforeEach(() => {
  for (const k of Object.values(STORAGE_KEYS)) {
    try { localStorage.removeItem(k); } catch { /* noop */ }
  }
  try { localStorage.removeItem("remotion_studio_api_key"); } catch { /* noop */ }
  try { localStorage.removeItem("remotion_studio_global_model"); } catch { /* noop */ }
});

describe("providerFromModel", () => {
  test("maps zai/ prefix to glm", () => {
    expect(providerFromModel("zai/glm-5-turbo")).toBe("glm");
    expect(providerFromModel("zai/glm-4.7")).toBe("glm");
    expect(providerFromModel("zai/glm-4.5-air")).toBe("glm");
  });

  test("maps deepseek/ prefix to deepseek", () => {
    expect(providerFromModel("deepseek/deepseek-v4-pro")).toBe("deepseek");
    expect(providerFromModel("deepseek/deepseek-v4-flash")).toBe("deepseek");
  });

  test("maps google/ prefix to google", () => {
    expect(providerFromModel("google/gemini-2.5-pro")).toBe("google");
  });

  test("returns null for unknown or empty model", () => {
    expect(providerFromModel("")).toBeNull();
    expect(providerFromModel("unknown-model")).toBeNull();
  });
});

describe("getProviderEnvVar", () => {
  test("maps each provider to correct env var", () => {
    expect(getProviderEnvVar("glm")).toBe("Z_AI_API_KEY");
    expect(getProviderEnvVar("deepseek")).toBe("DEEPSEEK_API_KEY");
    expect(getProviderEnvVar("google")).toBe("GOOGLE_API_KEY");
  });
});

describe("per-provider key storage", () => {
  test("save and load key for specific provider", () => {
    saveApiKey("test-glm-key", "glm");
    expect(loadApiKeyForProvider("glm")).toBe("test-glm-key");
    expect(loadApiKeyForProvider("deepseek")).toBe("");
  });

  test("save and load for each provider independently", () => {
    saveApiKey("key-glm", "glm");
    saveApiKey("key-ds", "deepseek");
    saveApiKey("key-google", "google");

    expect(loadApiKeyForProvider("glm")).toBe("key-glm");
    expect(loadApiKeyForProvider("deepseek")).toBe("key-ds");
    expect(loadApiKeyForProvider("google")).toBe("key-google");
  });

  test("clear key by saving empty string", () => {
    saveApiKey("temp-key", "glm");
    expect(loadApiKeyForProvider("glm")).toBe("temp-key");

    saveApiKey("", "glm");
    expect(loadApiKeyForProvider("glm")).toBe("");
  });

  test("auto-detect provider from model for key lookup", () => {
    saveApiKey("ds-key-123", "deepseek");
    const model = "deepseek/deepseek-v4-pro";
    const provider = providerFromModel(model);
    const key = provider ? loadApiKeyForProvider(provider) : "";

    expect(provider).toBe("deepseek");
    expect(key).toBe("ds-key-123");
  });

  test("defaults to glm when no model set", () => {
    saveApiKey("glm-default", "glm");
    const provider = providerFromModel("") || "glm";
    expect(loadApiKeyForProvider(provider)).toBe("glm-default");
  });

  test("migration: old single key moves to glm slot", () => {
    localStorage.setItem("remotion_studio_api_key", "old-key-value");

    // Simulate migration: copy to glm if glm slot empty, then remove old
    const old = localStorage.getItem("remotion_studio_api_key");
    if (old && !localStorage.getItem(STORAGE_KEYS.glm)) {
      localStorage.setItem(STORAGE_KEYS.glm, old);
    }
    localStorage.removeItem("remotion_studio_api_key");

    expect(loadApiKeyForProvider("glm")).toBe("old-key-value");
    expect(localStorage.getItem("remotion_studio_api_key")).toBeNull();
  });

  test("migration: does not overwrite existing glm key", () => {
    localStorage.setItem("remotion_studio_api_key", "old-key");
    localStorage.setItem(STORAGE_KEYS.glm, "new-key");

    const old = localStorage.getItem("remotion_studio_api_key");
    if (old && !localStorage.getItem(STORAGE_KEYS.glm)) {
      localStorage.setItem(STORAGE_KEYS.glm, old);
    }
    localStorage.removeItem("remotion_studio_api_key");

    expect(loadApiKeyForProvider("glm")).toBe("new-key");
  });
});
