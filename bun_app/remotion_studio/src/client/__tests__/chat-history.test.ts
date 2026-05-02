import { describe, test, expect, beforeEach, mock } from "bun:test";
import {
  loadHistory,
  saveHistory,
  clearHistory,
  loadSessionId,
  saveSessionId,
} from "../components/ChatHistory";

// Mock localStorage
const store: Record<string, string> = {};

beforeEach(() => {
  for (const key in store) delete store[key];
});

// Minimal localStorage mock
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
};

// Replace global localStorage
(globalThis as any).localStorage = localStorageMock;

describe("ChatHistory — loadHistory / saveHistory", () => {
  test("loadHistory returns empty array when nothing stored", () => {
    expect(loadHistory("test-agent")).toEqual([]);
  });

  test("saveHistory and loadHistory roundtrip", () => {
    const msgs = [
      { role: "user" as const, content: "hello" },
      { role: "assistant" as const, content: "hi" },
    ];
    saveHistory("agent1", msgs);
    expect(loadHistory("agent1")).toEqual(msgs);
  });

  test("different agents have separate histories", () => {
    saveHistory("agent-a", [{ role: "user", content: "a" }]);
    saveHistory("agent-b", [{ role: "user", content: "b" }]);
    expect(loadHistory("agent-a")[0].content).toBe("a");
    expect(loadHistory("agent-b")[0].content).toBe("b");
  });

  test("clearHistory empties agent history", () => {
    saveHistory("agent1", [{ role: "user", content: "hello" }]);
    clearHistory("agent1");
    expect(loadHistory("agent1")).toEqual([]);
  });

  test("clearHistory does not affect other agents", () => {
    saveHistory("agent-a", [{ role: "user", content: "a" }]);
    saveHistory("agent-b", [{ role: "user", content: "b" }]);
    clearHistory("agent-a");
    expect(loadHistory("agent-a")).toEqual([]);
    expect(loadHistory("agent-b")[0].content).toBe("b");
  });

  test("saveHistory truncates to 200 messages", () => {
    const msgs = Array.from({ length: 250 }, (_, i) => ({
      role: "user" as const,
      content: `msg-${i}`,
    }));
    saveHistory("big-agent", msgs);
    const loaded = loadHistory("big-agent");
    expect(loaded).toHaveLength(200);
    expect(loaded[0].content).toBe("msg-50");
    expect(loaded[199].content).toBe("msg-249");
  });

  test("loadHistory handles corrupted JSON gracefully", () => {
    store["agent-chat-history"] = "not json{}{}";
    expect(loadHistory("agent1")).toEqual([]);
  });

  test("saveHistory handles quota exceeded gracefully", () => {
    const originalSetItem = localStorageMock.setItem;
    localStorageMock.setItem = () => { throw new Error("quota exceeded"); };
    // Should not throw
    saveHistory("agent1", [{ role: "user", content: "test" }]);
    localStorageMock.setItem = originalSetItem;
  });
});

describe("ChatHistory — loadSessionId / saveSessionId", () => {
  test("loadSessionId returns empty string when nothing stored", () => {
    expect(loadSessionId("test-agent")).toBe("");
  });

  test("saveSessionId and loadSessionId roundtrip", () => {
    saveSessionId("agent1", "session-abc-123");
    expect(loadSessionId("agent1")).toBe("session-abc-123");
  });

  test("different agents have separate session IDs", () => {
    saveSessionId("agent-a", "sess-a");
    saveSessionId("agent-b", "sess-b");
    expect(loadSessionId("agent-a")).toBe("sess-a");
    expect(loadSessionId("agent-b")).toBe("sess-b");
  });

  test("loadSessionId handles corrupted JSON gracefully", () => {
    store["agent-session-ids"] = "{bad json";
    expect(loadSessionId("agent1")).toBe("");
  });

  test("saveSessionId handles quota exceeded gracefully", () => {
    const originalSetItem = localStorageMock.setItem;
    localStorageMock.setItem = () => { throw new Error("quota exceeded"); };
    saveSessionId("agent1", "sess-123");
    localStorageMock.setItem = originalSetItem;
  });
});
