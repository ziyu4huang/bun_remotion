import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { SessionStore } from "../server/services/session-store";
import { existsSync, rmSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const TEST_DIR = resolve(import.meta.dir, "__test_session_store__");
const TEST_FILE = resolve(TEST_DIR, "agent-sessions.json");

function makeStore(): SessionStore {
  return new SessionStore(TEST_FILE);
}

beforeEach(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
});

describe("SessionStore", () => {
  test("save and load a session", async () => {
    const store = makeStore();
    const msgs = [{ role: "user" as const, content: "hello" }, { role: "assistant" as const, content: "hi" }];
    await store.save("agent1", "sess1", msgs);

    const loaded = await store.load("agent1", "sess1");
    expect(loaded).toBeDefined();
    expect(loaded!.messages).toEqual(msgs);
    expect(loaded!.agentName).toBe("agent1");
    expect(loaded!.sessionId).toBe("sess1");
  });

  test("load returns undefined for unknown session", async () => {
    const store = makeStore();
    expect(await store.load("agent1", "nonexistent")).toBeUndefined();
  });

  test("save truncates to 200 messages", async () => {
    const store = makeStore();
    const msgs = Array.from({ length: 250 }, (_, i) => ({ role: "user" as const, content: `msg ${i}` }));
    await store.save("agent1", "sess1", msgs);

    const loaded = await store.load("agent1", "sess1");
    expect(loaded!.messages.length).toBe(200);
    expect(loaded!.messages[0].content).toBe("msg 50"); // last 200
  });

  test("save updates existing session (preserves createdAt)", async () => {
    const store = makeStore();
    await store.save("agent1", "sess1", [{ role: "user", content: "first" }]);
    const first = (await store.load("agent1", "sess1"))!;
    const created = first.createdAt;

    // Small delay to ensure updatedAt differs
    const updated = await store.save("agent1", "sess1", [{ role: "user", content: "second" }]);
    expect(updated.createdAt).toBe(created);
    expect(updated.updatedAt).toBeGreaterThanOrEqual(created);
    expect(updated.messages.length).toBe(1);
    expect(updated.messages[0].content).toBe("second");
  });

  test("listSessions returns sessions sorted by updatedAt desc", async () => {
    const store = makeStore();
    await store.save("agent1", "sess1", [{ role: "user", content: "first" }]);
    await store.save("agent1", "sess2", [{ role: "user", content: "second" }]);
    await store.save("agent1", "sess3", [{ role: "user", content: "third" }]);

    const list = await store.listSessions("agent1");
    expect(list.length).toBe(3);
    expect(list[0].sessionId).toBe("sess3"); // most recent first
    expect(list[2].sessionId).toBe("sess1");
  });

  test("listSessions filters by agentName", async () => {
    const store = makeStore();
    await store.save("agent1", "s1", [{ role: "user", content: "a1" }]);
    await store.save("agent2", "s2", [{ role: "user", content: "a2" }]);

    expect((await store.listSessions("agent1")).length).toBe(1);
    expect((await store.listSessions("agent2")).length).toBe(1);
    expect((await store.listSessions("agent3")).length).toBe(0);
  });

  test("deleteSession removes a session", async () => {
    const store = makeStore();
    await store.save("agent1", "sess1", [{ role: "user", content: "hello" }]);
    expect(await store.deleteSession("agent1", "sess1")).toBe(true);
    expect(await store.load("agent1", "sess1")).toBeUndefined();
    expect(await store.deleteSession("agent1", "sess1")).toBe(false); // already deleted
  });

  test("persists to disk and survives new instance", async () => {
    const store1 = makeStore();
    await store1.save("agent1", "sess1", [{ role: "user", content: "persisted" }]);
    // Force flush to disk (bypass debounce)
    await store1.flush();

    // New store instance reading from same file
    const store2 = makeStore();
    const loaded = await store2.load("agent1", "sess1");
    expect(loaded).toBeDefined();
    expect(loaded!.messages[0].content).toBe("persisted");
  });

  test("evicts oldest sessions when exceeding max per agent", async () => {
    const store = makeStore();
    // Create 55 sessions (max is 50)
    for (let i = 0; i < 55; i++) {
      await store.save("agent1", `sess_${i}`, [{ role: "user", content: `msg ${i}` }]);
    }

    const list = await store.listSessions("agent1");
    expect(list.length).toBe(50);
    // Oldest 5 (sess_0..sess_4) should be evicted
    const ids = new Set(list.map((s) => s.sessionId));
    expect(ids.has("sess_0")).toBe(false);
    expect(ids.has("sess_4")).toBe(false);
    expect(ids.has("sess_5")).toBe(true);
    expect(ids.has("sess_54")).toBe(true);
  });

  test("listSessions returns messageCount", async () => {
    const store = makeStore();
    const msgs = [{ role: "user", content: "a" }, { role: "assistant", content: "b" }, { role: "user", content: "c" }];
    await store.save("agent1", "sess1", msgs);

    const list = await store.listSessions("agent1");
    expect(list[0].messageCount).toBe(3);
  });

  test("save stores modelOverride", async () => {
    const store = makeStore();
    await store.save("agent1", "sess1", [{ role: "user", content: "hello" }], "deepseek/deepseek-v4-pro");

    const loaded = await store.load("agent1", "sess1");
    expect(loaded!.modelOverride).toBe("deepseek/deepseek-v4-pro");
  });

  test("save without modelOverride omits the field", async () => {
    const store = makeStore();
    await store.save("agent1", "sess1", [{ role: "user", content: "hello" }]);

    const loaded = await store.load("agent1", "sess1");
    expect(loaded!.modelOverride).toBeUndefined();
  });

  test("debounced writes batch multiple saves", async () => {
    const store = makeStore();
    // Rapid-fire saves without explicit flush
    await store.save("agent1", "sess1", [{ role: "user", content: "first" }]);
    await store.save("agent1", "sess2", [{ role: "user", content: "second" }]);
    await store.save("agent1", "sess3", [{ role: "user", content: "third" }]);

    // Force flush
    await store.flush();

    // All three should be on disk
    const store2 = makeStore();
    const list = await store2.listSessions("agent1");
    expect(list.length).toBe(3);
  });
});
