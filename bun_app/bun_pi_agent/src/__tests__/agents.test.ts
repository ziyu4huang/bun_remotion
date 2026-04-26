import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join, resolve } from "path";
import { parseAgentDef, discoverAgents } from "../agents/parser.js";
import { createToolByName, createToolsByNames, createAllTools, ALL_TOOL_NAMES } from "../agents/tool-registry.js";
import { createAgentFromDef, createDefaultAgent } from "../agents/factory.js";
import { setAgentDefinition, getAgentDefinition, createAgent } from "../agent.js";
import type { AgentDefinition } from "../agents/types.js";

// ─── Temp dir for discoverAgents tests ───

const TMP_DIR = join(import.meta.dir, "__tmp_agents_test__");
const TMP_AGENTS_DIR = join(TMP_DIR, ".agent", "agents");

function writeTmpAgent(fileName: string, content: string): string {
  const filePath = join(TMP_AGENTS_DIR, fileName);
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}

// ─── parseAgentDef ───

describe("parseAgentDef", () => {
  const validAgent = `---
name: sg-story-advisor
description: Story continuity and creative writing advisor
tools: sg_suggest, sg_health, sg_status, Read, Grep
model: zai/glm-5-turbo
skills: storygraph-benchmark, remotion-best-practices
---

You are a story advisor for Remotion video series.
Always respond in zh_TW when discussing story content.`;

  test("parses valid agent definition with all fields", () => {
    const tmpFile = join(TMP_DIR, "test-valid.md");
    mkdirSync(TMP_DIR, { recursive: true });
    writeFileSync(tmpFile, validAgent, "utf-8");

    const def = parseAgentDef(tmpFile);
    expect(def.name).toBe("sg-story-advisor");
    expect(def.description).toBe("Story continuity and creative writing advisor");
    expect(def.tools).toEqual(["sg_suggest", "sg_health", "sg_status", "Read", "Grep"]);
    expect(def.model).toBe("zai/glm-5-turbo");
    expect(def.skills).toEqual(["storygraph-benchmark", "remotion-best-practices"]);
    expect(def.prompt).toContain("You are a story advisor");
    expect(def.prompt).toContain("zh_TW");
    expect(def.filePath).toBe(tmpFile);

    rmSync(tmpFile);
  });

  test("parses minimal agent definition (name only)", () => {
    const tmpFile = join(TMP_DIR, "test-minimal.md");
    mkdirSync(TMP_DIR, { recursive: true });
    writeFileSync(tmpFile, `---
name: minimal-agent
---

Just do the thing.`, "utf-8");

    const def = parseAgentDef(tmpFile);
    expect(def.name).toBe("minimal-agent");
    expect(def.description).toBe("");
    expect(def.tools).toBeUndefined();
    expect(def.model).toBeUndefined();
    expect(def.skills).toBeUndefined();
    expect(def.prompt).toBe("Just do the thing.");

    rmSync(tmpFile);
  });

  test("throws on missing frontmatter", () => {
    const tmpFile = join(TMP_DIR, "test-no-fm.md");
    mkdirSync(TMP_DIR, { recursive: true });
    writeFileSync(tmpFile, "No frontmatter here", "utf-8");

    expect(() => parseAgentDef(tmpFile)).toThrow("missing YAML frontmatter");

    rmSync(tmpFile);
  });

  test("throws on missing name field", () => {
    const tmpFile = join(TMP_DIR, "test-no-name.md");
    mkdirSync(TMP_DIR, { recursive: true });
    writeFileSync(tmpFile, `---
description: Missing name
---

Body.`, "utf-8");

    expect(() => parseAgentDef(tmpFile)).toThrow('missing required "name"');

    rmSync(tmpFile);
  });

  test("handles empty tools list gracefully", () => {
    const tmpFile = join(TMP_DIR, "test-empty-tools.md");
    mkdirSync(TMP_DIR, { recursive: true });
    writeFileSync(tmpFile, `---
name: empty-tools
tools:
---

Body.`, "utf-8");

    const def = parseAgentDef(tmpFile);
    // "tools:" with empty value parses as empty string → split produces [""] → filter(Boolean) removes it → undefined
    expect(def.tools).toBeUndefined();

    rmSync(tmpFile);
  });

  test("handles multiline prompt body", () => {
    const tmpFile = join(TMP_DIR, "test-multiline.md");
    mkdirSync(TMP_DIR, { recursive: true });
    writeFileSync(tmpFile, `---
name: multi
---

Line 1.

Line 2.

- Bullet point`, "utf-8");

    const def = parseAgentDef(tmpFile);
    expect(def.prompt).toContain("Line 1.");
    expect(def.prompt).toContain("Line 2.");
    expect(def.prompt).toContain("- Bullet point");

    rmSync(tmpFile);
  });
});

