/**
 * Series-level merge: combines per-episode sub-graphs with link edges.
 *
 * Reads all weapon-forger-chN-epM/graphify-out/graph.json files,
 * reads PLAN.md for structural metadata, and generates cross-episode
 * link edges (same_character, gag_evolves, story_continues, etc.)
 * that serve as anchors for consistency checking.
 *
 * Usage:
 *   bun run src/scripts/graphify-merge.ts <series-dir>
 *
 * Example:
 *   bun run src/scripts/graphify-merge.ts ../../bun_remotion_proj/weapon-forger
 */

import { resolve, basename } from "node:path";
import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import Graph from "graphology";
import { leidenCluster, analyzeCommunities, cohesionScore } from "../cluster";
import type { CommunityReport } from "../types";
import { getSeriesConfigOrThrow, discoverEpisodes, epSortKey } from "./series-config";
import type { SeriesConfig } from "./series-config";

// ─── Types ───

interface EpisodeGraph {
  episode_id: string;
  nodes: Array<{ id: string; label: string; type?: string; [key: string]: any }>;
  links: Array<{ source: string; target: string; relation?: string; [key: string]: any }>;
  communities?: Record<string, string[]>;
}

interface LinkEdge {
  source: string;
  target: string;
  relation: string;
  confidence: "LINK" | "INFERRED";
  confidence_score: number;
  source_file: string;
}

// ─── Args ───

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`graphify-merge — Merge per-episode sub-graphs with link edges

Usage:
  bun run src/scripts/graphify-merge.ts <series-dir>

Reads all episode graphify-out/graph.json files and PLAN.md,
generates cross-episode link edges, outputs merged graph.
`);
  process.exit(0);
}

const seriesDir = resolve(args[0]);

