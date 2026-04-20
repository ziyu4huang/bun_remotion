/**
 * Regression runner — compare pipeline results against baselines.
 *
 * Loads current gate.json + kg-quality-score.json for each series,
 * compares against stored baselines, flags regressions (>threshold% drops).
 *
 * Usage:
 *   bun run src/scripts/graphify-regression.ts [--series <name>] [--update] [--threshold 10] [--ci]
 *
 * Options:
 *   --series <name>    Only check one series (default: all in test-corpus/baselines/)
 *   --update           Save current results as new baseline
 *   --threshold <pct>  Regression threshold in percent (default: 10)
 *   --ci               Exit 1 if any regression detected
 */

import { resolve, join } from "node:path";
import {
  readFileSync, writeFileSync, existsSync,
  readdirSync, mkdirSync,
} from "node:fs";

// ─── Types ───

interface GateData {
  version: string;
  timestamp: string;
  series: string;
  genre: string;
  score: number;
  decision: string;
  quality_breakdown: Record<string, number | null>;
  checks: Array<{ name: string; status: string; score_impact: number }>;
}

interface QualityData {
  blended: { overall: number; decision: string };
  ai: { overall: number; dimensions: Record<string, number> };
  programmatic: { score: number };
}

interface Delta {
  metric: string;
  baseline: number;
  current: number;
  deltaPct: number;
  isRegression: boolean;
}

interface SeriesResult {
  series: string;
  status: "PASS" | "REGRESSION" | "NO_BASELINE" | "NO_CURRENT" | "ERROR";
  deltas: Delta[];
  gate?: GateData;
  quality?: QualityData;
  error?: string;
}

// ─── Functions (exported for testing) ───

export function computeDelta(baseline: number, current: number, threshold: number): Delta {
  const deltaPct = baseline === 0
    ? (current > 0 ? Infinity : 0)
    : ((current - baseline) / baseline) * 100;
  return {
    metric: "",
    baseline,
    current,
    deltaPct: Math.round(deltaPct * 100) / 100,
    isRegression: deltaPct < -threshold,
  };
}

export function compareGate(current: GateData, baseline: GateData, threshold: number): Delta[] {
  const deltas: Delta[] = [];

  // Overall score
  const scoreDelta = computeDelta(baseline.score, current.score, threshold);
  scoreDelta.metric = "gate_score";
  deltas.push(scoreDelta);

  // Quality breakdown dimensions
  if (baseline.quality_breakdown && current.quality_breakdown)
  for (const [dim, baseVal] of Object.entries(baseline.quality_breakdown)) {
    if (baseVal === null) continue;
    const curVal = current.quality_breakdown[dim];
    if (curVal === null) continue;
    const d = computeDelta(baseVal, curVal, threshold);
    d.metric = `breakdown.${dim}`;
    deltas.push(d);
  }

  // Check status counts
  const countStatus = (checks: GateData["checks"], status: string) =>
    checks.filter(c => c.status === status).length;

  const basePass = countStatus(baseline.checks, "PASS");
  const curPass = countStatus(current.checks, "PASS");
  const passDelta = computeDelta(basePass, curPass, threshold);
  passDelta.metric = "checks.PASS_count";
  deltas.push(passDelta);

  const baseFail = countStatus(baseline.checks, "FAIL");
  const curFail = countStatus(current.checks, "FAIL");
  // For FAIL: increase = regression (invert)
  const failDelta = computeDelta(-baseFail, -curFail, threshold);
  failDelta.metric = "checks.FAIL_count";
  failDelta.isRegression = curFail > baseFail && (baseFail === 0 || ((curFail - baseFail) / baseFail) * 100 > threshold);
  deltas.push(failDelta);

  return deltas;
}

export function compareQuality(current: QualityData, baseline: QualityData, threshold: number): Delta[] {
  const deltas: Delta[] = [];

  // Blended score
  const blendedDelta = computeDelta(baseline.blended.overall, current.blended.overall, threshold);
  blendedDelta.metric = "blended_score";
  deltas.push(blendedDelta);

  // AI dimensions
  for (const [dim, baseVal] of Object.entries(baseline.ai.dimensions)) {
    const curVal = current.ai.dimensions[dim];
    if (curVal === undefined) continue;
    const d = computeDelta(baseVal, curVal, threshold);
    d.metric = `ai.${dim}`;
    deltas.push(d);
  }

  return deltas;
}

