/**
 * Tier 2 quality review — Phase 33-D1.
 *
 * Reads gate.json + kg-quality-score.json + merged-graph.json from a series
 * and produces a structured quality-review.json. Designed for Claude Code
 * Tier 2 review or GLM-assisted review.
 *
 * Usage:
 *   bun run storygraph review <series-dir> [--mode ai|hybrid] [--provider zai] [--model glm-5]
 */

import { resolve, basename } from "node:path";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { callAI, parseArgsForAI } from "../ai-client";

// ─── Types ───

interface GateCheck {
  name: string;
  status: "PASS" | "WARN" | "FAIL" | "SKIP";
  score_impact: number;
  fix_suggestion_zhTW: string;
}

interface GateJson {
  version: string;
  timestamp: string;
  series: string;
  genre: string;
  generator: { mode: string; model: string };
  score: number;
  decision: "PASS" | "WARN" | "FAIL";
  previous_score: number | null;
  quality_breakdown: Record<string, number | null>;
  checks: GateCheck[];
  requires_claude_review: boolean;
}

interface ReviewDimension {
  name: string;
  score: number;
  justification: string;
}

interface FixSuggestion {
  target: string;
  action: string;
  priority: "high" | "medium" | "low";
  estimated_impact: number;
}

interface QualityReview {
  version: "1.0";
  timestamp: string;
  series: string;
  genre: string;
  reviewer: { tier: 2; model: string; mode: string };
  decision: "ACCEPT" | "REVIEW" | "REJECT";
  overall_quality: number;
  dimensions: ReviewDimension[];
  fix_suggestions: FixSuggestion[];
  reviewer_notes: string;
  input_gate_score: number;
  input_blended_score: number | null;
  input_node_count: number;
  input_edge_count: number;
}

// ─── Review prompt builder ───

function buildReviewPrompt(
  gate: GateJson,
  qualityData: any | null,
  graphStats: { node_count: number; edge_count: number; node_types: Record<string, number>; communities: number }
): string {
  const warnChecks = gate.checks.filter(c => c.status === "WARN");
  const failChecks = gate.checks.filter(c => c.status === "FAIL");

  const breakdownLines = Object.entries(gate.quality_breakdown)
    .filter(([, v]) => v !== null)
    .map(([dim, v]) => `- ${dim}: ${(v! * 100).toFixed(0)}%`)
    .join("\n");

  const typeLines = Object.entries(graphStats.node_types)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => `- ${type}: ${count}`)
    .join("\n");

  const warnLines = warnChecks.map(c => `- [WARN] ${c.name}`).join("\n");
  const failLines = failChecks.map(c => `- [FAIL] ${c.name}`).join("\n");

  const blendedSection = qualityData?.blended
    ? `Blended score: ${(qualityData.blended.overall * 100).toFixed(1)}%`
    : "(no blended score)";

  return `You are a Tier 2 quality reviewer for a story knowledge graph pipeline.
Evaluate the extraction quality and produce a structured review.

## Series: ${gate.series} (${gate.genre})
## Pipeline Output
- Gate score: ${gate.score}/100 (${gate.decision})
- ${blendedSection}
- Nodes: ${graphStats.node_count}, Edges: ${graphStats.edge_count}, Communities: ${graphStats.communities}
- Node types: ${typeLines}

## Quality Breakdown
${breakdownLines}

## Warnings (${warnChecks.length})
${warnLines || "(none)"}

## Failures (${failChecks.length})
${failLines || "(none)"}

## Review Dimensions (score 0-10 each)

1. **extraction_completeness**: Are key story elements (characters, events, themes) captured?
2. **narrative_coherence**: Do the extracted relationships make narrative sense?
3. **hybrid_value_add**: Did AI extraction (hybrid mode) add meaningful nodes beyond regex?
4. **cross_episode_structure**: Are cross-episode links and communities meaningful?
5. **actionability**: Can a Remotion scene builder use this graph?

## Output Format

Return ONLY a JSON object:
\`\`\`json
{
  "decision": "ACCEPT|REVIEW|REJECT",
  "overall_quality": 7.5,
  "dimensions": [
    { "name": "extraction_completeness", "score": 8, "justification": "..." },
    { "name": "narrative_coherence", "score": 7, "justification": "..." },
    { "name": "hybrid_value_add", "score": 9, "justification": "..." },
    { "name": "cross_episode_structure", "score": 6, "justification": "..." },
    { "name": "actionability", "score": 8, "justification": "..." }
  ],
  "fix_suggestions": [
    { "target": "check_name or dimension", "action": "zh_TW fix description", "priority": "high", "estimated_impact": 15 }
  ],
  "reviewer_notes": "Brief zh_TW narrative summary of strengths and weaknesses"
}
\`\`\`

Rules:
- decision: ACCEPT if overall ≥ 7, REVIEW if 4-6, REJECT if < 4
- fix_suggestions only for WARN/FAIL items or weak dimensions
- Be critical — inflated scores reduce review value
- Return ONLY the JSON object, no other text

Review:`;
}

