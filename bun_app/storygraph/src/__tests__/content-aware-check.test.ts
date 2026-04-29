import { describe, test, expect } from "bun:test";
import {
  loadPreviousEpisodeSummary,
  loadGagEvolution,
  loadInteractionPatterns,
  loadThematicCoherence,
  loadCharacterConstraints,
} from "../scripts/kg-loaders";

// ─── Helpers ───

function makeMerged(nodes: any[], links: any[] = [], linkEdges: any[] = []) {
  return { nodes, links, link_edges: linkEdges };
}

// ─── loadPreviousEpisodeSummary ───

describe("loadPreviousEpisodeSummary", () => {
  test("returns null for first episode", () => {
    const merged = makeMerged([
      { id: "ch1ep1_plot", type: "episode_plot", episode: "ch1ep1" },
    ]);
    const result = loadPreviousEpisodeSummary(merged, "ch1ep1");
    expect(result).toBeNull();
  });

  test("returns null when no previous episode exists", () => {
    const merged = makeMerged([
      { id: "ch1ep1_plot", type: "episode_plot", episode: "ch1ep1" },
      { id: "ch1ep2_plot", type: "episode_plot", episode: "ch1ep2" },
    ]);
    // ch1ep1 has no predecessor
    expect(loadPreviousEpisodeSummary(merged, "ch1ep1")).toBeNull();
  });

  test("returns previous episode summary", () => {
    const merged = makeMerged([
      { id: "ch1ep1_plot", type: "episode_plot", episode: "ch1ep1", label: "Episode 1" },
      { id: "ch1ep1_scene_1", type: "scene", episode: "ch1ep1", label: "Scene 1", properties: { dialog_line_count: "5", character_count: "2", effect_count: "1" } },
      { id: "ch1ep1_char_zhoumo", type: "character_instance", episode: "ch1ep1", label: "周末", properties: { character_id: "zhoumo", dialog_count: "10" } },
      { id: "ch1ep2_plot", type: "episode_plot", episode: "ch1ep2" },
    ]);
    const result = loadPreviousEpisodeSummary(merged, "ch1ep2");
    expect(result).not.toBeNull();
    expect(result!.ep_id).toBe("ch1ep1");
    expect(result!.plot_label).toBe("Episode 1");
    expect(result!.scenes).toHaveLength(1);
    expect(result!.key_characters).toHaveLength(1);
    expect(result!.key_characters[0].id).toBe("zhoumo");
    expect(result!.key_characters[0].dialog_count).toBe(10);
  });

  test("skips narrator in key characters", () => {
    const merged = makeMerged([
      { id: "ch1ep1_plot", type: "episode_plot", episode: "ch1ep1" },
      { id: "ch1ep1_char_narrator", type: "character_instance", episode: "ch1ep1", label: "旁白", properties: { character_id: "narrator", dialog_count: "20" } },
      { id: "ch1ep1_char_zhoumo", type: "character_instance", episode: "ch1ep1", label: "周末", properties: { character_id: "zhoumo", dialog_count: "5" } },
      { id: "ch1ep2_plot", type: "episode_plot", episode: "ch1ep2" },
    ]);
    const result = loadPreviousEpisodeSummary(merged, "ch1ep2");
    expect(result!.key_characters).toHaveLength(1);
    expect(result!.key_characters[0].id).toBe("zhoumo");
  });
});

// ─── loadGagEvolution ───

describe("loadGagEvolution", () => {
  test("returns empty for no gag nodes", () => {
    const merged = makeMerged([]);
    expect(loadGagEvolution(merged)).toHaveLength(0);
  });

  test("groups gag manifestations by type", () => {
    const merged = makeMerged([
      { id: "ch1ep1_gag_btn", type: "gag_manifestation", episode: "ch1ep1", label: "忘加按鈕：忘記加按鈕", properties: { gag_type: "忘加按鈕" } },
      { id: "ch1ep2_gag_btn", type: "gag_manifestation", episode: "ch1ep2", label: "忘加按鈕：又忘記了", properties: { gag_type: "忘加按鈕" } },
      { id: "ch1ep1_gag_tech", type: "gag_manifestation", episode: "ch1ep1", label: "科技用語：AI", properties: { gag_type: "科技用語" } },
    ]);
    const result = loadGagEvolution(merged);
    expect(result).toHaveLength(2);
    const btnChain = result.find(g => g.gag_type === "忘加按鈕");
    expect(btnChain).toBeDefined();
    expect(btnChain!.manifestations).toHaveLength(2);
    expect(btnChain!.manifestations[0].ep_id).toBe("ch1ep1");
  });
});

