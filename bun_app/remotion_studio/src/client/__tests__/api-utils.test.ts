import { describe, test, expect } from "bun:test";
import { parseEpisodeId } from "../api";

describe("parseEpisodeId", () => {
  test("parses full episode ID with chapter and episode", () => {
    const result = parseEpisodeId("weapon-forger-ch1-ep3");
    expect(result).toEqual({ seriesId: "weapon-forger", chapter: 1, episode: 3 });
  });

  test("parses episode ID with multi-word series", () => {
    const result = parseEpisodeId("my-core-is-boss-ch2-ep10");
    expect(result).toEqual({ seriesId: "my-core-is-boss", chapter: 2, episode: 10 });
  });

  test("parses episode ID with only episode number", () => {
    const result = parseEpisodeId("storygraph-explainer-ep5");
    expect(result).toEqual({ seriesId: "storygraph-explainer", episode: 5 });
    expect(result.chapter).toBeUndefined();
  });

  test("parses ID with no episode or chapter", () => {
    const result = parseEpisodeId("claude-code-intro");
    expect(result).toEqual({ seriesId: "claude-code-intro" });
    expect(result.chapter).toBeUndefined();
    expect(result.episode).toBeUndefined();
  });

  test("handles double-digit chapter and episode", () => {
    const result = parseEpisodeId("galgame-meme-theater-ch12-ep99");
    expect(result).toEqual({ seriesId: "galgame-meme-theater", chapter: 12, episode: 99 });
  });

  test("handles single-character series ID", () => {
    const result = parseEpisodeId("x-ch1-ep1");
    expect(result).toEqual({ seriesId: "x", chapter: 1, episode: 1 });
  });

  test("handles empty string", () => {
    const result = parseEpisodeId("");
    expect(result).toEqual({ seriesId: "" });
  });

  test("handles series with trailing numbers before ch/ep", () => {
    const result = parseEpisodeId("series123-ch4-ep5");
    expect(result).toEqual({ seriesId: "series123", chapter: 4, episode: 5 });
  });

  test("does not match ch without ep", () => {
    const result = parseEpisodeId("weapon-forger-ch1");
    expect(result.chapter).toBeUndefined();
    expect(result.seriesId).toBe("weapon-forger-ch1");
  });
});
