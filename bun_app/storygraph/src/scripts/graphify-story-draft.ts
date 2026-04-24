/**
 * Story Draft Generator — AI-generated zh_TW dialog from KG constraints.
 *
 * Phase 33-F3: Generate a story draft using GLM, then self-evaluate quality.
 *
 * Usage:
 *   bun run storygraph story-draft <series-dir> [options]
 *
 * Options:
 *   --target-ep <epId>    Target episode ID (e.g., ch2ep1). Required.
 *   --scenes <n>          Target scene count (default: 5)
 *   --duration <sec>      Target duration in seconds (default: 45)
 *   --evaluate            Also run quality evaluation on the draft
 *   --out <path>          Output file path (default: storygraph_out/story-draft-<epId>.json)
 *   --provider <p>        AI provider (default: zai)
 *   --model <m>           AI model (default: glm-5)
 */

import { resolve, dirname } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { callAI, parseArgsForAI } from "../ai-client";
import { getSeriesConfigOrThrow } from "./series-config";
import type { SeriesConfig } from "./series-config";
import {
  buildStoryDraftPrompt,
  buildStoryQualityPrompt,
  parseStoryDraftResponse,
  parseStoryQualityResponse,
  type StoryDraftConstraints,
  type StoryDraft,
  type StoryQualityResult,
} from "./subagent-prompt";

// ─── Main ───

export async function generateStoryDraft(
  seriesDir: string,
  targetEp: string,
  opts: {
    scenes?: number;
    duration?: number;
    evaluate?: boolean;
    provider?: string;
    model?: string;
    outPath?: string;
  } = {},
): Promise<{ draft: StoryDraft; quality?: StoryQualityResult }> {
  const config = getSeriesConfigOrThrow(seriesDir);
  const outDir = resolve(seriesDir, "storygraph_out");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const constraints = buildConstraints(seriesDir, targetEp, config, opts);

  console.log(`[story-draft] Generating draft for ${targetEp}...`);
  const prompt = buildStoryDraftPrompt(constraints);

  const raw = await callAI(prompt, {
    provider: opts.provider ?? "zai",
    model: opts.model ?? "glm-5",
    jsonMode: true,
    maxTokens: 8192,
    timeout: 120_000,
  });

  if (!raw) throw new Error("AI returned no response for story draft");

  const draft = parseStoryDraftResponse(raw);
  console.log(`[story-draft] Generated: "${draft.title}" with ${draft.scenes.length} scenes, ${totalDialogLines(draft)} dialog lines`);

  // Self-evaluation
  let quality: StoryQualityResult | undefined;
  if (opts.evaluate) {
    console.log(`[story-draft] Running quality evaluation...`);
    quality = await evaluateDraft(constraints, draft, opts);
    console.log(`[story-draft] Quality: ${quality.overall}/10`);
    for (const [dim, score] of Object.entries(quality.dimensions)) {
      console.log(`  ${dim}: ${score}/10`);
    }
  }

  // Write output
  const outPath = opts.outPath ?? resolve(outDir, `story-draft-${targetEp}.json`);
  const output = { draft, quality: quality ?? null, constraints_summary: summarizeConstraints(constraints) };
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`[story-draft] Written to ${outPath}`);

  return { draft, quality };
}

async function evaluateDraft(
  constraints: StoryDraftConstraints,
  draft: StoryDraft,
  opts: { provider?: string; model?: string },
): Promise<StoryQualityResult> {
  const qualityInput = {
    series_name: constraints.series_name,
    genre: constraints.genre,
    episode_id: constraints.episode_id,
    draft_json: JSON.stringify(draft),
    constraints_summary: summarizeConstraints(constraints),
  };

  const prompt = buildStoryQualityPrompt(qualityInput);
  const raw = await callAI(prompt, {
    provider: opts.provider ?? "zai",
    model: opts.model ?? "glm-5",
    jsonMode: true,
    maxTokens: 4096,
    timeout: 60_000,
  });

  if (!raw) {
    return {
      dimensions: {},
      overall: 0,
      strengths: [],
      weaknesses: ["AI evaluation returned no response"],
      suggestions: ["Re-run with --evaluate flag"],
    };
  }

  return parseStoryQualityResponse(raw);
}

function buildConstraints(
  seriesDir: string,
  targetEp: string,
  config: SeriesConfig,
  opts: { scenes?: number; duration?: number },
): StoryDraftConstraints {
  // Extract character list from series config
  const characters = Object.entries(config.charNames).map(([id, name]) => {
    // Determine side from id heuristics
    const side = id === "narrator" ? "center" as const : "left" as const;
    return {
      id,
      name,
      side,
      voice: "default",
      traits: extractTraits(config, id),
    };
  });

  // Load previous episode summary from KG if available
  const prevSummary = loadPrevSummary(seriesDir, targetEp);
  const foreshadowing = loadForeshadowing(seriesDir);
  const charConstraints = loadCharacterConstraints(seriesDir);
  const gagHistory = loadGagHistory(seriesDir);

  const genre = config.genre ?? "generic";
  const category = detectCategory(genre);

  return {
    series_name: config.displayName,
    genre,
    category,
    episode_id: targetEp,
    episode_title: `${config.displayName} ${targetEp}`,
    target_scenes: opts.scenes ?? 5,
    target_duration_sec: opts.duration ?? 45,
    characters,
    prev_episode_summary: prevSummary,
    active_foreshadowing: foreshadowing,
    character_constraints: charConstraints,
    gag_history: gagHistory,
    thematic_requirements: [],
  };
}

