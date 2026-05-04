import { Hono } from "hono";
import { jobService } from "../middleware/job-service";
import { listTemplates, getTemplate, runWorkflow, runWorkflowDAG, retryWorkflow, retryWorkflowDAG, getWorkflowTaskStore, TEMPLATE_DEPS } from "../services/workflow-engine";
import type { WorkflowTriggerOptions } from "../services/workflow-engine";
import { CATEGORY_TEMPLATE_MAP, CATEGORY_LABELS, getAllCategories, getTemplatesForCategory } from "../services/workflow/templates.js";
import type { VideoCategoryId } from "../services/workflow/templates.js";
import type { ApiResponse, Job, WorkflowResult, TaskTree, TaskNode } from "../../shared/types";

const router = new Hono();

// GET / — List templates
router.get("/", (c) => {
  const templates = listTemplates();
  return c.json<ApiResponse>({ ok: true, data: templates });
});

// GET /categories — List categories with template recommendations
router.get("/categories", (c) => {
  const categories = getAllCategories().map((id) => ({
    id,
    label: CATEGORY_LABELS[id],
    templates: getTemplatesForCategory(id),
  }));
  return c.json<ApiResponse>({ ok: true, data: categories });
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

  const job = jobService.create("workflow", async (progress, signal) => {
    const useDAG = template.id in TEMPLATE_DEPS;
    const runner = useDAG ? runWorkflowDAG : runWorkflow;
    const result = await runner(template, options, progress, signal);
    return result;
  });

  return c.json<ApiResponse<Job<WorkflowResult>>>({ ok: true, data: job as Job<WorkflowResult> }, 201);
});

// GET /:id — Get workflow job status
router.get("/:id", (c) => {
  const job = jobService.get(c.req.param("id"));
  if (!job) return c.json<ApiResponse>({ ok: false, error: "Not found" }, 404);
  if (job.type !== "workflow") {
    return c.json<ApiResponse>({ ok: false, error: "Not a workflow job" }, 400);
  }
  return c.json<ApiResponse<Job<WorkflowResult>>>({ ok: true, data: job as Job<WorkflowResult> });
});

// POST /:id/retry — Retry a failed workflow from a specific step
router.post("/:id/retry", async (c) => {
  const jobId = c.req.param("id");
  const prevJob = jobService.get<WorkflowResult>(jobId);
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

  const newJob = jobService.create("workflow", async (progress) => {
    return retryWorkflow(template, options, prevResult, fromStep!, progress);
  });

  return c.json<ApiResponse<Job<WorkflowResult>>>({ ok: true, data: newJob as Job<WorkflowResult> }, 201);
});

// ── Task Tree endpoints (Phase 62) ──

// GET /:id/tree — Get the task tree for a workflow job
router.get("/:id/tree", (c) => {
  const job = jobService.get<WorkflowResult>(c.req.param("id"));
  if (!job) return c.json<ApiResponse>({ ok: false, error: "Job not found" }, 404);
  if (job.type !== "workflow") return c.json<ApiResponse>({ ok: false, error: "Not a workflow job" }, 400);

  const treeId = job.result?.taskTreeId;
  if (!treeId) return c.json<ApiResponse<null>>({ ok: true, data: null });
  const store = getWorkflowTaskStore();
  const tree = store.getTree(treeId);
  if (!tree) return c.json<ApiResponse<null>>({ ok: true, data: null });

  return c.json<ApiResponse<TaskTree>>({ ok: true, data: tree });
});

// GET /:id/tree/:taskId — Get a single task node
router.get("/:id/tree/:taskId", (c) => {
  const job = jobService.get<WorkflowResult>(c.req.param("id"));
  if (!job) return c.json<ApiResponse>({ ok: false, error: "Job not found" }, 404);

  const treeId = job.result?.taskTreeId;
  if (!treeId) return c.json<ApiResponse>({ ok: false, error: "No task tree for this job" }, 404);

  const store = getWorkflowTaskStore();
  const node = store.getNode(treeId, c.req.param("taskId"));
  if (!node) return c.json<ApiResponse>({ ok: false, error: "Task node not found" }, 404);

  return c.json<ApiResponse<TaskNode>>({ ok: true, data: node });
});

// POST /:id/tree/:taskId/retry — Retry a specific failed task node
router.post("/:id/tree/:taskId/retry", async (c) => {
  const jobId = c.req.param("id");
  const taskId = c.req.param("taskId");
  const job = jobService.get<WorkflowResult>(jobId);
  if (!job) return c.json<ApiResponse>({ ok: false, error: "Job not found" }, 404);

  const treeId = job.result?.taskTreeId;
  if (!treeId) return c.json<ApiResponse>({ ok: false, error: "No task tree for this job" }, 404);

  const template = getTemplate(job.result!.templateId);
  if (!template) return c.json<ApiResponse>({ ok: false, error: "Unknown template" }, 400);

  const options: WorkflowTriggerOptions = (job.result!.options ?? {}) as WorkflowTriggerOptions;

  const newJob = jobService.create("workflow", async (progress) => {
    return retryWorkflowDAG(treeId, template, options, progress);
  });

  return c.json<ApiResponse<Job<WorkflowResult>>>({ ok: true, data: newJob as Job<WorkflowResult> }, 201);
});

export const workflowRoutes = router;
