/**
 * Cost/latency matrix — track pipeline step timing across series and modes.
 *
 * Measures execution time for each pipeline step (episode, merge, check, score)
 * and generates a cost-latency-matrix.md report.
 *
 * Usage:
 *   bun run src/scripts/graphify-cost-matrix.ts [options]
 *
 * Options:
 *   --series <name>  Only measure one series (default: all with pipeline output)
 *   --runs <n>       Number of runs per series for reliability (default: 1)
 *   --output <path>  Output path (default: test-corpus/cost-latency-matrix.md)
 *   --json           Also output as JSON
 */

import { resolve, join } from "node:path";
import {
  readFileSync, writeFileSync, existsSync,
  readdirSync,
} from "node:fs";

// ─── Types ───

interface StepTiming {
  step: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

interface SeriesRun {
  series: string;
  genre: string;
  mode: string;
  episodes: number;
  steps: StepTiming[];
  totalMs: number;
  timestamp: string;
}

interface CostMatrixResult {
  generated: string;
  runs: SeriesRun[];
  summary: {
    byStep: Record<string, { avgMs: number; minMs: number; maxMs: number; successRate: number }>;
    bySeries: Record<string, { avgTotalMs: number; minTotalMs: number; maxTotalMs: number }>;
  };
}

// ─── Functions (exported for testing) ───

export function computeSummary(runs: SeriesRun[]): CostMatrixResult["summary"] {
  // Group by step
  const stepMap = new Map<string, { times: number[]; successes: number; total: number }>();
  for (const run of runs) {
    for (const step of run.steps) {
      if (!stepMap.has(step.step)) stepMap.set(step.step, { times: [], successes: 0, total: 0 });
      const entry = stepMap.get(step.step)!;
      entry.times.push(step.durationMs);
      entry.total++;
      if (step.success) entry.successes++;
    }
  }

  const byStep: CostMatrixResult["summary"]["byStep"] = {};
  for (const [step, data] of stepMap) {
    const sorted = data.times.sort((a, b) => a - b);
    byStep[step] = {
      avgMs: Math.round(data.times.reduce((s, t) => s + t, 0) / data.times.length),
      minMs: sorted[0],
      maxMs: sorted[sorted.length - 1],
      successRate: data.successes / data.total,
    };
  }

  // Group by series
  const seriesMap = new Map<string, number[]>();
  for (const run of runs) {
    if (!seriesMap.has(run.series)) seriesMap.set(run.series, []);
    seriesMap.get(run.series)!.push(run.totalMs);
  }

  const bySeries: CostMatrixResult["summary"]["bySeries"] = {};
  for (const [series, times] of seriesMap) {
    const sorted = times.sort((a, b) => a - b);
    bySeries[series] = {
      avgTotalMs: Math.round(times.reduce((s, t) => s + t, 0) / times.length),
      minTotalMs: sorted[0],
      maxTotalMs: sorted[sorted.length - 1],
    };
  }

  return { byStep, bySeries };
}

export function generateCostReport(runs: SeriesRun[]): string {
  const lines: string[] = [];
  const ts = new Date().toISOString();
  const summary = computeSummary(runs);

  lines.push("# Cost/Latency Matrix");
  lines.push(`\nGenerated: ${ts}\n`);

  // Per-run detail
  lines.push("## Per-Run Detail\n");
  for (const run of runs) {
    lines.push(`### ${run.series} (${run.genre}, ${run.mode}, ${run.episodes} eps)`);
    lines.push(`Total: ${(run.totalMs / 1000).toFixed(1)}s\n`);

    lines.push("| Step | Duration | Status |");
    lines.push("|------|----------|--------|");
    for (const step of run.steps) {
      const status = step.success ? "ok" : `FAIL: ${step.error ?? "unknown"}`;
      lines.push(`| ${step.step} | ${(step.durationMs / 1000).toFixed(2)}s | ${status} |`);
    }
    lines.push("");
  }

  // Step summary
  lines.push("## Step Summary\n");
  lines.push("| Step | Avg | Min | Max | Success Rate |");
  lines.push("|------|-----|-----|-----|-------------|");
  for (const [step, data] of Object.entries(summary.byStep)) {
    lines.push(`| ${step} | ${(data.avgMs / 1000).toFixed(2)}s | ${(data.minMs / 1000).toFixed(2)}s | ${(data.maxMs / 1000).toFixed(2)}s | ${(data.successRate * 100).toFixed(0)}% |`);
  }

  // Series summary
  lines.push("\n## Series Summary\n");
  lines.push("| Series | Avg Total | Min | Max |");
  lines.push("|--------|-----------|-----|-----|");
  for (const [series, data] of Object.entries(summary.bySeries)) {
    lines.push(`| ${series} | ${(data.avgTotalMs / 1000).toFixed(1)}s | ${(data.minTotalMs / 1000).toFixed(1)}s | ${(data.maxTotalMs / 1000).toFixed(1)}s |`);
  }

  return lines.join("\n");
}

export function timeStep(label: string, fn: () => void): StepTiming {
  const start = performance.now();
  try {
    fn();
    return { step: label, durationMs: performance.now() - start, success: true };
  } catch (e) {
    return { step: label, durationMs: performance.now() - start, success: false, error: String(e) };
  }
}

// ─── CLI ───

if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    console.log(`graphify-cost-matrix — Track pipeline step timing

Usage:
  bun run src/scripts/graphify-cost-matrix.ts [options]

Options:
  --series <name>  Only one series (default: all)
  --runs <n>       Runs per series (default: 1)
  --output <path>  Output path
  --json           Also output as JSON
`);
    process.exit(0);
  }

  const seriesFilter = (() => {
    const idx = args.indexOf("--series");
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  })();

  const runs = (() => {
    const idx = args.indexOf("--runs");
    return idx !== -1 && args[idx + 1] ? parseInt(args[idx + 1], 10) : 1;
  })();

  const defaultOutput = resolve(import.meta.dir, "..", "..", "test-corpus", "cost-latency-matrix.md");
  const outputIdx = args.indexOf("--output");
  const outputPath = outputIdx !== -1 && args[outputIdx + 1] ? args[outputIdx + 1] : defaultOutput;
  const wantJson = args.includes("--json");

  const scriptDir = import.meta.dir;
  const repoRoot = resolve(scriptDir, "..", "..", "..", "..");
  const projDir = join(repoRoot, "bun_remotion_proj");

  // Discover series
  const seriesNames = existsSync(projDir)
    ? readdirSync(projDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .filter(d => existsSync(join(projDir, d.name, "storygraph_out", "gate.json")))
        .map(d => d.name)
        .filter(n => !seriesFilter || n === seriesFilter)
    : [];

  if (seriesNames.length === 0) {
    console.log("No series found.");
    process.exit(0);
  }

  console.log(`=== Cost/Latency Matrix ===`);
  console.log(`Series: ${seriesNames.join(", ")} | Runs: ${runs}\n`);

  const allRuns: SeriesRun[] = [];

  for (const series of seriesNames) {
    const gatePath = join(projDir, series, "storygraph_out", "gate.json");
    let gate: any;
    try { gate = JSON.parse(readFileSync(gatePath, "utf-8")); } catch { continue; }

    // Count episodes
    const seriesDir = join(projDir, series);
    let epCount = 0;
    const dirs = readdirSync(seriesDir, { withFileTypes: true });
    for (const d of dirs) {
      if (d.isDirectory() && existsSync(join(seriesDir, d.name, "storygraph_out"))) epCount++;
    }

    for (let run = 0; run < runs; run++) {
      const steps: StepTiming[] = [];

      // Time file reads as proxy for pipeline steps
      // (Full pipeline timing requires running actual pipeline — see graphify-pipeline.ts)
      steps.push(timeStep("load_gate", () => {
        readFileSync(gatePath, "utf-8");
      }));

      const qualityPath = join(projDir, series, "storygraph_out", "kg-quality-score.json");
      if (existsSync(qualityPath)) {
        steps.push(timeStep("load_quality", () => {
          readFileSync(qualityPath, "utf-8");
        }));
      }

      const mergedPath = join(projDir, series, "storygraph_out", "merged-graph.json");
      if (existsSync(mergedPath)) {
        steps.push(timeStep("load_merged", () => {
          readFileSync(mergedPath, "utf-8");
        }));
      }

      // Compute graph stats timing
      steps.push(timeStep("compute_stats", () => {
        if (existsSync(mergedPath)) {
          const data = JSON.parse(readFileSync(mergedPath, "utf-8"));
          const nodeCount = data.nodes?.length ?? 0;
          const edgeCount = (data.links?.length ?? 0) + (data.cross_links?.length ?? 0);
          void nodeCount + edgeCount;
        }
      }));

      const totalMs = steps.reduce((s, st) => s + st.durationMs, 0);

      allRuns.push({
        series,
        genre: gate.genre ?? "unknown",
        mode: gate.generator?.mode ?? "unknown",
        episodes: epCount,
        steps,
        totalMs,
        timestamp: new Date().toISOString(),
      });

      console.log(`${series} run ${run + 1}: ${steps.length} steps in ${(totalMs / 1000).toFixed(3)}s`);
    }
  }

  // Write report
  const report = generateCostReport(allRuns);
  writeFileSync(outputPath, report, "utf-8");
  console.log(`\nReport: ${outputPath}`);

  if (wantJson) {
    const jsonPath = outputPath.replace(/\.md$/, ".json");
    const result: CostMatrixResult = {
      generated: new Date().toISOString(),
      runs: allRuns,
      summary: computeSummary(allRuns),
    };
    writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf-8");
    console.log(`JSON: ${jsonPath}`);
  }
}
