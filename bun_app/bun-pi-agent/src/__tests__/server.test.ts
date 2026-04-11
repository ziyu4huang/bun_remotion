import { describe, test, expect, beforeAll } from "bun:test";
import { handleHealth } from "../server/routes/health.js";
import { handleChat } from "../server/routes/chat.js";
import {
  handlePing,
  handleAgentsList,
  handleAgentRead,
  handleRunCreate,
  handleRunRead,
  handleRunCancel,
  handleRunEvents,
} from "../server/routes/acp.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonReq(body: unknown, method = "POST", path = "/"): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function simpleInput(text: string) {
  return [
    {
      role: "user",
      parts: [{ content_type: "text/plain", content: text }],
    },
  ];
}

// ---------------------------------------------------------------------------
// /health
// ---------------------------------------------------------------------------
describe("GET /health", () => {
  test("returns ok status with timestamp", async () => {
    const res = handleHealth();
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
  });

  test("timestamp is valid ISO date", async () => {
    const res = handleHealth();
    const body = (await res.json()) as any;
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});

// ---------------------------------------------------------------------------
// /chat
// ---------------------------------------------------------------------------
describe("POST /chat", () => {
  test("returns 400 for missing message field", async () => {
    const res = await handleChat(jsonReq({}));
    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.error).toContain("message");
  });

  test("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await handleChat(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.error).toContain("JSON");
  });

  test("returns SSE stream with correct headers", async () => {
    const res = await handleChat(jsonReq({ message: "hello" }));
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");

    const reader = res.body?.getReader();
    if (reader) {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    }
  });
});

// ---------------------------------------------------------------------------
// ACP /ping
// ---------------------------------------------------------------------------
describe("GET /ping", () => {
  test("returns empty JSON object", async () => {
    const res = handlePing();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// ACP /agents
// ---------------------------------------------------------------------------
describe("GET /agents", () => {
  test("returns array with bun-pi-agent", async () => {
    const res = handleAgentsList();
    const body = (await res.json()) as any;
    expect(body.agents).toHaveLength(1);
    expect(body.agents[0].name).toBe("bun-pi-agent");
  });

  test("agent manifest has required fields", async () => {
    const res = handleAgentsList();
    const body = (await res.json()) as any;
    const agent = body.agents[0];
    expect(agent.name).toBe("bun-pi-agent");
    expect(typeof agent.description).toBe("string");
    expect(agent.description.length).toBeGreaterThan(0);
    expect(Array.isArray(agent.input_content_types)).toBe(true);
    expect(Array.isArray(agent.output_content_types)).toBe(true);
    expect(agent.metadata.framework).toBe("pi-agent");
    expect(agent.metadata.capabilities.length).toBeGreaterThan(0);
    expect(agent.metadata.domains).toContain("software-engineering");
  });
});

// ---------------------------------------------------------------------------
// ACP /agents/:name
// ---------------------------------------------------------------------------
describe("GET /agents/:name", () => {
  test("returns agent manifest for known name", async () => {
    const res = handleAgentRead("bun-pi-agent");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.name).toBe("bun-pi-agent");
  });

  test("returns 404 for unknown agent", async () => {
    const res = handleAgentRead("nonexistent-agent");
    expect(res.status).toBe(404);
    const body = (await res.json()) as any;
    expect(body.error).toContain("not found");
  });
});

// ---------------------------------------------------------------------------
// ACP /runs — uses shared run to avoid multiple API calls
// ---------------------------------------------------------------------------

describe("POST /runs — validation", () => {
  test("returns 404 for unknown agent_name", async () => {
    const res = await handleRunCreate(
      jsonReq({ agent_name: "bad-agent", input: [] }),
    );
    expect(res.status).toBe(404);
  });

  test("returns 404 for missing agent_name (undefined)", async () => {
    const res = await handleRunCreate(jsonReq({ input: [] }));
    expect(res.status).toBe(404);
  });

  test("returns 400 for empty input", async () => {
    const res = await handleRunCreate(
      jsonReq({ agent_name: "bun-pi-agent", input: [] }),
    );
    expect(res.status).toBe(400);
  });
});

describe("ACP runs — live agent", () => {
  let createdRunId: string;

  beforeAll(async () => {
    // Create a single run and reuse it for read/cancel/events tests
    const res = await handleRunCreate(
      jsonReq({
        agent_name: "bun-pi-agent",
        input: simpleInput("echo hello"),
        mode: "sync",
      }),
    );
    const run = (await res.json()) as any;
    createdRunId = run.run_id;
  });

  test("sync run has correct shape", () => {
    expect(createdRunId).toBeDefined();
  });

  test("GET /runs/:id returns run after creation", async () => {
    const res = handleRunRead(createdRunId);
    expect(res.status).toBe(200);
    const run = (await res.json()) as any;
    expect(run.run_id).toBe(createdRunId);
    expect(run.agent_name).toBe("bun-pi-agent");
    expect(["completed", "failed"]).toContain(run.status);
  });

  test("POST /runs/:id/cancel returns 409 for completed run", () => {
    const res = handleRunCancel(createdRunId);
    expect(res.status).toBe(409);
  });

  test("GET /runs/:id/events returns lifecycle events", async () => {
    const res = handleRunEvents(createdRunId);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(Array.isArray(body.events)).toBe(true);
    expect(body.events.length).toBeGreaterThanOrEqual(1);

    const types = body.events.map((e: any) => e.type);
    expect(types).toContain("run.created");
    expect(types).toContain("run.in-progress");

    const finalEvents = types.filter(
      (t: string) => t === "run.completed" || t === "run.failed",
    );
    expect(finalEvents.length).toBeGreaterThanOrEqual(1);
  });

  test("GET /runs/:id/events includes message events", async () => {
    const res = handleRunEvents(createdRunId);
    const body = (await res.json()) as any;
    const types = body.events.map((e: any) => e.type);
    expect(types).toContain("message.created");
  });

  test("GET /runs/:id for unknown ID returns 404", () => {
    const res = handleRunRead("nonexistent-id");
    expect(res.status).toBe(404);
  });

  test("POST /runs/:id/cancel for unknown ID returns 404", () => {
    const res = handleRunCancel("nonexistent-id");
    expect(res.status).toBe(404);
  });

  test("GET /runs/:id/events for unknown ID returns 404", () => {
    const res = handleRunEvents("nonexistent-id");
    expect(res.status).toBe(404);
  });

  test("stream mode returns SSE response", async () => {
    const res = await handleRunCreate(
      jsonReq({
        agent_name: "bun-pi-agent",
        input: simpleInput("hi"),
        mode: "stream",
      }),
    );
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    const reader = res.body?.getReader();
    if (reader) {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    }
  });
});
