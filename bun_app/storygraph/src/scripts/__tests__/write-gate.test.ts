import { describe, test, expect } from "bun:test";
import { buildGateReportZh } from "../graphify-write-gate";
import { buildDialogAssessmentPrompt } from "../subagent-prompt";
import type { GateJson, KGQualityScore } from "../graphify-write-gate";
import type { DialogAssessmentInput } from "../subagent-prompt";

const sampleGate: GateJson = {
  version: "2.0",
  timestamp: "2026-04-19T00:00:00.000Z",
  series: "test-series",
  genre: "xianxia_comedy",
  generator: { mode: "regex", model: "glm-5", version: "0.17.0" },
  score: 65,
  decision: "WARN",
  previous_score: 60,
  score_delta: 5,
  checks: [
    { name: "Character Consistency: hero", status: "PASS", score_impact: 5, fix_suggestion_zhTW: "" },
    { name: "Character Consistency: villain", status: "PASS", score_impact: 5, fix_suggestion_zhTW: "" },
    { name: "Plot Arc", status: "PASS", score_impact: 5, fix_suggestion_zhTW: "" },
    { name: "Pacing: ch1ep1", status: "WARN", score_impact: -5, fix_suggestion_zhTW: "第一集節奏偏平" },
    { name: "Pacing: ch1ep2", status: "WARN", score_impact: -5, fix_suggestion_zhTW: "" },
    { name: "Duplicate Content", status: "FAIL", score_impact: -15, fix_suggestion_zhTW: "兩集結構過於相似" },
    { name: "Thematic Coherence", status: "PASS", score_impact: 5, fix_suggestion_zhTW: "" },
  ],
  quality_breakdown: {
    consistency: 0.9,
    arc_structure: 0.8,
    pacing: 0.4,
    character_growth: 0.6,
    thematic_coherence: 0.95,
    gag_evolution: null,
  },
  supervisor_hints: {
    focus_areas: ["Pacing: ch1ep1: 節奏偏平", "Duplicate Content: 過於相似"],
    suggested_rubric_overrides: [],
    escalation_reason: null,
  },
  requires_claude_review: false,
};

const sampleKGScore: KGQualityScore = {
  version: "1.0",
  timestamp: "2026-04-19T00:00:00.000Z",
  series: "test-series",
  genre: "xianxia_comedy",
  generator: { mode: "hybrid", model: "glm-5" },
  programmatic: {
    score: 65,
    decision: "WARN",
    quality_breakdown: { consistency: 0.9, pacing: 0.4 },
  },
  ai: {
    dimensions: {
      entity_accuracy: 8,
      relationship_correctness: 7,
      completeness: 6,
      cross_episode_coherence: 7,
      actionability: 8,
    },
    overall: 7.2,
    justification: "Good entity extraction with minor relationship issues.",
  },
  blended: {
    overall: 0.712,
    formula: "0.4 × programmatic + 0.6 × ai",
    decision: "ACCEPT",
  },
};

