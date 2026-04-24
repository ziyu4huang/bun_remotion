import { describe, test, expect } from "bun:test";
import { parseReviewResponse } from "../review-parser";

const VALID_RESPONSE = JSON.stringify({
  decision: "APPROVE",
  dimensions: {
    semantic_correctness: 8,
    creative_quality: 7,
    genre_fit: 9,
    pacing: 6,
    character_consistency: 7,
    regression_vs_previous: 8,
  },
  overall: 7.5,
  strengths: ["Good dialog", "Creative humor"],
  weaknesses: ["Pacing could improve"],
  fix_suggestions: [
    { target: "pacing", suggestion: "加快節奏", priority: "medium" },
  ],
  summary_zhTW: "整體品質良好",
});

describe("parseReviewResponse", () => {
  test("parses valid response", () => {
    const result = parseReviewResponse(VALID_RESPONSE);
    expect(result).not.toBeNull();
    expect(result!.decision).toBe("APPROVE");
    expect(result!.overall).toBe(7.5);
    expect(result!.dimensions.semantic_correctness).toBe(8);
    expect(result!.strengths).toHaveLength(2);
    expect(result!.fix_suggestions).toHaveLength(1);
    expect(result!.summary_zhTW).toBe("整體品質良好");
  });

  test("parses response wrapped in markdown fence", () => {
    const fenced = "```json\n" + VALID_RESPONSE + "\n```";
    const result = parseReviewResponse(fenced);
    expect(result).not.toBeNull();
    expect(result!.decision).toBe("APPROVE");
  });

  test("defaults to APPROVE_WITH_FIXES for invalid decision", () => {
    const resp = JSON.stringify({ ...JSON.parse(VALID_RESPONSE), decision: "MAYBE" });
    const result = parseReviewResponse(resp);
    expect(result!.decision).toBe("APPROVE_WITH_FIXES");
  });

  test("clamps out-of-range scores", () => {
    const obj = JSON.parse(VALID_RESPONSE);
    obj.dimensions.creative_quality = 15;
    obj.overall = -3;
    const result = parseReviewResponse(JSON.stringify(obj));
    expect(result!.dimensions.creative_quality).toBe(10);
    expect(result!.overall).toBe(0);
  });

  test("handles missing optional fields", () => {
    const minimal = JSON.stringify({
      decision: "BLOCK",
      dimensions: {
        semantic_correctness: 3,
        creative_quality: 2,
        genre_fit: 3,
        pacing: 2,
        character_consistency: 3,
        regression_vs_previous: 2,
      },
      overall: 2.5,
    });
    const result = parseReviewResponse(minimal);
    expect(result).not.toBeNull();
    expect(result!.strengths).toEqual([]);
    expect(result!.weaknesses).toEqual([]);
    expect(result!.fix_suggestions).toEqual([]);
    expect(result!.summary_zhTW).toBe("");
  });

  test("returns null for unparseable response", () => {
    expect(parseReviewResponse("not json at all")).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(parseReviewResponse("")).toBeNull();
  });

  test("filters invalid fix suggestions", () => {
    const obj = JSON.parse(VALID_RESPONSE);
    obj.fix_suggestions = [
      { target: "", suggestion: "", priority: "high" },
      { target: "pacing", suggestion: "fix it", priority: "invalid_priority" },
      42,
    ];
    const result = parseReviewResponse(JSON.stringify(obj));
    expect(result!.fix_suggestions).toHaveLength(1);
    expect(result!.fix_suggestions[0].priority).toBe("medium");
  });
});
