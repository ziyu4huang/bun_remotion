/**
 * Full pipeline: episode → merge → html → check
 *
 * Runs the complete federated graph pipeline for a series:
 * 1. graphify-episode on each episode directory
 * 2. graphify-merge to combine with link edges
 * 3. gen-story-html for merged graph visualization
 * 4. graphify-check for consistency checking
 *
 * Usage:
 *   bun run src/scripts/graphify-pipeline.ts <series-dir>
 */

import { resolve } from "node:path";
import { readdirSync, existsSync, rmSync, unlinkSync, readFileSync } from "node:fs";
import { spawn } from "child_process";
import { discoverEpisodes } from "./series-config";
import { parseArgsForAI } from "../ai-client";

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
  --provider <name>   AI provider (default: zai)
  --model <name>      AI model (default: glm-4.7-flash)

Steps:
  1. graphify-episode on each episode
  2. graphify-merge to combine sub-graphs
  3. gen-story-html for merged visualization
  3.5. ai-crosslink-generator for AI cross-link discovery
  4. graphify-check for consistency
`);
  process.exit(0);
}

const aiConfig = parseArgsForAI(args);
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

console.log(`=== Federated Graph Pipeline ===`);
console.log(`Series: ${seriesDir}`);
if (aiConfig.mode === "ai" || aiConfig.mode === "hybrid") {
  console.log(`Mode: ${aiConfig.mode.toUpperCase()} (${aiConfig.provider}/${aiConfig.model})`);
}
console.log();

// Discover episode directories using series config
const discovered = discoverEpisodes(seriesDir);
const episodes = discovered.map(e => e.dirname);

// Step 0: Clean stale codebase-mode artifacts from prior runs
console.log(`Step 0: Cleaning stale artifacts...`);

// Remove GRAPH_REPORT.md from episode dirs (codebase-mode artifact)
for (const ep of episodes) {
  const reportPath = resolve(seriesDir, ep, "bun_graphify_out", "GRAPH_REPORT.md");
  if (existsSync(reportPath)) {
    unlinkSync(reportPath);
    console.log(`  Removed stale ${ep}/bun_graphify_out/GRAPH_REPORT.md`);
  }
}

// Remove series-level graph.json if it's codebase-mode (has "contains"/"calls" edges, not story edges)
const seriesGraphPath = resolve(seriesDir, "bun_graphify_out", "graph.json");
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

// Step 1: Process episodes

console.log(`Step 1: Processing ${episodes.length} episodes...`);

let step1Ok = true;
for (const ep of episodes) {
  const epDir = resolve(seriesDir, ep);
  console.log(`\n--- ${ep} ---`);

  try {
    const result = Bun.spawnSync([
      "bun", "run",
      resolve(scriptDir, "graphify-episode.ts"),
      epDir,
      "--series-dir", seriesDir,
      ...aiFlags,
    ], { stdio: ["inherit", "pipe", "pipe"] });

    if (result.stdout) {
      const output = new TextDecoder().decode(result.stdout);
      for (const line of output.split("\n")) {
        if (line.includes("Done!") || line.includes("Narrative extraction") || line.includes("Error")) {
          console.log(`  ${line}`);
        }
      }
    }

    if (result.exitCode !== 0) {
      console.log(`  ⚠ Episode ${ep} had issues (exit code ${result.exitCode})`);
      const stderr = result.stderr ? new TextDecoder().decode(result.stderr) : "";
      if (stderr) console.log(`  ${stderr.split("\n")[0]}`);
    }
  } catch (e) {
    console.log(`  ✗ Failed: ${e}`);
    step1Ok = false;
  }
}

// Step 1.5: Generate per-episode HTML

console.log(`\nStep 1.5: Generating per-episode HTML...`);

for (const ep of episodes) {
  const epDir = resolve(seriesDir, ep);
  try {
    const result = Bun.spawnSync([
      "bun", "run",
      resolve(scriptDir, "gen-story-html.ts"),
      epDir,
    ], { stdio: ["inherit", "pipe", "pipe"] });

    if (result.stdout) {
      const output = new TextDecoder().decode(result.stdout);
      for (const line of output.split("\n")) {
        if (line.includes("Wrote") || line.includes("Error")) {
          console.log(`  ${line}`);
        }
      }
    }
  } catch (e) {
    console.log(`  Per-episode HTML skipped for ${ep}: ${e}`);
  }
}

// Step 2: Merge
console.log(`\n\nStep 2: Merging sub-graphs...`);

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

// Step 2.5: Generate merged graph HTML
console.log(`\n\nStep 2.5: Generating merged graph HTML...`);

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

// Step 3: Check
console.log(`\n\nStep 3: Consistency checking...`);

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

// Step 3.5: AI Cross-Link Discovery
console.log(`\n\nStep 3.5: AI Cross-Link Discovery...`);

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
  const mergedPath = resolve(seriesDir, "bun_graphify_out", "merged-graph.json");
  if (existsSync(mergedPath)) {
    const mergedData = JSON.parse(readFileSync(mergedPath, "utf-8"));
    if (mergedData.cross_links && mergedData.cross_links.length > 0) {
      console.log(`  Re-generating HTML with ${mergedData.cross_links.length} AI cross-links...`);
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
console.log(`Output: ${resolve(seriesDir, "bun_graphify_out")}/`);
