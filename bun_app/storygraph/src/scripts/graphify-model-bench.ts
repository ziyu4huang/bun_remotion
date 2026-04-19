/**
 * Model benchmark — run pipeline across multiple AI models and compare results.
 *
 * Runs the full pipeline (episode → merge → check → score) in hybrid mode
 * for each model, collects metrics, and generates a comparison report.
 *
 * Usage:
 *   bun run src/scripts/graphify-model-bench.ts <series-dir> [options]
 *
 * Options:
 *   --models <list>     Comma-separated model IDs (default: glm-4.5-flash,glm-4.6,glm-5)
 *   --provider <name>   AI provider (default: zai)
 *   --runs <N>          Run each model N times for reliability (default: 1)
 *   --accuracy          Run accuracy sampling on merged graph nodes
 *   --keep              Keep per-model output dirs
 */

import { resolve, basename, join } from "node:path";
import {
  existsSync, mkdirSync, writeFileSync, readFileSync,
  rmSync, cpSync, readdirSync,
} from "node:fs";
import { callAI } from "../ai-client";
import { detectSeries, resolveScoringProfile } from "./series-config";

// ─── Types ───

export interface RunResult {
  model: string;
  runIndex: number;
  totalNodes: number;
  totalEdges: number;
  nodeTypes: Record<string, number>;
  gateScore: number;
  gateDecision: string;
  passCount: number;
  warnCount: number;
  failCount: number;
  blendedScore: number | null;
  aiScore: number | null;
  success: boolean;
  durationMs: number;
}

export interface ModelSummary {
  model: string;
  runs: number;
  successRate: number;
  avgGateScore: number;
  stddevGateScore: number;
  avgBlendedScore: number | null;
  stddevBlendedScore: number | null;
  avgNodes: number;
  avgEdges: number;
  avgDurationMs: number;
  allRuns: RunResult[];
}

export interface AccuracySample {
  model: string;
  sampledNodes: number;
  correctNodes: number;
  precision: number;
  details: Array<{ id: string; type: string; label: string; correct: boolean; reason: string }>;
}

// ─── Functions (exported for testing) ───

export function computeMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function computeStddev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = computeMean(values);
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function summarizeModel(model: string, runs: RunResult[]): ModelSummary {
  const successful = runs.filter(r => r.success);
  const gateScores = successful.map(r => r.gateScore);
  const blendedScores = successful.map(r => r.blendedScore).filter((s): s is number => s !== null);
  const nodes = successful.map(r => r.totalNodes);
  const edges = successful.map(r => r.totalEdges);
  const durations = successful.map(r => r.durationMs);

  return {
    model,
    runs: runs.length,
    successRate: successful.length / runs.length,
    avgGateScore: computeMean(gateScores),
    stddevGateScore: computeStddev(gateScores),
    avgBlendedScore: blendedScores.length > 0 ? computeMean(blendedScores) : null,
    stddevBlendedScore: blendedScores.length > 1 ? computeStddev(blendedScores) : null,
    avgNodes: computeMean(nodes),
    avgEdges: computeMean(edges),
    avgDurationMs: computeMean(durations),
    allRuns: runs,
  };
}

