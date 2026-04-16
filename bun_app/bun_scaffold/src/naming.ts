/**
 * Naming conventions — derives all names from series config + episode numbers.
 */

import { resolve } from "node:path";
import type { SeriesConfig } from "./series-config";

export interface NamingContext {
  seriesId: string;
  chapter: number | null;
  episode: number;
  numContentScenes: number;

  // Derived names
  dirName: string;           // "my-core-is-boss-ch1-ep4"
  packageName: string;       // "@bun-remotion/my-core-is-boss-ch1-ep4"
  compositionId: string;     // "MyCoreIsBossCh1Ep4"
  scriptAlias: string;       // "mcb-ch1-ep4"
  outputPath: string;        // "out/my-core-is-boss-ch1-ep4.mp4"
  episodeDir: string;        // absolute path to episode directory
  seriesDir: string;         // absolute path to series directory
  numScenes: number;         // total scenes (title + content + outro)
  numTransitions: number;    // total transitions (numScenes - 1)
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
  seriesConfig: SeriesConfig,
  chapter: number | null,
  episode: number,
  numContentScenes: number,
  repoRoot: string,
): NamingContext {
  const { id, abbreviation, chapterBased } = seriesConfig;

  // Directory name
  const dirName = chapterBased
    ? `${id}-ch${chapter}-ep${episode}`
    : `${id}-ep${episode}`;

  // Package name
  const packageName = `@bun-remotion/${dirName}`;

  // Composition ID (PascalCase)
  const compositionId = toPascalCase(dirName);

  // Script alias
  const scriptAlias = chapterBased
    ? `${abbreviation}-ch${chapter}-ep${episode}`
    : `${abbreviation}${episode}`;

  // Output path
  const outputPath = `out/${dirName}.mp4`;

  // Absolute paths
  const seriesDir = resolve(repoRoot, "bun_remotion_proj", id);
  const episodeDir = resolve(seriesDir, dirName);

  // Scene counts
  const numScenes = 1 + numContentScenes + 1; // title + content + outro
  const numTransitions = numScenes - 1;

  return {
    seriesId: id,
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
  };
}
