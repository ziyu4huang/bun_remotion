import { describe, test, expect } from "bun:test";

// Module exports
import { computeNaming } from "../naming";
import { getSeriesConfig, SERIES_REGISTRY } from "../series-config";
import { parseArgs } from "../args";
import {
  genPackageJson,
  genTsconfig,
  genIndexTs,
  genRootTsx,
  genMainComponent,
  genTitleScene,
  genContentScene,
  genOutroScene,
  genNarration,
  genTodoMd,
  getSceneNames,
  type ScaffoldContext,
} from "../templates";
import { collectFiles, writeFiles, verify } from "../writer";

const REPO_ROOT = "/tmp/test-repo";

// Helper: build a full ScaffoldContext for a given series
function buildContext(
  seriesId: string,
  chapter: number | null,
  episode: number | null,
  numContentScenes?: number,
): ScaffoldContext {
  const config = getSeriesConfig(seriesId)!;
  const scenes = numContentScenes ?? config.defaultContentScenes;
  const category = config.standalone ? config.category ?? null : null;
  const naming = computeNaming(config, category ?? null, chapter, episode, scenes, REPO_ROOT);
  return { naming, config };
}

function buildStandaloneContext(seriesId: string): ScaffoldContext {
  const config = getSeriesConfig(seriesId)!;
  const naming = computeNaming(config, config.category ?? null, null, null, config.defaultContentScenes, REPO_ROOT);
  return { naming, config };
}

// ─── Module Export Smoke Tests ───────────────────────────────────────────────────

describe("module exports", () => {
  test("naming module exports computeNaming as a function", () => {
    expect(typeof computeNaming).toBe("function");
  });

  test("series-config module exports getSeriesConfig as a function", () => {
    expect(typeof getSeriesConfig).toBe("function");
  });

  test("series-config module exports SERIES_REGISTRY as an object", () => {
    expect(typeof SERIES_REGISTRY).toBe("object");
    expect(Object.keys(SERIES_REGISTRY).length).toBeGreaterThanOrEqual(4);
  });

  test("args module exports parseArgs as a function", () => {
    expect(typeof parseArgs).toBe("function");
  });

  test("templates module exports all generator functions", () => {
    expect(typeof genPackageJson).toBe("function");
    expect(typeof genTsconfig).toBe("function");
    expect(typeof genIndexTs).toBe("function");
    expect(typeof genRootTsx).toBe("function");
    expect(typeof genMainComponent).toBe("function");
    expect(typeof genTitleScene).toBe("function");
    expect(typeof genContentScene).toBe("function");
    expect(typeof genOutroScene).toBe("function");
    expect(typeof genNarration).toBe("function");
    expect(typeof genTodoMd).toBe("function");
    expect(typeof getSceneNames).toBe("function");
  });

  test("writer module exports collectFiles, writeFiles, verify", () => {
    expect(typeof collectFiles).toBe("function");
    expect(typeof writeFiles).toBe("function");
    expect(typeof verify).toBe("function");
  });
});

// ─── Integration: computeNaming + getSeriesConfig ─────────────────────────────────

describe("computeNaming + getSeriesConfig integration", () => {
  const seriesIds = ["weapon-forger", "my-core-is-boss", "galgame-meme-theater"];

  test.each(seriesIds)("episode-based series: %s", (seriesId) => {
    const config = getSeriesConfig(seriesId)!;
    const chapter = config.chapterBased ? 1 : null;
    const episode = 1;
    const naming = computeNaming(config, null, chapter, episode, config.defaultContentScenes, REPO_ROOT);

    expect(naming.seriesId).toBe(seriesId);
    expect(naming.dirName).toContain(seriesId);
    expect(naming.packageName).toContain(seriesId);
    expect(naming.isStandalone).toBe(false);
    expect(naming.numScenes).toBe(config.defaultContentScenes + 2);
  });

  test("chapter-based series with category: storygraph-explainer", () => {
    const config = getSeriesConfig("storygraph-explainer")!;
    const naming = computeNaming(config, null, 1, 1, config.defaultContentScenes, REPO_ROOT);

    expect(naming.seriesId).toBe("storygraph-explainer");
    expect(naming.dirName).toBe("storygraph-explainer-ch1-ep1");
    expect(naming.isStandalone).toBe(false);
  });

  test("all series produce consistent naming", () => {
    for (const seriesId of Object.keys(SERIES_REGISTRY)) {
      const config = SERIES_REGISTRY[seriesId];
      const chapter = config.chapterBased ? 1 : null;
      const naming = computeNaming(config, null, chapter, 1, config.defaultContentScenes, REPO_ROOT);
      expect(naming.seriesId).toBe(seriesId);
      expect(naming.numScenes).toBeGreaterThanOrEqual(3);
    }
  });
});