export function generateBenchReport(summaries: ModelSummary[], accuracyResults: AccuracySample[], seriesName: string, models: string[]): string {
  const lines: string[] = [];
  const ts = new Date().toISOString();

  lines.push("# Model Benchmark Report");
  lines.push(`\nSeries: **${seriesName}**`);
  lines.push(`Generated: ${ts}`);
  lines.push(`Models: ${models.join(", ")}`);
  lines.push(`Mode: hybrid\n`);

  // Summary table
  lines.push("## Summary\n");
  lines.push("| Model | Runs | Success | Gate Score | ± | Blended | ± | Nodes | Edges | Duration |");
  lines.push("|-------|------|---------|------------|---|---------|---|-------|-------|----------|");
  for (const s of summaries) {
    const gate = `${s.avgGateScore.toFixed(1)}`;
    const gateStd = `${s.stddevGateScore.toFixed(1)}`;
    const blended = s.avgBlendedScore !== null ? `${(s.avgBlendedScore * 100).toFixed(1)}%` : "N/A";
    const blendedStd = s.stddevBlendedScore !== null ? `${(s.stddevBlendedScore * 100).toFixed(1)}%` : "—";
    lines.push(`| ${s.model} | ${s.runs} | ${(s.successRate * 100).toFixed(0)}% | ${gate} | ±${gateStd} | ${blended} | ±${blendedStd} | ${s.avgNodes.toFixed(0)} | ${s.avgEdges.toFixed(0)} | ${s.avgDurationMs.toFixed(0)}ms |`);
  }
  lines.push("");

  // Per-run detail
  lines.push("## Per-Run Detail\n");
  for (const s of summaries) {
    lines.push(`### ${s.model}\n`);
    lines.push("| Run | Gate | Blended | Nodes | Edges | P/W/F | Duration |");
    lines.push("|-----|------|---------|-------|-------|-------|----------|");
    for (const r of s.allRuns) {
      const b = r.blendedScore !== null ? `${(r.blendedScore * 100).toFixed(1)}%` : "N/A";
      const status = r.success ? `${r.passCount}/${r.warnCount}/${r.failCount}` : "FAILED";
      lines.push(`| ${r.runIndex + 1} | ${r.gateScore} | ${b} | ${r.totalNodes} | ${r.totalEdges} | ${status} | ${r.durationMs}ms |`);
    }
    lines.push("");
  }

  // Accuracy sampling
  if (accuracyResults.length > 0) {
    lines.push("## Accuracy Sampling\n");
    lines.push("| Model | Sampled | Correct | Precision |");
    lines.push("|-------|---------|---------|-----------|");
    for (const a of accuracyResults) {
      lines.push(`| ${a.model} | ${a.sampledNodes} | ${a.correctNodes} | ${(a.precision * 100).toFixed(1)}% |`);
    }
    lines.push("");

    for (const a of accuracyResults) {
      lines.push(`### ${a.model} — Sampled Nodes\n`);
      lines.push("| Node | Type | Label | Correct | Reason |");
      lines.push("|------|------|-------|---------|--------|");
      for (const d of a.details) {
        lines.push(`| ${d.id} | ${d.type} | ${d.label} | ${d.correct ? "Yes" : "No"} | ${d.reason} |`);
      }
      lines.push("");
    }
  }

  // Recommendation
  lines.push("## Recommendation\n");
  if (summaries.length > 0) {
    const best = [...summaries].sort((a, b) => b.avgGateScore - a.avgGateScore)[0];
    const bestBlended = [...summaries].filter(s => s.avgBlendedScore !== null).sort((a, b) => (b.avgBlendedScore ?? 0) - (a.avgBlendedScore ?? 0))[0];
    lines.push(`- **Best gate score:** ${best.model} (${best.avgGateScore.toFixed(1)}/100)`);
    if (bestBlended) {
      lines.push(`- **Best blended score:** ${bestBlended.model} (${((bestBlended.avgBlendedScore ?? 0) * 100).toFixed(1)}%)`);
    }
  } else {
    lines.push("_No model summaries to compare._");
  }
  lines.push("");

  return lines.join("\n");
}

export function buildAccuracyPrompt(nodes: Array<{ id: string; type: string; label: string; episode: string }>, seriesName: string): string {
  const nodeLines = nodes.map((n, i) => `${i + 1}. [${n.type}] ${n.label} (episode: ${n.episode}, id: ${n.id})`).join("\n");

  return `You are evaluating nodes from a knowledge graph extracted from the "${seriesName}" video series.
For each node, determine if it represents a REAL, MEANINGFUL concept from the series content.

Rate each node as:
- correct: true if the node label is a real concept/character/event from the series
- correct: false if the node is hallucinated, nonsensical, or has a meaningless label
- reason: one short sentence explaining why

Nodes to evaluate:
${nodeLines}

Respond with JSON only:
{
  "evaluations": [
    { "id": "node_id", "correct": true/false, "reason": "..." }
  ]
}`;
}

