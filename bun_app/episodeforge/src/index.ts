/**
 * Episode scaffold generator for bun-remotion.
 *
 * Usage:
 *   bun run episodeforge --series my-core-is-boss --ch 1 --ep 4
 *   bun run episodeforge --series weapon-forger --ch 2 --ep 1 --dry-run
 *   bun run episodeforge --series galgame-meme-theater --ep 6
 *   bun run episodeforge --series storygraph-explainer --ch 1 --ep 1
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs, validateArgs, showHelp } from "./args";
import { getSeriesConfig } from "./series-config";
import { computeNaming } from "./naming";
import { collectFiles, writeFiles, verify } from "./writer";
import { updateDevSh, updateRootPackageJson } from "./updaters";
import type { ScaffoldContext } from "./templates";

const REPO_ROOT = resolve(import.meta.dir, "../../..");

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Load series config (null if unknown + category provided)
  const config = getSeriesConfig(args.series);

  // Validate args
  validateArgs(args, config);

  // Determine if this is a standalone project
  const isStandalone = config?.standalone ?? false;

  // Resolve content scene count
  const numContentScenes = args.scenes ?? config?.defaultContentScenes ?? 7;

  // Compute all naming
  const naming = computeNaming(
    config,
    args.category ?? config?.category ?? null,
    args.chapter,
    args.episode,
    numContentScenes,
    REPO_ROOT,
  );

  // Idempotency check
  if (existsSync(naming.episodeDir) && !args.dryRun) {
    console.error(`ERROR: Directory already exists: ${naming.episodeDir}`);
    console.error("Remove it first if you want to re-scaffold.");
    process.exit(1);
  }

  // Build context
  const ctx: ScaffoldContext = {
    naming,
    config: config ?? {
      id: args.series,
      displayName: args.series,
      abbreviation: naming.scriptAlias,
      chapterBased: false,
      standalone: true,
      category: args.category ?? undefined,
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

  const label = isStandalone
    ? `${config?.displayName ?? args.series}`
    : `${ctx.config.displayName} ${naming.chapter !== null ? `ch${naming.chapter}-` : ""}ep${naming.episode}`;

  console.log(`Scaffolding ${label}...`);
  console.log(`  Directory: ${naming.episodeDir}`);
  console.log();

  // Generate and write files
  const files = collectFiles(ctx);
  writeFiles(files, args.dryRun);

  if (!args.dryRun) {
    // Update shared files (dev.sh, root package.json)
    console.log();
    updateDevSh(ctx);
    updateRootPackageJson(ctx);

    // Run bun install
    if (!args.skipInstall) {
      console.log();
      console.log("  Running bun install...");
      const result = Bun.spawnSync(["bun", "install"], {
        cwd: REPO_ROOT,
        stdio: ["inherit", "pipe", "pipe"],
      });
      if (result.exitCode !== 0) {
        console.error("  [WARN] bun install failed — you may need to run it manually");
      } else {
        console.log("  [OK] bun install complete");
      }
    }
  }

  // Print verification summary
  verify(ctx);
}

main();
