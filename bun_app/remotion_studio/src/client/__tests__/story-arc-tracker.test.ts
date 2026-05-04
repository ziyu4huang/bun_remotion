import { describe, test, expect } from "bun:test";
import { matchEpisodeProgress, computeOverallStatus } from "../components/StoryArcTracker";
import type { EpisodeProgress } from "../../shared/types";

const makeEp = (overrides: Partial<EpisodeProgress> & { seriesId: string; chapter: number; episode: number }): EpisodeProgress => ({
  seriesName: "test",
  category: "narrative_drama",
  episodeId: `${overrides.seriesId}-ch${overrides.chapter}-ep${overrides.episode}`,
  steps: { scaffold: false, pipeline: false, check: false, score: false, image: false, tts: false, render: false },
  completedSteps: 0,
  totalSteps: 7,
  ...overrides,
});

const entries: EpisodeProgress[] = [
  makeEp({ seriesId: "weapon-forger", chapter: 1, episode: 1, completedSteps: 7 }),
  makeEp({ seriesId: "weapon-forger", chapter: 1, episode: 2, completedSteps: 3 }),
  makeEp({ seriesId: "weapon-forger", chapter: 2, episode: 1, completedSteps: 0 }),
  makeEp({ seriesId: "other-series", chapter: 1, episode: 1, completedSteps: 7 }),
];

describe("matchEpisodeProgress", () => {
  test("matches ch1ep1 to correct entry", () => {
    const result = matchEpisodeProgress("ch1ep1", entries, "weapon-forger");
    expect(result).toBeDefined();
    expect(result!.chapter).toBe(1);
    expect(result!.episode).toBe(1);
    expect(result!.completedSteps).toBe(7);
  });

  test("matches ch2ep1", () => {
    const result = matchEpisodeProgress("ch2ep1", entries, "weapon-forger");
    expect(result).toBeDefined();
    expect(result!.chapter).toBe(2);
  });

  test("returns undefined for missing episode", () => {
    const result = matchEpisodeProgress("ch5ep1", entries, "weapon-forger");
    expect(result).toBeUndefined();
  });

  test("returns undefined for wrong series", () => {
    const result = matchEpisodeProgress("ch1ep1", entries, "no-such-series");
    expect(result).toBeUndefined();
  });

  test("returns undefined for malformed ID", () => {
    expect(matchEpisodeProgress("ep1", entries, "weapon-forger")).toBeUndefined();
    expect(matchEpisodeProgress("", entries, "weapon-forger")).toBeUndefined();
    expect(matchEpisodeProgress("ch1", entries, "weapon-forger")).toBeUndefined();
  });

  test("does not match across series boundaries", () => {
    const result = matchEpisodeProgress("ch1ep1", entries, "other-series");
    expect(result).toBeDefined();
    expect(result!.seriesId).toBe("other-series");
  });
});

describe("computeOverallStatus", () => {
  test("returns completed when all steps done", () => {
    const ep = makeEp({ seriesId: "x", chapter: 1, episode: 1, completedSteps: 7, totalSteps: 7 });
    expect(computeOverallStatus(ep)).toBe("completed");
  });

  test("returns running when some steps done", () => {
    const ep = makeEp({ seriesId: "x", chapter: 1, episode: 1, completedSteps: 3, totalSteps: 7 });
    expect(computeOverallStatus(ep)).toBe("running");
  });

  test("returns pending when no steps done", () => {
    const ep = makeEp({ seriesId: "x", chapter: 1, episode: 1, completedSteps: 0, totalSteps: 7 });
    expect(computeOverallStatus(ep)).toBe("pending");
  });

  test("returns pending for undefined", () => {
    expect(computeOverallStatus(undefined)).toBe("pending");
  });

  test("returns pending for zero total steps", () => {
    const ep = makeEp({ seriesId: "x", chapter: 1, episode: 1, completedSteps: 0, totalSteps: 0 });
    expect(computeOverallStatus(ep)).toBe("pending");
  });
});
