/**
 * Quality examples reporter — Phase 33-D4c.
 *
 * Reads merged-graph.json for each series and produces a summary showing
 * what AI extraction added vs regex. No AI calls — pure data analysis.
 *
 * Usage:
 *   bun run storygraph quality-examples
 */

import { resolve, join } from "node:path";
import { existsSync, readFileSync, readdirSync } from "node:fs";

// ─── Types ───

interface SeriesExample {
  series: string;
  total_nodes: number;
  total_edges: number;
  communities: number;
  node_type_distribution: Record<string, number>;
  ai_exclusive_types: string[];
  top_nodes_by_degree: Array<{ id: string; label: string; type: string; degree: number }>;
  cross_episode_links: number;
  episodes: string[];
}

// ─── Functions (exported) ───

function analyzeSeries(projDir: string, seriesName: string): SeriesExample | null {
  const mergedPath = join(projDir, seriesName, "storygraph_out", "merged-graph.json");
  if (!existsSync(mergedPath)) return null;

  const mg = JSON.parse(readFileSync(mergedPath, "utf-8"));
  const nodes = mg.nodes ?? [];
  const links = mg.links ?? [];
  const linkEdges = mg.linkEdges ?? [];

  // Node type distribution
  const typeDist: Record<string, number> = {};
  for (const n of nodes) {
    typeDist[n.type] = (typeDist[n.type] ?? 0) + 1;
  }

  // AI-exclusive node types (only hybrid/ai mode produces these)
  const aiExclusiveTypes = ["plot_beat", "theme"];
  const presentAiTypes = aiExclusiveTypes.filter(t => (typeDist[t] ?? 0) > 0);

  // Degree computation
  const degreeMap = new Map<string, number>();
  for (const e of links) {
    degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1);
    degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1);
  }

  const topNodes = nodes
    .map(n => ({ id: n.id, label: n.label ?? n.id, type: n.type, degree: degreeMap.get(n.id) ?? 0 }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 10);

  // Episodes
  const episodes = [...new Set(nodes.filter((n: any) => n.episode).map((n: any) => n.episode as string))].sort();

  return {
    series: seriesName,
    total_nodes: nodes.length,
    total_edges: links.length,
    communities: mg.communities?.length ?? 0,
    node_type_distribution: typeDist,
    ai_exclusive_types: presentAiTypes,
    top_nodes_by_degree: topNodes,
    cross_episode_links: linkEdges.length,
    episodes,
  };
}

function generateReport(examples: SeriesExample[]): string {
  const lines: string[] = [];
  lines.push("# Quality Examples — AI Extraction Summary");
  lines.push(`\nGenerated: ${new Date().toISOString()}\n`);

  // Summary table
  lines.push("## Per-Series Overview\n");
  lines.push("| Series | Nodes | Edges | Communities | AI Types | Cross-Links | Episodes |");
  lines.push("|--------|-------|-------|-------------|----------|-------------|----------|");

  for (const ex of examples) {
    lines.push(`| ${ex.series} | ${ex.total_nodes} | ${ex.total_edges} | ${ex.communities} | ${ex.ai_exclusive_types.join(", ") || "none"} | ${ex.cross_episode_links} | ${ex.episodes.length} |`);
  }
  lines.push("");

  // Per-series detail
  for (const ex of examples) {
    lines.push(`## ${ex.series}\n`);

    // Node type distribution
    lines.push("### Node Type Distribution\n");
    lines.push("```");
    const sortedTypes = Object.entries(ex.node_type_distribution).sort(([, a], [, b]) => b - a);
    const maxCount = Math.max(...sortedTypes.map(([, c]) => c));
    for (const [type, count] of sortedTypes) {
      const bar = "█".repeat(Math.round((count / maxCount) * 30));
      lines.push(`${type.padEnd(22)} ${bar} ${count}`);
    }
    lines.push("```\n");

    // AI-exclusive nodes
    if (ex.ai_exclusive_types.length > 0) {
      lines.push(`### AI-Exclusive Nodes\n`);
      for (const t of ex.ai_exclusive_types) {
        lines.push(`- **${t}**: ${ex.node_type_distribution[t]} nodes (only hybrid/ai mode produces these)`);
      }
      lines.push("");
    }

    // Top nodes by degree
    if (ex.top_nodes_by_degree.length > 0 && ex.top_nodes_by_degree[0].degree > 0) {
      lines.push("### Top Nodes by Degree\n");
      for (const n of ex.top_nodes_by_degree.slice(0, 5)) {
        lines.push(`- ${n.label} (${n.type}): degree ${n.degree}`);
      }
      lines.push("");
    }

    // Episodes
    if (ex.episodes.length > 0) {
      lines.push(`Episodes: ${ex.episodes.join(", ")}\n`);
    }
  }

  return lines.join("\n");
}

// ─── Exports ───

export { analyzeSeries, generateReport };
export type { SeriesExample };

// ─── CLI ───

if (import.meta.main) {
const args = process.argv.slice(2);

if (args.includes("--help")) {
  console.log(`graphify-quality-examples — AI extraction quality summary (Phase 33-D4c)

Usage:
  bun run storygraph quality-examples

Reads merged-graph.json for each series with pipeline output.
Shows node distribution, AI-exclusive nodes, communities, cross-links.
`);
  process.exit(0);
}

const scriptDir = import.meta.dir;
const repoRoot = resolve(scriptDir, "..", "..", "..", "..");
const projDir = join(repoRoot, "bun_remotion_proj");

const seriesDirs = readdirSync(projDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(projDir, d.name, "storygraph_out", "merged-graph.json")))
  .map(d => d.name)
  .sort();

if (seriesDirs.length === 0) {
  console.log("No series with pipeline output found.");
  process.exit(0);
}

console.log(`Analyzing ${seriesDirs.length} series...\n`);

const examples: SeriesExample[] = [];
for (const series of seriesDirs) {
  const ex = analyzeSeries(projDir, series);
  if (ex) {
    examples.push(ex);
    const aiTypes = ex.ai_exclusive_types.length > 0 ? ex.ai_exclusive_types.join(", ") : "none";
    console.log(`  ${series}: ${ex.total_nodes} nodes, ${ex.total_edges} edges, ${ex.communities} communities, AI types: ${aiTypes}`);
  }
}

const report = generateReport(examples);
const reportPath = resolve(scriptDir, "..", "..", "test-corpus", "quality-examples.md");
const { mkdirSync } = await import("node:fs");
const { dirname } = await import("node:path");
mkdirSync(dirname(reportPath), { recursive: true });

const { writeFileSync: wf } = await import("node:fs");
wf(reportPath, report, "utf-8");

console.log(`\nReport: ${reportPath}`);
} // end import.meta.main
