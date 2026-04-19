/**
 * Generate a story-writing constraint prompt from the existing knowledge graph.
 *
 * Reads merged graph + consistency data + story files and outputs a structured
 * generation prompt that constrains story writing for a target episode.
 * This closes the feedback loop: KG → generation prompt → story → KG extraction.
 *
 * Usage:
 *   bun run src/scripts/graphify-gen-prompt.ts <series-dir> --target-ep ch<N>ep<M>
 *
 * Example:
 *   bun run src/scripts/graphify-gen-prompt.ts ../../bun_remotion_proj/my-core-is-boss --target-ep ch2ep1
 */

import { resolve, basename, dirname } from "node:path";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { getSeriesConfigOrThrow } from "./series-config";
import type { SeriesConfig } from "./series-config";
import { parseNarration } from "../extract/narrative";

// ─── Args ───

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`graphify-gen-prompt — Generate story-writing constraint prompt from KG

Usage:
  bun run src/scripts/graphify-gen-prompt.ts <series-dir> --target-ep <epId>

Options:
  --target-ep <epId>   Target episode ID (e.g., ch2ep1). Required.

Reads merged-graph.json, check-enrichment-input.json, plot-arcs.md, plot-lines.md,
and previous episode narration.ts.
Outputs generation-prompt-<epId>.md in the series storygraph_out/ directory.
`);
  process.exit(0);
}

const seriesDir = resolve(args[0]);

const targetEpIdx = args.indexOf("--target-ep");
if (targetEpIdx === -1 || !args[targetEpIdx + 1]) {
  console.error("Error: --target-ep <epId> is required (e.g., --target-ep ch2ep1)");
  process.exit(1);
}
const TARGET_EP = args[targetEpIdx + 1];

// P0: Absolute path validation
if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path. Use absolute paths.`);
  process.exit(1);
}

const config: SeriesConfig = getSeriesConfigOrThrow(seriesDir);
const outDir = resolve(seriesDir, "storygraph_out");
const outputPath = resolve(outDir, `generation-prompt-${TARGET_EP}.md`);

console.log(`Series: ${config.displayName} (${seriesDir})`);
console.log(`Target: ${TARGET_EP}`);
console.log(`Output: ${outputPath}`);

// ─── Load data sources ───

// 1. Merged graph
const mergedPath = resolve(outDir, "merged-graph.json");
if (!existsSync(mergedPath)) {
  console.error(`No merged graph found at ${mergedPath}`);
  console.error("Run graphify-merge first.");
  process.exit(1);
}
const merged = JSON.parse(readFileSync(mergedPath, "utf-8"));

// 2. Enrichment input (character trait comparisons)
const enrichPath = resolve(outDir, "check-enrichment-input.json");
const enrichment = existsSync(enrichPath)
  ? JSON.parse(readFileSync(enrichPath, "utf-8"))
  : null;

// 3. Link edges
const linkEdgesPath = resolve(outDir, "link-edges.json");
const linkEdges = existsSync(linkEdgesPath)
  ? JSON.parse(readFileSync(linkEdgesPath, "utf-8"))
  : [];

// 4. Plot arcs
const plotArcsPath = resolve(seriesDir, "assets", "story", "plot-arcs.md");
const plotArcs = existsSync(plotArcsPath)
  ? readFileSync(plotArcsPath, "utf-8")
  : "";

// 5. Plot lines (gag tracking)
const plotLinesPath = resolve(seriesDir, "assets", "story", "plot-lines.md");
const plotLines = existsSync(plotLinesPath)
  ? readFileSync(plotLinesPath, "utf-8")
  : "";

// ─── Extract target episode info ───

// Parse chapter/episode numbers
const epMatch = TARGET_EP.match(/ch(\d+)ep(\d+)/);
if (!epMatch) {
  console.error(`Cannot parse episode ID: ${TARGET_EP}`);
  process.exit(1);
}
const targetCh = parseInt(epMatch[1]);
const targetEpNum = parseInt(epMatch[2]);

// ─── Build node lookup ───

const nodesMap = new Map<string, any>();
for (const n of merged.nodes) {
  nodesMap.set(n.id, n);
}

// ─── Section 1: Character trait constraints ───

function buildCharacterConstraints(): string[] {
  const lines: string[] = [];
  lines.push("## 角色特質約束");
  lines.push("");

  if (!enrichment?.characterComparisons) {
    lines.push("*尚無跨集角色特質資料。請參考 assets/story/characters.md 角色指南。*");
    lines.push("");
    return lines;
  }

  // Determine target episode characters from plot-arcs
  const targetChars = extractTargetCharacters();

  for (const comp of enrichment.characterComparisons) {
    const charId = comp.id;
    if (charId === "narrator") continue; // Skip narrator
    if (targetChars.length > 0 && !targetChars.includes(charId)) continue; // Only include chars in this episode

    const charName = comp.character;
    lines.push(`### ${charName} (${charId})`);

    // Stable traits
    if (comp.sharedTraits && comp.sharedTraits.length > 0) {
      lines.push(`- **穩定特質（必須展現）：** ${comp.sharedTraits.join("、")}`);
    } else {
      lines.push(`- **穩定特質：** 尚未建立（集數不足）— 參考角色指南建立第一個穩定特質`);
    }

    // Recent variant traits (from last 2 episodes)
    const recentEpisodes = comp.episodes.slice(-2);
    const recentTraits = new Set<string>();
    for (const ep of recentEpisodes) {
      for (const t of ep.traits) {
        if (!comp.sharedTraits?.includes(t)) {
          recentTraits.add(t);
        }
      }
    }
    if (recentTraits.size > 0) {
      lines.push(`- **近集變體：** ${[...recentTraits].join("、")}`);
    }

    lines.push(`- **本集要求：** 至少展現 1 項穩定特質 + 1 項新變體特質`);
    lines.push("");
  }

  return lines;
}

