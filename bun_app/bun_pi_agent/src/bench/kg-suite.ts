/**
 * KG quality benchmark wrapper — runs graphify-model-bench for each model.
 *
 * Uses --keep flag so per-model output is preserved in storygraph_out_bench/.
 * After each model run, parses from the bench dir (not storygraph_out/ which gets restored).
 */

import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import type { KGModelResult } from "./report.js";

const REPO_ROOT = resolve(import.meta.dir, "../../../..");
const STORYGRAPH_SCRIPT = resolve(REPO_ROOT, "bun_app/storygraph/src/scripts/graphify-model-bench.ts");

export interface KGSuiteOptions {
  seriesDir: string;
  models: string[];
  runs: number;
  /** Pipeline mode for KG extraction (default: "ai" for model differentiation) */
  mode?: "regex" | "ai" | "hybrid";
  onProgress?: (model: string, index: number, total: number) => void;
}

export async function runKGSuite(options: KGSuiteOptions): Promise<KGModelResult[]> {
  const { seriesDir, models, runs, onProgress } = options;
  const mode = options.mode ?? "ai";
  const results: KGModelResult[] = [];

  for (let i = 0; i < models.length; i++) {
    const fullModel = models[i];
    onProgress?.(fullModel, i, models.length);

    // Strip provider prefix for graphify-model-bench (expects bare names like "glm-5-turbo")
    const bareModel = fullModel.split("/").slice(1).join("/") || fullModel;
    console.log(`  KG bench: ${fullModel} (${i + 1}/${models.length})...`);

    const startMs = Date.now();
    try {
      const result = Bun.spawnSync([
        "bun", "run", STORYGRAPH_SCRIPT,
        seriesDir,
        "--models", bareModel,
        "--runs", String(runs),
        "--mode", mode,
        "--keep",
      ], {
        stdio: ["inherit", "pipe", "pipe"],
        timeout: 300_000, // 5 min per model
      });

      const durationMs = Date.now() - startMs;

      if (result.exitCode !== 0) {
        const stderr = result.stderr ? new TextDecoder().decode(result.stderr) : "";
        results.push({ model: fullModel, gateScore: null, blendedScore: null, nodeCount: 0, edgeCount: 0, durationMs, success: false, error: stderr.slice(0, 200) });
        continue;
      }

      // Parse results from the bench output dir (--keep preserves per-model data)
      const parsed = parseKGResults(seriesDir, bareModel, fullModel, durationMs);
      results.push(parsed);
    } catch (e: any) {
      results.push({ model: fullModel, gateScore: null, blendedScore: null, nodeCount: 0, edgeCount: 0, durationMs: 0, success: false, error: e.message });
    }
  }

  return results;
}

/**
 * Parse KG results from the bench output dir.
 * With --keep, graphify-model-bench saves per-model data to storygraph_out_bench/<model>_run0/.
 */
function parseKGResults(seriesDir: string, bareModel: string, fullModel: string, durationMs: number): KGModelResult {
  // graphify-model-bench uses bare model name for dir: <benchDir>/<bareModel>_run0/
  const benchDir = resolve(seriesDir, "storygraph_out_bench", `${bareModel}_run0`);
  const fallbackDir = resolve(seriesDir, "storygraph_out");
  const outDir = existsSync(benchDir) ? benchDir : fallbackDir;

  let gateScore: number | null = null;
  let blendedScore: number | null = null;
  let nodeCount = 0;
  let edgeCount = 0;

  // Parse gate.json
  const gatePath = resolve(outDir, "gate.json");
  if (existsSync(gatePath)) {
    try {
      const gate = JSON.parse(readFileSync(gatePath, "utf-8"));
      gateScore = gate.overall_score ?? gate.score ?? null;
    } catch { /* skip */ }
  }

  // Parse kg-quality-score.json
  const scorePath = resolve(outDir, "kg-quality-score.json");
  if (existsSync(scorePath)) {
    try {
      const score = JSON.parse(readFileSync(scorePath, "utf-8"));
      blendedScore = score.blended_score ?? score.score ?? null;
    } catch { /* skip */ }
  }

  // Parse merged-graph.json for node/edge counts
  const graphPath = resolve(outDir, "merged-graph.json");
  if (existsSync(graphPath)) {
    try {
      const graph = JSON.parse(readFileSync(graphPath, "utf-8"));
      nodeCount = graph.nodes?.length ?? 0;
      edgeCount = graph.links?.length ?? 0;
    } catch { /* skip */ }
  }

  return {
    model: fullModel,
    gateScore,
    blendedScore,
    nodeCount,
    edgeCount,
    durationMs,
    success: gateScore !== null || nodeCount > 0,
  };
}