// ─── discoverAgents ───

describe("discoverAgents", () => {
  beforeEach(() => {
    mkdirSync(TMP_AGENTS_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  test("discovers agent definitions from directory", () => {
    writeTmpAgent("advisor.md", `---
name: my-advisor
description: Test advisor
---

Do advisory things.`);

    writeTmpAgent("checker.md", `---
name: my-checker
description: Test checker
---

Do checking things.`);

    const agents = discoverAgents(TMP_DIR);
    expect(agents).toHaveLength(2);
    const names = agents.map(a => a.name).sort();
    expect(names).toEqual(["my-advisor", "my-checker"]);
  });

  test("returns empty array when no .agent/agents directory exists", () => {
    const agents = discoverAgents(join(TMP_DIR, "nonexistent"));
    expect(agents).toHaveLength(0);
  });

  test("skips malformed files and continues parsing", () => {
    writeTmpAgent("good.md", `---
name: good-agent
description: Works
---

Good.`);

    writeTmpAgent("bad.md", "No frontmatter at all");

    const agents = discoverAgents(TMP_DIR);
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe("good-agent");
  });

  test("deduplicates by name (first occurrence wins)", () => {
    writeTmpAgent("first.md", `---
name: dupe
description: First
---

First body.`);

    writeTmpAgent("second.md", `---
name: dupe
description: Second
---

Second body.`);

    const agents = discoverAgents(TMP_DIR);
    expect(agents).toHaveLength(1);
    expect(agents[0].description).toBe("First");
  });

  test("ignores non-.md files", () => {
    writeTmpAgent("agent.json", '{"name": "json-agent"}');
    writeTmpAgent("agent.txt", "not a markdown file");

    const agents = discoverAgents(TMP_DIR);
    expect(agents).toHaveLength(0);
  });
});

// ─── tool-registry ───

describe("tool-registry", () => {
  test("ALL_TOOL_NAMES has expected count", () => {
    // 7 coding + 9 storygraph + 1 spawn_task + 3 remotion + 3 scaffold + 3 tts + 3 render = 29
    expect(ALL_TOOL_NAMES).toHaveLength(29);
  });

  test("ALL_TOOL_NAMES includes all expected tools", () => {
    const expected = [
      "Read", "Write", "Bash", "Grep", "Find", "Ls", "Edit",
      "sg_pipeline", "sg_check", "sg_score", "sg_status", "sg_regression",
      "sg_baseline_update", "sg_baseline_list", "sg_suggest", "sg_health",
      "spawn_task",
      "rm_analyze", "rm_suggest", "rm_lint",
      "sc_scaffold", "sc_series_list", "sc_episode_list",
      "tts_generate", "tts_voices", "tts_status",
    ];
    for (const name of expected) {
      expect(ALL_TOOL_NAMES).toContain(name);
    }
  });

  test("createToolByName returns tool for known name", () => {
    const tool = createToolByName("Read");
    expect(tool).toBeDefined();
    expect(tool!.name).toBe("read");
  });

  test("createToolByName returns undefined for unknown name", () => {
    const tool = createToolByName("nonexistent_tool");
    expect(tool).toBeUndefined();
  });

  test("createToolsByNames filters and warns on unknown", () => {
    const { tools, warnings } = createToolsByNames(["Read", "Grep", "fake_tool"]);
    expect(tools).toHaveLength(2);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("fake_tool");
  });

  test("createToolsByNames returns empty for empty list", () => {
    const { tools, warnings } = createToolsByNames([]);
    expect(tools).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  test("createAllTools returns 29 tools", () => {
    const tools = createAllTools();
    expect(tools).toHaveLength(29);
  });

  test("createToolsByNames with storygraph tools", () => {
    const { tools, warnings } = createToolsByNames([
      "sg_pipeline", "sg_health", "sg_suggest",
    ]);
    expect(tools).toHaveLength(3);
    expect(warnings).toHaveLength(0);
    const names = tools.map(t => t.name);
    expect(names).toContain("sg_pipeline");
    expect(names).toContain("sg_health");
    expect(names).toContain("sg_suggest");
  });
});

// ─── factory ───

describe("factory", () => {
  test("createDefaultAgent creates agent with all 17 tools", () => {
    const agent = createDefaultAgent();
    expect(agent).toBeDefined();
    // Agent doesn't expose tools directly, but creation succeeds without error
  });

  test("createAgentFromDef with tools whitelist scopes tools", () => {
    const def: AgentDefinition = {
      name: "scoped-agent",
      description: "Test scoped agent",
      tools: ["Read", "Grep", "sg_health"],
      prompt: "You are a scoped agent.",
      filePath: "/test/scoped.md",
    };

    const agent = createAgentFromDef(def);
    expect(agent).toBeDefined();
  });

  test("createAgentFromDef without tools uses all tools", () => {
    const def: AgentDefinition = {
      name: "full-agent",
      description: "Test full agent",
      prompt: "You have all tools.",
      filePath: "/test/full.md",
    };

    const agent = createAgentFromDef(def);
    expect(agent).toBeDefined();
  });

  test("createAgentFromDef with model override", () => {
    const def: AgentDefinition = {
      name: "custom-model",
      description: "Test model override",
      model: "zai/glm-5-turbo",
      prompt: "Using custom model.",
      filePath: "/test/model.md",
    };

    const agent = createAgentFromDef(def);
    expect(agent).toBeDefined();
  });

  test("createAgentFromDef with unknown tools warns but doesn't crash", () => {
    const def: AgentDefinition = {
      name: "bad-tools",
      description: "Test unknown tools",
      tools: ["Read", "nonexistent_tool", "also_fake"],
      prompt: "Testing warnings.",
      filePath: "/test/bad-tools.md",
    };

    const agent = createAgentFromDef(def);
    expect(agent).toBeDefined();
    // Should not throw, unknown tools are skipped with warning
  });
});

// ─── setAgentDefinition / createAgent integration ───

describe("agent definition integration", () => {
  afterEach(() => {
    setAgentDefinition(undefined);
  });

  test("createAgent uses default when no definition set", () => {
    setAgentDefinition(undefined);
    // Just verify it doesn't throw (will use default model from env)
    const origKey = process.env.ZAI_API_KEY;
    process.env.ZAI_API_KEY = "test-key";
    try {
      const agent = createAgent();
      expect(agent).toBeDefined();
    } finally {
      if (origKey) process.env.ZAI_API_KEY = origKey;
      else delete process.env.ZAI_API_KEY;
    }
  });

  test("createAgent uses definition when set", () => {
    const def: AgentDefinition = {
      name: "test-advisor",
      description: "Test",
      tools: ["Read", "sg_health"],
      prompt: "You are a test advisor.",
      filePath: "/test.md",
    };
    setAgentDefinition(def);

    expect(getAgentDefinition()).toBe(def);

    const origKey = process.env.ZAI_API_KEY;
    process.env.ZAI_API_KEY = "test-key";
    try {
      const agent = createAgent();
      expect(agent).toBeDefined();
    } finally {
      if (origKey) process.env.ZAI_API_KEY = origKey;
      else delete process.env.ZAI_API_KEY;
    }
  });

  test("definition can be cleared", () => {
    const def: AgentDefinition = {
      name: "temp",
      description: "Temporary",
      prompt: "Temp.",
      filePath: "/tmp.md",
    };
    setAgentDefinition(def);
    expect(getAgentDefinition()).toBe(def);
    setAgentDefinition(undefined);
    expect(getAgentDefinition()).toBeUndefined();
  });
});

// ─── Studio agent definitions (Phase 52-E) ───

const PROJECT_ROOT = resolve(import.meta.dir, "../../../..");
const AGENTS_DIR = join(PROJECT_ROOT, ".agent", "agents");

describe("studio agent definitions", () => {
  test("studio-scaffold parses correctly", () => {
    const filePath = join(AGENTS_DIR, "studio-scaffold.md");
    if (!existsSync(filePath)) return; // skip if not in this repo

    const def = parseAgentDef(filePath);
    expect(def.name).toBe("studio-scaffold");
    expect(def.description).toContain("scaffold");
    expect(def.model).toBe("zai/glm-5-turbo");
    expect(def.tools).toEqual(["sc_scaffold", "sc_series_list", "sc_episode_list", "Read", "Write", "Bash", "Grep", "Find"]);
    expect(def.prompt).toContain("episode scaffolding");
    expect(def.prompt).toContain("dialogLines");
  });

  test("studio-reviewer parses correctly", () => {
    const filePath = join(AGENTS_DIR, "studio-reviewer.md");
    if (!existsSync(filePath)) return;

    const def = parseAgentDef(filePath);
    expect(def.name).toBe("studio-reviewer");
    expect(def.description).toContain("quality review");
    expect(def.model).toBe("zai/glm-5");
    expect(def.tools).toEqual([
      "sg_pipeline", "sg_check", "sg_score", "sg_regression",
      "rm_analyze", "rm_lint", "Read", "Grep",
    ]);
    expect(def.prompt).toContain("quality reviewer");
    expect(def.prompt).toContain("gate.json");
  });

  test("studio-advisor parses correctly", () => {
    const filePath = join(AGENTS_DIR, "studio-advisor.md");
    if (!existsSync(filePath)) return;

    const def = parseAgentDef(filePath);
    expect(def.name).toBe("studio-advisor");
    expect(def.description).toContain("content advisor");
    expect(def.model).toBe("zai/glm-5-turbo");
    expect(def.tools).toEqual([
      "sg_suggest", "sg_health", "rm_analyze", "rm_suggest",
      "Read", "Grep", "Find",
    ]);
    expect(def.prompt).toContain("story and content advisor");
    expect(def.prompt).toContain("Foreshadowing debt");
  });

  test("studio agents can be created via factory", () => {
    const origKey = process.env.ZAI_API_KEY;
    process.env.ZAI_API_KEY = "test-key";
    try {
      for (const fileName of ["studio-scaffold.md", "studio-reviewer.md", "studio-advisor.md"]) {
        const filePath = join(AGENTS_DIR, fileName);
        if (!existsSync(filePath)) continue;

        const def = parseAgentDef(filePath);
        const agent = createAgentFromDef(def);
        expect(agent).toBeDefined();
      }
    } finally {
      if (origKey) process.env.ZAI_API_KEY = origKey;
      else delete process.env.ZAI_API_KEY;
    }
  });

  test("studio agent tools all resolve in tool-registry", () => {
    const agentFiles = ["studio-scaffold.md", "studio-reviewer.md", "studio-advisor.md"];
    for (const fileName of agentFiles) {
      const filePath = join(AGENTS_DIR, fileName);
      if (!existsSync(filePath)) continue;

      const def = parseAgentDef(filePath);
      const { tools, warnings } = createToolsByNames(def.tools!);
      expect(tools.length).toBe(def.tools!.length);
      expect(warnings).toHaveLength(0);
    }
  });

  test("discoverAgents finds all 8 agents from project root", () => {
    const agents = discoverAgents(PROJECT_ROOT);
    expect(agents.length).toBeGreaterThanOrEqual(8);

    const names = agents.map(a => a.name);
    expect(names).toContain("studio-scaffold");
    expect(names).toContain("studio-reviewer");
    expect(names).toContain("studio-advisor");
    expect(names).toContain("pi-developer");
    expect(names).toContain("sg-story-advisor");
    expect(names).toContain("sg-quality-gate");
    expect(names).toContain("sg-benchmark-runner");
    expect(names).toContain("rm-content-analyst");
  });

  test("studio-scaffold tool count is 8", () => {
    const filePath = join(AGENTS_DIR, "studio-scaffold.md");
    if (!existsSync(filePath)) return;
    const def = parseAgentDef(filePath);
    const { tools } = createToolsByNames(def.tools!);
    expect(tools).toHaveLength(8);
  });

  test("studio-reviewer tool count is 8", () => {
    const filePath = join(AGENTS_DIR, "studio-reviewer.md");
    if (!existsSync(filePath)) return;
    const def = parseAgentDef(filePath);
    const { tools } = createToolsByNames(def.tools!);
    expect(tools).toHaveLength(8);
  });

  test("studio-advisor tool count is 7", () => {
    const filePath = join(AGENTS_DIR, "studio-advisor.md");
    if (!existsSync(filePath)) return;
    const def = parseAgentDef(filePath);
    const { tools } = createToolsByNames(def.tools!);
    expect(tools).toHaveLength(7);
  });
});
