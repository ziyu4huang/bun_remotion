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
import louvain from "graphology-communities-louvain";
import { detectMultiple } from "../detect";
import { extractAST } from "../extract/ast";
import { buildFromExtraction } from "../build";
import { parseNarration } from "../extract/narrative";
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

const outDir = resolve(episodeDir, "bun_graphify_out");

// Extract episode ID from directory name
const epIdMatch = basename(episodeDir).match(/ch(\d+)-ep(\d+)/i);
if (!epIdMatch) {
  console.error(`Cannot extract episode ID from: ${basename(episodeDir)}`);
  console.error(`Expected format: weapon-forger-chN-epM`);
  process.exit(1);
}
const EP_ID = `ch${epIdMatch[1]}ep${epIdMatch[2]}`;
console.log(`Episode: ${EP_ID}`);
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

const CHAR_NAMES: Record<string, string> = {
  zhoumo: "周墨",
  examiner: "考官",
  elder: "長老",
  luyang: "陸陽",
  mengjingzhou: "孟景舟",
  soul: "滄溟子",
  narrator: "旁白",
  yunzhi: "雲芝",
};

for (const charId of parsed.characters) {
  const charName = CHAR_NAMES[charId] ?? charId;
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

// Known tech term patterns (modern terminology used in xianxia context)
const TECH_PATTERNS = [
  /模組化設計/g, /模块化设计/g,
  /使用者體驗/g, /用户体验/g,
  /底層邏輯閉環/g, /底层逻辑闭环/g,
  /指紋識別/g, /指纹识别/g,
  /自動格式化/g, /自动格式化/g,
  /自動尋路/g, /自动寻路/g,
  /核心算法/g,
  /演算法/g, /算法/g,
  /情感交互界面/g,
  /系統升級/g, /系统升级/g,
  /情緒管理系統/g, /情绪管理系统/g,
  /語音控制/g, /语音控制/g,
  /定時休眠/g, /定时休眠/g,
  /壓力釋放模組/g, /压力释放模块/g,
  /被動技能/g, /被动技能/g,
  /離線終端/g, /离线终端/g,
  /自動防禦系統/g, /自动防御系统/g,
  /密碼重設/g, /密码重设/g,
  /記憶區段/g, /记忆区段/g,
  /人工智慧/g, /人工智能/g,
  /常規維護/g, /常规维护/g,
  /認可系統/g, /认可系统/g,
  /自動評價系統/g, /自动评价系统/g,
  /評價標準/g, /评价标准/g,
  /資訊系統/g, /信息系统/g,
  /雷射切割/g, /激光切割/g,
  /冗餘設計/g, /冗余设计/g,
  /備份系統/g, /备份系统/g,
  /自動防禦協議/g, /自动防御协议/g,
  /演算法思維/g, /算法思维/g,
];

// Character → tech terms mapping
const charTechTerms: Record<string, Set<string>> = {};
for (const charId of parsed.characters) {
  charTechTerms[charId] = new Set();
  for (const scene of parsed.scenes) {
    for (const line of scene.lines) {
      if (line.character === charId) {
        for (const pattern of TECH_PATTERNS) {
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

// ─── Step 6: Match running gags from PLAN.md ───

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
    console.warn(`Warning: Could not parse PLAN.md: ${e}`);
  }
}

// ─── Step 7: Extract character speech traits (heuristic) ───

// Known trait patterns per character
const TRAIT_PATTERNS: Record<string, { pattern: RegExp; trait: string }[]> = {
  zhoumo: [
    { pattern: /模組化|模块化|設計|设计|使用者|用户|體驗|体验|邏輯|逻辑|閉環|闭环/, trait: "科技工程術語" },
    { pattern: /忘加|忘記加|忘记加|沒加|没加/, trait: "忘加按鈕/功能" },
    { pattern: /效率|演算法|算法|模組|模块|系統|系统/, trait: "工程師思維" },
    { pattern: /技術上來說|技术上来说|準確地說|准确地说|從.*角度/, trait: "用邏輯包裝荒謬" },
    { pattern: /升級|優化|优化|維護|维护|修復|修复/, trait: "萬物皆可修" },
  ],
  examiner: [
    { pattern: /你知不知道|還敢|管.*叫|破.*收/, trait: "崩潰吐槽" },
    { pattern: /入宗|考試|考试|通過|通过|不合格/, trait: "權威考官" },
  ],
  elder: [
    { pattern: /有意思|創新|创新|不錯|不错/, trait: "欣賞創新" },
    { pattern: /警告|不許|不许|小心/, trait: "毒舌警告" },
    { pattern: /恰恰|正是|需要/, trait: "認可但擔憂" },
  ],
  luyang: [
    { pattern: /投降|認輸|认输|別打了|對不起/, trait: "投降反射" },
    { pattern: /投降表|投降劍法/, trait: "隨時備好投降表" },
    { pattern: /好像|似乎|比喻/, trait: "天真神比喻" },
  ],
  mengjingzhou: [
    { pattern: /論文|论文|研究|數據|数据|統計|统计/, trait: "研究狂" },
    { pattern: /單身|女朋友|絕緣/, trait: "單身光環" },
    { pattern: /記錄|记录|採集|采集|第.*篇/, trait: "一切皆為數據" },
  ],
  soul: [
    { pattern: /吾乃|上古|三千/, trait: "上古大能口吻" },
    { pattern: /忘記|忘加|忘/, trait: "家族遺傳忘性" },
  ],
};

for (const [charId, patterns] of Object.entries(TRAIT_PATTERNS)) {
  const charNodeId = `${EP_ID}_char_${charId}`;
  if (!nodes.find(n => n.id === charNodeId)) continue; // Character not in this episode

  const charDialog = nodes.find(n => n.id === charNodeId)?.properties?.dialog_text ?? "";

  for (const { pattern, trait } of patterns) {
    if (pattern.test(charDialog)) {
      const traitId = `${EP_ID}_trait_${charId}_${trait.replace(/\s+/g, "_")}`;
      // Only add if not duplicate
      if (!nodes.find(n => n.id === traitId)) {
        addNode(traitId, `${CHAR_NAMES[charId] ?? charId}: ${trait}`, "character_trait", {
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

// ─── Step 9: Cluster (if enough nodes) ───

let communities: Record<number, string[]> = {};
if (G.order > 5) {
  try {
    const mapping: Record<string, number> = louvain(G);
    for (const [node, cid] of Object.entries(mapping)) {
      if (!communities[cid]) communities[cid] = [];
      communities[cid].push(node);
    }
    console.log(`Communities: ${Object.keys(communities).length}`);
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
