import { describe, test, expect } from "bun:test";
import {
  loadPreviousEpisodeSummary,
  loadActiveForeshadowing,
  loadPacingProfile,
  loadThematicCoherence,
  loadGagEvolution,
  loadInteractionPatterns,
  loadTechTermUsage,
} from "../kg-loaders";

// ─── Fixtures ───

function makeMergedGraph() {
  return {
    nodes: [
      { id: "ch1ep1_plot", label: "入宗考試 (ch1ep1)", type: "episode_plot", episode: "ch1ep1" },
      { id: "ch1ep1_scene_Title", label: "TitleScene", type: "scene", episode: "ch1ep1",
        properties: { dialog_line_count: "0", character_count: "1", effect_count: "2" } },
      { id: "ch1ep1_scene_Main", label: "MainScene", type: "scene", episode: "ch1ep1",
        properties: { dialog_line_count: "8", character_count: "3", effect_count: "1" } },
      { id: "ch1ep1_scene_Outro", label: "OutroScene", type: "scene", episode: "ch1ep1",
        properties: { dialog_line_count: "2", character_count: "1", effect_count: "0" } },
      { id: "ch1ep1_char_zhoumo", label: "周墨 (ch1ep1)", type: "character_instance", episode: "ch1ep1",
        properties: { character_id: "zhoumo", dialog_count: "10", role: "main" } },
      { id: "ch1ep1_char_examiner", label: "考官 (ch1ep1)", type: "character_instance", episode: "ch1ep1",
        properties: { character_id: "examiner", dialog_count: "5", role: "supporting" } },
      { id: "ch1ep1_tech_靈根", label: "靈根", type: "tech_term", episode: "ch1ep1" },
      { id: "ch1ep1_tech_煉器", label: "煉器", type: "tech_term", episode: "ch1ep1" },
      { id: "ch1ep1_theme_成長", label: "成長", type: "theme", episode: "ch1ep1" },
      { id: "ch1ep1_gag_1", label: "周墨：又是這招", type: "gag_manifestation", episode: "ch1ep1",
        properties: { gag_type: "吐槽" } },

      { id: "ch1ep2_plot", label: "結果公布 (ch1ep2)", type: "episode_plot", episode: "ch1ep2" },
      { id: "ch1ep2_scene_Title", label: "TitleScene", type: "scene", episode: "ch1ep2",
        properties: { dialog_line_count: "0", character_count: "1", effect_count: "1" } },
      { id: "ch1ep2_scene_Main", label: "MainScene", type: "scene", episode: "ch1ep2",
        properties: { dialog_line_count: "12", character_count: "4", effect_count: "3" } },
      { id: "ch1ep2_char_zhoumo", label: "周墨 (ch1ep2)", type: "character_instance", episode: "ch1ep2",
        properties: { character_id: "zhoumo", dialog_count: "15", role: "main" } },
      { id: "ch1ep2_tech_法寶", label: "法寶", type: "tech_term", episode: "ch1ep2" },
      { id: "ch1ep2_gag_1", label: "周墨：認真的嗎", type: "gag_manifestation", episode: "ch1ep2",
        properties: { gag_type: "吐槽" } },
    ],
    links: [
      { source: "ch1ep1_scene_Title", target: "ch1ep1_plot", relation: "part_of" },
      { source: "ch1ep1_scene_Main", target: "ch1ep1_plot", relation: "part_of" },
      { source: "ch1ep1_char_zhoumo", target: "ch1ep1_plot", relation: "appears_in" },
      { source: "ch1ep1_char_zhoumo", target: "ch1ep1_tech_靈根", relation: "uses_tech_term" },
      { source: "ch1ep1_char_zhoumo", target: "ch1ep1_char_examiner", relation: "interacts_with" },
      { source: "ch1ep1_theme_成長", target: "ch1ep1_plot", relation: "illustrates" },
      { source: "ch1ep2_char_zhoumo", target: "ch1ep2_tech_法寶", relation: "uses_tech_term" },
    ],
    link_edges: [
      { source: "ch1ep1_char_zhoumo", target: "ch1ep2_char_zhoumo", relation: "same_character" },
    ],
  };
}

// ─── loadPreviousEpisodeSummary ───

describe("loadPreviousEpisodeSummary", () => {
  test("returns null for first episode (ch1ep1)", () => {
    const result = loadPreviousEpisodeSummary(makeMergedGraph(), "ch1ep1");
    expect(result).toBeNull();
  });

  test("returns summary for ch1ep2 (previous is ch1ep1)", () => {
    const result = loadPreviousEpisodeSummary(makeMergedGraph(), "ch1ep2");
    expect(result).not.toBeNull();
    expect(result!.ep_id).toBe("ch1ep1");
    expect(result!.plot_label).toContain("入宗考試");
    expect(result!.scenes).toHaveLength(3);
    expect(result!.key_characters.length).toBeGreaterThanOrEqual(1);
    expect(result!.key_characters[0].id).toBe("zhoumo");
    expect(result!.key_characters[0].dialog_count).toBe(10);
    expect(result!.themes).toEqual(["成長"]);
  });

  test("returns null for non-existent episode with no previous", () => {
    const empty = { nodes: [], links: [] };
    const result = loadPreviousEpisodeSummary(empty, "ch1ep1");
    expect(result).toBeNull();
  });

  test("scene properties are parsed correctly", () => {
    const result = loadPreviousEpisodeSummary(makeMergedGraph(), "ch1ep2");
    const mainScene = result!.scenes.find(s => s.label === "MainScene");
    expect(mainScene).toBeDefined();
    expect(mainScene!.dialog_lines).toBe(8);
    expect(mainScene!.characters).toBe(3);
    expect(mainScene!.effects).toBe(1);
  });
});

