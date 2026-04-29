import { describe, test, expect } from "bun:test";
import { normalizeForDedup, gagNodeId, plotNodeId, sceneNodeId, charNodeId, techTermNodeId, plotEventNodeId, artifactNodeId, traitNodeId } from "../scripts/dedup";

describe("normalizeForDedup", () => {
  test("lowercases and strips underscores/spaces/hyphens", () => {
    expect(normalizeForDedup("TitleScene")).toBe("titlescene");
    expect(normalizeForDedup("title_scene")).toBe("titlescene");
    expect(normalizeForDedup("title-scene")).toBe("titlescene");
    expect(normalizeForDedup("Title Scene")).toBe("titlescene");
  });

  test("strips parentheses", () => {
    expect(normalizeForDedup("社群偵測 (community_detection)")).toBe("社群偵測communitydetection");
    expect(normalizeForDedup("test（中文）")).toBe("test中文");
  });

  test("handles empty and whitespace-only", () => {
    expect(normalizeForDedup("")).toBe("");
    expect(normalizeForDedup("   ")).toBe("");
  });

  test("normalizes mixed content", () => {
    expect(normalizeForDedup("Content Scene 1")).toBe("contentscene1");
    expect(normalizeForDedup("content_scene_1")).toBe("contentscene1");
  });
});

describe("hybrid fuzzy dedup logic", () => {
  test("regex TitleScene matches AI title (substring containment)", () => {
    const regex = normalizeForDedup("TitleScene");
    const ai = normalizeForDedup("title");
    expect(regex.includes(ai) || ai.includes(regex)).toBe(true);
  });

  test("regex ContentScene1 matches AI contentscene1 (exact match)", () => {
    const regex = normalizeForDedup("ContentScene1");
    const ai = normalizeForDedup("content_scene_1");
    expect(regex).toBe(ai);
  });

  test("regex 社群偵測 does NOT match AI community_detection (different language)", () => {
    const regex = normalizeForDedup("社群偵測");
    const ai = normalizeForDedup("community_detection");
    // These are genuinely different strings — containment check should NOT match
    expect(regex.includes(ai) || ai.includes(regex)).toBe(false);
  });

  test("regex narrator matches AI narrator (exact)", () => {
    expect(normalizeForDedup("Narrator")).toBe(normalizeForDedup("narrator"));
  });

  test("regex OutroScene matches AI outro_scene", () => {
    const regex = normalizeForDedup("OutroScene");
    const ai = normalizeForDedup("outro_scene");
    expect(regex).toBe(ai);
  });
});

describe("gagNodeId", () => {
  test("builds canonical gag ID", () => {
    expect(gagNodeId("ch1ep1", "翻車現場")).toBe("ch1ep1_gag_翻車現場");
  });

  test("replaces spaces with underscores", () => {
    expect(gagNodeId("ch1ep2", "裝死 演技")).toBe("ch1ep2_gag_裝死_演技");
  });

  test("strips parentheses", () => {
    expect(gagNodeId("ch1ep1", "失敗(笑)")).toBe("ch1ep1_gag_失敗笑");
  });

  test("is idempotent — gagNodeId matches regex convention", () => {
    const gagType = "physical comedy";
    const regexStyle = `ch1ep1_gag_${gagType.replace(/\s+/g, "_")}`;
    expect(gagNodeId("ch1ep1", gagType)).toBe(regexStyle);
  });
});

describe("canonical node ID builders", () => {
  const EP = "ch2ep3";

  test("plotNodeId", () => {
    expect(plotNodeId(EP)).toBe("ch2ep3_plot");
  });

  test("sceneNodeId", () => {
    expect(sceneNodeId(EP, "Intro")).toBe("ch2ep3_scene_Intro");
    expect(sceneNodeId(EP, "Battle Arena")).toBe("ch2ep3_scene_Battle Arena");
  });

  test("charNodeId", () => {
    expect(charNodeId(EP, "zhoumo")).toBe("ch2ep3_char_zhoumo");
  });

  test("techTermNodeId normalizes spaces", () => {
    expect(techTermNodeId(EP, "飛劍")).toBe("ch2ep3_tech_飛劍");
    expect(techTermNodeId(EP, "long term")).toBe("ch2ep3_tech_long_term");
  });

  test("plotEventNodeId uses sequence number", () => {
    expect(plotEventNodeId(EP, 1)).toBe("ch2ep3_event_1");
    expect(plotEventNodeId(EP, 15)).toBe("ch2ep3_event_15");
  });

  test("artifactNodeId normalizes spaces", () => {
    expect(artifactNodeId(EP, "神劍")).toBe("ch2ep3_artifact_神劍");
    expect(artifactNodeId(EP, "sacred sword")).toBe("ch2ep3_artifact_sacred_sword");
  });

  test("traitNodeId combines char + trait", () => {
    expect(traitNodeId(EP, "zhoumo", "吐槽")).toBe("ch2ep3_trait_zhoumo_吐槽");
    expect(traitNodeId(EP, "zhoumo", "hot headed")).toBe("ch2ep3_trait_zhoumo_hot_headed");
  });

  test("all builders produce IDs starting with episode prefix", () => {
    expect(plotNodeId(EP).startsWith("ch2ep3_")).toBe(true);
    expect(sceneNodeId(EP, "X").startsWith("ch2ep3_")).toBe(true);
    expect(charNodeId(EP, "a").startsWith("ch2ep3_")).toBe(true);
    expect(techTermNodeId(EP, "t").startsWith("ch2ep3_")).toBe(true);
    expect(plotEventNodeId(EP, 1).startsWith("ch2ep3_")).toBe(true);
    expect(artifactNodeId(EP, "a").startsWith("ch2ep3_")).toBe(true);
    expect(traitNodeId(EP, "a", "b").startsWith("ch2ep3_")).toBe(true);
    expect(gagNodeId(EP, "g").startsWith("ch2ep3_")).toBe(true);
  });
});