// ─── Section 2: Tech term dedup ───

function buildTechTermDedup(): string[] {
  const lines: string[] = [];
  lines.push("## 科技術語");
  lines.push("");

  // Group tech terms by episode
  const termsByEp = new Map<string, string[]>();
  for (const n of merged.nodes) {
    if (n.type !== "tech_term") continue;
    const epId = n.id.match(/^ch\d+ep\d+/)?.[0];
    if (!epId) continue;
    if (!termsByEp.has(epId)) termsByEp.set(epId, []);
    termsByEp.get(epId)!.push(n.label);
  }

  // All used terms
  const allUsed = new Set<string>();
  for (const [, terms] of termsByEp) {
    for (const t of terms) allUsed.add(t);
  }

  if (termsByEp.size > 0) {
    lines.push("### 已使用（避免重複）");
    lines.push("");
    const sortedEps = [...termsByEp.entries()].sort(([a], [b]) => a.localeCompare(b));
    for (const [epId, terms] of sortedEps) {
      lines.push(`- ${epId}: ${terms.join("、")}`);
    }
    lines.push("");
  }

  // Suggested new directions from plot-arcs
  const targetBeats = extractTargetBeats();
  if (targetBeats) {
    lines.push("### 本集主題方向");
    lines.push("");
    lines.push(`根據 plot-arcs.md 中的本集核心梗：**${targetBeats.coreGag}**`);
    lines.push("");
    lines.push("提示：從 config.techPatterns 中選擇未使用的術語，或根據本集主題創造新的玩家黑話。");
    lines.push("");
  }

  return lines;
}

// ─── Section 3: Gag evolution chains ───

