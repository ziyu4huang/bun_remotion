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
import { computeJaccardSimilarity } from "./scripts/story-algorithms";

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

// ─── Suggest types ───

export type SuggestionCategory =
  | "foreshadow_debt" | "flat_arc" | "gag_stagnation" | "missing_interaction"
  | "thematic_gap" | "pacing_issue" | "trait_gap" | "duplicate_risk";

export interface Suggestion {
  category: SuggestionCategory;
  severity: "high" | "medium" | "low";
  description_zhTW: string;
  affectedCharacters: string[];
  affectedEpisodes: string[];
  fixHint?: string;
}

export interface SuggestResult {
  success: boolean;
  seriesDir: string;
  targetEpId?: string;
  genre: string;
  episodeCount: number;
  latestEpisode: string;
  suggestions: Suggestion[];
  storyDebtCount: number;
  errors: string[];
}

// ─── Health types ───

export interface HealthDimension {
  name: string;
  status: "good" | "warn" | "alert";
  summary_zhTW: string;
  score: number | null;
}

export interface HealthResult {
  success: boolean;
  seriesDir: string;
  genre: string;
  episodeCount: number;
  latestEpisode: string;
  gateScore: number;
  gateDecision: string;
  dimensions: HealthDimension[];
  storyDebtCount: number;
  storyDebtItems: string[];
  errors: string[];
}

// ─── Helpers for graph analysis ───

interface GraphMaps {
  nodesMap: Map<string, any>;
  linksBySource: Map<string, any[]>;
  linkEdgesByRelation: Map<string, any[]>;
  episodes: string[];
  genre: StoryGenre;
}

function buildGraphMaps(merged: any, linkEdges: any[]): GraphMaps {
  const nodesMap = new Map<string, any>();
  for (const n of merged.nodes) nodesMap.set(n.id, n);

  const linksBySource = new Map<string, any[]>();
  for (const l of merged.links) {
    const arr = linksBySource.get(l.source) ?? [];
    arr.push(l);
    linksBySource.set(l.source, arr);
  }

  const linkEdgesByRelation = new Map<string, any[]>();
  for (const le of linkEdges) {
    const arr = linkEdgesByRelation.get(le.relation) ?? [];
    arr.push(le);
    linkEdgesByRelation.set(le.relation, arr);
  }

  const episodes = [...new Set((merged.nodes as any[]).map((n: any) => n.episode).filter(Boolean))].sort();

  return { nodesMap, linksBySource, linkEdgesByRelation, episodes, genre: "generic" };
}

function getNeighborIdsFromMaps(nodeId: string, relation: string | undefined, maps: GraphMaps): string[] {
  const neighbors: string[] = [];
  // Check intra-episode links
  if (!relation) {
    for (const l of (maps.nodesMap.size ? [] : [])) { /* no-op */ }
  }
  // Use linksBySource for intra-episode, plus scan all links for bidirectional
  for (const [src, links] of maps.linksBySource) {
    for (const l of links) {
      if (l.source === nodeId && (!relation || l.relation === relation)) neighbors.push(l.target);
    }
  }
  // Also check as target
  const allLinks = [] as any[];
  for (const [, links] of maps.linksBySource) allLinks.push(...links);
  for (const l of allLinks) {
    if (l.target === nodeId && (!relation || l.relation === relation)) neighbors.push(l.source);
  }
  return neighbors;
}

function getTraitsFromMaps(charNodeId: string, maps: GraphMaps): string[] {
  const bySpeaksLike = getNeighborIdsFromMaps(charNodeId, "character_speaks_like", maps);
  const byExhibits = getNeighborIdsFromMaps(charNodeId, "exhibits", maps);
  const allIds = [...new Set([...bySpeaksLike, ...byExhibits])];
  return allIds.map(id => maps.nodesMap.get(id)?.label ?? id);
}

// ─── Analyzers ───

