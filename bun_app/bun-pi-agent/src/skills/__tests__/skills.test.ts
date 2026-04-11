import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { join, dirname, resolve } from "path";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "fs";
import {
  loadSkillsFromDir,
  formatSkillsForPrompt,
  loadAgentSkills,
} from "../index.js";
import type { Skill } from "@mariozechner/pi-coding-agent";

const FIXTURES_DIR = join(dirname(import.meta.url.replace("file://", "")), "fixtures");

describe("loadSkillsFromDir", () => {
  test("loads a valid skill from directory with SKILL.md", () => {
    const { skills, diagnostics } = loadSkillsFromDir({
      dir: join(FIXTURES_DIR, "valid-skill"),
      source: "path",
    });

    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("valid-skill");
    expect(skills[0].description).toBe("A valid test skill for unit testing");
    expect(skills[0].disableModelInvocation).toBe(false);
    expect(skills[0].filePath).toContain("valid-skill/SKILL.md");
    expect(diagnostics).toHaveLength(0);
  });

  test("returns empty array for non-existent directory", () => {
    const { skills, diagnostics } = loadSkillsFromDir({
      dir: "/nonexistent/path",
      source: "path",
    });

    expect(skills).toHaveLength(0);
    expect(diagnostics).toHaveLength(0);
  });

  test("recurses into subdirectories to find SKILL.md", () => {
    const { skills } = loadSkillsFromDir({
      dir: FIXTURES_DIR,
      source: "path",
    });

    // Fixtures dir has subdirectories with SKILL.md, not a root SKILL.md
    expect(skills.length).toBeGreaterThanOrEqual(1);
  });

  test("loads all valid skills from multiple subdirectories", () => {
    const { skills } = loadSkillsFromDir({
      dir: FIXTURES_DIR,
      source: "path",
    });

    const names = skills.map((s) => s.name);
    expect(names).toContain("valid-skill");
    expect(names).toContain("another-skill");
    expect(names).toContain("disabled-skill");
    expect(names).toContain("skill-with-scripts");
  });

  test("skips skill with empty description", () => {
    const { skills, diagnostics } = loadSkillsFromDir({
      dir: join(FIXTURES_DIR, "no-description"),
      source: "path",
    });

    expect(skills).toHaveLength(0);
    expect(diagnostics.length).toBeGreaterThanOrEqual(1);
    expect(diagnostics.some((d) => d.message.includes("description"))).toBe(true);
  });

  test("produces warnings for invalid name", () => {
    const { skills, diagnostics } = loadSkillsFromDir({
      dir: join(FIXTURES_DIR, "bad-name"),
      source: "path",
    });

    // Skill loads but with name validation warnings
    expect(skills).toHaveLength(1);
    expect(diagnostics.length).toBeGreaterThanOrEqual(1);
    const nameWarnings = diagnostics.filter((d) =>
      d.message.includes("name")
    );
    expect(nameWarnings.length).toBeGreaterThanOrEqual(1);
  });

  test("parses disable-model-invocation flag", () => {
    const { skills } = loadSkillsFromDir({
      dir: join(FIXTURES_DIR, "disabled-skill"),
      source: "path",
    });

    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("disabled-skill");
    expect(skills[0].disableModelInvocation).toBe(true);
  });

  test("preserves extra frontmatter fields without error", () => {
    const { skills, diagnostics } = loadSkillsFromDir({
      dir: join(FIXTURES_DIR, "skill-with-scripts"),
      source: "path",
    });

    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("skill-with-scripts");
    expect(diagnostics.filter((d) => d.type === "error")).toHaveLength(0);
  });
});

describe("formatSkillsForPrompt", () => {
  const sampleSkills: Skill[] = [
    {
      name: "my-skill",
      description: "Does cool things",
      filePath: "/path/to/my-skill/SKILL.md",
      baseDir: "/path/to/my-skill",
      sourceInfo: { source: "local", scope: "user" } as any,
      disableModelInvocation: false,
    },
    {
      name: "other-skill",
      description: "Does other things",
      filePath: "/path/to/other-skill/SKILL.md",
      baseDir: "/path/to/other-skill",
      sourceInfo: { source: "local", scope: "project" } as any,
      disableModelInvocation: false,
    },
  ];

  test("formats skills into XML prompt section", () => {
    const result = formatSkillsForPrompt(sampleSkills);

    expect(result).toContain("<available_skills>");
    expect(result).toContain("</available_skills>");
    expect(result).toContain("<name>my-skill</name>");
    expect(result).toContain("<description>Does cool things</description>");
    expect(result).toContain("<location>/path/to/my-skill/SKILL.md</location>");
    expect(result).toContain("<name>other-skill</name>");
  });

  test("includes instructional preamble", () => {
    const result = formatSkillsForPrompt(sampleSkills);

    expect(result).toContain("skills provide specialized instructions");
    expect(result).toContain("read tool to load a skill");
  });

  test("returns empty string for empty skills array", () => {
    const result = formatSkillsForPrompt([]);
    expect(result).toBe("");
  });

  test("excludes skills with disableModelInvocation=true", () => {
    const skillsWithDisabled: Skill[] = [
      ...sampleSkills,
      {
        name: "hidden-skill",
        description: "Should not appear",
        filePath: "/path/to/hidden/SKILL.md",
        baseDir: "/path/to/hidden",
        sourceInfo: { source: "local" } as any,
        disableModelInvocation: true,
      },
    ];

    const result = formatSkillsForPrompt(skillsWithDisabled);

    expect(result).toContain("<name>my-skill</name>");
    expect(result).toContain("<name>other-skill</name>");
    expect(result).not.toContain("<name>hidden-skill</name>");
  });

  test("escapes XML special characters in name and description", () => {
    const xmlSkills: Skill[] = [
      {
        name: "xml-skill",
        description: 'Has <tags> & "quotes" and \'apostrophes\'',
        filePath: "/path/to/xml/SKILL.md",
        baseDir: "/path/to/xml",
        sourceInfo: { source: "local" } as any,
        disableModelInvocation: false,
      },
    ];

    const result = formatSkillsForPrompt(xmlSkills);

    expect(result).toContain("&lt;tags&gt;");
    expect(result).toContain("&amp;");
    expect(result).toContain("&quot;");
    expect(result).toContain("&apos;");
  });

  test("formats each skill in <skill> wrapper with proper nesting", () => {
    const result = formatSkillsForPrompt(sampleSkills);

    const openings = result.match(/<skill>/g);
    expect(openings).toHaveLength(2);

    const closings = result.match(/<\/skill>/g);
    expect(closings).toHaveLength(2);
  });
});

