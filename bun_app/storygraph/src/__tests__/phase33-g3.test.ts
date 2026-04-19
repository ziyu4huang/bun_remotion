import { describe, it, expect } from "bun:test";
import {
  computeSummary,
  generateCostReport,
  timeStep,
} from "../scripts/graphify-cost-matrix";
import type { SeriesRun } from "../scripts/graphify-cost-matrix";

// ─── Fixtures ───

const makeRun = (overrides: Partial<SeriesRun> = {}): SeriesRun => ({
  series: "test-series",
  genre: "xianxia_comedy",
  mode: "hybrid",
  episodes: 3,
  steps: [
    { step: "episode", durationMs: 1200, success: true },
    { step: "merge", durationMs: 300, success: true },
    { step: "check", durationMs: 500, success: true },
    { step: "score", durationMs: 2000, success: true },
  ],
  totalMs: 4000,
  timestamp: new Date().toISOString(),
  ...overrides,
});

// ─── computeSummary ───

describe("computeSummary", () => {
  it("computes step averages", () => {
    const runs = [
      makeRun({ steps: [{ step: "episode", durationMs: 1000, success: true }] }),
      makeRun({ steps: [{ step: "episode", durationMs: 2000, success: true }] }),
    ];

    const summary = computeSummary(runs);
    expect(summary.byStep.episode.avgMs).toBe(1500);
    expect(summary.byStep.episode.minMs).toBe(1000);
    expect(summary.byStep.episode.maxMs).toBe(2000);
    expect(summary.byStep.episode.successRate).toBe(1);
  });

  it("tracks success rate", () => {
    const runs = [
      makeRun({ steps: [{ step: "score", durationMs: 100, success: true }] }),
      makeRun({ steps: [{ step: "score", durationMs: 100, success: false, error: "timeout" }] }),
      makeRun({ steps: [{ step: "score", durationMs: 100, success: true }] }),
    ];

    const summary = computeSummary(runs);
    expect(summary.byStep.score.successRate).toBeCloseTo(0.667, 1);
  });

  it("computes series totals", () => {
    const runs = [
      makeRun({ series: "a", totalMs: 5000 }),
      makeRun({ series: "a", totalMs: 3000 }),
    ];

    const summary = computeSummary(runs);
    expect(summary.bySeries.a.avgTotalMs).toBe(4000);
    expect(summary.bySeries.a.minTotalMs).toBe(3000);
    expect(summary.bySeries.a.maxTotalMs).toBe(5000);
  });

  it("handles empty runs", () => {
    const summary = computeSummary([]);
    expect(Object.keys(summary.byStep)).toHaveLength(0);
    expect(Object.keys(summary.bySeries)).toHaveLength(0);
  });
});

// ─── generateCostReport ───

describe("generateCostReport", () => {
  it("generates report with tables", () => {
    const runs = [makeRun()];
    const report = generateCostReport(runs);

    expect(report).toContain("Cost/Latency Matrix");
    expect(report).toContain("Per-Run Detail");
    expect(report).toContain("Step Summary");
    expect(report).toContain("Series Summary");
    expect(report).toContain("test-series");
    expect(report).toContain("episode");
    expect(report).toContain("4.0s");
  });

  it("shows failed steps", () => {
    const runs = [makeRun({
      steps: [{ step: "score", durationMs: 100, success: false, error: "API timeout" }],
    })];
    const report = generateCostReport(runs);
    expect(report).toContain("FAIL");
    expect(report).toContain("API timeout");
  });

  it("handles multiple runs and series", () => {
    const runs = [
      makeRun({ series: "a", totalMs: 1000 }),
      makeRun({ series: "b", totalMs: 2000 }),
    ];
    const report = generateCostReport(runs);
    expect(report).toContain("| a |");
    expect(report).toContain("| b |");
  });
});

// ─── timeStep ───

describe("timeStep", () => {
  it("times successful execution", () => {
    const result = timeStep("test", () => {
      // No-op
    });
    expect(result.step).toBe("test");
    expect(result.success).toBe(true);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("captures failures", () => {
    const result = timeStep("fail", () => {
      throw new Error("boom");
    });
    expect(result.step).toBe("fail");
    expect(result.success).toBe(false);
    expect(result.error).toContain("boom");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