function analyzeForeshadowDebt(merged: any, gate: any, maps: GraphMaps): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const foreshadowNodes = (merged.nodes as any[]).filter((n: any) => n.type === "foreshadow");
  if (foreshadowNodes.length === 0) return suggestions;

  for (const n of foreshadowNodes) {
    const props = n.properties ?? {};
    const paidOff = props.paid_off === "true" || props.paid_off === true;
    if (paidOff) continue;

    const plantedEp = props.planted_episode ?? n.id.split("_foreshadow")[0] ?? "";
    const plantedIdx = maps.episodes.indexOf(plantedEp);
    const overdue = plantedIdx >= 0 ? maps.episodes.length - plantedIdx : 0;

    if (overdue >= 3) {
      suggestions.push({
        category: "foreshadow_debt", severity: "high",
        description_zhTW: `未回收伏筆「${n.label ?? props.description ?? n.id}」已逾期 ${overdue} 集`,
        affectedCharacters: [], affectedEpisodes: [plantedEp],
        fixHint: "在下一集中安排伏筆的回收場景",
      });
    } else if (overdue >= 2) {
      suggestions.push({
        category: "foreshadow_debt", severity: "medium",
        description_zhTW: `伏筆「${n.label ?? props.description ?? n.id}」已種下 ${overdue} 集，尚未回收`,
        affectedCharacters: [], affectedEpisodes: [plantedEp],
      });
    }
  }

  // Also check gate WARN/FAIL foreshadow checks
  const foreshadowChecks = (gate.checks ?? []).filter((c: any) =>
    c.name.startsWith("Foreshadow") && (c.status === "WARN" || c.status === "FAIL")
  );
  if (foreshadowChecks.length > 0 && suggestions.length === 0) {
    suggestions.push({
      category: "foreshadow_debt", severity: "medium",
      description_zhTW: `伏筆追蹤出現 ${foreshadowChecks.length} 個警告`,
      affectedCharacters: [], affectedEpisodes: [],
      fixHint: foreshadowChecks[0].fix_suggestion_zhTW ?? undefined,
    });
  }

  return suggestions;
}

function analyzeFlatArcs(merged: any, gate: any, maps: GraphMaps): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const sameCharLinks = maps.linkEdgesByRelation.get("same_character") ?? [];
  if (sameCharLinks.length === 0) return suggestions;

  // Group by character
  const charInstances = new Map<string, string[]>();
  for (const le of sameCharLinks) {
    const srcChar = le.source.split("_char_")[1]?.split("_")[0] ?? "";
    const tgtChar = le.target.split("_char_")[1]?.split("_")[0] ?? "";
    const charId = srcChar || tgtChar;
    if (!charInstances.has(charId)) charInstances.set(charId, []);
    const set = charInstances.get(charId)!;
    if (!set.includes(le.source)) set.push(le.source);
    if (!set.includes(le.target)) set.push(le.target);
  }

  for (const [charId, instances] of charInstances) {
    if (instances.length < 3) continue;
    instances.sort();

    const perEpisode = instances.map(id => ({
      episode: id.match(/^ch\d+ep\d+/)?.[0] ?? id,
      traits: getTraitsFromMaps(id, maps),
    }));

    if (perEpisode.every(ep => ep.traits.length === 0)) continue;

    // Compute trajectory
    let gained = 0, lost = 0;
    for (let i = 1; i < perEpisode.length; i++) {
      const prev = new Set(perEpisode[i - 1].traits);
      const curr = new Set(perEpisode[i].traits);
      gained += [...curr].filter(t => !prev.has(t)).length;
      lost += [...prev].filter(t => !curr.has(t)).length;
    }
    const total = gained + lost;
    const trajectory = total > 0 ? (gained - lost) / total : 0;

    if (Math.abs(trajectory) < 0.1) {
      const charLabel = (maps.nodesMap.get(instances[0])?.label ?? charId).replace(/\s*\(ch\d+ep\d+\)$/, "");
      suggestions.push({
        category: "flat_arc", severity: "high",
        description_zhTW: `角色「${charLabel}」在 ${instances.length} 集中弧線平坦，缺乏成長變化`,
        affectedCharacters: [charId], affectedEpisodes: perEpisode.map(e => e.episode),
        fixHint: "給角色一個新的挑戰或性格轉變契機",
      });
    }
  }

  // Broader check from quality breakdown
  const cg = gate.quality_breakdown?.character_growth;
  if (cg != null && cg < 0.5 && suggestions.length === 0) {
    suggestions.push({
      category: "flat_arc", severity: "medium",
      description_zhTW: `角色成長評分偏低 (${(cg * 100).toFixed(0)}%)，整體弧線缺乏張力`,
      affectedCharacters: [], affectedEpisodes: [],
    });
  }

  return suggestions;
}

