/**
 * Prompt calibration — Phase 32-B2.
 *
 * Tracks which KG prompt features (sections of buildRemotionPrompt) correlate
 * with quality scores. Records section presence per episode, correlates with
 * gate.json + kg-quality-score.json, and outputs calibration data.
 *
 * Usage:
 *   bun run storygraph calibrate <series-dir>
 *   bun run storygraph calibrate <series-dir> --reset
 */

import { resolve, basename } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadMergedGraph } from "./kg-loaders";

// ─── Types ───

interface PromptFeaturePresence {
  prev_summary: boolean;
  foreshadowing: boolean;
  character_constraints: boolean;
  gag_evolution: boolean;
  interaction_history: boolean;
  pacing_profile: boolean;
  thematic_clusters: boolean;
  tech_terms: boolean;
}

interface QualityOutcome {
  gate_score: number;
  gate_decision: string;
  ai_overall: number | null;
  blended_overall: number | null;
  consistency: number | null;
  pacing: number | null;
  arc_structure: number | null;
  character_growth: number | null;
  thematic_coherence: number | null;
  gag_evolution: number | null;
}

interface EpisodeRecord {
  ep_id: string;
  timestamp: string;
  features: PromptFeaturePresence;
  outcome: QualityOutcome;
}

interface CalibrationData {
  version: "1.0";
  timestamp: string;
  series: string;
  total_records: number;
  records: EpisodeRecord[];
  correlation: SectionCorrelation[];
  recommendations: string[];
}

interface SectionCorrelation {
  section: string;
  episodes_present: number;
  episodes_absent: number;
  avg_score_when_present: number;
  avg_score_when_absent: number;
  score_delta: number;
  sample_size: number;
}

// ─── Feature detection ───

const FEATURE_KEYS: Array<keyof PromptFeaturePresence> = [
  "prev_summary",
  "foreshadowing",
  "character_constraints",
  "gag_evolution",
  "interaction_history",
  "pacing_profile",
  "thematic_clusters",
  "tech_terms",
];

function detectFeatures(
  outDir: string,
  epId: string,
  merged: ReturnType<typeof loadMergedGraph>
): PromptFeaturePresence {
  const features: PromptFeaturePresence = {
    prev_summary: false,
    foreshadowing: false,
    character_constraints: false,
    gag_evolution: false,
    interaction_history: false,
    pacing_profile: false,
    thematic_clusters: false,
    tech_terms: false,
  };

  if (!merged) return features;

  // prev_summary: previous episode exists in graph
  const epIds = new Set<string>();
  for (const n of merged.nodes) {
    if (n.type === "episode_plot" && n.episode) epIds.add(n.episode);
  }
  const epSortKey = (id: string): number => {
    const m = id.match(/ch(\d+)ep(\d+)/);
    return m ? parseInt(m[1]) * 100 + parseInt(m[2]) : 0;
  };
  const targetKey = epSortKey(epId);
  const hasPrev = [...epIds].some((id) => epSortKey(id) < targetKey);
  features.prev_summary = hasPrev;

  // foreshadowing: foreshadow-output.json exists with active items
  const foreshadowPath = resolve(outDir, "foreshadow-output.json");
  if (existsSync(foreshadowPath)) {
    try {
      const raw = JSON.parse(readFileSync(foreshadowPath, "utf-8"));
      const planted: any[] = Array.isArray(raw) ? raw : (raw.planted ?? []);
      features.foreshadowing = planted.length > 0;
    } catch {
      features.foreshadowing = false;
    }
  }

  // character_constraints: check-enrichment-input.json has character data
  const enrichPath = resolve(outDir, "check-enrichment-input.json");
  if (existsSync(enrichPath)) {
    try {
      const raw = JSON.parse(readFileSync(enrichPath, "utf-8"));
      const comparisons = raw?.characterComparisons;
      features.character_constraints =
        Array.isArray(comparisons) && comparisons.length > 0;
    } catch {
      features.character_constraints = false;
    }
  }

  // gag_evolution: gag_manifestation nodes in merged graph
  features.gag_evolution = merged.nodes.some(
    (n) => n.type === "gag_manifestation"
  );

  // interaction_history: interacts_with edges exist
  features.interaction_history = merged.links.some(
    (e) => e.relation === "interacts_with"
  );

  // pacing_profile: scene nodes with dialog_line_count > 0
  features.pacing_profile = merged.nodes.some(
    (n) =>
      n.type === "scene" &&
      parseInt(n.properties?.dialog_line_count ?? "0", 10) > 0
  );

  // thematic_clusters: theme nodes exist
  features.thematic_clusters = merged.nodes.some(
    (n) => n.type === "theme"
  );

  // tech_terms: tech_term nodes exist
  features.tech_terms = merged.nodes.some(
    (n) => n.type === "tech_term"
  );

  return features;
}

