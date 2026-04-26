import { Type } from "@sinclair/typebox";
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { resolve } from "node:path";
import { existsSync, readFileSync, copyFileSync, readdirSync, statSync } from "node:fs";

// Import pipeline-api from storygraph workspace
import {
  runPipeline,
  runCheck,
  runScore,
  getPipelineStatus,
  runSuggest,
  runHealth,
  type AIPipelineOptions,
  type PipelineResult,
  type CheckResult,
  type ScoreResult,
  type PipelineStatusResult,
  type SuggestResult,
  type HealthResult,
} from "../../../storygraph/src/pipeline-api";

import { getConfig } from "../config.js";

// ─── Helpers ───

function textResult(text: string, details?: unknown): AgentToolResult<unknown> {
  return {
    content: [{ type: "text" as const, text }],
    details: details ?? {},
  };
}

function errorResult(msg: string): AgentToolResult<unknown> {
  return {
    content: [{ type: "text" as const, text: `Error: ${msg}` }],
    details: { error: msg },
  };
}

/** Resolve seriesDir: if relative, join with workDir from config. */
function resolveSeriesDir(seriesDir: string): string {
  const resolved = resolve(seriesDir);
  if (existsSync(resolved)) return resolved;
  return resolve(getConfig().workDir, seriesDir);
}

function parseOptions(opts?: { mode?: string; provider?: string; model?: string }): AIPipelineOptions {
  return {
    mode: (opts?.mode as AIPipelineOptions["mode"]) ?? "hybrid",
    provider: opts?.provider,
    model: opts?.model,
  };
}

// ─── Tool Schemas ───

const seriesDirSchema = Type.Object({
  seriesDir: Type.String({ description: "Path to the Remotion series directory (e.g. bun_remotion_proj/my-core-is-boss)" }),
});

const seriesDirWithOptionsSchema = Type.Object({
  seriesDir: Type.String({ description: "Path to the Remotion series directory" }),
  mode: Type.Optional(Type.String({ description: "Extraction mode: regex, ai, or hybrid (default: hybrid)" })),
  provider: Type.Optional(Type.String({ description: "AI provider (default: zai)" })),
  model: Type.Optional(Type.String({ description: "AI model (default: glm-5)" })),
});

const regressionSchema = Type.Object({
  seriesDir: Type.String({ description: "Path to the Remotion series directory" }),
  threshold: Type.Optional(Type.Number({ description: "Max allowed score delta before flagging regression (default: 10)" })),
  ci: Type.Optional(Type.Boolean({ description: "CI mode: return structured JSON with exitCode in details" })),
});

// ─── Tools ───

export function createStorygraphPipelineTool(): AgentTool<typeof seriesDirWithOptionsSchema> {
  return {
    name: "sg_pipeline",
    label: "Storygraph Pipeline",
    description: "Run the full storygraph pipeline (extract → merge → html → check) on a series directory. Returns step-by-step results with timing.",
    parameters: seriesDirWithOptionsSchema,
    execute: async (_id, params) => {
      try {
        const dir = resolveSeriesDir(params.seriesDir);
        if (!existsSync(dir)) return errorResult(`Series directory not found: ${dir}`);
        const result: PipelineResult = await runPipeline(dir, parseOptions(params));
        return textResult(
          `Pipeline ${result.success ? "succeeded" : "failed"} for ${result.seriesDir}\n` +
          `Steps:\n${result.steps.map(s => `  ${s.step}: ${s.success ? "OK" : "FAIL"} (${s.duration_ms}ms)${s.message ? " — " + s.message : ""}`).join("\n")}` +
          (result.errors.length ? `\nErrors: ${result.errors.join("; ")}` : ""),
          result,
        );
      } catch (e: any) {
        return errorResult(e.message ?? String(e));
      }
    },
  };
}

