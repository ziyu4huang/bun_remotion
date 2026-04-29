import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
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

const TMP = resolve(import.meta.dir, "__tmp_regression__");

beforeEach(() => { mkdirSync(TMP, { recursive: true }); });
afterEach(() => { rmSync(TMP, { recursive: true }); });

// ─── computeDelta ───

describe("computeDelta", () => {
  test("no change → 0% delta, not regression", () => {
    const d = computeDelta(100, 100, 10);
    expect(d.deltaPct).toBe(0);
    expect(d.isRegression).toBe(false);
  });

  test("improvement → positive delta, not regression", () => {
    const d = computeDelta(80, 90, 10);
    expect(d.deltaPct).toBe(12.5);
    expect(d.isRegression).toBe(false);
  });

  test("small drop within threshold → not regression", () => {
    const d = computeDelta(100, 95, 10);
    expect(d.deltaPct).toBe(-5);
    expect(d.isRegression).toBe(false);
  });

  test("large drop exceeds threshold → regression", () => {
    const d = computeDelta(100, 85, 10);
    expect(d.deltaPct).toBe(-15);
    expect(d.isRegression).toBe(true);
  });

  test("baseline=0, current>0 → Infinity, not regression", () => {
    const d = computeDelta(0, 5, 10);
    expect(d.deltaPct).toBe(Infinity);
    expect(d.isRegression).toBe(false);
  });

  test("both zero → 0%, not regression", () => {
    const d = computeDelta(0, 0, 10);
    expect(d.deltaPct).toBe(0);
    expect(d.isRegression).toBe(false);
  });

  test("rounds deltaPct to 2 decimal places", () => {
    const d = computeDelta(3, 1, 10);
    // (1-3)/3 * 100 = -66.666... → rounded to -66.67
    expect(d.deltaPct).toBe(-66.67);
  });
});

// ─── compareGate ───

describe("compareGate", () => {
  const makeGate = (score: number, breakdown?: Record<string, number | null>, checks?: Array<{ name: string; status: string; score_impact: number }>): GateData => ({
    version: "2.1",
    timestamp: new Date().toISOString(),
    series: "test-series",
    genre: "xianxia_comedy",
    score,
    decision: "PASS",
    quality_breakdown: breakdown ?? { consistency: 100, diversity: 90 },
    checks: checks ?? [
      { name: "Trait Coverage", status: "PASS", score_impact: 5 },
      { name: "Interaction Density", status: "PASS", score_impact: 5 },
    ],
  });

  test("identical gates → no regressions", () => {
    const gate = makeGate(100);
    const deltas = compareGate(gate, gate, 10);
    const regressed = deltas.filter(d => d.isRegression);
    expect(regressed.length).toBe(0);
  });

  test("score drop > threshold → gate_score regression", () => {
    const baseline = makeGate(100);
    const current = makeGate(85);
    const deltas = compareGate(current, baseline, 10);
    const score = deltas.find(d => d.metric === "gate_score")!;
    expect(score.isRegression).toBe(true);
    expect(score.deltaPct).toBe(-15);
  });

  test("skips null breakdown dimensions", () => {
    const baseline = makeGate(100, { consistency: 100, diversity: null });
    const current = makeGate(100, { consistency: 90, diversity: null });
    const deltas = compareGate(current, baseline, 10);
    const divDelta = deltas.find(d => d.metric === "breakdown.diversity");
    expect(divDelta).toBeUndefined();
  });

  test("more FAIL checks → regression", () => {
    const baseline = makeGate(80, undefined, [
      { name: "Check A", status: "PASS", score_impact: 5 },
      { name: "Check B", status: "WARN", score_impact: -1 },
    ]);
    const current = makeGate(60, undefined, [
      { name: "Check A", status: "FAIL", score_impact: -10 },
      { name: "Check B", status: "FAIL", score_impact: -10 },
    ]);
    const deltas = compareGate(current, baseline, 10);
    const failDelta = deltas.find(d => d.metric === "checks.FAIL_count")!;
    expect(failDelta.isRegression).toBe(true);
  });

  test("PASS count drop tracked", () => {
    const baseline = makeGate(100, undefined, [
      { name: "A", status: "PASS", score_impact: 5 },
      { name: "B", status: "PASS", score_impact: 5 },
    ]);
    const current = makeGate(80, undefined, [
      { name: "A", status: "WARN", score_impact: -1 },
      { name: "B", status: "PASS", score_impact: 5 },
    ]);
    const deltas = compareGate(current, baseline, 10);
    const passDelta = deltas.find(d => d.metric === "checks.PASS_count")!;
    expect(passDelta.baseline).toBe(2);
    expect(passDelta.current).toBe(1);
  });
});

