import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createTools } from "../tools/index.js";

describe("createTools", () => {
  const originalWorkdir = process.env.PI_AGENT_WORKDIR;

  afterEach(() => {
    if (originalWorkdir === undefined) {
      delete process.env.PI_AGENT_WORKDIR;
    } else {
      process.env.PI_AGENT_WORKDIR = originalWorkdir;
    }
  });

  test("returns an array of 32 tools (7 base + 9 storygraph + 1 spawn_task + 3 remotion + 3 scaffold + 3 tts + 3 render + 3 image)", () => {
    const tools = createTools();
    expect(tools).toHaveLength(32);
  });

  test("each tool has name and description", () => {
    const tools = createTools();
    for (const tool of tools) {
      expect(typeof tool.name).toBe("string");
      expect(tool.name.length).toBeGreaterThan(0);
      expect(typeof tool.description).toBe("string");
      expect(tool.description.length).toBeGreaterThan(0);
    }
  });

  test("contains read tool", () => {
    const tools = createTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("read");
  });

  test("contains write tool", () => {
    const tools = createTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("write");
  });

  test("contains bash tool", () => {
    const tools = createTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("bash");
  });

  test("contains grep tool", () => {
    const tools = createTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("grep");
  });

  test("contains find tool", () => {
    const tools = createTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("find");
  });

  test("contains ls tool", () => {
    const tools = createTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("ls");
  });

  test("contains edit tool", () => {
    const tools = createTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("edit");
  });

  test("all tool names are unique", () => {
    const tools = createTools();
    const names = tools.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  test("each tool has an execute function", () => {
    const tools = createTools();
    for (const tool of tools) {
      expect(typeof tool.execute).toBe("function");
    }
  });

  test("uses custom workdir from config", () => {
    process.env.PI_AGENT_WORKDIR = "/tmp/custom-workdir";
    const tools = createTools();
    // Tools are created — just verify they don't crash with custom cwd
    expect(tools).toHaveLength(32);
  });

  test("contains storygraph tools (sg_*)", () => {
    const tools = createTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("sg_pipeline");
    expect(names).toContain("sg_check");
    expect(names).toContain("sg_score");
    expect(names).toContain("sg_status");
    expect(names).toContain("sg_regression");
  });

  test("contains remotion content tools (rm_*)", () => {
    const tools = createTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("rm_analyze");
    expect(names).toContain("rm_suggest");
    expect(names).toContain("rm_lint");
  });

  test("contains scaffold tools (sc_*)", () => {
    const tools = createTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("sc_scaffold");
    expect(names).toContain("sc_series_list");
    expect(names).toContain("sc_episode_list");
  });

  test("contains TTS tools (tts_*)", () => {
    const tools = createTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("tts_generate");
    expect(names).toContain("tts_voices");
    expect(names).toContain("tts_status");
  });

  test("contains render tools (render_*)", () => {
    const tools = createTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("render_episode");
    expect(names).toContain("render_status");
    expect(names).toContain("render_list");
  });
});
