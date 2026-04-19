import { describe, test, expect } from "bun:test";
import { computeNaming } from "../naming";
import { getSeriesConfig } from "../series-config";

const REPO_ROOT = "/tmp/test-repo";

describe("computeNaming", () => {
  test("chapter-based series: weapon-forger ch1 ep3", () => {
    const config = getSeriesConfig("weapon-forger")!;
    const result = computeNaming(config, null, 1, 3, 2, REPO_ROOT);

    expect(result.dirName).toBe("weapon-forger-ch1-ep3");
    expect(result.packageName).toBe("@bun-remotion/weapon-forger-ch1-ep3");
    expect(result.compositionId).toBe("WeaponForgerCh1Ep3");
    expect(result.scriptAlias).toBe("wf-ch1-ep3");
    expect(result.outputPath).toBe("out/weapon-forger-ch1-ep3.mp4");
    expect(result.seriesId).toBe("weapon-forger");
    expect(result.chapter).toBe(1);
    expect(result.episode).toBe(3);
    expect(result.numContentScenes).toBe(2);
    expect(result.numScenes).toBe(4); // title + 2 content + outro
    expect(result.numTransitions).toBe(3);
    expect(result.isStandalone).toBe(false);
    expect(result.episodeDir).toContain("weapon-forger/weapon-forger-ch1-ep3");
    expect(result.seriesDir).toContain("weapon-forger");
    expect(result.category).toBeNull();
  });

  test("chapter-based series: my-core-is-boss ch2 ep1", () => {
    const config = getSeriesConfig("my-core-is-boss")!;
    const result = computeNaming(config, null, 2, 1, 3, REPO_ROOT);

    expect(result.dirName).toBe("my-core-is-boss-ch2-ep1");
    expect(result.compositionId).toBe("MyCoreIsBossCh2Ep1");
    expect(result.scriptAlias).toBe("mcb-ch2-ep1");
    expect(result.numScenes).toBe(5); // title + 3 content + outro
    expect(result.numTransitions).toBe(4);
    expect(result.isStandalone).toBe(false);
  });

  test("flat series: galgame-meme-theater ep5", () => {
    const config = getSeriesConfig("galgame-meme-theater")!;
    const result = computeNaming(config, null, null, 5, 4, REPO_ROOT);

    expect(result.dirName).toBe("galgame-meme-theater-ep5");
    expect(result.packageName).toBe("@bun-remotion/galgame-meme-theater-ep5");
    expect(result.compositionId).toBe("GalgameMemeTheaterEp5");
    expect(result.scriptAlias).toBe("meme5");
    expect(result.outputPath).toBe("out/galgame-meme-theater-ep5.mp4");
    expect(result.seriesId).toBe("galgame-meme-theater");
    expect(result.chapter).toBeNull();
    expect(result.episode).toBe(5);
    expect(result.numContentScenes).toBe(4);
    expect(result.numScenes).toBe(6); // title + 4 content + outro
    expect(result.numTransitions).toBe(5);
    expect(result.isStandalone).toBe(false);
    expect(result.episodeDir).toContain("galgame-meme-theater/galgame-meme-theater-ep5");
  });

  test("chapter-based with category: storygraph-explainer ch1 ep1", () => {
    const config = getSeriesConfig("storygraph-explainer")!;
    const result = computeNaming(config, null, 1, 1, 7, REPO_ROOT);

    expect(result.dirName).toBe("storygraph-explainer-ch1-ep1");
    expect(result.packageName).toBe("@bun-remotion/storygraph-explainer-ch1-ep1");
    expect(result.compositionId).toBe("StorygraphExplainerCh1Ep1");
    expect(result.scriptAlias).toBe("sge-ch1-ep1");
    expect(result.outputPath).toBe("out/storygraph-explainer-ch1-ep1.mp4");
    expect(result.seriesId).toBe("storygraph-explainer");
    expect(result.chapter).toBe(1);
    expect(result.episode).toBe(1);
    expect(result.category).toBeNull();
    expect(result.numContentScenes).toBe(7);
    expect(result.numScenes).toBe(9); // title + 7 content + outro
    expect(result.numTransitions).toBe(8);
    expect(result.isStandalone).toBe(false);
  });

  test("null config without category falls back to unknown", () => {
    const result = computeNaming(null, null, null, null, 3, REPO_ROOT);

    expect(result.seriesId).toBe("standalone");
    expect(result.dirName).toBe("unknown-project");
    expect(result.compositionId).toBe("UnknownProject");
    expect(result.scriptAlias).toBe("unknown");
    expect(result.isStandalone).toBe(true);
  });

  test("null config with category uses category-based fallback", () => {
    const result = computeNaming(null, "tech_explainer", null, null, 5, REPO_ROOT);

    expect(result.seriesId).toBe("tech_explainer-project");
    expect(result.dirName).toBe("unknown-project");
    expect(result.isStandalone).toBe(true);
  });

  test("numScenes and numTransitions are consistent", () => {
    const config = getSeriesConfig("weapon-forger")!;

    for (let scenes = 1; scenes <= 10; scenes++) {
      const result = computeNaming(config, null, 1, 1, scenes, REPO_ROOT);
      expect(result.numScenes).toBe(scenes + 2); // title + content + outro
      expect(result.numTransitions).toBe(scenes + 1);
    }
  });

  test("compositionId is always valid PascalCase", () => {
    const wf = getSeriesConfig("weapon-forger")!;
    const mcb = getSeriesConfig("my-core-is-boss")!;
    const meme = getSeriesConfig("galgame-meme-theater")!;
    const intro = getSeriesConfig("storygraph-explainer")!;

    const cases = [
      computeNaming(wf, null, 1, 3, 2, REPO_ROOT),
      computeNaming(mcb, null, 2, 1, 3, REPO_ROOT),
      computeNaming(meme, null, null, 5, 4, REPO_ROOT),
      computeNaming(intro, null, 1, 1, 7, REPO_ROOT),
    ];

    for (const c of cases) {
      // PascalCase: starts with uppercase, no hyphens or underscores
      expect(c.compositionId).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
    }
  });

  test("episodeDir is always an absolute path", () => {
    const wf = getSeriesConfig("weapon-forger")!;
    const intro = getSeriesConfig("storygraph-explainer")!;

    const ep = computeNaming(wf, null, 1, 1, 2, REPO_ROOT);
    const standalone = computeNaming(intro, null, 1, 1, 7, REPO_ROOT);

    expect(ep.episodeDir.startsWith("/")).toBe(true);
    expect(standalone.episodeDir.startsWith("/")).toBe(true);
    expect(ep.seriesDir.startsWith("/")).toBe(true);
    expect(standalone.seriesDir.startsWith("/")).toBe(true);
  });
});