export function createStorygraphCheckTool(): AgentTool<typeof seriesDirWithOptionsSchema> {
  return {
    name: "sg_check",
    label: "Storygraph Quality Check",
    description: "Run quality gate check on a series. Returns gate.json score, decision (PASS/WARN/FAIL), and individual check results.",
    parameters: seriesDirWithOptionsSchema,
    execute: async (_id, params) => {
      try {
        const dir = resolveSeriesDir(params.seriesDir);
        if (!existsSync(dir)) return errorResult(`Series directory not found: ${dir}`);
        const result: CheckResult = await runCheck(dir, parseOptions(params));
        const checkLines = result.checks.map(c => `  ${c.name}: ${c.status} (impact: ${c.score_impact})`).join("\n");
        return textResult(
          `Check ${result.success ? "passed" : "failed"} — score: ${result.gateScore}, decision: ${result.gateDecision}\n` +
          `Gate: ${result.gatePath}\nChecks:\n${checkLines}` +
          (result.errors.length ? `\nErrors: ${result.errors.join("; ")}` : ""),
          result,
        );
      } catch (e: any) {
        return errorResult(e.message ?? String(e));
      }
    },
  };
}

export function createStorygraphScoreTool(): AgentTool<typeof seriesDirWithOptionsSchema> {
  return {
    name: "sg_score",
    label: "Storygraph Quality Score",
    description: "Calculate blended quality score (programmatic + AI) for a series. Returns overall score, decision, and AI justification.",
    parameters: seriesDirWithOptionsSchema,
    execute: async (_id, params) => {
      try {
        const dir = resolveSeriesDir(params.seriesDir);
        if (!existsSync(dir)) return errorResult(`Series directory not found: ${dir}`);
        const result: ScoreResult = await runScore(dir, parseOptions(params));
        return textResult(
          `Score: ${result.blended.overall} — ${result.blended.decision}\n` +
          `Formula: ${result.blended.formula}\n` +
          `Programmatic: ${result.programmatic.score} (${result.programmatic.decision})` +
          (result.ai ? `\nAI: ${result.ai.overall}/10 — ${result.ai.justification}` : "\nAI: unavailable") +
          (result.errors.length ? `\nErrors: ${result.errors.join("; ")}` : ""),
          result,
        );
      } catch (e: any) {
        return errorResult(e.message ?? String(e));
      }
    },
  };
}

export function createStorygraphStatusTool(): AgentTool<typeof seriesDirSchema> {
  return {
    name: "sg_status",
    label: "Storygraph Pipeline Status",
    description: "Get read-only status of storygraph pipeline outputs for a series. Shows which artifacts exist (merged graph, gate, score, HTML) without running anything.",
    parameters: seriesDirSchema,
    execute: async (_id, params) => {
      try {
        const dir = resolveSeriesDir(params.seriesDir);
        if (!existsSync(dir)) return errorResult(`Series directory not found: ${dir}`);
        const status: PipelineStatusResult = getPipelineStatus(dir);
        return textResult(
          `Status for ${params.seriesDir}:\n` +
          `  Episode data: ${status.hasEpisodeData ? "YES" : "NO"}\n` +
          `  Merged graph: ${status.hasMergedGraph ? "YES" : "NO"}${status.nodeCount ? ` (${status.nodeCount} nodes, ${status.edgeCount} edges)` : ""}\n` +
          `  Gate: ${status.hasGate ? `YES (score: ${status.gateScore}, ${status.gateDecision})` : "NO"}\n` +
          `  Quality score: ${status.hasQualityScore ? `YES (${status.blendedScore}, ${status.blendedDecision})` : "NO"}\n` +
          `  HTML: ${status.hasHTML ? "YES" : "NO"}` +
          (status.episodeCount ? `\n  Episodes: ${status.episodeCount}` : ""),
          status,
        );
      } catch (e: any) {
        return errorResult(e.message ?? String(e));
      }
    },
  };
}

