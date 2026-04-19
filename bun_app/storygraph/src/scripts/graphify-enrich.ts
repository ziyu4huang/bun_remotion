/**
 * Post-render KG enrichment — Phase 32-B1.
 *
 * Reads actual scene durations from audio/voice-manifest.json + audio/durations.json,
 * compares with KG scene node predictions (dialog_line_count, character_count, effect_count),
 * and writes enrichment data back to the merged graph.
 *
 * Usage:
 *   bun run storygraph enrich <series-dir>
 *   bun run storygraph enrich <series-dir> --ep ch1ep1
 */

import { resolve, basename } from "node:path";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { loadMergedGraph } from "./kg-loaders";

// ─── Types ───

interface VoiceSegment {
  character: string;
  voice: string;
  text: string;
}

interface VoiceManifestScene {
  scene: string;
  file: string;
  segments: VoiceSegment[];
}

interface SceneEnrichment {
  ep_id: string;
  scene_name: string;
  scene_node_id: string;
  predicted_dialog_lines: number;
  actual_dialog_lines: number;
  predicted_characters: number;
  actual_characters: number;
  actual_duration_ms: number;
  actual_unique_voices: number;
  dialog_prediction_error: number;
  char_prediction_error: number;
}

interface EnrichReport {
  version: "1.0";
  timestamp: string;
  series: string;
  episodes_enriched: number;
  scenes_enriched: number;
  scenes_matched: number;
  scenes_unmatched: number;
  per_episode: Record<
    string,
    {
      scenes_total: number;
      scenes_matched: number;
      total_duration_ms: number;
      avg_dialog_error: number;
      avg_char_error: number;
    }
  >;
  enrichments: SceneEnrichment[];
}

// ─── Scene name matching ───

function sceneNodeNameToManifestName(sceneNodeId: string): string {
  // ch1ep1_scene_ContentScene1 → ContentScene1
  const parts = sceneNodeId.split("_scene_");
  return parts.length > 1 ? parts[1] : sceneNodeId;
}

// ─── Episode directory discovery ───

function discoverEpisodeDirs(
  seriesDir: string,
  pattern: RegExp
): Array<{ epId: string; dir: string }> {
  const results: Array<{ epId: string; dir: string }> = [];

  // Check series dir itself (chapter-based: series/ch1-ep1/)
  const entries = readdirSync(seriesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const match = entry.name.match(pattern);
    if (!match) continue;
    const epDir = resolve(seriesDir, entry.name);
    if (existsSync(resolve(epDir, "audio", "voice-manifest.json"))) {
      results.push({
        epId: `ch${match[1]}ep${match[2]}`,
        dir: epDir,
      });
    }
  }

  return results.sort((a, b) => a.epId.localeCompare(b.epId));
}

// ─── Enrichment logic ───

