// CLI entry point for bun_graphify

import { resolve } from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { detect, detectMultiple, applyFilters } from './detect';
import type { FilterOptions } from './detect';
import { extractAST } from './extract/ast';
import { buildFromExtraction, mergeExtractions } from './build';
import { cluster, splitOversized } from './cluster';
import { writeGraphJSON } from './export/graph-json';
import { writeGraphHTML } from './export/graph-html';
import { patchHTML } from './export/patch-html';
import { writeReport } from './report';

const VERSION = '0.2.0';

// ── Arg helpers ──

function getOpt(args: string[], flag: string, defaultValue: string | null): string | null {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return defaultValue;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

/** Extract positional args (non-flag, non-value tokens) */
function getPositionalArgs(args: string[]): string[] {
  const flagsWithValues = new Set([
    '--output-dir', '--labels', '--title', '--format',
    '--include', '--exclude', '--exclude-dir', '--max-files',
  ]);
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--') && flagsWithValues.has(args[i])) {
      i++; // skip value
    } else if (!args[i].startsWith('--')) {
      positional.push(args[i]);
    }
  }
  return positional;
}

function parseFilterOpts(args: string[]): FilterOptions {
  const opts: FilterOptions = {};
  const include = getOpt(args, '--include', null);
  const exclude = getOpt(args, '--exclude', null);
  const excludeDir = getOpt(args, '--exclude-dir', null);
  const maxFiles = getOpt(args, '--max-files', null);

  if (include) opts.include = include.split(',').map(e => e.startsWith('.') ? e : `.${e}`);
  if (exclude) opts.exclude = exclude.split(',').map(e => e.startsWith('.') ? e : `.${e}`);
  if (excludeDir) opts.excludeDirs = excludeDir.split(',');
  if (maxFiles) opts.maxFiles = parseInt(maxFiles, 10);

  return opts;
}

// ── Logging helpers ──

let quiet = false;
let verbose = false;

function log(msg: string) {
  if (!quiet) console.log(msg);
}

function vlog(msg: string) {
  if (verbose && !quiet) console.log(msg);
}

// ── Usage ──

function usage(): void {
  console.log(`bun_graphify v${VERSION} — Bun/TypeScript knowledge graph generator

Usage: bun run src/cli.ts <command> [paths...] [options]

Commands:
  full <paths...>       Run complete pipeline (detect → extract → build → cluster → export)
  detect <paths...>     Step 1: Detect and classify files
  extract <paths...>    Step 2: AST extraction on code files
  build <json>          Step 3: Build graph from extraction JSON
  cluster <json>        Step 4: Cluster graph from extraction JSON
  export <json>         Step 5: Export graph.json + graph.html
  query <json> <node>   BFS traversal from a node
  explain <json> <node> Show node details with neighbors
  plan <json>           Show plan info from a previous run

Paths:
  Multiple input sources supported: full src/ lib/ tests/
  Defaults to '.' if no paths given.

Options:
  --output-dir <path>      Output directory (default: graphify-out)
  --format <json|html|both> Output format (default: both)
  --title <string>         Title for HTML output
  --labels <path>          Path to community labels JSON
  --include <ext,ext>      Only process these file extensions
  --exclude <ext,ext>      Skip these file extensions
  --exclude-dir <name,...> Skip these directory names
  --max-files <n>          Cap number of files to process
  --no-viz                 Skip HTML visualization
  --verbose                Detailed progress output
  --quiet                  Only print errors
`);
}

// ── Plan file ──

interface PlanFile {
  version: string;
  inputs: string[];
  output_dir: string;
  options: {
    format: string;
    title: string;
    include: string[] | null;
    exclude: string[] | null;
    exclude_dirs: string[];
    no_viz: boolean;
  };
  stats: {
    files_detected: number;
    nodes: number;
    edges: number;
    communities: number;
  };
  timestamp: string;
}

async function writePlan(
  outputDir: string,
  inputs: string[],
  options: PlanFile['options'],
  stats: PlanFile['stats'],
): Promise<void> {
  const plan: PlanFile = {
    version: VERSION,
    inputs,
    output_dir: outputDir,
    options,
    stats,
    timestamp: new Date().toISOString(),
  };
  await writeFile(
    `${outputDir}/plan.json`,
    JSON.stringify(plan, null, 2),
    'utf-8',
  );
}

// ── Commands ──

async function cmdDetect(args: string[]): Promise<void> {
  const paths = getPositionalArgs(args);
  if (paths.length === 0) paths.push('.');
  const filterOpts = parseFilterOpts(args);

  const result = await detectMultiple(paths, filterOpts);

  const codeExts = new Set<string>();
  for (const f of result.files.code) {
    const ext = f.split('.').pop()?.toLowerCase() || '';
    codeExts.add(ext);
  }

  log(`Corpus: ${result.total_files} files · ~${result.total_words} words`);
  log(`  code:    ${result.files.code.length} files (${[...codeExts].sort().join(' ')})`);
  log(`  docs:    ${result.files.document.length} files`);
  log(`  papers:  ${result.files.paper.length} files`);
  log(`  images:  ${result.files.image.length} files`);
  if (result.skipped_sensitive > 0) {
    log(`  skipped: ${result.skipped_sensitive} sensitive files`);
  }
}

