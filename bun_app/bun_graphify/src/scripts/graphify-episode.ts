/**
 * Per-episode graph generation for federated knowledge graph.
 *
 * Runs graphify on a single episode directory, extracting:
 * - AST nodes from source code (.tsx, .ts)
 * - Narrative nodes from narration.ts (characters, traits, tech terms, gags, interactions)
 *
 * All node IDs prefixed with episode ID (chNepM_) for collision-free merging.
 *
 * Usage:
 *   bun run src/scripts/graphify-episode.ts <episode-dir>
 *
 * Example:
 *   bun run src/scripts/graphify-episode.ts ../../bun_remotion_proj/weapon-forger/weapon-forger-ch1-ep1
 */

import { resolve, basename } from "node:path";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import Graph from "graphology";
import { leidenCluster, analyzeCommunities } from "../cluster";
import type { CommunityReport } from "../types";
import { detectMultiple } from "../detect";
import { extractAST } from "../extract/ast";
import { buildFromExtraction } from "../build";
import { parseNarration } from "../extract/narrative";
import { getSeriesConfigOrThrow } from "./series-config";
import type { SeriesConfig } from "./series-config";
import type { ExtractionResult, GraphNode, GraphEdge, Confidence } from "../types";

// ─── Args ───

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`graphify-episode — Per-episode knowledge graph generation

Usage:
  bun run src/scripts/graphify-episode.ts <episode-dir> [--series-dir <path>]

Options:
  --series-dir <path>   Series directory (for PLAN.md gag matching)
                        Defaults to parent of episode directory.
`);
  process.exit(0);
}

const episodeDir = resolve(args[0]);
const seriesDirIdx = args.indexOf("--series-dir");
const seriesDir = seriesDirIdx !== -1 && args[seriesDirIdx + 1]
  ? resolve(args[seriesDirIdx + 1])
  : resolve(episodeDir, "..");

// P0: Absolute path validation
for (const dir of [episodeDir, seriesDir]) {
  if (!dir.startsWith("/")) {
    console.error(`Error: "${dir}" is not an absolute path. All paths must be absolute.`);
    process.exit(1);
  }
}

const outDir = resolve(episodeDir, "bun_graphify_out");

// Extract episode ID from directory name
const epIdMatch = basename(episodeDir).match(/ch(\d+)-ep(\d+)/i);
if (!epIdMatch) {
  console.error(`Cannot extract episode ID from: ${basename(episodeDir)}`);
  console.error(`Expected format: <series>-chN-epM`);
  process.exit(1);
}
const EP_ID = `ch${epIdMatch[1]}ep${epIdMatch[2]}`;

// Load series config (auto-detected from directory name)
const config: SeriesConfig = getSeriesConfigOrThrow(seriesDir);

console.log(`Episode: ${EP_ID} | Series: ${config.displayName}`);
console.log(`Episode dir: ${episodeDir}`);
console.log(`Series dir: ${seriesDir}`);

// ─── Node/Edge helpers ───

const nodes: GraphNode[] = [];
const edges: GraphEdge[] = [];

function addNode(id: string, label: string, type: string, properties?: Record<string, string>): void {
  nodes.push({
    id,
    label,
    file_type: "document",
    source_file: `${EP_ID}/narration.ts`,
    source_location: null,
    type,
    properties,
  });
}

function addEdge(source: string, target: string, relation: string, confidence: Confidence = "EXTRACTED", score = 1.0): void {
  edges.push({
    source,
    target,
    relation,
    confidence,
    confidence_score: score,
    source_file: `${EP_ID}/narration.ts`,
    source_location: null,
    weight: 1.0,
  });
}

// ─── Step 1: Parse narration.ts ───

const narrationPath = resolve(episodeDir, "scripts", "narration.ts");
const parsed = parseNarration(narrationPath);

if (!parsed) {
  console.error(`No narration.ts found at ${narrationPath}`);
  process.exit(1);
}

console.log(`Parsed: ${parsed.scenes.length} scenes, ${parsed.characters.length} characters`);