function enrichEpisode(
  epId: string,
  epDir: string,
  merged: ReturnType<typeof loadMergedGraph>
): {
  enrichments: SceneEnrichment[];
  matched: number;
  unmatched: number;
  totalDuration: number;
} {
  const manifestPath = resolve(epDir, "audio", "voice-manifest.json");
  const durationsPath = resolve(epDir, "audio", "durations.json");

  if (!existsSync(manifestPath) || !existsSync(durationsPath)) {
    return {
      enrichments: [],
      matched: 0,
      unmatched: 0,
      totalDuration: 0,
    };
  }

  const manifest: VoiceManifestScene[] = JSON.parse(
    readFileSync(manifestPath, "utf-8")
  );
  const durations: number[] = JSON.parse(
    readFileSync(durationsPath, "utf-8")
  );

  // Build KG scene node map for this episode
  const kgSceneNodes = new Map<string, { id: string; properties?: Record<string, string> }>();
  if (merged) {
    for (const node of merged.nodes) {
      if (node.type === "scene" && (node.episode === epId || node.id.startsWith(`${epId}_`))) {
        const manifestName = sceneNodeNameToManifestName(node.id);
        kgSceneNodes.set(manifestName, {
          id: node.id,
          properties: node.properties,
        });
      }
    }
  }

  const enrichments: SceneEnrichment[] = [];
  let matched = 0;
  let unmatched = 0;
  let totalDuration = 0;

  for (let i = 0; i < manifest.length; i++) {
    const scene = manifest[i];
    const duration = durations[i] ?? 0;
    totalDuration += duration;

    // Actual metrics from voice manifest
    const actualDialogLines = scene.segments.length;
    const uniqueChars = new Set(scene.segments.map((s) => s.character));
    const actualCharacters = uniqueChars.size;
    const uniqueVoices = new Set(scene.segments.map((s) => s.voice)).size;

    // Predicted metrics from KG
    const kgNode = kgSceneNodes.get(scene.scene);
    const predictedDialog = parseInt(
      kgNode?.properties?.dialog_line_count ?? "0",
      10
    );
    const predictedChars = parseInt(
      kgNode?.properties?.character_count ?? "0",
      10
    );

    if (kgNode) {
      matched++;
    } else {
      unmatched++;
    }

    enrichments.push({
      ep_id: epId,
      scene_name: scene.scene,
      scene_node_id: kgNode?.id ?? `${epId}_scene_${scene.scene}`,
      predicted_dialog_lines: predictedDialog,
      actual_dialog_lines: actualDialogLines,
      predicted_characters: predictedChars,
      actual_characters: actualCharacters,
      actual_duration_ms: duration,
      actual_unique_voices: uniqueVoices,
      dialog_prediction_error: predictedDialog > 0
        ? Math.abs(predictedDialog - actualDialogLines) / predictedDialog
        : actualDialogLines > 0
          ? 1
          : 0,
      char_prediction_error: predictedChars > 0
        ? Math.abs(predictedChars - actualCharacters) / predictedChars
        : actualCharacters > 0
          ? 1
          : 0,
    });
  }

  return { enrichments, matched, unmatched, totalDuration };
}

// ─── Update merged graph with enrichment data ───

function updateMergedGraph(
  outDir: string,
  merged: NonNullable<ReturnType<typeof loadMergedGraph>>,
  enrichments: SceneEnrichment[]
): number {
  let updated = 0;

  for (const e of enrichments) {
    const node = merged.nodes.find((n) => n.id === e.scene_node_id);
    if (!node) continue;

    if (!node.properties) node.properties = {};
    node.properties.actual_dialog_lines = String(e.actual_dialog_lines);
    node.properties.actual_characters = String(e.actual_characters);
    node.properties.actual_duration_ms = String(e.actual_duration_ms);
    node.properties.actual_unique_voices = String(e.actual_unique_voices);
    node.properties.dialog_prediction_error = e.dialog_prediction_error.toFixed(3);
    node.properties.char_prediction_error = e.char_prediction_error.toFixed(3);
    updated++;
  }

  return updated;
}

// ─── Exports (above CLI guard for test import) ───

export {
  enrichEpisode,
  updateMergedGraph,
  sceneNodeNameToManifestName,
  discoverEpisodeDirs,
};
export type {
  SceneEnrichment,
  EnrichReport,
  VoiceManifestScene,
  VoiceSegment,
};

// ─── CLI ───

if (import.meta.main) {
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help")) {
  console.log(`graphify-enrich — Post-render KG enrichment (Phase 32-B1)

Usage:
  bun run storygraph enrich <series-dir> [--ep <epId>]

Reads audio/voice-manifest.json + audio/durations.json from episode dirs,
compares actual scene metrics with KG predictions, updates merged-graph.json.

Options:
  --ep <epId>   Enrich single episode only (e.g., --ep ch1ep1)
`);
  process.exit(0);
}