async function cmdExtract(args: string[]): Promise<void> {
  const paths = getPositionalArgs(args);
  if (paths.length === 0) paths.push('.');
  const filterOpts = parseFilterOpts(args);

  const result = await detectMultiple(paths, filterOpts);

  if (result.files.code.length === 0) {
    log('No code files found.');
    return;
  }

  log(`Extracting AST from ${result.files.code.length} code files...`);
  const extraction = await extractAST(result.files.code);
  log(`Total AST: ${extraction.nodes.length} nodes, ${extraction.edges.length} edges`);

  const outputDir = getOpt(args, '--output-dir', 'graphify-out')!;
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    `${outputDir}/.graphify_extract.json`,
    JSON.stringify(extraction, null, 2),
    'utf-8',
  );
  log(`Extraction written to ${outputDir}/.graphify_extract.json`);
}

async function cmdFull(args: string[]): Promise<void> {
  const paths = getPositionalArgs(args);
  if (paths.length === 0) paths.push('.');
  const outputDir = getOpt(args, '--output-dir', 'graphify-out')!;
  const noViz = hasFlag(args, '--no-viz');
  const labelsPath = getOpt(args, '--labels', null);
  const title = getOpt(args, '--title', 'graphify')!;
  const format = getOpt(args, '--format', 'both')!;
  const filterOpts = parseFilterOpts(args);

  await mkdir(outputDir, { recursive: true });

  // Step 1: Detect
  log('Step 1: Detecting files...');
  const detectResult = await detectMultiple(paths, filterOpts);
  log(`  Found ${detectResult.total_files} files (${detectResult.files.code.length} code, ${detectResult.files.document.length} docs)`);

  if (detectResult.files.code.length === 0 && detectResult.files.document.length === 0) {
    log('No supported files found.');
    return;
  }

  // Step 2: Extract AST
  log('Step 2: Extracting AST...');
  const scanRoot = resolve(paths[0]);
  const extraction = await extractAST(detectResult.files.code, scanRoot);
  log(`  AST: ${extraction.nodes.length} nodes, ${extraction.edges.length} edges`);

  // Step 3: Build graph
  log('Step 3: Building graph...');
  const graph = buildFromExtraction(extraction);
  log(`  Graph: ${graph.order} nodes, ${graph.size} edges`);

  // Step 4: Cluster
  log('Step 4: Clustering...');
  let communities = cluster(graph);
  communities = splitOversized(graph, communities);
  log(`  Communities: ${Object.keys(communities).length}`);

  // Load labels if provided
  let communityLabels: Record<string, string> = {};
  if (labelsPath) {
    try {
      communityLabels = JSON.parse(await readFile(labelsPath, 'utf-8'));
    } catch {
      log(`  WARNING: Could not load labels from ${labelsPath}`);
    }
  }

  // Step 5: Export
  log('Step 5: Exporting...');

  if (format === 'json' || format === 'both') {
    await writeGraphJSON(graph, communities, extraction.hyperedges, `${outputDir}/graph.json`);
    log(`  Written ${outputDir}/graph.json`);
  }

  if ((format === 'html' || format === 'both') && !noViz) {
    await writeGraphHTML(graph, communities, communityLabels, extraction.hyperedges, `${outputDir}/graph.html`, title);
    await patchHTML(`${outputDir}/graph.html`);
    log(`  Written ${outputDir}/graph.html`);
  }

  await writeReport(graph, communities, communityLabels, `${outputDir}/GRAPH_REPORT.md`);
  log(`  Written ${outputDir}/GRAPH_REPORT.md`);

  // Step 6: Write plan file
  const opts: PlanFile['options'] = {
    format,
    title,
    include: filterOpts.include ?? null,
    exclude: filterOpts.exclude ?? null,
    exclude_dirs: filterOpts.excludeDirs ?? [],
    no_viz: noViz,
  };
  const stats: PlanFile['stats'] = {
    files_detected: detectResult.total_files,
    nodes: graph.order,
    edges: graph.size,
    communities: Object.keys(communities).length,
  };
  await writePlan(outputDir, paths, opts, stats);
  log(`  Written ${outputDir}/plan.json`);

  log(`\nDone! ${graph.order} nodes, ${graph.size} edges, ${Object.keys(communities).length} communities`);
}

async function cmdQuery(args: string[]): Promise<void> {
  const jsonPath = args[0];
  const startNode = args[1];

  if (!jsonPath || !startNode) {
    console.log('Usage: query <graph.json> <node_id>');
    return;
  }

  const data = JSON.parse(await readFile(jsonPath, 'utf-8'));
  const nodesMap = new Map((data.nodes as Array<{ id: string; label?: string; community?: number }>).map(n => [n.id, n]));

  // Build adjacency list
  const adj = new Map<string, string[]>();
  for (const e of (data.links || []) as Array<{ source: string; target: string }>) {
    adj.set(e.source, [...(adj.get(e.source) || []), e.target]);
    adj.set(e.target, [...(adj.get(e.target) || []), e.source]);
  }

  // BFS
  const visited = new Set<string>();
  const queue = [startNode];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const neighbor of adj.get(node) || []) {
      if (!visited.has(neighbor)) queue.push(neighbor);
    }
  }

  console.log(`Reachable from ${startNode}: ${visited.size} nodes`);
  for (const nid of [...visited].sort()) {
    const n = nodesMap.get(nid);
    console.log(`  ${n?.label ?? nid} [${nid}]${n?.community !== undefined ? ` (community ${n.community})` : ''}`);
  }
}