function analyzeGagStagnation(merged: any, gate: any, maps: GraphMaps, genre: StoryGenre): Suggestion[] {
  if (genre !== "galgame_meme") return [];
  const suggestions: Suggestion[] = [];

  const gagNodes = (merged.nodes as any[]).filter((n: any) => n.type === "gag_manifestation");
  const gagByType = new Map<string, string[]>();
  for (const n of gagNodes) {
    const gagType = n.id.split("_gag_")[1] ?? "unknown";
    if (!gagByType.has(gagType)) gagByType.set(gagType, []);
    gagByType.get(gagType)!.push(n.id);
  }

  for (const [gagType, chain] of gagByType) {
    if (chain.length < 2) continue;
    const labels = chain.map(id => maps.nodesMap.get(id)?.label?.split("：")[1] ?? id);

    for (let i = 1; i < labels.length; i++) {
      const a = new Set(labels[i - 1].split(""));
      const b = new Set(labels[i].split(""));
      const intersection = [...a].filter(c => b.has(c)).length;
      const union = new Set([...a, ...b]).size;
      const sim = union > 0 ? intersection / union : 0;

      if (sim > 0.8) {
        const eps = chain.map(id => id.match(/^ch\d+ep\d+/)?.[0] ?? "").filter(Boolean);
        suggestions.push({
          category: "gag_stagnation", severity: "medium",
          description_zhTW: `笑點類型「${gagType}」在最近 ${chain.length} 集中表現形式過於相似`,
          affectedCharacters: [], affectedEpisodes: eps,
          fixHint: "嘗試新的笑點變體或場景轉換",
        });
        break; // one suggestion per gag type
      }
    }
  }

  const ge = gate.quality_breakdown?.gag_evolution;
  if (ge != null && ge < 0.5 && suggestions.length === 0) {
    suggestions.push({
      category: "gag_stagnation", severity: "medium",
      description_zhTW: `笑點演化評分偏低 (${(ge * 100).toFixed(0)}%)，整體笑點多樣性不足`,
      affectedCharacters: [], affectedEpisodes: [],
    });
  }

  return suggestions;
}

function analyzeMissingInteractions(merged: any, gate: any, maps: GraphMaps): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Build co-occurrence and interaction maps
  const charByEpisode = new Map<string, string[]>(); // epId -> [charId, ...]
  for (const n of merged.nodes) {
    if (n.type !== "character_instance") continue;
    const epId = n.id.match(/^ch\d+ep\d+/)?.[0] ?? "";
    const charId = n.properties?.character_id ?? n.id.split("_char_")[1]?.split("_")[0] ?? "";
    if (charId === "narrator") continue;
    if (!charByEpisode.has(epId)) charByEpisode.set(epId, []);
    charByEpisode.get(epId)!.push(charId);
  }

  // Count co-occurrences per pair
  const coOccurrence = new Map<string, number>(); // "charA|charB" -> count
  for (const [, chars] of charByEpisode) {
    const unique = [...new Set(chars)];
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const key = [unique[i], unique[j]].sort().join("|");
        coOccurrence.set(key, (coOccurrence.get(key) ?? 0) + 1);
      }
    }
  }

  // Count interactions per pair
  const interactionCount = new Map<string, number>();
  const interactRelations = new Set(["interacts_with", "involves", "frustrates"]);
  for (const l of merged.links) {
    if (!interactRelations.has(l.relation)) continue;
    const srcChar = maps.nodesMap.get(l.source)?.properties?.character_id ?? l.source.split("_char_")[1]?.split("_")[0] ?? "";
    const tgtChar = maps.nodesMap.get(l.target)?.properties?.character_id ?? l.target.split("_char_")[1]?.split("_")[0] ?? "";
    if (srcChar === "narrator" || tgtChar === "narrator") continue;
    const key = [srcChar, tgtChar].sort().join("|");
    interactionCount.set(key, (interactionCount.get(key) ?? 0) + 1);
  }

  // Find pairs with high co-occurrence but 0 interactions
  for (const [key, count] of coOccurrence) {
    if (count >= 3 && (interactionCount.get(key) ?? 0) === 0) {
      const [charA, charB] = key.split("|");
      const episodes = [...charByEpisode.entries()]
        .filter(([, chars]) => chars.includes(charA) && chars.includes(charB))
        .map(([ep]) => ep);
      suggestions.push({
        category: "missing_interaction", severity: "medium",
        description_zhTW: `角色「${charA}」和「${charB}」在 ${count} 集中同時出現但從未互動`,
        affectedCharacters: [charA, charB], affectedEpisodes: episodes,
        fixHint: "安排兩個角色的對手戲或衝突場景",
      });
    }
  }

  return suggestions;
}