export function createStorygraphRegressionTool(): AgentTool<typeof regressionSchema> {
  return {
    name: "sg_regression",
    label: "Storygraph Regression Check",
    description: "Compare current pipeline results against stored baselines. Flags regression if score delta exceeds threshold.",
    parameters: regressionSchema,
    execute: async (_id, params) => {
      try {
        const dir = resolveSeriesDir(params.seriesDir);
        if (!existsSync(dir)) return errorResult(`Series directory not found: ${dir}`);
        const threshold = params.threshold ?? 10;

        const outDir = resolve(dir, "storygraph_out");
        const baselinePath = resolve(outDir, "baseline-gate.json");
        const currentGatePath = resolve(outDir, "gate.json");

        if (!existsSync(baselinePath)) {
          if (params.ci) {
            return textResult(JSON.stringify({
              status: "NO_BASELINE",
              exitCode: 0,
              note: `Run sg_baseline_update to save a baseline at ${baselinePath}`,
            }, null, 2), { hasBaseline: false, exitCode: 0 });
          }
          return textResult(
            `No baseline found at ${baselinePath}. Run sg_pipeline first, then save a baseline with the bash tool:\n` +
            `  cp ${currentGatePath} ${baselinePath}`,
            { hasBaseline: false },
          );
        }

        if (!existsSync(currentGatePath)) {
          if (params.ci) {
            return textResult(JSON.stringify({
              status: "NO_GATE",
              exitCode: 1,
              error: "No current gate.json found — run sg_pipeline or sg_check first",
            }, null, 2), { exitCode: 1 });
          }
          return errorResult(`No current gate.json found — run sg_pipeline or sg_check first`);
        }

        const baseline = JSON.parse(readFileSync(baselinePath, "utf-8"));
        const current = JSON.parse(readFileSync(currentGatePath, "utf-8"));

        const scoreDelta = current.score - baseline.score;
        const regressed = Math.abs(scoreDelta) > threshold;
        const direction = scoreDelta > 0 ? "improvement" : "regression";

        const details = {
          baselineScore: baseline.score,
          currentScore: current.score,
          scoreDelta,
          threshold,
          regressed,
          direction,
          baselineChecks: baseline.checks?.length ?? 0,
          currentChecks: current.checks?.length ?? 0,
          ...(params.ci ? { exitCode: regressed ? 1 : 0 } : {}),
        };

        // Per-check comparison
        const checkDeltas: string[] = [];
        const baselineChecks = new Map<string, any>((baseline.checks ?? []).map((c: any) => [c.name as string, c]));
        for (const cur of (current.checks ?? []) as any[]) {
          const prev = baselineChecks.get(cur.name as string);
          if (prev && cur.score_impact !== prev.score_impact) {
            const delta = cur.score_impact - prev.score_impact;
            checkDeltas.push(`  ${cur.name}: ${prev.score_impact} → ${cur.score_impact} (${delta > 0 ? "+" : ""}${delta})`);
          }
        }

        if (params.ci) {
          const ciResult = {
            status: regressed ? "REGRESSION" : "OK",
            baselineScore: baseline.score,
            currentScore: current.score,
            scoreDelta,
            threshold,
            checkDeltas: checkDeltas.length ? checkDeltas : undefined,
            exitCode: regressed ? 1 : 0,
          };
          return textResult(JSON.stringify(ciResult, null, 2), details);
        }

        return textResult(
          `Regression check: ${regressed ? "FLAGGED" : "OK"}\n` +
          `Baseline score: ${baseline.score} → Current: ${current.score} (delta: ${scoreDelta > 0 ? "+" : ""}${scoreDelta}, ${direction})\n` +
          `Threshold: ${threshold}` +
          (checkDeltas.length ? `\nCheck changes:\n${checkDeltas.join("\n")}` : "\nNo individual check changes."),
          details,
        );
      } catch (e: any) {
        return errorResult(e.message ?? String(e));
      }
    },
  };
}

const baselineUpdateSchema = Type.Object({
  seriesDir: Type.String({ description: "Path to the Remotion series directory" }),
});

const baselineListSchema = Type.Object({
  searchDir: Type.Optional(Type.String({ description: "Parent directory to search for series (default: bun_remotion_proj under workDir)" })),
});

