import { describe, test, expect } from "bun:test";
import { app } from "../server/index";

describe("episode-progress API", () => {
  test("GET /api/episode-progress returns ok with episodes and summary", async () => {
    const res = await app.fetch(new Request("http://localhost/api/episode-progress"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data).toHaveProperty("episodes");
    expect(data.data).toHaveProperty("summary");
    expect(data.data.episodes).toBeInstanceOf(Array);
    expect(data.data.summary).toHaveProperty("totalEpisodes");
    expect(data.data.summary).toHaveProperty("completedEpisodes");
    expect(data.data.summary).toHaveProperty("avgCompletion");
    expect(data.data.summary).toHaveProperty("byStep");
  });

  test("summary counts match episodes", async () => {
    const res = await app.fetch(new Request("http://localhost/api/episode-progress"));
    const data = await res.json();
    const { episodes, summary } = data.data;

    expect(summary.totalEpisodes).toBe(episodes.length);
    expect(summary.completedEpisodes).toBe(
      episodes.filter((e: any) => e.completedSteps === e.totalSteps).length,
    );
  });

  test("each episode has all 7 step keys", async () => {
    const res = await app.fetch(new Request("http://localhost/api/episode-progress"));
    const data = await res.json();
    const stepKeys = ["scaffold", "pipeline", "check", "score", "image", "tts", "render"];

    for (const ep of data.data.episodes) {
      expect(ep.steps).toBeDefined();
      for (const key of stepKeys) {
        expect(typeof ep.steps[key]).toBe("boolean");
      }
      expect(ep.completedSteps).toBeGreaterThanOrEqual(0);
      expect(ep.totalSteps).toBe(7);
      expect(ep.seriesId).toBeTruthy();
      expect(ep.episodeId).toBeTruthy();
    }
  });

  test("byStep has correct structure", async () => {
    const res = await app.fetch(new Request("http://localhost/api/episode-progress"));
    const data = await res.json();
    const { byStep, totalEpisodes } = data.data.summary;
    const stepKeys = ["scaffold", "pipeline", "check", "score", "image", "tts", "render"];

    for (const key of stepKeys) {
      expect(byStep[key]).toBeDefined();
      expect(byStep[key].done).toBeGreaterThanOrEqual(0);
      expect(byStep[key].total).toBe(totalEpisodes);
      expect(byStep[key].done).toBeLessThanOrEqual(byStep[key].total);
    }
  });

  test("avgCompletion is between 0 and 1", async () => {
    const res = await app.fetch(new Request("http://localhost/api/episode-progress"));
    const data = await res.json();
    expect(data.data.summary.avgCompletion).toBeGreaterThanOrEqual(0);
    expect(data.data.summary.avgCompletion).toBeLessThanOrEqual(1);
  });

  test("episodes are sorted by series then chapter then episode", async () => {
    const res = await app.fetch(new Request("http://localhost/api/episode-progress"));
    const data = await res.json();
    const episodes = data.data.episodes;

    for (let i = 1; i < episodes.length; i++) {
      const prev = episodes[i - 1];
      const curr = episodes[i];
      if (prev.seriesId !== curr.seriesId) {
        expect(prev.seriesId.localeCompare(curr.seriesId)).toBeLessThanOrEqual(0);
      } else if (prev.chapter !== curr.chapter) {
        expect((prev.chapter ?? 0)).toBeLessThanOrEqual(curr.chapter ?? 0);
      } else {
        expect((prev.episode ?? 0)).toBeLessThanOrEqual(curr.episode ?? 0);
      }
    }
  });
});
