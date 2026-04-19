/**
 * KG quality scoring via AI subagent (Tier 1).
 *
 * Sends merged graph summary + narration excerpts to GLM for quality evaluation.
 * Blends programmatic (gate.json) and AI scores: 0.4 × programmatic + 0.6 × AI.
 *
 * Usage:
 *   bun run src/scripts/graphify-score.ts <series-dir> [options]
 *
 * Options:
 *   --mode regex|ai|hybrid   (default: hybrid)
 *   --provider <name>        (default: zai)
 *   --model <name>           (default: glm-5)
 */

import { resolve } from "node:path";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { callAI, parseArgsForAI } from "../ai-client";
import { buildKGScorePrompt } from "./subagent-prompt";
import { detectSeries, resolveGenre, discoverEpisodes } from "./series-config";
import type { StoryGenre } from "./series-config";

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`graphify-score — AI-based KG quality scoring (Tier 1)

Usage:
  bun run src/scripts/graphify-score.ts <series-dir> [options]

Reads storygraph_out/gate.json + merged-graph.json.
Outputs storygraph_out/kg-quality-score.json.
`);
  process.exit(0);
}

const aiConfig = parseArgsForAI(args);
const seriesDir = resolve(args[0]);
if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path. Use absolute paths.`);
  process.exit(1);
}

const gatePath = resolve(seriesDir, "storygraph_out", "gate.json");
const mergedPath = resolve(seriesDir, "storygraph_out", "merged-graph.json");
const outputPath = resolve(seriesDir, "storygraph_out", "kg-quality-score.json");

if (!existsSync(gatePath)) {
  console.error(`No gate.json found at ${gatePath}`);
  console.error(`Run graphify-check first.`);
  process.exit(1);
}

if (!existsSync(mergedPath)) {
  console.error(`No merged-graph.json found at ${mergedPath}`);
  console.error(`Run graphify-merge first.`);
  process.exit(1);
}

const gate = JSON.parse(readFileSync(gatePath, "utf-8"));
const merged = JSON.parse(readFileSync(mergedPath, "utf-8"));
const seriesConfig = detectSeries(seriesDir);
const genre: StoryGenre = seriesConfig ? resolveGenre(seriesConfig) : "generic";

// ─── Build narration excerpts ───

const episodes = discoverEpisodes(seriesDir);
const narrationExcerpts: Array<{ episode_id: string; text: string }> = [];

for (const ep of episodes) {
  const narrationPath = resolve(seriesDir, ep.dirname, "scripts", "narration.ts");
  if (existsSync(narrationPath)) {
    const text = readFileSync(narrationPath, "utf-8");
    narrationExcerpts.push({ episode_id: ep.epId, text: text.slice(0, 1000) });
  }
}

// ─── Count node types ───

const nodeCounts: Record<string, number> = {};
for (const n of merged.nodes) {
  const t = n.type ?? "unknown";
  nodeCounts[t] = (nodeCounts[t] ?? 0) + 1;
}

// ─── Build prompt and call AI ───

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

console.log(`Calling ${aiConfig.provider}/${aiConfig.model} for KG quality scoring...`);
console.log(`  Series: ${seriesConfig?.seriesId ?? "unknown"}, Genre: ${genre}`);
console.log(`  Episodes: ${episodes.length}, Nodes: ${merged.nodes?.length ?? 0}, Edges: ${merged.links?.length ?? 0}`);

const aiResult = await callAI(prompt, {
  provider: aiConfig.provider,
  model: aiConfig.model,
  jsonMode: false,
  maxRetries: 1,
});

// ─── Parse AI response ───

interface AIDimensionScores {
  entity_accuracy: number;
  relationship_correctness: number;
  completeness: number;
  cross_episode_coherence: number | null;
  actionability: number;
}

interface AIScoreResult {
  dimensions: AIDimensionScores;
  overall: number;
  justification: string;
}

let aiScore: AIScoreResult | null = null;

if (aiResult) {
  try {
    const jsonMatch = aiResult.match(/```json\s*\n?([\s\S]*?)\n?```/);
    const rawJson = jsonMatch ? jsonMatch[1] : aiResult;
    const parsed = JSON.parse(rawJson);

    if (parsed.dimensions && typeof parsed.overall === "number") {
      aiScore = parsed as AIScoreResult;
      console.log(`  AI overall score: ${parsed.overall}/10`);
      console.log(`  Justification: ${(parsed.justification as string)?.slice(0, 100) ?? "N/A"}`);
    } else {
      console.warn(`AI response missing required fields (dimensions, overall)`);
    }
  } catch (e) {
    console.warn(`Failed to parse AI response as JSON: ${e}`);
  }
} else {
  console.warn(`AI call returned null — no API key or network error`);
}

// ─── Compute blended score ───

const programmaticScore = gate.score / 100; // Normalize to 0-1
const aiOverall = aiScore ? aiScore.overall / 10 : null; // Normalize to 0-1

const blendedOverall = aiOverall !== null
  ? 0.4 * programmaticScore + 0.6 * aiOverall
  : programmaticScore;

const decision = blendedOverall >= 0.7 ? "ACCEPT" : blendedOverall >= 0.4 ? "REVIEW" : "REJECT";

const output = {
  version: "1.0",
  timestamp: new Date().toISOString(),
  series: seriesConfig?.seriesId ?? "unknown",
  genre,
  generator: {
    mode: aiConfig.mode,
    model: aiConfig.model,
  },
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

writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`\nKG Quality Score: ${outputPath}`);
console.log(`  Blended: ${(blendedOverall * 100).toFixed(1)}% (${decision})`);
console.log(`  Programmatic: ${gate.score}/100, AI: ${aiOverall !== null ? (aiOverall * 100).toFixed(0) + "%" : "N/A"}`);
