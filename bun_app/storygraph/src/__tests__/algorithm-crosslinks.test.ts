import { describe, it, expect } from "bun:test";
import { generateAlgorithmCrossLinks, normalizePageRankByType, computePlotArcScore } from "../scripts/story-algorithms";
import type { AlgorithmCrossLinkParams } from "../scripts/story-algorithms";

function makeParams(overrides: Partial<AlgorithmCrossLinkParams> = {}): AlgorithmCrossLinkParams {
  return {
    nodes: [],
    links: [],
    linkEdges: [],
    pageRankScores: {},
    similarityMatrix: {},
    episodes: [],
    ...overrides,
  };
}

describe("generateAlgorithmCrossLinks", () => {
  it("returns empty array for empty graph", () => {
    const result = generateAlgorithmCrossLinks(makeParams());
    expect(result).toEqual([]);
  });

  it("generates story_anti_pattern from high Jaccard similarity", () => {
    const params = makeParams({
      episodes: ["ch1ep1", "ch1ep2"],
      nodes: [
        { id: "ch1ep1_plot", type: "episode_plot", episode: "ch1ep1" },
        { id: "ch1ep2_plot", type: "episode_plot", episode: "ch1ep2" },
      ],
      similarityMatrix: {
        ch1ep1: { ch1ep1: 1, ch1ep2: 0.75 },
        ch1ep2: { ch1ep1: 0.75, ch1ep2: 1 },
      },
    });

    const result = generateAlgorithmCrossLinks(params);
    expect(result.length).toBe(1);
    expect(result[0].link_type).toBe("story_anti_pattern");
    expect(result[0].from).toBe("ch1ep1_plot");
    expect(result[0].to).toBe("ch1ep2_plot");
    expect(result[0].confidence).toBeCloseTo(0.75);
    expect(result[0].generated_by).toBe("algorithm");
  });

  it("skips story_anti_pattern when Jaccard is below threshold", () => {
    const params = makeParams({
      episodes: ["ch1ep1", "ch1ep2"],
      nodes: [
        { id: "ch1ep1_plot", type: "episode_plot", episode: "ch1ep1" },
        { id: "ch1ep2_plot", type: "episode_plot", episode: "ch1ep2" },
      ],
      similarityMatrix: {
        ch1ep1: { ch1ep1: 1, ch1ep2: 0.3 },
        ch1ep2: { ch1ep1: 0.3, ch1ep2: 1 },
      },
    });

    const result = generateAlgorithmCrossLinks(params);
    expect(result.length).toBe(0);
  });

  it("generates character_theme_affinity for high-PageRank characters across episodes", () => {
    const params = makeParams({
      episodes: ["ch1ep1", "ch1ep2"],
      nodes: [
        { id: "ch1ep1_char_zhoumo", type: "character_instance", label: "zhoumo", episode: "ch1ep1" },
        { id: "ch1ep2_char_zhoumo", type: "character_instance", label: "zhoumo", episode: "ch1ep2" },
        { id: "ch1ep1_char_minor", type: "character_instance", label: "minor", episode: "ch1ep1" },
        { id: "ch1ep2_char_minor", type: "character_instance", label: "minor", episode: "ch1ep2" },
      ],
      pageRankScores: {
        ch1ep1_char_zhoumo: 0.05,
        ch1ep2_char_zhoumo: 0.06,
        ch1ep1_char_minor: 0.001,
        ch1ep2_char_minor: 0.002,
      },
    });

    const result = generateAlgorithmCrossLinks(params);
    const affinities = result.filter((cl) => cl.link_type === "character_theme_affinity");
    expect(affinities.length).toBe(1);
    expect(affinities[0].from).toBe("ch1ep1_char_zhoumo");
    expect(affinities[0].to).toBe("ch1ep2_char_zhoumo");
  });

  it("skips character_theme_affinity when character appears in only 1 episode", () => {
    const params = makeParams({
      episodes: ["ch1ep1"],
      nodes: [
        { id: "ch1ep1_char_zhoumo", type: "character_instance", label: "zhoumo", episode: "ch1ep1" },
      ],
      pageRankScores: { ch1ep1_char_zhoumo: 0.1 },
    });

    const result = generateAlgorithmCrossLinks(params);
    expect(result.every((cl) => cl.link_type !== "character_theme_affinity")).toBe(true);
  });

  it("generates gag_character_synergy when gag and character co-occur in 2+ episodes", () => {
    const params = makeParams({
      episodes: ["ch1ep1", "ch1ep2", "ch1ep3"],
      nodes: [
        { id: "ch1ep1_char_zhoumo", type: "character_instance", label: "zhoumo", episode: "ch1ep1" },
        { id: "ch1ep2_char_zhoumo", type: "character_instance", label: "zhoumo", episode: "ch1ep2" },
        { id: "ch1ep1_gag_break", type: "gag_manifestation", episode: "ch1ep1", properties: { gag_type: "break" } },
        { id: "ch1ep2_gag_break", type: "gag_manifestation", episode: "ch1ep2", properties: { gag_type: "break" } },
      ],
      pageRankScores: {},
    });

    const result = generateAlgorithmCrossLinks(params);
    const synergies = result.filter((cl) => cl.link_type === "gag_character_synergy");
    expect(synergies.length).toBe(1);
    expect(synergies[0].confidence).toBeGreaterThanOrEqual(0.6);
  });

  it("skips gag_character_synergy when co-occurrence is only 1 episode", () => {
    const params = makeParams({
      episodes: ["ch1ep1"],
      nodes: [
        { id: "ch1ep1_char_zhoumo", type: "character_instance", label: "zhoumo", episode: "ch1ep1" },
        { id: "ch1ep1_gag_break", type: "gag_manifestation", episode: "ch1ep1", properties: { gag_type: "break" } },
      ],
      pageRankScores: {},
    });

    const result = generateAlgorithmCrossLinks(params);
    expect(result.every((cl) => cl.link_type !== "gag_character_synergy")).toBe(true);
  });

  it("generates narrative_cluster for scenes sharing characters across episodes", () => {
    const params = makeParams({
      episodes: ["ch1ep1", "ch1ep2"],
      nodes: [
        { id: "ch1ep1_scene_s1", type: "scene", episode: "ch1ep1" },
        { id: "ch1ep2_scene_s1", type: "scene", episode: "ch1ep2" },
        { id: "ch1ep1_char_zhoumo", type: "character_instance", label: "zhoumo", episode: "ch1ep1" },
        { id: "ch1ep2_char_zhoumo", type: "character_instance", label: "zhoumo", episode: "ch1ep2" },
      ],
      links: [
        { source: "ch1ep1_char_zhoumo", target: "ch1ep1_scene_s1", relation: "appears_in" },
        { source: "ch1ep2_char_zhoumo", target: "ch1ep2_scene_s1", relation: "appears_in" },
      ],
      pageRankScores: {},
    });

    const result = generateAlgorithmCrossLinks(params);
    const clusters = result.filter((cl) => cl.link_type === "narrative_cluster");
    expect(clusters.length).toBe(1);
    expect(clusters[0].confidence).toBeCloseTo(1.0);
  });

  it("skips narrative_cluster for scenes in the same episode", () => {
    const params = makeParams({
      episodes: ["ch1ep1"],
      nodes: [
        { id: "ch1ep1_scene_s1", type: "scene", episode: "ch1ep1" },
        { id: "ch1ep1_scene_s2", type: "scene", episode: "ch1ep1" },
        { id: "ch1ep1_char_zhoumo", type: "character_instance", label: "zhoumo", episode: "ch1ep1" },
      ],
      links: [
        { source: "ch1ep1_char_zhoumo", target: "ch1ep1_scene_s1", relation: "appears_in" },
        { source: "ch1ep1_char_zhoumo", target: "ch1ep1_scene_s2", relation: "appears_in" },
      ],
      pageRankScores: {},
    });

    const result = generateAlgorithmCrossLinks(params);
    expect(result.every((cl) => cl.link_type !== "narrative_cluster")).toBe(true);
  });

  it("generates multiple cross-link types in a realistic scenario", () => {
    const params = makeParams({
      episodes: ["ch1ep1", "ch1ep2"],
      nodes: [
        { id: "ch1ep1_plot", type: "episode_plot", episode: "ch1ep1" },
        { id: "ch1ep2_plot", type: "episode_plot", episode: "ch1ep2" },
        { id: "ch1ep1_scene_s1", type: "scene", episode: "ch1ep1" },
        { id: "ch1ep2_scene_s1", type: "scene", episode: "ch1ep2" },
        { id: "ch1ep1_char_zhoumo", type: "character_instance", label: "zhoumo", episode: "ch1ep1" },
        { id: "ch1ep2_char_zhoumo", type: "character_instance", label: "zhoumo", episode: "ch1ep2" },
        { id: "ch1ep1_char_minor", type: "character_instance", label: "minor", episode: "ch1ep1" },
        { id: "ch1ep2_char_minor", type: "character_instance", label: "minor", episode: "ch1ep2" },
        { id: "ch1ep1_gag_break", type: "gag_manifestation", episode: "ch1ep1", properties: { gag_type: "break" } },
        { id: "ch1ep2_gag_break", type: "gag_manifestation", episode: "ch1ep2", properties: { gag_type: "break" } },
      ],
      links: [
        { source: "ch1ep1_char_zhoumo", target: "ch1ep1_scene_s1", relation: "appears_in" },
        { source: "ch1ep2_char_zhoumo", target: "ch1ep2_scene_s1", relation: "appears_in" },
      ],
      pageRankScores: {
        ch1ep1_char_zhoumo: 0.08,
        ch1ep2_char_zhoumo: 0.07,
        ch1ep1_char_minor: 0.001,
        ch1ep2_char_minor: 0.002,
      },
      similarityMatrix: {
        ch1ep1: { ch1ep1: 1, ch1ep2: 0.6 },
        ch1ep2: { ch1ep1: 0.6, ch1ep2: 1 },
      },
    });

    const result = generateAlgorithmCrossLinks(params);
    const types = new Set(result.map((cl) => cl.link_type));
    expect(types.has("story_anti_pattern")).toBe(true);
    expect(types.has("character_theme_affinity")).toBe(true);
    expect(types.has("gag_character_synergy")).toBe(true);
    expect(types.has("narrative_cluster")).toBe(true);
    expect(result.length).toBe(5);
    expect(result.every((cl) => cl.generated_by === "algorithm")).toBe(true);
  });
});