// ─── Quality outcome extraction ───

function extractQualityOutcome(
  outDir: string,
  epId: string
): QualityOutcome {
  const outcome: QualityOutcome = {
    gate_score: 0,
    gate_decision: "UNKNOWN",
    ai_overall: null,
    blended_overall: null,
    consistency: null,
    pacing: null,
    arc_structure: null,
    character_growth: null,
    thematic_coherence: null,
    gag_evolution: null,
  };

  // Read gate.json
  const gatePath = resolve(outDir, "gate.json");
  if (existsSync(gatePath)) {
    try {
      const gate = JSON.parse(readFileSync(gatePath, "utf-8"));
      outcome.gate_score = gate.score ?? 0;
      outcome.gate_decision = gate.decision ?? "UNKNOWN";
      if (gate.quality_breakdown) {
        outcome.consistency = gate.quality_breakdown.consistency ?? null;
        outcome.pacing = gate.quality_breakdown.pacing ?? null;
        outcome.arc_structure = gate.quality_breakdown.arc_structure ?? null;
        outcome.character_growth =
          gate.quality_breakdown.character_growth ?? null;
        outcome.thematic_coherence =
          gate.quality_breakdown.thematic_coherence ?? null;
        outcome.gag_evolution = gate.quality_breakdown.gag_evolution ?? null;
      }
    } catch {
      // keep defaults
    }
  }

  // Read kg-quality-score.json
  const scorePath = resolve(outDir, "kg-quality-score.json");
  if (existsSync(scorePath)) {
    try {
      const score = JSON.parse(readFileSync(scorePath, "utf-8"));
      outcome.ai_overall = score.ai?.overall ?? null;
      outcome.blended_overall = score.blended?.overall ?? null;
    } catch {
      // keep defaults
    }
  }

  return outcome;
}

// ─── Correlation computation ───

function computeCorrelations(
  records: EpisodeRecord[]
): SectionCorrelation[] {
  return FEATURE_KEYS.map((section) => {
    const present = records.filter((r) => r.features[section]);
    const absent = records.filter((r) => !r.features[section]);

    const avgPresent =
      present.length > 0
        ? present.reduce((s, r) => s + r.outcome.gate_score, 0) /
          present.length
        : 0;
    const avgAbsent =
      absent.length > 0
        ? absent.reduce((s, r) => s + r.outcome.gate_score, 0) /
          absent.length
        : 0;

    return {
      section,
      episodes_present: present.length,
      episodes_absent: absent.length,
      avg_score_when_present: Math.round(avgPresent * 100) / 100,
      avg_score_when_absent: Math.round(avgAbsent * 100) / 100,
      score_delta: Math.round((avgPresent - avgAbsent) * 100) / 100,
      sample_size: records.length,
    };
  });
}

function generateRecommendations(
  correlations: SectionCorrelation[]
): string[] {
  const recs: string[] = [];

  for (const c of correlations) {
    // Sections where presence correlates with higher quality
    if (c.score_delta > 10 && c.episodes_present >= 2) {
      recs.push(
        `${c.section}: strong positive correlation (+${c.score_delta}). Prioritize this section.`
      );
    }
    // Sections where absence correlates with higher quality (overfitting risk)
    if (c.score_delta < -10 && c.episodes_absent >= 2) {
      recs.push(
        `${c.section}: negative correlation (${c.score_delta}). May be over-constraining.`
      );
    }
  }

  // Sections never populated
  const neverPresent = correlations.filter((c) => c.episodes_present === 0);
  if (neverPresent.length > 0) {
    recs.push(
      `Never populated: ${neverPresent.map((c) => c.section).join(", ")}. Consider if these sections add value.`
    );
  }

  if (recs.length === 0) {
    recs.push("No strong correlations yet. Need more episode records.");
  }

  return recs;
}