export function createStorygraphBaselineUpdateTool(): AgentTool<typeof baselineUpdateSchema> {
  return {
    name: "sg_baseline_update",
    label: "Storygraph Baseline Update",
    description: "Save current gate.json as the new baseline for regression comparison. Overwrites existing baseline.",
    parameters: baselineUpdateSchema,
    execute: async (_id, params) => {
      try {
        const dir = resolveSeriesDir(params.seriesDir);
        if (!existsSync(dir)) return errorResult(`Series directory not found: ${dir}`);

        const outDir = resolve(dir, "storygraph_out");
        const currentGatePath = resolve(outDir, "gate.json");
        const baselinePath = resolve(outDir, "baseline-gate.json");

        if (!existsSync(currentGatePath)) {
          return errorResult(`No current gate.json found — run sg_pipeline or sg_check first`);
        }

        const gate = JSON.parse(readFileSync(currentGatePath, "utf-8"));
        copyFileSync(currentGatePath, baselinePath);

        return textResult(
          `Baseline updated for ${params.seriesDir}\n` +
          `Score: ${gate.score}, Decision: ${gate.decision}\n` +
          `Baseline saved to: ${baselinePath}`,
          { baselineScore: gate.score, baselineDecision: gate.decision, baselinePath },
        );
      } catch (e: any) {
        return errorResult(e.message ?? String(e));
      }
    },
  };
}

export function createStorygraphBaselineListTool(): AgentTool<typeof baselineListSchema> {
  return {
    name: "sg_baseline_list",
    label: "Storygraph Baseline List",
    description: "List all series with stored baselines. Shows baseline scores, dates, and whether current results differ.",
    parameters: baselineListSchema,
    execute: async (_id, params) => {
      try {
        const config = getConfig();
        const searchDir = params.searchDir
          ? resolveSeriesDir(params.searchDir)
          : resolve(config.workDir, "bun_remotion_proj");

        if (!existsSync(searchDir)) {
          return errorResult(`Search directory not found: ${searchDir}`);
        }

        // Discover series directories (contain PLAN.md)
        const entries = readdirSync(searchDir).filter(e => {
          const full = resolve(searchDir, e);
          return statSync(full).isDirectory() && existsSync(resolve(full, "PLAN.md"));
        });

        if (entries.length === 0) {
          return textResult(`No series found in ${searchDir}`, { series: [] });
        }

        const series: Array<{
          name: string;
          dir: string;
          hasBaseline: boolean;
          baselineScore?: number;
          baselineDate?: string;
          currentScore?: number;
          delta?: number;
        }> = [];

        for (const name of entries) {
          const dir = resolve(searchDir, name);
          const outDir = resolve(dir, "storygraph_out");
          const baselinePath = resolve(outDir, "baseline-gate.json");
          const currentGatePath = resolve(outDir, "gate.json");

          const info: typeof series[number] = { name, dir, hasBaseline: false };

          if (existsSync(baselinePath)) {
            info.hasBaseline = true;
            const baseline = JSON.parse(readFileSync(baselinePath, "utf-8"));
            info.baselineScore = baseline.score;
            info.baselineDate = baseline.timestamp ?? "unknown";

            if (existsSync(currentGatePath)) {
              const current = JSON.parse(readFileSync(currentGatePath, "utf-8"));
              info.currentScore = current.score;
              info.delta = current.score - baseline.score;
            }
          }

          series.push(info);
        }

        const lines = series.map(s => {
          const score = s.hasBaseline
            ? `baseline: ${s.baselineScore}${s.currentScore != null ? `, current: ${s.currentScore} (delta: ${s.delta! > 0 ? "+" : ""}${s.delta})` : ", no current"}`
            : "no baseline";
          return `  ${s.name}: ${score}`;
        });

        return textResult(
          `Series baselines in ${searchDir} (${series.length} series):\n${lines.join("\n")}`,
          { series },
        );
      } catch (e: any) {
        return errorResult(e.message ?? String(e));
      }
    },
  };
}

// ─── Suggest + Health tools ───

const suggestSchema = Type.Object({
  seriesDir: Type.String({ description: "Path to the Remotion series directory" }),
  targetEpId: Type.Optional(Type.String({ description: "Target episode ID for suggestions (e.g. 'ch3ep2'). Defaults to episode after the latest." })),
});

