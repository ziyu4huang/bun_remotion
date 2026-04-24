/**
 * Importable pipeline API — callable from Hono handlers, CLI, or tests.
 *
 * Wraps storygraph pipeline scripts as async functions with typed options/results.
 * Currently uses subprocess delegation for complex scripts; will migrate to
 * direct imports as scripts are refactored.
 *
 * Usage:
 *   import { runPipeline, runScore } from "./pipeline-api";
 *   const result = await runPipeline({ seriesDir: "/path/to/series" });
 */

import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { callAI } from "./ai-client";
import { buildKGScorePrompt } from "./scripts/subagent-prompt";
import { detectSeries, resolveGenre, discoverEpisodes } from "./scripts/series-config";
import type { StoryGenre } from "./scripts/series-config";

// ─── Shared types ───

export interface AIPipelineOptions {
  mode?: "regex" | "ai" | "hybrid";
  provider?: string;
  model?: string;
}

export interface PipelineResult {
  success: boolean;
  seriesDir: string;
  outputDir: string;
  /** Step results: episode → merge → html → check */
  steps: StepResult[];
  errors: string[];
}

export interface StepResult {
  step: string;
  success: boolean;
  duration_ms: number;
  message?: string;
}

export interface ScoreResult {
  success: boolean;
  seriesDir: string;
  outputPath: string;
  blended: {
    overall: number;
    decision: string;
    formula: string;
  };
  programmatic: {
    score: number;
    decision: string;
  };
  ai: {
    overall: number;
    justification: string;
  } | null;
  errors: string[];
}

export interface CheckResult {
  success: boolean;
  seriesDir: string;
  gatePath: string;
  gateScore: number;
  gateDecision: string;
  checks: Array<{ name: string; status: string; score_impact: number }>;
  errors: string[];
}

export interface PipelineStatusResult {
  hasEpisodeData: boolean;
  hasMergedGraph: boolean;
  hasGate: boolean;
  hasQualityScore: boolean;
  hasHTML: boolean;
  gateScore?: number;
  gateDecision?: string;
  blendedScore?: number;
  blendedDecision?: string;
  episodeCount?: number;
  nodeCount?: number;
  edgeCount?: number;
}

// ─── Pipeline Status (read-only, no subprocess) ───

export function getPipelineStatus(seriesDir: string): PipelineStatusResult {
  const outDir = resolve(seriesDir, "storygraph_out");
  const gatePath = resolve(outDir, "gate.json");
  const mergedPath = resolve(outDir, "merged-graph.json");
  const scorePath = resolve(outDir, "kg-quality-score.json");
  const htmlPath = resolve(outDir, "graph.html");

  const result: PipelineStatusResult = {
    hasEpisodeData: existsSync(resolve(seriesDir, "storygraph_out")),
    hasMergedGraph: existsSync(mergedPath),
    hasGate: existsSync(gatePath),
    hasQualityScore: existsSync(scorePath),
    hasHTML: existsSync(htmlPath),
  };

  if (existsSync(mergedPath)) {
    try {
      const merged = JSON.parse(readFileSync(mergedPath, "utf-8"));
      result.episodeCount = merged.episode_count;
      result.nodeCount = merged.nodes?.length;
      result.edgeCount = merged.links?.length;
    } catch { /* ignore parse errors */ }
  }

  if (existsSync(gatePath)) {
    try {
      const gate = JSON.parse(readFileSync(gatePath, "utf-8"));
      result.gateScore = gate.score;
      result.gateDecision = gate.decision;
    } catch { /* ignore */ }
  }

  if (existsSync(scorePath)) {
    try {
      const score = JSON.parse(readFileSync(scorePath, "utf-8"));
      result.blendedScore = score.blended?.overall;
      result.blendedDecision = score.blended?.decision;
    } catch { /* ignore */ }
  }

  return result;
}

// ─── Score (direct implementation, no subprocess) ───

