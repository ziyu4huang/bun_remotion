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
import { getSeriesConfigOrThrow, extractEpId, getEffectPattern, getTitlePattern } from "./series-config";
import type { SeriesConfig } from "./series-config";
import type { ExtractionResult, GraphNode, GraphEdge, Confidence } from "../types";
import { callAI, parseArgsForAI } from "../ai-client";
import { buildEpisodeExtractionPrompt } from "./subagent-prompt";

// ─── Args ───

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`graphify-episode — Per-episode knowledge graph generation

Usage:
  bun run src/scripts/graphify-episode.ts <episode-dir> [options]

Options:
  --series-dir <path>   Series directory (for PLAN.md gag matching)
                        Defaults to parent of episode directory.
  --mode regex|ai|hybrid Extraction mode (default: hybrid)
                        ai: use LLM for richer extraction (requires API key)
                        regex: fast pattern-based extraction only
                        hybrid: regex first, then AI supplements exclusive types (default)
  --provider <name>     AI provider (default: zai)
  --model <name>        AI model (default: glm-4.7-flash)
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

const outDir = resolve(episodeDir, "storygraph_out");

// Parse --mode/--provider/--model
const aiConfig = parseArgsForAI(args);

// Load series config (auto-detected from directory name) — must be before EP_ID extraction
const config: SeriesConfig = getSeriesConfigOrThrow(seriesDir);

// Extract episode ID from directory name using series config pattern
const epId = extractEpId(config, basename(episodeDir));
if (!epId) {
  console.error(`Cannot extract episode ID from: ${basename(episodeDir)}`);
  console.error(`Expected pattern: ${config.episodeDirPattern}`);
  process.exit(1);
}
const EP_ID = epId;

// For backward compat, extract chapter/ep match if available
const epIdMatch = EP_ID.match(/ch(\d+)ep(\d+)/);

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

// Extract title from narration (needed by both AI and regex paths)
let title = "";
try {
  const narrationContent = readFileSync(narrationPath, "utf-8");
  const titleRegex = getTitlePattern(config);
  if (titleRegex) {
    const titleMatch = narrationContent.match(titleRegex);
    if (titleMatch) title = titleMatch[1].trim();
  }
  if (!title) {
    const flatMatch = narrationContent.match(/第[一二三四五六七八九十\d]+集[：:]\s*(.+)/);
    if (flatMatch) title = flatMatch[1].trim().replace(/\n.*/, "");
  }
} catch {}

// ─── Step 1.5: AI extraction branch (--mode ai) ───

let usedAI = false;

if (aiConfig.mode === "ai") {
  console.log(`\n[AI mode] Calling ${aiConfig.provider}/${aiConfig.model}...`);
  try {
    const narrationContent = readFileSync(narrationPath, "utf-8");
    const prompt = buildEpisodeExtractionPrompt({
      episode_id: EP_ID,
      episode_title: title || EP_ID,
      series_name: config.displayName,
      narration_text: narrationContent,
      charNames: config.charNames,
      techPatterns: config.techPatterns.map(p => p.source),
    });

    const result = await callAI(prompt, {
      provider: aiConfig.provider,
      model: aiConfig.model,
      jsonMode: true,
      maxRetries: 1,
    });

    if (result) {
      const parsed = JSON.parse(result);
      const aiNodes: GraphNode[] = Array.isArray(parsed.nodes) ? parsed.nodes : [];
      const aiEdges: GraphEdge[] = Array.isArray(parsed.edges) ? parsed.edges : [];

      // Validate: all node IDs must start with EP_ID
      const validNodes = aiNodes.filter((n: GraphNode) => n.id?.startsWith(`${EP_ID}_`));
      const nodeIds = new Set(validNodes.map((n: GraphNode) => n.id));

      // Validate: edge sources/targets must reference existing nodes
      const validEdges = aiEdges.filter((e: GraphEdge) =>
        nodeIds.has(e.source) && nodeIds.has(e.target) && e.source !== e.target
      );

      if (validNodes.length >= 2) {
        // Fill in required GraphNode fields that AI may omit
        for (const n of validNodes) {
          n.file_type = n.file_type ?? "document";
          n.source_file = n.source_file ?? `${EP_ID}/narration.ts`;
          n.source_location = n.source_location ?? null;
        }
        for (const e of validEdges) {
          e.confidence = e.confidence ?? "INFERRED";
          e.confidence_score = e.confidence_score ?? 0.8;
          e.source_file = e.source_file ?? `${EP_ID}/narration.ts`;
          e.source_location = e.source_location ?? null;
          e.weight = e.weight ?? 1.0;
        }

        nodes.push(...validNodes);
        edges.push(...validEdges);
        usedAI = true;
        console.log(`[AI mode] Extracted ${validNodes.length} nodes, ${validEdges.length} edges`);
      } else {
        console.warn(`[AI mode] Too few valid nodes (${validNodes.length}), falling back to regex`);
      }
    } else {
      console.warn(`[AI mode] callAI returned null, falling back to regex`);
    }
  } catch (err: any) {
    console.warn(`[AI mode] Failed: ${err.message}, falling back to regex`);
  }
}

if (!usedAI) {
// ─── Step 2: Extract episode plot node (regex) ───

addNode(
  `${EP_ID}_plot`,
  title ? `${title} (${EP_ID})` : EP_ID,
  "episode_plot",
  { language: parsed.language }
);

// ─── Step 2.5: Extract scene nodes ───

for (const scene of parsed.scenes) {
  const sceneId = `${EP_ID}_scene_${scene.scene}`;
  const uniqueChars = new Set(scene.lines.map(l => l.character));
  const effectPat = getEffectPattern(config);
  let effectCount = 0;
  if (effectPat) {
    for (const line of scene.lines) {
      const m = line.text.match(effectPat);
      if (m) effectCount += m.length;
    }
  }
  addNode(sceneId, scene.scene, "scene", {
    dialog_line_count: String(scene.lines.length),
    character_count: String(uniqueChars.size),
    effect_count: String(effectCount),
  });
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

      if (chapterSectionMatch && epIdMatch) {
        // my-core-is-boss style: chapter-columns table
        const chapterNum = epIdMatch[1];
        const tableLines = chapterSectionMatch[1].split("\n").filter(
          l => l.startsWith("|") && !l.includes("---")
        );

        if (tableLines.length >= 1) {
          const headerCells = tableLines[0].split("|").map(c => c.trim()).filter(Boolean);
          let chapterColIdx = -1;

          for (let i = 1; i < headerCells.length; i++) {
            if (headerCells[i] === `Ch${chapterNum}`) {
              chapterColIdx = i;
              break;
            }
          }

          if (chapterColIdx >= 0) {
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
      } else if (evolutionSectionMatch) {
        // galgame-meme-theater style: Gag | Pattern | Episodes | Evolution
        const tableLines = evolutionSectionMatch[1].split("\n").filter(
          l => l.startsWith("|") && !l.includes("---")
        );

        for (const row of tableLines) {
          const cells = row.split("|").map(c => c.trim()).filter(Boolean);
          if (cells.length < 4) continue;

          const gagName = cells[0];
          const episodesCol = cells[2]; // "ep1, ep2, ep3, ep4"
          const evolutionCol = cells[3]; // "ep1奶茶→ep2再一局→..."

          // Check if this episode is in the episodes list
          const epList = episodesCol.split(",").map(e => e.trim().toLowerCase());
          if (!epList.includes(EP_ID.toLowerCase())) continue;

          // Extract this episode's manifestation from evolution chain
          // Format: "ep1奶茶→ep2再一局→ep3夜市→ep4手搖飲"
          let manifestation = "";
          const parts = evolutionCol.split("→");
          for (const part of parts) {
            const epTagMatch = part.match(/ep\d+/i);
            if (epTagMatch && epTagMatch[0].toLowerCase() === EP_ID.toLowerCase()) {
              manifestation = part.replace(/ep\d+/i, "").trim();
              break;
            }
          }
          // Fallback: use pattern description if evolution didn't parse
          if (!manifestation) manifestation = cells[1]; // Pattern column

          const gagId = `${EP_ID}_gag_${gagName.replace(/\s+/g, "_")}`;
          addNode(gagId, `${gagName}：${manifestation} (${EP_ID})`, "gag_manifestation", {
            gag_type: gagName,
            episode: EP_ID,
          });
          addEdge(gagId, `${EP_ID}_plot`, "appears_in");
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

} // end if (!usedAI)

// ─── Step 7.5: Hybrid AI supplement (--mode hybrid) ───

if (aiConfig.mode === "hybrid") {
  console.log(`\n[Hybrid mode] Calling ${aiConfig.provider}/${aiConfig.model} for exclusive nodes...`);
  try {
    const narrationContent = readFileSync(narrationPath, "utf-8");
    const prompt = buildEpisodeExtractionPrompt({
      episode_id: EP_ID,
      episode_title: title || EP_ID,
      series_name: config.displayName,
      narration_text: narrationContent,
      charNames: config.charNames,
      techPatterns: config.techPatterns.map(p => p.source),
    });

    const result = await callAI(prompt, {
      provider: aiConfig.provider,
      model: aiConfig.model,
      jsonMode: true,
      maxRetries: 1,
    });

    if (result) {
      const parsed = JSON.parse(result);
      const aiNodes: GraphNode[] = Array.isArray(parsed.nodes) ? parsed.nodes : [];
      const aiEdges: GraphEdge[] = Array.isArray(parsed.edges) ? parsed.edges : [];

      const existingIds = new Set(nodes.map(n => n.id));
      const existingEdgeKeys = new Set(edges.map(e => `${e.source}|${e.target}|${e.relation}`));

      const exclusiveNodes: GraphNode[] = [];
      const exclusiveEdges: GraphEdge[] = [];

      for (const n of aiNodes) {
        if (!n.id?.startsWith(`${EP_ID}_`)) continue;
        if (existingIds.has(n.id)) continue;
        n.file_type = n.file_type ?? "document";
        n.source_file = n.source_file ?? `${EP_ID}/narration.ts`;
        n.source_location = n.source_location ?? null;
        exclusiveNodes.push(n);
        existingIds.add(n.id);
      }

      const nodeIds = new Set(nodes.map(n => n.id).concat(exclusiveNodes.map(n => n.id)));
      for (const e of aiEdges) {
        if (e.source === e.target) continue;
        if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
        const key = `${e.source}|${e.target}|${e.relation}`;
        if (existingEdgeKeys.has(key)) continue;
        e.confidence = e.confidence ?? "INFERRED";
        e.confidence_score = e.confidence_score ?? 0.8;
        e.source_file = e.source_file ?? `${EP_ID}/narration.ts`;
        e.source_location = e.source_location ?? null;
        e.weight = e.weight ?? 1.0;
        exclusiveEdges.push(e);
        existingEdgeKeys.add(key);
      }

      nodes.push(...exclusiveNodes);
      edges.push(...exclusiveEdges);

      const byType: Record<string, number> = {};
      for (const n of exclusiveNodes) byType[n.type ?? "unknown"] = (byType[n.type ?? "unknown"] ?? 0) + 1;
      const typeSummary = Object.entries(byType).map(([t, c]) => `${t}: ${c}`).join(", ");
      console.log(`[Hybrid mode] Added ${exclusiveNodes.length} exclusive AI nodes (${typeSummary}), ${exclusiveEdges.length} exclusive edges`);
    } else {
      console.warn(`[Hybrid mode] callAI returned null, using regex-only output`);
    }
  } catch (err: any) {
    console.warn(`[Hybrid mode] AI failed: ${err.message}, using regex-only output`);
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
  manifest: {
    generator: "storygraph",
    version: "0.11.0",
    mode: aiConfig.mode,
    ai_model: aiConfig.mode !== "regex" ? `${aiConfig.provider}/${aiConfig.model}` : null,
    timestamp: new Date().toISOString(),
    episode_id: EP_ID,
  },
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
