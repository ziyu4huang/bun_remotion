import { describe, test, expect, mock, beforeEach } from "bun:test";
import { app } from "../server/index";
import { bridge } from "../server/agent-bridge";
import type { AgentProvider } from "../server/agent-interface";

// ── Interface compliance ──

describe("AgentProvider interface compliance", () => {
  test("bridge implements AgentProvider", () => {
    const provider: AgentProvider = bridge;
    expect(typeof provider.isAvailable).toBe("function");
    expect(typeof provider.listAgents).toBe("function");
    expect(typeof provider.runTask).toBe("function");
  });

  test("isAvailable returns status object", async () => {
    const result = await bridge.isAvailable();
    expect(result).toHaveProperty("ok");
    expect(typeof result.ok).toBe("boolean");
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  test("listAgents returns AgentInfo[]", async () => {
    const status = await bridge.isAvailable();
    if (!status.ok) return; // skip if bridge unavailable
    const agents = await bridge.listAgents();
    expect(Array.isArray(agents)).toBe(true);
    if (agents.length > 0) {
      const agent = agents[0];
      expect(agent).toHaveProperty("name");
      expect(agent).toHaveProperty("description");
      expect(agent).toHaveProperty("tools");
    }
  });
});

// ── Route-level tests (no real agent needed) ──

describe("Agent API routes", () => {
  test("GET /api/agent/status returns bridge status", async () => {
    const res = await app.fetch(new Request("http://localhost/api/agent/status"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data).toHaveProperty("available");
    // available is boolean — true if API key configured, false otherwise
    expect(typeof data.data.available).toBe("boolean");
  });

  test("GET /api/agent/agents returns list or 503", async () => {
    const res = await app.fetch(new Request("http://localhost/api/agent/agents"));
    const data = await res.json();
    // Either works (200 with agents) or bridge unavailable (503)
    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      expect(data.ok).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    } else {
      expect(data.ok).toBe(false);
      expect(data.error).toContain("unavailable");
    }
  });

  test("POST /api/agent/chat requires agentName + prompt", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("agentName and prompt");
  });

  test("POST /api/agent/chat requires prompt", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentName: "test" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  test("POST /api/agent/tasks requires agentName + prompt", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/agent/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentName: "test" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  test("POST /api/agent/tasks creates job if bridge available", async () => {
    // First check if bridge is available
    const statusRes = await app.fetch(new Request("http://localhost/api/agent/status"));
    const statusData = await statusRes.json();

    const res = await app.fetch(
      new Request("http://localhost/api/agent/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentName: "pi-developer", prompt: "hello" }),
      }),
    );

    const data = await res.json();
    if (statusData.data.available) {
      expect(res.status).toBe(201);
      expect(data.ok).toBe(true);
      expect(data.data.id).toBeTruthy();
      expect(data.data.type).toBe("agent:pi-developer");
    } else {
      expect(res.status).toBe(503);
      expect(data.ok).toBe(false);
    }
  });
});
