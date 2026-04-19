/**
 * Narrative extraction from Remotion episode narration.ts files.
 *
 * Parses the structured TypeScript narration format used by weapon-forger
 * and other series to extract character dialog, scene structure, and metadata.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, basename } from "node:path";

// ─── Types ─────────────────────────────────────────────────────────

export interface DialogLine {
  character: string;
  text: string;
}

export interface SceneDialog {
  scene: string;
  audioFile: string;
  lines: DialogLine[];
}

export interface EpisodeNarrative {
  /** e.g. "ch1-ep1" */
  episodeId: string;
  /** e.g. "入宗考试" */
  title: string;
  /** e.g. "zh-TW" or "zh-CN" */
  language: string;
  /** Characters that appear in this episode */
  characters: string[];
  /** Voice mapping: character → voice name */
  voiceMap: Record<string, string>;
  /** Dialog organized by scene */
  scenes: SceneDialog[];
  /** Full episode directory name */
  directory: string;
}

export interface SeriesNarrative {
  seriesName: string;
  seriesDir: string;
  episodes: EpisodeNarrative[];
  /** Running gag table from PLAN.md (if parseable) */
  runningGags: RunningGag[];
}

export interface RunningGag {
  name: string;
  /** episode ID → specific manifestation */
  manifestations: Record<string, string>;
}

// ─── Episode detection ─────────────────────────────────────────────

/** Generic pattern: matches any <series>-chN-epM directory */
const GENERIC_EPISODE_PATTERN = /-ch(\d+)-ep(\d+)$/i;

export function detectEpisodes(seriesDir: string, pattern?: RegExp): string[] {
  const epPattern = pattern ?? GENERIC_EPISODE_PATTERN;
  const entries = readdirSync(seriesDir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() && epPattern.test(e.name))
    .map(e => e.name)
    .sort();
}

// ─── Narration.ts parsing ──────────────────────────────────────────

/**
 * Parse a narration.ts file to extract structured dialog data.
 *
 * Uses regex-based extraction since the format is consistent:
 * - NARRATOR_LANG export
 * - VOICE_MAP export
 * - narrations array with { scene, file, segments: [{ character, text }] }
 */
