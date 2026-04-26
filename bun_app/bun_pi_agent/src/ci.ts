/**
 * Phase 44-D: CI entry point for storygraph regression checks.
 *
 * Runs pipeline + regression against baselines, outputs structured JSON,
 * exits 0 (pass) or 1 (regression/error).
 *
 * Usage:
 *   bun bun_app/bun_pi_agent/src/ci.ts <series-dir> [--threshold 10] [--mode hybrid] [--check-only]
 */

import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { runPipeline, runCheck, type AIPipelineOptions, type PipelineResult, type CheckResult } from "../../storygraph/src/pipeline-api";
import { getConfig } from "./config.js";

function parseArgs(args: string[]) {
  let seriesDir = "";
  let threshold = 10;
  let mode: AIPipelineOptions["mode"] = "hybrid";
  let checkOnly = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--threshold" && args[i + 1]) {
      threshold = Number(args[++i]);
    } else if (args[i] === "--mode" && args[i + 1]) {
      mode = args[++i] as AIPipelineOptions["mode"];
    } else if (args[i] === "--check-only") {
      checkOnly = true;
    } else if (!args[i].startsWith("-") && !seriesDir) {
      seriesDir = resolve(args[i]);
    }
  }

  return { seriesDir, threshold, mode, checkOnly };
}

function exitCi(result: { status: string; exitCode: number }) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.exitCode);
}

async function main() {
  const { seriesDir, threshold, mode, checkOnly } = parseArgs(process.argv.slice(2));

  if (!seriesDir) {
    exitCi({ status: "ERROR", exitCode: 1, error: "series-dir required", usage: "bun bun_app/bun_pi_agent/src/ci.ts <series-dir> [--threshold 10] [--mode hybrid] [--check-only]" } as any);
  }

  if (!existsSync(seriesDir)) {
    exitCi({ status: "ERROR", exitCode: 1, error: `Directory not found: ${seriesDir}` } as any);
  }

  process.env.PI_AGENT_WORKDIR = resolve(seriesDir, "..");

  const opts: AIPipelineOptions = { mode };

  // Run pipeline (unless --check-only)
  if (!checkOnly) {
    const pipelineResult: PipelineResult = await runPipeline(seriesDir, opts);
    if (!pipelineResult.success) {
      exitCi({ status: "PIPELINE_FAILED", exitCode: 1, errors: pipelineResult.errors, steps: pipelineResult.steps } as any);
    }
  }

  // Run quality check
  const checkResult: CheckResult = await runCheck(seriesDir, opts);
  if (!checkResult.success) {
    exitCi({ status: "CHECK_FAILED", exitCode: 1, gateScore: checkResult.gateScore, errors: checkResult.errors } as any);
  }

  // Regression check against baseline
  const outDir = resolve(seriesDir, "storygraph_out");
  const baselinePath = resolve(outDir, "baseline-gate.json");

  if (!existsSync(baselinePath)) {
    // No baseline — report check result without regression
    exitCi({ status: "NO_BASELINE", exitCode: 0, gateScore: checkResult.gateScore, gateDecision: checkResult.gateDecision, note: "Run sg_baseline_update to save a baseline" } as any);
  }

  const baseline = JSON.parse(await import("node:fs").then(fs => fs.readFileSync(baselinePath, "utf-8")));
  const scoreDelta = checkResult.gateScore - baseline.score;
  const regressed = Math.abs(scoreDelta) > threshold;

  exitCi({
    status: regressed ? "REGRESSION" : "OK",
    exitCode: regressed ? 1 : 0,
    baselineScore: baseline.score,
    currentScore: checkResult.gateScore,
    scoreDelta,
    threshold,
    gateDecision: checkResult.gateDecision,
  });
}

if (import.meta.main) {
  main().catch(err => {
    exitCi({ status: "ERROR", exitCode: 1, error: err.message } as any);
  });
}