// ─── compareQuality ───

describe("compareQuality", () => {
  const makeQuality = (overall: number, dims?: Record<string, number>): QualityData => ({
    blended: { overall, decision: "GOOD" },
    ai: { overall, dimensions: dims ?? { accuracy: 8, completeness: 7, consistency: 9 } },
    programmatic: { score: overall * 100 },
  });

  test("identical quality → no regressions", () => {
    const q = makeQuality(0.85);
    const deltas = compareQuality(q, q, 10);
    expect(deltas.every(d => !d.isRegression)).toBe(true);
  });

  test("blended score drop → regression", () => {
    const baseline = makeQuality(0.9);
    const current = makeQuality(0.7);
    const deltas = compareQuality(current, baseline, 10);
    const blended = deltas.find(d => d.metric === "blended_score")!;
    expect(blended.isRegression).toBe(true);
  });

  test("skips dimensions not in baseline", () => {
    const baseline = makeQuality(0.8, { accuracy: 8 });
    const current = makeQuality(0.8, { accuracy: 8, new_dim: 5 });
    const deltas = compareQuality(current, baseline, 10);
    expect(deltas.find(d => d.metric === "ai.new_dim")).toBeUndefined();
  });

  test("AI dimension drop → regression", () => {
    const baseline = makeQuality(0.8, { accuracy: 9, completeness: 8 });
    const current = makeQuality(0.8, { accuracy: 5, completeness: 8 });
    const deltas = compareQuality(current, baseline, 10);
    const acc = deltas.find(d => d.metric === "ai.accuracy")!;
    expect(acc.isRegression).toBe(true);
  });
});

// ─── generateReport ───

describe("generateReport", () => {
  test("empty results → PASS 0, REGRESSION 0", () => {
    const report = generateReport([]);
    expect(report).toContain("0 PASS");
    expect(report).toContain("0 REGRESSION");
  });

  test("single PASS result → correct counts", () => {
    const report = generateReport([
      { series: "test", status: "PASS", deltas: [
        { metric: "gate_score", baseline: 100, current: 100, deltaPct: 0, isRegression: false },
      ]},
    ]);
    expect(report).toContain("1 PASS");
    expect(report).toContain("test");
    expect(report).toContain("gate_score");
  });

  test("REGRESSION result → shows REGRESSION status", () => {
    const report = generateReport([
      { series: "broken", status: "REGRESSION", deltas: [
        { metric: "gate_score", baseline: 100, current: 80, deltaPct: -20, isRegression: true },
      ]},
    ]);
    expect(report).toContain("1 REGRESSION");
    expect(report).toContain("REGRESSION");
  });

  test("result with no deltas → shows 'No deltas computed'", () => {
    const report = generateReport([
      { series: "empty", status: "NO_BASELINE", deltas: [] },
    ]);
    expect(report).toContain("No deltas computed");
  });
});

// ─── discoverBaselineSeries ───

describe("discoverBaselineSeries", () => {
  test("nonexistent dir → empty array", () => {
    expect(discoverBaselineSeries("/nonexistent/path")).toEqual([]);
  });

  test("finds series directories", () => {
    mkdirSync(join(TMP, "weapon-forger"));
    mkdirSync(join(TMP, "my-core-is-boss"));
    writeFileSync(join(TMP, "not-a-dir.txt"), "hello");
    const series = discoverBaselineSeries(TMP);
    expect(series.sort()).toEqual(["my-core-is-boss", "weapon-forger"]);
  });

  test("empty dir → empty array", () => {
    expect(discoverBaselineSeries(TMP)).toEqual([]);
  });
});

// ─── loadLatestBaseline ───

