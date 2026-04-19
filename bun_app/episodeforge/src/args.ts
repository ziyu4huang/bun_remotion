/**
 * CLI argument parsing for the scaffold generator.
 */

import { VIDEO_CATEGORIES, listCategoryIds } from "remotion_types";
import type { VideoCategoryId } from "remotion_types";
import type { SeriesConfig } from "./series-config";

export interface ScaffoldArgs {
  series: string;
  category: VideoCategoryId | null;
  chapter: number | null;
  episode: number | null; // null for standalone projects (tech_explainer, etc.)
  scenes: number | null; // null = use series/category default
  dryRun: boolean;
  skipInstall: boolean;
  help: boolean;
}

export function parseArgs(argv: string[]): ScaffoldArgs {
  const args: ScaffoldArgs = {
    series: "",
    category: null,
    chapter: null,
    episode: null,
    scenes: null,
    dryRun: false,
    skipInstall: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--help":
      case "-h":
        args.help = true;
        break;
      case "--series":
        args.series = argv[++i] ?? "";
        break;
      case "--category":
        args.category = (argv[++i] ?? "") as VideoCategoryId;
        break;
      case "--ch":
        args.chapter = parseInt(argv[++i] ?? "", 10);
        break;
      case "--ep":
        args.episode = parseInt(argv[++i] ?? "", 10);
        break;
      case "--scenes":
        args.scenes = parseInt(argv[++i] ?? "", 10);
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--skip-install":
        args.skipInstall = true;
        break;
      default:
        if (!arg.startsWith("-")) {
          if (!args.series) args.series = arg;
        }
        break;
    }
  }

  return args;
}

export function validateArgs(args: ScaffoldArgs, config: SeriesConfig | null): void {
  if (!args.series) {
    console.error("ERROR: --series is required");
    process.exit(1);
  }

  // Validate category if provided
  if (args.category && !VIDEO_CATEGORIES[args.category]) {
    console.error(`ERROR: Unknown category "${args.category}"`);
    console.error(`Available: ${listCategoryIds().join(", ")}`);
    process.exit(1);
  }

  // Category-based standalone projects (tech_explainer, etc.) don't need --ep
  const isStandalone = config?.standalone === true;

  if (!isStandalone) {
    if (!args.episode || args.episode < 1) {
      console.error("ERROR: --ep is required and must be >= 1 for episode-based series");
      process.exit(1);
    }
  }

  if (config) {
    if (config.chapterBased) {
      if (args.chapter === null || args.chapter < 1) {
        console.error(`ERROR: --ch is required for chapter-based series "${config.id}"`);
        process.exit(1);
      }
    } else if (!isStandalone) {
      if (args.chapter !== null) {
        console.error(`ERROR: --ch is not valid for flat series "${config.id}"`);
        process.exit(1);
      }
    }
  }

  if (args.scenes !== null && args.scenes < 1) {
    console.error("ERROR: --scenes must be >= 1");
    process.exit(1);
  }
}

export function showHelp(): void {
  console.log(`Usage: bun run episodeforge --series <id> [options]

Options:
  --series <id>           Series ID (required)
  --category <id>         Video category: ${listCategoryIds().join(", ")}
  --ch <N>                Chapter number (required for chapter-based series)
  --ep <M>                Episode number (required for episode-based series)
  --scenes <N>            Override content scene count (default from series)
  --dry-run               Print files without writing
  --skip-install          Skip bun install step
  --help, -h              Show this help

Available series:
  weapon-forger           (chapter-based, 2 content scenes)
  my-core-is-boss         (chapter-based, 3 content scenes)
  galgame-meme-theater    (flat, 4 content scenes)

Category-based (no --ep needed):
  bun run episodeforge --series storygraph-intro --category tech_explainer

Episode-based examples:
  bun run episodeforge --series my-core-is-boss --ch 1 --ep 4
  bun run episodeforge --series weapon-forger --ch 2 --ep 1 --dry-run
  bun run episodeforge --series galgame-meme-theater --ep 6
`);
}
