/**
 * AI Cross-Link Generator — orchestrator for Phase 23.
 *
 * Reads merged-graph.json, computes graph algorithm metrics,
 * writes crosslink-input.json for Claude subagent consumption,
 * reads crosslink-output.json if present, validates cross-links,
 * and patches merged-graph.json with the results.
 *
 * File-based subagent pattern (same as graphify-check.ts enrichment).
 *
 * Usage:
 *   bun run src/scripts/ai-crosslink-generator.ts <series-dir>
 */

import { resolve } from "node:path";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import Graph from "graphology";
import { computePageRank, computeJaccardSimilarity } from "./story-algorithms";
import { buildCrossLinkPrompt } from "./subagent-prompt";
import type { NodeSummary, EdgeSummary } from "./subagent-prompt";
import type { StoryCrossLink, CrossLinkType } from "../types";

// ─── Args ───

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`ai-crosslink-generator — Generate AI cross-link discovery input/output

Usage:
  bun run src/scripts/ai-crosslink-generator.ts <series-dir>

Steps:
  1. Read merged-graph.json
  2. Compute PageRank + Jaccard similarity
  3. Build cross-link prompt via buildCrossLinkPrompt()
  4. Write crosslink-input.json (for subagent consumption)
  5. Read crosslink-output.json if exists (subagent result)
  6. Validate cross-links and patch merged-graph.json
`);
  process.exit(0);
}

