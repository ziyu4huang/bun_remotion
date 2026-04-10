// CLI entry point for graphify-bun

import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { detect } from './detect';
import { extractAST } from './extract/ast';
import { buildFromExtraction, mergeExtractions } from './build';
import { cluster, splitOversized } from './cluster';
import { writeGraphJSON } from './export/graph-json';
import { writeGraphHTML } from './export/graph-html';
import { patchHTML } from './export/patch-html';
import { writeReport } from './report';

function usage(): void {
  console.log(`graphify-bun — code knowledge graph generator

Usage: bun run src/cli.ts <command> [options]

Commands:
  full <path>           Run complete pipeline (detect → extract → build → cluster → export)
  detect <path>         Step 1: Detect and classify files
  extract <path>        Step 2: AST extraction on code files
  build <json>          Step 3: Build graph from extraction JSON
  cluster <json>        Step 4: Cluster graph from extraction JSON
  export <json>         Step 5: Export graph.json + graph.html

Options:
  --output-dir <path>   Output directory (default: graphify-out)
  --no-viz              Skip HTML visualization
  --labels <path>       Path to community labels JSON
  --title <string>      Title for HTML output
`);
}

async function cmdDetect(args: string[]): Promise<void> {
  const path = args[0] || '.';
  const result = await detect(resolve(path));

  const codeExts = new Set<string>();
  for (const f of result.files.code) {
    const ext = f.split('.').pop()?.toLowerCase() || '';
    codeExts.add(ext);
  }

  console.log(`Corpus: ${result.total_files} files · ~${result.total_words} words`);
  console.log(`  code:    ${result.files.code.length} files (${[...codeExts].sort().join(' ')})`);
  console.log(`  docs:    ${result.files.document.length} files`);
  console.log(`  papers:  ${result.files.paper.length} files`);
  console.log(`  images:  ${result.files.image.length} files`);
  if (result.skipped_sensitive > 0) {
    console.log(`  skipped: ${result.skipped_sensitive} sensitive files`);
  }
}

async function cmdExtract(args: string[]): Promise<void> {
  const path = args[0] || '.';
  const result = await detect(resolve(path));

  if (result.files.code.length === 0) {
    console.log('No code files found.');
    return;
  }

  console.log(`Extracting AST from ${result.files.code.length} code files...`);
  const extraction = await extractAST(result.files.code);
  console.log(`Total AST: ${extraction.nodes.length} nodes, ${extraction.edges.length} edges`);

  // Write extraction to file
  const outputDir = getOpt(args, '--output-dir', 'graphify-out');
  await mkdir(outputDir, { recursive: true });
  const { writeFile } = await import('node:fs/promises');
  await writeFile(
    `${outputDir}/.graphify_extract.json`,
    JSON.stringify(extraction, null, 2),
    'utf-8',
  );
  console.log(`Extraction written to ${outputDir}/.graphify_extract.json`);
}

async function cmdFull(args: string[]): Promise<void> {
  const path = args[0] || '.';
  const outputDir = getOpt(args, '--output-dir', 'graphify-out');
  const noViz = args.includes('--no-viz');
  const labelsPath = getOpt(args, '--labels', null);
  const title = getOpt(args, '--title', 'graphify');

  await mkdir(outputDir, { recursive: true });

  // Step 1: Detect
  console.log('Step 1: Detecting files...');
  const detectResult = await detect(resolve(path));
  console.log(`  Found ${detectResult.total_files} files (${detectResult.files.code.length} code, ${detectResult.files.document.length} docs)`);

  if (detectResult.files.code.length === 0 && detectResult.files.document.length === 0) {
    console.log('No supported files found.');
    return;
  }

  // Step 2: Extract AST
  console.log('Step 2: Extracting AST...');
  const scanRoot = resolve(path);
  const extraction = await extractAST(detectResult.files.code, scanRoot);
  console.log(`  AST: ${extraction.nodes.length} nodes, ${extraction.edges.length} edges`);

  // Step 3: Build graph
  console.log('Step 3: Building graph...');
  const graph = buildFromExtraction(extraction);
  console.log(`  Graph: ${graph.order} nodes, ${graph.size} edges`);

  // Step 4: Cluster
  console.log('Step 4: Clustering...');
  let communities = cluster(graph);
  communities = splitOversized(graph, communities);
  console.log(`  Communities: ${Object.keys(communities).length}`);

  // Load labels if provided
  let communityLabels: Record<string, string> = {};
  if (labelsPath) {
    try {
      const { readFile } = await import('node:fs/promises');
      communityLabels = JSON.parse(await readFile(labelsPath, 'utf-8'));
    } catch {
      console.log(`  WARNING: Could not load labels from ${labelsPath}`);
    }
  }

  // Step 5: Export
  console.log('Step 5: Exporting...');
  await writeGraphJSON(graph, communities, extraction.hyperedges, `${outputDir}/graph.json`);
  console.log(`  Written ${outputDir}/graph.json`);

  if (!noViz) {
    await writeGraphHTML(graph, communities, communityLabels, extraction.hyperedges, `${outputDir}/graph.html`, title);
    await patchHTML(`${outputDir}/graph.html`);
    console.log(`  Written ${outputDir}/graph.html`);
  }

  await writeReport(graph, communities, communityLabels, `${outputDir}/GRAPH_REPORT.md`);
  console.log(`  Written ${outputDir}/GRAPH_REPORT.md`);

  console.log(`\nDone! ${graph.order} nodes, ${graph.size} edges, ${Object.keys(communities).length} communities`);
}

function getOpt(args: string[], flag: string, defaultValue: string): string {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return defaultValue;
}

// Main
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'full':
    cmdFull(args.slice(1)).catch(console.error);
    break;
  case 'detect':
    cmdDetect(args.slice(1)).catch(console.error);
    break;
  case 'extract':
    cmdExtract(args.slice(1)).catch(console.error);
    break;
  default:
    usage();
    break;
}
