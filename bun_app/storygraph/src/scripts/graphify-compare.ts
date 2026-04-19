/**
 * Mode comparison: runs pipeline in regex/ai/hybrid modes and compares results.
 *
 * For each mode, runs the full pipeline (episode → merge → html → check),
 * saves output to a mode-specific directory, then compares node/edge counts,
 * exclusive types, and quality metrics across modes.
 *
 * Usage:
 *   bun run src/scripts/graphify-compare.ts <series-dir> [options]
 *
 * Options:
 *   --provider <name>   AI provider (default: zai)
 *   --model <name>      AI model (default: glm-4.7-flash)
 *   --keep              Keep per-mode output dirs (default: clean up after compare)
 *   --modes <list>      Comma-separated modes to compare (default: regex,ai,hybrid)
 */

import { resolve, basename } from "node:path";
import { existsSync, mkdirSync, writeFileSync, readFileSync, renameSync, rmSync, cpSync } from "node:fs";
import { parseArgsForAI } from "../ai-client";
import { detectSeries, resolveScoringProfile } from "./series-config";

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`graphify-compare — Compare extraction modes (regex/ai/hybrid)

Usage:
  bun run src/scripts/graphify-compare.ts <series-dir> [options]

Options:
  --provider <name>   AI provider (default: zai)
  --model <name>      AI model (default: glm-4.7-flash)
  --keep              Keep per-mode output dirs (default: clean up after compare)
  --modes <list>      Comma-separated modes to compare (default: regex,ai,hybrid)

Output:
  storygraph_out_compare/comparison-report.md
  storygraph_out/ restored from best-scoring mode
`);
  process.exit(0);
}

const keep = args.includes("--keep");
const aiConfig = parseArgsForAI(args);
const seriesDir = resolve(args[0]);

if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path.`);
  process.exit(1);
}

const seriesConfig = detectSeries(seriesDir);
const scoringProfile = seriesConfig ? resolveScoringProfile(seriesConfig) : null;

// Parse --modes
let modesToCompare: string[] = ["regex", "ai", "hybrid"];
const modesIdx = args.indexOf("--modes");
if (modesIdx !== -1 && args[modesIdx + 1]) {
  modesToCompare = args[modesIdx + 1].split(",").map(m => m.trim()).filter(m => ["regex", "ai", "hybrid"].includes(m));
}

const scriptDir = resolve(import.meta.dir);
const outDir = resolve(seriesDir, "storygraph_out");
const compareDir = resolve(seriesDir, "storygraph_out_compare");

console.log(`=== Mode Comparison ===`);
console.log(`Series: ${seriesDir}`);
console.log(`Modes: ${modesToCompare.join(", ")}`);
if (modesToCompare.includes("ai") || modesToCompare.includes("hybrid")) {
  console.log(`AI: ${aiConfig.provider}/${aiConfig.model}`);
}
console.log();

// ─── Types ───

interface ModeStats {
  mode: string;
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<string, number>;
  edgesByRelation: Record<string, number>;
  exclusiveTypes: string[];
  passCount: number;
  warnCount: number;
  failCount: number;
  perEpisode: Record<string, { nodes: number; edges: number; nodesByType: Record<string, number> }>;
  score: number;
  aiScore: number | null;
  aiBlended: number | null;
  aiDecision: string | null;
  aiJustification: string | null;
}

// ─── Step 1: Run pipeline for each mode ───

const modeStats: ModeStats[] = [];

for (const mode of modesToCompare) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Running pipeline in ${mode.toUpperCase()} mode...`);
  console.log(`${"=".repeat(50)}\n`);

  // Build mode-specific flags
  const modeFlags: string[] = [];
  if (mode === "ai" || mode === "hybrid") {
    modeFlags.push("--mode", mode, "--provider", aiConfig.provider, "--model", aiConfig.model);
  }

  // Remove existing output dir
  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true });
  }

  // Run pipeline
  const result = Bun.spawnSync([
    "bun", "run",
    resolve(scriptDir, "graphify-pipeline.ts"),
    seriesDir,
    ...modeFlags,
  ], { stdio: ["inherit", "pipe", "pipe"] });

  const stdout = result.stdout ? new TextDecoder().decode(result.stdout) : "";
  const stderr = result.stderr ? new TextDecoder().decode(result.stderr) : "";

  if (result.exitCode !== 0) {
    console.error(`Pipeline failed for ${mode} mode (exit ${result.exitCode})`);
    if (stderr) console.error(stderr.slice(0, 500));
    // Record empty stats for failed mode
    modeStats.push({
      mode, totalNodes: 0, totalEdges: 0,
      nodesByType: {}, edgesByRelation: {}, exclusiveTypes: [],
      passCount: 0, warnCount: 0, failCount: 0,
      perEpisode: {}, score: 0,
      aiScore: null, aiBlended: null, aiDecision: null, aiJustification: null,
    });
    continue;
  }

  // Copy output to mode-specific dir
  const modeOutDir = resolve(seriesDir, `storygraph_out_${mode}`);
  if (existsSync(modeOutDir)) rmSync(modeOutDir, { recursive: true });
  if (existsSync(outDir)) {
    cpSync(outDir, modeOutDir, { recursive: true });
  }

  // Collect stats
  const stats = collectStats(mode, modeOutDir);
  modeStats.push(stats);

  console.log(`\n${mode.toUpperCase()} done: ${stats.totalNodes} nodes, ${stats.totalEdges} edges`);
}