// ─── Template Generator Output Validation ─────────────────────────────────────────

describe("genPackageJson", () => {
  test("produces valid JSON for chapter-based series", () => {
    const ctx = buildContext("weapon-forger", 1, 3);
    const output = genPackageJson(ctx);
    const parsed = JSON.parse(output);

    expect(parsed.name).toBe("@bun-remotion/weapon-forger-ch1-ep3");
    expect(parsed.version).toBe("1.0.0");
    expect(parsed.private).toBe(true);
    expect(parsed.scripts).toBeDefined();
    expect(parsed.scripts.start).toBe("remotion studio");
    expect(parsed.scripts.build).toContain("remotion render");
    expect(parsed.scripts.build).toContain("WeaponForgerCh1Ep3");
    expect(parsed.dependencies["@bun-remotion/shared"]).toBe("workspace:*");
    expect(parsed.dependencies["@remotion/cli"]).toBe("4.0.290");
    expect(parsed.dependencies.react).toBeDefined();
  });

  test("produces valid JSON for flat series", () => {
    const ctx = buildContext("galgame-meme-theater", null, 5);
    const output = genPackageJson(ctx);
    const parsed = JSON.parse(output);

    expect(parsed.name).toBe("@bun-remotion/galgame-meme-theater-ep5");
    expect(parsed.scripts.build).toContain("GalgameMemeTheaterEp5");
  });

  test("produces valid JSON for chapter-based series with category", () => {
    const ctx = buildContext("storygraph-explainer", 1, 1);
    const output = genPackageJson(ctx);
    const parsed = JSON.parse(output);

    expect(parsed.name).toBe("@bun-remotion/storygraph-explainer-ch1-ep1");
    expect(parsed.scripts.build).toContain("StorygraphExplainerCh1Ep1");
  });
});

describe("genTsconfig", () => {
  test("produces valid JSON extending root tsconfig", () => {
    const ctx = buildContext("weapon-forger", 1, 1);
    const output = genTsconfig(ctx);
    const parsed = JSON.parse(output);

    expect(parsed.extends).toBe("../../../tsconfig.json");
    expect(parsed.compilerOptions.outDir).toBe("./dist");
    expect(parsed.compilerOptions.rootDir).toBe("./src");
    expect(parsed.include).toContain("src/**/*.ts");
    expect(parsed.include).toContain("src/**/*.tsx");
  });
});

describe("genIndexTs", () => {
  test("produces registerRoot call", () => {
    const ctx = buildContext("weapon-forger", 1, 1);
    const output = genIndexTs(ctx);

    expect(output).toContain('import { registerRoot } from "remotion"');
    expect(output).toContain('import { RemotionRoot } from "./Root"');
    expect(output).toContain("registerRoot(RemotionRoot)");
  });
});

describe("genRootTsx", () => {
  test("contains Composition with correct id and fps=30", () => {
    const ctx = buildContext("weapon-forger", 1, 3);
    const output = genRootTsx(ctx);

    expect(output).toContain('id="WeaponForgerCh1Ep3"');
    expect(output).toContain("fps={30}");
    expect(output).toContain("width={1920}");
    expect(output).toContain("height={1080}");
    expect(output).toContain("TRANSITION_FRAMES = 15");
  });

  test("correctly computes numTransitions", () => {
    const ctx = buildContext("weapon-forger", 1, 1, 2);
    const output = genRootTsx(ctx);
    // 4 scenes → 3 transitions
    expect(output).toContain("NUM_TRANSITIONS = 3");
  });
});

describe("genMainComponent", () => {
  test("generates scene imports for all content scenes", () => {
    const ctx = buildContext("weapon-forger", 1, 1);
    const output = genMainComponent(ctx);

    expect(output).toContain('import { TitleScene }');
    expect(output).toContain('import { ContentScene1 }');
    expect(output).toContain('import { ContentScene2 }');
    expect(output).toContain('import { OutroScene }');
    expect(output).toContain("export const WeaponForgerCh1Ep1");
  });

  test("uses Joke prefix for galgame-meme-theater", () => {
    const ctx = buildContext("galgame-meme-theater", null, 1);
    const output = genMainComponent(ctx);

    expect(output).toContain('import { JokeScene1 }');
    expect(output).toContain('"Joke 1"');
  });

  test("includes transition imports", () => {
    const ctx = buildContext("weapon-forger", 1, 1);
    const output = genMainComponent(ctx);

    expect(output).toContain("@remotion/transitions");
    expect(output).toContain("fade()");
  });
});

