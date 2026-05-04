import { Hono } from "hono";
import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { getPipelineStatus, runPipeline, runCheck, runScore } from "storygraph/pipeline-api";
import { jobService } from "../middleware/job-service";
import { evaluateTrigger } from "../services/automation-rules";
import { PipelineError } from "../pipeline-error";
import { withRetry, withTimeout } from "../retry";
import { isGateFile } from "remotion_types/storygraph-contracts";
import type { ApiResponse, Job } from "../../shared/types";

const router = new Hono();

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");

const PIPELINE_TIMEOUT_MS = 120_000;
const PIPELINE_RETRY = { maxAttempts: 2, baseDelayMs: 2000, maxDelayMs: 5000 };

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

  const job = jobService.create("pipeline", async (progress) => {
    progress(5, "Starting pipeline");
    const result = await withRetry(
      () => withTimeout(
        () => runPipeline(seriesDir, { mode }),
        PIPELINE_TIMEOUT_MS,
        { seriesId: body.seriesId, step: "pipeline" },
      ),
      PIPELINE_RETRY,
    );
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

  const job = jobService.create("check", async (progress) => {
    progress(10, "Running quality check");
    const result = await withRetry(
      () => withTimeout(
        () => runCheck(seriesDir, { mode }),
        PIPELINE_TIMEOUT_MS,
        { seriesId: body.seriesId, step: "check" },
      ),
      PIPELINE_RETRY,
    );

    // Validate gate.json schema
    const gatePath = resolve(seriesDir, "storygraph_out", "gate.json");
    if (existsSync(gatePath)) {
      try {
        const gateData = JSON.parse(readFileSync(gatePath, "utf-8"));
        if (!isGateFile(gateData)) {
          throw new PipelineError("SCHEMA_VALIDATION", "gate.json failed schema validation", {
            seriesId: body.seriesId,
            path: gatePath,
          });
        }
      } catch (err) {
        if (err instanceof PipelineError) throw err;
        throw new PipelineError("PARSE_ERROR", `Failed to parse gate.json: ${err}`, {
          seriesId: body.seriesId,
          path: gatePath,
        });
      }
    }

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

  const job = jobService.create("score", async (progress) => {
    progress(10, "Running AI scoring");
    const result = await withRetry(
      () => withTimeout(
        () => runScore(seriesDir, { mode }),
        PIPELINE_TIMEOUT_MS,
        { seriesId: body.seriesId, step: "score" },
      ),
      PIPELINE_RETRY,
    );
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

// Serve graph.html visualization for a series
router.get("/graph-html/:seriesId", (c) => {
  const seriesId = c.req.param("seriesId");
  const graphPath = resolve(REPO_ROOT, "bun_remotion_proj", seriesId, "storygraph_out", "graph.html");
  if (!existsSync(graphPath)) {
    return c.json<ApiResponse>({ ok: false, error: "graph.html not found — run pipeline first" }, 404);
  }
  const file = Bun.file(graphPath);
  return new Response(file, { headers: { "Content-Type": "text/html; charset=utf-8" } });
});

export const pipelineRoutes = router;
