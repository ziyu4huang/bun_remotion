/**
 * Full pipeline: episode → per-ep HTML → merge → merged HTML → check → crosslink → final HTML
 *
 * Runs the complete federated graph pipeline for a series:
 * 1. Clean stale artifacts
 * 2. graphify-episode on each episode directory
 * 3. gen-story-html for per-episode visualization
 * 4. graphify-merge to combine with link edges
 * 5. gen-story-html for merged graph visualization
 * 6. graphify-check for consistency checking
 * 7. ai-crosslink-generator for cross-link discovery + final HTML
 *
 * Usage:
 *   bun run src/scripts/graphify-pipeline.ts <series-dir>
 */

import { resolve } from "node:path";
import { existsSync, unlinkSync, readFileSync } from "node:fs";
import { spawn } from "child_process";
import { discoverEpisodes } from "./series-config";
import { parseArgsForAI } from "../ai-client";
import { isUpToDate } from "./incremental";

function spawnAsync(cmd: string, args: string[]): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  return new Promise((res) => {
    const proc = spawn(cmd, args, { stdio: ["inherit", "pipe", "pipe"] });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    proc.stdout?.on("data", (d: Buffer) => out.push(d));
    proc.stderr?.on("data", (d: Buffer) => err.push(d));
    proc.on("close", (code) => res({ exitCode: code, stdout: Buffer.concat(out).toString(), stderr: Buffer.concat(err).toString() }));
    proc.on("error", (e) => res({ exitCode: 1, stdout: "", stderr: e.message }));
  });
}

function filterOutput(text: string, keywords: string[]): string {
  return text.split("\n").filter(l => keywords.some(k => l.includes(k))).map(l => `  ${l}`).join("\n");
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`graphify-pipeline — Run full federated graph pipeline

Usage:
  bun run src/scripts/graphify-pipeline.ts <series-dir> [options]

Options:
  --mode regex|ai|hybrid Extraction mode (default: hybrid)
                      ai: use LLM for extraction + enrichment (requires API key)
                      regex: fast pattern-based extraction only
                      hybrid: regex first, then AI supplements exclusive types (default)
  --incremental       Skip episodes where narration.ts hasn't changed since last extraction
  --feedback          Enable enrichment feedback loop (uses previous gate.json to improve AI extraction)
  --provider <name>   AI provider (default: zai)
  --model <name>      AI model (default: glm-4.7-flash)

Steps:
  1. Clean stale artifacts
  2. graphify-episode on each episode
  3. gen-story-html per-episode visualization
  4. graphify-merge sub-graphs + link edges
  5. gen-story-html merged visualization
  6. graphify-check consistency report
  7. Cross-link discovery + final HTML
`);
  process.exit(0);
}

