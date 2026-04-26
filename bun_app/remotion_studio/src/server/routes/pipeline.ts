import { Hono } from "hono";
import { resolve } from "node:path";
import { getPipelineStatus, runPipeline, runCheck, runScore } from "../../../../storygraph/src/pipeline-api";
import { createJob } from "../middleware/job-queue";
import { evaluateTrigger } from "../services/automation-rules";
import type { ApiResponse, Job } from "../../shared/types";

const router = new Hono();

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");

router.get("/status/:seriesId", (c) => {
  const seriesDir = resolve(REPO_ROOT, "bun_remotion_proj", c.req.param("seriesId"));
  const status = getPipelineStatus(seriesDir);
  return c.json<ApiResponse>({ ok: true, data: status });
});

router.post("/run", async (c) => {
  const body = await c.req.json<{ seriesId: string; mode?: "regex" | "ai" | "hybrid" }>();

  if (!body.seriesId) {
    return c.json<ApiResponse>({ ok: false, error: "seriesId is required" }, 400);
  }

  const seriesDir = resolve(REPO_ROOT, "bun_remotion_proj", body.seriesId);
  const mode = body.mode ?? "hybrid";

  const job = createJob("pipeline", async (progress) => {
    progress(5, "Starting pipeline");
    const result = await runPipeline(seriesDir, { mode });
    progress(90, "Pipeline complete");
    return result;
  });

  return c.json<ApiResponse<Job>>({ ok: true, data: job }, 201);
});

router.post("/check", async (c) => {
  const body = await c.req.json<{ seriesId: string; mode?: "regex" | "ai" | "hybrid" }>();

  if (!body.seriesId) {
    return c.json<ApiResponse>({ ok: false, error: "seriesId is required" }, 400);
  }

  const seriesDir = resolve(REPO_ROOT, "bun_remotion_proj", body.seriesId);
  const mode = body.mode ?? "hybrid";

  const job = createJob("check", async (progress) => {
    progress(10, "Running quality check");
    const result = await runCheck(seriesDir, { mode });
    progress(90, "Check complete");
    return result;
  });

  return c.json<ApiResponse<Job>>({ ok: true, data: job }, 201);
});

router.post("/score", async (c) => {
  const body = await c.req.json<{ seriesId: string; mode?: "regex" | "ai" | "hybrid" }>();

  if (!body.seriesId) {
    return c.json<ApiResponse>({ ok: false, error: "seriesId is required" }, 400);
  }

  const seriesDir = resolve(REPO_ROOT, "bun_remotion_proj", body.seriesId);
  const mode = body.mode ?? "hybrid";

  const job = createJob("score", async (progress) => {
    progress(10, "Running AI scoring");
    const result = await runScore(seriesDir, { mode });
    progress(90, "Scoring complete");

    // Evaluate automation rules after scoring
    try {
      evaluateTrigger({
        trigger: "quality_passed",
        seriesId: body.seriesId,
        blendedScore: (result as any)?.blendedScore,
      });
    } catch {
      // Don't fail the score job if automation evaluation errors
    }

    return result;
  });

  return c.json<ApiResponse<Job>>({ ok: true, data: job }, 201);
});

export const pipelineRoutes = router;