// ─── Step 2: Compute exclusive types ───

const allTypes = new Set<string>();
for (const s of modeStats) {
  for (const t of Object.keys(s.nodesByType)) allTypes.add(t);
}

for (const s of modeStats) {
  s.exclusiveTypes = [...allTypes].filter(t => {
    const count = s.nodesByType[t] ?? 0;
    const otherModes = modeStats.filter(m => m.mode !== s.mode);
    return count > 0 && otherModes.every(m => (m.nodesByType[t] ?? 0) === 0);
  });
}

// ─── Step 3: Score each mode ───

for (const s of modeStats) {
  let score = 0;

  // Node type diversity
  score += Object.keys(s.nodesByType).length * 2;

  // Exclusive types bonus
  score += s.exclusiveTypes.length * 3;

  // Genre-aware bonus node types
  if (scoringProfile) {
    for (const { type, weight } of scoringProfile.bonusNodeTypes) {
      score += Math.round((s.nodesByType[type] ?? 0) * weight);
    }
  } else {
    // Legacy fallback when no series config detected
    score += (s.nodesByType["tech_term"] ?? 0);
    score += (s.nodesByType["character_trait"] ?? 0);
  }

  // Quality penalties (use profile weights if available)
  score -= Math.round(s.warnCount * (scoringProfile?.warnPenalty ?? 1));
  score -= Math.round(s.failCount * (scoringProfile?.failPenalty ?? 2));

  // Total volume bonus
  score += Math.floor(s.totalNodes / 10);

  s.score = Math.max(0, score);
}

// ─── Step 4: Generate report ───

mkdirSync(compareDir, { recursive: true });

const report: string[] = [];
const seriesName = basename(seriesDir);

report.push(`# Mode Comparison Report: ${seriesName}`);
report.push(``);
report.push(`Generated: ${new Date().toISOString()}`);
report.push(`Modes compared: ${modesToCompare.join(", ")}`);
if (modesToCompare.includes("ai") || modesToCompare.includes("hybrid")) {
  report.push(`AI: ${aiConfig.provider}/${aiConfig.model}`);
}
report.push(``);

