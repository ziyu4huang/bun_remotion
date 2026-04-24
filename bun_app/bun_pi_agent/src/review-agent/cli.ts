/**
 * Phase 43: Review Agent CLI.
 *
 * Standalone quality review agent using GLM5-turbo.
 * Reads pipeline output + narration, produces structured quality-review.json.
 *
 * Usage:
 *   bun bun_app/bun_pi_agent/src/review-agent/cli.ts <series-dir> [options]
 *
 * Options:
 *   --model <name>       Model name (default: glm-5-turbo)
 *   --provider <name>    Provider (default: zai)
 *   --json               Output raw JSON to stdout
 *   --help               Show help
 */

import { resolve, basename } from "node:path";
import { writeFileSync } from "node:fs";
import { callAI } from "./ai-call";
import { loadReviewInputs, buildReviewPrompt } from "./review-prompt";
import { parseReviewResponse } from "./review-parser";
import type { ReviewResult, ReviewMeta } from "./types";

// ─── CLI arg parsing ───

function parseCliArgs(args: string[]) {
  let seriesDir = "";
  let model = "glm-5-turbo";
  let provider = "zai";
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--model" && args[i + 1]) {
      model = args[++i];
    } else if (args[i] === "--provider" && args[i + 1]) {
      provider = args[++i];
    } else if (args[i] === "--json") {
      jsonOutput = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      printHelp();
      process.exit(0);
    } else if (!args[i].startsWith("-") && !seriesDir) {
      seriesDir = args[i];
    }
  }

  if (!seriesDir) {
    console.error("Error: <series-dir> is required.\n");
    printHelp();
    process.exit(1);
  }

  return { seriesDir: resolve(seriesDir), model, provider, jsonOutput };
}

function printHelp() {
  console.log(`review-agent — GLM5-turbo quality review (Phase 43)

Usage:
  bun bun_app/bun_pi_agent/src/review-agent/cli.ts <series-dir> [options]

Options:
  --model <name>       Model name (default: glm-5-turbo)
  --provider <name>    Provider (default: zai)
  --json               Output raw JSON to stdout
  --help               Show this help

Reads:  gate.json, kg-quality-score.json, merged-graph.json, narration.ts
Writes: storygraph_out/quality-review.json (version 2.0)

Example:
  bun run review-agent bun_remotion_proj/weapon-forger
`);
}

// ─── Main ───

async function main() {
  const { seriesDir, model, provider, jsonOutput } = parseCliArgs(process.argv.slice(2));

  console.error(`Loading review inputs from ${seriesDir}...`);

  const data = loadReviewInputs(seriesDir);

  console.error(`  Series: ${data.seriesName}, Genre: ${data.genre}`);
  console.error(`  Gate: ${data.gate.score}/100 (${data.gate.decision})`);
  console.error(`  Graph: ${data.graphStats.node_count} nodes, ${data.graphStats.edge_count} edges`);
  console.error(`  Narrations: ${data.narrationExcerpts.length} episodes`);

  const prompt = buildReviewPrompt(data);

  console.error(`\nCalling ${provider}/${model}...`);
  const aiResult = await callAI(prompt, { provider, model });

  if (!aiResult) {
    console.error("AI call returned null. Check API key and model availability.");
    process.exit(1);
  }

  const parsed = parseReviewResponse(aiResult);
  if (!parsed) {
    console.error("Failed to parse AI review response.");
    console.error("Raw response:");
    console.error(aiResult.slice(0, 500));
    process.exit(1);
  }

  // Fill metadata
  const meta: ReviewMeta = {
    version: "2.0",
    timestamp: new Date().toISOString(),
    series: data.seriesName,
    genre: data.genre,
    model: `${provider}/${model}`,
    input_gate_score: data.gate.score,
    input_quality_score: data.blendedScore,
    input_node_count: data.graphStats.node_count,
    input_edge_count: data.graphStats.edge_count,
    episodes_reviewed: data.narrationExcerpts.length,
  };

  const result: ReviewResult = { ...parsed, _meta: meta };

  // Write output
  const outPath = resolve(seriesDir, "storygraph_out", "quality-review.json");
  writeFileSync(outPath, JSON.stringify(result, null, 2));

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.error(`\nReview: ${result.decision} (${result.overall}/10)`);
    console.error(`  Dimensions:`);
    for (const [k, v] of Object.entries(result.dimensions)) {
      console.error(`    ${k}: ${v}`);
    }
    console.error(`  Strengths: ${result.strengths.length}`);
    console.error(`  Weaknesses: ${result.weaknesses.length}`);
    console.error(`  Fix suggestions: ${result.fix_suggestions.length}`);
    console.error(`  Summary: ${result.summary_zhTW.slice(0, 100)}...`);
    console.error(`\nOutput: ${outPath}`);
  }
}

if (import.meta.main) {
  main().catch(err => {
    console.error(`Fatal: ${err.message}`);
    process.exit(1);
  });
}