export function sampleNodes(merged: { nodes: Array<{ id: string; type: string; label: string; episode?: string }> }, count: number): Array<{ id: string; type: string; label: string; episode: string }> {
  const nodes = (merged.nodes ?? [])
    .filter(n => n.type !== "episode_plot" && n.type !== "narrator")
    .map(n => ({
      id: n.id,
      type: n.type,
      label: n.label,
      episode: n.episode ?? n.id.match(/^(ch\d+ep\d+|ep\d+)/)?.[1] ?? "unknown",
    }));

  // Shuffle and take count
  const shuffled = [...nodes].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function parseAccuracyResponse(response: string, nodes: Array<{ id: string; type: string; label: string }>): AccuracySample["details"] {
  try {
    const parsed = JSON.parse(response);
    const evals = parsed.evaluations ?? [];
    return evals.map((e: any) => {
      const node = nodes.find(n => n.id === e.id);
      return {
        id: e.id ?? "",
        type: node?.type ?? "unknown",
        label: node?.label ?? "",
        correct: Boolean(e.correct),
        reason: e.reason ?? "",
      };
    });
  } catch {
    return [];
  }
}

// ─── CLI ───

if (import.meta.main) {
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help")) {
  console.log(`graphify-model-bench — Benchmark AI models for KG extraction

Usage:
  bun run src/scripts/graphify-model-bench.ts <series-dir> [options]

Options:
  --models <list>     Comma-separated model IDs (default: glm-4.5-flash,glm-4.6,glm-5)
  --provider <name>   AI provider (default: zai)
  --runs <N>          Run each model N times (default: 1)
  --accuracy          Run accuracy sampling on extracted nodes
  --keep              Keep per-model output dirs
`);
  process.exit(0);
}

  const seriesDir = resolve(args[0]);
  const provider = (() => { const i = args.indexOf("--provider"); return i !== -1 && args[i + 1] ? args[i + 1] : "zai"; })();
  const models = (() => {
    const i = args.indexOf("--models");
    return i !== -1 && args[i + 1] ? args[i + 1].split(",").map(m => m.trim()) : ["glm-4.5-flash", "glm-4.6", "glm-5"];
  })();
  const numRuns = (() => { const i = args.indexOf("--runs"); return i !== -1 && args[i + 1] ? parseInt(args[i + 1]) : 1; })();
  const runAccuracy = args.includes("--accuracy");
  const keep = args.includes("--keep");

  const scriptDir = import.meta.dir;
  const outDir = resolve(seriesDir, "storygraph_out");
  const benchDir = resolve(seriesDir, "storygraph_out_bench");

  console.log("=== Model Benchmark ===");
  console.log(`Series: ${seriesDir}`);
  console.log(`Models: ${models.join(", ")}`);
  console.log(`Provider: ${provider}`);
  console.log(`Runs per model: ${numRuns}`);
  console.log(`Accuracy sampling: ${runAccuracy}`);
  console.log();

  const allResults: Map<string, RunResult[]> = new Map();
  for (const model of models) {
    allResults.set(model, []);
  }

  // Run pipeline for each model × run
  for (const model of models) {
    for (let run = 0; run < numRuns; run++) {
      const label = numRuns > 1 ? `${model} (run ${run + 1}/${numRuns})` : model;
      console.log(`\n${"=".repeat(50)}`);
      console.log(`Benchmarking: ${label}`);
      console.log(`${"=".repeat(50)}\n`);

      // Save original output
      const backupDir = resolve(seriesDir, `storygraph_out_backup_${model}_${run}`);
      if (existsSync(outDir)) {
        cpSync(outDir, backupDir, { recursive: true });
      }

      const startMs = Date.now();
      let success = false;

      try {
        const result = Bun.spawnSync([
          "bun", "run",
          resolve(scriptDir, "graphify-pipeline.ts"),
          seriesDir,
          "--mode", "hybrid",
          "--provider", provider,
          "--model", model,
        ], { stdio: ["inherit", "pipe", "pipe"] });

        success = result.exitCode === 0;

        if (!success) {
          const stderr = result.stderr ? new TextDecoder().decode(result.stderr) : "";
          console.error(`Pipeline failed for ${label} (exit ${result.exitCode})`);
          if (stderr) console.error(stderr.slice(0, 500));
        }
      } catch (err) {
        console.error(`Pipeline error for ${label}: ${err}`);
      }

      const durationMs = Date.now() - startMs;

      // Collect results
      const runResult = collectRunResult(model, run, outDir, durationMs, success);
      allResults.get(model)!.push(runResult);

      // Copy output to per-model dir for inspection
      if (keep) {
        const modelOutDir = resolve(benchDir, `${model}_run${run}`);
        if (existsSync(modelOutDir)) rmSync(modelOutDir, { recursive: true });
        if (existsSync(outDir)) cpSync(outDir, modelOutDir, { recursive: true });
      }

      // Restore backup
      if (existsSync(backupDir)) {
        if (existsSync(outDir)) rmSync(outDir, { recursive: true });
        cpSync(backupDir, outDir, { recursive: true });
        rmSync(backupDir, { recursive: true });
      }
    }
  }

  // Summarize
  const summaries: ModelSummary[] = [];
  for (const model of models) {
    const runs = allResults.get(model) ?? [];
    summaries.push(summarizeModel(model, runs));
  }

  // Accuracy sampling
  const accuracyResults: AccuracySample[] = [];
  if (runAccuracy) {
    console.log("\n=== Accuracy Sampling ===\n");
    for (const model of models) {
      const successfulRuns = (allResults.get(model) ?? []).filter(r => r.success);
      if (successfulRuns.length === 0) continue;

      // Use the last successful run's output for accuracy
      const lastRunDir = resolve(benchDir, `${model}_run${successfulRuns.length - 1}`);
      const mergedPath = existsSync(lastRunDir)
        ? resolve(lastRunDir, "merged-graph.json")
        : resolve(outDir, "merged-graph.json");

      if (!existsSync(mergedPath)) {
        console.log(`${model}: no merged graph for accuracy sampling`);
        continue;
      }

      const merged = JSON.parse(readFileSync(mergedPath, "utf-8"));
      const sampled = sampleNodes(merged, 20);

      if (sampled.length === 0) {
        console.log(`${model}: no nodes to sample`);
        continue;
      }

      console.log(`${model}: evaluating ${sampled.length} nodes...`);

      const prompt = buildAccuracyPrompt(sampled, basename(seriesDir));
      const response = await callAI(prompt, { provider, model: "glm-5", jsonMode: true });

      if (!response) {
        console.log(`${model}: accuracy sampling failed (no AI response)`);
        continue;
      }

      const details = parseAccuracyResponse(response, sampled);
      const correct = details.filter(d => d.correct).length;

      accuracyResults.push({
        model,
        sampledNodes: sampled.length,
        correctNodes: correct,
        precision: sampled.length > 0 ? correct / sampled.length : 0,
        details,
      });

      console.log(`${model}: precision ${((correct / sampled.length) * 100).toFixed(1)}% (${correct}/${sampled.length})`);
    }
  }

  // Generate report
  mkdirSync(benchDir, { recursive: true });
  const report = generateBenchReport(summaries, accuracyResults, basename(seriesDir), models);
  const reportPath = resolve(benchDir, "benchmark-report.md");
  writeFileSync(reportPath, report, "utf-8");

  // Clean up per-model dirs if not keeping
  if (!keep && existsSync(benchDir)) {
    // Only remove if it only contains run dirs
    const entries = readdirSync(benchDir).filter(e => e !== "benchmark-report.md");
    for (const e of entries) {
      const p = resolve(benchDir, e);
      if (existsSync(p)) rmSync(p, { recursive: true });
    }
  }

  console.log(`\nBenchmark report: ${reportPath}`);
  console.log("\n=== Benchmark Complete ===");

  // Print summary
  for (const s of summaries) {
    const acc = accuracyResults.find(a => a.model === s.model);
    const accStr = acc ? `, precision ${(acc.precision * 100).toFixed(1)}%` : "";
    console.log(`  ${s.model}: gate ${s.avgGateScore.toFixed(1)}/100${s.avgBlendedScore !== null ? `, blended ${(s.avgBlendedScore * 100).toFixed(1)}%` : ""}${accStr}, ${s.avgNodes.toFixed(0)} nodes, ${s.avgDurationMs.toFixed(0)}ms`);
  }
} // end import.meta.main