function buildGagEvolution(): string[] {
  const lines: string[] = [];
  lines.push("## 招牌梗演進");
  lines.push("");

  // Primary: parse from plot-lines.md (most reliable source for my-core-is-boss style)
  let hasGagData = false;
  if (plotLines) {
    // Find the table after ## 招牌梗追蹤 — allow arbitrary text between heading and table
    const gagSectionMatch = plotLines.match(/## 招牌梗追蹤[\s\S]*?((?:\|.*\n)(?:\|[-]+\|.*\n)?(?:\|.*\n)+)/);
    if (gagSectionMatch) {
      const tableLines = gagSectionMatch[1].split("\n").filter(l => l.startsWith("|") && !l.includes("---"));
      if (tableLines.length >= 2) {
        const headerCells = tableLines[0].split("|").map(c => c.trim()).filter(Boolean);

        // Map chapter columns
        const chapterCols: { chNum: number; colIdx: number }[] = [];
        for (let c = 1; c < headerCells.length; c++) {
          const chMatch = headerCells[c].match(/Ch(\d+)/);
          if (chMatch) chapterCols.push({ chNum: parseInt(chMatch[1]), colIdx: c });
        }

        for (let r = 1; r < tableLines.length; r++) {
          const cells = tableLines[r].split("|").map(c => c.trim()).filter(Boolean);
          if (cells.length < 2) continue;

          const gagName = cells[0];
          lines.push(`### ${gagName}`);
          lines.push("");

          // Show history from previous chapters
          for (const { chNum, colIdx } of chapterCols) {
            if (colIdx < cells.length) {
              const text = cells[colIdx];
              if (text && text !== "TBD" && text !== "—") {
                lines.push(`- Ch${chNum}: ${text}`);
              }
            }
          }

          lines.push(`- 本集期望：演化升級，不要停滯（避免與前集相同的表現方式）`);
          lines.push("");
          hasGagData = true;
        }
      }
    }
  }

  // Fallback: gag nodes from merged graph (weapon-forger style)
  if (!hasGagData) {
    const gagNodesByType = new Map<string, { epId: string; label: string }[]>();
    for (const n of merged.nodes) {
      if (n.type !== "gag_manifestation") continue;
      const gagType = n.properties?.gag_type ?? n.label.split("：")[0];
      const epId = n.properties?.episode ?? n.id.match(/^ch\d+ep\d+/)?.[0] ?? "";
      if (!gagNodesByType.has(gagType)) gagNodesByType.set(gagType, []);
      gagNodesByType.get(gagType)!.push({
        epId,
        label: n.label.replace(/\s*\(ch\d+ep\d+\)$/, ""),
      });
    }

    for (const [gagType, manifestations] of gagNodesByType) {
      manifestations.sort((a, b) => a.epId.localeCompare(b.epId));
      lines.push(`### ${gagType}`);
      lines.push("");
      for (const m of manifestations) {
        lines.push(`- ${m.epId}: ${m.label}`);
      }
      lines.push(`- 本集期望：演化升級，不要停滯（避免與上集相同的表現方式）`);
      lines.push("");
    }
  }

  if (!hasGagData && lines.length <= 2) {
    lines.push("*尚無招牌梗資料。請參考 plot-lines.md 中的招牌梗追蹤表。*");
    lines.push("");
  }

  return lines;
}

// ─── Section 4: Arc continuity ───

function buildArcContinuity(): string[] {
  const lines: string[] = [];
  lines.push("## Arc 連續性");
  lines.push("");

  // Find previous episode
  const prevEp = findPreviousEpisode();

  // Get teaser from previous episode's OutroScene
  if (prevEp) {
    const teaser = extractTeaserFromEpisode(prevEp);
    if (teaser) {
      lines.push(`- **承接：** ${prevEp} OutroScene 預告「${teaser}」`);
    } else {
      lines.push(`- **承接：** ${prevEp}（未能提取 OutroScene 預告文字，請手動讀取）`);
    }
  } else {
    lines.push(`- **承接：** 這是第一章第一集，無前集預告`);
  }

  // Get next episode hook from plot-arcs
  const nextEp = findNextEpisode();
  if (nextEp) {
    const nextBeats = extractEpisodeBeats(nextEp);
    if (nextBeats) {
      lines.push(`- **伏筆：** ${nextEp}（${nextBeats.title}）— 在 OutroScene 中埋下伏筆`);
    } else {
      lines.push(`- **伏筆：** ${nextEp}（請參考 plot-arcs.md）`);
    }
  } else {
    lines.push(`- **伏筆：** 本集為目前最新集，無下集預告需求`);
  }

  // Arc position
  const targetBeats = extractTargetBeats();
  if (targetBeats) {
    lines.push(`- **Arc 位置：** ${targetBeats.arcPosition}`);
  }

  lines.push("");
  return lines;
}

// ─── Section 5: Interaction patterns ───

function buildInteractionPatterns(): string[] {
  const lines: string[] = [];
  lines.push("## 互動模式");
  lines.push("");

  const targetChars = extractTargetCharacters();
  lines.push(`本集角色: ${targetChars.map(c => config.charNames[c] ?? c).join("、")}`);
  lines.push("");

  // Extract interaction patterns from previous episodes
  // Find which character pairs have interacted
  const pairHistory = new Map<string, string[]>();
  for (const edge of merged.links) {
    if (edge.relation !== "interacts_with") continue;
    const sourceChar = edge.source.split("_char_")[1]?.split("_")[0];
    const targetChar = edge.target.split("_char_")[1]?.split("_")[0];
    if (!sourceChar || !targetChar) continue;
    if (sourceChar === "narrator" || targetChar === "narrator") continue;

    const key = [sourceChar, targetChar].sort().join(" ↔ ");
    const epId = edge.source.match(/^ch\d+ep\d+/)?.[0] ?? "";
    if (!pairHistory.has(key)) pairHistory.set(key, []);
    pairHistory.get(key)!.push(epId);
  }

  // List required interactions for target characters
  for (let i = 0; i < targetChars.length; i++) {
    for (let j = i + 1; j < targetChars.length; j++) {
      const a = targetChars[i];
      const b = targetChars[j];
      if (a === "narrator" || b === "narrator") continue;
      const nameA = config.charNames[a] ?? a;
      const nameB = config.charNames[b] ?? b;
      const key = [a, b].sort().join(" ↔ ");
      const history = pairHistory.get(key);
      if (history && history.length > 0) {
        lines.push(`- ${nameA} ↔ ${nameB}: 前集已有互動（${[...new Set(history)].join("、")}），本集需深化或展現新面向`);
      } else {
        lines.push(`- ${nameA} ↔ ${nameB}: 首次互動，建立兩人關係動態`);
      }
    }
  }

  lines.push("");
  return lines;
}

// ─── Helpers ───

function extractTargetCharacters(): string[] {
  if (!plotArcs) return [];
  // Find target episode section in plot-arcs
  const epPattern = new RegExp(
    `###\\s*${TARGET_EP.replace(/ep/, "-Ep")}\\s*—\\s*(.+?)(?=\\n\\n|$)`,
    "i"
  );
  // Also try alternate formats
  const epMatch1 = plotArcs.match(
    new RegExp(`###\\s*Ch${targetCh}-Ep${targetEpNum}\\s*[—-]\\s*(.+?)\\n`, "i")
  );
  const epMatch2 = plotArcs.match(
    new RegExp(`###\\s*Ch${targetCh}-Ep${targetEpNum}\\s+[—-]\\s*(.+?)\\n`, "i")
  );

  // Try to extract characters from plot-arcs line
  const charLine = plotArcs.match(
    new RegExp(`\\*\\*角色[：:]\\*\\*\\s*(.+?)\\n`, "i")
  );
  if (charLine) {
    const charNames = charLine[1].split(/[,，、]/).map(c => c.trim()).filter(Boolean);
    // Map display names to IDs
    return charNames.map(name => {
      for (const [id, display] of Object.entries(config.charNames)) {
        if (display === name || name.includes(display)) return id;
      }
      return name.toLowerCase();
    });
  }

  return [];
}

function extractTargetBeats(): { coreGag: string; arcPosition: string } | null {
  if (!plotArcs) return null;

  // Find the target episode section
  const sectionMatch = plotArcs.match(
    new RegExp(
      `###\\s*Ch${targetCh}-Ep${targetEpNum}\\s*[—-]\\s*(.+?)(?=\\n###\\s*Ch|\\n##\\s|$)`,
      "s"
    )
  );
  if (!sectionMatch) return null;

  const section = sectionMatch[0];
  const title = sectionMatch[1].trim();

  // Extract core gag
  const gagMatch = section.match(/\*\*核心梗[：:]?\*\*\s*(.+?)\n/i)
    ?? section.match(/核心梗[：:]\s*(.+?)\n/i);
  const coreGag = gagMatch ? gagMatch[1].replace(/^\*+|\*+$/g, "").trim() : title;

  // Determine arc position from chapter context
  // Count episodes in this chapter from plot-arcs
  const chEpCount = plotArcs.match(
    new RegExp(`###\\s*Ch${targetCh}-Ep\\d+`, "g")
  )?.length ?? 0;

  let arcPosition = "";
  if (chEpCount === 3) {
    arcPosition = targetEpNum === 1 ? "鋪陳（setup）" : targetEpNum === 2 ? "升級（escalation）" : "高潮 + 伏筆（cliffhanger）";
  } else if (chEpCount === 4) {
    arcPosition = targetEpNum === 1 ? "鋪陳" : targetEpNum === 2 ? "升級" : targetEpNum === 3 ? "高潮" : "收尾 + 伏筆";
  } else {
    arcPosition = `第 ${targetEpNum}/${chEpCount} 集`;
  }

  return { coreGag, arcPosition };
}

function extractEpisodeBeats(epId: string): { title: string } | null {
  if (!plotArcs) return null;
  const m = epId.match(/ch(\d+)ep(\d+)/);
  if (!m) return null;
  const ch = m[1];
  const ep = m[2];

  const match = plotArcs.match(
    new RegExp(`###\\s*Ch${ch}-Ep${ep}\\s*[—-]\\s*(.+?)\\n`, "i")
  );
  if (!match) return null;
  return { title: match[1].trim() };
}

function findPreviousEpisode(): string | null {
  // Try story_continues link edges
  for (const le of linkEdges) {
    if (le.relation === "story_continues") {
      const targetPlot = `${TARGET_EP}_plot`;
      if (le.target === targetPlot || le.target?.includes(TARGET_EP)) {
        return le.source?.replace("_plot", "") ?? null;
      }
    }
  }

  // Fallback: find the last existing episode before target (cross-chapter safe)
  const epDirPattern = config.episodeDirPattern;
  const entries = readdirSync(seriesDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && epDirPattern.test(e.name))
    .map(e => {
      const m = e.name.match(epDirPattern)!;
      return { dir: e.name, ch: parseInt(m[1]), ep: parseInt(m[2]), epId: `ch${m[1]}ep${m[2]}` };
    })
    .sort((a, b) => a.ch * 100 + a.ep - (b.ch * 100 + b.ep));

  // Find episodes BEFORE target (even if target doesn't exist as directory)
  const targetSortKey = targetCh * 100 + targetEpNum;
  const before = entries.filter(e => e.ch * 100 + e.ep < targetSortKey);
  if (before.length > 0) return before[before.length - 1].epId;

  return null;
}

function findNextEpisode(): string | null {
  if (!plotArcs) return null;

  // Find next episode from plot-arcs
  const nextEpNum = targetEpNum + 1;
  const nextEpId = `ch${targetCh}ep${nextEpNum}`;

  // Check if next ep in same chapter exists in plot-arcs
  const hasNextEpInChapter = plotArcs.match(
    new RegExp(`###\\s*Ch${targetCh}-Ep${nextEpNum}\\s`, "i")
  );
  if (hasNextEpInChapter) return nextEpId;

  // Check if next chapter exists
  const nextCh = targetCh + 1;
  const hasNextChapter = plotArcs.match(
    new RegExp(`###\\s*Ch${nextCh}-Ep1\\s`, "i")
  );
  if (hasNextChapter) return `ch${nextCh}ep1`;

  return null;
}

function extractTeaserFromEpisode(epId: string): string | null {
  // Find the episode directory
  const epDirPattern = config.episodeDirPattern;
  const entries = readdirSync(seriesDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && epDirPattern.test(e.name));

  for (const entry of entries) {
    const m = entry.name.match(epDirPattern)!;
    const entryEpId = `ch${m[1]}ep${m[2]}`;
    if (entryEpId === epId) {
      const narrationPath = resolve(seriesDir, entry.name, "scripts", "narration.ts");
      const parsed = parseNarration(narrationPath);
      if (!parsed) return null;

      // Find OutroScene and extract teaser (last segment mentioning "下集" or series name)
      const outroScene = parsed.scenes.find(s =>
        s.scene.toLowerCase().includes("outro")
      );
      if (!outroScene) return null;

      // Find the teaser line (usually the last segment mentioning next episode)
      for (let i = outroScene.lines.length - 1; i >= 0; i--) {
        const text = outroScene.lines[i].text;
        if (text.includes("下集") || text.includes("我的核心是大佬") || text.includes("誰讓他煉器")) {
          return text;
        }
      }

      // Fallback: return last line
      return outroScene.lines[outroScene.lines.length - 1]?.text ?? null;
    }
  }

  return null;
}

// ─── Assemble output ───

const output: string[] = [];

output.push(`# 故事寫作約束 — ${config.displayName} ${TARGET_EP}`);
output.push("");
output.push(`由知識圖譜自動生成。目的：確保故事寫作符合已建立的結構約束。`);
output.push(`目標集數：${TARGET_EP}`);
output.push(`生成時間：${new Date().toISOString()}`);
output.push("");

// All 5 sections
output.push(...buildCharacterConstraints());
output.push(...buildTechTermDedup());
output.push(...buildGagEvolution());
output.push(...buildArcContinuity());
output.push(...buildInteractionPatterns());

// Write output
const content = output.join("\n");
writeFileSync(outputPath, content);

console.log(`\nDone! Generation prompt written to: ${outputPath}`);
console.log(`Size: ${content.length} bytes`);
