/**
 * Generic PLAN.md parser — extracts structured data from any series PLAN.md.
 *
 * Regex parsing for tables (Characters, Episode Guide, Running Gags).
 * Optional LLM enrichment for unstructured prose (Story Arcs, Chapter Rules).
 *
 * Usage:
 *   bun run src/scripts/plan-parser.ts <series-dir> [--mode regex|ai|hybrid]
 *
 * Output: <series-dir>/storygraph_out/plan-struct.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, basename } from "node:path";
import { detectSeries } from "./series-config";
import type { SeriesConfig } from "./series-config";
import { callAI, parseArgsForAI } from "../ai-client";

// ─── Exported Types ───

export interface CharacterDef {
  id: string;
  name: string;
  voice: string;
  gender: string;
  color: string | null;
  images: string[] | null;
  firstEp: string | null;
}

export interface EpisodeDef {
  id: string;           // normalized: "ch1ep1" or "ep1"
  chapter: number | null;
  episode: number | null;
  episodeRange: string | null;  // "1-4" for multi-ep rows
  title: string;
  characters: string[];
  status: string;
  language: string | null;
  theme: string | null;
}

export interface RunningGagTable {
  gagTypes: string[];
  episodeColumns: string[];
  matrix: Record<string, Record<string, string>>;
}

export interface StoryArcEpisode {
  id: string;
  title: string;
  description: string;
}

export interface StoryArcDef {
  chapter: number;
  title: string;
  theme: string;
  episodes: StoryArcEpisode[];
}

export interface ChapterSummary {
  chapter: number;
  episodeCount: number;
  completedCount: number;
  plannedCount: number;
  status: "complete" | "in_progress" | "not_started";
}

export interface PlanStruct {
  seriesId: string;
  seriesName: string;
  metadata: {
    parsedAt: string;
    sourcePath: string;
    mode: string;
  };
  characters: CharacterDef[] | null;
  episodeGuide: EpisodeDef[] | null;
  chapterRules: string[] | null;
  runningGags: RunningGagTable | null;
  storyArcs: StoryArcDef[] | null;
  gagRules: string[] | null;
  chapters: ChapterSummary[];
}

// ─── Helpers ───

/** Normalize episode IDs: ch1-ep1 → ch1ep1, ep1 → ep1 */
export function normalizeEpisodeId(raw: string): string {
  const s = raw.trim();
  // ch1-ep1, Ch1-Ep1, ch1ep1
  const chEp = s.match(/^ch(\d+)[-]?ep(\d+)$/i);
  if (chEp) return `ch${chEp[1]}ep${chEp[2]}`;
  // ep1
  const flat = s.match(/^ep(\d+)$/i);
  if (flat) return `ep${flat[1]}`;
  return s.toLowerCase();
}

/** Parse a markdown table into headers and rows. */
export function parseMarkdownTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  const tableLines = lines.filter(l => l.trimStart().startsWith("|"));
  if (tableLines.length < 2) return null;

  const parseRow = (row: string): string[] =>
    row.split("|").map(c => c.trim()).filter(c => c.length > 0 && !c.match(/^-+$/));

  const headers = parseRow(tableLines[0]);
  if (headers.length === 0) return null;

  const rows: string[][] = [];
  for (let i = 1; i < tableLines.length; i++) {
    const cells = parseRow(tableLines[i]);
    if (cells.length > 0) rows.push(cells);
  }

  return rows.length > 0 ? { headers, rows } : null;
}

/** Find column index by matching header names (case-insensitive, substring match). */
function findCol(headers: string[], candidates: string[]): number | null {
  const lower = headers.map(h => h.toLowerCase().replace(/[()（）]/g, "").trim());
  for (const c of candidates) {
    const target = c.toLowerCase();
    const idx = lower.findIndex(h => h === target || h.includes(target));
    if (idx >= 0) return idx;
  }
  return null;
}

// ─── Section Splitter ───

