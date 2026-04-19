import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  computeDelta,
  compareGate,
  compareQuality,
  generateReport,
  discoverBaselineSeries,
  loadLatestBaseline,
  saveBaseline,
} from "../scripts/graphify-regression";
import type { GateData, QualityData } from "../scripts/graphify-regression";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";

// ─── Fixtures ───

const makeGate = (overrides: Partial<GateData> = {}): GateData => ({
  version: "2.0",
  timestamp: new Date().toISOString(),
  series: "test-series",
  genre: "xianxia_comedy",
  score: 85,
  decision: "PASS",
  quality_breakdown: {
    consistency: 0.9,
    arc_structure: null,
    pacing: 0.8,
    character_growth: 0.7,
    thematic_coherence: 1.0,
    gag_evolution: null,
  },
  checks: [
    { name: "Character Consistency: hero", status: "PASS", score_impact: 5 },
    { name: "Plot Arc", status: "PASS", score_impact: 5 },
    { name: "Pacing: ch1ep1", status: "WARN", score_impact: -5 },
    { name: "Duplicate Content", status: "FAIL", score_impact: -15 },
  ],
  ...overrides,
});

const makeQuality = (overrides: Partial<QualityData> = {}): QualityData => ({
  blended: { overall: 0.78, decision: "ACCEPT" },
  ai: {
    overall: 7.8,
    dimensions: {
      entity_accuracy: 8,
      relationship_correctness: 7,
      completeness: 8,
      cross_episode_coherence: 7,
      actionability: 9,
    },
  },
  programmatic: { score: 85 },
  ...overrides,
});

// ─── computeDelta ───

describe("computeDelta", () => {
  it("no change", () => {
    const d = computeDelta(80, 80, 10);
    expect(d.deltaPct).toBe(0);
    expect(d.isRegression).toBe(false);
  });

  it("improvement", () => {
    const d = computeDelta(80, 90, 10);
    expect(d.deltaPct).toBe(12.5);
    expect(d.isRegression).toBe(false);
  });

  it("small drop within threshold", () => {
    const d = computeDelta(80, 74, 10);
    expect(d.deltaPct).toBe(-7.5);
    expect(d.isRegression).toBe(false);
  });

  it("regression beyond threshold", () => {
    const d = computeDelta(80, 68, 10);
    expect(d.deltaPct).toBe(-15);
    expect(d.isRegression).toBe(true);
  });

  it("zero baseline with positive current", () => {
    const d = computeDelta(0, 10, 10);
    expect(d.deltaPct).toBe(Infinity);
    expect(d.isRegression).toBe(false);
  });

  it("both zero", () => {
    const d = computeDelta(0, 0, 10);
    expect(d.deltaPct).toBe(0);
    expect(d.isRegression).toBe(false);
  });
});

// ─── compareGate ───

describe("compareGate", () => {
  it("detects score regression", () => {
    const base = makeGate({ score: 85 });
    const cur = makeGate({ score: 60 });
    const deltas = compareGate(cur, base, 10);
    const scoreDelta = deltas.find(d => d.metric === "gate_score")!;
    expect(scoreDelta.isRegression).toBe(true);
    expect(scoreDelta.deltaPct).toBeLessThan(-10);
  });

  it("passes on improvement", () => {
    const base = makeGate({ score: 50 });
    const cur = makeGate({ score: 65 });
    const deltas = compareGate(cur, base, 10);
    const scoreDelta = deltas.find(d => d.metric === "gate_score")!;
    expect(scoreDelta.isRegression).toBe(false);
  });

  it("compares breakdown dimensions", () => {
    const base = makeGate();
    const cur = makeGate({
      quality_breakdown: { ...base.quality_breakdown, pacing: 0.4 },
    });
    const deltas = compareGate(cur, base, 10);
    const pacingDelta = deltas.find(d => d.metric === "breakdown.pacing")!;
    expect(pacingDelta.baseline).toBe(0.8);
    expect(pacingDelta.current).toBe(0.4);
    expect(pacingDelta.isRegression).toBe(true);
  });

  it("skips null breakdown dimensions", () => {
    const base = makeGate();
    const cur = makeGate();
    const deltas = compareGate(cur, base, 10);
    const arcDelta = deltas.find(d => d.metric === "breakdown.arc_structure");
    expect(arcDelta).toBeUndefined();
  });

  it("detects PASS count regression", () => {
    const base = makeGate();
    const cur = makeGate({
      checks: [
        { name: "A", status: "WARN", score_impact: -5 },
        { name: "B", status: "FAIL", score_impact: -15 },
      ],
    });
    const deltas = compareGate(cur, base, 10);
    const passDelta = deltas.find(d => d.metric === "checks.PASS_count")!;
    expect(passDelta.baseline).toBe(2);
    expect(passDelta.current).toBe(0);
    expect(passDelta.isRegression).toBe(true);
  });

  it("detects FAIL count increase as regression", () => {
    const base = makeGate();
    const cur = makeGate({
      checks: [
        { name: "A", status: "FAIL", score_impact: -15 },
        { name: "B", status: "FAIL", score_impact: -15 },
        { name: "C", status: "FAIL", score_impact: -15 },
      ],
    });
    const deltas = compareGate(cur, base, 10);
    const failDelta = deltas.find(d => d.metric === "checks.FAIL_count")!;
    expect(failDelta.isRegression).toBe(true);
  });
});

