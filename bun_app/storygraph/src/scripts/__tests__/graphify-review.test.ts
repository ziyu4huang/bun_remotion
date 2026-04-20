/**
 * Tests for graphify-review.ts — Phase 33-D1.
 */

import { describe, test, expect } from "bun:test";
import { buildReviewPrompt, parseReviewResponse } from "../graphify-review";
import type { GateJson } from "../graphify-review";

function makeGate(overrides: Partial<GateJson> = {}): GateJson {
  return {
    version: "2.0",
    timestamp: "2026-04-20T00:00:00Z",
    series: "test-series",
    genre: "xianxia_comedy",
    generator: { mode: "hybrid", model: "glm-5" },
    score: 85,
    decision: "PASS",
    previous_score: null,
    quality_breakdown: {
      consistency: 0.8,
      arc_structure: 0.9,
      pacing: 0.7,
      character_growth: 0.85,
      thematic_coherence: 0.6,
      gag_evolution: null,
    },
    checks: [
      { name: "Node Count", status: "PASS", score_impact: 5, fix_suggestion_zhTW: "" },
      { name: "Plot Arc: climax", status: "WARN", score_impact: -5, fix_suggestion_zhTW: "加入高潮場景" },
    ],
    requires_claude_review: false,
    ...overrides,
  };
}

describe("buildReviewPrompt", () => {
  test("includes gate score and decision", () => {
    const prompt = buildReviewPrompt(makeGate(), null, {
      node_count: 50, edge_count: 60, node_types: { scene: 10, character_instance: 8 }, communities: 3,
    });
    expect(prompt).toContain("85/100");
    expect(prompt).toContain("PASS");
  });

  test("includes graph stats", () => {
    const prompt = buildReviewPrompt(makeGate(), null, {
      node_count: 100, edge_count: 200, node_types: { scene: 20, tech_term: 50 }, communities: 5,
    });
    expect(prompt).toContain("Nodes: 100");
    expect(prompt).toContain("Edges: 200");
    expect(prompt).toContain("Communities: 5");
    expect(prompt).toContain("tech_term: 50");
  });

  test("includes blended score when quality data present", () => {
    const quality = { blended: { overall: 0.748, decision: "ACCEPT" } };
    const prompt = buildReviewPrompt(makeGate(), quality, {
      node_count: 10, edge_count: 10, node_types: {}, communities: 0,
    });
    expect(prompt).toContain("74.8%");
  });

  test("shows no blended score when null", () => {
    const prompt = buildReviewPrompt(makeGate(), null, {
      node_count: 10, edge_count: 10, node_types: {}, communities: 0,
    });
    expect(prompt).toContain("no blended score");
  });

  test("lists WARN and FAIL checks", () => {
    const gate = makeGate({
      checks: [
        { name: "Pacing: flat", status: "WARN", score_impact: -5, fix_suggestion_zhTW: "" },
        { name: "Duplicate Content", status: "FAIL", score_impact: -15, fix_suggestion_zhTW: "" },
      ],
    });
    const prompt = buildReviewPrompt(gate, null, {
      node_count: 10, edge_count: 10, node_types: {}, communities: 0,
    });
    expect(prompt).toContain("[WARN] Pacing: flat");
    expect(prompt).toContain("[FAIL] Duplicate Content");
  });
});

describe("parseReviewResponse", () => {
  test("parses valid JSON response", () => {
    const response = JSON.stringify({
      decision: "ACCEPT",
      overall_quality: 8.5,
      dimensions: [
        { name: "extraction_completeness", score: 9, justification: "Good coverage" },
      ],
      fix_suggestions: [],
      reviewer_notes: "Strong extraction",
    });

    const result = parseReviewResponse(response);
    expect(result).not.toBeNull();
    expect(result!.decision).toBe("ACCEPT");
    expect(result!.overall_quality).toBe(8.5);
    expect(result!.dimensions).toHaveLength(1);
    expect(result!.reviewer_notes).toBe("Strong extraction");
  });

  test("strips markdown fences", () => {
    const inner = JSON.stringify({
      decision: "REVIEW",
      overall_quality: 5.0,
      dimensions: [],
      fix_suggestions: [{ target: "Plot Arc", action: "加入高潮", priority: "high", estimated_impact: 15 }],
      reviewer_notes: "Needs work",
    });

    const response = "```json\n" + inner + "\n```";
    const result = parseReviewResponse(response);
    expect(result).not.toBeNull();
    expect(result!.decision).toBe("REVIEW");
    expect(result!.fix_suggestions).toHaveLength(1);
    expect(result!.fix_suggestions[0].target).toBe("Plot Arc");
  });

  test("returns null for unparseable input", () => {
    expect(parseReviewResponse("not json")).toBeNull();
    expect(parseReviewResponse("")).toBeNull();
    expect(parseReviewResponse("```json\nnot valid\n```")).toBeNull();
  });

  test("returns null for missing required fields", () => {
    expect(parseReviewResponse('{"decision": "ACCEPT"}')).toBeNull();
    expect(parseReviewResponse('{"overall_quality": 7}')).toBeNull();
  });

  test("handles missing optional arrays", () => {
    const response = JSON.stringify({
      decision: "REJECT",
      overall_quality: 3.0,
    });
    const result = parseReviewResponse(response);
    expect(result).not.toBeNull();
    expect(result!.dimensions).toEqual([]);
    expect(result!.fix_suggestions).toEqual([]);
    expect(result!.reviewer_notes).toBe("");
  });
});
