/**
 * Episode scaffold generator for bun-remotion.
 *
 * Usage:
 *   bun run scaffold --series my-core-is-boss --ch 1 --ep 4
 *   bun run scaffold --series weapon-forger --ch 2 --ep 1 --dry-run
 *   bun run scaffold --series galgame-meme-theater --ep 6
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

  // Load series config
  const config = getSeriesConfig(args.series);

  // Validate args against series config
  validateArgs(args, config);

  // Resolve content scene count
  const numContentScenes = args.scenes ?? config.defaultContentScenes;

  // Compute all naming
  const naming = computeNaming(
    config,
    args.chapter,
    args.episode,
    numContentScenes,
    REPO_ROOT,
  );

  // Idempotency check
  if (existsSync(naming.episodeDir) && !args.dryRun) {
    console.error(`ERROR: Episode directory already exists: ${naming.episodeDir}`);
    console.error("Remove it first if you want to re-scaffold.");
    process.exit(1);
  }

  // Build context
  const ctx: ScaffoldContext = { naming, config };

  console.log(`Scaffolding ${config.displayName} ${naming.chapter !== null ? `ch${naming.chapter}-` : ""}ep${naming.episode}...`);
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
