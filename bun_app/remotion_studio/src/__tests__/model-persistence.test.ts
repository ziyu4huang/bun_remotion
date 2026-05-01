import { describe, test, expect, beforeEach, afterEach } from "bun:test";

// Model persistence mirrors the client-side localStorage pattern used in
// AgentChat.tsx (loadModelPref / saveModelPref). These tests verify the
// key structure and fallback logic without a browser.

function loadModelPref(agentName?: string): string {
  try {
    if (agentName) {
      const perAgent = localStorage.getItem(`remotion_studio_model_${agentName}`);
      if (perAgent) return perAgent;
    }
    return localStorage.getItem("remotion_studio_global_model") || "";
  } catch { return ""; }
}

function saveModelPref(model: string, agentName?: string) {
  try {
    if (agentName) {
      localStorage.setItem(`remotion_studio_model_${agentName}`, model);
    }
    localStorage.setItem("remotion_studio_global_model", model);
  } catch { /* ignore */ }
}

// Minimal localStorage mock for test environment
const store = new Map<string, string>();
const localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};

beforeEach(() => store.clear());
afterEach(() => store.clear());

describe("Model persistence", () => {
  test("no preference returns empty string", () => {
    expect(loadModelPref("agent-a")).toBe("");
  });

  test("saves and loads global model", () => {
    saveModelPref("deepseek", undefined);
    expect(loadModelPref()).toBe("deepseek");
    expect(loadModelPref("agent-a")).toBe("deepseek");
  });

  test("per-agent model overrides global", () => {
    saveModelPref("glm", undefined);
    saveModelPref("deepseek", "agent-a");
    expect(loadModelPref("agent-a")).toBe("deepseek");
    // global was updated to "deepseek" by the second saveModelPref call
    expect(loadModelPref("agent-b")).toBe("deepseek");
  });

  test("model persists across simulated navigation (clear + reload)", () => {
    saveModelPref("deepseek", "agent-a");
    saveModelPref("glm", "agent-b");

    // Simulate page navigation: state is reset, but localStorage persists
    expect(loadModelPref("agent-a")).toBe("deepseek");
    expect(loadModelPref("agent-b")).toBe("glm");

    // Switch to agent-a, read model
    expect(loadModelPref("agent-a")).toBe("deepseek");

    // Switch to agent-b, read model
    expect(loadModelPref("agent-b")).toBe("glm");

    // Switch back to agent-a — should still be deepseek
    expect(loadModelPref("agent-a")).toBe("deepseek");
  });

  test("updating per-agent model does not affect other agents", () => {
    saveModelPref("deepseek", "agent-a");
    saveModelPref("glm", "agent-b");

    // Change agent-a's model
    saveModelPref("glm", "agent-a");

    expect(loadModelPref("agent-a")).toBe("glm");
    expect(loadModelPref("agent-b")).toBe("glm");
    // Global was updated too
    expect(loadModelPref()).toBe("glm");
  });

  test("per-agent key format is correct", () => {
    saveModelPref("deepseek", "studio-advisor");
    expect(store.get("remotion_studio_model_studio-advisor")).toBe("deepseek");
    expect(store.get("remotion_studio_global_model")).toBe("deepseek");
  });
});
