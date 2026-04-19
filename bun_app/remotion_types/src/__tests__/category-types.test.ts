import { describe, test, expect } from "bun:test";
import {
  detectCategoryFromDirname,
  getCategory,
  listCategoryIds,
  genreToCategory,
  estimateSceneCount,
  VIDEO_CATEGORIES,
} from "../category-types";
import type { VideoCategoryId } from "../category-types";

// ─── detectCategoryFromDirname ───

describe("detectCategoryFromDirname", () => {
  test("claude-code-intro -> tech_explainer", () => {
    expect(detectCategoryFromDirname("claude-code-intro")).toBe("tech_explainer");
  });

  test("taiwan-stock-market -> data_story", () => {
    expect(detectCategoryFromDirname("taiwan-stock-market")).toBe("data_story");
  });

  test("galgame-meme-theater-ep1 -> galgame_vn", () => {
    expect(detectCategoryFromDirname("galgame-meme-theater-ep1")).toBe("galgame_vn");
  });

  test("weapon-forger-ch1-ep1 -> narrative_drama", () => {
    expect(detectCategoryFromDirname("weapon-forger-ch1-ep1")).toBe("narrative_drama");
  });

  test("xianxia-system-meme-ep1 -> narrative_drama", () => {
    expect(detectCategoryFromDirname("xianxia-system-meme-ep1")).toBe("narrative_drama");
  });

  test("my-core-is-boss-ch1-ep1 -> narrative_drama", () => {
    expect(detectCategoryFromDirname("my-core-is-boss-ch1-ep1")).toBe("narrative_drama");
  });

  test("three-little-pigs -> narrative_drama (default fallback)", () => {
    expect(detectCategoryFromDirname("three-little-pigs")).toBe("narrative_drama");
  });

  test("commentary-style -> narrative_drama (default fallback)", () => {
    expect(detectCategoryFromDirname("commentary-style")).toBe("narrative_drama");
  });

  test("storygraph-intro -> tech_explainer", () => {
    expect(detectCategoryFromDirname("storygraph-intro")).toBe("tech_explainer");
  });

  // Additional edge cases

  test("case-insensitive detection", () => {
    expect(detectCategoryFromDirname("GALGAME-MEME-EP2")).toBe("galgame_vn");
    expect(detectCategoryFromDirname("WEAPON-FORGER-TEST")).toBe("narrative_drama");
  });

  test("unknown dir defaults to narrative_drama", () => {
    expect(detectCategoryFromDirname("totally-unknown-project")).toBe("narrative_drama");
  });

  test("shorts keyword -> shorts_meme", () => {
    expect(detectCategoryFromDirname("my-short-clip")).toBe("shorts_meme");
    expect(detectCategoryFromDirname("funny-shorts")).toBe("shorts_meme");
  });

  test("tutorial keyword -> tutorial", () => {
    expect(detectCategoryFromDirname("react-tutorial")).toBe("tutorial");
    expect(detectCategoryFromDirname("how-to-bun")).toBe("tutorial");
    expect(detectCategoryFromDirname("beginner-guide")).toBe("tutorial");
  });

  test("listicle keywords -> listicle", () => {
    expect(detectCategoryFromDirname("top-10-tools")).toBe("listicle");
    expect(detectCategoryFromDirname("my-ranking")).toBe("listicle");
  });

  test("data/chart/stock keywords -> data_story", () => {
    expect(detectCategoryFromDirname("stock-analysis")).toBe("data_story");
    expect(detectCategoryFromDirname("data-visual")).toBe("data_story");
    // Note: "chart-demo" matches "demo" first -> tech_explainer (order-sensitive detection)
    expect(detectCategoryFromDirname("chart-viewer")).toBe("data_story");
  });

  test("intro/explainer/demo keywords -> tech_explainer", () => {
    expect(detectCategoryFromDirname("product-intro")).toBe("tech_explainer");
    expect(detectCategoryFromDirname("tool-explainer")).toBe("tech_explainer");
    expect(detectCategoryFromDirname("live-demo")).toBe("tech_explainer");
  });
});

// ─── getCategory ───