function analyzeThematicGaps(merged: any, gate: any, maps: GraphMaps): Suggestion[] {
  const suggestions: Suggestion[] = [];

  const themeNodes = (merged.nodes as any[]).filter((n: any) => n.type === "theme");
  if (themeNodes.length === 0) return suggestions;

  // Group themes by episode
  const themesByEp = new Map<string, Set<string>>();
  for (const n of themeNodes) {
    const ep = n.episode ?? n.id.match(/^ch\d+ep\d+/)?.[0] ?? "";
    if (!themesByEp.has(ep)) themesByEp.set(ep, new Set());
    themesByEp.get(ep)!.add(n.label);
  }

  // Count singleton themes (appear in only 1 episode)
  const themeFreq = new Map<string, number>();
  for (const [, themes] of themesByEp) {
    for (const t of themes) themeFreq.set(t, (themeFreq.get(t) ?? 0) + 1);
  }
  const singletons = [...themeFreq.entries()].filter(([, count]) => count === 1).map(([t]) => t);

  if (singletons.length > 2) {
    suggestions.push({
      category: "thematic_gap", severity: "low",
      description_zhTW: `${singletons.length} 個主題僅出現在單集中，未形成跨集主題網絡`,
      affectedCharacters: [], affectedEpisodes: [],
      fixHint: `考慮在後續劇情中重現主題：${singletons.slice(0, 3).join("、")}`,
    });
  }

  const tc = gate.quality_breakdown?.thematic_coherence;
  if (tc != null && tc < 0.4) {
    suggestions.push({
      category: "thematic_gap", severity: "medium",
      description_zhTW: `主題連貫性偏低 (${(tc * 100).toFixed(0)}%)，跨集主題關聯不足`,
      affectedCharacters: [], affectedEpisodes: [],
    });
  }

  return suggestions;
}

function analyzePacingIssues(merged: any, gate: any, maps: GraphMaps): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Group scenes by episode
  const scenesByEp = new Map<string, any[]>();
  for (const n of merged.nodes) {
    if (n.type !== "scene") continue;
    const epId = n.id.match(/^ch\d+ep\d+/)?.[0] ?? "";
    if (!epId) continue;
    if (!scenesByEp.has(epId)) scenesByEp.set(epId, []);
    scenesByEp.get(epId)!.push(n);
  }

  // Check latest episode pacing
  const latestEp = maps.episodes[maps.episodes.length - 1];
  if (latestEp && scenesByEp.has(latestEp)) {
    const scenes = scenesByEp.get(latestEp)!;
    if (scenes.length >= 2) {
      const tensions = scenes.map(n => {
        const d = parseInt(n.properties?.dialog_line_count ?? "0", 10);
        const c = parseInt(n.properties?.character_count ?? "0", 10);
        const e = parseInt(n.properties?.effect_count ?? "0", 10);
        return { scene: n.id, tension: d * 0.4 + c * 0.3 + e * 0.3 };
      });
      const maxT = Math.max(...tensions.map(t => t.tension), 1);
      const normalized = tensions.map(t => t.tension / maxT);
      const m = normalized.reduce((a, b) => a + b, 0) / normalized.length;
      const variance = normalized.reduce((s, t) => s + Math.pow(t - m, 2), 0) / normalized.length;

      if (variance < 0.01) {
        suggestions.push({
          category: "pacing_issue", severity: "medium",
          description_zhTW: `最新集 (${latestEp}) 節奏過於平坦，各場景張力相近`,
          affectedCharacters: [], affectedEpisodes: [latestEp],
          fixHint: "調整場景張力分佈：增加高潮場景的對話密度或特效",
        });
      }
    }
  }

  const pc = gate.quality_breakdown?.pacing;
  if (pc != null && pc < 0.5 && suggestions.length === 0) {
    suggestions.push({
      category: "pacing_issue", severity: "low",
      description_zhTW: `節奏評分偏低 (${(pc * 100).toFixed(0)}%)`,
      affectedCharacters: [], affectedEpisodes: [],
    });
  }

  return suggestions;
}

