/**
 * GLM5 Model Benchmark — unified entry point.
 *
 * Runs both KG quality and agent coding benchmarks across GLM5 model variants.
 *
 * Usage:
 *   bun run src/bench/glm5-bench.ts <series-dir> [options]
 *
 * Options:
 *   --suite kg|agent|all   Which suite to run (default: all)
 *   --models m1,m2,m3      Models to benchmark (default: glm-5,glm-5-turbo,glm-5.1,glm-4.5-air)
 *   --runs N               Runs per model for KG suite (default: 1)
 *   --output <path>        Output report path (default: bench-report.md)
 */

import { resolve } from "node:path";
import { writeFileSync } from "node:fs";
import type { BenchmarkReport } from "./report.js";
import { generateReport } from "./report.js";
import { runKGSuite } from "./kg-suite.js";
import { runAgentSuite } from "./agent-suite.js";
import { getConfig } from "../config.js";

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`GLM5 Model Benchmark — compare GLM model variants

Usage:
  bun run src/bench/glm5-bench.ts <series-dir> [options]

Options:
  --suite kg|agent|all   Which suite to run (default: all)
  --models m1,m2,m3      Models to benchmark (default: glm-5,glm-5-turbo,glm-5.1,glm-4.5-air)
  --runs N               Runs per model for KG suite (default: 1)
  --output <path>        Output report path (default: bench-report.md)
`);
  process.exit(0);
}

// Parse args
const DEFAULT_MODELS = ["glm-5", "glm-5-turbo", "glm-5.1", "glm-4.5-air"];

const seriesDir = resolve(args[0]);
let suite: "kg" | "agent" | "all" = "all";
let models = DEFAULT_MODELS;
let runs = 1;
let outputPath = "bench-report.md";

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--suite" && args[i + 1]) {
    suite = args[i + 1] as "kg" | "agent" | "all";
    i++;
  } else if (args[i] === "--models" && args[i + 1]) {
    models = args[i + 1].split(",").map(m => m.trim());
    i++;
  } else if (args[i] === "--runs" && args[i + 1]) {
    runs = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === "--output" && args[i + 1]) {
    outputPath = args[i + 1];
    i++;
  }
}

// Resolve model names with zai/ prefix
const fullModels = models.map(m => m.includes("/") ? m : `zai/${m}`);

async function main() {
  const config = getConfig();

  console.log(`=== GLM5 Model Benchmark ===`);
  console.log(`Series: ${seriesDir}`);
  console.log(`Models: ${fullModels.join(", ")}`);
  console.log(`Suite:  ${suite}`);
  console.log(`Runs:   ${runs}`);
  console.log(`KG mode: ${config.benchMode}`);
  console.log(`Max tool calls: ${config.benchMaxToolCalls}`);
  console.log(``);

  const report: BenchmarkReport = {
    date: new Date().toISOString().split("T")[0],
    seriesDir,
    models: fullModels,
    kgResults: [],
    agentResults: [],
  };

  // --- Suite A: KG Quality ---
  if (suite === "kg" || suite === "all") {
    console.log(`\n--- Suite A: KG Quality ---`);
    report.kgResults = await runKGSuite({
      seriesDir,
      models: fullModels,
      runs,
      mode: config.benchMode,
      onProgress: (model, i, total) => {
        console.log(`  [${i + 1}/${total}] ${model}`);
      },
    });
  }

  // --- Suite B: Agent Coding ---
  if (suite === "agent" || suite === "all") {
    console.log(`\n--- Suite B: Agent Coding ---`);
    report.agentResults = await runAgentSuite({
      models: fullModels,
      maxToolCalls: config.benchMaxToolCalls,
      onProgress: (model, taskId, i, total) => {
        console.log(`  [${i}/${total}] ${model} / ${taskId}`);
      },
    });
  }

  // --- Generate report ---
  const markdown = generateReport(report);
  const absOutput = resolve(outputPath);
  writeFileSync(absOutput, markdown);
  console.log(`\nReport written to: ${absOutput}`);
}

main().catch(e => {
  console.error(`Benchmark failed: ${e}`);
  process.exit(1);
});
