import { describe, test, expect, afterEach } from "bun:test";
import { resolve } from "node:path";

describe("loadAgentSkills", () => {
  const originalWorkdir = process.env.PI_AGENT_WORKDIR;

  afterEach(() => {
    if (originalWorkdir === undefined) {
      delete process.env.PI_AGENT_WORKDIR;
    } else {
      process.env.PI_AGENT_WORKDIR = originalWorkdir;
    }
  });

  test("loads storygraph-benchmark skill from .agent/skills", async () => {
    process.env.PI_AGENT_WORKDIR = resolve(import.meta.dir, "../../../../");
    const { loadAgentSkills } = await import("../skills/index.js");
    const { skills } = loadAgentSkills();
    const names = skills.map((s) => s.name);
    expect(names).toContain("storygraph-benchmark");
  });

  test("skill has expected name and description", async () => {
    process.env.PI_AGENT_WORKDIR = resolve(import.meta.dir, "../../../../");
    const { loadAgentSkills } = await import("../skills/index.js");
    const { skills } = loadAgentSkills();
    const benchmark = skills.find((s) => s.name === "storygraph-benchmark");
    expect(benchmark).toBeDefined();
    expect(benchmark!.description).toContain("benchmark");
    expect(benchmark!.description).toContain("pipeline");
  });

  test("getSkillsPromptSection includes benchmark in available skills", async () => {
    process.env.PI_AGENT_WORKDIR = resolve(import.meta.dir, "../../../../");
    const { loadAgentSkills, getSkillsPromptSection } = await import("../skills/index.js");
    const { skills } = loadAgentSkills();
    const section = getSkillsPromptSection(skills);
    expect(section).toContain("storygraph-benchmark");
    // Skill file location should be listed so agent can read it on demand
    expect(section).toContain(".agent/skills/storygraph-benchmark.md");
  });

  test("skill file is readable at the reported location", async () => {
    process.env.PI_AGENT_WORKDIR = resolve(import.meta.dir, "../../../../");
    const { loadAgentSkills } = await import("../skills/index.js");
    const { skills } = loadAgentSkills();
    const benchmark = skills.find((s) => s.name === "storygraph-benchmark");
    expect(benchmark).toBeDefined();
    // Verify the skill file exists at the reported location
    const { existsSync } = await import("node:fs");
    expect(existsSync(benchmark!.filePath)).toBe(true);
  });
});
