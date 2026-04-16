import { describe, test, expect, beforeEach } from "bun:test";
import {
  createSession,
  getSession,
  deleteSession,
  listSessions,
  clearSessions,
} from "../session-store.js";

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
});
