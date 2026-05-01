import { describe, test, expect } from "bun:test";
import {
  details,
  validateResult,
  ALL_TOOL_NAMES,
  type ToolName,
  type ToolResultBase,
} from "../tools/result-types.js";

// ─── Unit Tests: result-types.ts ────────────────────────────────────

describe("result-types", () => {
  test("details() creates correct shape", () => {
    const d = details("rm_analyze", true, { episode: "test", category: "narrative_drama" });
    expect(d.tool).toBe("rm_analyze");
    expect(d.success).toBe(true);
    expect(d.data.episode).toBe("test");
    expect(d.data.category).toBe("narrative_drama");
  });

  test("details() error result", () => {
    const d = details("rm_analyze", false, { error: "not found" });
    expect(d.tool).toBe("rm_analyze");
    expect(d.success).toBe(false);
    expect(d.data.error).toBe("not found");
  });

  test("ALL_TOOL_NAMES has 25 entries", () => {
    expect(ALL_TOOL_NAMES).toHaveLength(25);
  });

  test("ALL_TOOL_NAMES covers all 6 tool groups", () => {
    const rm = ALL_TOOL_NAMES.filter(n => n.startsWith("rm_"));
    const sg = ALL_TOOL_NAMES.filter(n => n.startsWith("sg_"));
    const sc = ALL_TOOL_NAMES.filter(n => n.startsWith("sc_"));
    const tts = ALL_TOOL_NAMES.filter(n => n.startsWith("tts_"));
    const render = ALL_TOOL_NAMES.filter(n => n.startsWith("render_"));
    const image = ALL_TOOL_NAMES.filter(n => n.startsWith("image_"));

    expect(rm).toHaveLength(3);
    expect(sg).toHaveLength(10);
    expect(sc).toHaveLength(3);
    expect(tts).toHaveLength(3);
    expect(render).toHaveLength(3);
    expect(image).toHaveLength(3);
  });
});

// ─── Validation Tests ───────────────────────────────────────────────

