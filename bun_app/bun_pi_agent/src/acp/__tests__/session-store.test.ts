import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  createSession,
  getSession,
  deleteSession,
  listSessions,
  clearSessions,
  saveSessionConversation,
  accumulateSessionUsage,
  initSessionStore,
} from "../session-store.js";
import {
  saveConversation,
  loadConversation,
} from "../../conversation-store.js";
import { EMPTY_USAGE } from "../../store.js";

// Note: createSession calls createAgent() which requires env vars.
// We mock the module or test with real env. For unit tests we test the
// store logic. createAgent requires ZAI_API_KEY or similar — skip if not set.

const hasApiKey = !!process.env.ZAI_API_KEY || !!process.env.Z_AI_API_KEY;

describe("session-store", () => {
  beforeEach(() => {
    clearSessions();
  });

  // Only run tests that call createSession if API key is available
  const describeIfApiKey = hasApiKey ? describe : describe.skip;

  describeIfApiKey("createSession + getSession", () => {
    test("creates a session with unique ID", () => {
      const s1 = createSession("/tmp");
      const s2 = createSession("/tmp");
      expect(s1.sessionId).not.toBe(s2.sessionId);
      expect(s1.cwd).toBe("/tmp");
      expect(s2.cwd).toBe("/tmp");
    });

    test("getSession returns created session", () => {
      const created = createSession("/home/user/project");
      const found = getSession(created.sessionId);
      expect(found).toBeDefined();
      expect(found!.sessionId).toBe(created.sessionId);
      expect(found!.cwd).toBe("/home/user/project");
    });

    test("getSession returns undefined for unknown ID", () => {
      expect(getSession("nonexistent")).toBeUndefined();
    });
  });

  describeIfApiKey("deleteSession", () => {
    test("deletes a session", () => {
      const s = createSession("/tmp");
      expect(deleteSession(s.sessionId)).toBe(true);
      expect(getSession(s.sessionId)).toBeUndefined();
    });

    test("returns false for unknown ID", () => {
      expect(deleteSession("nonexistent")).toBe(false);
    });
  });

  describeIfApiKey("listSessions", () => {
    test("lists all sessions", () => {
      const s1 = createSession("/tmp/a");
      const s2 = createSession("/tmp/b");
      const list = listSessions();
      expect(list).toHaveLength(2);
      const ids = list.map((s) => s.sessionId);
      expect(ids).toContain(s1.sessionId);
      expect(ids).toContain(s2.sessionId);
    });

    test("returns empty when no sessions", () => {
      expect(listSessions()).toHaveLength(0);
    });
  });

  describe("clearSessions", () => {
    test("clears all sessions (no API key needed)", () => {
      clearSessions();
      expect(listSessions()).toHaveLength(0);
    });
  });

  describeIfApiKey("conversation persistence", () => {
    let convDir: string;

    beforeEach(() => {
      clearSessions();
      convDir = mkdtempSync(join(tmpdir(), "conv-test-"));
      initSessionStore(convDir);
    });

    afterEach(() => {
      rmSync(convDir, { recursive: true, force: true });
    });

    test("saveSessionConversation persists agent messages", () => {
      const s = createSession("/tmp");
      saveSessionConversation(s.sessionId);

      const loaded = loadConversation(s.sessionId);
      expect(loaded).toBeDefined();
      // Fresh agent — messages array exists (may be empty or have system prompt)
      expect(Array.isArray(loaded)).toBe(true);
    });

    test("createSession with resumeFromId loads previous messages", () => {
      const original = createSession("/tmp/orig");

      // Simulate conversation: manually set messages and save
      const msgs = [
        { role: "user", content: [{ type: "text", text: "Hello" }], timestamp: new Date().toISOString() },
        { role: "assistant", content: [{ type: "text", text: "Hi there!" }], timestamp: new Date().toISOString() },
      ];
      original.agent.state.messages = msgs;
      saveSessionConversation(original.sessionId);

      // Resume into a new session
      clearSessions();
      const resumed = createSession("/tmp/resumed", {
        resumeFromId: original.sessionId,
      });

      expect(resumed.sessionId).toBe(original.sessionId);
      expect(resumed.agent.state.messages).toHaveLength(2);
      expect((resumed.agent.state.messages[0] as any).content[0].text).toBe("Hello");
    });

    test("createSession with invalid resumeFromId creates fresh session", () => {
      const s = createSession("/tmp", { resumeFromId: "nonexistent-id" });
      expect(s.sessionId).toBe("nonexistent-id");
      // Fresh agent — messages should be empty
      expect(s.agent.state.messages).toHaveLength(0);
    });

    test("accumulateSessionUsage accumulates turn_end events", () => {
      const s = createSession("/tmp");
      expect(s.usage).toEqual(EMPTY_USAGE);

      accumulateSessionUsage(s.sessionId, {
        type: "turn_end",
        message: {
          usage: {
            input: 100, output: 50, cacheRead: 10, cacheWrite: 5,
            totalTokens: 165, cost: { total: 0.01 },
          },
        },
      });

      expect(s.usage.inputTokens).toBe(100);
      expect(s.usage.outputTokens).toBe(50);
      expect(s.usage.totalTokens).toBe(165);
      expect(s.usage.estimatedCost).toBe(0.01);

      // Second event accumulates
      accumulateSessionUsage(s.sessionId, {
        type: "turn_end",
        message: {
          usage: {
            input: 200, output: 100, cacheRead: 20, cacheWrite: 10,
            totalTokens: 330, cost: { total: 0.02 },
          },
        },
      });

      expect(s.usage.inputTokens).toBe(300);
      expect(s.usage.totalTokens).toBe(495);
      expect(s.usage.estimatedCost).toBe(0.03);
    });

    test("accumulateSessionUsage ignores non-turn_end events", () => {
      const s = createSession("/tmp");
      accumulateSessionUsage(s.sessionId, { type: "text_delta", text: "hello" });
      accumulateSessionUsage(s.sessionId, { type: "agent_end" });
      expect(s.usage).toEqual(EMPTY_USAGE);
    });

    test("accumulateSessionUsage is no-op for unknown session", () => {
      // Should not throw
      accumulateSessionUsage("nonexistent", { type: "turn_end", message: { usage: { input: 1 } } });
    });
  });
});
