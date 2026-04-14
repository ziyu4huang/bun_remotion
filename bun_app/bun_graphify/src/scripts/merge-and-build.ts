/**
 * Merge AST + semantic extraction results and build the final knowledge graph.
 * Run from repo root:
 *   bun run bun_app/bun_graphify/src/scripts/merge-and-build.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import { degreeCentrality } from "graphology-metrics/centrality/degree";

import { resolve } from "path";

// Resolve paths relative to repo root (3 levels up from this script)
const REPO_ROOT = resolve(import.meta.dir, "../../../..");
const WF_DIR = resolve(REPO_ROOT, "bun_remotion_proj/weapon-forger");
const OUT_DIR = resolve(WF_DIR, "graphify-out");

console.log(`Repo root: ${REPO_ROOT}`);
console.log(`Weapon-forger: ${WF_DIR}`);

interface Node {
  id: string;
  label: string;
  file_type: string;
  source_file: string;
  source_location: string | null;
  source_url: string | null;
  captured_at: string | null;
  author: string | null;
  contributor: string | null;
}

interface Edge {
  source: string;
  target: string;
  relation: string;
  confidence: string;
  confidence_score: number;
  source_file: string;
  source_location: string | null;
  weight: number;
}

interface Extraction {
  nodes: Node[];
  edges: Edge[];
  hyperedges?: any[];
}

function readJSON<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJSON(path: string, data: any) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

// ─── Step 1: Load AST extraction ───
const astPath = `${WF_DIR}/.graphify_ast.json`;
const ast: Extraction = existsSync(astPath) ? readJSON(astPath) : { nodes: [], edges: [] };
console.log(`AST: ${ast.nodes.length} nodes, ${ast.edges.length} edges`);

// ─── Step 2: Load semantic extraction ───
// The subagent outputs are saved as JSON in .semantic/
const semanticDir = `${OUT_DIR}/.semantic`;
const semantic: Extraction = { nodes: [], edges: [], hyperedges: [] };

// Read all JSON files from the semantic directory
if (existsSync(semanticDir)) {
  const { readdirSync } = await import("fs");
  for (const file of readdirSync(semanticDir)) {
    if (file.endsWith(".json")) {
      try {
        const data: Extraction = readJSON(`${semanticDir}/${file}`);
        semantic.nodes.push(...(data.nodes || []));
        semantic.edges.push(...(data.edges || []));
        if (data.hyperedges) semantic.hyperedges!.push(...data.hyperedges);
      } catch (e) {
        console.warn(`Warning: Failed to parse ${file}: ${e}`);
      }
    }
  }
}

// Also check for inline semantic files at project root
const inlinePaths = [".graphify_semantic_plan.json", ".graphify_semantic_dialog.json"];
for (const p of inlinePaths) {
  if (existsSync(p)) {
    try {
      const data: Extraction = readJSON(p);
      semantic.nodes.push(...(data.nodes || []));
      semantic.edges.push(...(data.edges || []));
      if (data.hyperedges) semantic.hyperedges!.push(...data.hyperedges);
    } catch {}
  }
}

console.log(`Semantic: ${semantic.nodes.length} nodes, ${semantic.edges.length} edges`);

// ─── Step 3: Merge ───
const seen = new Set<string>();
const mergedNodes: Node[] = [];

// Add semantic nodes first (narrative data is more valuable)
for (const n of semantic.nodes) {
  if (!seen.has(n.id)) {
    seen.add(n.id);
    mergedNodes.push(n);
  }
}

// Add AST nodes (code structure)
for (const n of ast.nodes) {
  if (!seen.has(n.id)) {
    seen.add(n.id);
    mergedNodes.push(n);
  }
}

const mergedEdges = [...semantic.edges, ...ast.edges];
const mergedHyperedges = [...(semantic.hyperedges || [])];

const merged: Extraction = {
  nodes: mergedNodes,
  edges: mergedEdges,
  hyperedges: mergedHyperedges,
  input_tokens: 0,
  output_tokens: 0,
};

mkdirSync(OUT_DIR, { recursive: true });
writeJSON(`${OUT_DIR}/.graphify_extract.json`, merged);
console.log(`Merged: ${mergedNodes.length} nodes, ${mergedEdges.length} edges`);

// ─── Step 4: Build graph ───
const G = new Graph({ multi: false, type: "directed" });

for (const node of mergedNodes) {
  if (!G.hasNode(node.id)) {
    G.addNode(node.id, {
      label: node.label,
      file_type: node.file_type,
      source_file: node.source_file,
    });
  }
}

let addedEdges = 0;
let skippedEdges = 0;
for (const edge of mergedEdges) {
  if (edge.source === edge.target) continue;
  if (!G.hasNode(edge.source) || !G.hasNode(edge.target)) {
    skippedEdges++;
    continue;
  }
  try {
    if (!G.hasEdge(edge.source, edge.target)) {
      G.addDirectedEdge(edge.source, edge.target, {
        relation: edge.relation,
        confidence: edge.confidence,
        confidence_score: edge.confidence_score,
        source_file: edge.source_file,
        weight: edge.weight,
      });
      addedEdges++;
    }
  } catch {
    // skip duplicate/invalid edges
  }
}

console.log(`Graph: ${G.order} nodes, ${G.size} edges (${addedEdges} added, ${skippedEdges} skipped)`);

// ─── Step 5: Cluster ───
const mapping: Record<string, number> = louvain(G);
const communities: Record<number, string[]> = {};
for (const [node, cid] of Object.entries(mapping)) {
  if (!communities[cid]) communities[cid] = [];
  communities[cid].push(node);
}
console.log(`Communities: ${Object.keys(communities).length}`);

// ─── Step 6: Analyze ───
const degMap: Record<string, number> = degreeCentrality(G);
const godNodes = Object.entries(degMap)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([id, deg]) => ({
    id,
    label: G.getNodeAttribute(id, "label") || id,
    degree: deg,
  }));

console.log("\nTop nodes:");
for (const g of godNodes.slice(0, 5)) {
  console.log(`  ${g.label} (degree: ${g.degree.toFixed(3)})`);
}

// ─── Step 7: Export graph.json ───
const nodes = G.mapNodes((node) => ({
  id: node,
  ...G.getNodeAttributes(node),
}));

const links = G.mapEdges((_key, attr, src, tgt) => ({
  source: src,
  target: tgt,
  ...attr,
}));

const graphData = {
  nodes,
  links,
  communities: Object.fromEntries(Object.entries(communities)),
  hyperedges: mergedHyperedges,
};

writeJSON(`${OUT_DIR}/graph.json`, graphData);
console.log(`\nExported: ${OUT_DIR}/graph.json`);

// ─── Step 8: Label communities ───
const labels: Record<string, string> = {};
for (const [cid, nodes] of Object.entries(communities)) {
  const types = new Set(nodes.map(n => G.getNodeAttribute(n, "file_type")));
  const nodeLabels = nodes.slice(0, 8).map(n => G.getNodeAttribute(n, "label") || n);

  if (types.has("document")) {
    // Narrative community — try to find a theme
    const hasPlot = nodes.some(n => n.includes("_plot"));
    const hasGag = nodes.some(n => n.includes("_gag_"));
    const hasChar = nodes.some(n => n.includes("_char_"));
    const hasTrait = nodes.some(n => n.includes("_trait_"));
    const hasArtifact = nodes.some(n => n.includes("_artifact_"));

    if (hasPlot && hasChar) {
      // Look at which episodes are represented
      const episodes = nodes.filter(n => n.includes("ep") && n.includes("_plot"))
        .map(n => n.replace(/.*?(ch\d+ep\d+).*/, "$1"));
      labels[cid] = episodes.length > 0
        ? `Story: ${episodes.slice(0, 3).join(", ")}`
        : "Narrative";
    } else if (hasGag) {
      labels[cid] = "Running Gags";
    } else if (hasTrait) {
      labels[cid] = "Character Traits";
    } else if (hasArtifact) {
      labels[cid] = "Artifacts";
    } else {
      labels[cid] = `Narrative Cluster ${cid}`;
    }
  } else {
    // Code community
    const sampleLabels = nodeLabels.slice(0, 3).join(", ");
    labels[cid] = sampleLabels.length > 30
      ? `Code: ${sampleLabels.slice(0, 30)}...`
      : `Code: ${sampleLabels}`;
  }
}

