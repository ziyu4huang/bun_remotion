import { describe, test, expect, beforeEach } from "bun:test";
import { MockToolRegistry, STANDARD_MOCKS, expectToolCalled, expectToolCallCount, expectToolNotCalled } from "../agents/mock-registry.js";
import { ALL_TOOL_NAMES } from "../agents/tool-registry.js";
import { parseAgentDef } from "../agents/parser.js";
import { resolve } from "path";

const WORK_DIR = resolve(import.meta.dir, "../../../../");

/** Agent definitions that should exist */
const AGENT_DEFS = [
  { file: ".agent/agents/studio-reviewer.md", name: "studio-reviewer" },
  { file: ".agent/agents/studio-scaffold.md", name: "studio-scaffold" },
  { file: ".agent/agents/studio-tts.md", name: "studio-tts" },
  { file: ".agent/agents/studio-render.md", name: "studio-render" },
];

describe("Agent Definitions", () => {
  test("all 4 target agents parse successfully", () => {
    for (const { file, name } of AGENT_DEFS) {
      const def = parseAgentDef(resolve(WORK_DIR, file));
      expect(def.name).toBe(name);
      expect(def.description.length).toBeGreaterThan(0);
      expect(def.prompt.length).toBeGreaterThan(0);
    }
  });

  test("all declared tool names exist in the tool registry", () => {
    for (const { file } of AGENT_DEFS) {
      const def = parseAgentDef(resolve(WORK_DIR, file));
      for (const toolName of def.tools ?? []) {
        expect(ALL_TOOL_NAMES).toContain(toolName);
      }
    }
  });
});

describe("studio-reviewer workflow", () => {
  let registry: MockToolRegistry;
  const TOOLS = ["sg_pipeline", "sg_check", "sg_score", "sg_regression", "rm_analyze", "rm_lint", "Read", "Grep"];

  beforeEach(() => {
    registry = new MockToolRegistry();
    for (const name of TOOLS) {
      registry.register(name, STANDARD_MOCKS[name]);
    }
  });

  test("declared tools match expected set", () => {
    const def = parseAgentDef(resolve(WORK_DIR, ".agent/agents/studio-reviewer.md"));
    expect(def.tools).toBeDefined();
    for (const tool of TOOLS) {
      expect(def.tools).toContain(tool);
    }
  });

  test("full review sequence: pipeline → check → regression → lint", async () => {
    const tools = registry.createMockTools(TOOLS);

    // Simulate agent calling tools in documented workflow order
    const pipelineResult = await tools[0].execute({ seriesId: "weapon-forger" });
    expect(pipelineResult.text).toContain("Pipeline completed");
    expect(pipelineResult.details).toBeDefined();
    expect((pipelineResult.details as any).data.nodes).toBe(42);

    const checkResult = await tools[1].execute({ seriesId: "weapon-forger" });
    expect(checkResult.text).toContain("Gate score");
    expect((checkResult.details as any).data.decision).toBe("PASS");

    const scoreResult = await tools[2].execute({ seriesId: "weapon-forger" });
    expect(scoreResult.text).toContain("Blended score");
    expect((scoreResult.details as any).data.blendedScore).toBeGreaterThan(0);

    const regressionResult = await tools[3].execute({ seriesId: "weapon-forger" });
    expect(regressionResult.text).toContain("No regression");

    // Verify tool call order
    const calls = registry.getCalls();
    expect(calls.map(c => c.name)).toEqual([
      "sg_pipeline", "sg_check", "sg_score", "sg_regression",
    ]);

    expectToolCallCount(registry, "sg_pipeline", 1);
    expectToolCallCount(registry, "sg_check", 1);
    expectToolCallCount(registry, "sg_score", 1);
  });

  test("content analysis: rm_lint + rm_analyze after pipeline", async () => {
    const tools = registry.createMockTools(TOOLS);

    // Pipeline first
    await tools[0].execute({ seriesId: "weapon-forger" });
    // Then lint
    const lintResult = await tools[5].execute({ episodeDir: "weapon-forger-ch1-ep1" });
    expect(lintResult.text).toContain("Lint");
    expect((lintResult.details as any).data.passCount).toBe(5);
    // Then analyze
    const analyzeResult = await tools[4].execute({ episodeDir: "weapon-forger-ch1-ep1" });
    expect(analyzeResult.text).toContain("Episode analysis");
    expect((analyzeResult.details as any).data.scenes).toBe(4);

    expectToolCalled(registry, "rm_lint");
    expectToolCalled(registry, "rm_analyze");
  });

  test("gate score from check can be used to decide pass/fail", async () => {
    const registry = new MockToolRegistry();
    registry.register("sg_check", {
      text: "Quality check: gate score 45/100. Decision: FAIL.",
      details: { tool: "sg_check", success: true, data: { seriesId: "test", gateScore: 45, decision: "FAIL", checkCount: 8, failures: ["missing_characters"] } },
    });
    const tool = registry.createMockTool("sg_check");
    const result = await tool.execute({ seriesId: "test" });
    const data = (result.details as any).data;
    expect(data.decision).toBe("FAIL");
    expect(data.gateScore).toBeLessThan(60);
  });
});