async function cmdExplain(args: string[]): Promise<void> {
  const jsonPath = args[0];
  const nodeName = args[1];

  if (!jsonPath || !nodeName) {
    console.log('Usage: explain <graph.json> <node_name_or_id>');
    return;
  }

  const data = JSON.parse(await readFile(jsonPath, 'utf-8'));
  const nodes = data.nodes as Array<{ id: string; label?: string; file_type?: string; source_file?: string; community?: number }>;
  const links = (data.links || []) as Array<{ source: string; target: string; relation?: string; confidence?: string; confidence_score?: number }>;

  // Fuzzy match: exact id match first, then label contains
  let node = nodes.find(n => n.id === nodeName);
  if (!node) node = nodes.find(n => n.id.includes(nodeName));
  if (!node) node = nodes.find(n => n.label?.toLowerCase().includes(nodeName.toLowerCase()));
  if (!node) {
    console.log(`Node "${nodeName}" not found.`);
    return;
  }

  console.log(`Node: ${node.label} [${node.id}]`);
  console.log(`  type: ${node.file_type}, file: ${node.source_file}, community: ${node.community}`);

  // Verified connections (EXTRACTED)
  const verified = links.filter(e => (e.source === node!.id || e.target === node!.id) && e.confidence === 'EXTRACTED');
  const hypotheses = links.filter(e => (e.source === node!.id || e.target === node!.id) && e.confidence !== 'EXTRACTED');

  if (verified.length > 0) {
    console.log(`\n  Verified connections (${verified.length}):`);
    for (const e of verified) {
      const other = e.source === node!.id ? e.target : e.source;
      const otherNode = nodes.find(n => n.id === other);
      console.log(`    → ${otherNode?.label ?? other} [${e.relation}] (score: ${e.confidence_score})`);
    }
  }

  if (hypotheses.length > 0) {
    console.log(`\n  Hypotheses (${hypotheses.length}):`);
    for (const e of hypotheses) {
      const other = e.source === node!.id ? e.target : e.source;
      const otherNode = nodes.find(n => n.id === other);
      console.log(`    ? ${otherNode?.label ?? other} [${e.relation}] (${e.confidence}, score: ${e.confidence_score})`);
    }
  }

  if (node.source_file) {
    console.log(`\n  Source: read ${node.source_file} for ground truth`);
  }
}

async function cmdPlan(args: string[]): Promise<void> {
  const jsonPath = args[0];
  if (!jsonPath) {
    console.log('Usage: plan <plan.json>');
    return;
  }

  try {
    const plan: PlanFile = JSON.parse(await readFile(jsonPath, 'utf-8'));
    console.log(`bun_graphify v${plan.version} — run plan`);
    console.log(`  inputs:  ${plan.inputs.join(', ')}`);
    console.log(`  output:  ${plan.output_dir}`);
    console.log(`  format:  ${plan.options.format}`);
    console.log(`  title:   ${plan.options.title}`);
    if (plan.options.include) console.log(`  include: ${plan.options.include.join(', ')}`);
    if (plan.options.exclude) console.log(`  exclude: ${plan.options.exclude.join(', ')}`);
    if (plan.options.exclude_dirs.length) console.log(`  exclude-dirs: ${plan.options.exclude_dirs.join(', ')}`);
    console.log(`\n  Stats:`);
    console.log(`    files:       ${plan.stats.files_detected}`);
    console.log(`    nodes:       ${plan.stats.nodes}`);
    console.log(`    edges:       ${plan.stats.edges}`);
    console.log(`    communities: ${plan.stats.communities}`);
    console.log(`\n  Timestamp: ${plan.timestamp}`);
  } catch {
    console.log(`Could not read plan from ${jsonPath}`);
  }
}

// ── Main ──

const args = process.argv.slice(2);
const command = args[0];

// Parse global flags
quiet = hasFlag(args, '--quiet');
verbose = hasFlag(args, '--verbose');

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
  case 'build':
    console.log('build: use build <json> via graphology directly');
    break;
  case 'cluster':
    console.log('cluster: use cluster <json> via Louvain directly');
    break;
  case 'export':
    console.log('export: use export <json> to write graph.json + graph.html');
    break;
  case 'query':
    cmdQuery(args.slice(1)).catch(console.error);
    break;
  case 'explain':
    cmdExplain(args.slice(1)).catch(console.error);
    break;
  case 'plan':
    cmdPlan(args.slice(1)).catch(console.error);
    break;
  case '--version':
  case '-v':
    console.log(`bun_graphify v${VERSION}`);
    break;
  default:
    usage();
    break;
}