// ─── loadInteractionPatterns ───

describe("loadInteractionPatterns", () => {
  test("detects first interactions (no prior history)", () => {
    const merged = makeMerged([], []);
    const result = loadInteractionPatterns(merged, ["zhoumo", "examiner"], { zhoumo: "周末", examiner: "考官" });
    expect(result).toHaveLength(1);
    expect(result[0].is_first_interaction).toBe(true);
    expect(result[0].char_a_name).toBe("周末");
    expect(result[0].char_b_name).toBe("考官");
    expect(result[0].history_episodes).toHaveLength(0);
  });

  test("tracks interaction history", () => {
    const merged = makeMerged([], [
      { source: "ch1ep1_char_zhoumo", target: "ch1ep1_char_examiner", relation: "interacts_with" },
      { source: "ch1ep2_char_zhoumo", target: "ch1ep2_char_examiner", relation: "interacts_with" },
    ]);
    const result = loadInteractionPatterns(merged, ["zhoumo", "examiner"], { zhoumo: "周末", examiner: "考官" });
    expect(result).toHaveLength(1);
    expect(result[0].is_first_interaction).toBe(false);
    expect(result[0].history_episodes).toHaveLength(2);
  });

  test("excludes narrator from pairs", () => {
    const merged = makeMerged([], []);
    const result = loadInteractionPatterns(merged, ["zhoumo", "narrator"], { zhoumo: "周末", narrator: "旁白" });
    // The pair (zhoumo, narrator) is skipped because a === "narrator"
    expect(result).toHaveLength(0);
  });
});

// ─── loadThematicCoherence ───

describe("loadThematicCoherence", () => {
  test("returns empty for no theme nodes", () => {
    const merged = makeMerged([]);
    expect(loadThematicCoherence(merged)).toHaveLength(0);
  });

  test("builds theme clusters from edges", () => {
    const merged = makeMerged(
      [
        { id: "ch1ep1_theme_power", type: "theme", label: "power" },
        { id: "ch1ep1_scene_1", type: "scene", episode: "ch1ep1" },
        { id: "ch1ep2_scene_1", type: "scene", episode: "ch1ep2" },
      ],
      [
        { source: "ch1ep1_theme_power", target: "ch1ep1_scene_1", relation: "illustrates" },
        { source: "ch1ep1_theme_power", target: "ch1ep2_scene_1", relation: "illustrates" },
      ]
    );
    const result = loadThematicCoherence(merged);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("power");
    expect(result[0].episodes).toHaveLength(2);
  });
});

// ─── loadCharacterConstraints ───

describe("loadCharacterConstraints", () => {
  test("returns empty for non-existent directory", () => {
    const result = loadCharacterConstraints("/nonexistent/path");
    expect(result).toHaveLength(0);
  });
});

// ─── Episode Continuity logic (tested via loadPreviousEpisodeSummary) ───

describe("Episode Continuity: continuity gap detection", () => {
  test("identifies missing characters between episodes", () => {
    const merged = makeMerged([
      { id: "ch1ep1_plot", type: "episode_plot", episode: "ch1ep1" },
      { id: "ch1ep1_char_zhoumo", type: "character_instance", episode: "ch1ep1", label: "周末", properties: { character_id: "zhoumo", dialog_count: "10" } },
      { id: "ch1ep1_char_examiner", type: "character_instance", episode: "ch1ep1", label: "考官", properties: { character_id: "examiner", dialog_count: "8" } },
      { id: "ch1ep2_plot", type: "episode_plot", episode: "ch1ep2" },
      { id: "ch1ep2_char_zhoumo", type: "character_instance", episode: "ch1ep2", label: "周末", properties: { character_id: "zhoumo", dialog_count: "10" } },
      // examiner is absent from ch1ep2
    ]);
    const prevSummary = loadPreviousEpisodeSummary(merged, "ch1ep2");
    expect(prevSummary).not.toBeNull();
    expect(prevSummary!.key_characters).toHaveLength(2);

    const currCharIds = new Set(["zhoumo"]);
    const missing = prevSummary!.key_characters.filter(c => !currCharIds.has(c.id));
    expect(missing).toHaveLength(1);
    expect(missing[0].id).toBe("examiner");
  });
});