// ─── Response parsing ───

function parseReviewResponse(raw: string): QualityReview | null {
  try {
    // Strip markdown fences
    let cleaned = raw.trim();
    const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    }

    const parsed = JSON.parse(cleaned);
    if (!parsed.decision || typeof parsed.overall_quality !== "number") {
      return null;
    }

    return {
      version: "1.0",
      timestamp: new Date().toISOString(),
      series: "",
      genre: "",
      reviewer: { tier: 2, model: "", mode: "" },
      decision: parsed.decision,
      overall_quality: parsed.overall_quality,
      dimensions: (parsed.dimensions ?? []).map((d: any) => ({
        name: d.name ?? "",
        score: d.score ?? 0,
        justification: d.justification ?? "",
      })),
      fix_suggestions: (parsed.fix_suggestions ?? []).map((s: any) => ({
        target: s.target ?? "",
        action: s.action ?? "",
        priority: s.priority ?? "medium",
        estimated_impact: s.estimated_impact ?? 0,
      })),
      reviewer_notes: parsed.reviewer_notes ?? "",
      input_gate_score: 0,
      input_blended_score: null,
      input_node_count: 0,
      input_edge_count: 0,
    };
  } catch {
    return null;
  }
}

// ─── Input loading ───

function loadReviewInputs(seriesDir: string): {
  gate: GateJson;
  quality: any | null;
  graphStats: { node_count: number; edge_count: number; node_types: Record<string, number>; communities: number };
  seriesName: string;
  genre: string;
} {
  const outDir = resolve(seriesDir, "storygraph_out");

  // Gate
  const gatePath = resolve(outDir, "gate.json");
  if (!existsSync(gatePath)) {
    throw new Error(`No gate.json found at ${gatePath}`);
  }
  const gate: GateJson = JSON.parse(readFileSync(gatePath, "utf-8"));

  // Quality score (optional)
  const qualityPath = resolve(outDir, "kg-quality-score.json");
  const quality: any | null = existsSync(qualityPath)
    ? JSON.parse(readFileSync(qualityPath, "utf-8"))
    : null;

  // Graph stats
  const mergedPath = resolve(outDir, "merged-graph.json");
  let graphStats = { node_count: 0, edge_count: 0, node_types: {} as Record<string, number>, communities: 0 };
  if (existsSync(mergedPath)) {
    const mg = JSON.parse(readFileSync(mergedPath, "utf-8"));
    const nodeTypes: Record<string, number> = {};
    for (const n of mg.nodes ?? []) {
      nodeTypes[n.type] = (nodeTypes[n.type] ?? 0) + 1;
    }
    graphStats = {
      node_count: mg.nodes?.length ?? 0,
      edge_count: mg.links?.length ?? 0,
      node_types: nodeTypes,
      communities: mg.communities?.length ?? 0,
    };
  }

  return {
    gate,
    quality,
    graphStats,
    seriesName: gate.series ?? basename(seriesDir),
    genre: gate.genre ?? "generic",
  };
}

// ─── Exports (above CLI guard) ───

export { buildReviewPrompt, parseReviewResponse, loadReviewInputs };
export type { QualityReview, ReviewDimension, FixSuggestion, GateJson };

