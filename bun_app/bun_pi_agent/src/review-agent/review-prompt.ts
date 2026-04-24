/**
 * Build structured review prompt from pipeline data.
 *
 * Reads gate.json, kg-quality-score.json, merged-graph.json, and narration.ts
 * files. Constructs a JSON-mode prompt for GLM5-turbo.
 */

import { resolve, basename } from "node:path";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import type { GateJson, QualityScoreBlended } from "./types";

export interface ReviewInputData {
  gate: GateJson;
  blendedScore: number | null;
  graphStats: {
    node_count: number;
    edge_count: number;
    node_types: Record<string, number>;
    communities: number;
  };
  narrationExcerpts: { episode: string; text: string }[];
  seriesName: string;
  genre: string;
}

/**
 * Load all review inputs from a series directory.
 */
export function loadReviewInputs(seriesDir: string): ReviewInputData {
  const outDir = resolve(seriesDir, "storygraph_out");

  // Gate
  const gatePath = resolve(outDir, "gate.json");
  if (!existsSync(gatePath)) {
    throw new Error(`No gate.json at ${gatePath}. Run graphify-check first.`);
  }
  const gate: GateJson = JSON.parse(readFileSync(gatePath, "utf-8"));

  // Quality score (optional)
  const qualityPath = resolve(outDir, "kg-quality-score.json");
  let blendedScore: number | null = null;
  if (existsSync(qualityPath)) {
    try {
      const qd = JSON.parse(readFileSync(qualityPath, "utf-8"));
      blendedScore = qd?.blended?.overall ?? null;
    } catch { /* ignore parse errors */ }
  }

  // Graph stats (optional)
  const mergedPath = resolve(outDir, "merged-graph.json");
  const graphStats = {
    node_count: 0,
    edge_count: 0,
    node_types: {} as Record<string, number>,
    communities: 0,
  };
  if (existsSync(mergedPath)) {
    try {
      const mg = JSON.parse(readFileSync(mergedPath, "utf-8"));
      const nodeTypes: Record<string, number> = {};
      for (const n of mg.nodes ?? []) {
        nodeTypes[n.type] = (nodeTypes[n.type] ?? 0) + 1;
      }
      graphStats.node_count = mg.nodes?.length ?? 0;
      graphStats.edge_count = mg.links?.length ?? 0;
      graphStats.node_types = nodeTypes;
      graphStats.communities = mg.communities?.length ?? 0;
    } catch { /* ignore */ }
  }

  // Narration files
  const narrationExcerpts = extractNarrations(seriesDir);

  return {
    gate,
    blendedScore,
    graphStats,
    narrationExcerpts,
    seriesName: gate.series || basename(seriesDir),
    genre: gate.genre || "generic",
  };
}

/**
 * Extract narration text from episode scripts/narration.ts files.
 *
 * Reads as text, regex-extracts `text:` field values from segment arrays.
 * Returns concatenated text per episode.
 */
export function extractNarrations(seriesDir: string): { episode: string; text: string }[] {
  const results: { episode: string; text: string }[] = [];

  try {
    const entries = readdirSync(seriesDir, { withFileTypes: true });
    const episodeDirs = entries
      .filter(e => e.isDirectory() && e.name.includes("-ch"))
      .sort();

    for (const ep of episodeDirs) {
      const narrationPath = resolve(seriesDir, ep.name, "scripts", "narration.ts");
      if (!existsSync(narrationPath)) continue;

      try {
        const raw = readFileSync(narrationPath, "utf-8");
        const segments = raw.match(/text:\s*"([^"]+)"/g) ?? [];
        const texts = segments.map(s => {
          const m = s.match(/text:\s*"(.+)"/);
          return m ? m[1] : "";
        }).filter(Boolean);

        if (texts.length > 0) {
          results.push({ episode: ep.name, text: texts.join("\n") });
        }
      } catch { /* skip unreadable */ }
    }
  } catch { /* series dir unreadable */ }

  return results;
}

/**
 * Build the AI review prompt.
 */
export function buildReviewPrompt(data: ReviewInputData): string {
  const { gate, blendedScore, graphStats, narrationExcerpts, seriesName, genre } = data;

  // Pipeline scores
  const blendedLine = blendedScore !== null
    ? `Blended score: ${(blendedScore * 100).toFixed(1)}%`
    : "(no blended score)";

  // Graph structure
  const typeLines = Object.entries(graphStats.node_types)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => `- ${type}: ${count}`)
    .join("\n");

  // Warnings and failures
  const warnChecks = gate.checks.filter(c => c.status === "WARN");
  const failChecks = gate.checks.filter(c => c.status === "FAIL");
  const warnLines = warnChecks.map(c => `- ${c.name}`).join("\n");
  const failLines = failChecks.map(c => `- ${c.name}: ${c.fix_suggestion_zhTW || "fix required"}`).join("\n");

  // Narration excerpts (latest 3 episodes, truncated to ~4000 chars total)
  const recentNarrations = narrationExcerpts.slice(-3);
  let narrationBlock = recentNarrations
    .map(n => `### ${n.episode}\n${n.text}`)
    .join("\n\n");
  if (narrationBlock.length > 4000) {
    narrationBlock = narrationBlock.slice(0, 4000) + "\n... (truncated)";
  }
  const narrationSection = narrationBlock || "(no narration files found)";

  return `You are a Tier 2 quality reviewer for a narrative video production pipeline.
Evaluate the story and episode quality, then produce a structured review.

## Series: ${seriesName} (${genre})

## Pipeline Scores
- Gate score: ${gate.score}/100 (${gate.decision})
- ${blendedLine}
- Nodes: ${graphStats.node_count}, Edges: ${graphStats.edge_count}, Communities: ${graphStats.communities}
- Node types:
${typeLines || "  (none)"}

## Warnings (${warnChecks.length})
${warnLines || "(none)"}

## Failures (${failChecks.length})
${failLines || "(none)"}

## Narration Excerpts (${narrationExcerpts.length} episodes total, showing latest ${recentNarrations.length})
${narrationSection}

## Review Rubric (score 0-10 each)

1. **semantic_correctness**: Are the story elements logically consistent? No plot holes or contradictions?
2. **creative_quality**: Originality of dialog, humor, and storytelling techniques.
3. **genre_fit**: Does the content match the expected genre conventions (${genre})?
4. **pacing**: Is the story rhythm appropriate? Too rushed or too slow?
5. **character_consistency**: Do characters behave consistently across episodes? Voice consistency?
6. **regression_vs_previous**: Compared to the pipeline scores, has quality improved or regressed?

## Output Format

Return ONLY a JSON object (no markdown, no explanation):
{
  "decision": "APPROVE|APPROVE_WITH_FIXES|REQUEST_RERUN|BLOCK",
  "dimensions": {
    "semantic_correctness": 7,
    "creative_quality": 8,
    "genre_fit": 9,
    "pacing": 6,
    "character_consistency": 7,
    "regression_vs_previous": 5
  },
  "overall": 7.0,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "fix_suggestions": [
    { "target": "area to fix", "suggestion": "zh_TW description of fix", "priority": "high" }
  ],
  "summary_zhTW": "繁體中文總結評語"
}

Decision rules:
- APPROVE if overall >= 7.5
- APPROVE_WITH_FIXES if overall 5.0-7.4
- REQUEST_RERUN if overall 3.0-4.9
- BLOCK if overall < 3.0

Be critical — inflated scores reduce review value. Return ONLY the JSON object.`;
}
