import { describe, test, expect } from "bun:test";
import {
  normalizeEpisodeId,
  parseMarkdownTable,
  splitSections,
  parsePlan,
} from "../plan-parser";
import { validatePlan } from "../chapter-validator";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─── normalizeEpisodeId ───

describe("normalizeEpisodeId", () => {
  test("normalizes ch1-ep1", () => {
    expect(normalizeEpisodeId("ch1-ep1")).toBe("ch1ep1");
  });
  test("normalizes Ch1-Ep1", () => {
    expect(normalizeEpisodeId("Ch1-Ep1")).toBe("ch1ep1");
  });
  test("normalizes ch1ep1 (already normalized)", () => {
    expect(normalizeEpisodeId("ch1ep1")).toBe("ch1ep1");
  });
  test("normalizes ep1 (flat numbering)", () => {
    expect(normalizeEpisodeId("ep1")).toBe("ep1");
  });
  test("normalizes Ep7", () => {
    expect(normalizeEpisodeId("Ep7")).toBe("ep7");
  });
  test("normalizes ch10-ep3", () => {
    expect(normalizeEpisodeId("ch10-ep3")).toBe("ch10ep3");
  });
  test("passes through unknown format as lowercase", () => {
    expect(normalizeEpisodeId("SPECIAL")).toBe("special");
  });
});

// ─── parseMarkdownTable ───

describe("parseMarkdownTable", () => {
  test("parses standard table", () => {
    const lines = [
      "| Character | Name | Voice |",
      "|-----------|------|--------|",
      "| zhoumo | 周墨 | TBD |",
      "| elder | 長老 | TBD |",
    ];
    const result = parseMarkdownTable(lines);
    expect(result).not.toBeNull();
    expect(result!.headers).toEqual(["Character", "Name", "Voice"]);
    expect(result!.rows).toHaveLength(2);
    expect(result!.rows[0]).toEqual(["zhoumo", "周墨", "TBD"]);
  });

  test("returns null for no table lines", () => {
    expect(parseMarkdownTable(["just text", "more text"])).toBeNull();
  });

  test("returns null for header-only table", () => {
    const lines = [
      "| Character | Name |",
      "|-----------|------|",
    ];
    expect(parseMarkdownTable(lines)).toBeNull();
  });
});

// ─── splitSections ───

describe("splitSections", () => {
  test("splits by ## headings", () => {
    const content = "# Title\n\n## Characters\n\nbody1\n\n## Episode Guide\n\nbody2\n";
    const sections = splitSections(content);
    expect(sections.has("characters")).toBe(true);
    expect(sections.has("episode guide")).toBe(true);
  });

  test("extracts section body correctly", () => {
    const content = "# Title\n\n## Characters\n\nline1\nline2\n\n## Episode Guide\n\nother\n";
    const sections = splitSections(content);
    expect(sections.get("characters")?.body).toContain("line1\nline2");
  });
});

// ─── Integration: parsePlan with real PLAN.md files ───

const repoRoot = resolve(import.meta.dir, "../../../../..");

describe("parsePlan: weapon-forger", () => {
  const planPath = resolve(repoRoot, "bun_remotion_proj/weapon-forger/PLAN.md");
  let plan: any;

  test("parses without error", async () => {
    const content = readFileSync(planPath, "utf-8");
    plan = await parsePlan(content, { sourcePath: planPath, mode: "regex" });
    expect(plan).toBeDefined();
  });

  test("extracts 7 characters", () => {
    expect(plan.characters).not.toBeNull();
    expect(plan.characters!.length).toBe(7);
    expect(plan.characters!.find(c => c.id === "zhoumo")).toBeDefined();
    expect(plan.characters!.find(c => c.id === "zhoumo")!.name).toBe("周墨");
  });

  test("extracts 12 episodes", () => {
    expect(plan.episodeGuide).not.toBeNull();
    expect(plan.episodeGuide!.length).toBe(12);
  });

  test("extracts 4 story arcs with episodes", () => {
    expect(plan.storyArcs).not.toBeNull();
    expect(plan.storyArcs!.length).toBe(4);
    expect(plan.storyArcs!.every(a => a.episodes.length > 0)).toBe(true);
  });

  test("extracts 3 gag types", () => {
    expect(plan.runningGags).not.toBeNull();
    expect(plan.runningGags!.gagTypes.length).toBe(3);
  });

  test("derives 4 chapters", () => {
    expect(plan.chapters.length).toBe(4);
    expect(plan.chapters.every(c => c.episodeCount === 3)).toBe(true);
  });

  test("chapter rules present", () => {
    expect(plan.chapterRules).not.toBeNull();
    expect(plan.chapterRules!.length).toBeGreaterThan(0);
  });
});

describe("parsePlan: my-core-is-boss", () => {
  const planPath = resolve(repoRoot, "bun_remotion_proj/my-core-is-boss/PLAN.md");
  let plan: any;

  test("parses without error", async () => {
    const content = readFileSync(planPath, "utf-8");
    plan = await parsePlan(content, { sourcePath: planPath, mode: "regex" });
    expect(plan).toBeDefined();
  });

  test("extracts 5 characters", () => {
    expect(plan.characters).not.toBeNull();
    expect(plan.characters!.length).toBe(5);
  });

  test("expands episode ranges to 34 episodes", () => {
    expect(plan.episodeGuide).not.toBeNull();
    expect(plan.episodeGuide!.length).toBe(34);
  });

  test("derives 10 chapters", () => {
    expect(plan.chapters.length).toBe(10);
  });

  test("no chapter rules", () => {
    expect(plan.chapterRules).toBeNull();
  });

  test("no running gags", () => {
    expect(plan.runningGags).toBeNull();
  });
});