// ─── Exports (above CLI guard for test import) ───

export {
  detectFeatures,
  extractQualityOutcome,
  computeCorrelations,
  generateRecommendations,
  FEATURE_KEYS,
};
export type {
  PromptFeaturePresence,
  QualityOutcome,
  EpisodeRecord,
  CalibrationData,
  SectionCorrelation,
};

// ─── CLI ───

if (import.meta.main) {
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help")) {
  console.log(`prompt-calibration — Track KG feature → quality correlation (Phase 32-B2)

Usage:
  bun run storygraph calibrate <series-dir> [--reset]

Reads enrichment data, gate.json, kg-quality-score.json, and merged graph
to correlate prompt section presence with quality outcomes.

Options:
  --reset   Clear existing calibration history
`);
  process.exit(0);
}

const seriesDir = resolve(args[0]);
if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path.`);
  process.exit(1);
}

const doReset = args.includes("--reset");
const seriesDirName = basename(seriesDir);
const outDir = resolve(seriesDir, "storygraph_out");

// Load existing calibration or start fresh
const calPath = resolve(outDir, "prompt-calibration.json");
let existing: EpisodeRecord[] = [];
if (!doReset && existsSync(calPath)) {
  try {
    const raw = JSON.parse(readFileSync(calPath, "utf-8"));
    existing = raw.records ?? [];
  } catch {
    existing = [];
  }
}

// Load merged graph
const merged = loadMergedGraph(outDir);
if (!merged) {
  console.error("No merged graph found. Run graphify-merge first.");
  process.exit(1);
}

// Discover episodes from merged graph
const epIds = new Set<string>();
for (const n of merged.nodes) {
  if (n.type === "episode_plot" && n.episode) epIds.add(n.episode);
}

console.log(`Calibrating ${epIds.size} episodes...`);

const newRecords: EpisodeRecord[] = [];
for (const epId of [...epIds].sort()) {
  const features = detectFeatures(outDir, epId, merged);
  const outcome = extractQualityOutcome(outDir, epId);

  const featureCount = FEATURE_KEYS.filter((k) => features[k]).length;
  console.log(
    `  ${epId}: ${featureCount}/${FEATURE_KEYS.length} features, gate=${outcome.gate_score}, decision=${outcome.gate_decision}`
  );

  newRecords.push({
    ep_id: epId,
    timestamp: new Date().toISOString(),
    features,
    outcome,
  });
}

// Merge with existing (keep latest per epId)
const merged_records = new Map<string, EpisodeRecord>();
for (const r of existing) merged_records.set(r.ep_id, r);
for (const r of newRecords) merged_records.set(r.ep_id, r);
const allRecords = [...merged_records.values()].sort((a, b) =>
  a.ep_id.localeCompare(b.ep_id)
);

// Compute correlations
const correlations = computeCorrelations(allRecords);
const recommendations = generateRecommendations(correlations);

const calibration: CalibrationData = {
  version: "1.0",
  timestamp: new Date().toISOString(),
  series: seriesDirName,
  total_records: allRecords.length,
  records: allRecords,
  correlation: correlations,
  recommendations,
};

writeFileSync(calPath, JSON.stringify(calibration, null, 2));

console.log(`\nDone! Calibration data: ${calPath}`);
console.log(`Records: ${allRecords.length} (${existing.length} existing + ${newRecords.length} new)`);
console.log(`\nCorrelations:`);
for (const c of correlations) {
  const indicator =
    c.score_delta > 0 ? "+" : "";
  console.log(
    `  ${c.section}: present=${c.episodes_present}, absent=${c.episodes_absent}, delta=${indicator}${c.score_delta}`
  );
}
console.log(`\nRecommendations:`);
for (const r of recommendations) {
  console.log(`  - ${r}`);
}
} // end import.meta.main
