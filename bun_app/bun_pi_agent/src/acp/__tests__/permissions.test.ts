import { describe, test, expect, beforeEach } from "bun:test";
import { requiresPermission, clearPermissionCache, createPermissionHook } from "../permissions.js";
import type { BeforeToolCallContext } from "@mariozechner/pi-agent-core";

// ---------------------------------------------------------------------------
// Mock ACP connection for testing permission flow
// ---------------------------------------------------------------------------

function mockConn(responses: Array<{ outcome: { outcome: string; optionId?: string } }>) {
  let callIndex = 0;
  return {
    requestPermission: async (params: any) => {
      const resp = responses[callIndex++] ?? { outcome: { outcome: "cancelled" } };
      return resp;
    },
  } as any;
}

function mockContext(toolName: string, args: Record<string, unknown>): BeforeToolCallContext {
  return {
    assistantMessage: { role: "assistant", content: [] } as any,
    toolCall: { type: "toolCall", toolName, toolCallId: "tc-1" } as any,
    args,
    context: { systemPrompt: "", messages: [], tools: [] } as any,
  };
}

describe("requiresPermission", () => {
  test("Write requires permission", () => {
    expect(requiresPermission("Write")).toBe(true);
  });

  test("Edit requires permission", () => {
    expect(requiresPermission("Edit")).toBe(true);
  });

  test("Bash requires permission", () => {
    expect(requiresPermission("Bash")).toBe(true);
  });

  test("Read does not require permission", () => {
    expect(requiresPermission("Read")).toBe(false);
  });

  test("Grep does not require permission", () => {
    expect(requiresPermission("Grep")).toBe(false);
  });

  test("unknown tool does not require permission", () => {
    expect(requiresPermission("mcp_server_tool")).toBe(false);
  });
});

describe("createPermissionHook", () => {
  beforeEach(() => {
    clearPermissionCache();
  });

  test("passthrough for non-permission tools", async () => {
    const hook = createPermissionHook("sess-1", mockConn([]));
    const result = await hook(mockContext("Read", { file_path: "/tmp/test.txt" }));
    expect(result).toBeUndefined();
  });

  test("allows tool on allow_once response", async () => {
    const conn = mockConn([{ outcome: { outcome: "selected", optionId: "allow_once" } }]);
    const hook = createPermissionHook("sess-1", conn);
    const result = await hook(mockContext("Write", { file_path: "/tmp/test.txt", content: "hello" }));
    expect(result).toBeUndefined();
  });

  test("blocks tool on reject_once response", async () => {
    const conn = mockConn([{ outcome: { outcome: "selected", optionId: "reject_once" } }]);
    const hook = createPermissionHook("sess-1", conn);
    const result = await hook(mockContext("Bash", { command: "rm -rf /" }));
    expect(result?.block).toBe(true);
    expect(result?.reason).toContain("rejected");
  });

  test("caches allow_always — subsequent calls skip permission request", async () => {
    // First call: allow_always
    const conn = mockConn([{ outcome: { outcome: "selected", optionId: "allow_always" } }]);
    const hook = createPermissionHook("sess-1", conn);

    const result1 = await hook(mockContext("Write", { file_path: "/tmp/a.txt" }));
    expect(result1).toBeUndefined();

    // Second call: should skip permission request (no more responses configured)
    const result2 = await hook(mockContext("Write", { file_path: "/tmp/b.txt" }));
    expect(result2).toBeUndefined();
  });

  test("caches reject_always — subsequent calls are blocked", async () => {
    const conn = mockConn([{ outcome: { outcome: "selected", optionId: "reject_always" } }]);
    const hook = createPermissionHook("sess-1", conn);

    const result1 = await hook(mockContext("Bash", { command: "ls" }));
    expect(result1?.block).toBe(true);

    // Second call: blocked from cache, no permission request
    const result2 = await hook(mockContext("Bash", { command: "pwd" }));
    expect(result2?.block).toBe(true);
    expect(result2?.reason).toContain("permanently rejected");
  });

  test("blocks on cancelled outcome", async () => {
    const conn = mockConn([{ outcome: { outcome: "cancelled" } }]);
    const hook = createPermissionHook("sess-1", conn);
    const result = await hook(mockContext("Edit", { file_path: "/tmp/test.txt" }));
    expect(result?.block).toBe(true);
    expect(result?.reason).toContain("cancelled");
  });

  test("blocks on permission request failure", async () => {
    const conn = {
      requestPermission: async () => { throw new Error("Connection lost"); },
    } as any;
    const hook = createPermissionHook("sess-1", conn);
    const result = await hook(mockContext("Write", { file_path: "/tmp/test.txt" }));
    expect(result?.block).toBe(true);
    expect(result?.reason).toContain("Connection lost");
  });

  test("different sessions have independent caches", async () => {
    const conn1 = mockConn([{ outcome: { outcome: "selected", optionId: "allow_always" } }]);
    const hook1 = createPermissionHook("sess-1", conn1);
    await hook1(mockContext("Write", { file_path: "/tmp/a.txt" }));

    // sess-2 should still need permission
    const conn2 = mockConn([{ outcome: { outcome: "selected", optionId: "reject_once" } }]);
    const hook2 = createPermissionHook("sess-2", conn2);
    const result = await hook2(mockContext("Write", { file_path: "/tmp/b.txt" }));
    expect(result?.block).toBe(true);
  });
});
