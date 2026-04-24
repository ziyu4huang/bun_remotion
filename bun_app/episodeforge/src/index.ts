/**
 * Episode scaffold generator for bun-remotion.
 *
 * Usage:
 *   bun run episodeforge --series my-core-is-boss --ch 1 --ep 4
 *   bun run episodeforge --series weapon-forger --ch 2 --ep 1 --dry-run
 *   bun run episodeforge --series galgame-meme-theater --ep 6
 *   bun run episodeforge --series storygraph-explainer --ch 1 --ep 1
 *
 * Programmatic API:
 *   import { scaffold } from "./scaffold";
 *   const result = await scaffold({ series: "weapon-forger", chapter: 1, episode: 4 });
 */

// Re-export the importable API
export { scaffold } from "./scaffold";
export type { ScaffoldOptions, ScaffoldResult } from "./scaffold";

import { parseArgs, showHelp } from "./args";
import { scaffold } from "./scaffold";

if (import.meta.main) {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  scaffold({
    series: args.series,
    category: args.category ?? undefined,
    chapter: args.chapter ?? undefined,
    episode: args.episode ?? undefined,
    scenes: args.scenes ?? undefined,
    dryRun: args.dryRun,
    skipInstall: args.skipInstall,
  }).then((result) => {
    if (!result.success) {
      for (const err of result.errors) {
        console.error(`ERROR: ${err}`);
      }
      process.exit(1);
    }
    console.log(`\nScaffolded ${result.filesWritten} files to ${result.naming.episodeDir}`);
  });
}
