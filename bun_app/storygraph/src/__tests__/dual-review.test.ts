import { describe, test, expect } from "bun:test";
import {
  buildDualReviewPrompt,
  parseDualReviewResponse,
  type DualReviewInput,
  type DualReviewResult,
} from "../scripts/subagent-prompt";

// ─── buildDualReviewPrompt ───

describe("buildDualReviewPrompt", () => {
  const baseInput: DualReviewInput = {
    series_name: "weapon-forger",
    genre: "xianxia_comedy",
    episode_count: 8,
    gate: {
      score: 100,
      decision: "PASS",
      quality_breakdown: { consistency: 1.0, diversity: 0.9 },
      checks: [
        { name: "Trait Coverage", status: "PASS", score_impact: 5 },
        { name: "Interaction Density", status: "WARN", score_impact: -0.2 },
      ],
    },
    consistency_report: "## WARN\n- ch1ep1: low interaction density\n",
    regression: null,
  };

  test("includes series name and genre", () => {
    const prompt = buildDualReviewPrompt(baseInput);
    expect(prompt).toContain("weapon-forger");
    expect(prompt).toContain("xianxia_comedy");
  });

  test("includes gate score and decision", () => {
    const prompt = buildDualReviewPrompt(baseInput);
    expect(prompt).toContain("100/100");
    expect(prompt).toContain("PASS");
  });

  test("includes check results", () => {
    const prompt = buildDualReviewPrompt(baseInput);
    expect(prompt).toContain("Trait Coverage");
    expect(prompt).toContain("Interaction Density");
    expect(prompt).toContain("[PASS]");
    expect(prompt).toContain("[WARN]");
  });

  test("includes regression data when present", () => {
    const input: DualReviewInput = {
      ...baseInput,
      regression: { baseline_score: 95, current_score: 100, score_delta: 5, regressed: false },
    };
    const prompt = buildDualReviewPrompt(input);
    expect(prompt).toContain("Baseline: 95");
    expect(prompt).toContain("Current: 100");
    expect(prompt).toContain("Regressed: NO");
  });

  test("shows no regression data when null", () => {
    const prompt = buildDualReviewPrompt(baseInput);
    expect(prompt).toContain("no regression data");
  });

  test("includes consistency report content", () => {
    const prompt = buildDualReviewPrompt(baseInput);
    expect(prompt).toContain("low interaction density");
  });

  test("truncates long reports", () => {
    const input: DualReviewInput = {
      ...baseInput,
      consistency_report: "x".repeat(5000),
    };
    const prompt = buildDualReviewPrompt(input);
    expect(prompt).toContain("truncated");
  });

  test("includes output format instructions", () => {
    const prompt = buildDualReviewPrompt(baseInput);
    expect(prompt).toContain("overall_verdict");
    expect(prompt).toContain("reviewer_score");
    expect(prompt).toContain("false_positives");
    expect(prompt).toContain("false_negatives");
  });
});

// ─── parseDualReviewResponse ───