// Summary table
report.push(`## Summary`);
report.push(``);
report.push(`| Metric | ${modesToCompare.join(" | ")} |`);
report.push(`|--------| ${modesToCompare.map(() => "---").join(" | ")} |`);
report.push(`| Total nodes | ${modeStats.map(s => s.totalNodes).join(" | ")} |`);
report.push(`| Total edges | ${modeStats.map(s => s.totalEdges).join(" | ")} |`);
report.push(`| Node types | ${modeStats.map(s => Object.keys(s.nodesByType).length).join(" | ")} |`);
report.push(`| Edge relations | ${modeStats.map(s => Object.keys(s.edgesByRelation).length).join(" | ")} |`);
report.push(`| Exclusive types | ${modeStats.map(s => s.exclusiveTypes.length).join(" | ")} |`);
report.push(`| PASS | ${modeStats.map(s => s.passCount).join(" | ")} |`);
report.push(`| WARN | ${modeStats.map(s => s.warnCount).join(" | ")} |`);
report.push(`| FAIL | ${modeStats.map(s => s.failCount).join(" | ")} |`);
report.push(`| **Score** | ${modeStats.map(s => `**${s.score}**`).join(" | ")} |`);
report.push(`| AI Score (Tier 1) | ${modeStats.map(s => s.aiScore !== null ? `${s.aiScore}/10` : "N/A").join(" | ")} |`);
report.push(`| Blended Score | ${modeStats.map(s => s.aiBlended !== null ? `${(s.aiBlended * 100).toFixed(0)}%` : "N/A").join(" | ")} |`);
report.push(`| AI Decision | ${modeStats.map(s => s.aiDecision ?? "N/A").join(" | ")} |`);
report.push(``);

// AI Quality Assessment section
const modesWithAI = modeStats.filter(s => s.aiScore !== null);
if (modesWithAI.length > 0) {
  report.push(`## AI Quality Assessment (Tier 1)`);
  report.push(``);
  for (const s of modesWithAI) {
    report.push(`### ${s.mode.toUpperCase()} — AI Score: ${s.aiScore}/10`);
    report.push(``);
    report.push(`Blended: ${(s.aiBlended! * 100).toFixed(0)}% (${s.aiDecision})`);
    report.push(``);
    if (s.aiJustification) {
      report.push(s.aiJustification);
      report.push(``);
    }
  }
}

// Node counts by type
report.push(`## Node Counts by Type`);
report.push(``);
const sortedTypes = [...allTypes].sort((a, b) => {
  const maxA = Math.max(...modeStats.map(s => s.nodesByType[a] ?? 0));
  const maxB = Math.max(...modeStats.map(s => s.nodesByType[b] ?? 0));
  return maxB - maxA;
});
report.push(`| Type | ${modesToCompare.join(" | ")} | Exclusive |`);
report.push(`|------| ${modesToCompare.map(() => "---").join(" | ")} | --- |`);
for (const t of sortedTypes) {
  const counts = modeStats.map(s => s.nodesByType[t] ?? 0);
  const exclusive = modeStats.filter(s => s.exclusiveTypes.includes(t)).map(s => s.mode);
  report.push(`| ${t} | ${counts.join(" | ")} | ${exclusive.join(", ") || "—"} |`);
}
report.push(``);

// Edge counts by relation
report.push(`## Edge Counts by Relation`);
report.push(``);
const allRelations = new Set<string>();
for (const s of modeStats) {
  for (const r of Object.keys(s.edgesByRelation)) allRelations.add(r);
}
const sortedRelations = [...allRelations].sort();
report.push(`| Relation | ${modesToCompare.join(" | ")} |`);
report.push(`|----------| ${modesToCompare.map(() => "---").join(" | ")} |`);
for (const r of sortedRelations) {
  const counts = modeStats.map(s => s.edgesByRelation[r] ?? 0);
  report.push(`| ${r} | ${counts.join(" | ")} |`);
}
report.push(``);

// Per-episode breakdown
report.push(`## Per-Episode Breakdown`);
report.push(``);

// Collect all episode IDs across modes
const allEpIds = new Set<string>();
for (const s of modeStats) {
  for (const epId of Object.keys(s.perEpisode)) allEpIds.add(epId);
}
const sortedEpIds = [...allEpIds].sort();