const seriesDir = resolve(args[0]);
if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path.`);
  process.exit(1);
}

const singleEpIdx = args.indexOf("--ep");
const singleEp = singleEpIdx !== -1 ? args[singleEpIdx + 1] : null;

// Detect series
const seriesDirName = basename(seriesDir);
const episodePattern =
  seriesDirName === "weapon-forger"
    ? /^weapon-forger-ch(\d+)-ep(\d+)$/
    : seriesDirName === "my-core-is-boss"
      ? /^my-core-is-boss-ch(\d+)-ep(\d+)$/
      : seriesDirName === "galgame-meme-theater"
        ? /^galgame-meme-theater-ep(\d+)$/
        : seriesDirName === "xianxia-system-meme"
          ? /^xianxia-system-meme-ep(\d+)$/
          : /[-](?:ch)?(\d+)[-]?ep(\d+)$/;

const outDir = resolve(seriesDir, "storygraph_out");
const merged = loadMergedGraph(outDir);

let episodeDirs = discoverEpisodeDirs(seriesDir, episodePattern);

if (singleEp) {
  episodeDirs = episodeDirs.filter((e) => e.epId === singleEp);
  if (episodeDirs.length === 0) {
    console.error(`No episode directory found for ${singleEp}`);
    process.exit(1);
  }
}

if (episodeDirs.length === 0) {
  console.log("No episodes with audio data found.");
  process.exit(0);
}

console.log(`Enriching ${episodeDirs.length} episodes...`);

const allEnrichments: SceneEnrichment[] = [];
let totalMatched = 0;
let totalUnmatched = 0;
const perEpisode: EnrichReport["per_episode"] = {};

for (const { epId, dir } of episodeDirs) {
  const result = enrichEpisode(epId, dir, merged);
  allEnrichments.push(...result.enrichments);
  totalMatched += result.matched;
  totalUnmatched += result.unmatched;

  const dialogErrors = result.enrichments.map((e) => e.dialog_prediction_error);
  const charErrors = result.enrichments.map((e) => e.char_prediction_error);

  perEpisode[epId] = {
    scenes_total: result.enrichments.length,
    scenes_matched: result.matched,
    total_duration_ms: result.totalDuration,
    avg_dialog_error: dialogErrors.length > 0
      ? dialogErrors.reduce((a, b) => a + b, 0) / dialogErrors.length
      : 0,
    avg_char_error: charErrors.length > 0
      ? charErrors.reduce((a, b) => a + b, 0) / charErrors.length
      : 0,
  };
}

// Write enrichment report
const report: EnrichReport = {
  version: "1.0",
  timestamp: new Date().toISOString(),
  series: seriesDirName,
  episodes_enriched: episodeDirs.length,
  scenes_enriched: allEnrichments.length,
  scenes_matched: totalMatched,
  scenes_unmatched: totalUnmatched,
  per_episode: perEpisode,
  enrichments: allEnrichments,
};

const reportPath = resolve(outDir, "enrich-report.json");
writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Update merged graph if it exists
let nodesUpdated = 0;
if (merged) {
  nodesUpdated = updateMergedGraph(outDir, merged, allEnrichments);
  const mergedPath = resolve(outDir, "merged-graph.json");
  writeFileSync(mergedPath, JSON.stringify(merged, null, 2));
}

console.log(`\nDone! Enrichment report: ${reportPath}`);
console.log(
  `Episodes: ${episodeDirs.length}, Scenes: ${allEnrichments.length} (${totalMatched} matched, ${totalUnmatched} unmatched)`
);
console.log(`Merged graph nodes updated: ${nodesUpdated}`);

// Per-episode summary
for (const [epId, stats] of Object.entries(perEpisode)) {
  const durationSec = (stats.total_duration_ms / 1000).toFixed(1);
  console.log(
    `  ${epId}: ${stats.scenes_matched}/${stats.scenes_total} scenes, ${durationSec}s, dialog_error=${stats.avg_dialog_error.toFixed(2)}, char_error=${stats.avg_char_error.toFixed(2)}`
  );
}
} // end import.meta.main
