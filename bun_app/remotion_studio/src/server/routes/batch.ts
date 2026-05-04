import { Hono } from "hono";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { generateTTS } from "bun_tts";
import { getRenderStatus, renderVideo } from "../services/remotion-renderer";
import { scanProjects } from "../services/project-scanner";
import { jobService } from "../middleware/job-service";
import type { ApiResponse, Job, BatchRequest, BatchResult, BatchEpisodeResult } from "../../shared/types";

const router = new Hono();

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

function resolveEpisodes(req: BatchRequest): string[] {
  if (req.episodeIds?.length) return req.episodeIds;

  const projects = scanProjects();
  let filtered = projects;

  if (req.seriesId) {
    filtered = filtered.filter((p) => p.seriesId === req.seriesId);
  }

  const episodes: string[] = [];
  for (const project of filtered) {
    for (const ep of project.episodes) {
      if (req.chapter != null && ep.chapter !== req.chapter) continue;
      episodes.push(ep.id);
    }
  }

  return episodes;
}

router.post("/", async (c) => {
  const body = await c.req.json<BatchRequest>();

  if (!body.operation || (body.operation !== "tts" && body.operation !== "render")) {
    return c.json<ApiResponse>({ ok: false, error: "operation must be 'tts' or 'render'" }, 400);
  }

  if (!body.episodeIds?.length && !body.seriesId) {
    return c.json<ApiResponse>({ ok: false, error: "Provide episodeIds or seriesId" }, 400);
  }

  const episodeIds = resolveEpisodes(body);

  if (episodeIds.length === 0) {
    return c.json<ApiResponse>({ ok: false, error: "No matching episodes found" }, 404);
  }

  const job = jobService.create<BatchResult>(`batch-${body.operation}`, async (progress, signal) => {
    const startedAt = Date.now();
    const results: BatchEpisodeResult[] = [];
    let completed = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < episodeIds.length; i++) {
      if (signal?.aborted) {
        for (let j = i; j < episodeIds.length; j++) {
          results.push({ episodeId: episodeIds[j], status: "skipped", error: "Batch cancelled" });
          skipped++;
        }
        break;
      }

      const episodeId = episodeIds[i];
      const pct = Math.round(((i) / episodeIds.length) * 100);
      progress(pct, `${body.operation} ${i + 1}/${episodeIds.length}: ${episodeId}`);

      try {
        const episodePath = resolve(PROJ_DIR, episodeId);
        if (!existsSync(episodePath)) {
          results.push({ episodeId, status: "skipped", error: "Episode not found" });
          skipped++;
          continue;
        }

        if (body.operation === "tts") {
          await generateTTS({
            episodePath,
            repoRoot: REPO_ROOT,
            skipExisting: body.skipExisting,
            engine: body.engine,
          });
        } else {
          await renderVideo({
            episodeId,
            onProgress: () => {},
          });
        }

        results.push({ episodeId, status: "completed" });
        completed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ episodeId, status: "failed", error: msg });
        failed++;
      }
    }

    progress(100, `${body.operation}: ${completed} done, ${failed} failed, ${skipped} skipped`);

    return {
      operation: body.operation,
      total: episodeIds.length,
      completed,
      failed,
      skipped,
      episodes: results,
      durationMs: Date.now() - startedAt,
    };
  });

  return c.json<ApiResponse<Job<BatchResult>>>({ ok: true, data: job }, 201);
});

router.post("/cancel", async (c) => {
  const body = await c.req.json<{ episodeIds: string[] }>();
  if (!body.episodeIds?.length) {
    return c.json<ApiResponse>({ ok: false, error: "Provide episodeIds" }, 400);
  }

  const targets = jobService.list().filter(
    (j) => (j.status === "running" || j.status === "pending") &&
           (j.type === "batch-tts" || j.type === "batch-render"),
  );

  const cancelled: string[] = [];
  for (const job of targets) {
    const result = jobService.cancel(job.id);
    if (result) cancelled.push(job.id);
  }

  return c.json<ApiResponse<{ cancelled: string[]; notFound: string[] }>>({
    ok: true,
    data: {
      cancelled,
      notFound: cancelled.length === 0 ? body.episodeIds : [],
    },
  });
});

export const batchRoutes = router;