for (const epId of sortedEpIds) {
  report.push(`### ${epId}`);
  report.push(``);
  const epTypes = new Set<string>();
  for (const s of modeStats) {
    const ep = s.perEpisode[epId];
    if (ep) for (const t of Object.keys(ep.nodesByType)) epTypes.add(t);
  }
  report.push(`| Type | ${modesToCompare.join(" | ")} |`);
  report.push(`|------| ${modesToCompare.map(() => "---").join(" | ")} |`);
  for (const t of [...epTypes].sort()) {
    const counts = modeStats.map(s => s.perEpisode[epId]?.nodesByType[t] ?? 0);
    report.push(`| ${t} | ${counts.join(" | ")} |`);
  }
  const totals = modeStats.map(s => `${s.perEpisode[epId]?.nodes ?? 0}n/${s.perEpisode[epId]?.edges ?? 0}e`);
  report.push(`| **Total** | ${totals.join(" | ")} |`);
  report.push(``);
}

// Quality comparison
report.push(`## Quality Comparison`);
report.push(``);
report.push(`| Check | ${modesToCompare.join(" | ")} |`);
report.push(`|-------| ${modesToCompare.map(() => "---").join(" | ")} |`);
report.push(`| PASS | ${modeStats.map(s => s.passCount).join(" | ")} |`);
report.push(`| WARN | ${modeStats.map(s => s.warnCount).join(" | ")} |`);
report.push(`| FAIL | ${modeStats.map(s => s.failCount).join(" | ")} |`);
report.push(``);

// Scoring explanation
report.push(`## Scoring`);
report.push(``);
report.push(`| Factor | Points |`);
report.push(`|--------|--------|`);
report.push(`| Node type diversity | +2 per type |`);
report.push(`| Exclusive types | +3 per exclusive type |`);
if (scoringProfile) {
  for (const { type, weight } of scoringProfile.bonusNodeTypes) {
    report.push(`| ${type} density | +${weight} per node |`);
  }
} else {
  report.push(`| Tech term density | +1 per tech_term node |`);
  report.push(`| Trait coverage | +1 per character_trait node |`);
}
report.push(`| WARN penalty | -${scoringProfile?.warnPenalty ?? 1} per WARN |`);
report.push(`| FAIL penalty | -${scoringProfile?.failPenalty ?? 2} per FAIL |`);
report.push(`| Volume bonus | +1 per 10 total nodes |`);
report.push(``);

// Recommendation
const best = [...modeStats].sort((a, b) => b.score - a.score)[0];
report.push(`## Recommendation`);
report.push(``);
report.push(`**Best mode: ${best.mode.toUpperCase()}** (score: ${best.score})`);
report.push(``);
if (best.exclusiveTypes.length > 0) {
  report.push(`Exclusive types: ${best.exclusiveTypes.join(", ")}`);
}
report.push(``);
report.push(`Score breakdown:`);
report.push(``);
for (const s of [...modeStats].sort((a, b) => b.score - a.score)) {
  report.push(`- **${s.mode}**: ${s.score} (${Object.keys(s.nodesByType).length} types, ${s.exclusiveTypes.length} exclusive, ${s.passCount}P/${s.warnCount}W/${s.failCount}F)`);
}
report.push(``);

// ─── Step 5: Restore best mode's output ───

const bestOutDir = resolve(seriesDir, `storygraph_out_${best.mode}`);
if (existsSync(outDir)) rmSync(outDir, { recursive: true });
if (existsSync(bestOutDir)) {
  cpSync(bestOutDir, outDir, { recursive: true });
  console.log(`\nRestored ${best.mode.toUpperCase()} output to storygraph_out/`);
}

// ─── Step 6: Clean up temp dirs (unless --keep) ───

if (!keep) {
  for (const mode of modesToCompare) {
    const modeOutDir = resolve(seriesDir, `storygraph_out_${mode}`);
    if (existsSync(modeOutDir)) {
      rmSync(modeOutDir, { recursive: true });
    }
  }
  console.log(`Cleaned up temporary mode directories (use --keep to preserve)`);
}

// Write report
const reportPath = resolve(compareDir, "comparison-report.md");
writeFileSync(reportPath, report.join("\n"));
console.log(`\nComparison report: ${reportPath}`);
console.log(`\n=== Comparison complete ===`);

