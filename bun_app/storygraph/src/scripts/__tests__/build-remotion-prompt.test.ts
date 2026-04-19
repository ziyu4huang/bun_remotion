import { describe, test, expect } from "bun:test";
import { buildRemotionPrompt } from "../subagent-prompt";
import type { RemotionPromptInput } from "../subagent-prompt";

// ─── Fixtures ───

function makeFullInput(): RemotionPromptInput {
  return {
    series_name: "誰讓他煉器的",
    target_ep: "ch2ep1",
    prev_episode_summary: {
      ep_id: "ch1ep3",
      plot_label: "爐子修復 (ch1ep3)",
      scenes: [
        { id: "ch1ep3_scene_Title", label: "TitleScene", dialog_lines: 0, characters: 1, effects: 2 },
        { id: "ch1ep3_scene_Main", label: "MainScene", dialog_lines: 10, characters: 3, effects: 4 },
        { id: "ch1ep3_scene_Outro", label: "OutroScene", dialog_lines: 2, characters: 1, effects: 0 },
      ],
      key_characters: [
        { id: "zhoumo", label: "周墨", dialog_count: 12 },
        { id: "cangmingzi", label: "滄溟子", dialog_count: 6 },
      ],
      themes: ["成長", "師徒"],
    },
    active_foreshadowing: [
      { id: "ch1ep2_foreshadow_1", description: "周墨的隱藏靈根", planted_episode: "ch1ep2", paid_off: false, payoff_episode: null, confidence: 0.9 },
    ],
    pacing_profile: [
      { scene_id: "ch1ep3_scene_Title", label: "TitleScene", tension: 0.2, dialog_density: 0, character_density: 0.33, effect_density: 0.5 },
      { scene_id: "ch1ep3_scene_Main", label: "MainScene", tension: 0.85, dialog_density: 1.0, character_density: 1.0, effect_density: 1.0 },
      { scene_id: "ch1ep3_scene_Outro", label: "OutroScene", tension: 0.1, dialog_density: 0.2, character_density: 0.33, effect_density: 0 },
    ],
    thematic_clusters: [
      { theme_id: "ch1ep1_theme_成長", label: "成長", episodes: ["ch1ep1", "ch1ep2", "ch1ep3"], connected_nodes: [] },
      { theme_id: "ch1ep2_theme_師徒", label: "師徒", episodes: ["ch1ep2", "ch1ep3"], connected_nodes: [] },
    ],
    character_constraints: [
      { char_id: "zhoumo", char_name: "周墨", stable_traits: ["吐槽", "工程師思維"], recent_variant_traits: ["衝動"] },
    ],
    tech_terms_used: [
      { ep_id: "ch1ep1", terms: ["靈根", "煉器"] },
      { ep_id: "ch1ep2", terms: ["法寶"] },
    ],
    gag_evolution: [
      { gag_type: "吐槽", manifestations: [
        { ep_id: "ch1ep1", label: "周墨：又是這招" },
        { ep_id: "ch1ep2", label: "周墨：認真的嗎" },
      ] },
    ],
    interaction_history: [
      { char_a: "zhoumo", char_a_name: "周墨", char_b: "cangmingzi", char_b_name: "滄溟子", history_episodes: ["ch1ep1", "ch1ep3"], is_first_interaction: false },
    ],
  };
}

// ─── Tests ───