export function parseNarration(filePath: string): {
  language: string;
  voiceMap: Record<string, string>;
  scenes: SceneDialog[];
  characters: string[];
} | null {
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  // Extract NARRATOR_LANG
  const langMatch = content.match(/NARRATOR_LANG\s*=\s*["']([^"']+)["']/);
  const language = langMatch?.[1] ?? "zh-TW";

  // Extract VOICE_MAP
  const voiceMapMatch = content.match(
    /VOICE_MAP\s*:\s*Record<\w+,\s*string>\s*=\s*\{([^}]+)\}/
  );
  const voiceMap: Record<string, string> = {};
  if (voiceMapMatch) {
    const entries = voiceMapMatch[1].matchAll(/(\w+)\s*:\s*["'](\w+)["']/g);
    for (const m of entries) {
      voiceMap[m[1]] = m[2];
    }
  }

  // Extract characters from VoiceCharacter type
  const charTypeMatch = content.match(
    /type VoiceCharacter\s*=\s*([^;]+);/
  );
  const characters: string[] = [];
  if (charTypeMatch) {
    const charMatches = charTypeMatch[1].matchAll(/"(\w+)"/g);
    for (const m of charMatches) {
      characters.push(m[1]);
    }
  }

  // Extract narrations array segments
  const scenes: SceneDialog[] = [];

  // Match each narration object: { scene: "...", file: "...", segments: [...] }
  const scenePattern = /\{\s*scene:\s*["']([^"']+)["'],\s*file:\s*["']([^"']+)["'],\s*segments:\s*\[([^\]]*)\]/g;

  let sceneMatch: RegExpExecArray | null;
  while ((sceneMatch = scenePattern.exec(content)) !== null) {
    const sceneName = sceneMatch[1];
    const audioFile = sceneMatch[2];
    const segmentsBlock = sceneMatch[3];

    const lines: DialogLine[] = [];

    // Extract each { character: "...", text: "..." } segment
    const segPattern = /\{\s*character:\s*["'](\w+)["'],\s*text:\s*["']([^"']*(?:["'"][^"']*)*?)["'],?\s*\}/g;
    let segMatch: RegExpExecArray | null;
    while ((segMatch = segPattern.exec(segmentsBlock)) !== null) {
      lines.push({
        character: segMatch[1],
        text: segMatch[2],
      });
    }

    if (lines.length > 0) {
      scenes.push({ scene: sceneName, audioFile, lines });
    }
  }

  return { language, voiceMap, scenes, characters };
}

/**
 * Extract episode ID from directory name.
 * e.g. "weapon-forger-ch1-ep3" → "ch1-ep3"
 */
export function episodeIdFromDir(dirName: string): string {
  const match = dirName.match(/(ch\d+-ep\d+)$/);
  return match?.[1] ?? dirName;
}

/**
 * Extract episode title from narration.ts header comment.
 * Looks for the Chinese title after the chapter/episode number.
 */
export function extractTitleFromNarration(filePath: string): string {
  try {
    const content = readFileSync(filePath, "utf-8");
    // Match comment like: 第一章 第一集：入宗考试 or 第三章 第一集：秘境探索
    const titleMatch = content.match(/第[一二三四五六七八九十]+章\s+第[一二三四五六七八九十]+集[：:]\s*(.+)/);
    if (titleMatch) return titleMatch[1].trim();

    // Fallback: match "入宗考试" style from comment
    const fallbackMatch = content.match(/第[一二三四五六七八九十]+集[：:]\s*(.+?)(?:\n|\*\/)/);
    return fallbackMatch?.[1]?.trim() ?? "";
  } catch {
    return "";
  }
}

// ─── PLAN.md running gag extraction ────────────────────────────────

/**
 * Extract the running gag table from PLAN.md.
 * Parses markdown table format:
 * | 梗 | Ep1 | Ep2 | ... |
 */
export function parseRunningGags(planPath: string): RunningGag[] {
  try {
    const content = readFileSync(planPath, "utf-8");
    const gags: RunningGag[] = [];

    // Find the running gag table section — ends at next ## heading or double newline
    const gagSectionMatch = content.match(/## 招牌梗追蹤[\s\S]*?(?=\n##|\n$)/);
    if (!gagSectionMatch) return gags;

    const tableText = gagSectionMatch[0];
    const rows = tableText.split("\n").filter(line => line.startsWith("|") && !line.includes("----"));

    if (rows.length < 2) return gags;

    // First row is header: | 梗 | Ep1 | Ep2 | Ep3 | Ch2-Ep1 | ...
    const headers = rows[0].split("|").map(s => s.trim()).filter(Boolean);
    // headers[0] = "梗", headers[1..] = episode labels

    // Build episode ID mapping from headers
    const episodeIds = headers.slice(1).map(h => {
      // "Ep1" → "ch1-ep1", "Ch2-Ep1" → "ch2-ep1", "Ep4+" → "ch4+"
      const epMatch = h.match(/(?:Ch(\d+)-)?Ep(\d+)/i);
      if (epMatch) {
        const ch = epMatch[1] ?? "1";
        return `ch${ch}-ep${epMatch[2]}`;
      }
      return h.toLowerCase();
    });

    // Data rows (rows[0] = header, rows[1..] = data, separator already filtered)
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].split("|").map(s => s.trim()).filter(Boolean);
      if (cells.length < 2) continue;

      const gagName = cells[0];
      const manifestations: Record<string, string> = {};

      for (let j = 1; j < cells.length && j < episodeIds.length + 1; j++) {
        const value = cells[j];
        if (value && value !== "TBD" && value !== "—") {
          manifestations[episodeIds[j - 1]] = value;
        }
      }

      gags.push({ name: gagName, manifestations });
    }

    return gags;
  } catch {
    return [];
  }
}

// ─── Full series extraction ────────────────────────────────────────

/**
 * Extract narrative data from all episodes in a series directory.
 */
export function extractSeriesNarrative(seriesDir: string): SeriesNarrative {
  const seriesName = basename(seriesDir);
  const episodes: EpisodeNarrative[] = [];

  const episodeDirs = detectEpisodes(seriesDir);

  for (const dir of episodeDirs) {
    const narrationPath = join(seriesDir, dir, "scripts", "narration.ts");
    const parsed = parseNarration(narrationPath);

    if (parsed) {
      const epId = episodeIdFromDir(dir);
      const title = extractTitleFromNarration(narrationPath);

      episodes.push({
        episodeId: epId,
        title,
        language: parsed.language,
        characters: parsed.characters,
        voiceMap: parsed.voiceMap,
        scenes: parsed.scenes,
        directory: dir,
      });
    }
  }

  // Try to parse running gags from PLAN.md
  let runningGags: RunningGag[] = [];
  try {
    runningGags = parseRunningGags(join(seriesDir, "PLAN.md"));
  } catch {
    // PLAN.md might not exist or have no gag table
  }

  return {
    seriesName,
    seriesDir,
    episodes,
    runningGags,
  };
}

// ─── Markdown corpus generation ────────────────────────────────────

/**
 * Convert extracted narrative data to a structured markdown corpus.
 * This is what Claude subagents will read during semantic extraction.
 */
export function narrativeToCorpus(narrative: SeriesNarrative): string {
  const lines: string[] = [];

  lines.push(`# ${narrative.seriesName} — Narrative Corpus`);
  lines.push(``);
  lines.push(`Extracted: ${new Date().toISOString()}`);
  lines.push(`Episodes: ${narrative.episodes.length}`);
  lines.push(``);

  // Running gags overview
  if (narrative.runningGags.length > 0) {
    lines.push(`## Running Gags Overview`);
    lines.push(``);
    for (const gag of narrative.runningGags) {
      lines.push(`### ${gag.name}`);
      lines.push(``);
      for (const [epId, manifestation] of Object.entries(gag.manifestations)) {
        lines.push(`- **${epId}**: ${manifestation}`);
      }
      lines.push(``);
    }
  }

  // Per-episode dialog
  for (const episode of narrative.episodes) {
    lines.push(`## ${episode.episodeId}: ${episode.title}`);
    lines.push(``);
    lines.push(`Language: ${episode.language}`);
    lines.push(`Characters: ${episode.characters.join(", ")}`);
    lines.push(``);

    for (const scene of episode.scenes) {
      lines.push(`### ${scene.scene}`);
      lines.push(``);
      for (const line of scene.lines) {
        lines.push(`- **${line.character}**: ${line.text}`);
      }
      lines.push(``);
    }
  }

  return lines.join("\n");
}
