/**
 * Naming conventions — derives all names from series config + episode numbers.
 * Supports both episode-based (ch/ep) and standalone (category-only) projects.
 */

import { resolve } from "node:path";
import type { VideoCategoryId } from "remotion_types";
import type { SeriesConfig } from "./series-config";

export interface NamingContext {
  seriesId: string;
  category: VideoCategoryId | null;
  chapter: number | null;
  episode: number | null;
  numContentScenes: number;

  // Derived names
  dirName: string;           // "my-core-is-boss-ch1-ep4" or "storygraph-intro"
  packageName: string;       // "@bun-remotion/my-core-is-boss-ch1-ep4"
  compositionId: string;     // "MyCoreIsBossCh1Ep4" or "StorygraphIntro"
  scriptAlias: string;       // "mcb-ch1-ep4" or "bgi"
  outputPath: string;        // "out/my-core-is-boss-ch1-ep4.mp4"
  episodeDir: string;        // absolute path to episode/project directory
  seriesDir: string;         // absolute path to series directory (or parent for standalone)
  numScenes: number;         // total scenes
  numTransitions: number;    // total transitions (numScenes - 1)

  /** Whether this is a standalone project (no ch/ep) */
  isStandalone: boolean;
}

/**
 * Convert a kebab-case directory name to PascalCase.
 * "weapon-forger-ch1-ep3" → "WeaponForgerCh1Ep3"
 */
function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function computeNaming(
  seriesConfig: SeriesConfig | null,
  category: VideoCategoryId | null,
  chapter: number | null,
  episode: number | null,
  numContentScenes: number,
  repoRoot: string,
): NamingContext {
  const isStandalone = seriesConfig === null || !!category;

  let dirName: string;
  let seriesId: string;
  let scriptAlias: string;
  let seriesDir: string;
  let episodeDir: string;

  if (isStandalone && seriesConfig === null) {
    // Pure category-based project: series ID IS the dir name
    // e.g. --series storygraph-intro --category tech_explainer
    seriesId = category ? `${category}-project` : "standalone";
    dirName = `unknown-project`;
    scriptAlias = "unknown";
    seriesDir = resolve(repoRoot, "bun_remotion_proj");
    episodeDir = resolve(seriesDir, dirName);
  } else if (isStandalone && seriesConfig) {
    // Category-based project with a series config (standalone preset)
    seriesId = seriesConfig.id;
    dirName = seriesConfig.id; // e.g. "storygraph-intro"
    scriptAlias = seriesConfig.abbreviation;
    seriesDir = resolve(repoRoot, "bun_remotion_proj");
    episodeDir = resolve(seriesDir, dirName);
  } else if (seriesConfig) {
    // Episode-based project (existing behavior)
    seriesId = seriesConfig.id;
    const { abbreviation, chapterBased } = seriesConfig;

    dirName = chapterBased
      ? `${seriesId}-ch${chapter}-ep${episode}`
      : `${seriesId}-ep${episode}`;

    scriptAlias = chapterBased
      ? `${abbreviation}-ch${chapter}-ep${episode}`
      : `${abbreviation}${episode}`;

    seriesDir = resolve(repoRoot, "bun_remotion_proj", seriesId);
    episodeDir = resolve(seriesDir, dirName);
  } else {
    // Should not reach here
    seriesId = "unknown";
    dirName = "unknown";
    scriptAlias = "unknown";
    seriesDir = resolve(repoRoot, "bun_remotion_proj");
    episodeDir = resolve(seriesDir, dirName);
  }

  // Package name
  const packageName = `@bun-remotion/${dirName}`;

  // Composition ID (PascalCase)
  const compositionId = toPascalCase(dirName);

  // Output path
  const outputPath = `out/${dirName}.mp4`;

  // Scene counts
  const numScenes = 1 + numContentScenes + 1; // title + content + outro
  const numTransitions = numScenes - 1;

  return {
    seriesId,
    category,
    chapter,
    episode,
    numContentScenes,
    dirName,
    packageName,
    compositionId,
    scriptAlias,
    outputPath,
    episodeDir,
    seriesDir,
    numScenes,
    numTransitions,
    isStandalone,
  };
}