describe("buildRemotionPrompt", () => {
  test("generates prompt with all 8 sections", () => {
    const prompt = buildRemotionPrompt(makeFullInput());

    // All 8 section headers
    expect(prompt).toContain("## 前集摘要");
    expect(prompt).toContain("## 活躍伏筆");
    expect(prompt).toContain("## 角色特質約束");
    expect(prompt).toContain("## 招牌梗演進");
    expect(prompt).toContain("## 互動模式");
    expect(prompt).toContain("## 節奏參考");
    expect(prompt).toContain("## 主題一致性");
    expect(prompt).toContain("## 科技術語");
  });

  test("includes series name and target episode in header", () => {
    const prompt = buildRemotionPrompt(makeFullInput());
    expect(prompt).toContain("誰讓他煉器的");
    expect(prompt).toContain("ch2ep1");
  });

  test("previous episode summary includes scenes and characters", () => {
    const prompt = buildRemotionPrompt(makeFullInput());
    expect(prompt).toContain("ch1ep3");
    expect(prompt).toContain("爐子修復");
    expect(prompt).toContain("MainScene");
    expect(prompt).toContain("周墨");
    expect(prompt).toContain("滄溟子");
  });

  test("foreshadowing section shows active foreshadows", () => {
    const prompt = buildRemotionPrompt(makeFullInput());
    expect(prompt).toContain("ch1ep2_foreshadow_1");
    expect(prompt).toContain("周墨的隱藏靈根");
    expect(prompt).toContain("至少延續一條");
  });

  test("character constraints show stable and variant traits", () => {
    const prompt = buildRemotionPrompt(makeFullInput());
    expect(prompt).toContain("吐槽");
    expect(prompt).toContain("工程師思維");
    expect(prompt).toContain("衝動");
    expect(prompt).toContain("穩定特質");
    expect(prompt).toContain("近集變體");
  });

  test("gag evolution shows history", () => {
    const prompt = buildRemotionPrompt(makeFullInput());
    expect(prompt).toContain("### 吐槽");
    expect(prompt).toContain("ch1ep1");
    expect(prompt).toContain("又是這招");
    expect(prompt).toContain("演化升級");
  });

  test("interaction patterns show history", () => {
    const prompt = buildRemotionPrompt(makeFullInput());
    expect(prompt).toContain("周墨 ↔ 滄溟子");
    expect(prompt).toContain("前集已有互動");
    expect(prompt).toContain("ch1ep1");
  });

  test("pacing section shows tension bars", () => {
    const prompt = buildRemotionPrompt(makeFullInput());
    expect(prompt).toContain("█");
    expect(prompt).toContain("平均張力");
    expect(prompt).toContain("0.85");
  });

  test("theme section shows episode counts", () => {
    const prompt = buildRemotionPrompt(makeFullInput());
    expect(prompt).toContain("成長");
    expect(prompt).toContain("3 集");
    expect(prompt).toContain("師徒");
  });

  test("tech terms show dedup list", () => {
    const prompt = buildRemotionPrompt(makeFullInput());
    expect(prompt).toContain("靈根");
    expect(prompt).toContain("煉器");
    expect(prompt).toContain("法寶");
    expect(prompt).toContain("避免重複");
  });

  test("handles all-null/empty inputs gracefully", () => {
    const input: RemotionPromptInput = {
      series_name: "Test",
      target_ep: "ch1ep1",
      prev_episode_summary: null,
      active_foreshadowing: [],
      pacing_profile: [],
      thematic_clusters: [],
      character_constraints: [],
      tech_terms_used: [],
      gag_evolution: [],
      interaction_history: [],
    };

    const prompt = buildRemotionPrompt(input);

    // All 8 sections still present
    expect(prompt).toContain("## 前集摘要");
    expect(prompt).toContain("## 活躍伏筆");
    expect(prompt).toContain("## 角色特質約束");
    expect(prompt).toContain("## 招牌梗演進");
    expect(prompt).toContain("## 互動模式");
    expect(prompt).toContain("## 節奏參考");
    expect(prompt).toContain("## 主題一致性");
    expect(prompt).toContain("## 科技術語");

    // Graceful fallbacks
    expect(prompt).toContain("這是第一章第一集");
    expect(prompt).toContain("尚無未回收的伏筆");
    expect(prompt).toContain("尚無跨集角色特質");
    expect(prompt).toContain("尚無招牌梗");
    expect(prompt).toContain("尚無目標角色互動");
    expect(prompt).toContain("尚無前集節奏");
    expect(prompt).toContain("尚無主題節點");
    expect(prompt).toContain("尚無科技術語");
  });
});
