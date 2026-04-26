import { describe, test, expect } from "bun:test";
import { app } from "../server/index";
import { getMonitoringOverview, getSeriesHealthDetail } from "../server/services/monitoring";

// ── Unit tests: monitoring service ──

describe("monitoring service", () => {
  test("getMonitoringOverview returns aggregate data", () => {
    const overview = getMonitoringOverview();
    expect(overview.totalSeries).toBeGreaterThanOrEqual(1);
    expect(overview.totalEpisodes).toBeGreaterThanOrEqual(0);
    expect(overview.totalScaffolded).toBeGreaterThanOrEqual(0);
    expect(overview.totalRendered).toBeGreaterThanOrEqual(0);
    expect(typeof overview.overallCompletionRate).toBe("number");
    expect(overview.seriesHealth.length).toBe(overview.totalSeries);
    expect(Array.isArray(overview.recentActivity)).toBe(true);
  });

  test("getMonitoringOverview series health has expected fields", () => {
    const overview = getMonitoringOverview();
    if (overview.seriesHealth.length === 0) return;

    const h = overview.seriesHealth[0];
    expect(typeof h.seriesId).toBe("string");
    expect(typeof h.name).toBe("string");
    expect(typeof h.category).toBe("string");
    expect(typeof h.episodeCount).toBe("number");
    expect(typeof h.completionRate).toBe("number");
    expect(typeof h.trend).toBe("string");
    expect(["improving", "stable", "declining", "new"]).toContain(h.trend);
  });

  test("getSeriesHealthDetail returns null for unknown series", () => {
    const result = getSeriesHealthDetail("nonexistent-series-xyz");
    expect(result).toBeNull();
  });

  test("getSeriesHealthDetail returns health for known series", () => {
    const overview = getMonitoringOverview();
    if (overview.seriesHealth.length === 0) return;

    const first = overview.seriesHealth[0];
    const detail = getSeriesHealthDetail(first.seriesId);
    expect(detail).not.toBeNull();
    expect(detail!.seriesId).toBe(first.seriesId);
    expect(detail!.gateScore).toBe(first.gateScore);
    expect(detail!.blendedScore).toBe(first.blendedScore);
  });

  test("completionRate is 0-100", () => {
    const overview = getMonitoringOverview();
    for (const h of overview.seriesHealth) {
      expect(h.completionRate).toBeGreaterThanOrEqual(0);
      expect(h.completionRate).toBeLessThanOrEqual(100);
    }
  });
});

// ── API route tests ──

describe("monitoring API", () => {
  test("GET /api/monitoring/overview returns 200", async () => {
    const res = await app.request("/api/monitoring/overview");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.totalSeries).toBeGreaterThanOrEqual(1);
    expect(body.data.seriesHealth).toBeInstanceOf(Array);
    expect(body.data.recentActivity).toBeInstanceOf(Array);
  });

  test("GET /api/monitoring/series/:seriesId returns series health", async () => {
    const overview = await app.request("/api/monitoring/overview");
    const body = await overview.json();
    if (body.data.seriesHealth.length === 0) return;

    const firstId = body.data.seriesHealth[0].seriesId;
    const res = await app.request(`/api/monitoring/series/${firstId}`);
    expect(res.status).toBe(200);
    const detail = await res.json();
    expect(detail.ok).toBe(true);
    expect(detail.data.seriesId).toBe(firstId);
  });

  test("GET /api/monitoring/series/:unknown returns 404", async () => {
    const res = await app.request("/api/monitoring/series/nonexistent-xyz");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain("not found");
  });
});