describe("buildGateReportZh", () => {
  test("generates zh_TW report from gate.json only", () => {
    const report = buildGateReportZh(sampleGate, null);

    expect(report).toContain("品質閘門報告");
    expect(report).toContain("test-series");
    expect(report).toContain("65/100");
    expect(report).toContain("📈 +5 分");
    expect(report).toContain("角色一致性");
    expect(report).toContain("90%");
    expect(report).toContain("節奏掌控");
    expect(report).toContain("嚴重問題");
    expect(report).toContain("需注意");
    expect(report).toContain("通過項目");
  });

  test("includes AI scores when kg-quality-score provided", () => {
    const report = buildGateReportZh(sampleGate, sampleKGScore);

    expect(report).toContain("綜合評分");
    expect(report).toContain("71.2%");
    expect(report).toContain("AI 評分維度");
    expect(report).toContain("實體準確性");
    expect(report).toContain("8/10");
    expect(report).toContain("Good entity extraction");
  });

  test("shows escalation status when requires_claude_review is true", () => {
    const gate: GateJson = {
      ...sampleGate,
      score: 20,
      decision: "FAIL",
      requires_claude_review: true,
      supervisor_hints: {
        ...sampleGate.supervisor_hints,
        escalation_reason: "Score 20 below threshold 70",
      },
    };
    const report = buildGateReportZh(gate, null);

    expect(report).toContain("建議由 Claude Code 進行 Tier 2 審查");
    expect(report).toContain("Score 20 below threshold 70");
  });

  test("deduplicates checks by group", () => {
    const report = buildGateReportZh(sampleGate, null);

    // Should group 2 Pacing checks into one line
    expect(report).toMatch(/Pacing.*2項/);
    // Character Consistency shows in pass section (2 items)
    expect(report).toContain("Character Consistency：** 2 項通過");
  });

  test("omits null quality dimensions", () => {
    const report = buildGateReportZh(sampleGate, null);

    // gag_evolution is null — should NOT appear in table
    expect(report).not.toContain("笑點演進");
  });

  test("handles gate with no previous score", () => {
    const gate: GateJson = {
      ...sampleGate,
      previous_score: null,
      score_delta: null,
    };
    const report = buildGateReportZh(gate, null);

    expect(report).not.toContain("趨勢");
  });

  test("handles gate with only PASS checks", () => {
    const gate: GateJson = {
      ...sampleGate,
      score: 100,
      decision: "PASS",
      checks: sampleGate.checks.filter(c => c.status === "PASS"),
      requires_claude_review: false,
    };
    const report = buildGateReportZh(gate, null);

    expect(report).not.toContain("嚴重問題");
    expect(report).not.toContain("需注意");
    expect(report).toContain("通過項目");
  });

  test("includes fix suggestions when present", () => {
    const report = buildGateReportZh(sampleGate, null);

    expect(report).toContain("第一集節奏偏平");
    expect(report).toContain("兩集結構過於相似");
  });
});

describe("buildDialogAssessmentPrompt", () => {
  test("generates zh_TW assessment prompt", () => {
    const input: DialogAssessmentInput = {
      series_name: "測試系列",
      genre: "galgame_meme",
      episode_count: 5,
      gate_score: 65,
      gate_decision: "WARN",
      warn_checks: [
        { name: "Pacing: ch1ep1", fix_suggestion_zhTW: "節奏偏平" },
      ],
      fail_checks: [
        { name: "Duplicate Content", fix_suggestion_zhTW: "內容重複" },
      ],
      quality_breakdown: { consistency: 0.8, pacing: 0.4 },
      ai_scores: {
        dimensions: { entity_accuracy: 7, relationship_correctness: 6, completeness: 5, cross_episode_coherence: 6, actionability: 7 },
        overall: 6.2,
        justification: "Decent extraction with minor issues.",
      },
      supervisor_hints: ["Pacing flat", "Content duplication"],
    };

    const prompt = buildDialogAssessmentPrompt(input);

    expect(prompt).toContain("測試系列");
    expect(prompt).toContain("galgame_meme");
    expect(prompt).toContain("65/100");
    expect(prompt).toContain("繁體中文");
    expect(prompt).toContain("Pacing: ch1ep1");
    expect(prompt).toContain("Duplicate Content");
    expect(prompt).toContain("check_name");
    expect(prompt).toContain("fix_suggestion_zhTW");
  });

  test("handles missing AI scores", () => {
    const input: DialogAssessmentInput = {
      series_name: "test",
      genre: "generic",
      episode_count: 1,
      gate_score: 50,
      gate_decision: "WARN",
      warn_checks: [],
      fail_checks: [],
      quality_breakdown: { consistency: 0.5 },
      ai_scores: null,
      supervisor_hints: [],
    };

    const prompt = buildDialogAssessmentPrompt(input);

    expect(prompt).toContain("無 AI 評分");
    expect(prompt).toContain("無)");
  });
});
