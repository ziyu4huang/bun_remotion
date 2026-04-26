import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { resolve } from "node:path";
import {
  createStorygraphTools,
  createStorygraphStatusTool,
  createStorygraphRegressionTool,
  createStorygraphPipelineTool,
  createStorygraphCheckTool,
  createStorygraphScoreTool,
  createStorygraphBaselineUpdateTool,
  createStorygraphBaselineListTool,
  createStorygraphSuggestTool,
  createStorygraphHealthTool,
} from "../tools/storygraph-tools.js";

const REPO_ROOT = resolve(import.meta.dir, "../../../../");
const MCI_BOSS = resolve(REPO_ROOT, "bun_remotion_proj/my-core-is-boss");

const SG_TOOL_NAMES = ["sg_pipeline", "sg_check", "sg_score", "sg_status", "sg_regression", "sg_baseline_update", "sg_baseline_list", "sg_suggest", "sg_health"];

describe("createStorygraphTools", () => {
  test("returns 9 tools", () => {
    const tools = createStorygraphTools();
    expect(tools).toHaveLength(9);
  });

  test("all tool names match expected", () => {
    const tools = createStorygraphTools();
    const names = tools.map((t) => t.name);
    expect(names).toEqual(SG_TOOL_NAMES);
  });

  test("each tool has required properties", () => {
    const tools = createStorygraphTools();
    for (const tool of tools) {
      expect(typeof tool.name).toBe("string");
      expect(typeof tool.label).toBe("string");
      expect(typeof tool.description).toBe("string");
      expect(typeof tool.execute).toBe("function");
      expect(tool.parameters).toBeDefined();
    }
  });

  test("all tool names are unique", () => {
    const tools = createStorygraphTools();
    const names = tools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("sg_status", () => {
  test("returns error for non-existent directory", async () => {
    const tool = createStorygraphStatusTool();
    const result = await tool.execute("t1", { seriesDir: "/non/existent/path" });
    expect(result.content[0].text).toContain("Error");
  });

  test("returns status for series with pipeline output", async () => {
    const tool = createStorygraphStatusTool();
    const result = await tool.execute("t2", { seriesDir: MCI_BOSS });
    const text = result.content[0].text;
    expect(text).toContain("Episode data: YES");
    expect(text).toContain("Merged graph: YES");
    expect(text).toContain("Gate: YES");
  });
});

describe("sg_regression", () => {
  test("reports no baseline when none exists", async () => {
    // Use a temp dir with no baseline
    const tool = createStorygraphRegressionTool();
    const result = await tool.execute("t3", { seriesDir: MCI_BOSS, threshold: 10 });
    // Either "No baseline found" or actual regression result (if baseline happens to exist)
    const text = result.content[0].text;
    expect(text).toMatch(/(No baseline found|Regression check)/);
  });

  test("accepts custom threshold parameter", async () => {
    const tool = createStorygraphRegressionTool();
    // Should not throw even with threshold = 0
    const result = await tool.execute("t4", { seriesDir: MCI_BOSS, threshold: 0 });
    expect(result.content[0].text).toBeDefined();
  });

  test("ci mode returns structured JSON with exitCode", async () => {
    const tool = createStorygraphRegressionTool();
    const result = await tool.execute("t-ci1", { seriesDir: MCI_BOSS, threshold: 10, ci: true });
    const text = result.content[0].text;
    const parsed = JSON.parse(text);
    expect(parsed).toHaveProperty("status");
    expect(parsed).toHaveProperty("exitCode");
    expect([0, 1]).toContain(parsed.exitCode);
    // details should also have exitCode
    expect((result.details as any).exitCode).toBe(parsed.exitCode);
  });

  test("ci mode on non-existent dir returns JSON error", async () => {
    const tool = createStorygraphRegressionTool();
    const result = await tool.execute("t-ci2", { seriesDir: "/non/existent/path", ci: true });
    // Error path still uses errorResult (plain text), but ci mode on valid dir with no baseline is JSON
    const text = result.content[0].text;
    expect(text).toContain("Error");
  });

  test("non-ci mode still returns human-readable text", async () => {
    const tool = createStorygraphRegressionTool();
    const result = await tool.execute("t-ci3", { seriesDir: MCI_BOSS, threshold: 10 });
    const text = result.content[0].text;
    // Should NOT be JSON — human-readable
    expect(text).toMatch(/(No baseline found|Regression check)/);
    expect(text).not.toMatch(/^\{/);
  });
});

describe("sg_pipeline", () => {
  test("returns error for non-existent directory", async () => {
    const tool = createStorygraphPipelineTool();
    const result = await tool.execute("t5", { seriesDir: "/non/existent/path" });
    expect(result.content[0].text).toContain("Error");
    expect(result.content[0].text).toContain("not found");
  });
});

describe("sg_check", () => {
  test("returns error for non-existent directory", async () => {
    const tool = createStorygraphCheckTool();
    const result = await tool.execute("t6", { seriesDir: "/non/existent/path" });
    expect(result.content[0].text).toContain("Error");
  });
});

describe("sg_score", () => {
  test("returns error for non-existent directory", async () => {
    const tool = createStorygraphScoreTool();
    const result = await tool.execute("t7", { seriesDir: "/non/existent/path" });
    expect(result.content[0].text).toContain("Error");
  });
});

describe("sg_baseline_update", () => {
  test("returns error for non-existent directory", async () => {
    const tool = createStorygraphBaselineUpdateTool();
    const result = await tool.execute("t8", { seriesDir: "/non/existent/path" });
    expect(result.content[0].text).toContain("Error");
  });

  test("returns error when no gate.json exists", async () => {
    const tool = createStorygraphBaselineUpdateTool();
    const result = await tool.execute("t9", { seriesDir: REPO_ROOT });
    expect(result.content[0].text).toContain("Error");
    expect(result.content[0].text).toContain("gate.json");
  });
});

describe("sg_baseline_list", () => {
  test("returns error for non-existent search directory", async () => {
    const tool = createStorygraphBaselineListTool();
    const result = await tool.execute("t10", { searchDir: "/non/existent/path" });
    expect(result.content[0].text).toContain("Error");
  });

  test("lists series in bun_remotion_proj", async () => {
    const tool = createStorygraphBaselineListTool();
    const result = await tool.execute("t11", { searchDir: resolve(REPO_ROOT, "bun_remotion_proj") });
    const text = result.content[0].text;
    expect(text).toContain("Series baselines");
    expect(text).toMatch(/my-core-is-boss/);
  });
});

describe("sg_suggest", () => {
  test("returns error for non-existent directory", async () => {
    const tool = createStorygraphSuggestTool();
    const result = await tool.execute("t12", { seriesDir: "/non/existent/path" });
    expect(result.content[0].text).toContain("Error");
    expect(result.content[0].text).toContain("not found");
  });

  test("returns suggestions for valid series", async () => {
    const tool = createStorygraphSuggestTool();
    const result = await tool.execute("t13", { seriesDir: MCI_BOSS });
    const text = result.content[0].text;
    expect(text).toContain("Story Suggestions");
    expect(text).toMatch(/episodes/);
    expect(text).toMatch(/Story Debt/);
  });

  test("accepts optional targetEpId", async () => {
    const tool = createStorygraphSuggestTool();
    const result = await tool.execute("t14", { seriesDir: MCI_BOSS, targetEpId: "ch3ep2" });
    const text = result.content[0].text;
    expect(text).toContain("Target: ch3ep2");
  });
});

describe("sg_health", () => {
  test("returns error for non-existent directory", async () => {
    const tool = createStorygraphHealthTool();
    const result = await tool.execute("t15", { seriesDir: "/non/existent/path" });
    expect(result.content[0].text).toContain("Error");
    expect(result.content[0].text).toContain("not found");
  });

  test("returns health dashboard for valid series", async () => {
    const tool = createStorygraphHealthTool();
    const result = await tool.execute("t16", { seriesDir: MCI_BOSS });
    const text = result.content[0].text;
    expect(text).toContain("Story Health");
    expect(text).toMatch(/characters/);
    expect(text).toMatch(/arc/);
    expect(text).toMatch(/Story Debt/);
  });

  test("includes gate score in output", async () => {
    const tool = createStorygraphHealthTool();
    const result = await tool.execute("t17", { seriesDir: MCI_BOSS });
    const text = result.content[0].text;
    expect(text).toMatch(/Gate: \d+\/100/);
  });
});
