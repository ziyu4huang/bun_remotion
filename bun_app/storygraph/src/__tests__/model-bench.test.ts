import { describe, test, expect } from "bun:test";
import {
  computeMean,
  computeStddev,
  summarizeModel,
  generateBenchReport,
  buildAccuracyPrompt,
  sampleNodes,
  parseAccuracyResponse,
  type RunResult,
  type AccuracySample,
} from "../scripts/graphify-model-bench";

describe("model-bench: computeMean", () => {
  test("empty array returns 0", () => {
    expect(computeMean([])).toBe(0);
  });

  test("single value", () => {
    expect(computeMean([42])).toBe(42);
  });

  test("multiple values", () => {
    expect(computeMean([10, 20, 30])).toBeCloseTo(20);
  });
});

describe("model-bench: computeStddev", () => {
  test("empty array returns 0", () => {
    expect(computeStddev([])).toBe(0);
  });

  test("single value returns 0", () => {
    expect(computeStddev([42])).toBe(0);
  });

  test("two values", () => {
    // [10, 20] -> mean=15, variance=50, stddev≈7.07
    expect(computeStddev([10, 20])).toBeCloseTo(7.07, 1);
  });

  test("constant values returns 0", () => {
    expect(computeStddev([5, 5, 5, 5])).toBe(0);
  });
});

describe("model-bench: summarizeModel", () => {
  const makeRun = (gate: number, blended: number | null, success: boolean): RunResult => ({
    model: "test",
    runIndex: 0,
    totalNodes: 50,
    totalEdges: 40,
    nodeTypes: {},
    gateScore: gate,
    gateDecision: success ? "PASS" : "FAIL",
    passCount: 10,
    warnCount: 2,
    failCount: 0,
    blendedScore: blended,
    aiScore: null,
    success,
    durationMs: 5000,
  });

  test("single successful run", () => {
    const runs = [makeRun(80, 0.7, true)];
    const summary = summarizeModel("test", runs);
    expect(summary.runs).toBe(1);
    expect(summary.successRate).toBe(1);
    expect(summary.avgGateScore).toBe(80);
    expect(summary.stddevGateScore).toBe(0);
    expect(summary.avgBlendedScore).toBe(0.7);
    expect(summary.avgNodes).toBe(50);
  });

  test("multiple runs with variance", () => {
    const runs = [
      { ...makeRun(80, 0.7, true), runIndex: 0 },
      { ...makeRun(60, 0.5, true), runIndex: 1 },
      { ...makeRun(70, 0.6, true), runIndex: 2 },
    ];
    const summary = summarizeModel("test", runs);
    expect(summary.runs).toBe(3);
    expect(summary.successRate).toBe(1);
    expect(summary.avgGateScore).toBeCloseTo(70);
    expect(summary.stddevGateScore).toBeCloseTo(10, 1);
    expect(summary.avgBlendedScore).toBeCloseTo(0.6, 2);
  });

  test("failed runs excluded from averages", () => {
    const runs = [
      makeRun(80, 0.7, true),
      { ...makeRun(0, null, false), success: false },
    ];
    const summary = summarizeModel("test", runs);
    expect(summary.runs).toBe(2);
    expect(summary.successRate).toBe(0.5);
    expect(summary.avgGateScore).toBe(80);
    expect(summary.avgBlendedScore).toBe(0.7);
  });

  test("no blended scores returns null", () => {
    const runs = [{ ...makeRun(80, null, true) }];
    const summary = summarizeModel("test", runs);
    expect(summary.avgBlendedScore).toBeNull();
  });
});

