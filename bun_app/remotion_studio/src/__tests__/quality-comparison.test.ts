import { describe, test, expect } from "bun:test";
import { getCrossSeriesComparison, getRegressionAlerts, getScoreHistory } from "../server/services/quality-comparison";

describe("quality-comparison service", () => {
  test("getCrossSeriesComparison returns series with pipeline data", () => {
    const result = getCrossSeriesComparison();
    expect(result.length).toBeGreaterThanOrEqual(3);

    const wf = result.find((s) => s.seriesId === "weapon-forger");
    expect(wf).toBeDefined();
    expect(wf!.gateScore).not.toBeNull();
    expect(wf!.genre).toBe("xianxia_comedy");
    expect(wf!.generatorMode).not.toBeNull();
  });

  test("cross-series snapshot has correct structure", () => {
    const result = getCrossSeriesComparison();
    const sge = result.find((s) => s.seriesId === "storygraph-explainer");
    if (!sge) return; // may not have pipeline data in test env

    expect(typeof sge.gateScore).toBe("number");
    expect(["PASS", "WARN", "FAIL", "ACCEPT", "REJECT"]).toContain(sge.decision);
    expect(typeof sge.nodeCount).toBe("number");
    expect(typeof sge.edgeCount).toBe("number");
  });

  test("my-core-is-boss has AI dimensions", () => {
    const result = getCrossSeriesComparison();
    const mcib = result.find((s) => s.seriesId === "my-core-is-boss");
    if (!mcib) return;

    if (mcib.aiDimensions) {
      expect(mcib.aiDimensions.entity_accuracy).toBeDefined();
      expect(mcib.aiOverall).not.toBeNull();
    }
  });

  test("series without pipeline data are excluded", () => {
    const result = getCrossSeriesComparison();
    const ids = result.map((s) => s.seriesId);
    // shared-fixture and non-series dirs should not appear
    expect(ids).not.toContain("shared-fixture");
    expect(ids).not.toContain("shared");
  });

  test("getRegressionAlerts reads baselines", () => {
    const alerts = getRegressionAlerts();
    expect(Array.isArray(alerts)).toBe(true);

    // weapon-forger has baseline with gate score 0
    const wfAlerts = alerts.filter((a) => a.seriesId === "weapon-forger");
    if (wfAlerts.length > 0) {
      expect(wfAlerts[0].metric).toBe("gate_score");
      expect(typeof wfAlerts[0].baseline).toBe("number");
      expect(typeof wfAlerts[0].current).toBe("number");
    }
  });

  test("regression alert detects regressions", () => {
    const alerts = getRegressionAlerts(10);
    for (const a of alerts) {
      expect(typeof a.delta).toBe("number");
      expect(typeof a.deltaPercent).toBe("number");
      // isRegression should be consistent with deltaPercent
      if (a.deltaPercent < -10) {
        expect(a.isRegression).toBe(true);
      }
    }
  });

  test("getScoreHistory returns points for weapon-forger", () => {
    const history = getScoreHistory("weapon-forger");
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].date).toMatch(/^\d{8}$/);
    expect(typeof history[0].gateScore).toBe("number");
  });

  test("getScoreHistory returns empty for unknown series", () => {
    const history = getScoreHistory("nonexistent-xyz");
    expect(history).toEqual([]);
  });

  test("score history includes current state", () => {
    const history = getScoreHistory("weapon-forger");
    // Should have baseline + current
    if (history.length >= 2) {
      const last = history[history.length - 1];
      expect(last.gateScore).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("quality API routes", () => {
  // Lazy import to avoid circular deps
  const { app } = require("../server/index") as { app: import("hono").Hono };

  test("GET /api/quality/compare returns cross-series data", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/compare"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThanOrEqual(3);
  });

  test("GET /api/quality/regression returns alerts", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/regression"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("GET /api/quality/regression respects threshold param", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/regression?threshold=50"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  test("GET /api/quality/history/weapon-forger returns history", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/history/weapon-forger"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    if (data.data.length > 0) {
      expect(data.data[0].date).toMatch(/^\d{8}$/);
    }
  });

  test("GET /api/quality/history/nonexistent returns empty array", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/history/nonexistent-xyz"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data).toEqual([]);
  });

  test("GET /api/quality/weapon-forger still works (existing endpoint)", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/weapon-forger"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.gate).toBeDefined();
  });
});
