/**
 * Generate a story-writing constraint prompt from the existing knowledge graph.
 *
 * Reads merged graph + consistency data + story files and outputs a structured
 * generation prompt that constrains story writing for a target episode.
 * This closes the feedback loop: KG → generation prompt → story → KG extraction.
 *
 * Now uses buildRemotionPrompt() from subagent-prompt.ts (Phase 32-A1).
 *
 * Usage:
 *   bun run storygraph gen-prompt <series-dir> --target-ep ch<N>ep<M>
 *
 * Example:
 *   bun run storygraph gen-prompt bun_remotion_proj/weapon-forger --target-ep ch2ep1
 */

import { resolve, dirname } from "node:path";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { getSeriesConfigOrThrow } from "./series-config";
import type { SeriesConfig } from "./series-config";
import {
  loadMergedGraph,
  loadPreviousEpisodeSummary,
  loadActiveForeshadowing,
  loadPacingProfile,
  loadThematicCoherence,
  loadCharacterConstraints,
  loadGagEvolution,
  loadInteractionPatterns,
  loadTechTermUsage,
} from "./kg-loaders";
import { buildRemotionPrompt } from "./subagent-prompt";

// ─── Args ───

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`graphify-gen-prompt — Generate story-writing constraint prompt from KG

Usage:
  bun run storygraph gen-prompt <series-dir> --target-ep <epId>

Options:
  --target-ep <epId>   Target episode ID (e.g., ch2ep1). Required.

Reads merged-graph.json, check-enrichment-input.json, foreshadow-output.json,
and previous episode narration.ts.
Outputs generation-prompt-<epId>.md in the series storygraph_out/ directory.
`);
  process.exit(0);
}

const seriesDir = resolve(args[0]);

const targetEpIdx = args.indexOf("--target-ep");
if (targetEpIdx === -1 || !args[targetEpIdx + 1]) {
  console.error("Error: --target-ep <epId> is required (e.g., --target-ep ch2ep1)");
  process.exit(1);
}
const TARGET_EP = args[targetEpIdx + 1];

// P0: Absolute path validation
if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path. Use absolute paths.`);
  process.exit(1);
}

const config: SeriesConfig = getSeriesConfigOrThrow(seriesDir);
const outDir = resolve(seriesDir, "storygraph_out");
const outputPath = resolve(outDir, `generation-prompt-${TARGET_EP}.md`);

console.log(`Series: ${config.displayName} (${seriesDir})`);
console.log(`Target: ${TARGET_EP}`);
console.log(`Output: ${outputPath}`);

// ─── Load merged graph ───

const merged = loadMergedGraph(outDir);
if (!merged) {
  console.error(`No merged graph found at ${outDir}/merged-graph.json`);
  console.error("Run graphify-merge first.");
  process.exit(1);
}

// ─── Extract target episode characters from plot-arcs ───

function extractTargetCharacters(): string[] {
  const plotArcsPath = resolve(seriesDir, "assets", "story", "plot-arcs.md");
  const plotArcs = existsSync(plotArcsPath) ? readFileSync(plotArcsPath, "utf-8") : "";

  if (!plotArcs) return [];

  const epMatch = TARGET_EP.match(/ch(\d+)ep(\d+)/);
  if (!epMatch) return [];

  const charLine = plotArcs.match(/\*\*角色[：:]\*\*\s*(.+?)\n/i);
  if (charLine) {
    const charNames = charLine[1].split(/[,，、]/).map(c => c.trim()).filter(Boolean);
    return charNames.map(name => {
      for (const [id, display] of Object.entries(config.charNames)) {
        if (display === name || name.includes(display)) return id;
      }
      return name.toLowerCase();
    });
  }

  return [];
}

// ─── Gather all data via kg-loaders ───

const prevSummary = loadPreviousEpisodeSummary(merged, TARGET_EP);
const foreshadows = loadActiveForeshadowing(outDir);
const pacingProfile = prevSummary
  ? loadPacingProfile(merged, prevSummary.ep_id)
  : [];
const themes = loadThematicCoherence(merged);
const charConstraints = loadCharacterConstraints(outDir);
const gagEvolution = loadGagEvolution(merged);
const targetChars = extractTargetCharacters();
const interactions = loadInteractionPatterns(merged, targetChars, config.charNames);
const techTerms = loadTechTermUsage(merged);

// ─── Build and write prompt ───

const prompt = buildRemotionPrompt({
  series_name: config.displayName,
  target_ep: TARGET_EP,
  prev_episode_summary: prevSummary,
  active_foreshadowing: foreshadows,
  pacing_profile: pacingProfile,
  thematic_clusters: themes,
  character_constraints: charConstraints,
  tech_terms_used: techTerms,
  gag_evolution: gagEvolution,
  interaction_history: interactions,
});

writeFileSync(outputPath, prompt);

console.log(`\nDone! Generation prompt written to: ${outputPath}`);
console.log(`Size: ${prompt.length} bytes`);
console.log(`Sections: prev_summary=${prevSummary ? "✓" : "✗"} foreshadowing=${foreshadows.length} chars=${charConstraints.length} gags=${gagEvolution.length} interactions=${interactions.length} pacing=${pacingProfile.length} themes=${themes.length} tech_terms=${techTerms.length}`);
