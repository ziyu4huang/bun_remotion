import { describe, it, expect } from "bun:test";
import {
  enrichEpisode,
  sceneNodeNameToManifestName,
  updateMergedGraph,
} from "../scripts/graphify-enrich";
import type { SceneEnrichment, VoiceManifestScene } from "../scripts/graphify-enrich";
import {
  detectFeatures,
  extractQualityOutcome,
  computeCorrelations,
  generateRecommendations,
  FEATURE_KEYS,
} from "../scripts/prompt-calibration";
import type { EpisodeRecord } from "../scripts/prompt-calibration";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

// ─── graphify-enrich tests ───

describe("sceneNodeNameToManifestName", () => {
  it("extracts scene name from node ID", () => {
    expect(sceneNodeNameToManifestName("ch1ep1_scene_TitleScene")).toBe("TitleScene");
    expect(sceneNodeNameToManifestName("ch2ep3_scene_ContentScene1")).toBe("ContentScene1");
  });

  it("returns full ID if no _scene_ separator", () => {
    expect(sceneNodeNameToManifestName("someNode")).toBe("someNode");
  });
});

describe("enrichEpisode", () => {
  it("enriches scenes with actual metrics from voice manifest", () => {
    const tmp = mkdtempSync(resolve(tmpdir(), "enrich-test-"));
    const audioDir = resolve(tmp, "audio");
    mkdirSync(audioDir, { recursive: true });

    const manifest: VoiceManifestScene[] = [
      {
        scene: "TitleScene",
        file: "01-title.wav",
        segments: [
          { character: "narrator", voice: "serena", text: "hello" },
          { character: "narrator", voice: "serena", text: "world" },
        ],
      },
      {
        scene: "ContentScene1",
        file: "02-content1.wav",
        segments: [
          { character: "zhoumo", voice: "uncle_fu", text: "line1" },
          { character: "examiner", voice: "serena", text: "line2" },
          { character: "zhoumo", voice: "uncle_fu", text: "line3" },
        ],
      },
    ];

    writeFileSync(resolve(audioDir, "voice-manifest.json"), JSON.stringify(manifest));
    writeFileSync(resolve(audioDir, "durations.json"), JSON.stringify([1500, 3000]));

    const merged = {
      nodes: [
        { id: "ch1ep1_scene_TitleScene", type: "scene", episode: "ch1ep1", label: "TitleScene" },
        { id: "ch1ep1_scene_ContentScene1", type: "scene", episode: "ch1ep1", label: "ContentScene1" },
      ],
      links: [],
    };

    const result = enrichEpisode("ch1ep1", tmp, merged);

    expect(result.matched).toBe(2);
    expect(result.unmatched).toBe(0);
    expect(result.totalDuration).toBe(4500);
    expect(result.enrichments).toHaveLength(2);

    const title = result.enrichments[0];
    expect(title.scene_name).toBe("TitleScene");
    expect(title.actual_dialog_lines).toBe(2);
    expect(title.actual_characters).toBe(1);
    expect(title.actual_duration_ms).toBe(1500);
    expect(title.actual_unique_voices).toBe(1);

    const content = result.enrichments[1];
    expect(content.actual_dialog_lines).toBe(3);
    expect(content.actual_characters).toBe(2);
    expect(content.actual_unique_voices).toBe(2);

    rmSync(tmp, { recursive: true });
  });

  it("handles missing audio files gracefully", () => {
    const tmp = mkdtempSync(resolve(tmpdir(), "enrich-test-"));
    const result = enrichEpisode("ch1ep1", tmp, null);
    expect(result.enrichments).toHaveLength(0);
    expect(result.matched).toBe(0);
    rmSync(tmp, { recursive: true });
  });

  it("reports unmatched scenes when KG has no corresponding node", () => {
    const tmp = mkdtempSync(resolve(tmpdir(), "enrich-test-"));
    const audioDir = resolve(tmp, "audio");
    mkdirSync(audioDir, { recursive: true });

    const manifest: VoiceManifestScene[] = [
      {
        scene: "UnknownScene",
        file: "01.wav",
        segments: [{ character: "narrator", voice: "serena", text: "hi" }],
      },
    ];

    writeFileSync(resolve(audioDir, "voice-manifest.json"), JSON.stringify(manifest));
    writeFileSync(resolve(audioDir, "durations.json"), JSON.stringify([800]));

    const result = enrichEpisode("ch1ep1", tmp, { nodes: [], links: [] });
    expect(result.unmatched).toBe(1);
    expect(result.matched).toBe(0);

    rmSync(tmp, { recursive: true });
  });
});

