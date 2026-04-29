import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { startTestServer } from "./helpers/test-server.js";
import { readSSE, fetchJSON } from "./helpers/sse-client.js";
import { SIMPLE_TEXT_SCRIPT, TOOL_CALL_SCRIPT, MULTI_CHUNK_SCRIPT } from "./helpers/mock-agent.js";
import type { TestServer } from "./helpers/test-server.js";

let server: TestServer;

beforeAll(() => {
  server = startTestServer({ script: [], delayMs: 5 });
});

afterAll(() => {
  server.stop();
});

describe("POST /chat — SSE streaming", () => {
  test("returns SSE content type", async () => {
    server.setMock({ script: SIMPLE_TEXT_SCRIPT, delayMs: 5 });
    const { response } = await readSSE(`${server.url}/chat`, { message: "hello" });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
  });

  test("SSE events have correct data: prefix format", async () => {
    server.setMock({ script: SIMPLE_TEXT_SCRIPT, delayMs: 5 });
    const { events } = await readSSE(`${server.url}/chat`, { message: "hello" });
    expect(events.length).toBeGreaterThan(0);
    for (const evt of events) {
      expect(evt.data).toBeDefined();
      expect(typeof evt.data).toBe("object");
    }
  });

  test("stream contains agent_start, text_delta, agent_end in order", async () => {
    server.setMock({ script: SIMPLE_TEXT_SCRIPT, delayMs: 5 });
    const { events } = await readSSE(`${server.url}/chat`, { message: "hello" });

    const types = events.map((e) => e.data.type);
    expect(types).toContain("agent_start");
    expect(types).toContain("agent_end");

    // agent_start before agent_end
    expect(types.indexOf("agent_start")).toBeLessThan(types.indexOf("agent_end"));

    // text_delta present between start and end
    const textDeltas = events.filter(
      (e) => e.data.type === "message_update" && e.data.eventType === "text_delta",
    );
    expect(textDeltas.length).toBeGreaterThan(0);
  });

  test("text_delta events concatenate to full response", async () => {
    server.setMock({ script: MULTI_CHUNK_SCRIPT, delayMs: 5 });
    const { events } = await readSSE(`${server.url}/chat`, { message: "hello" });

    const deltas = events
      .filter((e) => e.data.type === "message_update" && e.data.eventType === "text_delta")
      .map((e) => e.data.delta as string)
      .join("");

    expect(deltas).toBe("Part one. Part two. Part three.");
  });

  test("stream closes after agent_end", async () => {
    server.setMock({ script: SIMPLE_TEXT_SCRIPT, delayMs: 5 });
    const { events } = await readSSE(`${server.url}/chat`, { message: "hello" });

    // agent_end should be the last event
    const lastEvent = events[events.length - 1];
    expect(lastEvent?.data.type).toBe("agent_end");
  });

  test("stream includes tool execution events in order", async () => {
    server.setMock({ script: TOOL_CALL_SCRIPT, delayMs: 5 });
    const { events } = await readSSE(`${server.url}/chat`, { message: "check the file" });

    const types = events.map((e) => e.data.type);
    expect(types).toContain("tool_execution_start");
    expect(types).toContain("tool_execution_end");

    // tool_execution_start before tool_execution_end
    expect(types.indexOf("tool_execution_start")).toBeLessThan(
      types.indexOf("tool_execution_end"),
    );
  });

  test("POST /chat without message returns 400", async () => {
    const { response } = await readSSE(`${server.url}/chat`, {});
    expect(response.status).toBe(400);
  });

  test("POST /chat with invalid JSON returns 400", async () => {
    const resp = await fetch(`${server.url}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json{{{",
    });
    expect(resp.status).toBe(400);
  });
});