// ─── Helpers ───

function collectRunResult(model: string, runIndex: number, outDir: string, durationMs: number, success: boolean): RunResult {
  const result: RunResult = {
    model,
    runIndex,
    totalNodes: 0,
    totalEdges: 0,
    nodeTypes: {},
    gateScore: 0,
    gateDecision: "FAIL",
    passCount: 0,
    warnCount: 0,
    failCount: 0,
    blendedScore: null,
    aiScore: null,
    success,
    durationMs,
  };

  if (!success) return result;

  // Merged graph stats
  const mergedPath = resolve(outDir, "merged-graph.json");
  if (existsSync(mergedPath)) {
    try {
      const merged = JSON.parse(readFileSync(mergedPath, "utf-8"));
      result.totalNodes = merged.nodes?.length ?? 0;
      result.totalEdges = merged.links?.length ?? 0;
      for (const n of merged.nodes ?? []) {
        const t = n.type ?? "unknown";
        result.nodeTypes[t] = (result.nodeTypes[t] ?? 0) + 1;
      }
    } catch { /* skip */ }
  }

  // Gate stats
  const gatePath = resolve(outDir, "gate.json");
  if (existsSync(gatePath)) {
    try {
      const gate = JSON.parse(readFileSync(gatePath, "utf-8"));
      result.gateScore = gate.score ?? 0;
      result.gateDecision = gate.decision ?? "FAIL";
      for (const c of gate.checks ?? []) {
        if (c.status === "PASS") result.passCount++;
        else if (c.status === "WARN") result.warnCount++;
        else if (c.status === "FAIL") result.failCount++;
      }
    } catch { /* skip */ }
  }

  // Quality score
  const qualityPath = resolve(outDir, "kg-quality-score.json");
  if (existsSync(qualityPath)) {
    try {
      const qs = JSON.parse(readFileSync(qualityPath, "utf-8"));
      result.blendedScore = qs.blended?.overall ?? null;
      result.aiScore = qs.ai?.overall ?? null;
    } catch { /* skip */ }
  }

  return result;
}