describe("updateMergedGraph", () => {
  it("updates scene node properties with enrichment data", () => {
    const merged = {
      nodes: [
        { id: "ch1ep1_scene_TitleScene", type: "scene", episode: "ch1ep1" },
      ],
      links: [],
    };

    const enrichments: SceneEnrichment[] = [
      {
        ep_id: "ch1ep1",
        scene_name: "TitleScene",
        scene_node_id: "ch1ep1_scene_TitleScene",
        predicted_dialog_lines: 3,
        actual_dialog_lines: 2,
        predicted_characters: 2,
        actual_characters: 1,
        actual_duration_ms: 1500,
        actual_unique_voices: 1,
        dialog_prediction_error: 0.333,
        char_prediction_error: 0.5,
      },
    ];

    const updated = updateMergedGraph("/tmp/out", merged, enrichments);
    expect(updated).toBe(1);
    expect(merged.nodes[0].properties?.actual_dialog_lines).toBe("2");
    expect(merged.nodes[0].properties?.actual_duration_ms).toBe("1500");
  });

  it("skips enrichments for nodes not in graph", () => {
    const merged = { nodes: [], links: [] };
    const enrichments: SceneEnrichment[] = [
      {
        ep_id: "ch1ep1",
        scene_name: "TitleScene",
        scene_node_id: "ch1ep1_scene_TitleScene",
        predicted_dialog_lines: 0,
        actual_dialog_lines: 2,
        predicted_characters: 0,
        actual_characters: 1,
        actual_duration_ms: 1500,
        actual_unique_voices: 1,
        dialog_prediction_error: 1,
        char_prediction_error: 1,
      },
    ];

    expect(updateMergedGraph("/tmp/out", merged, enrichments)).toBe(0);
  });
});

// ─── prompt-calibration tests ───

describe("detectFeatures", () => {
  it("detects features from merged graph", () => {
    const merged = {
      nodes: [
        { id: "ch1ep1_plot", type: "episode_plot", episode: "ch1ep1" },
        { id: "ch1ep2_plot", type: "episode_plot", episode: "ch1ep2" },
        { id: "ch1ep1_gag1", type: "gag_manifestation", episode: "ch1ep1" },
        { id: "theme1", type: "theme" },
        { id: "tech1", type: "tech_term" },
        {
          id: "ch1ep1_scene1",
          type: "scene",
          episode: "ch1ep1",
          properties: { dialog_line_count: "5" },
        },
      ],
      links: [{ source: "a", target: "b", relation: "interacts_with" }],
    };

    const features = detectFeatures("/tmp/out", "ch1ep2", merged);

    expect(features.prev_summary).toBe(true);
    expect(features.gag_evolution).toBe(true);
    expect(features.interaction_history).toBe(true);
    expect(features.pacing_profile).toBe(true);
    expect(features.thematic_clusters).toBe(true);
    expect(features.tech_terms).toBe(true);
  });

  it("returns false for first episode (no prev_summary)", () => {
    const merged = {
      nodes: [{ id: "ch1ep1_plot", type: "episode_plot", episode: "ch1ep1" }],
      links: [],
    };

    const features = detectFeatures("/tmp/out", "ch1ep1", merged);
    expect(features.prev_summary).toBe(false);
  });

  it("handles null merged graph", () => {
    const features = detectFeatures("/tmp/out", "ch1ep1", null);
    for (const key of FEATURE_KEYS) {
      expect(features[key]).toBe(false);
    }
  });

  it("reads foreshadowing from file", () => {
    const tmp = mkdtempSync(resolve(tmpdir(), "cal-test-"));
    writeFileSync(
      resolve(tmp, "foreshadow-output.json"),
      JSON.stringify({ planted: [{ id: "f1", label: "test" }], payoffs: [] })
    );

    const features = detectFeatures(tmp, "ch1ep1", { nodes: [], links: [] });
    expect(features.foreshadowing).toBe(true);

    rmSync(tmp, { recursive: true });
  });

  it("reads character constraints from enrichment data", () => {
    const tmp = mkdtempSync(resolve(tmpdir(), "cal-test-"));
    writeFileSync(
      resolve(tmp, "check-enrichment-input.json"),
      JSON.stringify({ characterComparisons: [{ id: "zhoumo" }] })
    );

    const features = detectFeatures(tmp, "ch1ep1", { nodes: [], links: [] });
    expect(features.character_constraints).toBe(true);

    rmSync(tmp, { recursive: true });
  });
});