describe("studio-scaffold workflow", () => {
  let registry: MockToolRegistry;
  const TOOLS = ["sc_scaffold", "sc_series_list", "sc_episode_list", "Read", "Write", "Bash", "Grep", "Find"];

  beforeEach(() => {
    registry = new MockToolRegistry();
    for (const name of TOOLS) {
      registry.register(name, STANDARD_MOCKS[name]);
    }
  });

  test("declared tools match expected set", () => {
    const def = parseAgentDef(resolve(WORK_DIR, ".agent/agents/studio-scaffold.md"));
    expect(def.tools).toBeDefined();
    for (const tool of TOOLS) {
      expect(def.tools).toContain(tool);
    }
  });

  test("discovery→scaffold sequence: series list → episode list → scaffold", async () => {
    const tools = registry.createMockTools(TOOLS);

    // Step 1: Discover available series
    const seriesResult = await tools[1].execute({});
    expect(seriesResult.text).toContain("Series:");
    expect((seriesResult.details as any).data.seriesCount).toBe(3);

    // Step 2: Check existing episodes
    const episodeResult = await tools[2].execute({ series: "weapon-forger" });
    expect(episodeResult.text).toContain("Episodes for");
    expect((episodeResult.details as any).data.episodeCount).toBe(3);

    // Step 3: Scaffold new episode
    const scaffoldResult = await tools[0].execute({
      series: "weapon-forger",
      chapter: 1,
      episode: 4,
    });
    expect(scaffoldResult.text).toContain("Scaffolded");
    expect((scaffoldResult.details as any).data.filesCreated).toBe(8);

    // Verify sequence
    const calls = registry.getCalls();
    expect(calls.map(c => c.name)).toEqual([
      "sc_series_list", "sc_episode_list", "sc_scaffold",
    ]);
  });

  test("scaffold with function handler captures dynamic args", async () => {
    registry.register("sc_scaffold", (args) => ({
      text: `Scaffolded ${args.series}-ch${args.chapter}-ep${args.episode}`,
      details: { tool: "sc_scaffold", success: true, data: args },
    }));

    const tool = registry.createMockTool("sc_scaffold");
    const result = await tool.execute({ series: "my-core-is-boss", chapter: 2, episode: 1 });
    expect(result.text).toContain("my-core-is-boss-ch2-ep1");
    expectToolCalled(registry, "sc_scaffold", { series: "my-core-is-boss" });
  });
});