// ─── Helpers ───

function collectStats(mode: string, modeOutDir: string): ModeStats {
  const stats: ModeStats = {
    mode,
    totalNodes: 0,
    totalEdges: 0,
    nodesByType: {},
    edgesByRelation: {},
    exclusiveTypes: [],
    passCount: 0,
    warnCount: 0,
    failCount: 0,
    perEpisode: {},
    score: 0,
    aiScore: null, aiBlended: null, aiDecision: null, aiJustification: null,
  };

  // Read merged graph
  const mergedPath = resolve(modeOutDir, "merged-graph.json");
  if (!existsSync(mergedPath)) return stats;

  const merged = JSON.parse(readFileSync(mergedPath, "utf-8"));
  stats.totalNodes = merged.nodes?.length ?? 0;
  stats.totalEdges = merged.links?.length ?? 0;

  for (const n of merged.nodes ?? []) {
    const t = n.type ?? "unknown";
    stats.nodesByType[t] = (stats.nodesByType[t] ?? 0) + 1;
  }

  for (const e of merged.links ?? []) {
    const r = e.relation ?? "unknown";
    stats.edgesByRelation[r] = (stats.edgesByRelation[r] ?? 0) + 1;
  }

  // Per-episode breakdown (derived from merged graph node attributes)
  const epGroups: Record<string, { nodesByType: Record<string, number>; nodeCount: number }> = {};
  for (const n of merged.nodes ?? []) {
    const ep = n.episode ?? n.id.match(/^(ch\d+ep\d+|ep\d+)/)?.[1];
    if (!ep) continue;
    if (!epGroups[ep]) epGroups[ep] = { nodesByType: {}, nodeCount: 0 };
    epGroups[ep].nodeCount++;
    const t = n.type ?? "unknown";
    epGroups[ep].nodesByType[t] = (epGroups[ep].nodesByType[t] ?? 0) + 1;
  }

  // Count edges per episode (by source node's episode)
  const epEdgeCounts: Record<string, number> = {};
  for (const e of merged.links ?? []) {
    const srcNode = (merged.nodes ?? []).find((n: any) => n.id === e.source);
    const ep = srcNode?.episode ?? srcNode?.id?.match(/^(ch\d+ep\d+|ep\d+)/)?.[1];
    if (!ep) continue;
    epEdgeCounts[ep] = (epEdgeCounts[ep] ?? 0) + 1;
  }

  for (const [epId, group] of Object.entries(epGroups)) {
    stats.perEpisode[epId] = {
      nodes: group.nodeCount,
      edges: epEdgeCounts[epId] ?? 0,
      nodesByType: group.nodesByType,
    };
  }

  // Quality from consistency report
  const reportPath = resolve(modeOutDir, "consistency-report.md");
  if (existsSync(reportPath)) {
    const reportContent = readFileSync(reportPath, "utf-8");
    const summaryMatch = reportContent.match(/\*\*PASS:\*\*\s*(\d+)/);
    const warnMatch = reportContent.match(/\*\*WARN:\*\*\s*(\d+)/);
    const failMatch = reportContent.match(/\*\*FAIL:\*\*\s*(\d+)/);
    stats.passCount = summaryMatch ? parseInt(summaryMatch[1]) : 0;
    stats.warnCount = warnMatch ? parseInt(warnMatch[1]) : 0;
    stats.failCount = failMatch ? parseInt(failMatch[1]) : 0;
  }

  // AI quality score (from graphify-score output)
  const qualityScorePath = resolve(modeOutDir, "kg-quality-score.json");
  if (existsSync(qualityScorePath)) {
    try {
      const qs = JSON.parse(readFileSync(qualityScorePath, "utf-8"));
      stats.aiScore = qs.ai?.overall ?? null;
      stats.aiBlended = qs.blended?.overall ?? null;
      stats.aiDecision = qs.blended?.decision ?? null;
      stats.aiJustification = qs.ai?.justification ?? null;
    } catch {
      // Invalid JSON — leave as null
    }
  }

  return stats;
}

