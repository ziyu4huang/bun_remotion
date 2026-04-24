import { describe, test, expect } from "bun:test";
import {
  buildStoryDraftPrompt,
  buildStoryQualityPrompt,
  parseStoryDraftResponse,
  parseStoryQualityResponse,
  type StoryDraftConstraints,
  type StoryQualityInput,
} from "../subagent-prompt";

const baseDraftInput: StoryDraftConstraints = {
  series_name: "誰讓他煉器的",
  genre: "xianxia_comedy",
  category: "narrative_drama",
  episode_id: "ch2ep1",
  episode_title: "丹爐風暴",
  target_scenes: 5,
  target_duration_sec: 45,
  characters: [
    { id: "zhoumo", name: "周墨", side: "left", voice: "default", traits: ["熱血", "吐槽"] },
    { id: "elder", name: "長老", side: "right", voice: "default", traits: ["嚴肅", "傲嬌"] },
  ],
  prev_episode_summary: "周墨入門通過考核，獲得一座破丹爐。",
  active_foreshadowing: ["破丹爐似乎有神秘力量"],
  character_constraints: ["周墨必須展現熱血特質"],
  gag_history: ["ch1ep3: 丹爐爆炸變成烤地瓜"],
  thematic_requirements: ["成長"],
};

const baseQualityInput: StoryQualityInput = {
  series_name: "誰讓他煉器的",
  genre: "xianxia_comedy",
  episode_id: "ch2ep1",
  draft_json: JSON.stringify({
    title: "丹爐風暴",
    scenes: [
      {
        id: "scene_1",
        background: "煉器堂",
        tension: 0.3,
        dialog: [
          { character: "zhoumo", text: "長老，這丹爐怎麼又壞了？", emotion: "nervous", effect: "sweat" },
          { character: "elder", text: "那是你操作不當！", emotion: "angry", effect: "anger" },
        ],
      },
    ],
    new_foreshadowing: ["丹爐上的符文閃了一下"],
    payoffs: [],
  }),
  constraints_summary: "系列：誰讓他煉器的\n集數：ch2ep1",
};

// ─── buildStoryDraftPrompt ───

describe("buildStoryDraftPrompt", () => {
  test("includes series name and episode info", () => {
    const prompt = buildStoryDraftPrompt(baseDraftInput);
    expect(prompt).toContain("誰讓他煉器的");
    expect(prompt).toContain("ch2ep1");
    expect(prompt).toContain("丹爐風暴");
  });

  test("includes character list", () => {
    const prompt = buildStoryDraftPrompt(baseDraftInput);
    expect(prompt).toContain("zhoumo");
    expect(prompt).toContain("周墨");
    expect(prompt).toContain("elder");
    expect(prompt).toContain("長老");
  });

  test("includes structural constraints", () => {
    const prompt = buildStoryDraftPrompt(baseDraftInput);
    expect(prompt).toContain("5");
    expect(prompt).toContain("45");
  });

  test("includes prev episode summary", () => {
    const prompt = buildStoryDraftPrompt(baseDraftInput);
    expect(prompt).toContain("周墨入門通過考核");
  });

  test("includes foreshadowing", () => {
    const prompt = buildStoryDraftPrompt(baseDraftInput);
    expect(prompt).toContain("破丹爐似乎有神秘力量");
  });

  test("includes genre guide for xianxia_comedy", () => {
    const prompt = buildStoryDraftPrompt(baseDraftInput);
    expect(prompt).toContain("修仙喜劇風格指南");
  });

  test("includes genre guide for galgame_meme", () => {
    const input = { ...baseDraftInput, genre: "galgame_meme" as const };
    const prompt = buildStoryDraftPrompt(input);
    expect(prompt).toContain("美少女遊戲迷因風格指南");
  });

  test("includes genre guide for novel_system", () => {
    const input = { ...baseDraftInput, genre: "novel_system" as const };
    const prompt = buildStoryDraftPrompt(input);
    expect(prompt).toContain("系統小說風格指南");
  });

  test("no genre guide for generic", () => {
    const input = { ...baseDraftInput, genre: "generic" as const };
    const prompt = buildStoryDraftPrompt(input);
    expect(prompt).not.toContain("風格指南");
  });

  test("includes emotion and effect lists", () => {
    const prompt = buildStoryDraftPrompt(baseDraftInput);
    expect(prompt).toContain("angry");
    expect(prompt).toContain("surprise");
    expect(prompt).toContain("shake");
  });

  test("outputs JSON format instruction", () => {
    const prompt = buildStoryDraftPrompt(baseDraftInput);
    expect(prompt).toContain("不要加 markdown 圍欄");
  });
});