export function splitSections(content: string): Map<string, { title: string; body: string }> {
  const sections = new Map<string, { title: string; body: string }>();
  let currentKey = "";
  let currentTitle = "";
  let currentBody: string[] = [];

  for (const line of content.split("\n")) {
    const h2Match = line.match(/^## (.+)/);
    if (h2Match) {
      if (currentKey) {
        sections.set(currentKey, { title: currentTitle, body: currentBody.join("\n") });
      }
      currentTitle = h2Match[1].trim();
      currentKey = currentTitle.toLowerCase().replace(/[：:]/g, "").trim();
      currentBody = [];
    } else if (currentKey) {
      currentBody.push(line);
    }
  }
  if (currentKey) {
    sections.set(currentKey, { title: currentTitle, body: currentBody.join("\n") });
  }

  return sections;
}

// ─── Per-Section Parsers ───

function parseCharactersSection(body: string): CharacterDef[] | null {
  const lines = body.split("\n");
  const table = parseMarkdownTable(lines);
  if (!table) return null;

  const { headers, rows } = table;
  const colId = findCol(headers, ["character"]);
  const colName = findCol(headers, ["name"]);
  const colVoice = findCol(headers, ["voice"]);
  const colGender = findCol(headers, ["gender"]);
  const colColor = findCol(headers, ["color"]);
  const colImages = findCol(headers, ["images", "image"]);
  const colFirstEp = findCol(headers, ["first ep", "first appearance"]);

  if (colId === null) return null;

  const chars: CharacterDef[] = [];
  for (const row of rows) {
    if (row.length < 2) continue;
    const id = row[colId] ?? "";
    if (!id || id.toLowerCase() === "character") continue;

    chars.push({
      id,
      name: colName !== null ? (row[colName] ?? "") : "",
      voice: colVoice !== null ? (row[colVoice] ?? "") : "",
      gender: colGender !== null ? (row[colGender] ?? "") : "",
      color: colColor !== null ? (row[colColor] ?? null) : null,
      images: colImages !== null && row[colImages]
        ? row[colImages].split(",").map(s => s.trim()).filter(Boolean)
        : null,
      firstEp: colFirstEp !== null && row[colFirstEp]
        ? normalizeEpisodeId(row[colFirstEp])
        : null,
    });
  }

  return chars.length > 0 ? chars : null;
}

function parseEpisodeGuideSection(body: string): EpisodeDef[] | null {
  const lines = body.split("\n");
  const table = parseMarkdownTable(lines);
  if (!table) return null;

  const { headers, rows } = table;
  const lowerHeaders = headers.map(h => h.toLowerCase().replace(/[()（）]/g, "").trim());

  // Detect format
  const hasChCol = lowerHeaders.includes("ch");
  const hasEpCol = lowerHeaders.includes("ep");
  const hasEpisodeCol = lowerHeaders.some(h => h === "episode");

  const colCh = findCol(headers, ["ch"]);
  const colEp = findCol(headers, ["ep"]);
  const colEpisode = hasEpisodeCol ? lowerHeaders.indexOf("episode") : null;
  const colTitle = findCol(headers, ["title", "標題"]);
  const colChars = findCol(headers, ["characters", "角色"]);
  const colStatus = findCol(headers, ["status", "狀態"]);
  const colLang = findCol(headers, ["language", "語言"]);
  const colTheme = findCol(headers, ["theme", "內容", "主題"]);

  const episodes: EpisodeDef[] = [];

  for (const row of rows) {
    if (row.length < 2) continue;

    let id = "";
    let chapter: number | null = null;
    let episode: number | null = null;
    let episodeRange: string | null = null;

    if (hasChCol && hasEpCol && colCh !== null && colEp !== null) {
      // my-core-is-boss format: separate Ch + Ep columns
      const chRaw = row[colCh] ?? "";
      const epRaw = row[colEp] ?? "";
      const chNum = parseInt(chRaw, 10);
      const epMatch = epRaw.match(/^(\d+)(?:-(\d+))?$/);

      if (!isNaN(chNum) && epMatch) {
        const epStart = parseInt(epMatch[1], 10);
        if (epMatch[2]) {
          // Range: expand into individual entries
          const epEnd = parseInt(epMatch[2], 10);
          const title = colTitle !== null ? (row[colTitle] ?? "") : "";
          const chars = colChars !== null
            ? (row[colChars] ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
            : [];
          const status = colStatus !== null ? (row[colStatus] ?? "").trim() : "";

          for (let e = epStart; e <= epEnd; e++) {
            episodes.push({
              id: `ch${chNum}ep${e}`,
              chapter: chNum,
              episode: e,
              episodeRange: e === epStart ? epRaw : null,
              title,
              characters: [...chars],
              status,
              language: colLang !== null ? (row[colLang] ?? null) : null,
              theme: colTheme !== null ? (row[colTheme] ?? null) : null,
            });
          }
          continue; // skip the normal push below
        } else {
          chapter = chNum;
          episode = epStart;
          id = `ch${chNum}ep${epStart}`;
        }
      }
    } else if (hasEpisodeCol && colEpisode !== null) {
      // weapon-forger or galgame format: single Episode column
      const raw = row[colEpisode] ?? "";
      const normalized = normalizeEpisodeId(raw);
      id = normalized;

      const chEpMatch = raw.match(/ch(\d+)[-]?ep(\d+)/i);
      if (chEpMatch) {
        chapter = parseInt(chEpMatch[1], 10);
        episode = parseInt(chEpMatch[2], 10);
      } else {
        const flatMatch = raw.match(/^ep(\d+)$/i);
        if (flatMatch) {
          episode = parseInt(flatMatch[1], 10);
        }
      }
    } else if (hasEpCol && colEp !== null) {
      // storygraph-explainer: Ep column with ep1/ep2
      const raw = row[colEp] ?? "";
      id = normalizeEpisodeId(raw);
      const flatMatch = raw.match(/^ep(\d+)$/i);
      if (flatMatch) episode = parseInt(flatMatch[1], 10);
    }

    if (!id) continue;

    episodes.push({
      id,
      chapter,
      episode,
      episodeRange,
      title: colTitle !== null ? (row[colTitle] ?? "") : "",
      characters: colChars !== null
        ? (row[colChars] ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
        : [],
      status: colStatus !== null ? (row[colStatus] ?? "").trim() : "",
      language: colLang !== null ? (row[colLang] ?? null) : null,
      theme: colTheme !== null ? (row[colTheme] ?? null) : null,
    });
  }

  return episodes.length > 0 ? episodes : null;
}

function parseChapterRulesSection(body: string): string[] | null {
  const bullets: string[] = [];
  for (const line of body.split("\n")) {
    const match = line.match(/^\s*[-*]\s+\*\*(.+?):\*\*\s+(.+)/);
    if (match) {
      bullets.push(`${match[1]}: ${match[2]}`);
      continue;
    }
    const simpleMatch = line.match(/^\s*[-*]\s+(.+)/);
    if (simpleMatch && !simpleMatch[1].startsWith("[")) {
      bullets.push(simpleMatch[1].trim());
    }
  }
  return bullets.length > 0 ? bullets : null;
}

function parseGagRulesSection(body: string): string[] | null {
  return parseChapterRulesSection(body);
}

function parseRunningGagsSection(body: string): RunningGagTable | null {
  const lines = body.split("\n");
  const table = parseMarkdownTable(lines);
  if (!table) return null;

  const { headers, rows } = table;
  // First column is gag type name, rest are episode columns
  const episodeColumns = headers.slice(1).map(h => normalizeEpisodeId(h));
  const gagTypes: string[] = [];
  const matrix: Record<string, Record<string, string>> = {};

  for (const row of rows) {
    if (row.length < 2) continue;
    const gagName = row[0];
    if (!gagName) continue;

    gagTypes.push(gagName);
    matrix[gagName] = {};

    for (let j = 1; j < row.length && j - 1 < episodeColumns.length; j++) {
      const val = row[j]?.trim();
      const epId = episodeColumns[j - 1];
      if (val && val !== "TBD" && val !== "—") {
        matrix[gagName][epId] = val;
      }
    }
  }

  return gagTypes.length > 0 ? { gagTypes, episodeColumns, matrix } : null;
}

function parseStoryArcsSection(body: string): StoryArcDef[] | null {
  const arcs: StoryArcDef[] = [];
  const chapterBlocks = body.split(/(?=### )/);

  const zhNumMap: Record<string, number> = { "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10 };

  for (const block of chapterBlocks) {
    // Match: ### 第X章：... or ### Chapter N: ...
    const headingMatch = block.match(/### 第([一二三四五六七八九十\d]+)章[：:](.+?)(?:（(\d+)\s*ep）)?$/m);
    if (!headingMatch) continue;

    const numRaw = headingMatch[1];
    const chapter = /\d/.test(numRaw) ? parseInt(numRaw, 10) : (zhNumMap[numRaw] ?? 0);
    const title = headingMatch[2].trim();

    // Extract theme
    const themeMatch = block.match(/\*\*主題[：:]\*\*\s*(.+)/);
    const theme = themeMatch ? themeMatch[1].trim() : "";

    // Extract per-episode descriptions
    const episodes: StoryArcEpisode[] = [];
    const epRegex = /\*\*[Cc]h(\d+)-?[Ee]p(\d+)\s*[—\-–]\s*(.+?)[：:]\*\*\s*(.+)/g;
    let match;
    while ((match = epRegex.exec(block)) !== null) {
      const ch = match[1];
      const ep = match[2];
      const epTitle = match[3].trim();
      const desc = match[4].trim();
      episodes.push({
        id: `ch${ch}ep${ep}`,
        title: epTitle,
        description: desc,
      });
    }

    arcs.push({ chapter, title, theme, episodes });
  }

  return arcs.length > 0 ? arcs : null;
}

// ─── LLM Enrichment ───

async function enrichStoryArcsWithLLM(
  body: string,
  arcs: StoryArcDef[] | null,
  provider: string,
  model: string,
): Promise<StoryArcDef[] | null> {
  try {
    const prompt = `You are a structured data extractor. Parse the following Story Arcs section from a PLAN.md and return a JSON array of chapters.

Each chapter object should have:
- chapter: number
- title: string (chapter title)
- theme: string (theme statement if present)
- episodes: array of { id: string, title: string, description: string }

Episode IDs should be normalized like "ch1ep1", "ch2ep3".

If the content doesn't contain story arcs, return an empty array.

PLAN.md Story Arcs section:
${body}

Return ONLY the JSON array, no markdown fences.`;

    const result = await callAI(prompt, {
      provider: provider as any,
      model,
      jsonMode: true,
      timeout: 30_000,
      maxRetries: 1,
    });

    if (!result) return arcs;

    const parsed = JSON.parse(result);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as StoryArcDef[];
    }
    return arcs;
  } catch {
    return arcs;
  }
}

// ─── Derive Chapters ───

function deriveChapters(episodes: EpisodeDef[] | null): ChapterSummary[] {
  if (!episodes || episodes.length === 0) return [];

  const chapterMap = new Map<number, EpisodeDef[]>();

  for (const ep of episodes) {
    if (ep.chapter === null) continue;
    if (!chapterMap.has(ep.chapter)) chapterMap.set(ep.chapter, []);
    chapterMap.get(ep.chapter)!.push(ep);
  }

  const chapters: ChapterSummary[] = [];
  for (const [ch, eps] of chapterMap) {
    const completed = eps.filter(e =>
      e.status.toLowerCase().includes("complete") ||
      e.status.toLowerCase().includes("rendered")
    ).length;
    const planned = eps.filter(e =>
      e.status.toLowerCase().includes("planned")
    ).length;

    chapters.push({
      chapter: ch,
      episodeCount: eps.length,
      completedCount: completed,
      plannedCount: planned,
      status: completed === eps.length ? "complete"
        : completed > 0 ? "in_progress"
        : "not_started",
    });
  }

  return chapters.sort((a, b) => a.chapter - b.chapter);
}

// ─── Main Parser ───

export async function parsePlan(
  content: string,
  options?: {
    sourcePath?: string;
    mode?: "regex" | "ai" | "hybrid";
    config?: SeriesConfig | null;
    provider?: string;
    model?: string;
  },
): Promise<PlanStruct> {
  const mode = options?.mode ?? "regex";
  const config = options?.config ?? null;

  // Extract series name from H1
  const h1Match = content.match(/^#\s+(.+)/m);
  const seriesName = h1Match ? h1Match[1].trim() : "";
  const seriesId = config?.seriesId ?? seriesName.split(/\s+/)[0]?.toLowerCase() ?? "unknown";

  // Split into sections
  const sections = splitSections(content);

  // Helper to find section by fuzzy key match
  const findSection = (keywords: string[]): { title: string; body: string } | undefined => {
    for (const [key, val] of sections) {
      if (keywords.some(k => key.includes(k))) return val;
    }
    return undefined;
  };

  // Parse each section
  const charSection = findSection(["character"]);
  const characters = charSection ? parseCharactersSection(charSection.body) : null;

  const epSection = findSection(["episode guide", "episode_guide", "episodes", "集數規劃"]);
  const episodeGuide = epSection ? parseEpisodeGuideSection(epSection.body) : null;

  const rulesSection = findSection(["chapter rules"]);
  const chapterRules = rulesSection ? parseChapterRulesSection(rulesSection.body) : null;

  const gagSection = findSection(["running gag"]);
  const runningGags = gagSection ? parseRunningGagsSection(gagSection.body) : null;

  const gagRulesSection = findSection(["running gag rule", "gag rule"]);
  const gagRules = gagRulesSection ? parseGagRulesSection(gagRulesSection.body) : null;

  const arcsSection = findSection(["story arc"]);
  let storyArcs = arcsSection ? parseStoryArcsSection(arcsSection.body) : null;

  // LLM enrichment for story arcs (hybrid/ai mode)
  if ((mode === "hybrid" || mode === "ai") && arcsSection) {
    storyArcs = await enrichStoryArcsWithLLM(
      arcsSection.body,
      storyArcs,
      options?.provider ?? "zai",
      options?.model ?? "glm-5",
    );
  }

  const chapters = deriveChapters(episodeGuide);

  return {
    seriesId,
    seriesName,
    metadata: {
      parsedAt: new Date().toISOString(),
      sourcePath: options?.sourcePath ?? "",
      mode,
    },
    characters,
    episodeGuide,
    chapterRules,
    runningGags,
    storyArcs,
    gagRules,
    chapters,
  };
}

// ─── CLI Entry ───

if (import.meta.main) {
const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`plan-parser — Generic PLAN.md structural parser

Usage:
  bun run src/scripts/plan-parser.ts <series-dir> [options]

Options:
  --mode regex|ai|hybrid   Parsing mode (default: regex)
                            regex: fast table parsing only
                            ai: use LLM for unstructured sections
                            hybrid: regex first, LLM supplements
  --provider <name>        AI provider (default: zai)
  --model <name>           AI model (default: glm-5)

Output:
  <series-dir>/storygraph_out/plan-struct.json
`);
  process.exit(0);
}

const seriesDir = resolve(args[0]);
if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path. Use absolute paths.`);
  process.exit(1);
}

const planPath = resolve(seriesDir, "PLAN.md");
if (!existsSync(planPath)) {
  console.error(`PLAN.md not found at ${planPath}`);
  process.exit(1);
}

const aiArgs = parseArgsForAI(args);
const config = detectSeries(seriesDir);
const content = readFileSync(planPath, "utf-8");

parsePlan(content, {
  sourcePath: planPath,
  mode: aiArgs.mode as "regex" | "ai" | "hybrid" | undefined,
  config,
  provider: aiArgs.provider,
  model: aiArgs.model,
}).then(plan => {
  const outDir = resolve(seriesDir, "storygraph_out");
  const outPath = resolve(outDir, "plan-struct.json");

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, JSON.stringify(plan, null, 2));

  const charCount = plan.characters?.length ?? 0;
  const epCount = plan.episodeGuide?.length ?? 0;
  const arcCount = plan.storyArcs?.length ?? 0;
  const gagCount = plan.runningGags?.gagTypes.length ?? 0;
  const chapterCount = plan.chapters.length;

  console.log(`Parsed: ${charCount} characters, ${epCount} episodes, ${arcCount} story arcs, ${gagCount} gag types, ${chapterCount} chapters`);
  console.log(`Written to: ${outPath}`);
});
}