describe("loadAgentSkills - .claude/skills/ and .agent/skills/ discovery", () => {
  const TMP_CWD = join(FIXTURES_DIR, "__tmp_test_cwd__");

  beforeEach(() => {
    // Create a temp cwd with .claude/skills/test-skill/SKILL.md
    mkdirSync(join(TMP_CWD, ".claude/skills/test-skill"), { recursive: true });
    writeFileSync(
      join(TMP_CWD, ".claude/skills/test-skill/SKILL.md"),
      "---\nname: test-skill\ndescription: Discovered via .claude/skills\n---\n# Test"
    );
  });

  afterEach(() => {
    rmSync(TMP_CWD, { recursive: true, force: true });
  });

  test("discovers skills from .claude/skills/ automatically", () => {
    const { skills } = loadAgentSkills({ cwd: TMP_CWD });
    const names = skills.map((s) => s.name);
    expect(names).toContain("test-skill");
  });

  test("discovers skills from .agent/skills/ automatically", () => {
    mkdirSync(join(TMP_CWD, ".agent/skills/agent-skill"), { recursive: true });
    writeFileSync(
      join(TMP_CWD, ".agent/skills/agent-skill/SKILL.md"),
      "---\nname: agent-skill\ndescription: Discovered via .agent/skills\n---\n# Test"
    );

    const { skills } = loadAgentSkills({ cwd: TMP_CWD });
    const names = skills.map((s) => s.name);
    expect(names).toContain("agent-skill");
  });

  test("discovers from both .claude/skills/ and .agent/skills/ simultaneously", () => {
    mkdirSync(join(TMP_CWD, ".agent/skills/agent-skill"), { recursive: true });
    writeFileSync(
      join(TMP_CWD, ".agent/skills/agent-skill/SKILL.md"),
      "---\nname: agent-skill\ndescription: From .agent\n---\n# Test"
    );

    const { skills } = loadAgentSkills({ cwd: TMP_CWD });
    const names = skills.map((s) => s.name);
    expect(names).toContain("test-skill");
    expect(names).toContain("agent-skill");
  });

  test("merges discovered paths with explicit skillPaths", () => {
    const { skills } = loadAgentSkills({
      cwd: TMP_CWD,
      skillPaths: [join(FIXTURES_DIR, "another-skill")],
    });

    const names = skills.map((s) => s.name);
    expect(names).toContain("test-skill");       // from .claude/skills
    expect(names).toContain("another-skill");     // from explicit skillPaths
  });

  test("gracefully handles missing .claude/skills and .agent/skills dirs", () => {
    const emptyCwd = join(FIXTURES_DIR, "__tmp_empty_cwd__");
    mkdirSync(emptyCwd, { recursive: true });

    try {
      const { skills, diagnostics } = loadAgentSkills({ cwd: emptyCwd });
      // No crash, may find skills from .pi defaults or nothing
      expect(Array.isArray(skills)).toBe(true);
      expect(Array.isArray(diagnostics)).toBe(true);
    } finally {
      rmSync(emptyCwd, { recursive: true, force: true });
    }
  });
});

describe("skill name validation", () => {
  test("valid lowercase hyphenated name passes", () => {
    const { skills, diagnostics } = loadSkillsFromDir({
      dir: join(FIXTURES_DIR, "valid-skill"),
      source: "path",
    });

    expect(skills).toHaveLength(1);
    const nameErrors = diagnostics.filter((d) =>
      d.message.includes("name") && d.message.includes("does not match")
    );
    expect(nameErrors).toHaveLength(0);
  });

  test("name with uppercase and special chars produces warnings", () => {
    const { diagnostics } = loadSkillsFromDir({
      dir: join(FIXTURES_DIR, "bad-name"),
      source: "path",
    });

    const nameWarnings = diagnostics.filter((d) =>
      d.message.includes("invalid characters")
    );
    expect(nameWarnings.length).toBeGreaterThanOrEqual(1);
  });
});

describe("formatSkillsForPrompt integration", () => {
  test("full round-trip: load skills then format for prompt", () => {
    const { skills } = loadSkillsFromDir({
      dir: FIXTURES_DIR,
      source: "path",
    });

    const prompt = formatSkillsForPrompt(skills);

    expect(prompt).toContain("<name>valid-skill</name>");
    expect(prompt).toContain("<name>another-skill</name>");
    expect(prompt).toContain("<name>skill-with-scripts</name>");
    // disabled-skill should be excluded
    expect(prompt).not.toContain("<name>disabled-skill</name>");
  });
});
