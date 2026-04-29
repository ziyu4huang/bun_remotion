import { Hono } from "hono";
import { resolve } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { scanProjects } from "../services/project-scanner";
import type { ApiResponse, EpisodeProgress, EpisodeProgressSummary, EpisodeStepProgress } from "../../shared/types";

const router = new Hono();

const STEP_KEYS: (keyof EpisodeStepProgress)[] = ["scaffold", "pipeline", "check", "score", "image", "tts", "render"];

function checkSeriesImages(seriesDir: string): boolean {
  const charDir = resolve(seriesDir, "assets/characters");
  if (!existsSync(charDir)) return false;
  try {
    return readdirSync(charDir).some((f) => /\.(png|jpe?g)$/.test(f));
  } catch {
    return false;
  }
}

function computeEpisodeProgress(): { episodes: EpisodeProgress[]; summary: EpisodeProgressSummary } {
  const projects = scanProjects();
  const episodes: EpisodeProgress[] = [];
  const seriesImageCache = new Map<string, boolean>();

  for (const project of projects) {
    let hasImages = seriesImageCache.get(project.seriesId);
    if (hasImages === undefined) {
      hasImages = checkSeriesImages(project.path);
      seriesImageCache.set(project.seriesId, hasImages);
    }

    for (const ep of project.episodes) {
      const steps: EpisodeStepProgress = {
        scaffold: ep.hasScaffold,
        pipeline: existsSync(resolve(ep.path, "storygraph_out/merged-graph.json")),
        check: ep.gateScore != null,
        score: existsSync(resolve(ep.path, "storygraph_out/kg-quality-score.json")),
        image: hasImages,
        tts: ep.hasTTS,
        render: ep.hasRender,
      };

      const completedSteps = STEP_KEYS.filter((k) => steps[k]).length;

      episodes.push({
        seriesId: project.seriesId,
        seriesName: project.name,
        category: project.category,
        episodeId: ep.id,
        chapter: ep.chapter,
        episode: ep.episode,
        steps,
        completedSteps,
        totalSteps: STEP_KEYS.length,
        gateScore: ep.gateScore,
        blendedScore: ep.blendedScore,
      });
    }
  }

  episodes.sort((a, b) => {
    if (a.seriesId !== b.seriesId) return a.seriesId.localeCompare(b.seriesId);
    if (a.chapter !== b.chapter) return (a.chapter ?? 0) - (b.chapter ?? 0);
    return (a.episode ?? 0) - (b.episode ?? 0);
  });

  const completedEpisodes = episodes.filter((e) => e.completedSteps === e.totalSteps).length;
  const avgCompletion = episodes.length > 0
    ? Math.round((episodes.reduce((s, e) => s + e.completedSteps, 0) / (episodes.length * STEP_KEYS.length)) * 100) / 100
    : 0;

  const byStep = {} as Record<keyof EpisodeStepProgress, { done: number; total: number }>;
  for (const key of STEP_KEYS) {
    byStep[key] = {
      done: episodes.filter((e) => e.steps[key]).length,
      total: episodes.length,
    };
  }

  return {
    episodes,
    summary: { totalEpisodes: episodes.length, completedEpisodes, avgCompletion, byStep },
  };
}

router.get("/", (c) => {
  const result = computeEpisodeProgress();
  return c.json<ApiResponse<typeof result>>({ ok: true, data: result });
});

export const episodeProgressRoutes = router;