// ─── buildStoryQualityPrompt ───

describe("buildStoryQualityPrompt", () => {
  test("includes series info and draft", () => {
    const prompt = buildStoryQualityPrompt(baseQualityInput);
    expect(prompt).toContain("誰讓他煉器的");
    expect(prompt).toContain("丹爐風暴");
  });

  test("includes all 8 evaluation dimensions", () => {
    const prompt = buildStoryQualityPrompt(baseQualityInput);
    expect(prompt).toContain("character_consistency");
    expect(prompt).toContain("dialog_naturalness");
    expect(prompt).toContain("humor_quality");
    expect(prompt).toContain("plot_structure");
    expect(prompt).toContain("pacing");
    expect(prompt).toContain("genre_fit");
    expect(prompt).toContain("foreshadowing");
    expect(prompt).toContain("creativity");
  });

  test("truncates long drafts", () => {
    const longDraft = JSON.stringify({ title: "x".repeat(5000), scenes: [] });
    const input = { ...baseQualityInput, draft_json: longDraft };
    const prompt = buildStoryQualityPrompt(input);
    expect(prompt).toContain("truncated");
  });
});

// ─── parseStoryDraftResponse ───

describe("parseStoryDraftResponse", () => {
  test("parses valid draft", () => {
    const raw = JSON.stringify({
      title: "丹爐風暴",
      scenes: [
        {
          id: "scene_1",
          background: "煉器堂",
          tension: 0.7,
          dialog: [
            { character: "zhoumo", text: "這什麼情況？", emotion: "shocked", effect: "surprise" },
            { character: "elder", text: "冷靜！", emotion: "angry", effect: null },
          ],
        },
      ],
      new_foreshadowing: ["符文閃爍"],
      payoffs: ["破丹爐的真相揭曉"],
    });

    const draft = parseStoryDraftResponse(raw);
    expect(draft.title).toBe("丹爐風暴");
    expect(draft.scenes).toHaveLength(1);
    expect(draft.scenes[0].dialog).toHaveLength(2);
    expect(draft.scenes[0].tension).toBe(0.7);
    expect(draft.new_foreshadowing).toEqual(["符文閃爍"]);
    expect(draft.payoffs).toEqual(["破丹爐的真相揭曉"]);
  });

  test("clamps tension to 0-1", () => {
    const raw = JSON.stringify({
      title: "test",
      scenes: [
        { id: "s1", background: "bg", tension: 1.5, dialog: [] },
        { id: "s2", background: "bg", tension: -0.5, dialog: [] },
      ],
    });
    const draft = parseStoryDraftResponse(raw);
    expect(draft.scenes[0].tension).toBe(1);
    expect(draft.scenes[1].tension).toBe(0);
  });

  test("defaults tension to 0.5 when missing", () => {
    const raw = JSON.stringify({
      title: "test",
      scenes: [{ id: "s1", background: "bg", dialog: [] }],
    });
    const draft = parseStoryDraftResponse(raw);
    expect(draft.scenes[0].tension).toBe(0.5);
  });

  test("fixes invalid emotions to default", () => {
    const raw = JSON.stringify({
      title: "test",
      scenes: [{
        id: "s1", background: "bg", tension: 0.5,
        dialog: [{ character: "a", text: "hi", emotion: "nonexistent", effect: null }],
      }],
    });
    const draft = parseStoryDraftResponse(raw);
    expect(draft.scenes[0].dialog[0].emotion).toBe("default");
  });

  test("fixes invalid effects to null", () => {
    const raw = JSON.stringify({
      title: "test",
      scenes: [{
        id: "s1", background: "bg", tension: 0.5,
        dialog: [{ character: "a", text: "hi", emotion: "smile", effect: "nonexistent" }],
      }],
    });
    const draft = parseStoryDraftResponse(raw);
    expect(draft.scenes[0].dialog[0].effect).toBeNull();
  });

  test("defaults foreshadowing/payoffs to empty arrays", () => {
    const raw = JSON.stringify({
      title: "test",
      scenes: [{ id: "s1", background: "bg", tension: 0.5, dialog: [] }],
    });
    const draft = parseStoryDraftResponse(raw);
    expect(draft.new_foreshadowing).toEqual([]);
    expect(draft.payoffs).toEqual([]);
  });

  test("throws on missing title", () => {
    const raw = JSON.stringify({ scenes: [] });
    expect(() => parseStoryDraftResponse(raw)).toThrow("missing title or scenes");
  });

  test("throws on missing scenes", () => {
    const raw = JSON.stringify({ title: "test" });
    expect(() => parseStoryDraftResponse(raw)).toThrow("missing title or scenes");
  });

  test("throws on invalid scene", () => {
    const raw = JSON.stringify({ title: "test", scenes: [{ dialog: [] }] });
    expect(() => parseStoryDraftResponse(raw)).toThrow("Invalid scene");
  });
});