describe("loadLatestBaseline", () => {
  test("nonexistent series → null gate and quality", () => {
    const result = loadLatestBaseline(TMP, "nonexistent");
    expect(result.gate).toBeNull();
    expect(result.quality).toBeNull();
  });

  test("loads latest gate file by date", () => {
    mkdirSync(join(TMP, "test-series"), { recursive: true });
    const gate1: GateData = {
      version: "2.1", timestamp: "2026-04-27", series: "test", genre: "xianxia_comedy",
      score: 90, decision: "PASS", quality_breakdown: {}, checks: [],
    };
    const gate2: GateData = {
      ...gate1, score: 95, timestamp: "2026-04-29",
    };
    writeFileSync(join(TMP, "test-series", "gate-20260427.json"), JSON.stringify(gate1));
    writeFileSync(join(TMP, "test-series", "gate-20260429.json"), JSON.stringify(gate2));

    const result = loadLatestBaseline(TMP, "test-series");
    expect(result.gate!.score).toBe(95);
  });

  test("loads latest quality file", () => {
    mkdirSync(join(TMP, "test-series"), { recursive: true });
    const gate: GateData = {
      version: "2.1", timestamp: "2026-04-29", series: "test", genre: "xianxia_comedy",
      score: 100, decision: "PASS", quality_breakdown: {}, checks: [],
    };
    const quality: QualityData = {
      blended: { overall: 0.85, decision: "GOOD" },
      ai: { overall: 0.85, dimensions: { accuracy: 8 } },
      programmatic: { score: 85 },
    };
    writeFileSync(join(TMP, "test-series", "gate-20260429.json"), JSON.stringify(gate));
    writeFileSync(join(TMP, "test-series", "kg-quality-score-20260429.json"), JSON.stringify(quality));

    const result = loadLatestBaseline(TMP, "test-series");
    expect(result.quality!.blended.overall).toBe(0.85);
  });

  test("corrupt JSON → null (graceful skip)", () => {
    mkdirSync(join(TMP, "test-series"), { recursive: true });
    writeFileSync(join(TMP, "test-series", "gate-20260429.json"), "NOT VALID JSON");

    const result = loadLatestBaseline(TMP, "test-series");
    expect(result.gate).toBeNull();
  });

  test("picks latest when multiple files exist", () => {
    mkdirSync(join(TMP, "test-series"), { recursive: true });
    for (const date of ["20260425", "20260428", "20260427"]) {
      writeFileSync(join(TMP, "test-series", `gate-${date}.json`), JSON.stringify({
        version: "2.1", timestamp: date, series: "test", genre: "xianxia_comedy",
        score: parseInt(date), decision: "PASS", quality_breakdown: {}, checks: [],
      }));
    }

    const result = loadLatestBaseline(TMP, "test-series");
    expect(result.gate!.score).toBe(20260428);
  });
});

// ─── saveBaseline ───

describe("saveBaseline", () => {
  test("creates directory and writes gate file", () => {
    const gate: GateData = {
      version: "2.1", timestamp: new Date().toISOString(), series: "test", genre: "xianxia_comedy",
      score: 100, decision: "PASS", quality_breakdown: {}, checks: [],
    };
    saveBaseline(TMP, "new-series", gate);

    const seriesDir = join(TMP, "new-series");
    expect(existsSync(seriesDir)).toBe(true);
    const files = readdirSync(seriesDir).filter(f => f.startsWith("gate-"));
    expect(files.length).toBe(1);
    const written = JSON.parse(readFileSync(join(seriesDir, files[0]), "utf-8"));
    expect(written.score).toBe(100);
  });

  test("writes quality file when provided", () => {
    const gate: GateData = {
      version: "2.1", timestamp: new Date().toISOString(), series: "test", genre: "xianxia_comedy",
      score: 100, decision: "PASS", quality_breakdown: {}, checks: [],
    };
    const quality: QualityData = {
      blended: { overall: 0.9, decision: "GOOD" },
      ai: { overall: 0.9, dimensions: {} },
      programmatic: { score: 90 },
    };
    saveBaseline(TMP, "q-series", gate, quality);

    const seriesDir = join(TMP, "q-series");
    const qFiles = readdirSync(seriesDir).filter(f => f.startsWith("kg-quality-score-"));
    expect(qFiles.length).toBe(1);
  });

  test("file names contain today's date", () => {
    const gate: GateData = {
      version: "2.1", timestamp: new Date().toISOString(), series: "test", genre: "xianxia_comedy",
      score: 100, decision: "PASS", quality_breakdown: {}, checks: [],
    };
    saveBaseline(TMP, "date-series", gate);

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const files = readdirSync(join(TMP, "date-series"));
    expect(files.some(f => f.includes(today))).toBe(true);
  });
});
