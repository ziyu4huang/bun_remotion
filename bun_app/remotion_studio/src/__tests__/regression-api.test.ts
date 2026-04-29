import { describe, test, expect } from "bun:test";
import { app } from "../server/index";

describe("regression API", () => {
  // ── GET /api/benchmark/regression-status ──

  test("GET /api/benchmark/regression-status returns array of series statuses", async () => {
    const res = await app.fetch(new Request("http://localhost/api/benchmark/regression-status"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);

    // weapon-forger should have a baseline
    const wf = data.data.find((s: any) => s.seriesId === "weapon-forger");
    if (wf) {
      expect(typeof wf.hasBaseline).toBe("boolean");
      expect(typeof wf.regressionStatus).toBe("string");
      expect(["OK", "REGRESSION", "NO_BASELINE", "NO_GATE"]).toContain(wf.regressionStatus);
    }
  });

  test("GET /api/benchmark/regression-status respects threshold param", async () => {
    const res = await app.fetch(new Request("http://localhost/api/benchmark/regression-status?threshold=5"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("regression status entries have required fields", async () => {
    const res = await app.fetch(new Request("http://localhost/api/benchmark/regression-status"));
    const data = await res.json();
    if (data.data.length === 0) return;

    const entry = data.data[0];
    expect(entry).toHaveProperty("seriesId");
    expect(entry).toHaveProperty("hasBaseline");
    expect(entry).toHaveProperty("baselineScore");
    expect(entry).toHaveProperty("currentScore");
    expect(entry).toHaveProperty("scoreDelta");
    expect(entry).toHaveProperty("regressionStatus");
  });

  test("shared-fixture excluded from regression status", async () => {
    const res = await app.fetch(new Request("http://localhost/api/benchmark/regression-status"));
    const data = await res.json();
    const sf = data.data.find((s: any) => s.seriesId === "shared-fixture");
    expect(sf).toBeUndefined();
  });

  // ── POST /api/benchmark/regression ──

  test("POST /api/benchmark/regression requires seriesId", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/benchmark/regression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
  });

  test("POST /api/benchmark/regression returns NO_BASELINE for series without baseline", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/benchmark/regression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesId: "nonexistent-xyz" }),
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.regressionStatus).toBe("NO_BASELINE");
  });

  // ── POST /api/benchmark/baseline/:seriesId ──

  test("POST /api/benchmark/baseline/nonexistent returns 404", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/benchmark/baseline/nonexistent-xyz", {
        method: "POST",
      }),
    );
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.ok).toBe(false);
  });

  // ── GET /api/benchmark/baselines ──

  test("GET /api/benchmark/baselines returns array", async () => {
    const res = await app.fetch(new Request("http://localhost/api/benchmark/baselines"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);

    if (data.data.length > 0) {
      const entry = data.data[0];
      expect(entry).toHaveProperty("seriesId");
      expect(entry).toHaveProperty("hasBaseline");
      expect(entry).toHaveProperty("baselineScore");
      expect(entry).toHaveProperty("currentScore");
      expect(entry).toHaveProperty("delta");
    }
  });

  // ── GET /api/quality/regression ──

  test("GET /api/quality/regression returns alerts array", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/regression"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("GET /api/quality/regression respects threshold param", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/regression?threshold=5"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});