describe("parseDualReviewResponse", () => {
  test("parses valid AGREE response", () => {
    const raw = JSON.stringify({
      overall_verdict: "AGREE",
      reviewer_score: 95,
      reviewer_dimensions: {
        score_accuracy: 9,
        check_fairness: 8,
        completeness: 9,
        blind_spot_detection: 7,
        actionability: 8,
      },
      false_positives: [],
      false_negatives: ["minor pacing issue missed"],
      missed_issues: [],
      strengths: ["good trait extraction"],
      weaknesses: ["gag evolution tracking limited"],
      recommendations: ["add pacing check"],
    });

    const result = parseDualReviewResponse(raw);
    expect(result.overall_verdict).toBe("AGREE");
    expect(result.reviewer_score).toBe(95);
    expect(result.reviewer_dimensions.score_accuracy).toBe(9);
    expect(result.false_negatives).toEqual(["minor pacing issue missed"]);
    expect(result.recommendations).toEqual(["add pacing check"]);
  });

  test("parses PARTIAL_AGREE response", () => {
    const raw = JSON.stringify({
      overall_verdict: "PARTIAL_AGREE",
      reviewer_score: 75,
      reviewer_dimensions: { score_accuracy: 7, check_fairness: 6, completeness: 5, blind_spot_detection: 4, actionability: 7 },
      false_positives: ["Trait Coverage too sensitive"],
      false_negatives: ["missing plot arc check"],
      missed_issues: ["no theme tracking"],
      strengths: ["good"],
      weaknesses: ["bad"],
      recommendations: ["fix it"],
    });

    const result = parseDualReviewResponse(raw);
    expect(result.overall_verdict).toBe("PARTIAL_AGREE");
    expect(result.false_positives.length).toBe(1);
    expect(result.missed_issues.length).toBe(1);
  });

  test("parses DISAGREE response", () => {
    const raw = JSON.stringify({
      overall_verdict: "DISAGREE",
      reviewer_score: 40,
      reviewer_dimensions: { score_accuracy: 3, check_fairness: 2, completeness: 4, blind_spot_detection: 3, actionability: 5 },
      false_positives: ["a", "b"],
      false_negatives: ["c", "d", "e"],
      missed_issues: ["f"],
      strengths: [],
      weaknesses: ["x", "y"],
      recommendations: ["z"],
    });

    const result = parseDualReviewResponse(raw);
    expect(result.overall_verdict).toBe("DISAGREE");
    expect(result.reviewer_score).toBe(40);
  });

  test("defaults invalid verdict to PARTIAL_AGREE", () => {
    const raw = JSON.stringify({
      overall_verdict: "MAYBE",
      reviewer_score: 50,
      reviewer_dimensions: {},
      false_positives: [],
      false_negatives: [],
      missed_issues: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
    });

    const result = parseDualReviewResponse(raw);
    expect(result.overall_verdict).toBe("PARTIAL_AGREE");
  });

  test("clamps reviewer_score to 0-100", () => {
    const raw = JSON.stringify({
      overall_verdict: "AGREE",
      reviewer_score: 150,
      reviewer_dimensions: {},
      false_positives: [],
      false_negatives: [],
      missed_issues: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
    });

    const result = parseDualReviewResponse(raw);
    expect(result.reviewer_score).toBe(100);
  });

  test("clamps dimensions to 0-10", () => {
    const raw = JSON.stringify({
      overall_verdict: "AGREE",
      reviewer_score: 50,
      reviewer_dimensions: { score_accuracy: 15, check_fairness: -3, completeness: 7, blind_spot_detection: 5, actionability: 8 },
      false_positives: [],
      false_negatives: [],
      missed_issues: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
    });

    const result = parseDualReviewResponse(raw);
    expect(result.reviewer_dimensions.score_accuracy).toBe(10);
    expect(result.reviewer_dimensions.check_fairness).toBe(0);
  });

  test("defaults missing score to 50", () => {
    const raw = JSON.stringify({
      overall_verdict: "AGREE",
      reviewer_dimensions: {},
      false_positives: [],
      false_negatives: [],
      missed_issues: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
    });

    const result = parseDualReviewResponse(raw);
    expect(result.reviewer_score).toBe(50);
  });

  test("limits arrays to 5 items", () => {
    const raw = JSON.stringify({
      overall_verdict: "AGREE",
      reviewer_score: 50,
      reviewer_dimensions: {},
      false_positives: ["1", "2", "3", "4", "5", "6", "7"],
      false_negatives: [],
      missed_issues: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
    });

    const result = parseDualReviewResponse(raw);
    expect(result.false_positives.length).toBe(5);
  });

  test("handles non-array fields gracefully", () => {
    const raw = JSON.stringify({
      overall_verdict: "AGREE",
      reviewer_score: 50,
      reviewer_dimensions: {},
      false_positives: "not an array",
      false_negatives: 42,
      missed_issues: null,
      strengths: undefined,
      weaknesses: {},
      recommendations: true,
    });

    const result = parseDualReviewResponse(raw);
    expect(result.false_positives).toEqual([]);
    expect(result.false_negatives).toEqual([]);
    expect(result.missed_issues).toEqual([]);
    expect(result.strengths).toEqual([]);
    expect(result.weaknesses).toEqual([]);
    expect(result.recommendations).toEqual([]);
  });
});
