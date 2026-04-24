import { readdirSync, statSync, existsSync, readFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import { detectCategoryFromDirname } from "remotion_types";
import type { VideoCategoryId } from "remotion_types";
import type { Project, Episode } from "../../shared/types";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

const SKIP_DIRS = new Set(["shared", "shared-fixture", "node_modules", ".DS_Store"]);

interface GateJson {
  score?: number;
  blended_score?: number;
  decision?: string;
}

interface EpisodeParse {
  id: string;
  chapter?: number;
  episode?: number;
}

function parseEpisodeDirname(dirname: string): EpisodeParse {
  // weapon-forger-ch1-ep3
  const chEp = dirname.match(/-ch(\d+)-ep(\d+)$/);
  if (chEp) return { id: dirname, chapter: +chEp[1], episode: +chEp[2] };

  // galgame-meme-theater-ep5
  const epOnly = dirname.match(/-ep(\d+)$/);
  if (epOnly) return { id: dirname, episode: +epOnly[1] };

  // storygraph-explainer-ch1-ep1
  const chEp2 = dirname.match(/-ch(\d+)-ep(\d+)$/);
  if (chEp2) return { id: dirname, chapter: +chEp2[1], episode: +chEp2[2] };

  return { id: dirname };
}

function extractSeriesId(dirname: string): string {
  // Strip -chN-epN or -epN suffix to get series id
  return dirname.replace(/-ch\d+-ep\d+$/, "").replace(/-ep\d+$/, "");
}

function readJsonSafe<T>(filePath: string): T | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

function scanEpisodes(seriesDir: string, seriesId: string): Episode[] {
  const episodes: Episode[] = [];

  let entries: string[];
  try {
    entries = readdirSync(seriesDir);
  } catch {
    return episodes;
  }

  for (const entry of entries) {
    const fullPath = resolve(seriesDir, entry);
    let isDir = false;
    try {
      // Follow symlinks
      const stat = statSync(fullPath, { throwIfNoEntry: false });
      isDir = stat?.isDirectory() ?? false;
    } catch {
      continue;
    }

    if (!isDir) continue;

    const parsed = parseEpisodeDirname(entry);
    const extractedSeriesId = extractSeriesId(entry);
    if (extractedSeriesId !== seriesId) continue;

    // Check for scaffold code (Root.tsx = Remotion project exists)
    const hasScaffold = existsSync(resolve(fullPath, "src/Root.tsx"));

    // Check for TTS (any audio files in audio/ or public/)
    const audioDir = resolve(fullPath, "audio");
    const publicDir = resolve(fullPath, "public");
    let hasTTS = false;
    try {
      if (existsSync(audioDir)) {
        hasTTS = readdirSync(audioDir).some((f) => f.endsWith(".mp3") || f.endsWith(".wav"));
      }
      if (!hasTTS && existsSync(publicDir)) {
        hasTTS = readdirSync(publicDir).some((f) => f.endsWith(".mp3") || f.endsWith(".wav"));
      }
    } catch {
      // ignore
    }

    // Check for render output
    const hasRender = existsSync(resolve(fullPath, "out")) || existsSync(resolve(REPO_ROOT, "out", `${entry}.mp4`));

    // Read episode-level gate.json if exists
    const epGate = readJsonSafe<GateJson>(resolve(fullPath, "storygraph_out/gate.json"));

    episodes.push({
      id: entry,
      chapter: parsed.chapter,
      episode: parsed.episode,
      path: fullPath,
      hasScaffold,
      hasTTS,
      hasRender,
      gateScore: epGate?.score,
      blendedScore: epGate?.blended_score,
    });
  }

  // Sort: chapter first, then episode
  episodes.sort((a, b) => {
    if (a.chapter !== b.chapter) return (a.chapter ?? 0) - (b.chapter ?? 0);
    return (a.episode ?? 0) - (b.episode ?? 0);
  });

  return episodes;
}

export function scanProjects(): Project[] {
  const projects: Project[] = [];

  let entries: string[];
  try {
    entries = readdirSync(PROJ_DIR);
  } catch {
    return projects;
  }

  // Group directories by series
  const seriesDirs = new Map<string, string>(); // seriesId → seriesDir path
  const standaloneProjects: string[] = [];

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry) || entry.startsWith(".")) continue;

    const fullPath = resolve(PROJ_DIR, entry);
    let isDir: boolean;
    try {
      const stat = statSync(fullPath, { throwIfNoEntry: false });
      isDir = stat?.isDirectory() ?? false;
    } catch {
      continue;
    }

    if (!isDir) continue;

    // Check if this is a series directory (contains episode subdirs)
    // or a standalone project
    const subDirs = readdirSync(fullPath).filter((sub) => {
      const subPath = resolve(fullPath, sub);
      try {
        return statSync(subPath, { throwIfNoEntry: false })?.isDirectory() ?? false;
      } catch {
        return false;
      }
    });

    const hasEpisodes = subDirs.some((sub) => {
      const extracted = extractSeriesId(sub);
      return extracted === entry;
    });

    // Also detect series with no valid episodes but has pipeline output
    const hasPipelineOutput = existsSync(resolve(fullPath, "storygraph_out/gate.json"));

    if (hasEpisodes || hasPipelineOutput) {
      seriesDirs.set(entry, fullPath);
    } else {
      // Check if it's a standalone Remotion project (has src/Root.tsx directly)
      if (existsSync(resolve(fullPath, "src/Root.tsx"))) {
        standaloneProjects.push(entry);
      } else if (existsSync(resolve(fullPath, `${entry}/src/Root.tsx`))) {
        // Series wrapper like weapon-forger/weapon-forger-ch1-ep1 pattern
        seriesDirs.set(entry, fullPath);
      }
    }
  }

  // Build project objects for series
  for (const [seriesId, seriesDir] of seriesDirs) {
    const episodes = scanEpisodes(seriesDir, seriesId);
    const category = episodes.length > 0
      ? detectCategoryFromDirname(episodes[0].id)
      : detectCategoryFromDirname(seriesId);

    // Read series-level gate.json
    const seriesGate = readJsonSafe<GateJson>(resolve(seriesDir, "storygraph_out/gate.json"));

    const hasPlan = existsSync(resolve(seriesDir, "PLAN.md"));

    projects.push({
      id: seriesId,
      name: seriesId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      seriesId,
      category,
      path: seriesDir,
      episodes,
      gateScore: seriesGate?.score,
      blendedScore: seriesGate?.blended_score,
      hasPlan,
      episodeCount: episodes.length,
      scaffoldedCount: episodes.filter((e) => e.hasScaffold).length,
    });
  }

  // Build project objects for standalone projects
  for (const name of standaloneProjects) {
    const fullPath = resolve(PROJ_DIR, name);
    const category = detectCategoryFromDirname(name);

    projects.push({
      id: name,
      name: name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      seriesId: name,
      category,
      path: fullPath,
      episodes: [],
      hasPlan: existsSync(resolve(fullPath, "PLAN.md")),
      episodeCount: 0,
      scaffoldedCount: 0,
    });
  }

  projects.sort((a, b) => a.id.localeCompare(b.id));
  return projects;
}

export function getProject(projectId: string): Project | null {
  const projects = scanProjects();
  return projects.find((p) => p.id === projectId) ?? null;
}
