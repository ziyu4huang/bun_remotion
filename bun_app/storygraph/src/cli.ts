// CLI entry point for storygraph
// Re-export pipeline API for programmatic use
export { runPipeline, runScore, runCheck, getPipelineStatus } from "./pipeline-api";
export type { AIPipelineOptions, PipelineResult, ScoreResult, CheckResult, PipelineStatusResult } from "./pipeline-api";

import { resolve, join } from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
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
  console.log(`storygraph v${VERSION} — Bun/TypeScript knowledge graph generator

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

  episode <ep-dir>      Per-episode graph generation (federated)
  merge <series-dir>    Merge per-episode graphs with link edges
  check <series-dir>    Consistency checking via link edges
  score <series-dir>    AI-based KG quality scoring (Tier 1)
  pipeline <series-dir> Run episode → merge → check for all episodes
  parse-plan <series-dir>  Parse PLAN.md → plan-struct.json
  validate-plan <series-dir> Validate plan-struct.json against rules
  write-gate <series-dir> Generate zh_TW quality gate report (Step 3b lite)
  review <series-dir>     Tier 2 quality review → quality-review.json (Phase 33-D1)
  gen-prompt <series-dir> Generate story-writing constraint prompt from KG (Phase 32-A)
  enrich <series-dir>     Post-render KG enrichment (Phase 32-B1)
  calibrate <series-dir>  Track KG feature → quality correlation (Phase 32-B2)
  gen-narration <ep-dir>  Generate narration.ts from dialog data (Phase 33-F4a)
  gen-todo <ep-dir>       Generate episode TODO.md from PLAN.md (Phase 33-F4b)
  regression              Compare pipeline results against baselines (Phase 33-G5)
  tier-compare            Compare quality across series and modes (Phase 33-G1)
  cost-matrix             Track pipeline step timing and cost (Phase 33-G3)
  model-bench <series>    Benchmark AI models for KG extraction (Phase 28-B)
  quality-examples        Show AI extraction summary across all series (Phase 33-D4c)
  story-draft <series>    Generate AI story draft from KG constraints (Phase 33-F3)

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
  --mode <regex|ai|hybrid> AI enrichment mode (default: hybrid)
  --provider <name>        AI provider (default: zai)
  --model <name>           AI model (default: glm-5)
  --ci                     CI mode: exit 0 on pass, 1 on fail (check/score/write-gate)
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
    console.log(`storygraph v${plan.version} — run plan`);
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
  case 'episode':
  case 'merge':
  case 'check':
  case 'score':
  case 'pipeline':
  case 'parse-plan':
  case 'validate-plan':
  case 'write-gate':
  case 'gen-prompt':
  case 'enrich':
  case 'calibrate':
  case 'gen-narration':
  case 'gen-todo':
  case 'regression':
  case 'tier-compare':
  case 'cost-matrix':
  case 'review':
  case 'model-bench':
  case 'quality-examples':
  case 'story-draft':
    // Delegate to dedicated scripts
    {
      const scriptMap: Record<string, string> = {
        'episode': 'graphify-episode',
        'merge': 'graphify-merge',
        'check': 'graphify-check',
        'score': 'graphify-score',
        'pipeline': 'graphify-pipeline',
        'parse-plan': 'plan-parser',
        'validate-plan': 'chapter-validator',
        'write-gate': 'graphify-write-gate',
        'gen-prompt': 'graphify-gen-prompt',
        'enrich': 'graphify-enrich',
        'calibrate': 'prompt-calibration',
        'gen-narration': 'gen-narration',
        'gen-todo': 'gen-episode-todo',
        'regression': 'graphify-regression',
        'tier-compare': 'graphify-tier-compare',
        'cost-matrix': 'graphify-cost-matrix',
        'model-bench': 'graphify-model-bench',
        'review': 'graphify-review',
        'quality-examples': 'graphify-quality-examples',
        'story-draft': 'graphify-story-draft',
      };
      const script = scriptMap[command] ?? command;
      const ciMode = hasFlag(args, '--ci');
      const ciCommands = new Set(['check', 'score', 'write-gate', 'regression']);

      if (ciMode && !ciCommands.has(command)) {
        console.error(`--ci flag only applies to: check, score, write-gate`);
        process.exit(1);
      }

      import('child_process').then(({ spawn }) => {
        // Resolve positional args to absolute paths. Must handle flag-value pairs:
        // flags like --mode consume the next arg as a value (not a path to resolve).
        const flagsWithValues = new Set(['--mode', '--provider', '--model', '--series-dir', '--scenes', '--category', '--output', '--target-ep', '--series', '--threshold']);
        const rawArgs = args.slice(1);
        const childArgs: string[] = [];
        for (let i = 0; i < rawArgs.length; i++) {
          if (rawArgs[i].startsWith('-')) {
            childArgs.push(rawArgs[i]);
            if (flagsWithValues.has(rawArgs[i]) && rawArgs[i + 1]) {
              childArgs.push(rawArgs[++i]); // pass flag value through as-is
            }
          } else {
            childArgs.push(resolve(rawArgs[i])); // resolve positional paths
          }
        }
        const scriptPath = resolve(import.meta.dir, 'scripts', `${script}.ts`);
        const child = spawn('bun', [scriptPath, ...childArgs], {
          stdio: 'inherit',
        });
        child.on('close', (code: number) => {
          if (!ciMode || code !== 0) {
            process.exit(code);
            return;
          }

          // Regression handles CI mode internally
          if (command === 'regression') {
            process.exit(code);
            return;
          }

          // CI mode: check gate.json result
          const seriesArg = args.slice(1).find(a => !a.startsWith('--'));
          if (!seriesArg) {
            console.error('[CI] No series directory provided');
            process.exit(1);
            return;
          }
          const seriesDir = resolve(resolve(seriesArg));
          const gatePath = join(seriesDir, 'storygraph_out', 'gate.json');
          const kgPath = join(seriesDir, 'storygraph_out', 'kg-quality-score.json');

          try {
            if (command === 'score' && existsSync(kgPath)) {
              const kg = JSON.parse(readFileSync(kgPath, 'utf-8'));
              const decision = kg.blended?.decision ?? 'REJECT';
              const ok = decision === 'ACCEPT';
              console.log(`[CI] KG Score: ${(kg.blended?.overall * 100).toFixed(1)}% (${decision})`);
              process.exit(ok ? 0 : 1);
            } else if (existsSync(gatePath)) {
              const gate = JSON.parse(readFileSync(gatePath, 'utf-8'));
              const ok = gate.score >= 70 && gate.decision !== 'FAIL';
              console.log(`[CI] Gate: ${gate.score}/100 (${gate.decision})`);
              process.exit(ok ? 0 : 1);
            } else {
              console.error(`[CI] No gate.json found at ${gatePath}`);
              process.exit(1);
            }
          } catch (e) {
            console.error(`[CI] Failed to read gate result: ${e}`);
            process.exit(1);
          }
        });
      });
    }
    break;
  case '--version':
  case '-v':
    console.log(`storygraph v${VERSION}`);
    break;
  default:
    usage();
    break;
}
