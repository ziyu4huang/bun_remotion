import { describe, test, expect, beforeEach } from "bun:test";
import { MockToolRegistry, STANDARD_MOCKS, expectToolCalled, expectToolCallCount, expectToolNotCalled } from "../agents/mock-registry.js";

describe("MockToolRegistry", () => {
  let registry: MockToolRegistry;

  beforeEach(() => {
    registry = new MockToolRegistry();
  });

  test("register and create mock tool", () => {
    registry.register("sg_pipeline", STANDARD_MOCKS.sg_pipeline);
    const tools = registry.createMockTools(["sg_pipeline"]);
    expect(tools).toHaveLength(1);
    expect(tools[0].description).toContain("Mock");
  });

  test("mock tool execute returns registered response", async () => {
    registry.register("sg_pipeline", STANDARD_MOCKS.sg_pipeline);
    const tool = registry.createMockTool("sg_pipeline");
    const result = await tool.execute({ seriesId: "weapon-forger" });
    expect(result.text).toContain("Pipeline completed");
    expect(result.details).toBeDefined();
  });

  test("mock tool with function handler receives args", async () => {
    registry.register("sc_scaffold", (args) => ({
      text: `Scaffolded ${args.series} ch${args.chapter} ep${args.episode}`,
      details: { tool: "sc_scaffold", success: true, data: args },
    }));
    const tool = registry.createMockTool("sc_scaffold");
    const result = await tool.execute({ series: "weapon-forger", chapter: 1, episode: 3 });
    expect(result.text).toContain("weapon-forger ch1 ep3");
  });

  test("unregistered tool returns error response", async () => {
    const tool = registry.createMockTool("nonexistent");
    const result = await tool.execute({});
    expect(result.text).toContain("no registered response");
  });

  test("records tool calls", async () => {
    registry.register("sg_pipeline", STANDARD_MOCKS.sg_pipeline);
    registry.register("sg_check", STANDARD_MOCKS.sg_check);
    const tools = registry.createMockTools(["sg_pipeline", "sg_check"]);

    await tools[0].execute({ seriesId: "weapon-forger" });
    await tools[1].execute({ seriesId: "weapon-forger" });

    const calls = registry.getCalls();
    expect(calls).toHaveLength(2);
    expect(calls[0].name).toBe("sg_pipeline");
    expect(calls[1].name).toBe("sg_check");
  });

  test("wasCalled and callCount", async () => {
    registry.register("sg_pipeline", STANDARD_MOCKS.sg_pipeline);
    const tool = registry.createMockTool("sg_pipeline");

    expect(registry.wasCalled("sg_pipeline")).toBe(false);
    await tool.execute({ seriesId: "test" });
    expect(registry.wasCalled("sg_pipeline")).toBe(true);
    expect(registry.callCount("sg_pipeline")).toBe(1);

    await tool.execute({ seriesId: "test2" });
    expect(registry.callCount("sg_pipeline")).toBe(2);
  });

  test("getCallsFor filters by name", async () => {
    registry.register("sg_pipeline", STANDARD_MOCKS.sg_pipeline);
    registry.register("sg_check", STANDARD_MOCKS.sg_check);
    const tools = registry.createMockTools(["sg_pipeline", "sg_check"]);

    await tools[0].execute({ seriesId: "test" });
    await tools[1].execute({ seriesId: "test" });
    await tools[0].execute({ seriesId: "test2" });

    expect(registry.getCallsFor("sg_pipeline")).toHaveLength(2);
    expect(registry.getCallsFor("sg_check")).toHaveLength(1);
  });

  test("reset clears recorded calls", async () => {
    registry.register("sg_pipeline", STANDARD_MOCKS.sg_pipeline);
    const tool = registry.createMockTool("sg_pipeline");
    await tool.execute({ seriesId: "test" });
    expect(registry.getCalls()).toHaveLength(1);

    registry.reset();
    expect(registry.getCalls()).toHaveLength(0);
  });

  test("registerAll bulk registration", () => {
    registry.registerAll({
      sg_pipeline: STANDARD_MOCKS.sg_pipeline,
      sg_check: STANDARD_MOCKS.sg_check,
    });
    const tools = registry.createMockTools(["sg_pipeline", "sg_check"]);
    expect(tools).toHaveLength(2);
  });
});

