import { describe, it, expect } from "bun:test";
import {
  loadSeriesMetrics,
  generateComparisonTable,
} from "../scripts/graphify-tier-compare";
import type { SeriesMetrics } from "../scripts/graphify-tier-compare";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// ─── Fixtures ───

const gateJson = JSON.stringify({
  version: "2.0",
  series: "test-series",
  genre: "xianxia_comedy",
  generator: { mode: "hybrid", model: "glm-5" },
  score: 95,
  decision: "PASS",
  checks: [
    { name: "A", status: "PASS", score_impact: 5 },
    { name: "B", status: "PASS", score_impact: 5 },
    { name: "C", status: "WARN", score_impact: -5 },
    { name: "D", status: "SKIP", score_impact: 0 },
  ],
  quality_breakdown: { consistency: 0.9, pacing: 0.8 },
});

const qualityJson = JSON.stringify({
  blended: { overall: 0.78, decision: "ACCEPT" },
  ai: { overall: 7.8, dimensions: { accuracy: 8, completeness: 7 } },
  programmatic: { score: 95 },
});

const mergedJson = JSON.stringify({
  nodes: [{ id: "a" }, { id: "b" }, { id: "c" }],
  links: [{ source: "a", target: "b" }],
  cross_links: [{ source: "a", target: "c" }],
  communities: [{ id: 0 }],
});

// ─── loadSeriesMetrics ───

describe("loadSeriesMetrics", () => {
  let tmpDir: string;

  // We need a temp proj dir structure:
  // tmpDir/series-name/storygraph_out/{gate,quality,merged}.json
  // tmpDir/series-name/ep1/storygraph_out/...

  const setupSeries = (base: string, name: string, opts: { gate?: string; quality?: string; merged?: string; episodes?: number } = {}) => {
    const outDir = join(base, name, "storygraph_out");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "gate.json"), opts.gate ?? gateJson);
    if (opts.quality) writeFileSync(join(outDir, "kg-quality-score.json"), opts.quality);
    if (opts.merged) writeFileSync(join(outDir, "merged-graph.json"), opts.merged);

    // Create episode dirs
    const epCount = opts.episodes ?? 2;
    for (let i = 1; i <= epCount; i++) {
      mkdirSync(join(base, name, `ep${i}`, "storygraph_out"), { recursive: true });
    }
  };

  it("loads metrics from complete series", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "tier-test-"));
    setupSeries(tmpDir, "test-series", { quality: qualityJson, merged: mergedJson });

    const m = loadSeriesMetrics(tmpDir, "test-series");
    expect(m).not.toBeNull();
    expect(m!.series).toBe("test-series");
    expect(m!.genre).toBe("xianxia_comedy");
    expect(m!.extractionMode).toBe("hybrid");
    expect(m!.gateScore).toBe(95);
    expect(m!.blendedScore).toBe(0.78);
    expect(m!.aiOverall).toBe(7.8);
    expect(m!.nodes).toBe(3);
    expect(m!.edges).toBe(2);
    expect(m!.communities).toBe(1);
    expect(m!.passCount).toBe(2);
    expect(m!.warnCount).toBe(1);
    expect(m!.skipCount).toBe(1);
    expect(m!.episodes).toBe(2);

    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("handles missing quality data", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "tier-test-"));
    setupSeries(tmpDir, "minimal", { merged: mergedJson });

    const m = loadSeriesMetrics(tmpDir, "minimal");
    expect(m).not.toBeNull();
    expect(m!.blendedScore).toBe(0);
    expect(m!.aiOverall).toBe(0);

    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns null when no gate.json", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "tier-test-"));
    mkdirSync(join(tmpDir, "empty-series"), { recursive: true });

    const m = loadSeriesMetrics(tmpDir, "empty-series");
    expect(m).toBeNull();

    rmSync(tmpDir, { recursive: true, force: true });
  });
});

// ─── generateComparisonTable ───

describe("generateComparisonTable", () => {
  const sampleMetrics: SeriesMetrics[] = [
    {
      series: "weapon-forger",
      genre: "xianxia_comedy",
      extractionMode: "regex",
      episodes: 7,
      nodes: 156,
      edges: 332,
      communities: 0,
      gateScore: 0,
      gateDecision: "FAIL",
      blendedScore: 0.372,
      blendedDecision: "REJECT",
      aiOverall: 6.2,
      breakdown: { consistency: 0.83, pacing: 0.5 },
      aiDimensions: { accuracy: 7, completeness: 5 },
      passCount: 10,
      warnCount: 5,
      failCount: 20,
      skipCount: 0,
    },
    {
      series: "xianxia-system-meme",
      genre: "xianxia_comedy",
      extractionMode: "hybrid",
      episodes: 2,
      nodes: 31,
      edges: 50,
      communities: 3,
      gateScore: 100,
      gateDecision: "PASS",
      blendedScore: 0.784,
      blendedDecision: "ACCEPT",
      aiOverall: 6.4,
      breakdown: { consistency: 1.0, pacing: 1.0 },
      aiDimensions: { accuracy: 7, completeness: 6 },
      passCount: 15,
      warnCount: 0,
      failCount: 0,
      skipCount: 3,
    },
  ];

  it("generates summary table", () => {
    const report = generateComparisonTable(sampleMetrics);
    expect(report).toContain("Tier Comparison Report");
    expect(report).toContain("weapon-forger");
    expect(report).toContain("xianxia-system-meme");
    expect(report).toContain("156");
    expect(report).toContain("100");
    expect(report).toContain("37.2%");
    expect(report).toContain("78.4%");
  });

  it("includes check status counts", () => {
    const report = generateComparisonTable(sampleMetrics);
    expect(report).toContain("Check Status Counts");
    expect(report).toContain("10"); // weapon-forger pass
    expect(report).toContain("20"); // weapon-forger fail
  });

  it("includes quality breakdown", () => {
    const report = generateComparisonTable(sampleMetrics);
    expect(report).toContain("Quality Breakdown");
    expect(report).toContain("consistency");
    expect(report).toContain("pacing");
  });

  it("includes AI dimensions", () => {
    const report = generateComparisonTable(sampleMetrics);
    expect(report).toContain("AI Quality Dimensions");
    expect(report).toContain("accuracy");
    expect(report).toContain("completeness");
  });

  it("includes mode comparison when multiple modes", () => {
    const report = generateComparisonTable(sampleMetrics);
    expect(report).toContain("Extraction Mode Comparison");
    expect(report).toContain("regex");
    expect(report).toContain("hybrid");
  });

  it("handles single series", () => {
    const report = generateComparisonTable([sampleMetrics[0]]);
    expect(report).toContain("weapon-forger");
    expect(report).not.toContain("Extraction Mode Comparison");
  });
});