describe("parsePlan: galgame-meme-theater", () => {
  const planPath = resolve(repoRoot, "bun_remotion_proj/galgame-meme-theater/PLAN.md");
  let plan: any;

  test("parses without error", async () => {
    const content = readFileSync(planPath, "utf-8");
    plan = await parsePlan(content, { sourcePath: planPath, mode: "regex" });
    expect(plan).toBeDefined();
  });

  test("extracts characters", () => {
    expect(plan.characters).not.toBeNull();
    expect(plan.characters!.length).toBeGreaterThan(0);
  });

  test("extracts flat-numbered episodes", () => {
    expect(plan.episodeGuide).not.toBeNull();
    expect(plan.episodeGuide!.length).toBeGreaterThanOrEqual(7);
    expect(plan.episodeGuide!.every(e => e.id.startsWith("ep"))).toBe(true);
  });

  test("no chapters (flat numbering)", () => {
    expect(plan.chapters.length).toBe(0);
  });
});

describe("parsePlan: storygraph-explainer", () => {
  const planPath = resolve(repoRoot, "bun_remotion_proj/storygraph-explainer/PLAN.md");
  let plan: any;

  test("parses without error", async () => {
    const content = readFileSync(planPath, "utf-8");
    plan = await parsePlan(content, { sourcePath: planPath, mode: "regex" });
    expect(plan).toBeDefined();
  });

  test("no characters (tech explainer)", () => {
    expect(plan.characters).toBeNull();
  });

  test("extracts 3 episodes", () => {
    expect(plan.episodeGuide).not.toBeNull();
    expect(plan.episodeGuide!.length).toBe(3);
  });

  test("episode titles are Chinese", () => {
    expect(plan.episodeGuide![0].title).toBe("知識圖譜是什麼？");
  });
});

// ─── Validator Tests ───

describe("validatePlan", () => {
  function makePlan(overrides: Partial<any> = {}): any {
    return {
      seriesId: "test",
      seriesName: "Test",
      metadata: { parsedAt: "", sourcePath: "", mode: "regex" },
      characters: [{ id: "hero", name: "Hero", voice: "tts", gender: "male", color: null, images: null, firstEp: null }],
      episodeGuide: [
        { id: "ch1ep1", chapter: 1, episode: 1, episodeRange: null, title: "Ep1", characters: ["hero"], status: "Complete", language: null, theme: null },
        { id: "ch1ep2", chapter: 1, episode: 2, episodeRange: null, title: "Ep2", characters: ["hero"], status: "Complete", language: null, theme: null },
        { id: "ch1ep3", chapter: 1, episode: 3, episodeRange: null, title: "Ep3", characters: ["hero"], status: "Planned", language: null, theme: null },
      ],
      chapterRules: null,
      runningGags: null,
      storyArcs: null,
      gagRules: null,
      chapters: [
        { chapter: 1, episodeCount: 3, completedCount: 2, plannedCount: 1, status: "in_progress" as const },
      ],
      ...overrides,
    };
  }

  test("passes valid plan", () => {
    const result = validatePlan(makePlan());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("detects missing characters section", () => {
    const result = validatePlan(makePlan({ characters: null }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.rule === "MISSING_REQUIRED_SECTIONS")).toBe(true);
  });

  test("detects undefined character reference", () => {
    const plan = makePlan();
    plan.episodeGuide[0].characters = ["hero", "villain"];
    const result = validatePlan(plan);
    expect(result.errors.some(e => e.rule === "CHARACTER_CONSISTENCY")).toBe(true);
  });

  test("detects duplicate episode IDs", () => {
    const plan = makePlan();
    plan.episodeGuide.push({ ...plan.episodeGuide[0] });
    const result = validatePlan(plan);
    expect(result.errors.some(e => e.rule === "DUPLICATE_EPISODE_IDS")).toBe(true);
  });

  test("episode count rule with chapter rules", () => {
    const plan = makePlan({
      chapterRules: ["Episode count: Each chapter MUST have 3-5 episodes"],
    });
    const result = validatePlan(plan);
    // 3 episodes, range 3-5: should pass
    expect(result.errors.some(e => e.rule === "EPISODE_COUNT")).toBe(false);

    // Change chapter episode count to 2
    plan.chapters[0].episodeCount = 2;
    plan.episodeGuide = plan.episodeGuide.slice(0, 2);
    const result2 = validatePlan(plan);
    expect(result2.errors.some(e => e.rule === "EPISODE_COUNT")).toBe(true);
  });

  test("gag evolution minimum warning", () => {
    const plan = makePlan({
      gagRules: ["每集至少推進 2 條梗"],
      runningGags: {
        gagTypes: ["gag1"],
        episodeColumns: ["ch1ep1", "ch1ep2", "ch1ep3"],
        matrix: {
          "gag1": { "ch1ep1": "manifestation1" },
        },
      },
    });
    const result = validatePlan(plan);
    expect(result.warnings.some(w => w.rule === "GAG_EVOLUTION_MINIMUM")).toBe(true);
  });
});
