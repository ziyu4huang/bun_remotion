import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { startTestServer } from "./helpers/test-server.js";
import { fetchJSON, readSSE } from "./helpers/sse-client.js";
import { SIMPLE_TEXT_SCRIPT } from "./helpers/mock-agent.js";
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

describe("Agent error during prompt", () => {
  test("sync run returns failed status", async () => {
    server.setMock({ script: [], delayMs: 5, error: new Error("mock LLM failure") });
    const { data, response } = await fetchJSON(`${server.url}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_name: "bun_pi_agent",
        input: makeInput("trigger error"),
        mode: "sync",
      }),
    });

    expect(response.status).toBe(200);
    expect(data.status).toBe("failed");
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain("mock LLM failure");
  });

  test("stream run includes run.failed event", async () => {
    server.setMock({ script: [], delayMs: 5, error: new Error("mock LLM failure") });
    const { events, response } = await readSSE(`${server.url}/runs`, {
      agent_name: "bun_pi_agent",
      input: makeInput("trigger error"),
      mode: "stream",
    });

    expect(response.status).toBe(200);
    const types = events.map((e) => e.event);
    expect(types).toContain("run.failed");
  });

  test("/chat SSE sends error event", async () => {
    server.setMock({ script: [], delayMs: 5, error: new Error("mock LLM failure") });
    const { events } = await readSSE(`${server.url}/chat`, { message: "trigger error" });

    const types = events.map((e) => e.data.type);
    expect(types).toContain("error");
  });
});

describe("Malformed input", () => {
  test("POST /runs with malformed JSON returns 400", async () => {
    const resp = await fetch(`${server.url}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json{{{",
    });
    expect(resp.status).toBe(400);
  });

  test("POST /chat with malformed JSON returns 400", async () => {
    const resp = await fetch(`${server.url}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "broken json{{{",
    });
    expect(resp.status).toBe(400);
  });
});

describe("Concurrent requests", () => {
  test("two sync runs don't corrupt state", async () => {
    server.setMock({ script: SIMPLE_TEXT_SCRIPT, delayMs: 5 });

    const [r1, r2] = await Promise.all([
      fetchJSON(`${server.url}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_name: "bun_pi_agent", input: makeInput("a"), mode: "sync" }),
      }),
      fetchJSON(`${server.url}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_name: "bun_pi_agent", input: makeInput("b"), mode: "sync" }),
      }),
    ]);

    // Both should succeed with unique run IDs
    expect(r1.data.run_id).toBeDefined();
    expect(r2.data.run_id).toBeDefined();
    expect(r1.data.run_id).not.toBe(r2.data.run_id);
  });
});

describe("Missing resources", () => {
  test("GET /runs/:id/events for unknown run returns 404", async () => {
    const { response } = await fetchJSON(`${server.url}/runs/nonexistent/events`);
    expect(response.status).toBe(404);
  });

  test("POST /runs/:id/cancel for unknown run returns 404", async () => {
    const { response } = await fetchJSON(`${server.url}/runs/nonexistent/cancel`, {
      method: "POST",
    });
    expect(response.status).toBe(404);
  });
});