// ─── parseStoryQualityResponse ───

describe("parseStoryQualityResponse", () => {
  const validQuality = {
    dimensions: {
      character_consistency: 7,
      dialog_naturalness: 6,
      humor_quality: 5,
      plot_structure: 7,
      pacing: 6,
      genre_fit: 8,
      foreshadowing: 4,
      creativity: 5,
    },
    overall: 6.0,
    strengths: ["角色性格鮮明", "節奏明快"],
    weaknesses: ["伏筆回收不夠自然"],
    suggestions: ["加強伏筆鋪設"],
  };

  test("parses valid quality result", () => {
    const raw = JSON.stringify(validQuality);
    const result = parseStoryQualityResponse(raw);
    expect(result.overall).toBe(6.0);
    expect(result.dimensions.character_consistency).toBe(7);
    expect(result.strengths).toHaveLength(2);
    expect(result.weaknesses).toHaveLength(1);
    expect(result.suggestions).toHaveLength(1);
  });

  test("clamps dimension scores to 0-10", () => {
    const input = {
      ...validQuality,
      dimensions: { ...validQuality.dimensions, character_consistency: 15 },
    };
    const result = parseStoryQualityResponse(JSON.stringify(input));
    expect(result.dimensions.character_consistency).toBe(10);
  });

  test("clamps negative dimension to 0", () => {
    const input = {
      ...validQuality,
      dimensions: { ...validQuality.dimensions, humor_quality: -3 },
    };
    const result = parseStoryQualityResponse(JSON.stringify(input));
    expect(result.dimensions.humor_quality).toBe(0);
  });

  test("fills missing dimensions with 0", () => {
    const input = { ...validQuality, dimensions: { character_consistency: 5 } };
    const result = parseStoryQualityResponse(JSON.stringify(input));
    expect(result.dimensions.dialog_naturalness).toBe(0);
    expect(result.dimensions.creativity).toBe(0);
  });

  test("computes overall when missing", () => {
    const input = { ...validQuality, overall: undefined };
    const result = parseStoryQualityResponse(JSON.stringify(input));
    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThanOrEqual(10);
  });

  test("defaults arrays when missing", () => {
    const input = { dimensions: validQuality.dimensions, overall: 5 };
    const result = parseStoryQualityResponse(JSON.stringify(input));
    expect(result.strengths).toEqual([]);
    expect(result.weaknesses).toEqual([]);
    expect(result.suggestions).toEqual([]);
  });

  test("rounds overall to 1 decimal", () => {
    const input = { ...validQuality, overall: 6.3333 };
    const result = parseStoryQualityResponse(JSON.stringify(input));
    expect(result.overall).toBe(6.3);
  });
});
