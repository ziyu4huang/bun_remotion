/**
 * Tier comparison — compare pipeline quality across series and extraction modes.
 *
 * Generates a side-by-side comparison table of key metrics for all series
 * with pipeline output (gate.json, kg-quality-score.json, merged-graph.json).
 *
 * Usage:
 *   bun run src/scripts/graphify-tier-compare.ts [options]
 *
 * Options:
 *   --output <path>  Output path (default: test-corpus/tier-comparison.md)
 *   --json           Also output as JSON
 */

import { resolve, join } from "node:path";
import {
  readFileSync, writeFileSync, existsSync,
  readdirSync,
} from "node:fs";

// ─── Types ───

interface SeriesMetrics {
  series: string;
  genre: string;
  extractionMode: string;
  episodes: number;
  nodes: number;
  edges: number;
  communities: number;
  gateScore: number;
  gateDecision: string;
  blendedScore: number;
  blendedDecision: string;
  aiOverall: number;
  breakdown: Record<string, number | null>;
  aiDimensions: Record<string, number>;
  passCount: number;
  warnCount: number;
  failCount: number;
  skipCount: number;
}

interface TierComparisonResult {
  generated: string;
  series: SeriesMetrics[];
}

// ─── Functions (exported for testing) ───

export function loadSeriesMetrics(projDir: string, seriesName: string): SeriesMetrics | null {
  const outDir = join(projDir, seriesName, "storygraph_out");
  if (!existsSync(outDir)) return null;

  const gatePath = join(outDir, "gate.json");
  const qualityPath = join(outDir, "kg-quality-score.json");
  const mergedPath = join(outDir, "merged-graph.json");

  if (!existsSync(gatePath)) return null;

  let gate: any;
  try { gate = JSON.parse(readFileSync(gatePath, "utf-8")); } catch { return null; }

  let quality: any = null;
  if (existsSync(qualityPath)) {
    try { quality = JSON.parse(readFileSync(qualityPath, "utf-8")); } catch { /* skip */ }
  }

  let merged: any = null;
  if (existsSync(mergedPath)) {
    try { merged = JSON.parse(readFileSync(mergedPath, "utf-8")); } catch { /* skip */ }
  }

  // Count episodes from episode subdirectories with storygraph_out
  const seriesDir = join(projDir, seriesName);
  let episodes = 0;
  if (existsSync(seriesDir)) {
    const dirs = readdirSync(seriesDir, { withFileTypes: true });
    for (const d of dirs) {
      if (d.isDirectory() && existsSync(join(seriesDir, d.name, "storygraph_out"))) {
        episodes++;
      }
    }
  }

  const checks = gate.checks ?? [];
  const countStatus = (s: string) => checks.filter((c: any) => c.status === s).length;

  return {
    series: seriesName,
    genre: gate.genre ?? "unknown",
    extractionMode: gate.generator?.mode ?? "unknown",
    episodes,
    nodes: merged?.nodes?.length ?? 0,
    edges: (merged?.links?.length ?? 0) + (merged?.cross_links?.length ?? 0),
    communities: merged?.communities?.length ?? 0,
    gateScore: gate.score ?? 0,
    gateDecision: gate.decision ?? "UNKNOWN",
    blendedScore: quality?.blended?.overall ?? 0,
    blendedDecision: quality?.blended?.decision ?? "N/A",
    aiOverall: quality?.ai?.overall ?? 0,
    breakdown: gate.quality_breakdown ?? {},
    aiDimensions: quality?.ai?.dimensions ?? {},
    passCount: countStatus("PASS"),
    warnCount: countStatus("WARN"),
    failCount: countStatus("FAIL"),
    skipCount: countStatus("SKIP"),
  };
}