console.log("\nCommunity labels:");
for (const [cid, label] of Object.entries(labels)) {
  console.log(`  ${cid}: ${label} (${communities[cid].length} nodes)`);
}

writeJSON(`${OUT_DIR}/community-labels.json`, labels);

// ─── Step 9: Generate report ───
const reportLines: string[] = [];
reportLines.push(`# Weapon Forger Knowledge Graph Report`);
reportLines.push(``);
reportLines.push(`Generated: ${new Date().toISOString()}`);
reportLines.push(``);
reportLines.push(`## Summary`);
reportLines.push(``);
reportLines.push(`- **Nodes:** ${G.order}`);
reportLines.push(`- **Edges:** ${G.size}`);
reportLines.push(`- **Communities:** ${Object.keys(communities).length}`);
reportLines.push(`- **Source:** ${mergedNodes.length} nodes (${semantic.nodes.length} semantic + ${ast.nodes.length} AST)`);
reportLines.push(``);

reportLines.push(`## Communities`);
reportLines.push(``);
for (const [cid, nodes] of Object.entries(communities)) {
  const label = labels[cid] || `Community ${cid}`;
  reportLines.push(`### ${label} (${nodes.length} nodes)`);
  reportLines.push(``);
  const sampleLabels = nodes.slice(0, 10).map(nid => G.getNodeAttribute(nid, "label") || nid);
  reportLines.push(sampleLabels.map(l => `- ${l}`).join("\n"));
  if (nodes.length > 10) reportLines.push(`\n... and ${nodes.length - 10} more`);
  reportLines.push(``);
}

