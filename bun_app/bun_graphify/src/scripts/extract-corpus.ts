/**
 * Extract narrative corpus from a Remotion series directory.
 *
 * Usage:
 *   bun run src/scripts/extract-corpus.ts <series-dir> [--output <path>]
 *
 * Example:
 *   bun run src/scripts/extract-corpus.ts ../../bun_remotion_proj/weapon-forger
 *   bun run src/scripts/extract-corpus.ts ../../bun_remotion_proj/weapon-forger --output /tmp/corpus.md
 */

import { resolve, dirname } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import {
  extractSeriesNarrative,
  narrativeToCorpus,
} from "../extract/narrative";

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help")) {
  console.log(`extract-corpus — Extract narrative dialog from Remotion episode files

Usage:
  bun run src/scripts/extract-corpus.ts <series-dir> [--output <path>]

Options:
  --output <path>   Output file path (default: <series-dir>/graphify-out/narrative-corpus.md)

Examples:
  bun run src/scripts/extract-corpus.ts ../../bun_remotion_proj/weapon-forger
  bun run src/scripts/extract-corpus.ts ../../bun_remotion_proj/galgame-meme-theater
`);
  process.exit(0);
}

const seriesDir = resolve(args[0]);
if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path. Use absolute paths.`);
  process.exit(1);
}

// Find --output flag
const outputIdx = args.indexOf("--output");
const outputPath = outputIdx !== -1 && args[outputIdx + 1]
  ? resolve(args[outputIdx + 1])
  : resolve(seriesDir, "graphify-out", "narrative-corpus.md");

async function main() {
  console.log(`Extracting narrative corpus from: ${seriesDir}`);

  const narrative = extractSeriesNarrative(seriesDir);

  if (narrative.episodes.length === 0) {
    console.error("No episodes found. Make sure the directory contains weapon-forger-chN-epM subdirectories.");
    process.exit(1);
  }

  console.log(`Found ${narrative.episodes.length} episodes:`);
  for (const ep of narrative.episodes) {
    const totalLines = ep.scenes.reduce((sum, s) => sum + s.lines.length, 0);
    console.log(`  ${ep.episodeId}: ${ep.title} (${totalLines} dialog lines, chars: ${ep.characters.join(", ")})`);
  }

  if (narrative.runningGags.length > 0) {
    console.log(`Running gags: ${narrative.runningGags.map(g => g.name).join(", ")}`);
  }

  const corpus = narrativeToCorpus(narrative);

  // Ensure output directory exists
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, corpus, "utf-8");

  const wordCount = corpus.length;
  console.log(`\nCorpus written to: ${outputPath}`);
  console.log(`Size: ${wordCount.toLocaleString()} characters, ${narrative.episodes.length} episodes`);
}

main().catch(console.error);