function analyzeTraitGaps(merged: any, gate: any, maps: GraphMaps): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const latestEp = maps.episodes[maps.episodes.length - 1];
  if (!latestEp) return suggestions;

  // Check trait coverage WARNs from gate
  const traitWarns = (gate.checks ?? []).filter((c: any) =>
    c.name === "Trait Coverage" && c.status === "WARN"
  );

  for (const c of traitWarns) {
    const instanceId = c.evidence?.[0] ?? "";
    const charLabel = maps.nodesMap.get(instanceId)?.label ?? instanceId;
    suggestions.push({
      category: "trait_gap", severity: "low",
      description_zhTW: `角色 ${charLabel} 在某集中缺乏性格特徵描寫`,
      affectedCharacters: [charLabel], affectedEpisodes: instanceId ? [instanceId.match(/^ch\d+ep\d+/)?.[0] ?? ""] : [],
      fixHint: c.fix_suggestion_zhTW || "增加角色的標誌性語氣或行為",
    });
  }

  return suggestions;
}

function analyzeDuplicateRisk(merged: any, gate: any, maps: GraphMaps): Suggestion[] {
  const suggestions: Suggestion[] = [];
  if (maps.episodes.length < 3) return suggestions;

  // Check gate for Duplicate Content WARN/FAIL
  const dupChecks = (gate.checks ?? []).filter((c: any) =>
    c.name === "Duplicate Content" && (c.status === "WARN" || c.status === "FAIL")
  );

  for (const c of dupChecks) {
    const eps = c.evidence?.filter((e: string) => e.match(/^ch\d+ep\d+/)) ?? [];
    suggestions.push({
      category: "duplicate_risk",
      severity: c.status === "FAIL" ? "high" : "medium",
      description_zhTW: `劇情結構重複風險：${c.details}`,
      affectedCharacters: [], affectedEpisodes: eps,
      fixHint: "確保新一集使用不同的場景結構、角色組合或情節轉折",
    });
  }

  return suggestions;
}

// ─── runSuggest ───

