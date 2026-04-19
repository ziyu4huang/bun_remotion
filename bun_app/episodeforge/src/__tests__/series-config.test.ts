import { describe, test, expect } from "bun:test";
import {
  getSeriesConfig,
  SERIES_REGISTRY,
  type SeriesConfig,
} from "../series-config";

const REQUIRED_FIELDS: (keyof SeriesConfig)[] = [
  "id",
  "displayName",
  "abbreviation",
  "chapterBased",
  "contentScenePrefix",
  "defaultContentScenes",
  "charactersImportPath",
  "componentsImportPath",
  "ttsScriptPath",
  "language",
  "voiceCharacters",
  "transitions",
];

describe("getSeriesConfig", () => {
  test("returns config for weapon-forger", () => {
    const config = getSeriesConfig("weapon-forger");
    expect(config).not.toBeNull();
    expect(config!.id).toBe("weapon-forger");
    expect(config!.displayName).toBe("誰讓他煉器的！");
    expect(config!.chapterBased).toBe(true);
  });

  test("returns config for my-core-is-boss", () => {
    const config = getSeriesConfig("my-core-is-boss");
    expect(config).not.toBeNull();
    expect(config!.id).toBe("my-core-is-boss");
    expect(config!.displayName).toBe("我的核心是大佬");
    expect(config!.chapterBased).toBe(true);
  });

  test("returns config for galgame-meme-theater", () => {
    const config = getSeriesConfig("galgame-meme-theater");
    expect(config).not.toBeNull();
    expect(config!.id).toBe("galgame-meme-theater");
    expect(config!.displayName).toBe("美少女梗圖劇場");
    expect(config!.chapterBased).toBe(false);
  });

  test("returns config for storygraph-explainer", () => {
    const config = getSeriesConfig("storygraph-explainer");
    expect(config).not.toBeNull();
    expect(config!.id).toBe("storygraph-explainer");
    expect(config!.chapterBased).toBe(true);
    expect(config!.category).toBe("tech_explainer");
  });

  test("returns null for unknown series", () => {
    expect(getSeriesConfig("nonexistent-series")).toBeNull();
    expect(getSeriesConfig("")).toBeNull();
    expect(getSeriesConfig("weapon-forgerr")).toBeNull();
  });
});

describe("SeriesConfig structure", () => {
  test("every registered series has all required fields", () => {
    for (const [seriesId, config] of Object.entries(SERIES_REGISTRY)) {
      for (const field of REQUIRED_FIELDS) {
        expect(
          config[field],
          `Series "${seriesId}" missing field "${field}"`,
        ).toBeDefined();
      }
    }
  });

  test("every series id matches its registry key", () => {
    for (const [key, config] of Object.entries(SERIES_REGISTRY)) {
      expect(config.id).toBe(key);
    }
  });

  test("chapterBased series have non-empty abbreviation", () => {
    for (const config of Object.values(SERIES_REGISTRY)) {
      if (config.chapterBased) {
        expect(config.abbreviation.length).toBeGreaterThan(0);
      }
    }
  });

  test("all series have at least one transition", () => {
    for (const config of Object.values(SERIES_REGISTRY)) {
      expect(config.transitions.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("all series have at least one voiceCharacter", () => {
    for (const config of Object.values(SERIES_REGISTRY)) {
      expect(config.voiceCharacters.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("all transitions have required sub-fields", () => {
    for (const [seriesId, config] of Object.entries(SERIES_REGISTRY)) {
      for (let i = 0; i < config.transitions.length; i++) {
        const t = config.transitions[i];
        expect(
          t.importName,
          `${seriesId} transitions[${i}].importName missing`,
        ).toBeTruthy();
        expect(
          t.from,
          `${seriesId} transitions[${i}].from missing`,
        ).toBeTruthy();
        expect(
          t.usage,
          `${seriesId} transitions[${i}].usage missing`,
        ).toBeTruthy();
      }
    }
  });

  test("defaultContentScenes is a positive integer for all series", () => {
    for (const config of Object.values(SERIES_REGISTRY)) {
      expect(Number.isInteger(config.defaultContentScenes)).toBe(true);
      expect(config.defaultContentScenes).toBeGreaterThanOrEqual(1);
    }
  });

  test("language is zh-TW for all series", () => {
    for (const config of Object.values(SERIES_REGISTRY)) {
      expect(config.language).toBe("zh-TW");
    }
  });
});
