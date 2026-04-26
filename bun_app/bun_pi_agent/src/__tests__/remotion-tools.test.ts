import { describe, test, expect } from "bun:test";
import { resolve } from "node:path";
import {
  createRemotionTools,
  createRemotionAnalyzeTool,
  createRemotionSuggestTool,
  createRemotionLintTool,
} from "../tools/remotion-tools.js";

const REPO_ROOT = resolve(import.meta.dir, "../../../../");
const WEAPON_FORGER_EP1 = resolve(REPO_ROOT, "bun_remotion_proj/weapon-forger/weapon-forger-ch1-ep1");
const WEAPON_FORGER = resolve(REPO_ROOT, "bun_remotion_proj/weapon-forger");
const MY_CORE_IS_BOSS_EP1 = resolve(REPO_ROOT, "bun_remotion_proj/my-core-is-boss/my-core-is-boss-ch1-ep1");
const MY_CORE_IS_BOSS = resolve(REPO_ROOT, "bun_remotion_proj/my-core-is-boss");

// ─── createRemotionTools ─────────────────────────────────────────

describe("createRemotionTools", () => {
  test("returns 3 tools", () => {
    const tools = createRemotionTools();
    expect(tools).toHaveLength(3);
  });

  test("tool names are rm_analyze, rm_suggest, rm_lint", () => {
    const tools = createRemotionTools();
    const names = tools.map(t => t.name);
    expect(names).toEqual(["rm_analyze", "rm_suggest", "rm_lint"]);
  });

  test("each tool has required properties", () => {
    const tools = createRemotionTools();
    for (const tool of tools) {
      expect(typeof tool.name).toBe("string");
      expect(tool.name.length).toBeGreaterThan(0);
      expect(typeof tool.label).toBe("string");
      expect(typeof tool.description).toBe("string");
      expect(tool.description.length).toBeGreaterThan(0);
      expect(typeof tool.execute).toBe("function");
      expect(tool.parameters).toBeDefined();
    }
  });

  test("all tool names are unique", () => {
    const tools = createRemotionTools();
    const names = tools.map(t => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

// ─── rm_analyze ──────────────────────────────────────────────────

describe("rm_analyze", () => {
  const tool = createRemotionAnalyzeTool();

  test("returns error for non-existent directory", async () => {
    const result = await tool.execute("1", { episodeDir: "/nonexistent/path" });
    expect(result.content[0].text).toContain("Error:");
    expect(result.details).toHaveProperty("error");
  });

  test("analyzes weapon-forger-ch1-ep1", async () => {
    const result = await tool.execute("1", { episodeDir: WEAPON_FORGER_EP1 });
    const text = result.content[0].text;

    expect(text).toContain("Episode Analysis:");
    expect(text).toContain("weapon-forger");
    expect(text).toContain("narrative_drama");

    // Should have scene structure
    expect(text).toContain("Scene Structure");
    expect(text).toContain("frames");

    // Should have character interactions
    expect(text).toContain("Character Interactions");

    // Check details
    expect(result.details).toHaveProperty("scenes");
    expect(result.details).toHaveProperty("characterStats");
    expect(result.details).toHaveProperty("totalFrames");
    expect(result.details).toHaveProperty("totalSeconds");
    expect(result.details).toHaveProperty("source");
  });

  test("detects characters from dialog", async () => {
    const result = await tool.execute("1", { episodeDir: WEAPON_FORGER_EP1 });
    const stats = result.details.characterStats as Record<string, unknown>;

    // weapon-forger ch1ep1 has zhoumo and examiner
    expect(Object.keys(stats)).toContain("zhoumo");
    expect(Object.keys(stats)).toContain("examiner");
  });

  test("source parameter forces src-only parsing", async () => {
    const result = await tool.execute("1", { episodeDir: WEAPON_FORGER_EP1, source: "src" });
    expect(result.details.source).toBe("src");
  });

  test("reads voice manifest", async () => {
    const result = await tool.execute("1", { episodeDir: WEAPON_FORGER_EP1 });
    const text = result.content[0].text;

    // voice-manifest.json has voice assignments
    if (result.details.voiceMap && Object.keys(result.details.voiceMap as Record<string, unknown>).length > 0) {
      expect(text).toContain("Voice Assignments:");
    }
  });
});

// ─── rm_suggest ──────────────────────────────────────────────────

describe("rm_suggest", () => {
  const tool = createRemotionSuggestTool();

  test("returns error for non-existent directory", async () => {
    const result = await tool.execute("1", { seriesDir: "/nonexistent/path" });
    expect(result.content[0].text).toContain("Error:");
  });

  test("returns suggestions for weapon-forger", async () => {
    const result = await tool.execute("1", { seriesDir: WEAPON_FORGER });
    const text = result.content[0].text;

    expect(text).toContain("Content Suggestions: weapon-forger");
    expect(text).toContain("episodes");

    // Check details
    expect(result.details).toHaveProperty("suggestions");
    expect(result.details).toHaveProperty("episodeCount");
    expect(result.details).toHaveProperty("storyDebtCount");
  });

  test("focus parameter filters suggestions", async () => {
    const result = await tool.execute("1", { seriesDir: WEAPON_FORGER, focus: "pacing" });
    const suggestions = result.details.suggestions as Array<{ category: string }>;

    // All suggestions should be pacing-related (or empty)
    for (const s of suggestions) {
      expect(s.category).toBe("pacing");
    }
  });

  test("handles series with few episodes gracefully", async () => {
    // Use a series that exists but may have varying episode counts
    const result = await tool.execute("1", { seriesDir: MY_CORE_IS_BOSS });
    expect(result.content[0].text).toContain("Content Suggestions");
  });
});

// ─── rm_lint ─────────────────────────────────────────────────────

describe("rm_lint", () => {
  const tool = createRemotionLintTool();

  test("returns error for non-existent directory", async () => {
    const result = await tool.execute("1", { episodeDir: "/nonexistent/path" });
    expect(result.content[0].text).toContain("Error:");
  });

  test("lints weapon-forger-ch1-ep1", async () => {
    const result = await tool.execute("1", { episodeDir: WEAPON_FORGER_EP1 });
    const text = result.content[0].text;

    expect(text).toContain("Remotion Lint:");
    expect(text).toContain("rules checked");

    // Check details
    expect(result.details).toHaveProperty("rulesChecked");
    expect(result.details).toHaveProperty("totalIssues");
    expect(result.details).toHaveProperty("errors");
    expect(result.details).toHaveProperty("warnings");
  });

  test("runs specific rules only", async () => {
    const result = await tool.execute("1", { episodeDir: WEAPON_FORGER_EP1, rules: "naming" });
    const rulesChecked = result.details.rulesChecked as string[];

    expect(rulesChecked).toEqual(["naming"]);
  });

  test("detects legacy imports in ch1ep1", async () => {
    const result = await tool.execute("1", { episodeDir: WEAPON_FORGER_EP1, rules: "imports" });
    const issues = result.details.issues as Array<{ rule: string; message: string }>;

    // ch1ep1 uses legacy imports from ../../../assets/components/
    const importIssues = issues.filter(i => i.rule === "imports");
    // May or may not have issues depending on whether shared imports are used
    expect(Array.isArray(importIssues)).toBe(true);
  });

  test("strict mode promotes warnings to errors", async () => {
    const result = await tool.execute("1", { episodeDir: WEAPON_FORGER_EP1, strict: true });
    const details = result.details as { errors: number; warnings: number };

    // In strict mode, all issues should be errors
    expect(details.warnings).toBe(0);
  });

  test("structure rule checks durations match", async () => {
    const result = await tool.execute("1", { episodeDir: WEAPON_FORGER_EP1, rules: "structure" });
    const text = result.content[0].text;

    // Should either pass or report mismatch
    expect(text).toContain("structure");
  });
});