export function runSuggest(seriesDir: string, targetEpId?: string): SuggestResult {
  const errors: string[] = [];
  const outDir = resolve(seriesDir, "storygraph_out");
  const gatePath = resolve(outDir, "gate.json");
  const mergedPath = resolve(outDir, "merged-graph.json");

  if (!existsSync(gatePath)) {
    return { success: false, seriesDir, targetEpId, genre: "generic", episodeCount: 0, latestEpisode: "", suggestions: [], storyDebtCount: 0, errors: ["No gate.json found — run sg_pipeline first"] };
  }
  if (!existsSync(mergedPath)) {
    return { success: false, seriesDir, targetEpId, genre: "generic", episodeCount: 0, latestEpisode: "", suggestions: [], storyDebtCount: 0, errors: ["No merged-graph.json found — run sg_pipeline first"] };
  }

  let gate: any, merged: any;
  try {
    gate = JSON.parse(readFileSync(gatePath, "utf-8"));
    merged = JSON.parse(readFileSync(mergedPath, "utf-8"));
  } catch (e) {
    return { success: false, seriesDir, targetEpId, genre: "generic", episodeCount: 0, latestEpisode: "", suggestions: [], storyDebtCount: 0, errors: [`Failed to parse artifacts: ${e}`] };
  }

  const linkEdgesPath = resolve(outDir, "link-edges.json");
  const linkEdges = existsSync(linkEdgesPath)
    ? JSON.parse(readFileSync(linkEdgesPath, "utf-8"))
    : [];

  const seriesConfig = detectSeries(seriesDir);
  const genre: StoryGenre = seriesConfig ? resolveGenre(seriesConfig) : "generic";
  const maps = buildGraphMaps(merged, linkEdges);
  maps.genre = genre;

  const episodes = maps.episodes;
  const latestEpisode = episodes[episodes.length - 1] ?? "";

  // Run all analyzers
  const suggestions: Suggestion[] = [
    ...analyzeForeshadowDebt(merged, gate, maps),
    ...analyzeFlatArcs(merged, gate, maps),
    ...analyzeGagStagnation(merged, gate, maps, genre),
    ...analyzeMissingInteractions(merged, gate, maps),
    ...analyzeThematicGaps(merged, gate, maps),
    ...analyzePacingIssues(merged, gate, maps),
    ...analyzeTraitGaps(merged, gate, maps),
    ...analyzeDuplicateRisk(merged, gate, maps),
  ];

  // Sort: high > medium > low, then by category
  const severityOrder = { high: 0, medium: 1, low: 2 };
  const categoryOrder: Record<SuggestionCategory, number> = {
    foreshadow_debt: 0, flat_arc: 1, duplicate_risk: 2, gag_stagnation: 3,
    missing_interaction: 4, pacing_issue: 5, thematic_gap: 6, trait_gap: 7,
  };
  suggestions.sort((a, b) => {
    const sv = severityOrder[a.severity] - severityOrder[b.severity];
    if (sv !== 0) return sv;
    return (categoryOrder[a.category] ?? 99) - (categoryOrder[b.category] ?? 99);
  });

  const storyDebtCount = suggestions.filter(s => s.severity === "high" || s.severity === "medium").length;

  return {
    success: true,
    seriesDir,
    targetEpId: targetEpId ?? undefined,
    genre,
    episodeCount: episodes.length,
    latestEpisode,
    suggestions,
    storyDebtCount,
    errors,
  };
}

// ─── runHealth ───

function dimStatus(score: number | null | undefined): "good" | "warn" | "alert" {
  if (score == null) return "good";
  if (score > 0.7) return "good";
  if (score > 0.4) return "warn";
  return "alert";
}