export async function runScore(seriesDir: string, options?: AIPipelineOptions): Promise<ScoreResult> {
  const errors: string[] = [];
  const outDir = resolve(seriesDir, "storygraph_out");
  const gatePath = resolve(outDir, "gate.json");
  const mergedPath = resolve(outDir, "merged-graph.json");
  const outputPath = resolve(outDir, "kg-quality-score.json");

  if (!existsSync(gatePath)) {
    return { success: false, seriesDir, outputPath, blended: { overall: 0, decision: "REJECT", formula: "N/A" }, programmatic: { score: 0, decision: "FAIL" }, ai: null, errors: ["No gate.json found — run check first"] };
  }

  if (!existsSync(mergedPath)) {
    return { success: false, seriesDir, outputPath, blended: { overall: 0, decision: "REJECT", formula: "N/A" }, programmatic: { score: 0, decision: "FAIL" }, ai: null, errors: ["No merged-graph.json found — run merge first"] };
  }

  const gate = JSON.parse(readFileSync(gatePath, "utf-8"));
  const merged = JSON.parse(readFileSync(mergedPath, "utf-8"));
  const seriesConfig = detectSeries(seriesDir);
  const genre: StoryGenre = seriesConfig ? resolveGenre(seriesConfig) : "generic";

  // Build narration excerpts
  const episodes = discoverEpisodes(seriesDir);
  const narrationExcerpts: Array<{ episode_id: string; text: string }> = [];
  for (const ep of episodes) {
    const narrationPath = resolve(seriesDir, ep.dirname, "scripts", "narration.ts");
    if (existsSync(narrationPath)) {
      const text = readFileSync(narrationPath, "utf-8");
      narrationExcerpts.push({ episode_id: ep.epId, text: text.slice(0, 1000) });
    }
  }

  // Count node types
  const nodeCounts: Record<string, number> = {};
  for (const n of merged.nodes) {
    const t = n.type ?? "unknown";
    nodeCounts[t] = (nodeCounts[t] ?? 0) + 1;
  }

  // Build prompt and call AI
  const prompt = buildKGScorePrompt({
    series_name: seriesConfig?.displayName ?? seriesDir,
    genre,
    episode_count: merged.episode_count ?? episodes.length,
    node_counts: nodeCounts,
    edge_count: merged.links?.length ?? 0,
    link_edge_count: merged.link_edges?.length ?? 0,
    gate_score: gate.score,
    gate_decision: gate.decision,
    quality_breakdown: gate.quality_breakdown ?? {},
    narration_excerpts: narrationExcerpts,
  });

  const provider = options?.provider ?? "zai";
  const model = options?.model ?? "glm-5";

  const aiResult = await callAI(prompt, {
    provider,
    model,
    jsonMode: false,
    maxRetries: 1,
  });

  // Parse AI response
  let aiScore: { dimensions: Record<string, number>; overall: number; justification: string } | null = null;

  if (aiResult) {
    try {
      const jsonMatch = aiResult.match(/```json\s*\n?([\s\S]*?)\n?```/);
      const rawJson = jsonMatch ? jsonMatch[1] : aiResult;
      const parsed = JSON.parse(rawJson);
      if (parsed.dimensions && typeof parsed.overall === "number") {
        aiScore = parsed;
      }
    } catch (e) {
      errors.push(`AI response parse failed: ${e}`);
    }
  }

  // Compute blended score
  const programmaticScore = gate.score / 100;
  const aiOverall = aiScore ? aiScore.overall / 10 : null;
  const blendedOverall = aiOverall !== null
    ? 0.4 * programmaticScore + 0.6 * aiOverall
    : programmaticScore;
  const decision = blendedOverall >= 0.7 ? "ACCEPT" : blendedOverall >= 0.4 ? "REVIEW" : "REJECT";

  const output = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    series: seriesConfig?.seriesId ?? "unknown",
    genre,
    generator: { mode: options?.mode ?? "hybrid", model },
    programmatic: {
      score: gate.score,
      decision: gate.decision,
      quality_breakdown: gate.quality_breakdown ?? {},
    },
    ai: aiScore ? {
      dimensions: aiScore.dimensions,
      overall: aiScore.overall,
      justification: aiScore.justification,
    } : null,
    blended: {
      overall: Math.round(blendedOverall * 1000) / 1000,
      formula: aiOverall !== null ? "0.4 × programmatic + 0.6 × ai" : "programmatic only (AI unavailable)",
      decision,
    },
  };

  const { writeFileSync } = await import("node:fs");
  writeFileSync(outputPath, JSON.stringify(output, null, 2));

  return {
    success: true,
    seriesDir,
    outputPath,
    blended: {
      overall: Math.round(blendedOverall * 1000) / 1000,
      decision,
      formula: output.blended.formula,
    },
    programmatic: {
      score: gate.score,
      decision: gate.decision,
    },
    ai: aiScore ? {
      overall: aiScore.overall,
      justification: aiScore.justification,
    } : null,
    errors,
  };
}

// ─── Pipeline + Check (subprocess wrappers for complex scripts) ───

