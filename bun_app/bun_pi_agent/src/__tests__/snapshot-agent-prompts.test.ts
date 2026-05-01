import { describe, test, expect, beforeAll } from "bun:test";
import { resolve, join } from "path";
import { readdirSync } from "fs";
import { parseAgentDef, clearIncludeCache } from "../agents/parser.js";

const REPO_ROOT = resolve(import.meta.dir, "../../../../");
const AGENTS_DIR = join(REPO_ROOT, ".agent", "agents");

const agentFiles = readdirSync(AGENTS_DIR)
  .filter(f => f.endsWith(".md"))
  .map(f => join(AGENTS_DIR, f))
  .sort();

beforeAll(() => { clearIncludeCache(); });

describe("Agent prompt snapshot tests", () => {
  test("discovers all 14 agent definitions", () => {
    expect(agentFiles.length).toBe(14);
  });

  for (const filePath of agentFiles) {
    const name = filePath.split("/").pop()!.replace(".md", "");

    test(`${name}: parses and produces stable prompt`, () => {
      const def = parseAgentDef(filePath);

      expect(def.name).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.prompt).toBeTruthy();
      expect(def.prompt).not.toContain("!include");
      expect(def.prompt.length).toBeGreaterThan(50);

      // Snapshot the full prompt for regression detection
      expect(def.prompt).toMatchSnapshot(`prompt_${def.name}`);
    });
  }
});

describe("Agent include coverage", () => {
  const AGENTS_WITH_INCLUDES = [
    "rm-content-analyst",
    "sg-quality-gate",
    "sg-story-advisor",
    "studio-advisor",
    "studio-coordinator",
    "studio-image",
    "studio-render",
    "studio-reviewer",
    "studio-scaffold",
    "studio-tts",
  ];

  const AGENTS_WITHOUT_INCLUDES = [
    "pi-developer",
    "sg-benchmark-runner",
    "sg-dual-reviewer",
    "test-reviewer",
  ];

  for (const name of AGENTS_WITH_INCLUDES) {
    test(`${name}: has shared sections`, () => {
      const filePath = join(AGENTS_DIR, `${name}.md`);
      const def = parseAgentDef(filePath);
      expect(def.shared).toBeDefined();
      expect(def.shared!.length).toBeGreaterThan(0);
    });
  }

  for (const name of AGENTS_WITHOUT_INCLUDES) {
    test(`${name}: has no shared sections`, () => {
      const filePath = join(AGENTS_DIR, `${name}.md`);
      const def = parseAgentDef(filePath);
      expect(def.shared).toBeUndefined();
    });
  }
});