describe("genTitleScene", () => {
  test("contains series displayName", () => {
    const ctx = buildContext("weapon-forger", 1, 3);
    const output = genTitleScene(ctx);

    expect(output).toContain("誰讓他煉器的！");
    expect(output).toContain("TitleScene");
  });

  test("contains chapter and episode labels for chapter-based series", () => {
    const ctx = buildContext("weapon-forger", 1, 3);
    const output = genTitleScene(ctx);

    expect(output).toContain("第1章");
    expect(output).toContain("第3集");
  });

  test("contains only episode label for flat series", () => {
    const ctx = buildContext("galgame-meme-theater", null, 5);
    const output = genTitleScene(ctx);

    expect(output).toContain("第5集");
    expect(output).not.toContain("第null章");
  });
});

describe("genContentScene", () => {
  test("uses correct contentScenePrefix", () => {
    const ctx = buildContext("weapon-forger", 1, 1);
    const output = genContentScene(ctx, 1);

    expect(output).toContain("ContentScene1");
    expect(output).toContain("export const ContentScene1");
  });

  test("galgame-meme-theater uses JokeScene prefix", () => {
    const ctx = buildContext("galgame-meme-theater", null, 1);
    const output = genContentScene(ctx, 2);

    expect(output).toContain("JokeScene2");
    expect(output).toContain("export const JokeScene2");
  });
});

describe("genOutroScene", () => {
  test("contains QuestBadge import", () => {
    const ctx = buildContext("weapon-forger", 1, 3);
    const output = genOutroScene(ctx);

    expect(output).toContain("QuestBadge");
    expect(output).toContain("OutroScene");
  });

  test("shows next episode label for chapter-based series", () => {
    const ctx = buildContext("weapon-forger", 1, 3);
    const output = genOutroScene(ctx);

    expect(output).toContain("第4集");
  });

  test("shows next episode label for flat series", () => {
    const ctx = buildContext("galgame-meme-theater", null, 5);
    const output = genOutroScene(ctx);

    expect(output).toContain("第6集");
  });
});