// ─── compareQuality ───

describe("compareQuality", () => {
  it("detects blended regression", () => {
    const base = makeQuality();
    const cur = makeQuality({ blended: { overall: 0.5, decision: "REJECT" } });
    const deltas = compareQuality(cur, base, 10);
    const blended = deltas.find(d => d.metric === "blended_score")!;
    expect(blended.isRegression).toBe(true);
  });

  it("compares AI dimensions", () => {
    const base = makeQuality();
    const cur = makeQuality({
      ai: {
        overall: 5,
        dimensions: { ...base.ai.dimensions, completeness: 3 },
      },
    });
    const deltas = compareQuality(cur, base, 10);
    const completeness = deltas.find(d => d.metric === "ai.completeness")!;
    expect(completeness.baseline).toBe(8);
    expect(completeness.current).toBe(3);
    expect(completeness.isRegression).toBe(true);
  });

  it("passes on stable metrics", () => {
    const base = makeQuality();
    const cur = makeQuality();
    const deltas = compareQuality(cur, base, 10);
    expect(deltas.every(d => !d.isRegression)).toBe(true);
  });
});

// ─── generateReport ───

describe("generateReport", () => {
  it("formats all-PASS report", () => {
    const results = [
      {
        series: "weapon-forger",
        status: "PASS" as const,
        deltas: [computeDelta(85, 90, 10)],
      },
    ];
    // Fix metric name
    results[0].deltas[0].metric = "gate_score";

    const report = generateReport(results);
    expect(report).toContain("1 PASS");
    expect(report).toContain("weapon-forger");
    expect(report).toContain("gate_score");
    // "REGRESSION" appears in header (column label), check status column instead
    expect(report).not.toContain("| REGRESSION |");
  });

  it("formats regression report", () => {
    const delta = computeDelta(85, 60, 10);
    delta.metric = "gate_score";
    const results = [
      { series: "weapon-forger", status: "REGRESSION" as const, deltas: [delta] },
    ];
    const report = generateReport(results);
    expect(report).toContain("1 REGRESSION");
    expect(report).toContain("REGRESSION");
  });

  it("handles empty deltas", () => {
    const results = [
      { series: "test", status: "NO_BASELINE" as const, deltas: [] },
    ];
    const report = generateReport(results);
    expect(report).toContain("No deltas computed");
  });
});

// ─── File I/O helpers ───

describe("baseline I/O", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "regression-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("discoverBaselineSeries lists directories", () => {
    mkdirSync(join(tmpDir, "series-a"));
    mkdirSync(join(tmpDir, "series-b"));
    writeFileSync(join(tmpDir, "file.txt"), "not a dir");
    const series = discoverBaselineSeries(tmpDir);
    expect(series.sort()).toEqual(["series-a", "series-b"]);
  });

  it("loadLatestBaseline loads most recent gate", () => {
    const seriesDir = join(tmpDir, "test-series");
    mkdirSync(seriesDir);

    const gate1 = makeGate({ score: 50 });
    writeFileSync(join(seriesDir, "gate-20260418.json"), JSON.stringify(gate1));

    const gate2 = makeGate({ score: 85 });
    writeFileSync(join(seriesDir, "gate-20260419.json"), JSON.stringify(gate2));

    const result = loadLatestBaseline(tmpDir, "test-series");
    expect(result.gate).not.toBeNull();
    expect(result.gate!.score).toBe(85);
  });

  it("loadLatestBaseline returns null when no files", () => {
    const result = loadLatestBaseline(tmpDir, "nonexistent");
    expect(result.gate).toBeNull();
    expect(result.quality).toBeNull();
  });

  it("saveBaseline writes dated files", () => {
    const gate = makeGate();
    const quality = makeQuality();
    saveBaseline(tmpDir, "new-series", gate, quality);

    const seriesDir = join(tmpDir, "new-series");
    const files = readdirSync(seriesDir);
    expect(files.some(f => f.startsWith("gate-"))).toBe(true);
    expect(files.some(f => f.startsWith("kg-quality-score-"))).toBe(true);

    // Verify content
    const gateFile = files.find(f => f.startsWith("gate-"))!;
    const loaded = JSON.parse(require("fs").readFileSync(join(seriesDir, gateFile), "utf-8"));
    expect(loaded.score).toBe(85);
  });
});
