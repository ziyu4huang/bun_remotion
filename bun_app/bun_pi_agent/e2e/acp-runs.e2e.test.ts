import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { startTestServer } from "./helpers/test-server.js";
import { fetchJSON, readSSE } from "./helpers/sse-client.js";
import { SIMPLE_TEXT_SCRIPT, TOOL_CALL_SCRIPT } from "./helpers/mock-agent.js";
import type { TestServer } from "./helpers/test-server.js";

let server: TestServer;

function makeInput(text: string) {
  return [{ role: "user" as const, parts: [{ content_type: "text/plain" as const, content: text }] }];
}

beforeAll(() => {
  server = startTestServer({ script: [], delayMs: 5 });
});

afterAll(() => {
  server.stop();
});

describe("POST /runs — sync mode", () => {
  test("returns completed run with correct shape", async () => {
    server.setMock({ script: SIMPLE_TEXT_SCRIPT, delayMs: 5 });
    const { data, response } = await fetchJSON(`${server.url}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_name: "bun_pi_agent",
        input: makeInput("hello"),
        mode: "sync",
      }),
    });

    expect(response.status).toBe(200);
    expect(data.run_id).toBeDefined();
    expect(data.agent_name).toBe("bun_pi_agent");
    expect(data.status).toBe("completed");
    expect(data.created_at).toBeDefined();
    expect(data.finished_at).toBeDefined();
  });

  test("run has output message", async () => {
    server.setMock({ script: SIMPLE_TEXT_SCRIPT, delayMs: 5 });
    const { data } = await fetchJSON(`${server.url}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_name: "bun_pi_agent",
        input: makeInput("hello"),
        mode: "sync",
      }),
    });

    expect(data.output).toBeDefined();
    expect(Array.isArray(data.output)).toBe(true);
    expect(data.output.length).toBeGreaterThan(0);
    expect(data.output[0].role).toBe("agent");
  });
});

describe("GET /runs/:id", () => {
  test("returns run state after creation", async () => {
    server.setMock({ script: SIMPLE_TEXT_SCRIPT, delayMs: 5 });
    const { data: created } = await fetchJSON(`${server.url}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_name: "bun_pi_agent",
        input: makeInput("test"),
        mode: "sync",
      }),
    });

    const runId = created.run_id;
    const { data: read, response } = await fetchJSON(`${server.url}/runs/${runId}`);

    expect(response.status).toBe(200);
    expect(read.run_id).toBe(runId);
    expect(read.status).toBe("completed");
    expect(read.usage).toBeDefined();
  });
});

describe("GET /runs/:id/events", () => {
  test("returns lifecycle events in order", async () => {
    server.setMock({ script: SIMPLE_TEXT_SCRIPT, delayMs: 5 });
    const { data: created } = await fetchJSON(`${server.url}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_name: "bun_pi_agent",
        input: makeInput("test"),
        mode: "sync",
      }),
    });

    const { data, response } = await fetchJSON(`${server.url}/runs/${created.run_id}/events`);
    expect(response.status).toBe(200);

    const types = data.events.map((e: any) => e.type);
    expect(types).toContain("run.created");
    expect(types).toContain("run.in-progress");
    expect(types).toContain("run.completed");

    // Ordering: created → in-progress → completed
    expect(types.indexOf("run.created")).toBeLessThan(types.indexOf("run.in-progress"));
    expect(types.indexOf("run.in-progress")).toBeLessThan(types.indexOf("run.completed"));
  });

  test("events include message.created and message.part", async () => {
    server.setMock({ script: SIMPLE_TEXT_SCRIPT, delayMs: 5 });
    const { data: created } = await fetchJSON(`${server.url}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_name: "bun_pi_agent",
        input: makeInput("test"),
        mode: "sync",
      }),
    });

    const { data } = await fetchJSON(`${server.url}/runs/${created.run_id}/events`);
    const types = data.events.map((e: any) => e.type);
    expect(types).toContain("message.created");
    expect(types).toContain("message.part");
    expect(types).toContain("message.completed");
  });
});

describe("POST /runs — stream mode", () => {
  test("returns SSE with run lifecycle events", async () => {
    server.setMock({ script: SIMPLE_TEXT_SCRIPT, delayMs: 5 });
    const { events, response } = await readSSE(`${server.url}/runs`, {
      agent_name: "bun_pi_agent",
      input: makeInput("stream test"),
      mode: "stream",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");

    const types = events.map((e) => e.event);
    expect(types).toContain("run.created");
    expect(types).toContain("run.completed");
  });
});

describe("POST /runs/:id/cancel", () => {
  test("cancel completed run returns 409", async () => {
    server.setMock({ script: SIMPLE_TEXT_SCRIPT, delayMs: 5 });
    const { data: created } = await fetchJSON(`${server.url}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_name: "bun_pi_agent",
        input: makeInput("test"),
        mode: "sync",
      }),
    });

    const { response } = await fetchJSON(`${server.url}/runs/${created.run_id}/cancel`, {
      method: "POST",
    });
    expect(response.status).toBe(409);
  });
});

describe("POST /runs — validation", () => {
  test("unknown agent returns 404", async () => {
    const { response } = await fetchJSON(`${server.url}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_name: "nonexistent",
        input: makeInput("test"),
        mode: "sync",
      }),
    });
    expect(response.status).toBe(404);
  });

  test("empty input returns 400", async () => {
    const { response } = await fetchJSON(`${server.url}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_name: "bun_pi_agent",
        input: [],
        mode: "sync",
      }),
    });
    expect(response.status).toBe(400);
  });

  test("missing run returns 404 on read", async () => {
    const { response } = await fetchJSON(`${server.url}/runs/nonexistent-id`);
    expect(response.status).toBe(404);
  });
});
