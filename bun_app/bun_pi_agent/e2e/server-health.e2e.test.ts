import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { startTestServer } from "./helpers/test-server.js";
import { fetchJSON } from "./helpers/sse-client.js";
import type { TestServer } from "./helpers/test-server.js";

let server: TestServer;

beforeAll(() => {
  server = startTestServer({ script: [], delayMs: 5 });
});

afterAll(() => {
  server.stop();
});

describe("GET /health", () => {
  test("returns 200 with ok status", async () => {
    const { data, response } = await fetchJSON(`${server.url}/health`);
    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
  });

  test("has valid ISO timestamp", async () => {
    const { data } = await fetchJSON(`${server.url}/health`);
    const ts = new Date(data.timestamp as string);
    expect(ts.getTime()).not.toBeNaN();
    expect(ts.getFullYear()).toBeGreaterThanOrEqual(2025);
  });
});

describe("GET /ping", () => {
  test("returns empty JSON object", async () => {
    const { data, response } = await fetchJSON(`${server.url}/ping`);
    expect(response.status).toBe(200);
    expect(data).toEqual({});
  });
});

describe("GET /agents", () => {
  test("returns array with bun_pi_agent", async () => {
    const { data, response } = await fetchJSON(`${server.url}/agents`);
    expect(response.status).toBe(200);
    expect(data.agents).toBeDefined();
    expect(Array.isArray(data.agents)).toBe(true);
    expect(data.agents.length).toBeGreaterThanOrEqual(1);
    expect(data.agents[0].name).toBe("bun_pi_agent");
  });

  test("GET /agents/bun_pi_agent returns full manifest", async () => {
    const { data, response } = await fetchJSON(`${server.url}/agents/bun_pi_agent`);
    expect(response.status).toBe(200);
    expect(data.name).toBe("bun_pi_agent");
    expect(data.description).toBeDefined();
    expect(data.input_content_types).toContain("text/plain");
  });

  test("GET /agents/nonexistent returns 404", async () => {
    const { response } = await fetchJSON(`${server.url}/agents/nonexistent`);
    expect(response.status).toBe(404);
  });
});

describe("CORS", () => {
  test("OPTIONS * returns CORS headers", async () => {
    const resp = await fetch(server.url + "/health", { method: "OPTIONS" });
    expect(resp.status).toBe(204);
    expect(resp.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("404", () => {
  test("GET /unknown-path returns 404", async () => {
    const { response } = await fetchJSON(`${server.url}/unknown-path`);
    expect(response.status).toBe(404);
  });
});