describe("extractQualityOutcome", () => {
  it("reads gate.json and kg-quality-score.json", () => {
    const tmp = mkdtempSync(resolve(tmpdir(), "cal-test-"));

    writeFileSync(
      resolve(tmp, "gate.json"),
      JSON.stringify({
        score: 85,
        decision: "PASS",
        quality_breakdown: {
          consistency: 0.9,
          pacing: 0.8,
          arc_structure: null,
          character_growth: 0.7,
          thematic_coherence: 0.85,
          gag_evolution: null,
        },
      })
    );
    writeFileSync(
      resolve(tmp, "kg-quality-score.json"),
      JSON.stringify({
        ai: { overall: 7.5 },
        blended: { overall: 0.65 },
      })
    );

    const outcome = extractQualityOutcome(tmp, "ch1ep1");
    expect(outcome.gate_score).toBe(85);
    expect(outcome.gate_decision).toBe("PASS");
    expect(outcome.consistency).toBe(0.9);
    expect(outcome.ai_overall).toBe(7.5);
    expect(outcome.blended_overall).toBe(0.65);

    rmSync(tmp, { recursive: true });
  });

  it("returns defaults when files missing", () => {
    const tmp = mkdtempSync(resolve(tmpdir(), "cal-test-"));
    const outcome = extractQualityOutcome(tmp, "ch1ep1");
    expect(outcome.gate_score).toBe(0);
    expect(outcome.gate_decision).toBe("UNKNOWN");
    expect(outcome.ai_overall).toBeNull();
    rmSync(tmp, { recursive: true });
  });
});

describe("computeCorrelations", () => {
  it("computes section → score correlation", () => {
    const records: EpisodeRecord[] = [
      {
        ep_id: "ch1ep1",
        timestamp: new Date().toISOString(),
        features: {
          prev_summary: false,
          foreshadowing: true,
          character_constraints: true,
          gag_evolution: true,
          interaction_history: true,
          pacing_profile: true,
          thematic_clusters: true,
          tech_terms: true,
        },
        outcome: {
          gate_score: 90,
          gate_decision: "PASS",
          ai_overall: null,
          blended_overall: null,
          consistency: null,
          pacing: null,
          arc_structure: null,
          character_growth: null,
          thematic_coherence: null,
          gag_evolution: null,
        },
      },
      {
        ep_id: "ch1ep2",
        timestamp: new Date().toISOString(),
        features: {
          prev_summary: true,
          foreshadowing: true,
          character_constraints: false,
          gag_evolution: false,
          interaction_history: false,
          pacing_profile: false,
          thematic_clusters: false,
          tech_terms: false,
        },
        outcome: {
          gate_score: 60,
          gate_decision: "WARN",
          ai_overall: null,
          blended_overall: null,
          consistency: null,
          pacing: null,
          arc_structure: null,
          character_growth: null,
          thematic_coherence: null,
          gag_evolution: null,
        },
      },
    ];

    const corrs = computeCorrelations(records);

    expect(corrs).toHaveLength(FEATURE_KEYS.length);

    const prevSummary = corrs.find((c) => c.section === "prev_summary")!;
    expect(prevSummary.episodes_present).toBe(1);
    expect(prevSummary.episodes_absent).toBe(1);
    // Present: ch1ep2 (60), Absent: ch1ep1 (90)
    expect(prevSummary.score_delta).toBe(-30);

    const foreshadowing = corrs.find((c) => c.section === "foreshadowing")!;
    expect(foreshadowing.episodes_present).toBe(2);
    expect(foreshadowing.episodes_absent).toBe(0);
  });
});

describe("generateRecommendations", () => {
  it("flags strong positive correlations", () => {
    const corrs = [
      {
        section: "pacing_profile",
        episodes_present: 3,
        episodes_absent: 2,
        avg_score_when_present: 80,
        avg_score_when_absent: 50,
        score_delta: 30,
        sample_size: 5,
      },
    ];

    const recs = generateRecommendations(corrs);
    expect(recs).toHaveLength(1);
    expect(recs[0]).toContain("strong positive correlation");
  });

  it("flags strong negative correlations", () => {
    const corrs = [
      {
        section: "tech_terms",
        episodes_present: 3,
        episodes_absent: 2,
        avg_score_when_present: 40,
        avg_score_when_absent: 75,
        score_delta: -35,
        sample_size: 5,
      },
    ];

    const recs = generateRecommendations(corrs);
    expect(recs.some((r) => r.includes("negative correlation"))).toBe(true);
  });

  it("notes never-populated sections", () => {
    const corrs = FEATURE_KEYS.map((section) => ({
      section,
      episodes_present: 0,
      episodes_absent: 2,
      avg_score_when_present: 0,
      avg_score_when_absent: 50,
      score_delta: -50,
      sample_size: 2,
    }));

    const recs = generateRecommendations(corrs);
    expect(recs.some((r) => r.includes("Never populated"))).toBe(true);
  });

  it("suggests more data when no correlations found", () => {
    const corrs = FEATURE_KEYS.map((section) => ({
      section,
      episodes_present: 1,
      episodes_absent: 1,
      avg_score_when_present: 50,
      avg_score_when_absent: 50,
      score_delta: 0,
      sample_size: 2,
    }));

    const recs = generateRecommendations(corrs);
    expect(recs.some((r) => r.includes("No strong correlations"))).toBe(true);
  });
});