export function generateReport(results: SeriesResult[]): string {
  const lines: string[] = [];
  const ts = new Date().toISOString();

  lines.push("# Regression Report");
  lines.push(`\nGenerated: ${ts}\n`);

  const passCount = results.filter(r => r.status === "PASS").length;
  const regCount = results.filter(r => r.status === "REGRESSION").length;
  const errCount = results.filter(r => r.status !== "PASS" && r.status !== "REGRESSION").length;

  lines.push(`**${passCount} PASS** | **${regCount} REGRESSION** | ${errCount} errors\n`);

  for (const r of results) {
    lines.push(`## ${r.series}`);
    lines.push(`Status: **${r.status}**\n`);

    if (r.deltas.length === 0) {
      lines.push("_No deltas computed._\n");
      continue;
    }

    lines.push("| Metric | Baseline | Current | Delta | Status |");
    lines.push("|--------|----------|---------|-------|--------|");

    for (const d of r.deltas) {
      const arrow = d.deltaPct > 0 ? "+" : "";
      const status = d.isRegression ? "REGRESSION" : "ok";
      lines.push(`| ${d.metric} | ${d.baseline.toFixed(2)} | ${d.current.toFixed(2)} | ${arrow}${d.deltaPct.toFixed(1)}% | ${status} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function discoverBaselineSeries(corpusDir: string): string[] {
  if (!existsSync(corpusDir)) return [];
  return readdirSync(corpusDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

export function loadLatestBaseline(corpusDir: string, seriesName: string): {
  gate: GateData | null;
  quality: QualityData | null;
} {
  const seriesDir = join(corpusDir, seriesName);
  if (!existsSync(seriesDir)) return { gate: null, quality: null };

  const files = readdirSync(seriesDir).filter(f => f.startsWith("gate-")).sort().reverse();
  const gateFile = files[0];
  let gate: GateData | null = null;
  if (gateFile) {
    try { gate = JSON.parse(readFileSync(join(seriesDir, gateFile), "utf-8")); } catch { /* skip */ }
  }

  const qFiles = readdirSync(seriesDir).filter(f => f.startsWith("kg-quality-score-")).sort().reverse();
  const qFile = qFiles[0];
  let quality: QualityData | null = null;
  if (qFile) {
    try { quality = JSON.parse(readFileSync(join(seriesDir, qFile), "utf-8")); } catch { /* skip */ }
  }

  return { gate, quality };
}

export function saveBaseline(corpusDir: string, seriesName: string, gate: GateData, quality?: QualityData): void {
  const seriesDir = join(corpusDir, seriesName);
  mkdirSync(seriesDir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  writeFileSync(join(seriesDir, `gate-${date}.json`), JSON.stringify(gate, null, 2), "utf-8");
  if (quality) {
    writeFileSync(join(seriesDir, `kg-quality-score-${date}.json`), JSON.stringify(quality, null, 2), "utf-8");
  }
}

// ─── Trend tracking (Phase 33-D4b) ───

export interface TrendPoint {
  date: string;
  gate_score: number;
  blended_score: number | null;
  node_count: number;
}

export interface SeriesTrend {
  series: string;
  points: TrendPoint[];
  gate_trend: "improving" | "stable" | "decling";
  avg_delta: number;
}

export function computeTrend(corpusDir: string, seriesName: string, projDir: string): SeriesTrend | null {
  const seriesDir = join(corpusDir, seriesName);
  if (!existsSync(seriesDir)) return null;

  // Collect all timestamped baseline files
  const gateFiles = readdirSync(seriesDir)
    .filter(f => f.match(/^gate-(\d{8})\.json$/))
    .sort();

  if (gateFiles.length === 0) return null;

  const points: TrendPoint[] = [];

  for (const gf of gateFiles) {
    const dateMatch = gf.match(/^gate-(\d{4})(\d{2})(\d{2})\.json$/);
    if (!dateMatch) continue;
    const date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;

    try {
      const gate: GateData = JSON.parse(readFileSync(join(seriesDir, gf), "utf-8"));
      const dateStr = gf.replace("gate-", "").replace(".json", "");
      const qFile = `kg-quality-score-${dateStr}.json`;
      let blended: number | null = null;
      if (existsSync(join(seriesDir, qFile))) {
        try {
          const q: QualityData = JSON.parse(readFileSync(join(seriesDir, qFile), "utf-8"));
          blended = q.blended?.overall ?? null;
        } catch { /* skip */ }
      }

      // Get node count from current data (baselines don't store this)
      let nodeCount = 0;
      const mergedPath = join(projDir, seriesName, "storygraph_out", "merged-graph.json");
      if (existsSync(mergedPath)) {
        try {
          const mg = JSON.parse(readFileSync(mergedPath, "utf-8"));
          nodeCount = mg.nodes?.length ?? 0;
        } catch { /* skip */ }
      }

      points.push({ date, gate_score: gate.score, blended_score: blended, node_count: nodeCount });
    } catch { /* skip corrupt baseline */ }
  }

  if (points.length === 0) return null;

  // Compute average delta
  let avgDelta = 0;
  if (points.length >= 2) {
    const deltas: number[] = [];
    for (let i = 1; i < points.length; i++) {
      deltas.push(points[i].gate_score - points[i - 1].gate_score);
    }
    avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  }

  const gateTrend: SeriesTrend["gate_trend"] =
    avgDelta > 2 ? "improving" : avgDelta < -2 ? "declining" : "stable";

  return { series: seriesName, points, gate_trend: gateTrend, avg_delta: Math.round(avgDelta * 100) / 100 };
}

// ─── CLI ───

const args = process.argv.slice(2);

if (args.includes("--help")) {
  console.log(`graphify-regression — Compare pipeline results against baselines

Usage:
  bun run src/scripts/graphify-regression.ts [options]

Options:
  --series <name>    Only check one series (default: all)
  --update           Save current results as new baseline
  --threshold <pct>  Regression threshold % (default: 10)
  --ci               Exit 1 if any regression
`);
  process.exit(0);
}

if (import.meta.main) {
  const seriesFilter = (() => {
    const idx = args.indexOf("--series");
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  })();

  const updateBaseline = args.includes("--update");
  const ciMode = args.includes("--ci");
  const threshold = (() => {
    const idx = args.indexOf("--threshold");
    return idx !== -1 && args[idx + 1] ? parseFloat(args[idx + 1]) : 10;
  })();

  const scriptDir = import.meta.dir;
  const corpusDir = resolve(scriptDir, "..", "..", "test-corpus", "baselines");
  const repoRoot = resolve(scriptDir, "..", "..", "..", "..");
  const projDir = join(repoRoot, "bun_remotion_proj");

  const seriesNames = seriesFilter
    ? [seriesFilter]
    : discoverBaselineSeries(corpusDir);

  if (seriesNames.length === 0) {
    console.log("No baseline series found.");
    process.exit(0);
  }

  console.log(`=== Regression Runner ===`);
  console.log(`Threshold: ${threshold}% | Series: ${seriesNames.join(", ")}\n`);

  const results: SeriesResult[] = [];

  for (const series of seriesNames) {
    const result: SeriesResult = { series, status: "PASS", deltas: [] };

    // Load current
    const currentGatePath = join(projDir, series, "storygraph_out", "gate.json");
    const currentQualityPath = join(projDir, series, "storygraph_out", "kg-quality-score.json");

    // Load baseline
    const baseline = loadLatestBaseline(corpusDir, series);
    if (!baseline.gate) {
      if (updateBaseline && existsSync(currentGatePath)) {
        let currentGate: GateData;
        try { currentGate = JSON.parse(readFileSync(currentGatePath, "utf-8")); } catch { currentGate = null!; }
        let currentQuality: QualityData | undefined;
        try { currentQuality = JSON.parse(readFileSync(currentQualityPath, "utf-8")); } catch { /* ok */ }
        if (currentGate) {
          saveBaseline(corpusDir, series, currentGate, currentQuality);
          result.status = "BASELINE_CREATED";
          console.log(`${series}: BASELINE CREATED`);
        }
      } else {
        result.status = "NO_BASELINE";
        console.log(`${series}: NO BASELINE`);
      }
      results.push(result);
      continue;
    }

    if (!existsSync(currentGatePath)) {
      result.status = "NO_CURRENT";
      results.push(result);
      console.log(`${series}: NO CURRENT (run pipeline first)`);
      continue;
    }

    let currentGate: GateData;
    try {
      currentGate = JSON.parse(readFileSync(currentGatePath, "utf-8"));
    } catch (e) {
      result.status = "ERROR";
      result.error = String(e);
      results.push(result);
      console.log(`${series}: ERROR reading gate.json`);
      continue;
    }

    result.gate = currentGate;

    // Compare gate
    const gateDeltas = compareGate(currentGate, baseline.gate, threshold);
    result.deltas.push(...gateDeltas);

    // Compare quality if both exist
    if (baseline.quality && existsSync(currentQualityPath)) {
      try {
        const currentQuality: QualityData = JSON.parse(readFileSync(currentQualityPath, "utf-8"));
        result.quality = currentQuality;
        const qualityDeltas = compareQuality(currentQuality, baseline.quality, threshold);
        result.deltas.push(...qualityDeltas);
      } catch { /* quality comparison optional */ }
    }

    const hasRegression = result.deltas.some(d => d.isRegression);
    result.status = hasRegression ? "REGRESSION" : "PASS";

    // Update baseline if requested
    if (updateBaseline) {
      saveBaseline(corpusDir, series, currentGate, result.quality);
      console.log(`${series}: UPDATED baseline`);
    }

    // Print summary
    const regDeltas = result.deltas.filter(d => d.isRegression);
    const arrow = (d: Delta) => d.deltaPct > 0 ? "+" : "";
    if (hasRegression) {
      console.log(`${series}: REGRESSION (${regDeltas.length} metrics dropped)`);
      for (const d of regDeltas) {
        console.log(`  - ${d.metric}: ${d.baseline.toFixed(2)} → ${d.current.toFixed(2)} (${arrow(d)}${d.deltaPct.toFixed(1)}%)`);
      }
    } else {
      const gateScore = result.deltas.find(d => d.metric === "gate_score");
      const blended = result.deltas.find(d => d.metric === "blended_score");
      const parts = [`gate ${currentGate.score}/100`];
      if (blended) parts.push(`blended ${(blended.current * 100).toFixed(1)}%`);
      console.log(`${series}: PASS (${parts.join(", ")})`);
    }

    results.push(result);
  }

  // Write report
  const report = generateReport(results);
  const reportPath = join(corpusDir, "..", "regression-report.md");
  writeFileSync(reportPath, report, "utf-8");
  console.log(`\nReport: ${reportPath}`);

  // Trend display (Phase 33-D4b)
  if (args.includes("--trend")) {
    console.log(`\n=== Score Trend ===`);
    for (const series of seriesNames) {
      const trend = computeTrend(corpusDir, series, projDir);
      if (!trend || trend.points.length === 0) {
        console.log(`${series}: no trend data`);
        continue;
      }
      const arrow = trend.gate_trend === "improving" ? "↑" : trend.gate_trend === "declining" ? "↓" : "→";
      console.log(`${series}: ${arrow} ${trend.gate_trend} (avg delta: ${trend.avg_delta > 0 ? "+" : ""}${trend.avg_delta})`);
      for (const p of trend.points) {
        const blendedStr = p.blended_score !== null ? ` blended=${(p.blended_score * 100).toFixed(1)}%` : "";
        console.log(`  ${p.date}: gate=${p.gate_score}${blendedStr}`);
      }
    }
  }

  // CI mode
  if (ciMode) {
    const hasRegression = results.some(r => r.status === "REGRESSION");
    if (hasRegression) {
      console.log("\n[CI] REGRESSION DETECTED");
      process.exit(1);
    } else {
      console.log("\n[CI] ALL PASS");
      process.exit(0);
    }
  }
}