export function generateComparisonTable(metrics: SeriesMetrics[]): string {
  const lines: string[] = [];
  const ts = new Date().toISOString();

  lines.push("# Tier Comparison Report");
  lines.push(`\nGenerated: ${ts}\n`);

  // Summary table
  lines.push("## Summary\n");
  lines.push("| Series | Genre | Mode | Eps | Nodes | Edges | Comm | Gate | Blended | AI |");
  lines.push("|--------|-------|------|-----|-------|-------|------|------|---------|-----|");

  for (const m of metrics) {
    lines.push(
      `| ${m.series} | ${m.genre} | ${m.extractionMode} | ${m.episodes} | ` +
      `${m.nodes} | ${m.edges} | ${m.communities} | ` +
      `${m.gateScore}/100 | ${(m.blendedScore * 100).toFixed(1)}% | ${m.aiOverall}/10 |`
    );
  }

  // Check status table
  lines.push("\n## Check Status Counts\n");
  lines.push("| Series | PASS | WARN | FAIL | SKIP |");
  lines.push("|--------|------|------|------|------|");
  for (const m of metrics) {
    lines.push(`| ${m.series} | ${m.passCount} | ${m.warnCount} | ${m.failCount} | ${m.skipCount} |`);
  }

  // Quality breakdown
  lines.push("\n## Quality Breakdown (Tier 0 Programmatic)\n");
  const allDims = new Set<string>();
  for (const m of metrics) {
    for (const dim of Object.keys(m.breakdown)) allDims.add(dim);
  }

  const dimArr = [...allDims];
  lines.push(`| Dimension | ${metrics.map(m => m.series).join(" | ")} |`);
  lines.push(`|-----------|${metrics.map(() => "---").join("|")}|`);
  for (const dim of dimArr) {
    const vals = metrics.map(m => {
      const v = m.breakdown[dim];
      return v === null ? "N/A" : `${(v * 100).toFixed(0)}%`;
    });
    lines.push(`| ${dim} | ${vals.join(" | ")} |`);
  }

  // AI dimensions
  if (metrics.some(m => Object.keys(m.aiDimensions).length > 0)) {
    lines.push("\n## AI Quality Dimensions (Tier 1)\n");
    const allAiDims = new Set<string>();
    for (const m of metrics) {
      for (const dim of Object.keys(m.aiDimensions)) allAiDims.add(dim);
    }

    const aiDimArr = [...allAiDims];
    lines.push(`| Dimension | ${metrics.map(m => m.series).join(" | ")} |`);
    lines.push(`|-----------|${metrics.map(() => "---").join("|")}|`);
    for (const dim of aiDimArr) {
      const vals = metrics.map(m => {
        const v = m.aiDimensions[dim];
        return v === undefined ? "-" : `${v}/10`;
      });
      lines.push(`| ${dim} | ${vals.join(" | ")} |`);
    }
  }

  // Extraction mode comparison
  const modes = new Set(metrics.map(m => m.extractionMode));
  if (modes.size > 1) {
    lines.push("\n## Extraction Mode Comparison\n");
    for (const mode of modes) {
      const modeMetrics = metrics.filter(m => m.extractionMode === mode);
      const avgGate = modeMetrics.reduce((s, m) => s + m.gateScore, 0) / modeMetrics.length;
      const avgNodes = modeMetrics.reduce((s, m) => s + m.nodes, 0) / modeMetrics.length;
      const avgBlended = modeMetrics.reduce((s, m) => s + m.blendedScore, 0) / modeMetrics.length;
      lines.push(`**${mode}**: avg gate ${avgGate.toFixed(0)}/100, avg nodes ${avgNodes.toFixed(0)}, avg blended ${(avgBlended * 100).toFixed(1)}%`);
    }
  }

  return lines.join("\n");
}

// ─── CLI ───

if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    console.log(`graphify-tier-compare — Compare pipeline quality across series

Usage:
  bun run src/scripts/graphify-tier-compare.ts [options]

Options:
  --output <path>  Output path (default: test-corpus/tier-comparison.md)
  --json           Also output as JSON
`);
    process.exit(0);
  }

  const outputIdx = args.indexOf("--output");
  const defaultOutput = resolve(import.meta.dir, "..", "..", "test-corpus", "tier-comparison.md");
  const outputPath = outputIdx !== -1 && args[outputIdx + 1] ? args[outputIdx + 1] : defaultOutput;
  const wantJson = args.includes("--json");

  const scriptDir = import.meta.dir;
  const repoRoot = resolve(scriptDir, "..", "..", "..", "..");
  const projDir = join(repoRoot, "bun_remotion_proj");

  // Discover series with pipeline output
  const seriesDirs = existsSync(projDir)
    ? readdirSync(projDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .filter(d => existsSync(join(projDir, d.name, "storygraph_out", "gate.json")))
        .map(d => d.name)
    : [];

  if (seriesDirs.length === 0) {
    console.log("No series with pipeline output found.");
    process.exit(0);
  }

  console.log(`=== Tier Comparison ===`);
  console.log(`Series: ${seriesDirs.join(", ")}\n`);

  const metrics: SeriesMetrics[] = [];
  for (const series of seriesDirs) {
    const m = loadSeriesMetrics(projDir, series);
    if (m) {
      metrics.push(m);
      console.log(`${series}: gate ${m.gateScore}/100, blended ${(m.blendedScore * 100).toFixed(1)}%, ${m.nodes} nodes, ${m.communities} communities`);
    }
  }

  // Sort by blended score descending
  metrics.sort((a, b) => b.blendedScore - a.blendedScore);

  // Write report
  const report = generateComparisonTable(metrics);
  writeFileSync(outputPath, report, "utf-8");
  console.log(`\nReport: ${outputPath}`);

  if (wantJson) {
    const jsonPath = outputPath.replace(/\.md$/, ".json");
    const result: TierComparisonResult = {
      generated: new Date().toISOString(),
      series: metrics,
    };
    writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf-8");
    console.log(`JSON: ${jsonPath}`);
  }
}
