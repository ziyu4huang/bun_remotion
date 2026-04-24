/**
 * Importable scaffold API — callable from Hono handlers, CLI, or tests.
 *
 * Usage:
 *   import { scaffold } from "./scaffold";
 *   const result = await scaffold({ series: "weapon-forger", chapter: 1, episode: 4 });
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getSeriesConfig } from "./series-config";
import { computeNaming } from "./naming";
import { collectFiles, writeFiles, verify } from "./writer";
import { updateDevSh, updateRootPackageJson } from "./updaters";
import type { ScaffoldContext } from "./templates";
import type { VideoCategoryId } from "remotion_types";

export interface ScaffoldOptions {
  /** Series ID (required) */
  series: string;
  /** Video category override */
  category?: VideoCategoryId;
  /** Chapter number (required for chapter-based series) */
  chapter?: number;
  /** Episode number (required for episode-based series) */
  episode?: number;
  /** Override content scene count */
  scenes?: number;
  /** Don't write files, just return what would be created */
  dryRun?: boolean;
  /** Skip bun install */
  skipInstall?: boolean;
  /** Repository root (defaults to auto-detected) */
  repoRoot?: string;
}

export interface ScaffoldResult {
  success: boolean;
  naming: {
    dirName: string;
    packageName: string;
    compositionId: string;
    scriptAlias: string;
    episodeDir: string;
    seriesDir: string;
    numScenes: number;
    numTransitions: number;
    isStandalone: boolean;
  };
  filesWritten: number;
  skipped: string[];
  errors: string[];
}

const DEFAULT_REPO_ROOT = resolve(import.meta.dir, "../../..");

export async function scaffold(options: ScaffoldOptions): Promise<ScaffoldResult> {
  const errors: string[] = [];
  const skipped: string[] = [];
  const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;

  // Load series config
  const config = getSeriesConfig(options.series);

  // Validation
  if (!options.series) {
    return { success: false, naming: emptyNaming(), filesWritten: 0, skipped: [], errors: ["--series is required"] };
  }

  const isStandalone = config?.standalone === true;
  const category = options.category ?? config?.category ?? null;

  if (!isStandalone && (!options.episode || options.episode < 1)) {
    return { success: false, naming: emptyNaming(), filesWritten: 0, skipped: [], errors: ["--ep is required and must be >= 1 for episode-based series"] };
  }

  if (config?.chapterBased && (!options.chapter || options.chapter < 1)) {
    return { success: false, naming: emptyNaming(), filesWritten: 0, skipped: [], errors: [`--ch is required for chapter-based series "${config.id}"`] };
  }

  const numContentScenes = options.scenes ?? config?.defaultContentScenes ?? 7;

  // Compute naming
  const naming = computeNaming(
    config,
    category,
    options.chapter ?? null,
    options.episode ?? null,
    numContentScenes,
    repoRoot,
  );

  // Idempotency check
  if (existsSync(naming.episodeDir) && !options.dryRun) {
    return {
      success: false,
      naming: namingToResult(naming),
      filesWritten: 0,
      skipped: [],
      errors: [`Directory already exists: ${naming.episodeDir}`],
    };
  }

  // Build context
  const ctx: ScaffoldContext = {
    naming,
    config: config ?? {
      id: options.series,
      displayName: options.series,
      abbreviation: naming.scriptAlias,
      chapterBased: false,
      standalone: true,
      category: category ?? undefined,
      contentScenePrefix: "",
      defaultContentScenes: numContentScenes,
      charactersImportPath: "../../shared/src/fonts",
      componentsImportPath: "../../shared/src/components",
      ttsScriptPath: "../scripts/generate-tts.ts",
      language: "zh-TW",
      voiceCharacters: ["narrator"],
      transitions: [
        { importName: "fade", from: "@remotion/transitions/fade", usage: "fade()" },
        { importName: "slide", from: "@remotion/transitions/slide", usage: 'slide({ direction: "from-right" })' },
      ],
    },
  };

  // Generate and write files
  const files = collectFiles(ctx);
  writeFiles(files, options.dryRun ?? false);

  if (!options.dryRun) {
    updateDevSh(ctx);
    updateRootPackageJson(ctx);

    if (!options.skipInstall) {
      const result = Bun.spawnSync(["bun", "install"], {
        cwd: repoRoot,
        stdio: ["inherit", "pipe", "pipe"],
      });
      if (result.exitCode !== 0) {
        errors.push("bun install failed — you may need to run it manually");
      }
    }
  }

  return {
    success: true,
    naming: namingToResult(naming),
    filesWritten: files.length,
    skipped,
    errors,
  };
}

function namingToResult(naming: ReturnType<typeof computeNaming>): ScaffoldResult["naming"] {
  return {
    dirName: naming.dirName,
    packageName: naming.packageName,
    compositionId: naming.compositionId,
    scriptAlias: naming.scriptAlias,
    episodeDir: naming.episodeDir,
    seriesDir: naming.seriesDir,
    numScenes: naming.numScenes,
    numTransitions: naming.numTransitions,
    isStandalone: naming.isStandalone,
  };
}

function emptyNaming(): ScaffoldResult["naming"] {
  return {
    dirName: "",
    packageName: "",
    compositionId: "",
    scriptAlias: "",
    episodeDir: "",
    seriesDir: "",
    numScenes: 0,
    numTransitions: 0,
    isStandalone: false,
  };
}