describe("getCategory", () => {
  const allIds: VideoCategoryId[] = [
    "narrative_drama",
    "galgame_vn",
    "tech_explainer",
    "data_story",
    "listicle",
    "tutorial",
    "shorts_meme",
  ];

  test.each(allIds)("getCategory(%s) returns object with matching id", (id) => {
    const cat = getCategory(id);
    expect(cat).toBeDefined();
    expect(cat.id).toBe(id);
  });

  test("narrative_drama has correct label", () => {
    const cat = getCategory("narrative_drama");
    expect(cat.label.en).toBe("Narrative Drama");
    expect(cat.label.zh_TW).toBe("敘事劇情");
  });

  test("galgame_vn has correct label", () => {
    const cat = getCategory("galgame_vn");
    expect(cat.label.en).toBe("Galgame VN");
    expect(cat.label.zh_TW).toBe("美少女遊戲風");
  });

  test("tech_explainer has correct label", () => {
    const cat = getCategory("tech_explainer");
    expect(cat.label.en).toBe("Tech Explainer");
    expect(cat.label.zh_TW).toBe("技術講解");
  });

  test("data_story has correct label", () => {
    const cat = getCategory("data_story");
    expect(cat.label.en).toBe("Data Story");
    expect(cat.label.zh_TW).toBe("數據故事");
  });

  test("listicle has correct label", () => {
    const cat = getCategory("listicle");
    expect(cat.label.en).toBe("Listicle / Top N");
    expect(cat.label.zh_TW).toBe("盤點清單");
  });

  test("tutorial has correct label", () => {
    const cat = getCategory("tutorial");
    expect(cat.label.en).toBe("Tutorial / How-To");
    expect(cat.label.zh_TW).toBe("教學指南");
  });

  test("shorts_meme has correct label", () => {
    const cat = getCategory("shorts_meme");
    expect(cat.label.en).toBe("Shorts / Meme");
    expect(cat.label.zh_TW).toBe("短影音迷因");
  });

  test("every category has non-empty scenes array", () => {
    for (const id of allIds) {
      const cat = getCategory(id);
      expect(cat.scenes.length).toBeGreaterThan(0);
    }
  });

  test("every category has fps === 30", () => {
    for (const id of allIds) {
      const cat = getCategory(id);
      expect(cat.fps).toBe(30);
    }
  });

  test("every category has a valid dialogSystem", () => {
    const validSystems = ["dialogLines_array", "narration_script", "item_list", "step_guide", "none"];
    for (const id of allIds) {
      const cat = getCategory(id);
      expect(validSystems).toContain(cat.dialogSystem);
    }
  });

  test("every category has non-empty examples", () => {
    for (const id of allIds) {
      const cat = getCategory(id);
      expect(cat.examples.length).toBeGreaterThan(0);
    }
  });
});

// ─── listCategoryIds ───

describe("listCategoryIds", () => {
  test("returns exactly 7 IDs", () => {
    const ids = listCategoryIds();
    expect(ids).toHaveLength(7);
  });

  test("contains all expected IDs", () => {
    const ids = listCategoryIds();
    const expected: VideoCategoryId[] = [
      "narrative_drama",
      "galgame_vn",
      "tech_explainer",
      "data_story",
      "listicle",
      "tutorial",
      "shorts_meme",
    ];
    expect(ids.sort()).toEqual(expected.sort());
  });

  test("every returned ID exists in VIDEO_CATEGORIES", () => {
    const ids = listCategoryIds();
    for (const id of ids) {
      expect(VIDEO_CATEGORIES[id]).toBeDefined();
    }
  });
});

// ─── genreToCategory ───

describe("genreToCategory", () => {
  test("xianxia_comedy -> narrative_drama", () => {
    expect(genreToCategory("xianxia_comedy")).toBe("narrative_drama");
  });

  test("galgame_meme -> galgame_vn", () => {
    expect(genreToCategory("galgame_meme")).toBe("galgame_vn");
  });

  test("novel_system -> narrative_drama", () => {
    expect(genreToCategory("novel_system")).toBe("narrative_drama");
  });

  test("unknown genre defaults to narrative_drama", () => {
    expect(genreToCategory("unknown_genre")).toBe("narrative_drama");
    expect(genreToCategory("sci_fi")).toBe("narrative_drama");
    expect(genreToCategory("")).toBe("narrative_drama");
  });
});

// ─── estimateSceneCount ───

describe("estimateSceneCount", () => {
  test("returns reasonable numbers for narrative_drama at 60s", () => {
    const result = estimateSceneCount("narrative_drama", 60);
    // Should have entries for non-repeatable scenes (TitleScene, OutroScene) = 1 each
    expect(result["TitleScene"]).toBe(1);
    expect(result["OutroScene"]).toBe(1);
    // Repeatable scenes (ContentScene, BattleScene, TransitionScene) should be >= 1
    expect(result["ContentScene"]).toBeGreaterThanOrEqual(1);
    expect(result["BattleScene"]).toBeGreaterThanOrEqual(1);
    expect(result["TransitionScene"]).toBeGreaterThanOrEqual(1);
  });

  test("returns reasonable numbers for tech_explainer at 90s", () => {
    const result = estimateSceneCount("tech_explainer", 90);
    // Non-repeatable scenes should each be 1
    expect(result["TitleScene"]).toBe(1);
    expect(result["ProblemScene"]).toBe(1);
    expect(result["ArchitectureScene"]).toBe(1);
    expect(result["DemoScene"]).toBe(1);
    expect(result["ComparisonScene"]).toBe(1);
    expect(result["OutroScene"]).toBe(1);
    // FeatureScene is repeatable
    expect(result["FeatureScene"]).toBeGreaterThanOrEqual(1);
  });

  test("shorts_meme has minimal scene counts", () => {
    const result = estimateSceneCount("shorts_meme", 30);
    // All scenes in shorts_meme are non-repeatable
    expect(result["HookScene"]).toBe(1);
    expect(result["PunchlineScene"]).toBe(1);
    expect(result["LoopOutroScene"]).toBe(1);
  });

  test("longer duration yields more repeatable scenes", () => {
    const shortResult = estimateSceneCount("narrative_drama", 60);
    const longResult = estimateSceneCount("narrative_drama", 180);
    // Longer duration should have more content scenes
    expect(longResult["ContentScene"]).toBeGreaterThanOrEqual(shortResult["ContentScene"]);
  });

  test("all categories return non-empty results", () => {
    const allIds = listCategoryIds();
    for (const id of allIds) {
      const result = estimateSceneCount(id, 60);
      const totalCount = Object.values(result).reduce((sum, count) => sum + count, 0);
      expect(totalCount).toBeGreaterThan(0);
    }
  });
});
