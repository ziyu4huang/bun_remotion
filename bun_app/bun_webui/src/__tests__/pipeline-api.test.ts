import { describe, test, expect } from "bun:test";
import { app } from "../server/index";

describe("pipeline API", () => {
  test("GET /api/pipeline/status/weapon-forger returns pipeline status", async () => {
    const res = await app.fetch(new Request("http://localhost/api/pipeline/status/weapon-forger"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.hasGate).toBe(true);
    expect(data.data.hasMergedGraph).toBe(true);
  });

  test("GET /api/pipeline/status/storygraph-explainer has gate data", async () => {
    const res = await app.fetch(new Request("http://localhost/api/pipeline/status/storygraph-explainer"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.hasGate).toBe(true);
    expect(typeof data.data.gateScore).toBe("number");
  });

  test("GET /api/pipeline/status/nonexistent returns status with no data", async () => {
    const res = await app.fetch(new Request("http://localhost/api/pipeline/status/nonexistent-xyz"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.hasGate).toBe(false);
    expect(data.data.hasMergedGraph).toBe(false);
  });

  test("POST /api/pipeline/run requires seriesId", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("seriesId");
  });

  test("POST /api/pipeline/check requires seriesId", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/pipeline/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });

  test("POST /api/pipeline/score requires seriesId", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/pipeline/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("quality API", () => {
  test("GET /api/quality/weapon-forger returns gate data", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/weapon-forger"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.gate).toBeDefined();
    expect(data.data.seriesId).toBe("weapon-forger");
  });

  test("GET /api/quality/storygraph-explainer returns gate + quality score", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/storygraph-explainer"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.gate).toBeDefined();
  });

  test("GET /api/quality/nonexistent returns 404", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/nonexistent-xyz"));
    expect(res.status).toBe(404);
  });
});
