import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { createSpawnTaskTool } from "../tools/spawn-task.js";
import { createToolByName, ALL_TOOL_NAMES, createAllTools, createToolsByNames } from "../agents/tool-registry.js";
import { discoverAgents } from "../agents/parser.js";
import { getConfig } from "../config.js";

// ─── spawn_task tool metadata ───

describe("spawn_task tool", () => {
  test("has correct metadata", () => {
    const tool = createSpawnTaskTool();
    expect(tool.name).toBe("spawn_task");
    expect(tool.label).toBe("Spawn Subagent");
    expect(tool.description).toContain("subagent");
    expect(tool.description.length).toBeGreaterThan(20);
  });

  test("has required parameters in schema", () => {
    const tool = createSpawnTaskTool();
    const schema = tool.parameters as any;
    expect(schema.properties.agent_name).toBeDefined();
    expect(schema.properties.task_prompt).toBeDefined();
    expect(schema.properties.max_turns).toBeDefined();
    expect(schema.required).toContain("agent_name");
    expect(schema.required).toContain("task_prompt");
    // max_turns is optional
    expect(schema.required).not.toContain("max_turns");
  });

  test("returns error for unknown agent_name", async () => {
    const tool = createSpawnTaskTool();
    const result = await tool.execute("test-id", {
      agent_name: "nonexistent-agent-xyz",
      task_prompt: "do something",
    });

    expect(result.content[0]).toEqual({
      type: "text",
      text: expect.stringContaining("Unknown agent"),
    });
    expect((result.content[0] as any).text).toContain("nonexistent-agent-xyz");
  });

  test("returns error when no agents discovered", async () => {
    // Point to an empty directory so discoverAgents finds nothing
    const tmpDir = join(import.meta.dir, "__tmp_spawn_empty__");
    mkdirSync(tmpDir, { recursive: true });

    // Temporarily override workDir
    const origWorkdir = process.env.PI_AGENT_WORKDIR;
    process.env.PI_AGENT_WORKDIR = tmpDir;

    try {
      const tool = createSpawnTaskTool();
      const result = await tool.execute("test-id", {
        agent_name: "any-agent",
        task_prompt: "do something",
      });

      expect(result.content[0]).toEqual({
        type: "text",
        text: expect.stringContaining("Unknown agent"),
      });
    } finally {
      if (origWorkdir) process.env.PI_AGENT_WORKDIR = origWorkdir;
      else delete process.env.PI_AGENT_WORKDIR;
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("returns error when agent creation fails (bad model)", async () => {
    const tmpDir = join(import.meta.dir, "__tmp_spawn_badmodel__");
    const agentsDir = join(tmpDir, ".agent", "agents");
    mkdirSync(agentsDir, { recursive: true });

    writeFileSync(join(agentsDir, "bad-model.md"), `---
name: bad-model-agent
description: Agent with invalid provider
model: nonexistent-provider/imaginary-model
---

Do things.`);

    const origWorkdir = process.env.PI_AGENT_WORKDIR;
    process.env.PI_AGENT_WORKDIR = tmpDir;

    try {
      const tool = createSpawnTaskTool();
      const result = await tool.execute("test-id", {
        agent_name: "bad-model-agent",
        task_prompt: "do something",
      });

      expect(result.content[0]).toEqual({
        type: "text",
        text: expect.stringContaining("Failed to create agent"),
      });
    } finally {
      if (origWorkdir) process.env.PI_AGENT_WORKDIR = origWorkdir;
      else delete process.env.PI_AGENT_WORKDIR;
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ─── Tool registry integration ───

describe("spawn_task in tool registry", () => {
  test("spawn_task is in ALL_TOOL_NAMES", () => {
    expect(ALL_TOOL_NAMES).toContain("spawn_task");
  });

  test("createToolByName creates spawn_task", () => {
    const tool = createToolByName("spawn_task");
    expect(tool).toBeDefined();
    expect(tool!.name).toBe("spawn_task");
  });

  test("createAllTools includes spawn_task", () => {
    const tools = createAllTools();
    const names = tools.map(t => t.name);
    expect(names).toContain("spawn_task");
  });

  test("createToolsByNames can select spawn_task", () => {
    const { tools, warnings } = createToolsByNames(["spawn_task", "Read"]);
    expect(tools).toHaveLength(2);
    expect(warnings).toHaveLength(0);
    const names = tools.map(t => t.name);
    expect(names).toContain("spawn_task");
  });
});
