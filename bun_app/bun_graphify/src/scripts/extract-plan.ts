/**
 * Extract structural narrative data from a series PLAN.md.
 *
 * Creates cross-episode backbone nodes (shared characters, arcs, gag types, artifacts)
 * and edges that connect per-episode dialog instances into a coherent graph.
 *
 * Usage:
 *   bun run src/scripts/extract-plan.ts <series-dir>
 *
 * Output: <series-dir>/graphify-out/.semantic/plan.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type { ExtractionResult, GraphNode, GraphEdge, Hyperedge, Confidence } from "../types";

const args = process.argv.slice(2);
const seriesDir = args[0] ? resolve(args[0]) : resolve(import.meta.dir, "../../../../bun_remotion_proj/weapon-forger");
const planPath = resolve(seriesDir, "PLAN.md");
const outDir = resolve(seriesDir, "graphify-out", ".semantic");
const outPath = resolve(outDir, "plan.json");

if (!existsSync(planPath)) {
  console.error(`PLAN.md not found at ${planPath}`);
  process.exit(1);
}

const planContent = readFileSync(planPath, "utf-8");

const nodes: GraphNode[] = [];
const edges: GraphEdge[] = [];
const hyperedges: Hyperedge[] = [];

function makeId(...parts: string[]): string {
  return parts.join("_");
}

function addNode(id: string, label: string, extra: Partial<Pick<GraphNode, "file_type" | "source_file" | "type" | "properties">> = {}): void {
  nodes.push({
    id,
    label,
    file_type: extra.file_type ?? "document",
    source_file: extra.source_file ?? "PLAN.md",
    source_location: null,
    type: extra.type,
    properties: extra.properties,
  });
}

function addEdge(source: string, target: string, relation: string, confidence: Confidence = "EXTRACTED", score = 1.0): void {
  edges.push({
    source,
    target,
    relation,
    confidence,
    confidence_score: score,
    source_file: "PLAN.md",
    source_location: null,
    weight: 1.0,
  });
}

function addHyperedge(id: string, label: string, nodeIds: string[], relation: string, confidence: Confidence = "EXTRACTED", score = 1.0): void {
  hyperedges.push({
    id,
    label,
    nodes: nodeIds,
    relation,
    confidence,
    confidence_score: score,
    source_file: "PLAN.md",
  });
}

// ─── Step 1: Extract character baselines ───

const charSection = planContent.match(/\|\s*Character\s*\|.*?\n([\s\S]*?)(?=\n##|\n$)/);
const charDefs: Record<string, { name: string; voice: string; color: string; firstAppearance?: string }> = {};

if (charSection) {
  const charRows = charSection[1].split("\n").filter(l => l.startsWith("|") && !l.includes("---"));
  for (const row of charRows) {
    const cells = row.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length >= 4) {
      const [charId, name, voice, color] = cells;
      charDefs[charId] = { name, voice, color };
    }
  }
}

// Check for new characters section (e.g., 雲芝)
const newCharSection = planContent.match(/New characters:\s*\n([\s\S]*?)(?=\n\n|\n##|\n$)/i);
if (newCharSection) {
  const newCharRows = newCharSection[1].split("\n").filter(l => l.startsWith("|") && !l.includes("---"));
  for (const row of newCharRows) {
    const cells = row.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length >= 5) {
      const [charId, name, voice, color, firstApp] = cells;
      charDefs[charId] = { name, voice, color, firstAppearance: firstApp };
    }
  }
}

// Also hardcode known characters in case table parsing misses some
const knownChars: Record<string, { name: string; traits: string }> = {
  zhoumo: { name: "周墨", traits: "科技術語人格,忘加按鈕,模組化設計,使用者體驗,用邏輯包裝荒謬" },
  examiner: { name: "考官", traits: "崩潰吐槽,權威,無奈" },
  elder: { name: "長老", traits: "欣賞創新,毒舌,默默引導,每次警告都無效" },
  luyang: { name: "陸陽", traits: "投降劍法,瞬間投降反射,隨時備好投降表,天真但神比喻" },
  mengjingzhou: { name: "孟景舟", traits: "單身光環,用論文研究單身,一切皆為數據,被動技能" },
  soul: { name: "滄溟子", traits: "上古大能,家族遺傳忘性,忘加拔劍按鈕" },
  narrator: { name: "旁白", traits: "吐槽,預告" },
  yunzhi: { name: "雲芝", traits: "嚴格評估,師姐" },
};

for (const [charId, info] of Object.entries(knownChars)) {
  const charName = charDefs[charId]?.name ?? info.name;
  addNode(
    makeId("char", charId),
    charName,
    { type: "character_baseline", properties: { traits: info.traits } }
  );
}

console.log(`Character baselines: ${Object.keys(knownChars).length} nodes`);

// ─── Step 2: Extract episode guide (completed + planned) ───

interface EpisodeInfo {
  id: string;        // ch1ep1
  title: string;     // 入宗考试
  chapter: number;
  episode: number;
  characters: string[];
  status: string;
}

const episodes: EpisodeInfo[] = [];

const epGuideSection = planContent.match(/\|\s*Episode\s*\|.*?\n([\s\S]*?)(?=\n\n[^|\n]|\n\n\*\*|$)/);
if (epGuideSection) {
  const epRows = epGuideSection[1].split("\n").filter(l => l.startsWith("|") && !l.includes("---"));
  for (const row of epRows) {
    const cells = row.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length >= 5) {
      const [epIdRaw, title, , charsRaw, status] = cells;
      const epMatch = epIdRaw.match(/ch(\d+)-ep(\d+)/i);
      if (epMatch) {
        const ch = parseInt(epMatch[1]);
        const ep = parseInt(epMatch[2]);
        const epId = `ch${ch}ep${ep}`;
        const characters = charsRaw.split(",").map(c => c.trim()).filter(Boolean);
        episodes.push({ id: epId, title, chapter: ch, episode: ep, characters, status: status.trim() });
      }
    }
  }
}

// Create episode plot nodes + edges to characters + arcs
const arcNodes = new Map<number, string>();

for (const ep of episodes) {
  // Episode plot node
  addNode(
    makeId("plot", ep.id),
    `${ep.title} (${ep.id})`,
    { type: "episode_plot", properties: { chapter: String(ep.chapter), episode: String(ep.episode), status: ep.status } }
  );

  // Arc node (per chapter)
  const arcId = makeId("arc", "ch", String(ep.chapter));
  if (!arcNodes.has(ep.chapter)) {
    const arcNames: Record<number, string> = {
      1: "入宗考试",
      2: "禍害三人組",
      3: "秘境探索",
      4: "師姐的肯定",
    };
    addNode(arcId, `第${ep.chapter}章：${arcNames[ep.chapter] ?? `第${ep.chapter}章`}`, { type: "story_arc" });
    arcNodes.set(ep.chapter, arcId);
  }

  // Episode → Arc
  addEdge(makeId("plot", ep.id), arcId, "part_of_arc");

  // Episode → Characters
  for (const charId of ep.characters) {
    const canonicalCharId = charId.toLowerCase();
    if (knownChars[canonicalCharId]) {
      addEdge(makeId("char", canonicalCharId), makeId("plot", ep.id), "appears_in");
    }
  }
}

// Episode chain: continues_story
for (let i = 1; i < episodes.length; i++) {
  addEdge(makeId("plot", episodes[i - 1].id), makeId("plot", episodes[i].id), "continues_story");
}

// Arc chain
const sortedChapters = [...arcNodes.keys()].sort((a, b) => a - b);
for (let i = 1; i < sortedChapters.length; i++) {
  addEdge(arcNodes.get(sortedChapters[i - 1])!, arcNodes.get(sortedChapters[i])!, "continues_arc");
}

console.log(`Episodes: ${episodes.length} plot nodes, ${arcNodes.size} arc nodes`);

// ─── Step 3: Extract running gags ───

interface GagManifestation {
  episodeId: string;
  gagType: string;
  manifestation: string;
}

const gagTypes: { name: string; id: string }[] = [];
const gagManifestations: GagManifestation[] = [];

const gagTableSection = planContent.match(/\|\s*梗\s*\|.*?\n([\s\S]*?)(?=\n\n[^|\n]|\n##|\n$)/);
if (gagTableSection) {
  const gagRows = gagTableSection[1].split("\n").filter(l => l.startsWith("|") && !l.includes("---"));

  // Header row for episode columns
  const headerRow = gagRows[0];
  if (headerRow) {
    // Actually the first data row IS the gag names, the header was already consumed
  }

  // Data rows (one per gag type)
  // Actually the filter removes separators, so gagRows[0] = first data row
  // But the header row before the separator contains episode column names
  // Let's re-parse the full section including header
  const fullGagRows = gagTableSection[1].split("\n").filter(l => l.startsWith("|"));
  // fullGagRows[0] = header (梗, Ep1, Ep2, ...), fullGagRows[1] = separator, fullGagRows[2..] = data

  const headers = fullGagRows[0]?.split("|").map(c => c.trim()).filter(Boolean) ?? [];
  // headers[0] = "梗", headers[1..] = episode labels

  // Map header labels to episode IDs
  const headerEpIds = headers.slice(1).map(h => {
    const m = h.match(/(?:Ch(\d+)-)?Ep(\d+)/i);
    if (m) return `ch${m[1] ?? "1"}ep${m[2]}`;
    // Handle "Ch2-Ep1" format
    const m2 = h.match(/Ch(\d+)-Ep(\d+)/i);
    if (m2) return `ch${m2[1]}ep${m2[2]}`;
    return h.toLowerCase();
  });

  for (let i = 1; i < fullGagRows.length; i++) {
    const cells = fullGagRows[i].split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;

    const gagName = cells[0];
    const gagId = makeId("gag_type", gagName.replace(/\s+/g, "_"));

    // Gag type node
    addNode(gagId, gagName, { type: "gag_type" });
    gagTypes.push({ name: gagName, id: gagId });

    // Manifestation per episode
    for (let j = 1; j < cells.length && j < headerEpIds.length + 1; j++) {
      const manifestation = cells[j];
      const epId = headerEpIds[j - 1];
      if (manifestation && manifestation !== "TBD" && manifestation !== "—") {
        const manifId = makeId("gag", gagName.replace(/\s+/g, "_"), epId);
        addNode(manifId, `${gagName}：${manifestation}`, { type: "gag_manifestation", properties: { episode: epId } });
        addEdge(manifId, gagId, "manifestation_of");
        addEdge(manifId, makeId("plot", epId), "appears_in");
        gagManifestations.push({ episodeId: epId, gagType: gagName, manifestation });
      }
    }
  }
}

// Chain gag manifestations within each gag type (evolves_gag)
for (const gagType of gagTypes) {
  const manifs = gagManifestations
    .filter(g => g.gagType === gagType.name)
    .sort((a, b) => {
      const [ach, aep] = a.episodeId.replace("ch", "").split("ep").map(Number);
      const [bch, bep] = b.episodeId.replace("ch", "").split("ep").map(Number);
      return ach * 100 + aep - (bch * 100 + bep);
    });

  for (let i = 1; i < manifs.length; i++) {
    const prevId = makeId("gag", gagType.name.replace(/\s+/g, "_"), manifs[i - 1].episodeId);
    const currId = makeId("gag", gagType.name.replace(/\s+/g, "_"), manifs[i].episodeId);
    addEdge(prevId, currId, "evolves_gag", "INFERRED", 0.8);
  }

  // Hyperedge for full gag evolution chain
  if (manifs.length >= 2) {
    const chainIds = manifs.map(m => makeId("gag", gagType.name.replace(/\s+/g, "_"), m.episodeId));
    addHyperedge(
      makeId("gag_chain", gagType.name.replace(/\s+/g, "_")),
      `${gagType.name}演變鏈`,
      chainIds,
      "evolves_through"
    );
  }
}

console.log(`Gags: ${gagTypes.length} types, ${gagManifestations.length} manifestations`);

// ─── Step 4: Extract artifacts ───

interface Artifact {
  id: string;
  name: string;
  description: string;
  episode?: string;
}

const artifacts: Artifact[] = [];

// From completed episodes (Story Arcs section)
const storyArcSection = planContent.match(/## Story Arcs[\s\S]*?(?=\n## 招牌梗|\n---|\n$)/);
if (storyArcSection) {
  // Known artifacts from story descriptions
  const knownArtifacts: Artifact[] = [
    { id: "artifact_auto_sword", name: "自動尋路飛劍", description: "尋找靈氣密度最高目標，忘加停止按鈕", episode: "ch1ep1" },
    { id: "artifact_furnace", name: "三百年丹爐", description: "會說話的丹爐，裝了情緒管理系統和音樂播放", episode: "ch1ep3" },
    { id: "artifact_pressure_module", name: "壓力釋放模組", description: "效率提高300%但忘加防爆閥", episode: "ch2ep1" },
    { id: "artifact_cangming_sword", name: "滄溟之劍", description: "宗門至寶，三千年沒人能拔出（忘加拔劍按鈕）", episode: "ch2ep2" },
    { id: "artifact_book_system", name: "藏經閣評價系統", description: "給書加認可系統，但忘加評價標準", episode: "ch2ep3" },
    { id: "artifact_laser_pen", name: "雷射筆", description: "聚焦式靈氣切割陣法發射器，忘加方向控制", episode: "ch3ep1" },
  ];

  for (const art of knownArtifacts) {
    addNode(art.id, art.name, { type: "artifact", properties: { description: art.description } });
    artifacts.push(art);

    // Artifact → episode
    if (art.episode) {
      addEdge(art.id, makeId("plot", art.episode), "appears_in");
    }

    // 周墨 creates all artifacts
    addEdge("char_zhoumo", art.id, "creates_artifact");
  }
}

// From 标志性原创法宝 table
const origArtifactSection = planContent.match(/## 标志性原创法宝[\s\S]*?\n([\s\S]*?)(?=\n##|\n---|\n$)/);
if (origArtifactSection) {
  const artRows = origArtifactSection[1].split("\n").filter(l => l.startsWith("|") && !l.includes("---"));
  for (const row of artRows) {
    const cells = row.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length >= 3) {
      const [name, apparentFunc, actualLogic] = cells;
      const artId = makeId("artifact", name.replace(/[「」""\s]/g, "_").slice(0, 30));
      addNode(artId, name, { type: "planned_artifact", properties: { apparent_function: apparentFunc, actual_logic: actualLogic } });
      addEdge("char_zhoumo", artId, "plans_to_create", "INFERRED", 0.6);
    }
  }
}

console.log(`Artifacts: ${artifacts.length} completed + planned`);

// ─── Step 5: Connect dialog character instances to canonical characters ───

// The dialog.json has nodes like ch1ep1_char_zhoumo — we need edges to char_zhoumo
// We don't read dialog.json here; instead the merge-and-build script handles this
// But we can provide a mapping hint via hyperedges

for (const [charId, info] of Object.entries(knownChars)) {
  // Hyperedge: all episode instances of this character
  const instanceIds = episodes
    .filter(ep => ep.characters.map(c => c.toLowerCase()).includes(charId))
    .map(ep => makeId("ch" + ep.chapter + "ep" + ep.episode, "char", charId));

  if (instanceIds.length > 0) {
    addHyperedge(
      makeId("char_instances", charId),
      `${info.name}跨集角色實例`,
      [makeId("char", charId), ...instanceIds],
      "same_character"
    );
  }
}

// ─── Output ───

const result: ExtractionResult = {
  nodes,
  edges,
  hyperedges,
  input_tokens: 0,
  output_tokens: 0,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log(`\nExtracted: ${nodes.length} nodes, ${edges.length} edges, ${hyperedges.length} hyperedges`);
console.log(`Written to: ${outPath}`);
