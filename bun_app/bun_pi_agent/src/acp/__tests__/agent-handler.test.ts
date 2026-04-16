import { describe, test, expect, beforeEach } from "bun:test";
import { createAcpAgentHandler } from "../agent-handler.js";
import { clearSessions, getSession } from "../session-store.js";
import type { Agent, AgentSideConnection } from "@agentclientprotocol/sdk";

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
    expect(result.agentInfo?.version).toBe("0.5.0");
    expect(result.agentCapabilities?.loadSession).toBe(false);
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