// ─── Step 2: Extract episode plot node ───

// Try to extract title from narration file
let title = "";
try {
  const narrationContent = readFileSync(narrationPath, "utf-8");
  const titleMatch = narrationContent.match(/第[一二三四五六七八九十]+章\s*第[一二三四五六七八九十]+集[：:]\s*(.+)/);
  if (titleMatch) title = titleMatch[1].trim();
} catch {}

addNode(
  `${EP_ID}_plot`,
  title ? `${title} (${EP_ID})` : EP_ID,
  "episode_plot",
  { language: parsed.language }
);

// ─── Step 2.5: Extract scene nodes ───

for (const scene of parsed.scenes) {
  const sceneId = `${EP_ID}_scene_${scene.scene}`;
  addNode(sceneId, scene.scene, "scene");
  addEdge(sceneId, `${EP_ID}_plot`, "part_of");
}

// ─── Step 3: Extract character instances ───

for (const charId of parsed.characters) {
  const charName = config.charNames[charId] ?? charId;
  const nodeId = `${EP_ID}_char_${charId}`;

  // Collect all dialog for this character
  const dialogLines: string[] = [];
  for (const scene of parsed.scenes) {
    for (const line of scene.lines) {
      if (line.character === charId) {
        dialogLines.push(line.text);
      }
    }
  }
  const fullDialog = dialogLines.join(" | ");

  const charProps: Record<string, string> = {
    character_id: charId,
    dialog_count: String(dialogLines.length),
    dialog_text: fullDialog.slice(0, 500), // Truncate for storage
  };
  if (charId === "narrator") charProps.role = "structural";

  addNode(nodeId, `${charName} (${EP_ID})`, "character_instance", charProps);

  // Character → plot
  addEdge(nodeId, `${EP_ID}_plot`, "appears_in");
}

// ─── Step 4: Extract tech terms per character ───

// Character → tech terms mapping
const charTechTerms: Record<string, Set<string>> = {};
for (const charId of parsed.characters) {
  charTechTerms[charId] = new Set();
  for (const scene of parsed.scenes) {
    for (const line of scene.lines) {
      if (line.character === charId) {
        for (const pattern of config.techPatterns) {
          const matches = line.text.matchAll(pattern);
          for (const m of matches) {
            charTechTerms[charId].add(m[0]);
          }
        }
      }
    }
  }
}

// Create tech term nodes and edges (skip narrator — structural role, not story participant)
for (const [charId, terms] of Object.entries(charTechTerms)) {
  if (charId === "narrator") continue; // Narrator mentions tech terms in summaries, not as a participant
  for (const term of terms) {
    const termId = `${EP_ID}_tech_${term.replace(/\s+/g, "_")}`;
    // Deduplicate term nodes
    if (!nodes.find(n => n.id === termId)) {
      addNode(termId, term, "tech_term");
    }
    addEdge(`${EP_ID}_char_${charId}`, termId, "uses_tech_term");
  }
}

// ─── Step 5: Extract character interactions ───

for (const scene of parsed.scenes) {
  const sceneChars = scene.lines.map(l => l.character);
  const uniqueChars = [...new Set(sceneChars)];

  for (let i = 0; i < uniqueChars.length; i++) {
    for (let j = i + 1; j < uniqueChars.length; j++) {
      const a = uniqueChars[i];
      const b = uniqueChars[j];
      if (a === b) continue;

      // Skip narrator interactions
      if (a === "narrator" || b === "narrator") continue;

      const aId = `${EP_ID}_char_${a}`;
      const bId = `${EP_ID}_char_${b}`;

      // Add bidirectional interaction edges (if not already present)
      const existingEdge = edges.find(e =>
        e.source === aId && e.target === bId && e.relation === "interacts_with"
      );
      if (!existingEdge) {
        addEdge(aId, bId, "interacts_with");
        addEdge(bId, aId, "interacts_with");
      }
    }
  }
}

// ─── Step 6: Match running gags ───

