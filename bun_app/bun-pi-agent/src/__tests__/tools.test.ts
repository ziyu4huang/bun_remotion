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

  test("returns an array of 7 tools", () => {
    const tools = createTools();
    expect(tools).toHaveLength(7);
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
    expect(tools).toHaveLength(7);
  });
});
