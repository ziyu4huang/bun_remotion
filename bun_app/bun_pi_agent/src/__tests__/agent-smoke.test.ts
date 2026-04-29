import { describe, test, expect, beforeAll } from "bun:test";
import { resolve } from "node:path";
import { discoverAgents, parseAgentDef } from "../agents/parser.js";
import { createToolsByNames, ALL_TOOL_NAMES } from "../agents/tool-registry.js";

const REPO_ROOT = resolve(import.meta.dir, "../../../..");

// ---------------------------------------------------------------------------
// Level 1: Definition parsing (no API key needed)
// ---------------------------------------------------------------------------

describe("agent-smoke: definitions", () => {
  const agents = discoverAgents(REPO_ROOT);

  test("discovers all 14 agents", () => {
    expect(agents.length).toBe(14);
  });

  // Expected agents and their tool counts
  const expected: Record<string, { tools?: number; model?: string }> = {
    "pi-developer": {},
    "sg-story-advisor": { tools: 7 },
    "sg-quality-gate": { tools: 9 },
    "sg-benchmark-runner": { tools: 12 },
    "rm-content-analyst": { tools: 5 },
    "studio-scaffold": { tools: 8 },
    "studio-tts": { tools: 6 },
    "studio-render": { tools: 6 },
    "studio-image": { tools: 6 },
    "studio-reviewer": { tools: 8 },
    "studio-advisor": { tools: 7 },
    "studio-coordinator": { tools: 4 },
    "test-reviewer": { tools: 6 },
  };

  for (const [name, spec] of Object.entries(expected)) {
    describe(`${name}`, () => {
      let def: ReturnType<typeof discoverAgents>[0];

      beforeAll(() => {
        def = agents.find(a => a.name === name)!;
        expect(def).toBeDefined();
      });

      test("has required fields", () => {
        expect(def.name).toBe(name);
        expect(def.description.length).toBeGreaterThan(0);
        expect(def.prompt.length).toBeGreaterThan(0);
      });

      if (spec.tools !== undefined) {
        test(`has ${spec.tools} scoped tools`, () => {
          expect(def.tools).toBeDefined();
          expect(def.tools!.length).toBe(spec.tools);
        });
      }

      if (spec.model) {
        test(`uses model ${spec.model}`, () => {
          expect(def.model).toBe(spec.model);
        });
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Level 2: Tool registry (no API key needed)
// ---------------------------------------------------------------------------

describe("agent-smoke: tool registry", () => {
  test("ALL_TOOL_NAMES has 33 tools", () => {
    expect(ALL_TOOL_NAMES.length).toBe(33);
  });

  test("createToolsByNames creates tools without errors", () => {
    const agents = discoverAgents(REPO_ROOT);
    for (const def of agents) {
      if (!def.tools) continue;
      const { tools, warnings } = createToolsByNames(def.tools);
      expect(warnings).toEqual([]);
      expect(tools.length).toBe(def.tools.length);
      // Each tool has required properties
      for (const tool of tools) {
        expect(tool.name).toBeTruthy();
      }
    }
  });

  test("unknown tool names produce warnings", () => {
    const { tools, warnings } = createToolsByNames(["nonexistent_tool"]);
    expect(tools).toHaveLength(0);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("nonexistent_tool");
  });
});

// ---------------------------------------------------------------------------
// Level 3: Agent instance creation (requires API key)
// ---------------------------------------------------------------------------

const hasApiKey = !!process.env.ZAI_API_KEY || !!process.env.Z_AI_API_KEY;
const describeIfApiKey = hasApiKey ? describe : describe.skip;

describeIfApiKey("agent-smoke: agent instances", () => {
  const agents = discoverAgents(REPO_ROOT);

  for (const def of agents) {
    test(`${def.name}: createAgentFromDef produces valid agent`, async () => {
      const { createAgentFromDef } = await import("../agents/factory.js");
      const agent = createAgentFromDef(def);

      expect(agent).toBeDefined();
      expect(agent.state).toBeDefined();
      expect(agent.state.tools.length).toBeGreaterThan(0);
      expect(agent.state.systemPrompt.length).toBeGreaterThan(0);
      expect(agent.state.model).toBeDefined();
    });
  }
});