// ─── CLI ───

if (import.meta.main) {
void main();
}

async function main() {
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help")) {
  console.log(`graphify-review — Tier 2 quality review (Phase 33-D1)

Usage:
  bun run storygraph review <series-dir> [--mode ai|hybrid] [--provider zai] [--model glm-5]

Reads gate.json + kg-quality-score.json + merged-graph.json.
Writes storygraph_out/quality-review.json with structured review.
`);
  process.exit(0);
}

const aiConfig = parseArgsForAI(args);
const seriesDir = resolve(args[0]);
if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path.`);
  process.exit(1);
}

console.log(`Loading review inputs from ${seriesDir}...`);

const { gate, quality, graphStats, seriesName, genre } = loadReviewInputs(seriesDir);

console.log(`  Series: ${seriesName}, Genre: ${genre}`);
console.log(`  Gate: ${gate.score}/100 (${gate.decision})`);
console.log(`  Graph: ${graphStats.node_count} nodes, ${graphStats.edge_count} edges`);

const prompt = buildReviewPrompt(gate, quality, graphStats);

if (aiConfig.mode === "regex") {
  // Template-based review (no AI call)
  const review: QualityReview = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    series: seriesName,
    genre,
    reviewer: { tier: 2, model: "template", mode: "regex" },
    decision: gate.score >= 70 ? "ACCEPT" : gate.score >= 40 ? "REVIEW" : "REJECT",
    overall_quality: gate.score / 10,
    dimensions: Object.entries(gate.quality_breakdown)
      .filter(([, v]) => v !== null)
      .map(([name, v]) => ({
        name,
        score: Math.round((v ?? 0) * 10),
        justification: `Programmatic score: ${((v ?? 0) * 100).toFixed(0)}%`,
      })),
    fix_suggestions: gate.checks
      .filter(c => c.status === "FAIL")
      .map(c => ({
        target: c.name,
        action: c.fix_suggestion_zhTW || "Fix required",
        priority: "high" as const,
        estimated_impact: Math.abs(c.score_impact),
      })),
    reviewer_notes: `Template review: gate ${gate.score}/100, ${gate.checks.filter(c => c.status === "FAIL").length} failures`,
    input_gate_score: gate.score,
    input_blended_score: quality?.blended?.overall ?? null,
    input_node_count: graphStats.node_count,
    input_edge_count: graphStats.edge_count,
  };

  const outPath = resolve(seriesDir, "storygraph_out", "quality-review.json");
  writeFileSync(outPath, JSON.stringify(review, null, 2));
  console.log(`\nTemplate review: ${outPath}`);
  return;
}

// AI-based review
console.log(`\nCalling ${aiConfig.provider}/${aiConfig.model}...`);
const aiResult = await callAI(prompt, {
  provider: aiConfig.provider,
  model: aiConfig.model,
  jsonMode: false,
  maxRetries: 1,
});

if (!aiResult) {
  console.error("AI call returned null. Use --mode regex for template review.");
  process.exit(1);
}

const review = parseReviewResponse(aiResult);
if (!review) {
  console.error("Failed to parse AI review response.");
  process.exit(1);
}

// Fill context fields
review.timestamp = new Date().toISOString();
review.series = seriesName;
review.genre = genre;
review.reviewer = { tier: 2, model: aiConfig.model, mode: aiConfig.mode };
review.input_gate_score = gate.score;
review.input_blended_score = quality?.blended?.overall ?? null;
review.input_node_count = graphStats.node_count;
review.input_edge_count = graphStats.edge_count;

const outPath = resolve(seriesDir, "storygraph_out", "quality-review.json");
writeFileSync(outPath, JSON.stringify(review, null, 2));

console.log(`\nReview: ${review.decision} (${review.overall_quality}/10)`);
console.log(`  Dimensions: ${review.dimensions.map(d => `${d.name}=${d.score}`).join(", ")}`);
console.log(`  Fix suggestions: ${review.fix_suggestions.length}`);
console.log(`Output: ${outPath}`);
} // end main()