const aiConfig = parseArgsForAI(args);
const incremental = args.includes("--incremental");
const feedback = args.includes("--feedback");
const seriesDir = resolve(args[0]);
if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path. Use absolute paths.`);
  process.exit(1);
}
const scriptDir = resolve(import.meta.dir);

// Build AI flags to pass to subprocesses
const aiFlags: string[] = [];
if (aiConfig.mode === "ai" || aiConfig.mode === "hybrid") {
  aiFlags.push("--mode", aiConfig.mode, "--provider", aiConfig.provider, "--model", aiConfig.model);
}
if (feedback) aiFlags.push("--feedback");

console.log(`=== Federated Graph Pipeline ===`);
console.log(`Series: ${seriesDir}`);
if (aiConfig.mode === "ai" || aiConfig.mode === "hybrid") {
  console.log(`Mode: ${aiConfig.mode.toUpperCase()} (${aiConfig.provider}/${aiConfig.model})`);
}
console.log();

// Discover episode directories using series config
const discovered = discoverEpisodes(seriesDir);
const episodes = discovered.map(e => e.dirname);

// ── Step 1: Clean stale codebase-mode artifacts ──

console.log(`Step 1: Cleaning stale artifacts...`);

for (const ep of episodes) {
  const reportPath = resolve(seriesDir, ep, "storygraph_out", "GRAPH_REPORT.md");
  if (existsSync(reportPath)) {
    unlinkSync(reportPath);
    console.log(`  Removed stale ${ep}/storygraph_out/GRAPH_REPORT.md`);
  }
}

const seriesGraphPath = resolve(seriesDir, "storygraph_out", "graph.json");
if (existsSync(seriesGraphPath)) {
  try {
    const content = require(seriesGraphPath);
    if (content.links?.[0]?.relation === "contains" || content.links?.[0]?.relation === "calls") {
      unlinkSync(seriesGraphPath);
      console.log(`  Removed stale series-level graph.json (codebase mode)`);
    }
  } catch { /* not JSON or can't read — leave it */ }
}

console.log(``);

// ── Step 2: Process episodes (parallel) ──

const skipped = incremental ? episodes.filter(ep => isUpToDate(resolve(seriesDir, ep))) : [];
const toProcess = episodes.filter(ep => !skipped.includes(ep));

console.log(`Step 2: Processing ${toProcess.length} episodes${incremental ? ` (${skipped.length} skipped)` : ""}...`);

const step2Start = Date.now();
const step2Results = await Promise.all(
  toProcess.map(async (ep) => {
    const epDir = resolve(seriesDir, ep);
    const result = await spawnAsync("bun", [
      "run", resolve(scriptDir, "graphify-episode.ts"),
      epDir, "--series-dir", seriesDir, ...aiFlags,
    ]);
    return { ep, ...result };
  })
);

for (const r of step2Results) {
  console.log(`\n--- ${r.ep} ---`);
  if (r.stdout) console.log(filterOutput(r.stdout, ["Done!", "Narrative extraction", "Error"]));
  if (r.exitCode !== 0) {
    console.log(`  ⚠ Episode ${r.ep} had issues (exit code ${r.exitCode})`);
    if (r.stderr) console.log(`  ${r.stderr.split("\n")[0]}`);
  }
}
console.log(`  Step 2 done in ${((Date.now() - step2Start) / 1000).toFixed(1)}s (${toProcess.length} episodes parallel)`);

// ── Step 3: Per-episode HTML (parallel) ──

console.log(`\nStep 3: Generating per-episode HTML for ${toProcess.length} episodes...`);

const step3Results = await Promise.all(
  toProcess.map(async (ep) => {
    const epDir = resolve(seriesDir, ep);
    const result = await spawnAsync("bun", [
      "run", resolve(scriptDir, "gen-story-html.ts"), epDir,
    ]);
    return { ep, ...result };
  })
);

for (const r of step3Results) {
  if (r.stdout) {
    const filtered = filterOutput(r.stdout, ["Wrote", "Error"]);
    if (filtered) console.log(`  ${r.ep}: ${filtered.trim()}`);
  }
}

// ── Step 4: Merge ──

console.log(`\n\nStep 4: Merging sub-graphs...`);

try {
  const result = Bun.spawnSync([
    "bun", "run",
    resolve(scriptDir, "graphify-merge.ts"),
    seriesDir,
  ], { stdio: ["inherit", "pipe", "pipe"] });

  if (result.stdout) {
    const output = new TextDecoder().decode(result.stdout);
    for (const line of output.split("\n")) {
      if (line.includes("Done!") || line.includes("Link edges") || line.includes("Communities") || line.includes("Merged graph")) {
        console.log(`  ${line}`);
      }
    }
  }
} catch (e) {
  console.log(`  ✗ Merge failed: ${e}`);
  process.exit(1);
}

// ── Step 5: Merged graph HTML ──

console.log(`\n\nStep 5: Generating merged graph HTML...`);

try {
  const result = Bun.spawnSync([
    "bun", "run",
    resolve(scriptDir, "gen-story-html.ts"),
    seriesDir,
  ], { stdio: ["inherit", "pipe", "pipe"] });

  if (result.stdout) {
    const output = new TextDecoder().decode(result.stdout);
    for (const line of output.split("\n")) {
      if (line.includes("Wrote") || line.includes("nodes") || line.includes("Error")) {
        console.log(`  ${line}`);
      }
    }
  }
} catch (e) {
  console.log(`  ✗ HTML generation failed: ${e}`);
}

// ── Step 6: Consistency check ──

console.log(`\n\nStep 6: Consistency checking...`);

try {
  const result = Bun.spawnSync([
    "bun", "run",
    resolve(scriptDir, "graphify-check.ts"),
    seriesDir,
    ...aiFlags,
  ], { stdio: ["inherit", "pipe", "pipe"] });

  if (result.stdout) {
    const output = new TextDecoder().decode(result.stdout);
    for (const line of output.split("\n")) {
      if (line.includes("PASS") || line.includes("WARN") || line.includes("FAIL") || line.includes("Results") || line.includes("Report")) {
        console.log(`  ${line}`);
      }
    }
  }
} catch (e) {
  console.log(`  ✗ Check failed: ${e}`);
}

// ── Step 7: Cross-link discovery + final HTML ──

console.log(`\n\nStep 7: Cross-link discovery...`);

try {
  const crosslinkResult = Bun.spawnSync([
    "bun", "run",
    resolve(scriptDir, "ai-crosslink-generator.ts"),
    seriesDir,
    ...aiFlags,
  ], { stdio: ["inherit", "pipe", "pipe"] });

  if (crosslinkResult.stdout) {
    const output = new TextDecoder().decode(crosslinkResult.stdout);
    for (const line of output.split("\n")) {
      if (line.includes("cross-link") || line.includes("Cross-link") || line.includes("Error") || line.includes("Wrote") || line.includes("subagent") || line.includes("Done") || line.includes("Patched")) {
        console.log(`  ${line}`);
      }
    }
  }

  // If cross-links were added, re-run HTML generation to include them
  const mergedPath = resolve(seriesDir, "storygraph_out", "merged-graph.json");
  if (existsSync(mergedPath)) {
    const mergedData = JSON.parse(readFileSync(mergedPath, "utf-8"));
    if (mergedData.cross_links && mergedData.cross_links.length > 0) {
      console.log(`  Re-generating HTML with ${mergedData.cross_links.length} cross-links...`);
      const htmlResult = Bun.spawnSync([
        "bun", "run",
        resolve(scriptDir, "gen-story-html.ts"),
        seriesDir,
      ], { stdio: ["inherit", "pipe", "pipe"] });

      if (htmlResult.stdout) {
        const htmlOutput = new TextDecoder().decode(htmlResult.stdout);
        for (const line of htmlOutput.split("\n")) {
          if (line.includes("Wrote") || line.includes("Error")) {
            console.log(`  ${line}`);
          }
        }
      }
    }
  }
} catch (e) {
  console.log(`  Cross-link discovery skipped: ${e}`);
}

console.log(`\n=== Pipeline complete ===`);
if (incremental && skipped.length > 0) {
  console.log(`${episodes.length - skipped.length} processed, ${skipped.length} skipped (incremental)`);
}
console.log(`Output: ${resolve(seriesDir, "storygraph_out")}/`);