describe("normalizePageRankByType", () => {
  it("normalizes scores per type to 0–1", async () => {
    const Graph = (await import("graphology")).default;
    const G = new Graph();
    G.addNode("char_a", { type: "character_instance", label: "A" });
    G.addNode("char_b", { type: "character_instance", label: "B" });
    G.addNode("scene_1", { type: "scene", label: "S1" });
    G.addDirectedEdge("char_a", "scene_1");

    const raw = { char_a: 0.05, char_b: 0.02, scene_1: 0.15 };
    const result = normalizePageRankByType(raw, G);

    // char_a should be 1.0 (max of characters), char_b should be 0.0 (min)
    expect(result.char_a.normalized).toBe(1);
    expect(result.char_b.normalized).toBe(0);
    expect(result.char_a.type).toBe("character_instance");
    expect(result.scene_1.normalized).toBe(1);
    expect(result.scene_1.type).toBe("scene");
  });

  it("handles single-node types", async () => {
    const Graph = (await import("graphology")).default;
    const G = new Graph();
    G.addNode("only", { type: "solo", label: "X" });

    const raw = { only: 0.1 };
    const result = normalizePageRankByType(raw, G);
    expect(result.only.normalized).toBe(1);
  });
});

describe("computePlotArcScore", () => {
  it("returns no_structural_data when all beats have default tension and no standard types", () => {
    const beats = [
      { scene: "s1", beat_type: "英雄登場", tension: 0.5 },
      { scene: "s2", beat_type: "危機出現", tension: 0.5 },
      { scene: "s3", beat_type: "最終決戰", tension: 0.5 },
    ];
    const result = computePlotArcScore(beats);
    expect(result.diagnosis).toBe("no_structural_data");
    expect(result.score).toBe(50);
  });

  it("returns no_climax when standard types exist but no climax", () => {
    const beats = [
      { scene: "s1", beat_type: "inciting_incident", tension: 0.3 },
      { scene: "s2", beat_type: "rising_action", tension: 0.6 },
    ];
    const result = computePlotArcScore(beats);
    expect(result.diagnosis).toBe("no_climax");
  });

  it("returns complete for valid arc with standard types", () => {
    const beats = [
      { scene: "s1", beat_type: "inciting_incident", tension: 0.3 },
      { scene: "s2", beat_type: "rising_action", tension: 0.7 },
      { scene: "s3", beat_type: "climax", tension: 1.0 },
      { scene: "s4", beat_type: "falling_action", tension: 0.3 },
      { scene: "s5", beat_type: "resolution", tension: 0.1 },
    ];
    const result = computePlotArcScore(beats);
    expect(result.diagnosis).toBe("complete");
    expect(result.score).toBeGreaterThan(80);
  });
});