export async function runPipeline(seriesDir: string, options?: AIPipelineOptions): Promise<PipelineResult> {
  const steps: StepResult[] = [];
  const errors: string[] = [];
  const outDir = resolve(seriesDir, "storygraph_out");
  const scriptDir = resolve(import.meta.dir, "scripts");

  const aiFlags: string[] = [];
  const mode = options?.mode ?? "hybrid";
  if (mode === "ai" || mode === "hybrid") {
    aiFlags.push("--mode", mode, "--provider", options?.provider ?? "zai", "--model", options?.model ?? "glm-5");
  }

  // Step 1: Episode extraction
  const step1Start = Date.now();
  const episodes = discoverEpisodes(seriesDir);
  let step1Ok = true;
  for (const ep of episodes) {
    const epDir = resolve(seriesDir, ep.dirname);
    const result = Bun.spawnSync([
      "bun", "run", resolve(scriptDir, "graphify-episode.ts"),
      epDir, "--series-dir", seriesDir, ...aiFlags,
    ], { stdio: ["inherit", "pipe", "pipe"] });
    if (result.exitCode !== 0) step1Ok = false;
  }
  steps.push({ step: "episode", success: step1Ok, duration_ms: Date.now() - step1Start, message: `${episodes.length} episodes processed` });

  // Step 2: Merge
  const step2Start = Date.now();
  const mergeResult = Bun.spawnSync([
    "bun", "run", resolve(scriptDir, "graphify-merge.ts"), seriesDir,
  ], { stdio: ["inherit", "pipe", "pipe"] });
  steps.push({ step: "merge", success: mergeResult.exitCode === 0, duration_ms: Date.now() - step2Start });

  // Step 3: HTML
  const step3Start = Date.now();
  const htmlResult = Bun.spawnSync([
    "bun", "run", resolve(scriptDir, "gen-story-html.ts"), seriesDir,
  ], { stdio: ["inherit", "pipe", "pipe"] });
  steps.push({ step: "html", success: htmlResult.exitCode === 0, duration_ms: Date.now() - step3Start });

  // Step 4: Check
  const step4Start = Date.now();
  const checkResult = Bun.spawnSync([
    "bun", "run", resolve(scriptDir, "graphify-check.ts"), seriesDir, ...aiFlags,
  ], { stdio: ["inherit", "pipe", "pipe"] });
  steps.push({ step: "check", success: checkResult.exitCode === 0, duration_ms: Date.now() - step4Start });

  if (!step1Ok) errors.push("Episode extraction had failures");
  if (mergeResult.exitCode !== 0) errors.push("Merge failed");
  if (checkResult.exitCode !== 0) errors.push("Check failed");

  return {
    success: errors.length === 0,
    seriesDir,
    outputDir: outDir,
    steps,
    errors,
  };
}

export async function runCheck(seriesDir: string, options?: AIPipelineOptions): Promise<CheckResult> {
  const errors: string[] = [];
  const outDir = resolve(seriesDir, "storygraph_out");
  const gatePath = resolve(outDir, "gate.json");
  const scriptDir = resolve(import.meta.dir, "scripts");

  const aiFlags: string[] = [];
  const mode = options?.mode ?? "hybrid";
  if (mode === "ai" || mode === "hybrid") {
    aiFlags.push("--mode", mode, "--provider", options?.provider ?? "zai", "--model", options?.model ?? "glm-5");
  }

  const result = Bun.spawnSync([
    "bun", "run", resolve(scriptDir, "graphify-check.ts"), seriesDir, ...aiFlags,
  ], { stdio: ["inherit", "pipe", "pipe"] });

  if (!existsSync(gatePath)) {
    return {
      success: false,
      seriesDir,
      gatePath,
      gateScore: 0,
      gateDecision: "FAIL",
      checks: [],
      errors: ["Check completed but no gate.json produced"],
    };
  }

  try {
    const gate = JSON.parse(readFileSync(gatePath, "utf-8"));
    return {
      success: result.exitCode === 0,
      seriesDir,
      gatePath,
      gateScore: gate.score,
      gateDecision: gate.decision,
      checks: (gate.checks ?? []).map((c: any) => ({
        name: c.name,
        status: c.status,
        score_impact: c.score_impact ?? 0,
      })),
      errors,
    };
  } catch (e) {
    return {
      success: false,
      seriesDir,
      gatePath,
      gateScore: 0,
      gateDecision: "FAIL",
      checks: [],
      errors: [`Failed to parse gate.json: ${e}`],
    };
  }
}
