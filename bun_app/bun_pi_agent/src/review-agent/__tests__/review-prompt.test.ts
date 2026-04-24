import { describe, test, expect } from "bun:test";
import { buildReviewPrompt, extractNarrations } from "../review-prompt";
import type { ReviewInputData } from "../review-prompt";

const FIXTURE_DATA: ReviewInputData = {
  gate: {
    version: "2.0",
    series: "test-series",
    genre: "xianxia_comedy",
    score: 75,
    decision: "PASS",
    checks: [
      { name: "Gag Evolution: foo", status: "PASS", score_impact: 5, fix_suggestion_zhTW: "" },
      { name: "Pacing", status: "WARN", score_impact: -3, fix_suggestion_zhTW: "改善節奏" },
      { name: "Character Growth", status: "FAIL", score_impact: -10, fix_suggestion_zhTW: "增加角色成長" },
    ],
  },
  blendedScore: 0.72,
  graphStats: {
    node_count: 100,
    edge_count: 200,
    node_types: { character: 30, scene: 25, trait: 20, event: 15, location: 10 },
    communities: 5,
  },
  narrationExcerpts: [
    { episode: "test-ch1-ep1", text: "歡迎來到測試系列。這是第一集的對話內容。" },
    { episode: "test-ch1-ep2", text: "第二集的對話。角色之間的互動。" },
  ],
  seriesName: "test-series",
  genre: "xianxia_comedy",
};

describe("buildReviewPrompt", () => {
  test("includes series name and genre", () => {
    const prompt = buildReviewPrompt(FIXTURE_DATA);
    expect(prompt).toContain("test-series");
    expect(prompt).toContain("xianxia_comedy");
  });

  test("includes gate score", () => {
    const prompt = buildReviewPrompt(FIXTURE_DATA);
    expect(prompt).toContain("75/100");
    expect(prompt).toContain("PASS");
  });

  test("includes blended score", () => {
    const prompt = buildReviewPrompt(FIXTURE_DATA);
    expect(prompt).toContain("72.0%");
  });

  test("includes graph stats", () => {
    const prompt = buildReviewPrompt(FIXTURE_DATA);
    expect(prompt).toContain("100");
    expect(prompt).toContain("200");
    expect(prompt).toContain("5");
  });

  test("includes warnings and failures", () => {
    const prompt = buildReviewPrompt(FIXTURE_DATA);
    expect(prompt).toContain("Warnings (1)");
    expect(prompt).toContain("Pacing");
    expect(prompt).toContain("Failures (1)");
    expect(prompt).toContain("Character Growth");
    expect(prompt).toContain("增加角色成長");
  });

  test("includes narration excerpts", () => {
    const prompt = buildReviewPrompt(FIXTURE_DATA);
    expect(prompt).toContain("test-ch1-ep1");
    expect(prompt).toContain("歡迎來到測試系列");
  });

  test("includes all 6 review dimensions", () => {
    const prompt = buildReviewPrompt(FIXTURE_DATA);
    expect(prompt).toContain("semantic_correctness");
    expect(prompt).toContain("creative_quality");
    expect(prompt).toContain("genre_fit");
    expect(prompt).toContain("pacing");
    expect(prompt).toContain("character_consistency");
    expect(prompt).toContain("regression_vs_previous");
  });

  test("includes decision rules", () => {
    const prompt = buildReviewPrompt(FIXTURE_DATA);
    expect(prompt).toContain("APPROVE");
    expect(prompt).toContain("APPROVE_WITH_FIXES");
    expect(prompt).toContain("REQUEST_RERUN");
    expect(prompt).toContain("BLOCK");
  });

  test("handles missing blended score", () => {
    const data = { ...FIXTURE_DATA, blendedScore: null };
    const prompt = buildReviewPrompt(data);
    expect(prompt).toContain("no blended score");
  });

  test("handles empty narrations", () => {
    const data = { ...FIXTURE_DATA, narrationExcerpts: [] };
    const prompt = buildReviewPrompt(data);
    expect(prompt).toContain("no narration files found");
  });
});

describe("extractNarrations", () => {
  test("returns empty array for non-existent directory", () => {
    const result = extractNarrations("/non/existent/path");
    expect(result).toEqual([]);
  });
});
