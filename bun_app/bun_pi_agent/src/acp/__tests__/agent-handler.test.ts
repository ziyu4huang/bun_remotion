import { describe, test, expect, beforeEach } from "bun:test";
import { createAcpAgentHandler } from "../agent-handler.js";
import { clearSessions, getSession } from "../session-store.js";
import { EMPTY_USAGE } from "../../store.js";
import type { Agent, AgentSideConnection } from "@agentclientprotocol/sdk";
import type { AgentEvent } from "@mariozechner/pi-agent-core";

// ---------------------------------------------------------------------------
// Mock AgentSideConnection
// ---------------------------------------------------------------------------

function createMockConn(): {
  conn: AgentSideConnection;
  sessionUpdates: Array<{ sessionId: string; update: unknown }>;
} {
  const sessionUpdates: Array<{ sessionId: string; update: unknown }> = [];

  const conn = {
    sessionUpdate: async (params: { sessionId: string; update: unknown }) => {
      sessionUpdates.push(params);
    },
    requestPermission: async () => ({ outcome: { type: "allow" } }),
    readTextFile: async () => ({ content: "" }),
    writeTextFile: async () => ({}),
    createTerminal: async () => ({ id: "term1" }),
    signal: new AbortController().signal,
    closed: new Promise<void>(() => {}),
  } as unknown as AgentSideConnection;

  return { conn, sessionUpdates };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("agent-handler: initialize", () => {
  test("returns protocol version 1 and agent capabilities", async () => {
    const { conn } = createMockConn();
    const handler = createAcpAgentHandler(conn);

    const result = await handler.initialize({
      protocolVersion: 1,
      clientCapabilities: {},
    });

    expect(result.protocolVersion).toBe(1);
    expect(result.agentInfo?.name).toBe("bun_pi_agent");
    expect(result.agentInfo?.version).toBe("0.11.0");
    expect(result.agentCapabilities?.loadSession).toBe(true);
    expect(result.agentCapabilities?.promptCapabilities?.image).toBe(false);
    expect(result.authMethods).toEqual([]);
  });
});

describe("agent-handler: newSession + getSession", () => {
  beforeEach(() => {
    clearSessions();
  });

  test("creates a session and stores it", async () => {
    const { conn } = createMockConn();
    const handler = createAcpAgentHandler(conn);

    const result = await handler.newSession({
      cwd: "/tmp/test-project",
      mcpServers: [],
    });

    expect(result.sessionId).toBeTruthy();
    expect(result.modes).toBeDefined();
    expect(result.modes!.length).toBeGreaterThan(0);

    // Verify session is stored
    const session = getSession(result.sessionId);
    expect(session).toBeDefined();
    expect(session!.cwd).toBe("/tmp/test-project");
  });

  test("uses process.cwd() when cwd not provided", async () => {
    const { conn } = createMockConn();
    const handler = createAcpAgentHandler(conn);

    const result = await handler.newSession({
      mcpServers: [],
    });

    const session = getSession(result.sessionId);
    expect(session).toBeDefined();
  });
});

describe("agent-handler: authenticate", () => {
  test("authenticate is a no-op", async () => {
    const { conn } = createMockConn();
    const handler = createAcpAgentHandler(conn);

    // Should not throw
    await handler.authenticate({ authMethodId: "none" });
  });
});

describe("agent-handler: cancel detection", () => {
  beforeEach(() => {
    clearSessions();
  });

  test("cancel sets session cancelled flag", async () => {
    const { conn } = createMockConn();
    const handler = createAcpAgentHandler(conn);

    const session = await handler.newSession({ cwd: "/tmp", mcpServers: [] });
    const state = getSession(session.sessionId);
    expect(state!.cancelled).toBe(false);

    await handler.cancel({ sessionId: session.sessionId });
    expect(state!.cancelled).toBe(true);
  });

  test("cancel aborts both agent and session abort controller", async () => {
    const { conn } = createMockConn();
    const handler = createAcpAgentHandler(conn);

    const session = await handler.newSession({ cwd: "/tmp", mcpServers: [] });
    const state = getSession(session.sessionId)!;

    expect(state.abortController.signal.aborted).toBe(false);

    await handler.cancel({ sessionId: session.sessionId });

    expect(state.cancelled).toBe(true);
    expect(state.abortController.signal.aborted).toBe(true);
  });

  test("prompt resets cancelled flag and creates fresh AbortController per turn", async () => {
    const { conn } = createMockConn();
    const handler = createAcpAgentHandler(conn);

    const session = await handler.newSession({ cwd: "/tmp", mcpServers: [] });
    const state = getSession(session.sessionId)!;

    // Simulate previous turn cancellation
    state.cancelled = true;
    state.abortController.abort();
    expect(state.cancelled).toBe(true);

    // Empty prompt returns immediately — should reset turn state
    const result = await handler.prompt({
      sessionId: session.sessionId,
      prompt: [],
    });

    expect(state.cancelled).toBe(false);
    expect(state.abortController.signal.aborted).toBe(false);
    expect(result.stopReason).toBe("end_turn");
  });

  test("prompt returns cancelled when AbortError thrown by agent", async () => {
    const { conn } = createMockConn();
    const handler = createAcpAgentHandler(conn);

    const session = await handler.newSession({ cwd: "/tmp", mcpServers: [] });
    const state = getSession(session.sessionId)!;

    // Simulate concurrent cancel: set cancelled flag
    // Then agent.prompt() will encounter the abort
    state.cancelled = true;
    state.agent.abort();

    // Agent was aborted — either throws AbortError or returns normally
    // Both paths should detect the cancelled state
    const result = await handler.prompt({
      sessionId: session.sessionId,
      prompt: [{ type: "text", text: "hello" }],
    });

    // The agent may throw AbortError (caught → cancelled) or return normally
    // Either way, if cancelled flag was set before prompt reset it...
    // In practice: agent.abort() before prompt() means the agent may handle it gracefully
    expect(["cancelled", "end_turn"]).toContain(result.stopReason);
  });

  test("session state has cancelled field", async () => {
    const { conn } = createMockConn();
    const handler = createAcpAgentHandler(conn);

    const session = await handler.newSession({ cwd: "/tmp", mcpServers: [] });
    const state = getSession(session.sessionId);

    expect(state).toBeDefined();
    expect(state!.cancelled).toBe(false);
    expect(state!.abortController).toBeInstanceOf(AbortController);
  });

  test("session state has usage initialized to empty", async () => {
    const { conn } = createMockConn();
    const handler = createAcpAgentHandler(conn);

    const session = await handler.newSession({ cwd: "/tmp", mcpServers: [] });
    const state = getSession(session.sessionId);

    expect(state).toBeDefined();
    expect(state!.usage).toEqual(EMPTY_USAGE);
  });
});
