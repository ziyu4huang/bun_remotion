import { readdirSync, statSync, existsSync } from "node:fs";
import { resolve, basename, extname } from "node:path";
import type { Asset, AssetType, AssetFormat, SeriesAssets, AssetSummary } from "../../shared/types";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg"]);
const AUDIO_EXTS = new Set([".wav", ".mp3"]);

function toFormat(ext: string): AssetFormat {
  return ext.slice(1).toLowerCase() as AssetFormat;
}

function scanDir(dir: string, type: AssetType, seriesId: string, episodeId?: string): Asset[] {
  const assets: Asset[] = [];
  if (!existsSync(dir)) return assets;

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return assets;
  }

  for (const entry of entries) {
    const ext = extname(entry).toLowerCase();
    const fullPath = resolve(dir, entry);
    let size = 0;
    try {
      size = statSync(fullPath).size;
    } catch {
      continue;
    }

    if ((type === "character" || type === "background") && IMAGE_EXTS.has(ext)) {
      assets.push({
        id: episodeId ? `${episodeId}/${entry}` : entry,
        name: basename(entry, ext),
        type,
        format: toFormat(ext),
        seriesId,
        episodeId,
        path: fullPath,
        size,
      });
    } else if (type === "audio" && AUDIO_EXTS.has(ext)) {
      assets.push({
        id: episodeId ? `${episodeId}/${entry}` : entry,
        name: basename(entry, ext),
        type,
        format: toFormat(ext),
        seriesId,
        episodeId,
        path: fullPath,
        size,
      });
    }
  }

  return assets;
}

function isEpisodeDir(dirname: string, seriesId: string): boolean {
  const extracted = dirname.replace(/-ch\d+-ep\d+$/, "").replace(/-ep\d+$/, "");
  return extracted === seriesId;
}

export function scanSeriesAssets(seriesId: string): SeriesAssets {
  const seriesDir = resolve(PROJ_DIR, seriesId);
  const characters: Asset[] = [];
  const backgrounds: Asset[] = [];
  const audio: Asset[] = [];

  // Scan shared-fixture as special series
  if (seriesId === "_shared") {
    const sharedBgDir = resolve(PROJ_DIR, "shared-fixture", "background");
    backgrounds.push(...scanDir(sharedBgDir, "background", "_shared"));
    return { seriesId: "_shared", characters, backgrounds, audio };
  }

  // Scan assets/characters and assets/backgrounds
  characters.push(...scanDir(resolve(seriesDir, "assets/characters"), "character", seriesId));
  backgrounds.push(...scanDir(resolve(seriesDir, "assets/backgrounds"), "background", seriesId));

  // Also check fixture/ for weapon-forger backward compat
  if (existsSync(resolve(seriesDir, "fixture/characters"))) {
    characters.push(...scanDir(resolve(seriesDir, "fixture/characters"), "character", seriesId));
  }
  if (existsSync(resolve(seriesDir, "fixture/backgrounds"))) {
    backgrounds.push(...scanDir(resolve(seriesDir, "fixture/backgrounds"), "background", seriesId));
  }

  // Scan audio per episode
  if (existsSync(seriesDir)) {
    let entries: string[];
    try {
      entries = readdirSync(seriesDir);
    } catch {
      entries = [];
    }

    for (const entry of entries) {
      const fullPath = resolve(seriesDir, entry);
      try {
        if (!statSync(fullPath).isDirectory()) continue;
      } catch {
        continue;
      }

      if (isEpisodeDir(entry, seriesId)) {
        audio.push(...scanDir(resolve(fullPath, "audio"), "audio", seriesId, entry));
      }
    }
  }

  return { seriesId, characters, backgrounds, audio };
}

export function scanAllAssets(): AssetSummary[] {
  const summaries: AssetSummary[] = [];
  const seen = new Set<string>();

  let entries: string[];
  try {
    entries = readdirSync(PROJ_DIR);
  } catch {
    return summaries;
  }

  for (const entry of entries) {
    if (entry.startsWith(".") || entry === "shared" || entry === "shared-fixture" || entry === "node_modules") continue;
    const fullPath = resolve(PROJ_DIR, entry);
    try {
      if (!statSync(fullPath).isDirectory()) continue;
    } catch {
      continue;
    }

    const assets = scanSeriesAssets(entry);
    const total = assets.characters.length + assets.backgrounds.length + assets.audio.length;
    if (total > 0) {
      seen.add(entry);
      summaries.push({
        seriesId: entry,
        seriesName: entry.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        characters: assets.characters.length,
        backgrounds: assets.backgrounds.length,
        audio: assets.audio.length,
      });
    }
  }

  // Add shared-fixture
  const shared = scanSeriesAssets("_shared");
  if (shared.backgrounds.length > 0) {
    summaries.push({
      seriesId: "_shared",
      seriesName: "Shared Fixture",
      characters: 0,
      backgrounds: shared.backgrounds.length,
      audio: 0,
    });
  }

  return summaries.sort((a, b) => a.seriesId.localeCompare(b.seriesId));
}