function extractTraits(config: SeriesConfig, charId: string): string[] {
  const patterns = config.traitPatterns?.[charId];
  if (!patterns) return [];
  return patterns.map(p => p.trait);
}

function detectCategory(genre: string): string {
  if (genre === "galgame_meme") return "galgame_vn";
  return "narrative_drama";
}

function loadPrevSummary(seriesDir: string, targetEp: string): string {
  // Try reading from merged graph's episode_plot nodes
  const mergedPath = resolve(seriesDir, "storygraph_out", "merged-graph.json");
  if (!existsSync(mergedPath)) return "";

  try {
    const merged = JSON.parse(readFileSync(mergedPath, "utf-8"));
    const plots = (merged.nodes ?? []).filter(
      (n: any) => n.type === "episode_plot" && n.id !== `${targetEp}_plot`,
    );
    if (plots.length === 0) return "";
    // Return the last episode plot as summary
    const last = plots[plots.length - 1];
    return last.label ?? last.id ?? "";
  } catch {
    return "";
  }
}

function loadForeshadowing(seriesDir: string): string[] {
  const path = resolve(seriesDir, "storygraph_out", "foreshadow-output.json");
  if (!existsSync(path)) return [];
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    return (data.planted ?? [])
      .filter((f: any) => !f.paid_off)
      .map((f: any) => `${f.id}: ${f.description}`);
  } catch {
    return [];
  }
}

function loadCharacterConstraints(seriesDir: string): string[] {
  const path = resolve(seriesDir, "storygraph_out", "calibration-report.json");
  if (!existsSync(path)) return [];
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    return (data.recommendations ?? []).slice(0, 5);
  } catch {
    return [];
  }
}

function loadGagHistory(seriesDir: string): string[] {
  const path = resolve(seriesDir, "storygraph_out", "merged-graph.json");
  if (!existsSync(path)) return [];
  try {
    const merged = JSON.parse(readFileSync(path, "utf-8"));
    return (merged.nodes ?? [])
      .filter((n: any) => n.type === "gag_manifestation")
      .map((n: any) => `${n.id}: ${n.label}`);
  } catch {
    return [];
  }
}

function summarizeConstraints(c: StoryDraftConstraints): string {
  return [
    `系列：${c.series_name}（${c.genre}）`,
    `集數：${c.episode_id}`,
    `場景：${c.target_scenes}，時長：${c.target_duration_sec}s`,
    `角色：${c.characters.map(ch => ch.name).join("、")}`,
    c.prev_episode_summary ? `前情：${c.prev_episode_summary}` : "",
    c.active_foreshadowing.length > 0 ? `伏筆：${c.active_foreshadowing.join("；")}` : "",
  ].filter(Boolean).join("\n");
}

function totalDialogLines(draft: StoryDraft): number {
  return draft.scenes.reduce((sum, s) => sum + s.dialog.length, 0);
}

// ─── CLI ───

if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`graphify-story-draft — AI-generated story draft from KG constraints

Usage:
  bun run storygraph story-draft <series-dir> --target-ep <epId> [options]

Options:
  --target-ep <epId>    Target episode ID (e.g., ch2ep1). Required.
  --scenes <n>          Target scene count (default: 5)
  --duration <sec>      Target duration in seconds (default: 45)
  --evaluate            Also run quality evaluation on the draft
  --provider <p>        AI provider (default: zai)
  --model <m>           AI model (default: glm-5)
  --out <path>          Output file path

Output:
  storygraph_out/story-draft-<epId>.json
`);
    process.exit(0);
  }

  const seriesDir = resolve(args[0]);

  const epIdx = args.indexOf("--target-ep");
  if (epIdx === -1 || !args[epIdx + 1]) {
    console.error("Error: --target-ep <epId> is required");
    process.exit(1);
  }
  const targetEp = args[epIdx + 1];

  const scenesIdx = args.indexOf("--scenes");
  const scenes = scenesIdx >= 0 ? parseInt(args[scenesIdx + 1], 10) : undefined;

  const durIdx = args.indexOf("--duration");
  const duration = durIdx >= 0 ? parseInt(args[durIdx + 1], 10) : undefined;

  const evaluate = args.includes("--evaluate");
  const aiArgs = parseArgsForAI(args);

  const outIdx = args.indexOf("--out");
  const outPath = outIdx >= 0 ? resolve(args[outIdx + 1]) : undefined;

  generateStoryDraft(seriesDir, targetEp, {
    scenes,
    duration,
    evaluate,
    provider: aiArgs.provider,
    model: aiArgs.model,
    outPath,
  }).catch((err: any) => {
    console.error(`[story-draft] Error: ${err.message}`);
    process.exit(1);
  });
}