const seriesDir = resolve(args[0]);
if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path.`);
  process.exit(1);
}

const outDir = resolve(seriesDir, "bun_graphify_out");
const mergedPath = resolve(outDir, "merged-graph.json");
const inputPath = resolve(outDir, "crosslink-input.json");
const outputPath = resolve(outDir, "crosslink-output.json");

if (!existsSync(mergedPath)) {
  console.error(`Error: merged-graph.json not found at ${mergedPath}`);
  console.error(`Run graphify-pipeline first to generate the merged graph.`);
  process.exit(1);
}

const VALID_LINK_TYPES: Set<string> = new Set<CrossLinkType>([
  "character_theme_affinity",
  "gag_character_synergy",
  "narrative_cluster",
  "story_anti_pattern",
]);

// ─── Step 1: Read merged graph ───

console.log(`Reading merged graph: ${mergedPath}`);
const raw = JSON.parse(readFileSync(mergedPath, "utf-8"));
const nodes = raw.nodes || [];
const links = raw.links || [];
const linkEdges = raw.link_edges || [];

if (nodes.length < 3) {
  console.log(`Graph has only ${nodes.length} nodes (< 3). Skipping cross-link discovery.`);
  process.exit(0);
}

// ─── Step 2: Build graphology graph ───

const G = new Graph({ multi: false, type: "directed" });
for (const n of nodes) {
  if (!G.hasNode(n.id)) {
    G.addNode(n.id, {
      label: n.label || n.properties?.name || n.id,
      type: n.type || "unknown",
      episode: n.episode || "",
    });
  }
}
for (const e of links) {
  if (e.source === e.target) continue;
  if (!G.hasNode(e.source) || !G.hasNode(e.target)) continue;
  if (!G.hasEdge(e.source, e.target)) {
    try { G.addDirectedEdge(e.source, e.target, { relation: e.relation || "related" }); } catch { /* skip */ }
  }
}

console.log(`Graph: ${G.order} nodes, ${G.size} edges, ${linkEdges.length} link edges`);

// ─── Step 3: Compute algorithms ───

console.log(`Computing PageRank...`);
const pageRankScores = computePageRank(G);

// Reconstruct per-episode graphs for Jaccard
console.log(`Computing Jaccard similarity...`);
const episodes = [...new Set(nodes.map(n => n.episode).filter(Boolean))].sort();
const nodeIdSet = new Set(nodes.map(n => n.id));
const episodeGraphs = episodes.map(ep => ({
  episode_id: ep,
  nodes: nodes.filter(n => n.episode === ep),
  links: links.filter(l => {
    const srcNode = nodes.find(n => n.id === l.source);
    const tgtNode = nodes.find(n => n.id === l.target);
    return nodeIdSet.has(l.source) && nodeIdSet.has(l.target) &&
      (srcNode ? srcNode.episode === ep : false) &&
      (tgtNode ? tgtNode.episode === ep : false);
  }),
}));
const similarityMatrix = episodeGraphs.length >= 2
  ? computeJaccardSimilarity(episodeGraphs)
  : {};

console.log(`Episodes: ${episodes.join(", ")}`);
console.log(`PageRank: top 3 = ${Object.entries(pageRankScores).sort(([, a], [, b]) => b - a).slice(0, 3).map(([id, s]) => `${id}=${s.toFixed(3)}`).join(", ")}`);

// ─── Step 3b: Generate algorithm cross-links from Jaccard > 0.5 ───

const algorithmCrossLinks: StoryCrossLink[] = [];
for (let i = 0; i < episodes.length; i++) {
  for (let j = i + 1; j < episodes.length; j++) {
    const sim = similarityMatrix[episodes[i]]?.[episodes[j]] ?? 0;
    if (sim > 0.5) {
      const epANode = nodes.find((n: any) => n.type === "episode_plot" && n.episode === episodes[i]);
      const epBNode = nodes.find((n: any) => n.type === "episode_plot" && n.episode === episodes[j]);
      if (epANode && epBNode) {
        algorithmCrossLinks.push({
          from: epANode.id,
          to: epBNode.id,
          link_type: "story_anti_pattern",
          confidence: sim,
          evidence: [`Jaccard similarity: ${sim.toFixed(3)}`],
          generated_by: "algorithm",
          rationale: `${episodes[i]} and ${episodes[j]} have significant structural overlap (Jaccard: ${sim.toFixed(3)})`,
        });
      }
    }
  }
}

if (algorithmCrossLinks.length > 0) {
  console.log(`Algorithm cross-links: ${algorithmCrossLinks.length} (from Jaccard > 0.5)`);
}

// ─── Step 4: Build prompt ───

const nodeSummaries: NodeSummary[] = nodes.map(n => ({
  id: n.id,
  label: n.label || n.properties?.name || n.id,
  type: n.type || "unknown",
  episode: n.episode,
}));
const edgeSummaries: EdgeSummary[] = links.map(l => ({
  source: l.source,
  target: l.target,
  relation: l.relation || "related",
}));
const linkEdgeSummaries = linkEdges.map(le => ({
  source: le.source,
  target: le.target,
  relation: le.relation,
}));

const maxCrossLinks = Math.min(15, Math.max(5, Math.floor(nodes.length / 10)));
const prompt = buildCrossLinkPrompt(
  nodeSummaries, edgeSummaries, linkEdgeSummaries,
  pageRankScores, similarityMatrix, maxCrossLinks,
);

// ─── Step 5: Write crosslink-input.json ───

const inputPayload = {
  prompt,
  graph: {
    nodes: nodeSummaries,
    edges: edgeSummaries,
    link_edges: linkEdgeSummaries,
  },
  metrics: {
    page_rank: pageRankScores,
    jaccard_similarity: similarityMatrix,
  },
  series_dir: seriesDir,
  generated_at: new Date().toISOString(),
  max_cross_links: maxCrossLinks,
};

writeFileSync(inputPath, JSON.stringify(inputPayload, null, 2));
console.log(`\nWrote crosslink input: ${inputPath}`);
console.log(`  Prompt: ${prompt.length} chars, max_cross_links: ${maxCrossLinks}`);

// ─── Step 6: Read crosslink-output.json if exists ───

if (!existsSync(outputPath)) {
  if (algorithmCrossLinks.length > 0) {
    console.log(`\nNo crosslink-output.json found — patching with ${algorithmCrossLinks.length} algorithm cross-links only`);
    const mergedData = JSON.parse(readFileSync(mergedPath, "utf-8"));
    const existingLinks: StoryCrossLink[] = Array.isArray(mergedData.cross_links)
      ? mergedData.cross_links.filter((cl: any) => cl.generated_by === "ai")
      : [];
    const allLinks = [...existingLinks, ...algorithmCrossLinks];
    mergedData.cross_links = allLinks;
    writeFileSync(mergedPath, JSON.stringify(mergedData, null, 2));
    console.log(`Patched ${mergedPath} with ${allLinks.length} cross_links (${algorithmCrossLinks.length} algorithm, ${existingLinks.length} AI)`);
    process.exit(0);
  }
  console.log(`\nNo crosslink-output.json found at ${outputPath}`);
  console.log(`To generate cross-links:`);
  console.log(`  1. Read ${inputPath}`);
  console.log(`  2. Send the "prompt" field to Claude with the graph data`);
  console.log(`  3. Write the JSON array result to ${outputPath}`);
  console.log(`  4. Re-run this script to validate and merge`);
  process.exit(0);
}

console.log(`\nReading crosslink output: ${outputPath}`);

// ─── Robust JSON parsing ───

let rawOutput: string;
try {
  rawOutput = readFileSync(outputPath, "utf-8").trim();
} catch (e) {
  console.error(`Failed to read crosslink-output.json: ${e}`);
  process.exit(1);
}

// Strip markdown code fences if present
let jsonStr = rawOutput;
const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
if (fenceMatch) {
  jsonStr = fenceMatch[1].trim();
}

let parsed: unknown;
try {
  parsed = JSON.parse(jsonStr);
} catch {
  // Try to find JSON array in the output
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      parsed = JSON.parse(arrayMatch[0]);
    } catch {
      console.error(`Failed to parse crosslink-output.json as JSON`);
      console.error(`  Raw length: ${rawOutput.length} chars`);
      process.exit(1);
    }
  } else {
    console.error(`Failed to parse crosslink-output.json as JSON`);
    console.error(`  Raw length: ${rawOutput.length} chars`);
    process.exit(1);
  }
}

// Extract array from possible object wrapper
let crossLinkArray: unknown[];
if (Array.isArray(parsed)) {
  crossLinkArray = parsed;
} else if (parsed && typeof parsed === "object") {
  const obj = parsed as Record<string, unknown>;
  const arrayKey = ["cross_links", "links", "data", "results"].find(k => Array.isArray(obj[k]));
  if (arrayKey) {
    crossLinkArray = obj[arrayKey] as unknown[];
  } else {
    console.error(`Parsed output is an object but no array found under known keys (cross_links, links, data, results)`);
    process.exit(1);
  }
} else {
  console.error(`Parsed output is not an array or object: ${typeof parsed}`);
  process.exit(1);
}

console.log(`Parsed ${crossLinkArray.length} cross-link candidates`);

// ─── Step 7: Validate cross-links ───

const validCrossLinks: StoryCrossLink[] = [];
let skipped = 0;

for (let i = 0; i < crossLinkArray.length; i++) {
  const item = crossLinkArray[i];
  if (!item || typeof item !== "object") {
    console.log(`  Skipping item ${i}: not an object`);
    skipped++;
    continue;
  }

  const cl = item as Record<string, unknown>;

  // Validate required fields
  if (typeof cl.from !== "string" || typeof cl.to !== "string") {
    console.log(`  Skipping item ${i}: missing from/to`);
    skipped++;
    continue;
  }
  if (!VALID_LINK_TYPES.has(cl.link_type as string)) {
    console.log(`  Skipping item ${i}: invalid link_type "${cl.link_type}"`);
    skipped++;
    continue;
  }
  if (typeof cl.confidence !== "number" || cl.confidence < 0 || cl.confidence > 1) {
    console.log(`  Skipping item ${i}: invalid confidence ${cl.confidence}`);
    skipped++;
    continue;
  }

  // Validate node IDs exist in graph
  if (!G.hasNode(cl.from as string)) {
    console.log(`  Skipping item ${i}: "from" node "${cl.from}" not in graph`);
    skipped++;
    continue;
  }
  if (!G.hasNode(cl.to as string)) {
    console.log(`  Skipping item ${i}: "to" node "${cl.to}" not in graph`);
    skipped++;
    continue;
  }

  validCrossLinks.push({
    from: cl.from as string,
    to: cl.to as string,
    link_type: cl.link_type as CrossLinkType,
    confidence: cl.confidence as number,
    evidence: Array.isArray(cl.evidence) ? cl.evidence.filter((e): e is string => typeof e === "string") : [],
    generated_by: "ai",
    rationale: typeof cl.rationale === "string" ? cl.rationale : "",
  });
}

console.log(`\nValidation: ${validCrossLinks.length} valid, ${skipped} skipped`);

// ─── Step 8: Merge algorithm + AI cross-links and patch ───

const allCrossLinks = [...algorithmCrossLinks, ...validCrossLinks];
const deduped = new Map<string, StoryCrossLink>();
for (const cl of allCrossLinks) {
  const key = `${cl.from}:${cl.to}:${cl.link_type}`;
  if (!deduped.has(key) || cl.generated_by === "ai") {
    deduped.set(key, cl);
  }
}
const finalCrossLinks = [...deduped.values()];

const mergedData = JSON.parse(readFileSync(mergedPath, "utf-8"));
mergedData.cross_links = finalCrossLinks;
writeFileSync(mergedPath, JSON.stringify(mergedData, null, 2));

console.log(`\nPatched ${mergedPath} with ${finalCrossLinks.length} cross_links (${algorithmCrossLinks.length} algorithm, ${validCrossLinks.length} AI)`);

// ─── Summary ───

const byType: Record<string, number> = {};
const bySource: Record<string, number> = {};
for (const cl of finalCrossLinks) {
  byType[cl.link_type] = (byType[cl.link_type] || 0) + 1;
  bySource[cl.generated_by] = (bySource[cl.generated_by] || 0) + 1;
}
const avgConf = finalCrossLinks.length > 0
  ? (finalCrossLinks.reduce((sum, cl) => sum + cl.confidence, 0) / finalCrossLinks.length)
  : 0;

console.log(`\nCross-link summary:`);
for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type}: ${count}`);
}
for (const [source, count] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${source}: ${count}`);
}
console.log(`  Average confidence: ${avgConf.toFixed(3)}`);
console.log(`\nDone.`);