describe("Verification helpers", () => {
  let registry: MockToolRegistry;

  beforeEach(() => {
    registry = new MockToolRegistry();
    registry.register("sg_pipeline", STANDARD_MOCKS.sg_pipeline);
    registry.register("sg_check", STANDARD_MOCKS.sg_check);
  });

  test("expectToolCalled passes when tool was called", async () => {
    const tool = registry.createMockTool("sg_pipeline");
    await tool.execute({ seriesId: "weapon-forger" });
    expect(() => expectToolCalled(registry, "sg_pipeline")).not.toThrow();
  });

  test("expectToolCalled throws when tool was not called", () => {
    expect(() => expectToolCalled(registry, "sg_pipeline")).toThrow(/to have been called/);
  });

  test("expectToolCalled with partialArgs matches", async () => {
    const tool = registry.createMockTool("sg_pipeline");
    await tool.execute({ seriesId: "weapon-forger", mode: "hybrid" });
    expect(() => expectToolCalled(registry, "sg_pipeline", { seriesId: "weapon-forger" })).not.toThrow();
  });

  test("expectToolCalled with partialArgs throws on mismatch", async () => {
    const tool = registry.createMockTool("sg_pipeline");
    await tool.execute({ seriesId: "weapon-forger" });
    expect(() => expectToolCalled(registry, "sg_pipeline", { seriesId: "other-series" })).toThrow(/matching/);
  });

  test("expectToolCallCount passes with correct count", async () => {
    const tool = registry.createMockTool("sg_pipeline");
    await tool.execute({ seriesId: "test" });
    await tool.execute({ seriesId: "test2" });
    expect(() => expectToolCallCount(registry, "sg_pipeline", 2)).not.toThrow();
  });

  test("expectToolCallCount throws on wrong count", async () => {
    const tool = registry.createMockTool("sg_pipeline");
    await tool.execute({ seriesId: "test" });
    expect(() => expectToolCallCount(registry, "sg_pipeline", 3)).toThrow(/3 times/);
  });

  test("expectToolNotCalled passes when not called", () => {
    expect(() => expectToolNotCalled(registry, "sg_check")).not.toThrow();
  });

  test("expectToolNotCalled throws when called", async () => {
    const tool = registry.createMockTool("sg_check");
    await tool.execute({ seriesId: "test" });
    expect(() => expectToolNotCalled(registry, "sg_check")).toThrow(/NOT/);
  });
});

describe("STANDARD_MOCKS coverage", () => {
  const requiredTools = [
    "sg_pipeline", "sg_check", "sg_score", "sg_regression",
    "sg_health", "sg_suggest", "sg_status", "sg_baseline_list",
    "sg_baseline_update", "sg_dual_review",
    "rm_analyze", "rm_suggest", "rm_lint",
    "sc_scaffold", "sc_series_list", "sc_episode_list",
    "tts_generate", "tts_voices", "tts_status",
    "render_episode", "render_status", "render_list",
    "image_generate", "image_status", "image_characters",
    "spawn_task", "Read", "Grep", "Find", "Bash", "Write",
  ];

  test("all required tools have standard mocks", () => {
    for (const name of requiredTools) {
      expect(STANDARD_MOCKS[name]).toBeDefined();
      expect(STANDARD_MOCKS[name].text).toBeTruthy();
      expect(STANDARD_MOCKS[name].details).toBeDefined();
    }
  });

  test("all standard mocks have details with tool and success fields", () => {
    for (const [name, mock] of Object.entries(STANDARD_MOCKS)) {
      expect(mock.details).toBeDefined();
      const d = mock.details!;
      expect(d.tool).toBe(name);
      expect(typeof d.success).toBe("boolean");
    }
  });
});
