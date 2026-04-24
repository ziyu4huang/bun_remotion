import { Hono } from "hono";
import { createJob, getJob } from "../middleware/job-queue";
import { listTemplates, getTemplate, runWorkflow } from "../services/workflow-engine";
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

export const workflowRoutes = router;
