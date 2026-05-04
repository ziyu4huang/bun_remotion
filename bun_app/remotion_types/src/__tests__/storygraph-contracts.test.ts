import { describe, test, expect } from "bun:test";
import {
  isPipelineResponse,
  isCheckResponse,
  isScoreResponse,
  isGateFile,
} from "../storygraph-contracts";
import type {
  PipelineResponse,
  CheckResponse,
  ScoreResponse,
  GateFile,
  PipelineStatusResponse,
  SuggestResponse,
  HealthResponse,
} from "../storygraph-contracts";

describe("storygraph-contracts: type guards", () => {
  describe("isPipelineResponse", () => {
    test("accepts valid PipelineResponse", () => {
      const valid: PipelineResponse = {
        success: true,
        seriesDir: "/path/to/series",
        outputDir: "/path/to/series/storygraph_out",
        steps: [
          { step: "episode", success: true, duration_ms: 1200, message: "3 episodes processed" },
          { step: "merge", success: true, duration_ms: 300 },
        ],
        errors: [],
      };
      expect(isPipelineResponse(valid)).toBe(true);
    });

    test("accepts PipelineResponse with errors", () => {
      const withErrors: PipelineResponse = {
        success: false,
        seriesDir: "/path",
        outputDir: "/path/out",
        steps: [],
        errors: ["Merge failed", "Check failed"],
      };
      expect(isPipelineResponse(withErrors)).toBe(true);
    });

    test("rejects null", () => {
      expect(isPipelineResponse(null)).toBe(false);
    });

    test("rejects missing required fields", () => {
      expect(isPipelineResponse({ success: true })).toBe(false);
      expect(isPipelineResponse({ seriesDir: "/path" })).toBe(false);
    });

    test("rejects wrong types", () => {
      expect(isPipelineResponse({ success: "yes", seriesDir: 1, steps: {}, errors: [] })).toBe(false);
    });
  });

  describe("isCheckResponse", () => {
    test("accepts valid CheckResponse", () => {
      const valid: CheckResponse = {
        success: true,
        seriesDir: "/path/to/series",
        gatePath: "/path/to/series/storygraph_out/gate.json",
        gateScore: 85,
        gateDecision: "PASS",
        checks: [
          { name: "Foreshadow Tracking", status: "PASS", score_impact: 0 },
          { name: "Trait Coverage", status: "WARN", score_impact: -5 },
        ],
        errors: [],
      };
      expect(isCheckResponse(valid)).toBe(true);
    });

    test("accepts CheckResponse with empty checks", () => {
      const minimal: CheckResponse = {
        success: false,
        seriesDir: "/path",
        gatePath: "/path/gate.json",
        gateScore: 0,
        gateDecision: "FAIL",
        checks: [],
        errors: ["No gate.json produced"],
      };
      expect(isCheckResponse(minimal)).toBe(true);
    });

    test("rejects null and primitives", () => {
      expect(isCheckResponse(null)).toBe(false);
      expect(isCheckResponse(42)).toBe(false);
      expect(isCheckResponse("string")).toBe(false);
    });
  });

  describe("isScoreResponse", () => {
    test("accepts valid ScoreResponse with AI score", () => {
      const valid: ScoreResponse = {
        success: true,
        seriesDir: "/path",
        outputPath: "/path/kg-quality-score.json",
        blended: { overall: 0.78, decision: "ACCEPT", formula: "0.4 × programmatic + 0.6 × ai" },
        programmatic: { score: 85, decision: "PASS" },
        ai: { overall: 7.5, justification: "Strong character development" },
        errors: [],
      };
      expect(isScoreResponse(valid)).toBe(true);
    });

    test("accepts ScoreResponse without AI score", () => {
      const noAi: ScoreResponse = {
        success: true,
        seriesDir: "/path",
        outputPath: "/path/kg-quality-score.json",
        blended: { overall: 0.85, decision: "ACCEPT", formula: "programmatic only" },
        programmatic: { score: 85, decision: "PASS" },
        ai: null,
        errors: [],
      };
      expect(isScoreResponse(noAi)).toBe(true);
    });

    test("rejects missing blended.overall", () => {
      expect(isScoreResponse({ success: true, blended: {} })).toBe(false);
    });
  });

  describe("isGateFile", () => {
    test("accepts valid GateFile", () => {
      const valid: GateFile = {
        score: 85,
        decision: "PASS",
        checks: [
          { name: "Foreshadow Tracking", status: "PASS", score_impact: 0 },
        ],
        quality_breakdown: {
          consistency: 0.9,
          arc_structure: 0.8,
          pacing: 0.75,
        },
      };
      expect(isGateFile(valid)).toBe(true);
    });

    test("accepts GateFile without quality_breakdown", () => {
      const minimal: GateFile = {
        score: 50,
        decision: "WARN",
        checks: [],
      };
      expect(isGateFile(minimal)).toBe(true);
    });

    test("rejects objects missing required fields", () => {
      expect(isGateFile({ score: 85 })).toBe(false);
      expect(isGateFile({ decision: "PASS" })).toBe(false);
      expect(isGateFile({ checks: [] })).toBe(false);
    });

    test("rejects wrong types for score/decision", () => {
      expect(isGateFile({ score: "85", decision: "PASS", checks: [] })).toBe(false);
      expect(isGateFile({ score: 85, decision: true, checks: [] })).toBe(false);
    });
  });
});