// P0: Absolute path validation
if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path. Use absolute paths.`);
  process.exit(1);
}

// Load series config
const config: SeriesConfig = getSeriesConfigOrThrow(seriesDir);

const outDir = resolve(seriesDir, "storygraph_out");

console.log(`Series: ${config.displayName} (${seriesDir})`);

// ─── Step 1: Discover per-episode graphs ───

// Use series config for episode discovery (supports both ch-based and flat naming)
const discovered = discoverEpisodes(seriesDir);

const episodeEntries = discovered
  .map(e => ({
    dir: e.dirname,
    epId: e.epId,
    sortKey: e.sortKey,
    graphPath: resolve(seriesDir, e.dirname, "storygraph_out", "graph.json"),
  }))
  .filter(e => existsSync(e.graphPath))
  .sort((a, b) => a.sortKey - b.sortKey);

console.log(`Found ${episodeEntries.length} episode graphs:`);
for (const e of episodeEntries) {
  console.log(`  ${e.epId}: ${e.dir}`);
}

if (episodeEntries.length === 0) {
  console.error("No per-episode graphs found. Run graphify-episode on each episode first.");
  process.exit(1);
}

// ─── Step 2: Load per-episode graphs ───

const episodeGraphs: EpisodeGraph[] = [];
for (const entry of episodeEntries) {
  const data: EpisodeGraph = JSON.parse(readFileSync(entry.graphPath, "utf-8"));
  episodeGraphs.push(data);
  console.log(`  ${entry.epId}: ${data.nodes.length} nodes, ${data.links.length} links`);
}

// ─── Step 3: Parse PLAN.md for structural metadata ───

const planPath = resolve(seriesDir, "PLAN.md");

// Character appearances from PLAN.md Episode Guide table
interface EpisodeMeta {
  epId: string;
  ch: number;
  ep: number;
  characters: string[];
  status: string;
}

const episodeMetas: EpisodeMeta[] = [];
const charNames = config.charNames;

if (existsSync(planPath)) {
  const planContent = readFileSync(planPath, "utf-8");

  // Parse Episode Guide table
  const epGuideMatch = planContent.match(/\|\s*Episode\s*\|.*?\n([\s\S]*?)(?=\n\n[^|\n]|\n\n\*\*|$)/);
  if (epGuideMatch) {
    const rows = epGuideMatch[1].split("\n")
      .filter(l => l.startsWith("|") && !l.includes("---"));
    for (const row of rows) {
      const cells = row.split("|").map(c => c.trim()).filter(Boolean);
      if (cells.length >= 4) {
        const [epIdRaw, , , statusOrChars, maybeStatus] = cells;
        // Try ch-based: ch1-ep1 or ch1ep1
        const m = epIdRaw.match(/ch(\d+)-?ep(\d+)/i);
        // Try flat: ep1, ep2
        const flatM = epIdRaw.match(/ep(\d+)/i);
        if (m) {
          const charsRaw = cells.length >= 5 ? cells[3] : "";
          const status = cells.length >= 5 ? cells[4] : cells[3];
          episodeMetas.push({
            epId: `ch${m[1]}ep${m[2]}`,
            ch: parseInt(m[1]),
            ep: parseInt(m[2]),
            characters: charsRaw.split(",").map(c => c.trim().toLowerCase()).filter(Boolean),
            status: status.trim(),
          });
        } else if (flatM) {
          const charsRaw = cells.length >= 5 ? cells[3] : "";
          const status = cells.length >= 5 ? cells[4] : cells[3];
          episodeMetas.push({
            epId: `ep${flatM[1]}`,
            ch: 1,
            ep: parseInt(flatM[1]),
            characters: charsRaw.split(",").map(c => c.trim().toLowerCase()).filter(Boolean),
            status: status.trim(),
          });
        }
      }
    }
  }
}

console.log(`\nPLAN.md: ${episodeMetas.length} episodes in guide`);

// Parse running gag table
interface GagChain {
  gagType: string;
  manifestations: { epId: string; text: string }[];
}

const gagChains: GagChain[] = [];

if (config.gagSource === "plan_md") {
  // Parse gag table from PLAN.md (episode-column format)
  if (existsSync(planPath)) {
    const planContent = readFileSync(planPath, "utf-8");
    const gagSectionMatch = planContent.match(/(\|\s*梗\s*\|[^\n]+)\n([\s\S]*?)(?=\n\n[^|\n]|\n##|\n$)/);
    if (gagSectionMatch) {
      const headerRow = gagSectionMatch[1];
      const dataSection = gagSectionMatch[2];
      const headers = headerRow.split("|").map(c => c.trim()).filter(Boolean);
        const headerEpIds = headers.slice(1).map(h => {
          const m = h.match(/(?:Ch(\d+)-)?Ep(\d+)/i);
          if (m) return `ch${m[1] ?? "1"}ep${m[2]}`;
          return h.toLowerCase();
        });

        const gagDataRows = dataSection.split("\n").filter(l => l.startsWith("|") && !l.includes("---"));

        for (const row of gagDataRows) {
          const cells = row.split("|").map(c => c.trim()).filter(Boolean);
          if (cells.length < 2) continue;

          const gagType = cells[0];
          const chain: GagChain = { gagType, manifestations: [] };

          for (let j = 1; j < cells.length && j < headerEpIds.length + 1; j++) {
            const text = cells[j];
            if (text && text !== "TBD" && text !== "—") {
              chain.manifestations.push({ epId: headerEpIds[j - 1], text });
            }
          }
          if (chain.manifestations.length >= 2) {
            gagChains.push(chain);
          }
        }
    }
  }
} else if (config.gagSource === "plot_lines_md" && config.gagFilePath) {
  // Parse gag table from plot-lines.md
  const plotLinesPath = resolve(seriesDir, config.gagFilePath);
  if (existsSync(plotLinesPath)) {
    try {
      const plotLinesContent = readFileSync(plotLinesPath, "utf-8");

      // Detect format: chapter-columns (## 招牌梗追蹤) vs evolution-chain (## Signature Running Gags)
      const chapterSectionMatch = plotLinesContent.match(
        /## 招牌梗追蹤\s*\n\s*\n((?:\|.*\n)+)/
      );
      const evolutionSectionMatch = plotLinesContent.match(
        /## Signature Running Gags\s*\n\s*\n((?:\|.*\n)+)/
      );

      if (chapterSectionMatch) {
        // my-core-is-boss style: chapter-column format
        const tableLines = chapterSectionMatch[1].split("\n").filter(
          l => l.startsWith("|") && !l.includes("---")
        );

        if (tableLines.length >= 1) {
          const headerCells = tableLines[0].split("|").map(c => c.trim()).filter(Boolean);

          // Map chapter column index → list of episode IDs in that chapter
          const chapterEpisodes: Map<number, string[]> = new Map();
          for (const entry of episodeEntries) {
            // For flat numbering, treat all as ch=1
            const ch = entry.epId.match(/^ch(\d+)ep/)?.[1];
            if (ch && !chapterEpisodes.has(parseInt(ch))) chapterEpisodes.set(parseInt(ch), []);
            if (ch) chapterEpisodes.get(parseInt(ch))!.push(entry.epId);
          }

          for (let r = 1; r < tableLines.length; r++) {
            const cells = tableLines[r].split("|").map(c => c.trim()).filter(Boolean);
            if (cells.length < 2) continue;

            const gagType = cells[0];
            const chain: GagChain = { gagType, manifestations: [] };

            for (let c = 1; c < cells.length && c < headerCells.length; c++) {
              const text = cells[c];
              if (!text || text === "TBD" || text === "—") continue;

              const chMatch = headerCells[c].match(/Ch(\d+)/);
              if (!chMatch) continue;
              const chNum = parseInt(chMatch[1]);

              const epIds = chapterEpisodes.get(chNum);
              if (epIds) {
                for (const epId of epIds) {
                  chain.manifestations.push({ epId, text });
                }
              }
            }

            if (chain.manifestations.length >= 2) {
              gagChains.push(chain);
            }
          }
        }
      } else if (evolutionSectionMatch) {
        // galgame-meme-theater style: Gag | Pattern | Episodes | Evolution
        const tableLines = evolutionSectionMatch[1].split("\n").filter(
          l => l.startsWith("|") && !l.includes("---")
        );

        // Build set of known epIds from actual episode data
        const knownEpIds = new Set(episodeEntries.map(e => e.epId.toLowerCase()));

        for (const row of tableLines) {
          const cells = row.split("|").map(c => c.trim()).filter(Boolean);
          if (cells.length < 4) continue;

          const gagType = cells[0];
          const evolutionCol = cells[3]; // "ep1奶茶→ep2再一局→..."

          // Parse evolution chain into per-episode manifestations
          const chain: GagChain = { gagType, manifestations: [] };
          const parts = evolutionCol.split("→");
          for (const part of parts) {
            const epTagMatch = part.match(/(ep\d+)/i);
            if (epTagMatch) {
              const epTag = epTagMatch[1].toLowerCase();
              const text = part.replace(/ep\d+/i, "").trim();
              if (knownEpIds.has(epTag) && text) {
                chain.manifestations.push({ epId: epTag, text });
              }
            }
          }

          if (chain.manifestations.length >= 2) {
            gagChains.push(chain);
          }
        }
      }
    } catch (e) {
      console.warn(`Warning: Could not parse plot-lines.md: ${e}`);
    }
  }
}

console.log(`Gag chains: ${gagChains.length} types with ≥2 manifestations`);

// ─── Step 4: Build merged graph ───

const G = new Graph({ multi: false, type: "directed" });
const linkEdges: LinkEdge[] = [];

// 4a. Add all per-episode nodes and edges
for (const eg of episodeGraphs) {
  for (const node of eg.nodes) {
    if (!G.hasNode(node.id)) {
      G.addNode(node.id, {
        label: node.label,
        type: node.type ?? node.file_type ?? "unknown",
        episode: eg.episode_id,
        ...(node.properties && Object.keys(node.properties).length > 0 ? { properties: node.properties } : {}),
      });
    }
  }

  for (const link of eg.links) {
    if (link.source === link.target) continue;
    if (!G.hasNode(link.source) || !G.hasNode(link.target)) continue;
    if (!G.hasEdge(link.source, link.target)) {
      try {
        G.addDirectedEdge(link.source, link.target, {
          relation: link.relation ?? "related",
          confidence: link.confidence ?? "EXTRACTED",
          confidence_score: link.confidence_score ?? 1.0,
          weight: link.weight ?? 1.0,
        });
      } catch { /* skip */ }
    }
  }
}

console.log(`\nPer-episode sub-graphs: ${G.order} nodes, ${G.size} edges`);

// 4b. Link: same_character (episode instance ↔ episode instance)
// Discover shared characters from actual graph data (not just PLAN.md)
// Build a map: charId → list of episode instances
const charInstances = new Map<string, string[]>();
for (const eg of episodeGraphs) {
  for (const node of eg.nodes) {
    if (node.type !== "character_instance") continue;
    const charId = node.properties?.character_id ?? node.id.split("_char_")[1];
    if (!charId) continue;
    if (!charInstances.has(charId)) charInstances.set(charId, []);
    charInstances.get(charId)!.push(node.id);
  }
}

// Link ALL pairs of same character (not just sequential)
for (const [charId, instances] of charInstances) {
  for (let i = 0; i < instances.length; i++) {
    for (let j = i + 1; j < instances.length; j++) {
      const nodeA = instances[i];
      const nodeB = instances[j];
      if (G.hasNode(nodeA) && G.hasNode(nodeB)) {
        try {
          G.addDirectedEdge(nodeA, nodeB, {
            relation: "same_character",
            confidence: "LINK",
            confidence_score: 1.0,
            weight: 1.0,
          });
          G.addDirectedEdge(nodeB, nodeA, {
            relation: "same_character",
            confidence: "LINK",
            confidence_score: 1.0,
            weight: 1.0,
          });

          linkEdges.push({
            source: nodeA, target: nodeB,
            relation: "same_character", confidence: "LINK",
            confidence_score: 1.0, source_file: "graph_data",
          });
        } catch { /* skip */ }
      }
    }
  }
}

// 4c. Link: story_continues (plot → plot)
// Use PLAN.md episode guide if available, else fall back to directory discovery order
const storyOrder = episodeMetas.length > 0
  ? episodeMetas.map(m => m.epId)
  : episodeEntries.map(e => e.epId);

for (let i = 0; i < storyOrder.length - 1; i++) {
  const plotA = `${storyOrder[i]}_plot`;
  const plotB = `${storyOrder[i + 1]}_plot`;

  if (G.hasNode(plotA) && G.hasNode(plotB)) {
    try {
      G.addDirectedEdge(plotA, plotB, {
        relation: "story_continues",
        confidence: "LINK",
        confidence_score: 1.0,
        weight: 1.0,
      });

      linkEdges.push({
        source: plotA, target: plotB,
        relation: "story_continues", confidence: "LINK",
        confidence_score: 1.0, source_file: episodeMetas.length > 0 ? "PLAN.md" : "dir_order",
      });
    } catch { /* skip */ }
  }
}

// 4d. Link: gag_evolves (gag manifestation → next manifestation)
for (const chain of gagChains) {
  for (let i = 0; i < chain.manifestations.length - 1; i++) {
    const gagA = `${chain.manifestations[i].epId}_gag_${chain.gagType.replace(/\s+/g, "_")}`;
    const gagB = `${chain.manifestations[i + 1].epId}_gag_${chain.gagType.replace(/\s+/g, "_")}`;

    if (G.hasNode(gagA) && G.hasNode(gagB)) {
      try {
        G.addDirectedEdge(gagA, gagB, {
          relation: "gag_evolves",
          confidence: "LINK",
          confidence_score: 0.8,
          weight: 1.0,
        });

        linkEdges.push({
          source: gagA, target: gagB,
          relation: "gag_evolves", confidence: "INFERRED",
          confidence_score: 0.8, source_file: "PLAN.md",
        });
      } catch { /* skip */ }
    }
  }
}

// 4e. Foreshadow nodes + foreshadows link edges (from foreshadow-output.json)
const foreshadowOutputPath = resolve(outDir, "foreshadow-output.json");
let foreshadowCount = 0;
let foreshadowEdgeCount = 0;

if (existsSync(foreshadowOutputPath)) {
  try {
    const rawForeshadow = readFileSync(foreshadowOutputPath, "utf-8").trim();
    let jsonStr = rawForeshadow;
    const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    const foreshadowData = JSON.parse(jsonStr);
    const planted: Array<{
      id: string;
      description: string;
      confidence?: number;
      scene_id?: string;
      character_involved?: string | null;
    }> = Array.isArray(foreshadowData.planted) ? foreshadowData.planted : [];

    for (const item of planted) {
      if (!item.id || typeof item.id !== "string") continue;

      // Create foreshadow node
      if (!G.hasNode(item.id)) {
        G.addNode(item.id, {
          label: item.description?.slice(0, 80) ?? item.id,
          type: "foreshadow",
          episode: item.id.split("_foreshadow")[0],
        });
        foreshadowCount++;
      }

      // foreshadows link: scene → foreshadow (if scene exists)
      if (item.scene_id && G.hasNode(item.scene_id)) {
        try {
          G.addDirectedEdge(item.scene_id, item.id, {
            relation: "foreshadows",
            confidence: "INFERRED",
            confidence_score: item.confidence ?? 0.8,
            weight: 0.8,
          });
          linkEdges.push({
            source: item.scene_id,
            target: item.id,
            relation: "foreshadows",
            confidence: "INFERRED",
            confidence_score: item.confidence ?? 0.8,
            source_file: "foreshadow-output.json",
          });
          foreshadowEdgeCount++;
        } catch { /* skip duplicate */ }
      }
    }

    // Handle payoffs: link foreshadow node → payoff episode plot
    const payoffs: Array<{
      foreshadow_id: string;
      payoff_episode: string;
      payoff_description?: string;
      confidence?: number;
    }> = Array.isArray(foreshadowData.payoffs) ? foreshadowData.payoffs : [];

    for (const p of payoffs) {
      if (!p.foreshadow_id || !G.hasNode(p.foreshadow_id)) continue;

      // Update foreshadow node with payoff info
      if (G.hasNode(p.foreshadow_id)) {
        const attrs = G.getNodeAttributes(p.foreshadow_id);
        G.setNodeAttribute(p.foreshadow_id, "paid_off", true);
        G.setNodeAttribute(p.foreshadow_id, "payoff_episode", p.payoff_episode);
        if (p.payoff_description) {
          G.setNodeAttribute(p.foreshadow_id, "payoff_description", p.payoff_description);
        }
      }

      // Link: foreshadow → payoff episode plot node
      const payoffPlotNode = `${p.payoff_episode}_plot`;
      if (G.hasNode(payoffPlotNode)) {
        try {
          G.addDirectedEdge(p.foreshadow_id, payoffPlotNode, {
            relation: "foreshadows",
            confidence: "INFERRED",
            confidence_score: p.confidence ?? 0.9,
            weight: 0.9,
          });
          linkEdges.push({
            source: p.foreshadow_id,
            target: payoffPlotNode,
            relation: "foreshadows",
            confidence: "INFERRED",
            confidence_score: p.confidence ?? 0.9,
            source_file: "foreshadow-output.json",
          });
          foreshadowEdgeCount++;
        } catch { /* skip duplicate */ }
      }
    }

    console.log(`Foreshadow: ${foreshadowCount} nodes, ${foreshadowEdgeCount} link edges (${planted.length} planted, ${payoffs.length} payoffs)`);
  } catch (e) {
    console.warn(`Warning: Could not parse foreshadow-output.json: ${e}`);
  }
} else {
  console.log(`Foreshadow: no foreshadow-output.json found (expected at ${foreshadowOutputPath})`);
}

console.log(`Link edges: ${linkEdges.length}`);
console.log(`Merged graph: ${G.order} nodes, ${G.size} edges`);

// ─── Step 5: Cluster (Leiden-inspired) ───

let communities: Record<number, string[]> = {};
let communityAnalysis: CommunityReport | null = null;
try {
  communities = leidenCluster(G);
  communityAnalysis = analyzeCommunities(G, communities);
  console.log(`Communities: ${Object.keys(communities).length} (refinement splits: ${communityAnalysis.refinementSplits}, avg cohesion: ${communityAnalysis.averageCohesion.toFixed(2)})`);
} catch (e) {
  console.warn(`Clustering failed: ${e}`);
}

console.log(`Communities: ${Object.keys(communities).length}`);

// ─── Step 6: Export ───

mkdirSync(outDir, { recursive: true });

const graphNodes = G.mapNodes((node) => ({
  id: node,
  ...G.getNodeAttributes(node),
}));

const graphLinks = G.mapEdges((_key, attr, src, tgt) => ({
  source: src,
  target: tgt,
  ...attr,
}));

const graphData = {
  manifest: {
    generator: "storygraph_merge",
    version: "0.11.0",
    timestamp: new Date().toISOString(),
    episode_count: episodeGraphs.length,
    link_edge_count: linkEdges.length,
    community_count: Object.keys(communities).length,
  },
  nodes: graphNodes,
  links: graphLinks,
  communities: Object.fromEntries(Object.entries(communities)),
  community_analysis: communityAnalysis,
  link_edges: linkEdges,
  episode_count: episodeGraphs.length,
};

writeFileSync(`${outDir}/merged-graph.json`, JSON.stringify(graphData, null, 2));
writeFileSync(`${outDir}/link-edges.json`, JSON.stringify(linkEdges, null, 2));

// ─── Step 7: Generate report ───

const seriesName = basename(seriesDir);
const report: string[] = [];
report.push(`# ${seriesName} Merged Knowledge Graph`);
report.push(``);
report.push(`Generated: ${new Date().toISOString()}`);
report.push(`Episodes: ${episodeGraphs.length}`);
report.push(``);
report.push(`## Summary`);
report.push(``);
report.push(`- **Sub-graph nodes:** ${graphNodes.length}`);
report.push(`- **Sub-graph edges:** ${graphLinks.length}`);
report.push(`- **Link edges:** ${linkEdges.length}`);
report.push(`- **Communities:** ${Object.keys(communities).length}`);
report.push(``);