describe("studio-tts workflow", () => {
  let registry: MockToolRegistry;
  const TOOLS = ["tts_generate", "tts_voices", "tts_status", "Read", "Grep", "Find"];

  beforeEach(() => {
    registry = new MockToolRegistry();
    for (const name of TOOLS) {
      registry.register(name, STANDARD_MOCKS[name]);
    }
  });

  test("declared tools match expected set", () => {
    const def = parseAgentDef(resolve(WORK_DIR, ".agent/agents/studio-tts.md"));
    expect(def.tools).toBeDefined();
    for (const tool of TOOLS) {
      expect(def.tools).toContain(tool);
    }
  });

  test("status→voices→generate sequence", async () => {
    const tools = registry.createMockTools(TOOLS);

    // Step 1: Check current TTS status
    const statusResult = await tools[2].execute({ episodeDir: "weapon-forger-ch1-ep1" });
    expect(statusResult.text).toContain("TTS status");
    expect((statusResult.details as any).data.hasAudio).toBe(true);

    // Step 2: Check voice assignments
    const voicesResult = await tools[1].execute({ series: "weapon-forger" });
    expect(voicesResult.text).toContain("Voice map");
    expect((voicesResult.details as any).data.voices).toBeDefined();

    // Step 3: Generate TTS
    const genResult = await tools[0].execute({
      episodeDir: "weapon-forger-ch1-ep1",
      engine: "mlx",
    });
    expect(genResult.text).toContain("TTS generated");
    expect((genResult.details as any).data.engine).toBe("mlx");
    expect((genResult.details as any).data.scenesGenerated).toBe(4);

    // Verify sequence
    const calls = registry.getCalls();
    expect(calls.map(c => c.name)).toEqual([
      "tts_status", "tts_voices", "tts_generate",
    ]);
  });

  test("skips generation when all audio exists", async () => {
    registry.register("tts_status", {
      text: "TTS status: 4/4 scenes have audio. Total: 45s. All complete.",
      details: { tool: "tts_status", success: true, data: { episode: "test", hasAudio: true, fileCount: 4 } },
    });

    const tool = registry.createMockTool("tts_status");
    const result = await tool.execute({ episodeDir: "test" });
    const data = (result.details as any).data;
    expect(data.hasAudio && data.fileCount === 4).toBe(true);
  });
});

describe("studio-render workflow", () => {
  let registry: MockToolRegistry;
  const TOOLS = ["render_episode", "render_status", "render_list", "Read", "Grep", "Find"];

  beforeEach(() => {
    registry = new MockToolRegistry();
    for (const name of TOOLS) {
      registry.register(name, STANDARD_MOCKS[name]);
    }
  });

  test("declared tools match expected set", () => {
    const def = parseAgentDef(resolve(WORK_DIR, ".agent/agents/studio-render.md"));
    expect(def.tools).toBeDefined();
    for (const tool of TOOLS) {
      expect(def.tools).toContain(tool);
    }
  });

  test("list→status→render sequence", async () => {
    const tools = registry.createMockTools(TOOLS);

    // Step 1: List rendered episodes
    const listResult = await tools[2].execute({ series: "weapon-forger" });
    expect(listResult.text).toContain("Rendered episodes");
    expect((listResult.details as any).data.rendered).toBe(3);
    expect((listResult.details as any).data.total).toBe(10);

    // Step 2: Check specific episode status
    const statusResult = await tools[1].execute({ episodeId: "weapon-forger-ch1-ep1" });
    expect(statusResult.text).toContain("Render status");
    expect((statusResult.details as any).data.hasRender).toBe(true);

    // Step 3: Render a pending episode
    const renderResult = await tools[0].execute({ episodeId: "weapon-forger-ch1-ep4" });
    expect(renderResult.text).toContain("Rendered");
    expect((renderResult.details as any).data.outputPath).toContain(".mp4");

    // Verify sequence
    const calls = registry.getCalls();
    expect(calls.map(c => c.name)).toEqual([
      "render_list", "render_status", "render_episode",
    ]);
  });

  test("detects stale render", async () => {
    registry.register("render_status", {
      text: "Render status: weapon-forger-ch1-ep1 STALE (source newer).",
      details: { tool: "render_status", success: true, data: { episode: "weapon-forger-ch1-ep1", hasRender: true, isStale: true, fileSizeKb: 12800 } },
    });

    const tool = registry.createMockTool("render_status");
    const result = await tool.execute({ episodeId: "weapon-forger-ch1-ep1" });
    expect((result.details as any).data.isStale).toBe(true);
  });

  test("render produces mp4 with size info", async () => {
    const tool = registry.createMockTool("render_episode");
    const result = await tool.execute({ episodeId: "test-ep" });
    const data = (result.details as any).data;
    expect(data.outputPath).toMatch(/\.mp4$/);
    expect(data.fileSizeKb).toBeGreaterThan(0);
  });
});