describe("validateResult", () => {
  test("valid success result passes", () => {
    const result = details("rm_analyze", true, {
      episode: "weapon-forger-ch1-ep1",
      category: "narrative_drama",
      scenes: [],
      totalFrames: 1200,
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("valid error result passes", () => {
    const result = details("rm_analyze", false, { error: "not found" });
    expect(validateResult(result)).toEqual([]);
  });

  test("missing tool name fails", () => {
    const result = { tool: "", success: true, data: {} } as ToolResultBase;
    const errors = validateResult(result);
    expect(errors).toContain("missing tool name");
  });

  test("missing success flag fails", () => {
    const result = { tool: "rm_analyze", data: {} } as any;
    const errors = validateResult(result);
    expect(errors).toContain("missing or invalid success flag");
  });

  test("missing data object fails", () => {
    const result = { tool: "rm_analyze", success: true } as any;
    const errors = validateResult(result);
    expect(errors).toContain("missing data object");
  });

  test("error result without error field fails", () => {
    const result = details("rm_analyze", false, {});
    const errors = validateResult(result);
    expect(errors).toContain("error result missing 'error' field");
  });

  test("success result missing required field fails", () => {
    const result = details("rm_analyze", true, { episode: "test" });
    const errors = validateResult(result);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes("category") || e.includes("scenes") || e.includes("totalFrames"))).toBe(true);
  });
});

// ─── Per-Group Shape Validation ─────────────────────────────────────

describe("tool result shape validation", () => {
  // Simulate results from each tool group and validate

  test("rm_analyze shape is valid", () => {
    const result = details("rm_analyze", true, {
      episode: "weapon-forger-ch1-ep1",
      analysisDimensions: ["effect:shake", "emotion:angry"],
      scores: { "char:Lin.lines": 42 },
      issues: [],
      category: "narrative_drama",
      scenes: [{ name: "TitleScene", frames: 120, seconds: 4, dialogCount: 0, characters: [], effects: [] }],
      characterStats: {},
      effectDistribution: {},
      emotionDistribution: {},
      totalFrames: 1200,
      totalSeconds: 40,
      voiceMap: {},
      source: "src",
    });
    expect(validateResult(result)).toEqual([]);
    expect(result.data.episode).toBe("weapon-forger-ch1-ep1");
    expect(result.data.source).toBe("src");
  });

  test("rm_suggest shape is valid", () => {
    const result = details("rm_suggest", true, {
      episode: "weapon-forger",
      suggestionCount: 3,
      categories: ["characters", "pacing"],
      seriesName: "weapon-forger",
      episodeCount: 8,
      suggestions: [],
      storyDebtCount: 3,
      focus: "all",
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("rm_lint shape is valid", () => {
    const result = details("rm_lint", true, {
      episode: "weapon-forger-ch1-ep1",
      issues: [],
      passCount: 6,
      failCount: 0,
      rulesChecked: ["naming", "staticFile", "animation", "imports", "assets", "structure"],
      totalIssues: 0,
      errors: 0,
      warnings: 0,
      strict: false,
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("sg_pipeline shape is valid", () => {
    const result = details("sg_pipeline", true, {
      seriesId: "weapon-forger",
      mode: "hybrid",
      nodes: 42,
      edges: 68,
      communities: 5,
      durationMs: 3200,
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("sg_check shape is valid", () => {
    const result = details("sg_check", true, {
      seriesId: "weapon-forger",
      gateScore: 85,
      decision: "PASS",
      checkCount: 12,
      failures: [],
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("sg_score shape is valid", () => {
    const result = details("sg_score", true, {
      seriesId: "weapon-forger",
      blendedScore: 82,
      dimensions: ["characters", "arcs", "pacing"],
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("sg_status shape is valid", () => {
    const result = details("sg_status", true, {
      hasEpisodeData: true,
      hasMergedGraph: true,
      hasGate: true,
      hasQualityScore: false,
      hasHTML: true,
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("sc_scaffold shape is valid", () => {
    const result = details("sc_scaffold", true, {
      series: "weapon-forger",
      episode: "weapon-forger-ch1-ep1",
      filesCreated: ["5 files"],
      dryRun: false,
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("sc_series_list shape is valid", () => {
    const result = details("sc_series_list", true, {
      series: [{ id: "weapon-forger", displayName: "Weapon Forger", category: "narrative_drama", chapterBased: true, standalone: false, defaultContentScenes: 4 }],
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("sc_episode_list shape is valid", () => {
    const result = details("sc_episode_list", true, {
      episodes: [{ name: "weapon-forger-ch1-ep1", path: "/test", hasPlan: true }],
      seriesDir: "/test",
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("tts_generate shape is valid", () => {
    const result = details("tts_generate", true, {
      episode: "weapon-forger-ch1-ep1",
      engine: "mlx",
      scenesGenerated: ["TitleScene", "ContentScene1"],
      skipExisting: false,
      generated: 4,
      skipped: 0,
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("tts_voices shape is valid", () => {
    const result = details("tts_voices", true, {
      source: "voice-config.json",
      path: "/test/voice-config.json",
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("tts_status shape is valid", () => {
    const result = details("tts_status", true, {
      episode: "weapon-forger-ch1-ep1",
      hasAudio: true,
      fileCount: 8,
      complete: true,
      hasDurations: true,
      hasSegmentDurations: true,
      hasManifest: true,
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("render_episode shape is valid", () => {
    const result = details("render_episode", true, {
      episode: "weapon-forger-ch1-ep1",
      outputPath: "/test/out.mp4",
      fileSizeKb: 20480,
      durationSec: 45.2,
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("render_status shape is valid", () => {
    const result = details("render_status", true, {
      episode: "weapon-forger-ch1-ep1",
      hasRender: true,
      isStale: false,
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("render_list shape is valid", () => {
    const result = details("render_list", true, {
      total: 8,
      rendered: 5,
      notRendered: 3,
      stale: 1,
      episodes: [],
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("image_generate shape is valid", () => {
    const result = details("image_generate", true, {
      seriesId: "weapon-forger",
      requested: 4,
      generated: 3,
      failed: 0,
      skipped: 1,
      files: ["lin-chen-normal.png"],
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("image_status shape is valid", () => {
    const result = details("image_status", true, {
      characterCount: 12,
      backgroundCount: 8,
      manifestCount: 10,
      unpairedCount: 2,
    });
    expect(validateResult(result)).toEqual([]);
  });

  test("image_characters shape is valid", () => {
    const result = details("image_characters", true, {
      characters: [],
    });
    expect(validateResult(result)).toEqual([]);
  });
});

// ─── Error shape validation for all tools ───────────────────────────

describe("error result shapes", () => {
  for (const tool of ALL_TOOL_NAMES) {
    test(`${tool} error result is valid`, () => {
      const result = details(tool, false, { error: "something failed" });
      expect(validateResult(result)).toEqual([]);
      expect(result.tool).toBe(tool);
      expect(result.success).toBe(false);
    });
  }
});
