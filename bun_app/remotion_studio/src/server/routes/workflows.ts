import { Hono } from "hono";
import { createJob, getJob } from "../middleware/job-queue";
import { listTemplates, getTemplate, runWorkflow, retryWorkflow } from "../services/workflow-engine";
import type { WorkflowTriggerOptions } from "../services/workflow-engine";
import type { ApiResponse, Job, WorkflowResult } from "../../shared/types";

const router = new Hono();

// GET / — List templates
router.get("/", (c) => {
  const templates = listTemplates();
  return c.json<ApiResponse>({ ok: true, data: templates });
});

// POST /trigger — Start a workflow job
router.post("/trigger", async (c) => {
  const body = await c.req.json<{
    templateId?: string;
    seriesId?: string;
    chapter?: number;
    episode?: number;
    category?: string;
    scenes?: number;
    mode?: "regex" | "ai" | "hybrid";
    ttsEngine?: "mlx" | "gemini";
    episodePath?: string;
    dryRun?: boolean;
    images?: Array<{ filename: string; prompt: string; aspectRatio?: string; metadata?: Record<string, unknown> }>;
    imageOutputDir?: string;
    imageAssetType?: "characters" | "backgrounds";
    skipExistingImages?: boolean;
    agent?: boolean;
  }>();

  if (!body.templateId) {
    return c.json<ApiResponse>({ ok: false, error: "templateId is required" }, 400);
  }

  const template = getTemplate(body.templateId);
  if (!template) {
    return c.json<ApiResponse>({ ok: false, error: `Unknown template: ${body.templateId}` }, 400);
  }

  // Some templates don't need seriesId (e.g., tts-and-render with episodePath)
  const needsSeriesId = template.steps.some((s) => s.kind === "scaffold" || s.kind === "pipeline" || s.kind === "check" || s.kind === "score" || s.kind === "image");
  if (needsSeriesId && !body.seriesId && !body.episodePath) {
    return c.json<ApiResponse>({ ok: false, error: "seriesId is required for this template" }, 400);
  }

  const options: WorkflowTriggerOptions = {
    seriesId: body.seriesId ?? "",
    chapter: body.chapter,
    episode: body.episode,
    category: body.category,
    scenes: body.scenes,
    mode: body.mode,
    ttsEngine: body.ttsEngine,
    episodePath: body.episodePath,
    dryRun: body.dryRun,
    images: body.images,
    imageOutputDir: body.imageOutputDir,
    imageAssetType: body.imageAssetType,
    skipExistingImages: body.skipExistingImages,
    agent: body.agent,
  };

  const job = createJob("workflow", async (progress) => {
    const result = await runWorkflow(template, options, progress);
    return result;
  });

  return c.json<ApiResponse<Job<WorkflowResult>>>({ ok: true, data: job as Job<WorkflowResult> }, 201);
});

// GET /:id — Get workflow job status
router.get("/:id", (c) => {
  const job = getJob(c.req.param("id"));
  if (!job) return c.json<ApiResponse>({ ok: false, error: "Not found" }, 404);
  if (job.type !== "workflow") {
    return c.json<ApiResponse>({ ok: false, error: "Not a workflow job" }, 400);
  }
  return c.json<ApiResponse<Job<WorkflowResult>>>({ ok: true, data: job as Job<WorkflowResult> });
});

// POST /:id/retry — Retry a failed workflow from a specific step
router.post("/:id/retry", async (c) => {
  const jobId = c.req.param("id");
  const prevJob = getJob<WorkflowResult>(jobId);
  if (!prevJob) return c.json<ApiResponse>({ ok: false, error: "Job not found" }, 404);
  if (prevJob.type !== "workflow") {
    return c.json<ApiResponse>({ ok: false, error: "Not a workflow job" }, 400);
  }

  const prevResult = prevJob.result;
  if (!prevResult) {
    return c.json<ApiResponse>({ ok: false, error: "No result on previous job" }, 400);
  }

  const body = await c.req.json<{ fromStep?: number }>().catch(() => ({} as { fromStep?: number }));

  // Find failed step index, or use provided fromStep
  let fromStep = body.fromStep;
  if (fromStep === undefined) {
    const idx = prevResult.steps.findIndex((s) => s.status === "failed");
    if (idx === -1) {
      return c.json<ApiResponse>({ ok: false, error: "No failed step found — specify fromStep" }, 400);
    }
    fromStep = idx;
  }

  const template = getTemplate(prevResult.templateId);
  if (!template) {
    return c.json<ApiResponse>({ ok: false, error: `Unknown template: ${prevResult.templateId}` }, 400);
  }

  const options: WorkflowTriggerOptions = (prevResult.options ?? {}) as WorkflowTriggerOptions;

  const newJob = createJob("workflow", async (progress) => {
    return retryWorkflow(template, options, prevResult, fromStep!, progress);
  });

  return c.json<ApiResponse<Job<WorkflowResult>>>({ ok: true, data: newJob as Job<WorkflowResult> }, 201);
});

export const workflowRoutes = router;