// ─── loadPacingProfile ───

describe("loadPacingProfile", () => {
  test("returns empty for episode with no scenes", () => {
    const result = loadPacingProfile(makeMergedGraph(), "ch99ep1");
    expect(result).toEqual([]);
  });

  test("computes tension for ch1ep1 scenes", () => {
    const result = loadPacingProfile(makeMergedGraph(), "ch1ep1");
    expect(result).toHaveLength(3);

    // TitleScene: 0 dialog, 1 char, 2 effects → normalized
    const title = result.find(s => s.label === "TitleScene");
    expect(title).toBeDefined();
    expect(title!.dialog_density).toBe(0);
    expect(title!.tension).toBeGreaterThan(0);

    // MainScene should have highest tension (8 dialogs, 3 chars)
    const main = result.find(s => s.label === "MainScene");
    expect(main!.tension).toBeGreaterThan(title!.tension);
  });

  test("tension is normalized 0-1", () => {
    const result = loadPacingProfile(makeMergedGraph(), "ch1ep1");
    for (const s of result) {
      expect(s.tension).toBeGreaterThanOrEqual(0);
      expect(s.tension).toBeLessThanOrEqual(1);
    }
  });
});

// ─── loadThematicCoherence ───

describe("loadThematicCoherence", () => {
  test("extracts theme clusters with connected episodes", () => {
    const result = loadThematicCoherence(makeMergedGraph());
    expect(result.length).toBeGreaterThanOrEqual(1);

    const growthTheme = result.find(t => t.label === "成長");
    expect(growthTheme).toBeDefined();
    expect(growthTheme!.episodes).toContain("ch1ep1");
  });

  test("returns empty for graph with no themes", () => {
    const g = makeMergedGraph();
    g.nodes = g.nodes.filter(n => n.type !== "theme");
    const result = loadThematicCoherence(g);
    expect(result).toEqual([]);
  });
});

// ─── loadGagEvolution ───

describe("loadGagEvolution", () => {
  test("groups gag manifestations by type", () => {
    const result = loadGagEvolution(makeMergedGraph());
    expect(result.length).toBeGreaterThanOrEqual(1);

    const tucao = result.find(g => g.gag_type === "吐槽");
    expect(tucao).toBeDefined();
    expect(tucao!.manifestations).toHaveLength(2);
    expect(tucao!.manifestations[0].ep_id).toBe("ch1ep1");
    expect(tucao!.manifestations[1].ep_id).toBe("ch1ep2");
  });

  test("returns empty for graph with no gags", () => {
    const g = makeMergedGraph();
    g.nodes = g.nodes.filter(n => n.type !== "gag_manifestation");
    const result = loadGagEvolution(g);
    expect(result).toEqual([]);
  });
});

// ─── loadInteractionPatterns ───

describe("loadInteractionPatterns", () => {
  test("detects interaction history for character pairs", () => {
    const result = loadInteractionPatterns(
      makeMergedGraph(),
      ["zhoumo", "examiner"],
      { zhoumo: "周墨", examiner: "考官" }
    );
    expect(result).toHaveLength(1);
    expect(result[0].char_a_name).toBe("周墨");
    expect(result[0].char_b_name).toBe("考官");
    expect(result[0].is_first_interaction).toBe(false);
    expect(result[0].history_episodes).toContain("ch1ep1");
  });

  test("marks first interaction correctly", () => {
    const result = loadInteractionPatterns(
      makeMergedGraph(),
      ["zhoumo", "newchar"],
      { zhoumo: "周墨", newchar: "新角色" }
    );
    expect(result[0].is_first_interaction).toBe(true);
  });
});

// ─── loadTechTermUsage ───

describe("loadTechTermUsage", () => {
  test("groups tech terms by episode", () => {
    const result = loadTechTermUsage(makeMergedGraph());
    expect(result.length).toBeGreaterThanOrEqual(2);

    const ep1 = result.find(u => u.ep_id === "ch1ep1");
    expect(ep1).toBeDefined();
    expect(ep1!.terms).toContain("靈根");
    expect(ep1!.terms).toContain("煉器");

    const ep2 = result.find(u => u.ep_id === "ch1ep2");
    expect(ep2).toBeDefined();
    expect(ep2!.terms).toContain("法寶");
  });

  test("returns empty for graph with no tech terms", () => {
    const g = makeMergedGraph();
    g.nodes = g.nodes.filter(n => n.type !== "tech_term");
    const result = loadTechTermUsage(g);
    expect(result).toEqual([]);
  });
});
