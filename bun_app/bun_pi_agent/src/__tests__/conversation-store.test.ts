import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  initConversationStore,
  saveConversation,
  loadConversation,
  listConversations,
  deleteConversation,
  cleanupConversations,
  getStoreDir,
} from "../conversation-store.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;

function makeMessages(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    role: "user",
    content: [{ type: "text", text: `Message ${i}` }],
    timestamp: new Date().toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("conversation-store", () => {
  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "conv-store-test-"));
    initConversationStore(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("saveConversation creates file on disk", () => {
    saveConversation("sess-1", makeMessages(3));

    const filePath = join(tmpDir, "sess-1.json");
    expect(existsSync(filePath)).toBe(true);

    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    expect(data.sessionId).toBe("sess-1");
    expect(data.messages).toHaveLength(3);
    expect(data.createdAt).toBeDefined();
    expect(data.updatedAt).toBeDefined();
  });

  test("loadConversation returns messages from disk", () => {
    const msgs = makeMessages(5);
    saveConversation("sess-2", msgs);

    const loaded = loadConversation("sess-2");
    expect(loaded).toBeDefined();
    expect(loaded!).toHaveLength(5);
    expect(loaded![0].content[0].text).toBe("Message 0");
  });

  test("loadConversation returns undefined for missing session", () => {
    expect(loadConversation("nonexistent")).toBeUndefined();
  });

  test("saveConversation preserves createdAt on update", () => {
    saveConversation("sess-3", makeMessages(1));
    const first = JSON.parse(readFileSync(join(tmpDir, "sess-3.json"), "utf-8"));
    const createdAt = first.createdAt;

    // Small delay so updatedAt differs
    const start = Date.now();
    while (Date.now() - start < 10) {}

    saveConversation("sess-3", makeMessages(2));
    const second = JSON.parse(readFileSync(join(tmpDir, "sess-3.json"), "utf-8"));

    expect(second.createdAt).toBe(createdAt);
    expect(second.updatedAt).not.toBe(createdAt);
    expect(second.messages).toHaveLength(2);
  });

  test("saveConversation preserves agentName from previous save", () => {
    saveConversation("sess-4", makeMessages(1), { agentName: "my-agent" });
    saveConversation("sess-4", makeMessages(2)); // no agentName — should keep previous

    const data = JSON.parse(readFileSync(join(tmpDir, "sess-4.json"), "utf-8"));
    expect(data.agentName).toBe("my-agent");
  });

  test("deleteConversation removes file", () => {
    saveConversation("sess-5", makeMessages(1));
    expect(existsSync(join(tmpDir, "sess-5.json"))).toBe(true);

    expect(deleteConversation("sess-5")).toBe(true);
    expect(existsSync(join(tmpDir, "sess-5.json"))).toBe(false);
  });

  test("deleteConversation returns false for missing file", () => {
    expect(deleteConversation("nope")).toBe(false);
  });

  test("listConversations returns metadata for all conversations", () => {
    saveConversation("sess-a", makeMessages(1), { agentName: "agent-a" });
    saveConversation("sess-b", makeMessages(2), { agentName: "agent-b" });

    const list = listConversations();
    expect(list).toHaveLength(2);
    const ids = list.map((c) => c.sessionId);
    expect(ids).toContain("sess-a");
    expect(ids).toContain("sess-b");
    const a = list.find((c) => c.sessionId === "sess-a")!;
    const b = list.find((c) => c.sessionId === "sess-b")!;
    expect(a.agentName).toBe("agent-a");
    expect(a.messageCount).toBe(1);
    expect(b.agentName).toBe("agent-b");
    expect(b.messageCount).toBe(2);
  });

  test("listConversations returns empty when no files", () => {
    expect(listConversations()).toHaveLength(0);
  });

  test("cleanupConversations removes by age", () => {
    initConversationStore(tmpDir, { maxAge: 0, maxCount: 999 });
    saveConversation("old", makeMessages(1));

    // File just saved, but maxAge=0 means everything is expired
    const { removed } = cleanupConversations();
    expect(removed).toBe(1);
    expect(listConversations()).toHaveLength(0);
  });

  test("cleanupConversations removes by count", () => {
    initConversationStore(tmpDir, { maxAge: 999999, maxCount: 2 });
    saveConversation("sess-1", makeMessages(1));
    saveConversation("sess-2", makeMessages(1));
    saveConversation("sess-3", makeMessages(1));

    const { removed } = cleanupConversations();
    expect(removed).toBe(1);
    expect(listConversations()).toHaveLength(2);
  });

  test("getStoreDir returns initialized directory", () => {
    expect(getStoreDir()).toBe(tmpDir);
  });
});