reportLines.push(`## God Nodes (highest degree)`);
reportLines.push(``);
reportLines.push(`| Node | Degree | Type | Source |`);
reportLines.push(`|------|--------|------|--------|`);
for (const g of godNodes) {
  const attrs = G.getNodeAttributes(g.id);
  reportLines.push(`| ${g.label} | ${g.degree.toFixed(3)} | ${attrs.file_type || "?"} | ${attrs.source_file || "?"} |`);
}
reportLines.push(``);

// Surprising connections: edges between different communities
const nodeCommunity: Record<string, number> = {};
for (const [cid, nodes] of Object.entries(communities)) {
  for (const nid of nodes) nodeCommunity[nid] = Number(cid);
}

const surprises: any[] = [];
G.forEachEdge((_key, attr, src, tgt) => {
  const srcComm = nodeCommunity[src];
  const tgtComm = nodeCommunity[tgt];
  if (srcComm !== undefined && tgtComm !== undefined && srcComm !== tgtComm) {
    surprises.push({
      source: G.getNodeAttribute(src, "label") || src,
      target: G.getNodeAttribute(tgt, "label") || tgt,
      relation: attr.relation || "",
      confidence: attr.confidence || "",
      score: attr.confidence_score ?? 0.5,
    });
  }
});
surprises.sort((a, b) => a.score - b.score);

if (surprises.length > 0) {
  reportLines.push(`## Surprising Connections`);
  reportLines.push(``);
  reportLines.push(`Edges crossing community boundaries:`);
  reportLines.push(``);
  for (const s of surprises.slice(0, 15)) {
    reportLines.push(`- **${s.source}** --${s.relation} [${s.confidence}]--> **${s.target}**`);
  }
  reportLines.push(``);
}

writeFileSync(`${OUT_DIR}/GRAPH_REPORT.md`, reportLines.join("\n"));
console.log(`\nReport: ${OUT_DIR}/GRAPH_REPORT.md`);
console.log(`Done! ${G.order} nodes, ${G.size} edges, ${Object.keys(communities).length} communities`);
