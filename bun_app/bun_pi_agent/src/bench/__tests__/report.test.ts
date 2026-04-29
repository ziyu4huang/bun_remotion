import { describe, test, expect } from "bun:test";
import { generateReport, type BenchmarkReport } from "../report.js";

const makeAgentResult = (overrides: Partial<import("../report.js").AgentTaskResult> = {}) => ({
  taskId: "task1-file-read",
  taskName: "File read + summarize",
  model: "zai/glm-5",
  toolUseScore: 3,
  responseScore: 2,
  efficiencyScore: 3,
  totalScore: 8,
  toolCalls: ["Read"],
  textLength: 500,
  durationMs: 12000,
  turnCount: 2,
  toolCallBudget: 15,
  budgetExceeded: false,
  ...overrides,
});

describe("generateReport", () => {
  test("generates KG-only report", () => {
    const report: BenchmarkReport = {
      date: "2026-04-28",
      seriesDir: "/tmp/test-series",
      models: ["zai/glm-5"],
      kgResults: [{
        model: "zai/glm-5",
        gateScore: 87.5,
        blendedScore: 82.3,
        nodeCount: 342,
        edgeCount: 518,
        durationMs: 45000,
        success: true,
      }],
      agentResults: [],
    };

    const md = generateReport(report);
    expect(md).toContain("GLM5 Model Benchmark Report");
    expect(md).toContain("Suite A: KG Quality");
    expect(md).toContain("87.5");
    expect(md).toContain("342");
    expect(md).toContain("45.0s");
    expect(md).toContain("OK");
    expect(md).not.toContain("Suite B");
  });

  test("generates agent-only report", () => {
    const report: BenchmarkReport = {
      date: "2026-04-28",
      seriesDir: "/tmp/test-series",
      models: ["zai/glm-5"],
      kgResults: [],
      agentResults: [makeAgentResult()],
    };

    const md = generateReport(report);
    expect(md).toContain("Suite B: Agent Coding");
    expect(md).toContain("8/10");
    expect(md).toContain("Read");
    expect(md).not.toContain("Suite A");
  });

  test("shows turn count and budget in detail section", () => {
    const report: BenchmarkReport = {
      date: "2026-04-28",
      seriesDir: "/tmp/test-series",
      models: ["zai/glm-5"],
      kgResults: [],
      agentResults: [makeAgentResult({ turnCount: 5, toolCallBudget: 15, budgetExceeded: false })],
    };

    const md = generateReport(report);
    expect(md).toContain("Turns: 5");
    expect(md).toContain("1/15");
  });

  test("shows BUDGET EXCEEDED when applicable", () => {
    const report: BenchmarkReport = {
      date: "2026-04-28",
      seriesDir: "/tmp/test-series",
      models: ["zai/glm-5"],
      kgResults: [],
      agentResults: [makeAgentResult({ budgetExceeded: true, toolCalls: Array(16).fill("Bash") })],
    };

    const md = generateReport(report);
    expect(md).toContain("BUDGET EXCEEDED");
  });

  test("shows model efficiency summary", () => {
    const report: BenchmarkReport = {
      date: "2026-04-28",
      seriesDir: "/tmp/test-series",
      models: ["zai/glm-5", "zai/glm-5-turbo"],
      kgResults: [],
      agentResults: [
        makeAgentResult({ model: "zai/glm-5", toolCalls: ["Read", "Bash", "Bash"], turnCount: 3, durationMs: 10000 }),
        makeAgentResult({ model: "zai/glm-5-turbo", toolCalls: ["Read"], turnCount: 1, durationMs: 5000 }),
      ],
    };

    const md = generateReport(report);
    expect(md).toContain("Model Efficiency Summary");
    expect(md).toContain("Avg Tool Calls");
    expect(md).toContain("Avg Turns");
    expect(md).toContain("Budget Exceeded");
  });

  test("shows recommendation section", () => {
    const report: BenchmarkReport = {
      date: "2026-04-28",
      seriesDir: "/tmp/test-series",
      models: ["zai/glm-5", "zai/glm-5-turbo"],
      kgResults: [],
      agentResults: [
        makeAgentResult({ model: "zai/glm-5", totalScore: 8, durationMs: 10000 }),
        makeAgentResult({ model: "zai/glm-5-turbo", totalScore: 9, durationMs: 5000 }),
      ],
    };

    const md = generateReport(report);
    expect(md).toContain("Recommendation");
    expect(md).toContain("Best quality");
    expect(md).toContain("Best efficiency");
    expect(md).toContain("Best speed");
    expect(md).toContain("Best value");
    expect(md).toContain("Recommended default");
  });

  test("recommendation picks best quality, efficiency, speed, value correctly", () => {
    const report: BenchmarkReport = {
      date: "2026-04-28",
      seriesDir: "/tmp/test-series",
      models: ["zai/glm-5", "zai/glm-5-turbo", "zai/glm-4.5-air"],
      kgResults: [],
      agentResults: [
        // glm-5: high quality, slow, moderate efficiency
        makeAgentResult({ model: "zai/glm-5", totalScore: 9, efficiencyScore: 2, durationMs: 20000 }),
        // glm-5-turbo: moderate quality, fast, high efficiency
        makeAgentResult({ model: "zai/glm-5-turbo", totalScore: 7, efficiencyScore: 3, durationMs: 5000 }),
        // glm-4.5-air: low quality, fastest, moderate efficiency
        makeAgentResult({ model: "zai/glm-4.5-air", totalScore: 5, efficiencyScore: 2, durationMs: 3000 }),
      ],
    };

    const md = generateReport(report);
    expect(md).toContain("Best quality:** zai/glm-5");
    expect(md).toContain("Best efficiency:** zai/glm-5-turbo");
    expect(md).toContain("Best speed:** zai/glm-4.5-air");
  });

  test("recommendation penalizes budget-exceeded models", () => {
    const report: BenchmarkReport = {
      date: "2026-04-28",
      seriesDir: "/tmp/test-series",
      models: ["zai/glm-5", "zai/glm-5-turbo"],
      kgResults: [],
      agentResults: [
        makeAgentResult({ model: "zai/glm-5", totalScore: 9, efficiencyScore: 0.5, budgetExceeded: true, durationMs: 10000 }),
        makeAgentResult({ model: "zai/glm-5-turbo", totalScore: 7, efficiencyScore: 3, budgetExceeded: false, durationMs: 8000 }),
      ],
    };

    const md = generateReport(report);
    expect(md).toContain("Best quality:** zai/glm-5");
    // Best value should prefer glm-5-turbo (no budget penalty)
    expect(md).toContain("Best value:** zai/glm-5-turbo");
  });

  test("generates full report with both suites", () => {
    const report: BenchmarkReport = {
      date: "2026-04-28",
      seriesDir: "/tmp/test-series",
      models: ["zai/glm-5", "zai/glm-5-turbo"],
      kgResults: [
        { model: "zai/glm-5", gateScore: 90, blendedScore: 85, nodeCount: 300, edgeCount: 400, durationMs: 30000, success: true },
        { model: "zai/glm-5-turbo", gateScore: 80, blendedScore: 75, nodeCount: 280, edgeCount: 350, durationMs: 15000, success: true },
      ],
      agentResults: [
        makeAgentResult({ model: "zai/glm-5", totalScore: 10, toolUseScore: 4, responseScore: 3, efficiencyScore: 3 }),
        makeAgentResult({ model: "zai/glm-5-turbo", totalScore: 8, toolUseScore: 3, responseScore: 2, efficiencyScore: 3, durationMs: 5000 }),
      ],
    };

    const md = generateReport(report);
    expect(md).toContain("Suite A: KG Quality");
    expect(md).toContain("Suite B: Agent Coding");
    expect(md).toContain("zai/glm-5");
    expect(md).toContain("zai/glm-5-turbo");
  });

  test("handles failed KG results", () => {
    const report: BenchmarkReport = {
      date: "2026-04-28",
      seriesDir: "/tmp/test",
      models: ["zai/glm-5"],
      kgResults: [{
        model: "zai/glm-5",
        gateScore: null,
        blendedScore: null,
        nodeCount: 0,
        edgeCount: 0,
        durationMs: 5000,
        success: false,
        error: "API timeout",
      }],
      agentResults: [],
    };

    const md = generateReport(report);
    expect(md).toContain("FAIL");
    expect(md).toContain("API timeout");
  });
});
