import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { computeTrend } from "../scripts/graphify-regression";

const TMP = resolve(import.meta.dir, "__tmp_trend__");
const TMP_CORPUS = join(TMP, "corpus");
const TMP_PROJ = join(TMP, "proj");

beforeEach(() => {
  mkdirSync(TMP_CORPUS, { recursive: true });
  mkdirSync(TMP_PROJ, { recursive: true });
});
afterEach(() => { rmSync(TMP, { recursive: true }); });

const writeGate = (series: string, date: string, score: number) => {
  const dir = join(TMP_CORPUS, series);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `gate-${date}.json`), JSON.stringify({
    version: "2.1", timestamp: `${date}T00:00:00Z`, series, genre: "xianxia_comedy",
    score, decision: "PASS", quality_breakdown: {}, checks: [],
  }));
};

const writeQuality = (series: string, date: string, overall: number) => {
  const dir = join(TMP_CORPUS, series);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `kg-quality-score-${date}.json`), JSON.stringify({
    blended: { overall, decision: "GOOD" },
    ai: { overall, dimensions: {} },
    programmatic: { score: overall * 100 },
  }));
};

const writeMergedGraph = (series: string, nodeCount: number) => {
  const dir = join(TMP_PROJ, series, "storygraph_out");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "merged-graph.json"), JSON.stringify({
    nodes: Array(nodeCount).fill({ id: "n" }),
  }));
};

describe("computeTrend", () => {
  test("returns null for nonexistent series", () => {
    expect(computeTrend(TMP_CORPUS, "no-such-series", TMP_PROJ)).toBeNull();
  });

  test("returns null for empty series dir", () => {
    mkdirSync(join(TMP_CORPUS, "empty-series"));
    expect(computeTrend(TMP_CORPUS, "empty-series", TMP_PROJ)).toBeNull();
  });

  test("single snapshot → stable trend, avg_delta=0", () => {
    writeGate("test-series", "20260429", 100);
    const trend = computeTrend(TMP_CORPUS, "test-series", TMP_PROJ);
    expect(trend).not.toBeNull();
    expect(trend!.gate_trend).toBe("stable");
    expect(trend!.avg_delta).toBe(0);
    expect(trend!.points.length).toBe(1);
    expect(trend!.points[0].gate_score).toBe(100);
  });

  test("improving trend: scores increasing > 2 avg delta", () => {
    writeGate("improving", "20260425", 80);
    writeGate("improving", "20260427", 90);
    writeGate("improving", "20260429", 100);
    const trend = computeTrend(TMP_CORPUS, "improving", TMP_PROJ);
    expect(trend!.gate_trend).toBe("improving");
    // deltas: 90-80=10, 100-90=10 → avg=10
    expect(trend!.avg_delta).toBe(10);
  });

  test("declining trend: scores decreasing < -2 avg delta", () => {
    writeGate("declining", "20260425", 100);
    writeGate("declining", "20260427", 90);
    writeGate("declining", "20260429", 80);
    const trend = computeTrend(TMP_CORPUS, "declining", TMP_PROJ);
    expect(trend!.gate_trend).toBe("declining");
    expect(trend!.avg_delta).toBe(-10);
  });

  test("stable trend: small fluctuations within ±2", () => {
    writeGate("stable", "20260425", 100);
    writeGate("stable", "20260427", 99);
    writeGate("stable", "20260429", 100);
    const trend = computeTrend(TMP_CORPUS, "stable", TMP_PROJ);
    expect(trend!.gate_trend).toBe("stable");
  });

  test("loads blended_score from quality file when present", () => {
    writeGate("quality-series", "20260429", 95);
    writeQuality("quality-series", "20260429", 0.88);
    const trend = computeTrend(TMP_CORPUS, "quality-series", TMP_PROJ);
    expect(trend!.points[0].blended_score).toBe(0.88);
  });

  test("blended_score null when quality file missing", () => {
    writeGate("no-quality", "20260429", 95);
    const trend = computeTrend(TMP_CORPUS, "no-quality", TMP_PROJ);
    expect(trend!.points[0].blended_score).toBeNull();
  });

  test("reads node_count from merged-graph.json", () => {
    writeGate("nodes-series", "20260429", 100);
    writeMergedGraph("nodes-series", 42);
    const trend = computeTrend(TMP_CORPUS, "nodes-series", TMP_PROJ);
    expect(trend!.points[0].node_count).toBe(42);
  });

  test("skips corrupt gate files gracefully", () => {
    mkdirSync(join(TMP_CORPUS, "corrupt"), { recursive: true });
    writeFileSync(join(TMP_CORPUS, "corrupt", "gate-20260425.json"), "BAD JSON");
    writeGate("corrupt", "20260427", 95);
    const trend = computeTrend(TMP_CORPUS, "corrupt", TMP_PROJ);
    expect(trend).not.toBeNull();
    expect(trend!.points.length).toBe(1);
    expect(trend!.points[0].gate_score).toBe(95);
  });

  test("skips files not matching gate-YYYYMMDD.json pattern", () => {
    mkdirSync(join(TMP_CORPUS, "messy"), { recursive: true });
    writeFileSync(join(TMP_CORPUS, "messy", "gate-notes.txt"), "hello");
    writeFileSync(join(TMP_CORPUS, "messy", "gate-2026-04-29.json"), "{}");
    writeGate("messy", "20260429", 100);
    const trend = computeTrend(TMP_CORPUS, "messy", TMP_PROJ);
    expect(trend!.points.length).toBe(1);
  });

  test("sorts points by date ascending", () => {
    writeGate("sorted", "20260429", 100);
    writeGate("sorted", "20260425", 80);
    writeGate("sorted", "20260427", 90);
    const trend = computeTrend(TMP_CORPUS, "sorted", TMP_PROJ);
    const dates = trend!.points.map(p => p.date);
    expect(dates).toEqual(["2026-04-25", "2026-04-27", "2026-04-29"]);
  });
});