if (config.gagSource === "plan_md") {
  // Parse gag table from PLAN.md (weapon-forger style: episode-column table)
  const planPath = resolve(seriesDir, "PLAN.md");
  if (existsSync(planPath)) {
    try {
      const planContent = readFileSync(planPath, "utf-8");

      // Extract gag table (include header row in capture for column parsing)
      const gagTableMatch = planContent.match(/(\|\s*梗\s*\|[^\n]+)\n([\s\S]*?)(?=\n\n[^|\n]|\n##|\n$)/);
      if (gagTableMatch) {
        const headerRow = gagTableMatch[1]; // | 梗 | Ep1 | Ep2 | ...
        const dataSection = gagTableMatch[2];

        const headers = headerRow.split("|").map(c => c.trim()).filter(Boolean);
        const headerEpIds = headers.slice(1).map(h => {
          const m = h.match(/(?:Ch(\d+)-)?Ep(\d+)/i);
          if (m) return `ch${m[1] ?? "1"}ep${m[2]}`;
          const m2 = h.match(/Ch(\d+)-Ep(\d+)/i);
          if (m2) return `ch${m2[1]}ep${m2[2]}`;
          return h.toLowerCase();
        });

        // Data rows (filter out separator)
        const dataRows = dataSection.split("\n").filter(l => l.startsWith("|") && !l.includes("---"));

        for (const row of dataRows) {
          const cells = row.split("|").map(c => c.trim()).filter(Boolean);
          if (cells.length < 2) continue;

          const gagName = cells[0];
          if (gagName.includes("---")) continue;

          // Find manifestation for THIS episode
          for (let j = 1; j < cells.length && j < headerEpIds.length + 1; j++) {
            const manifestation = cells[j];
            const colEpId = headerEpIds[j - 1];

            if (colEpId === EP_ID && manifestation && manifestation !== "TBD" && manifestation !== "—") {
              const gagId = `${EP_ID}_gag_${gagName.replace(/\s+/g, "_")}`;
              addNode(gagId, `${gagName}：${manifestation}`, "gag_manifestation", {
                gag_type: gagName,
                episode: EP_ID,
              });
              addEdge(gagId, `${EP_ID}_plot`, "appears_in");
            }
          }
        }
      }
    } catch (e) {
      console.warn(`Warning: Could not parse PLAN.md gag table: ${e}`);
    }
  }
} else if (config.gagSource === "plot_lines_md" && config.gagFilePath) {
  // Parse gag table from plot-lines.md (my-core-is-boss style: chapter-column table)
  const plotLinesPath = resolve(seriesDir, config.gagFilePath);
  if (existsSync(plotLinesPath)) {
    try {
      const plotLinesContent = readFileSync(plotLinesPath, "utf-8");

      // Extract chapter number from EP_ID (ch1ep2 → chapter 1)
      const chapterNum = epIdMatch![1];

      // Find gag table under ## 招牌梗追蹤
      const gagSectionMatch = plotLinesContent.match(
        /## 招牌梗追蹤\s*\n\s*\n((?:\|.*\n)+)/
      );
      if (gagSectionMatch) {
        const tableLines = gagSectionMatch[1].split("\n").filter(
          l => l.startsWith("|") && !l.includes("---")
        );

        if (tableLines.length >= 1) {
          // Parse header to find chapter column index
          const headerCells = tableLines[0].split("|").map(c => c.trim()).filter(Boolean);
          const gagColIdx = 0; // first column is gag name
          let chapterColIdx = -1;

          for (let i = 1; i < headerCells.length; i++) {
            if (headerCells[i] === `Ch${chapterNum}`) {
              chapterColIdx = i;
              break;
            }
          }

          if (chapterColIdx >= 0) {
            // Parse data rows
            for (let r = 1; r < tableLines.length; r++) {
              const cells = tableLines[r].split("|").map(c => c.trim()).filter(Boolean);
              if (cells.length < 2) continue;

              const gagName = cells[0];
              if (gagName.includes("---")) continue;

              const manifestation = cells[chapterColIdx];
              if (manifestation && manifestation !== "TBD" && manifestation !== "—") {
                const gagId = `${EP_ID}_gag_${gagName.replace(/\s+/g, "_")}`;
                addNode(gagId, `${gagName}：${manifestation} (${EP_ID})`, "gag_manifestation", {
                  gag_type: gagName,
                  episode: EP_ID,
                  chapter: `Ch${chapterNum}`,
                });
                addEdge(gagId, `${EP_ID}_plot`, "appears_in");
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn(`Warning: Could not parse plot-lines.md gag table: ${e}`);
    }
  }
}

// ─── Step 7: Extract character speech traits (heuristic) ───

for (const [charId, patterns] of Object.entries(config.traitPatterns)) {
  const charNodeId = `${EP_ID}_char_${charId}`;
  if (!nodes.find(n => n.id === charNodeId)) continue; // Character not in this episode

  const charDialog = nodes.find(n => n.id === charNodeId)?.properties?.dialog_text ?? "";

  for (const { pattern, trait } of patterns) {
    if (pattern.test(charDialog)) {
      const traitId = `${EP_ID}_trait_${charId}_${trait.replace(/\s+/g, "_")}`;
      // Only add if not duplicate
      if (!nodes.find(n => n.id === traitId)) {
        addNode(traitId, `${config.charNames[charId] ?? charId}: ${trait}`, "character_trait", {
          character_id: charId,
        });
        addEdge(traitId, charNodeId, "character_speaks_like");
      }
    }
  }
}

// ─── Step 8: Build graph ───

console.log(`\nNarrative extraction: ${nodes.length} nodes, ${edges.length} edges`);

const G = new Graph({ multi: false, type: "directed" });

for (const node of nodes) {
  if (!G.hasNode(node.id)) {
    G.addNode(node.id, {
      label: node.label,
      type: node.type,
    });
  }
}

let addedEdges = 0;
let skippedEdges = 0;
for (const edge of edges) {
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
        weight: edge.weight,
      });
      addedEdges++;
    }
  } catch {
    // skip duplicates
  }
}

console.log(`Graph: ${G.order} nodes, ${G.size} edges (${addedEdges} added, ${skippedEdges} skipped)`);

// ─── Step 9: Cluster (Leiden-inspired) ───

let communities: Record<number, string[]> = {};
let communityAnalysis: CommunityReport | null = null;
if (G.order > 5) {
  try {
    communities = leidenCluster(G);
    communityAnalysis = analyzeCommunities(G, communities);
    console.log(`Communities: ${Object.keys(communities).length} (refinement splits: ${communityAnalysis.refinementSplits})`);
  } catch (e) {
    console.warn(`Clustering failed (graph may be too small): ${e}`);
  }
}

// ─── Step 10: AST extraction skipped (story-only mode) ───

const astNodes = 0;
const astEdges = 0;

// ─── Step 11: Export ───

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
  nodes: graphNodes,
  links: graphLinks,
  communities: Object.fromEntries(Object.entries(communities)),
  community_analysis: communityAnalysis,
  episode_id: EP_ID,
};

writeFileSync(`${outDir}/graph.json`, JSON.stringify(graphData, null, 2));

// Extraction result (for merge script to consume)
const extractionResult: ExtractionResult = {
  nodes,
  edges,
  hyperedges: [],
  input_tokens: 0,
  output_tokens: 0,
};
writeFileSync(`${outDir}/.narrative_extract.json`, JSON.stringify(extractionResult, null, 2));

// Plan metadata
writeFileSync(`${outDir}/plan.json`, JSON.stringify({
  version: "0.3.0",
  episode_id: EP_ID,
  episode_dir: episodeDir,
  series_dir: seriesDir,
  stats: {
    narrative_nodes: nodes.length,
    narrative_edges: edges.length,
    ast_nodes: astNodes,
    ast_edges: astEdges,
    graph_nodes: G.order,
    graph_edges: G.size,
    communities: Object.keys(communities).length,
  },
  timestamp: new Date().toISOString(),
}, null, 2));

console.log(`\nExported: ${outDir}/graph.json`);
console.log(`Done! ${G.order} nodes, ${G.size} edges`);