describe("model-bench: generateBenchReport", () => {
  test("generates valid markdown report", () => {
    const runs: RunResult[] = [
      {
        model: "glm-5", runIndex: 0, totalNodes: 100, totalEdges: 80,
        nodeTypes: { scene: 10, tech_term: 20 }, gateScore: 85, gateDecision: "PASS",
        passCount: 15, warnCount: 2, failCount: 0, blendedScore: 0.78,
        aiScore: 7, success: true, durationMs: 5000,
      },
    ];
    const summaries = [summarizeModel("glm-5", runs)];
    const report = generateBenchReport(summaries, [], "test-series", ["glm-5"]);

    expect(report).toContain("# Model Benchmark Report");
    expect(report).toContain("test-series");
    expect(report).toContain("glm-5");
    expect(report).toContain("85.0");
    expect(report).toContain("78.0%");
  });

  test("includes accuracy sampling results", () => {
    const accuracy: AccuracySample[] = [{
      model: "glm-5", sampledNodes: 15, correctNodes: 12, precision: 0.8,
      details: [
        { id: "n1", type: "scene", label: "TitleScene", correct: true, reason: "Real scene" },
        { id: "n2", type: "tech_term", label: "foobar", correct: false, reason: "Hallucinated" },
      ],
    }];
    const report = generateBenchReport([], accuracy, "test", ["glm-5"]);
    expect(report).toContain("## Accuracy Sampling");
    expect(report).toContain("80.0%");
    expect(report).toContain("Hallucinated");
  });
});

describe("model-bench: buildAccuracyPrompt", () => {
  test("includes all nodes in prompt", () => {
    const nodes = [
      { id: "n1", type: "scene", label: "TitleScene", episode: "ep1" },
      { id: "n2", type: "character", label: "Alice", episode: "ep1" },
    ];
    const prompt = buildAccuracyPrompt(nodes, "test-series");
    expect(prompt).toContain("test-series");
    expect(prompt).toContain("[scene] TitleScene");
    expect(prompt).toContain("[character] Alice");
    expect(prompt).toContain('"evaluations"');
  });
});

describe("model-bench: sampleNodes", () => {
  test("filters episode_plot and narrator nodes", () => {
    const merged = {
      nodes: [
        { id: "n1", type: "episode_plot", label: "plot" },
        { id: "n2", type: "narrator", label: "narrator" },
        { id: "n3", type: "scene", label: "TitleScene" },
        { id: "n4", type: "character", label: "Alice", episode: "ep1" },
      ],
    };
    const sampled = sampleNodes(merged, 10);
    expect(sampled.length).toBe(2);
    expect(sampled.every(n => n.type !== "episode_plot" && n.type !== "narrator")).toBe(true);
  });

  test("respects count limit", () => {
    const nodes = Array.from({ length: 30 }, (_, i) => ({
      id: `n${i}`, type: "scene", label: `Scene${i}`, episode: "ep1",
    }));
    const merged = { nodes };
    const sampled = sampleNodes(merged, 10);
    expect(sampled.length).toBe(10);
  });

  test("extracts episode from id when episode field missing", () => {
    const merged = {
      nodes: [
        { id: "ch1ep1_scene_title", type: "scene", label: "Title" },
        { id: "ep5_char_alice", type: "character", label: "Alice" },
      ],
    };
    const sampled = sampleNodes(merged, 10);
    expect(sampled[0].episode).toBe("ch1ep1");
    expect(sampled[1].episode).toBe("ep5");
  });
});

describe("model-bench: parseAccuracyResponse", () => {
  test("parses valid JSON response", () => {
    const response = JSON.stringify({
      evaluations: [
        { id: "n1", correct: true, reason: "Real scene" },
        { id: "n2", correct: false, reason: "Hallucinated" },
      ],
    });
    const nodes = [
      { id: "n1", type: "scene", label: "Title" },
      { id: "n2", type: "tech_term", label: "fake" },
    ];
    const details = parseAccuracyResponse(response, nodes);
    expect(details.length).toBe(2);
    expect(details[0].correct).toBe(true);
    expect(details[0].type).toBe("scene");
    expect(details[1].correct).toBe(false);
  });

  test("returns empty array for invalid JSON", () => {
    const details = parseAccuracyResponse("not json", []);
    expect(details.length).toBe(0);
  });
});