describe("storygraph-contracts: structural completeness", () => {
  test("PipelineStatusResponse has all optional fields", () => {
    const status: PipelineStatusResponse = {
      hasEpisodeData: true,
      hasMergedGraph: true,
      hasGate: true,
      hasQualityScore: true,
      hasHTML: true,
      gateScore: 85,
      gateDecision: "PASS",
      blendedScore: 0.78,
      blendedDecision: "ACCEPT",
      episodeCount: 5,
      nodeCount: 120,
      edgeCount: 250,
    };
    expect(status.gateScore).toBe(85);
    expect(status.nodeCount).toBe(120);
  });

  test("SuggestResponse has suggestion array", () => {
    const response: SuggestResponse = {
      success: true,
      seriesDir: "/path",
      genre: "xianxia_comedy",
      episodeCount: 5,
      latestEpisode: "ch01ep05",
      suggestions: [
        {
          category: "foreshadow_debt",
          severity: "high",
          description_zhTW: "伏筆未回收",
          affectedCharacters: [],
          affectedEpisodes: ["ch01ep01"],
          fixHint: "在下一集中安排回收",
        },
      ],
      storyDebtCount: 1,
      errors: [],
    };
    expect(response.suggestions).toHaveLength(1);
    expect(response.suggestions[0].severity).toBe("high");
  });

  test("HealthResponse has dimensions and debt items", () => {
    const response: HealthResponse = {
      success: true,
      seriesDir: "/path",
      genre: "xianxia_comedy",
      episodeCount: 5,
      latestEpisode: "ch01ep05",
      gateScore: 85,
      gateDecision: "PASS",
      dimensions: [
        { name: "characters", status: "good", summary_zhTW: "角色一致性 90%", score: 0.9 },
        { name: "arc", status: "warn", summary_zhTW: "劇情弧線 65%", score: 0.65 },
      ],
      storyDebtCount: 1,
      storyDebtItems: ["arc: 劇情弧線 65%"],
      errors: [],
    };
    expect(response.dimensions).toHaveLength(2);
    expect(response.storyDebtItems).toHaveLength(1);
  });

  test("all PipelineMode values are valid strings", () => {
    const modes: Array<"regex" | "ai" | "hybrid"> = ["regex", "ai", "hybrid"];
    expect(modes).toHaveLength(3);
    for (const m of modes) {
      expect(["regex", "ai", "hybrid"]).toContain(m);
    }
  });
});