// Communities (enriched with Leiden analysis)
if (communityAnalysis) {
  report.push(`## Community Health`);
  report.push(``);
  report.push(`- **Global modularity:** ${communityAnalysis.globalModularity.toFixed(4)}`);
  report.push(`- **Average cohesion:** ${communityAnalysis.averageCohesion.toFixed(2)}`);
  report.push(`- **Refinement splits:** ${communityAnalysis.refinementSplits}`);
  report.push(`- **Surprising connections:** ${communityAnalysis.surprisingConnections.length}`);
  report.push(``);
}

report.push(`## Communities`);
report.push(``);
if (communityAnalysis) {
  for (const ca of communityAnalysis.communities) {
    const cohesionFlag = ca.cohesion < 0.1 ? ' :warning:' : '';
    report.push(`### ${ca.label} (${ca.size} nodes, cohesion: ${ca.cohesion.toFixed(2)}${cohesionFlag})`);
    report.push(``);
    report.push(`- Types: ${ca.dominantTypes.join(", ")}`);
    if (ca.episodes.length > 0) report.push(`- Episodes: ${ca.episodes.join(", ")}`);
    report.push(`- Modularity contribution: ${ca.modularityContribution.toFixed(4)}`);
    report.push(`- Connected: ${ca.isConnected}`);
    if (ca.bridgeNodes.length > 0) {
      const bridgeLabels = ca.bridgeNodes.map(n => G.getNodeAttribute(n, "label") ?? n);
      report.push(`- Bridge nodes: ${bridgeLabels.join(", ")}`);
    }
    report.push(``);
  }
} else {
  for (const [cid, nodes] of Object.entries(communities)) {
    const types = new Set(nodes.map(n => G.getNodeAttribute(n, "type")));
    const sampleLabels = nodes.slice(0, 5).map(n => G.getNodeAttribute(n, "label") ?? n);
    const episodeSet = new Set(nodes.map(n => G.getNodeAttribute(n, "episode")).filter(Boolean));
    const episodes = [...episodeSet].sort().join(", ");

    report.push(`### Community ${cid} (${nodes.length} nodes)`);
    report.push(``);
    report.push(`- Types: ${[...types].join(", ")}`);
    if (episodes) report.push(`- Episodes: ${episodes}`);
    report.push(`- Sample: ${sampleLabels.join(", ")}`);
    report.push(``);
  }
}