export function runHealth(seriesDir: string): HealthResult {
  const errors: string[] = [];
  const outDir = resolve(seriesDir, "storygraph_out");
  const gatePath = resolve(outDir, "gate.json");
  const mergedPath = resolve(outDir, "merged-graph.json");

  if (!existsSync(gatePath)) {
    return { success: false, seriesDir, genre: "generic", episodeCount: 0, latestEpisode: "", gateScore: 0, gateDecision: "FAIL", dimensions: [], storyDebtCount: 0, storyDebtItems: [], errors: ["No gate.json found"] };
  }

  let gate: any, merged: any;
  try {
    gate = JSON.parse(readFileSync(gatePath, "utf-8"));
  } catch (e) {
    return { success: false, seriesDir, genre: "generic", episodeCount: 0, latestEpisode: "", gateScore: 0, gateDecision: "FAIL", dimensions: [], storyDebtCount: 0, storyDebtItems: [], errors: [`Failed to parse gate.json: ${e}`] };
  }

  let episodeCount = 0;
  let latestEpisode = "";
  let genre: StoryGenre = "generic";

  if (existsSync(mergedPath)) {
    try {
      merged = JSON.parse(readFileSync(mergedPath, "utf-8"));
      const episodes = [...new Set((merged.nodes as any[]).map((n: any) => n.episode).filter(Boolean))].sort();
      episodeCount = episodes.length;
      latestEpisode = episodes[episodes.length - 1] ?? "";
      const seriesConfig = detectSeries(seriesDir);
      genre = seriesConfig ? resolveGenre(seriesConfig) : "generic";
    } catch { /* ignore */ }
  }

  const qb = gate.quality_breakdown ?? {};

  // Build dimensions
  const dimensions: HealthDimension[] = [];

  // Characters
  const consistency = qb.consistency;
  dimensions.push({
    name: "characters", status: dimStatus(consistency),
    summary_zhTW: consistency != null
      ? `角色一致性 ${(consistency * 100).toFixed(0)}%`
      : "角色一致性未評估",
    score: consistency ?? null,
  });

  // Arc
  const arc = qb.arc_structure;
  dimensions.push({
    name: "arc", status: dimStatus(arc),
    summary_zhTW: arc != null
      ? `劇情弧線 ${(arc * 100).toFixed(0)}%`
      : "劇情弧線未評估",
    score: arc ?? null,
  });

  // Pacing
  const pacing = qb.pacing;
  dimensions.push({
    name: "pacing", status: dimStatus(pacing),
    summary_zhTW: pacing != null
      ? `節奏控制 ${(pacing * 100).toFixed(0)}%`
      : "節奏控制未評估",
    score: pacing ?? null,
  });

  // Themes
  const themes = qb.thematic_coherence;
  dimensions.push({
    name: "themes", status: dimStatus(themes),
    summary_zhTW: themes != null
      ? `主題連貫性 ${(themes * 100).toFixed(0)}%`
      : "主題連貫性未評估",
    score: themes ?? null,
  });

  // Gags (genre-specific)
  if (genre === "galgame_meme") {
    const gags = qb.gag_evolution;
    dimensions.push({
      name: "gags", status: dimStatus(gags),
      summary_zhTW: gags != null
        ? `笑點演化 ${(gags * 100).toFixed(0)}%`
        : "笑點演化未評估",
      score: gags ?? null,
    });
  }

  // Foreshadow
  let foreshadowPaid = 0, foreshadowTotal = 0;
  if (merged) {
    const foreshadowNodes = (merged.nodes as any[]).filter((n: any) => n.type === "foreshadow");
    foreshadowTotal = foreshadowNodes.length;
    foreshadowPaid = foreshadowNodes.filter((n: any) =>
      n.properties?.paid_off === "true" || n.properties?.paid_off === true
    ).length;
  }
  const fStatus = foreshadowTotal === 0 ? "good" as const
    : foreshadowPaid === foreshadowTotal ? "good" as const
    : (foreshadowTotal - foreshadowPaid) >= 2 ? "alert" as const
    : "warn" as const;
  dimensions.push({
    name: "foreshadow", status: fStatus,
    summary_zhTW: foreshadowTotal > 0
      ? `伏筆：${foreshadowPaid}/${foreshadowTotal} 已回收`
      : "無伏筆追蹤資料",
    score: foreshadowTotal > 0 ? foreshadowPaid / foreshadowTotal : null,
  });

  // Compute debt items
  const debtItems: string[] = [];

  // Unpaid foreshadow
  if (foreshadowTotal > foreshadowPaid) {
    debtItems.push(`${foreshadowTotal - foreshadowPaid} 個伏筆尚未回收`);
  }

  // Alert/warn dimensions
  for (const d of dimensions) {
    if (d.status === "alert") debtItems.push(`${d.name}: ${d.summary_zhTW} (嚴重)`);
    else if (d.status === "warn") debtItems.push(`${d.name}: ${d.summary_zhTW}`);
  }

  // Flat arc characters (from suggestions if we run suggest)
  const suggestResult = runSuggest(seriesDir);
  const flatArcs = suggestResult.suggestions.filter(s => s.category === "flat_arc" && s.severity === "high");
  for (const s of flatArcs) {
    debtItems.push(s.description_zhTW);
  }

  return {
    success: true,
    seriesDir,
    genre,
    episodeCount,
    latestEpisode,
    gateScore: gate.score ?? 0,
    gateDecision: gate.decision ?? "FAIL",
    dimensions,
    storyDebtCount: debtItems.length,
    storyDebtItems: debtItems,
    errors,
  };
}