export function createStorygraphSuggestTool(): AgentTool<typeof suggestSchema> {
  return {
    name: "sg_suggest",
    label: "Storygraph Story Suggestions",
    description: "Analyze existing storygraph data and return prioritized suggestions for the next episode. Identifies unpaid foreshadowing, flat character arcs, gag stagnation, missing interactions, and other story debt. No pipeline run needed — reads existing artifacts.",
    parameters: suggestSchema,
    execute: async (_id, params) => {
      try {
        const dir = resolveSeriesDir(params.seriesDir);
        if (!existsSync(dir)) return errorResult(`Series directory not found: ${dir}`);
        const result: SuggestResult = runSuggest(dir, params.targetEpId);
        if (!result.success) return errorResult(result.errors.join("; "));

        const lines = [
          `Story Suggestions for ${params.seriesDir} (${result.genre}, ${result.episodeCount} episodes, latest: ${result.latestEpisode})`,
          result.targetEpId ? `Target: ${result.targetEpId}` : "",
          `Story Debt: ${result.storyDebtCount} items (high/medium severity)`,
          "",
        ];

        for (let i = 0; i < result.suggestions.length; i++) {
          const s = result.suggestions[i];
          lines.push(`${i + 1}. [${s.severity.toUpperCase()}] ${s.category} — ${s.description_zhTW}`);
          if (s.affectedCharacters.length) lines.push(`   Characters: ${s.affectedCharacters.join(", ")}`);
          if (s.affectedEpisodes.length) lines.push(`   Episodes: ${s.affectedEpisodes.join(", ")}`);
          if (s.fixHint) lines.push(`   Hint: ${s.fixHint}`);
        }

        if (result.suggestions.length === 0) {
          lines.push("No story debt detected — series is healthy!");
        }

        return textResult(lines.join("\n"), result);
      } catch (e: any) {
        return errorResult(e.message ?? String(e));
      }
    },
  };
}

export function createStorygraphHealthTool(): AgentTool<typeof seriesDirSchema> {
  return {
    name: "sg_health",
    label: "Storygraph Story Health",
    description: "Quick health dashboard for a series. Returns per-dimension status (characters, arc, pacing, themes, gags, foreshadow) with story debt count. No pipeline run needed.",
    parameters: seriesDirSchema,
    execute: async (_id, params) => {
      try {
        const dir = resolveSeriesDir(params.seriesDir);
        if (!existsSync(dir)) return errorResult(`Series directory not found: ${dir}`);
        const result: HealthResult = runHealth(dir);
        if (!result.success) return errorResult(result.errors.join("; "));

        const lines = [
          `Story Health: ${params.seriesDir} — Gate: ${result.gateScore}/100 (${result.gateDecision})`,
          `Episodes: ${result.episodeCount} | Latest: ${result.latestEpisode}`,
          "",
        ];

        for (const d of result.dimensions) {
          const icon = d.status === "good" ? "✅" : d.status === "warn" ? "⚠️" : "🚨";
          const scoreStr = d.score != null ? ` (${(d.score * 100).toFixed(0)}%)` : "";
          lines.push(`  ${icon} ${d.name.padEnd(12)} ${d.status.toUpperCase()}${scoreStr} — ${d.summary_zhTW}`);
        }

        lines.push("");
        lines.push(`Story Debt: ${result.storyDebtCount} items`);
        for (const item of result.storyDebtItems) {
          lines.push(`  - ${item}`);
        }

        return textResult(lines.join("\n"), result);
      } catch (e: any) {
        return errorResult(e.message ?? String(e));
      }
    },
  };
}

/** Create all storygraph agent tools. */
export function createStorygraphTools(): AgentTool<any>[] {
  return [
    createStorygraphPipelineTool(),
    createStorygraphCheckTool(),
    createStorygraphScoreTool(),
    createStorygraphStatusTool(),
    createStorygraphRegressionTool(),
    createStorygraphBaselineUpdateTool(),
    createStorygraphBaselineListTool(),
    createStorygraphSuggestTool(),
    createStorygraphHealthTool(),
  ];
}