// Surprising connections
if (communityAnalysis && communityAnalysis.surprisingConnections.length > 0) {
  report.push(`## Surprising Connections (Cross-Community)`);
  report.push(``);
  for (const sc of communityAnalysis.surprisingConnections.slice(0, 10)) {
    report.push(`- **${sc.sourceLabel}** (${sc.sourceCommunity}) → **${sc.targetLabel}** (${sc.targetCommunity}) [${sc.relation}]`);
  }
  report.push(``);
}

// Bridge nodes
if (communityAnalysis) {
  const bridges = communityAnalysis.nodes.filter(n => n.isBridge);
  if (bridges.length > 0) {
    report.push(`## Bridge Nodes`);
    report.push(``);
    for (const bn of bridges.slice(0, 10)) {
      const label = G.getNodeAttribute(bn.nodeId, "label") ?? bn.nodeId;
      report.push(`- **${label}** (community ${bn.communityId})`);
    }
    report.push(``);
  }
}

// Link edge summary
report.push(`## Link Edges (Anchors)`);
report.push(``);
const linkByType: Record<string, number> = {};
for (const le of linkEdges) {
  linkByType[le.relation] = (linkByType[le.relation] ?? 0) + 1;
}
for (const [rel, count] of Object.entries(linkByType).sort((a, b) => b[1] - a[1])) {
  report.push(`- **${rel}**: ${count} edges`);
}
report.push(``);

// Gag evolution chains
if (gagChains.length > 0) {
  report.push(`## Gag Evolution Chains`);
  report.push(``);
  for (const chain of gagChains) {
    report.push(`### ${chain.gagType}`);
    report.push(``);
    for (const m of chain.manifestations) {
      report.push(`- **${m.epId}**: ${m.text}`);
    }
    report.push(``);
  }
}

writeFileSync(`${outDir}/MERGED_REPORT.md`, report.join("\n"));

console.log(`\nExported:`);
console.log(`  ${outDir}/merged-graph.json`);
console.log(`  ${outDir}/link-edges.json`);
console.log(`  ${outDir}/MERGED_REPORT.md`);
console.log(`\nDone! ${G.order} nodes, ${G.size} edges, ${linkEdges.length} link edges, ${Object.keys(communities).length} communities`);