describe("genNarration", () => {
  test("generates narration with correct voice characters", () => {
    const ctx = buildContext("weapon-forger", 1, 1);
    const output = genNarration(ctx);

    expect(output).toContain("VoiceCharacter");
    expect(output).toContain("NarrationScript");
    expect(output).toContain("zhoumo");
    expect(output).toContain("narrator");
  });

  test("generates correct number of scene entries", () => {
    const ctx = buildContext("weapon-forger", 1, 1, 2);
    const output = genNarration(ctx);
    // 4 scenes: Title, Content1, Content2, Outro
    const sceneMatches = output.match(/scene:\s*"/g);
    expect(sceneMatches?.length).toBe(4);
  });
});

describe("genTodoMd", () => {
  test("contains series displayName", () => {
    const ctx = buildContext("weapon-forger", 1, 1);
    const output = genTodoMd(ctx);

    expect(output).toContain("誰讓他煉器的！");
    expect(output).toContain("TODO");
  });

  test("lists all scene tasks", () => {
    const ctx = buildContext("galgame-meme-theater", null, 1, 4);
    const output = genTodoMd(ctx);

    expect(output).toContain("TitleScene");
    expect(output).toContain("JokeScene1");
    expect(output).toContain("JokeScene4");
    expect(output).toContain("OutroScene");
  });
});

describe("getSceneNames", () => {
  test("returns correct scene names for episode-based series", () => {
    const ctx = buildContext("weapon-forger", 1, 1, 2);
    const names = getSceneNames(ctx);

    expect(names).toEqual(["TitleScene", "ContentScene1", "ContentScene2", "OutroScene"]);
  });

  test("returns correct scene names for galgame series with Joke prefix", () => {
    const ctx = buildContext("galgame-meme-theater", null, 1, 3);
    const names = getSceneNames(ctx);

    expect(names).toEqual(["TitleScene", "JokeScene1", "JokeScene2", "JokeScene3", "OutroScene"]);
  });

  test("returns tech_explainer scenes for storygraph-explainer", () => {
    const ctx = buildContext("storygraph-explainer", 1, 1);
    const names = getSceneNames(ctx);

    expect(names).toEqual([
      "TitleScene",
      "ProblemScene",
      "ArchitectureScene",
      "FeatureScene1",
      "FeatureScene2",
      "FeatureScene3",
      "DemoScene",
      "ComparisonScene",
      "OutroScene",
    ]);
  });
});

// ─── collectFiles Integration ─────────────────────────────────────────────────────

describe("collectFiles integration", () => {
  test("collects correct files for episode-based series", () => {
    const ctx = buildContext("weapon-forger", 1, 1);
    const files = collectFiles(ctx);

    const descriptions = files.map((f) => f.description);
    expect(descriptions).toContain("package.json");
    expect(descriptions).toContain("tsconfig.json");
    expect(descriptions).toContain("src/index.ts");
    expect(descriptions).toContain("src/Root.tsx");
    expect(descriptions).toContain("src/WeaponForgerCh1Ep1.tsx");
    expect(descriptions).toContain("src/scenes/TitleScene.tsx");
    expect(descriptions).toContain("src/scenes/ContentScene1.tsx");
    expect(descriptions).toContain("src/scenes/ContentScene2.tsx");
    expect(descriptions).toContain("src/scenes/OutroScene.tsx");
    expect(descriptions).toContain("scripts/narration.ts");
    expect(descriptions).toContain("TODO.md");

    // Every file has content
    for (const f of files) {
      expect(f.content.length).toBeGreaterThan(0);
      expect(f.path.length).toBeGreaterThan(0);
    }
  });

  test("collects correct files for flat galgame series", () => {
    const ctx = buildContext("galgame-meme-theater", null, 1);
    const files = collectFiles(ctx);

    const descriptions = files.map((f) => f.description);
    expect(descriptions).toContain("src/scenes/JokeScene1.tsx");
    expect(descriptions).toContain("src/scenes/JokeScene4.tsx");
  });

  test("collects tech_explainer files for storygraph-explainer", () => {
    const ctx = buildContext("storygraph-explainer", 1, 1);
    const files = collectFiles(ctx);

    const descriptions = files.map((f) => f.description);
    expect(descriptions).toContain("src/scenes/TitleScene.tsx");
    expect(descriptions).toContain("src/scenes/ProblemScene.tsx");
    expect(descriptions).toContain("src/scenes/ArchitectureScene.tsx");
    expect(descriptions).toContain("src/scenes/FeatureScene1.tsx");
    expect(descriptions).toContain("src/scenes/DemoScene.tsx");
    expect(descriptions).toContain("src/scenes/ComparisonScene.tsx");
    expect(descriptions).toContain("src/scenes/OutroScene.tsx");
  });

  test("all collected files contain valid content (no undefined strings)", () => {
    const ctx = buildContext("weapon-forger", 1, 1);
    const files = collectFiles(ctx);

    for (const f of files) {
      expect(f.content).not.toContain("undefined");
      // Should be valid text content
      expect(typeof f.content).toBe("string");
    }
  });
});

// ─── parseArgs Smoke Test ─────────────────────────────────────────────────────────

describe("parseArgs", () => {
  test("parses --series flag", () => {
    const args = parseArgs(["--series", "weapon-forger"]);
    expect(args.series).toBe("weapon-forger");
  });

  test("parses --ch and --ep flags", () => {
    const args = parseArgs(["--series", "weapon-forger", "--ch", "2", "--ep", "1"]);
    expect(args.series).toBe("weapon-forger");
    expect(args.chapter).toBe(2);
    expect(args.episode).toBe(1);
  });

  test("parses --category flag", () => {
    const args = parseArgs(["--series", "storygraph-explainer", "--category", "tech_explainer"]);
    expect(args.category).toBe("tech_explainer");
  });

  test("parses --dry-run and --skip-install flags", () => {
    const args = parseArgs(["--series", "test", "--dry-run", "--skip-install"]);
    expect(args.dryRun).toBe(true);
    expect(args.skipInstall).toBe(true);
  });

  test("parses --help flag", () => {
    const args = parseArgs(["--help"]);
    expect(args.help).toBe(true);
  });

  test("parses positional series argument", () => {
    const args = parseArgs(["weapon-forger"]);
    expect(args.series).toBe("weapon-forger");
  });

  test("defaults are null/false for optional args", () => {
    const args = parseArgs(["--series", "test"]);
    expect(args.chapter).toBeNull();
    expect(args.episode).toBeNull();
    expect(args.scenes).toBeNull();
    expect(args.category).toBeNull();
    expect(args.dryRun).toBe(false);
    expect(args.skipInstall).toBe(false);
    expect(args.help).toBe(false);
  });
});
