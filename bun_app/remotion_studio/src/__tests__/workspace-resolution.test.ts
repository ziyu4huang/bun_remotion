import { describe, test, expect } from "bun:test";

/**
 * Workspace resolution tests — verify that remotion_studio can import
 * all exposed storygraph sub-path exports through workspace dependency.
 */

describe("workspace resolution: storygraph package", () => {
  test("resolves storygraph/pipeline-api sub-path", async () => {
    const mod = await import("storygraph/pipeline-api");
    expect(typeof mod.runPipeline).toBe("function");
    expect(typeof mod.runCheck).toBe("function");
    expect(typeof mod.runScore).toBe("function");
    expect(typeof mod.getPipelineStatus).toBe("function");
    expect(typeof mod.runSuggest).toBe("function");
    expect(typeof mod.runHealth).toBe("function");
  });

  test("resolves storygraph/plan-parser sub-path", async () => {
    const mod = await import("storygraph/plan-parser");
    expect(typeof mod.parsePlan).toBe("function");
    expect(typeof mod.splitSections).toBe("function");
  });

  test("resolves storygraph/types sub-path", async () => {
    const mod = await import("storygraph/types");
    // Type-only exports — verify module loaded without error
    expect(mod).toBeDefined();
  });

  test("resolves storygraph main barrel", async () => {
    const mod = await import("storygraph");
    // CLI barrel — may not export functions, but should resolve
    expect(mod).toBeDefined();
  });
});
