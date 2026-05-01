import { resolve } from "node:path";
import { existsSync, readdirSync, statSync } from "node:fs";
import { scaffold } from "../../../../episodeforge/src/scaffold";
import { runPipeline, runCheck, runScore } from "../../../../storygraph/src/pipeline-api";
import { generateTTS } from "../../../../bun_tts/src/tts-pipeline";
import { generateImageBatch } from "../../../../bun_image/src/image-pipeline";
import { renderVideo } from "./remotion-renderer";
import { bridge } from "../agent-bridge.js";
import { executeTaskTree, type StepExecutor } from "./dag-executor";
import { TaskStore } from "./task-store";
import type { AgentTaskResult } from "../../shared/types";
import type {
  WorkflowStepKind,
  WorkflowStepDef,
  WorkflowTemplate,
  WorkflowStepStatus,
  WorkflowResult,
  JobStatus,
  TaskTree,
  TaskNode,
} from "../../shared/types";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

// ── Step-to-agent mapping (agent-backed mode) ──

const STEP_AGENT_MAP: Record<WorkflowStepKind, string> = {
  scaffold: "studio-scaffold",
  pipeline: "sg-benchmark-runner",
  check: "sg-quality-gate",
  score: "sg-quality-gate",
  tts: "studio-tts",
  render: "studio-render",
  image: "pi-developer",
};

// ── Templates ──

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "full-pipeline",
    label: "Full Pipeline",
    description: "Scaffold → [Image ‖ Pipeline → Check → Score] → TTS → Render",
    steps: [
      { kind: "scaffold", label: "Scaffold Episode" },
      { kind: "image", label: "Generate Images" },
      { kind: "pipeline", label: "Run Pipeline" },
      { kind: "check", label: "Quality Check" },
      { kind: "score", label: "AI Quality Score" },
      { kind: "tts", label: "Generate TTS" },
      { kind: "render", label: "Render MP4" },
    ],
  },
  {
    id: "scaffold-and-pipeline",
    label: "Scaffold + Pipeline",
    description: "Scaffold → Pipeline",
    steps: [
      { kind: "scaffold", label: "Scaffold Episode" },
      { kind: "pipeline", label: "Run Pipeline" },
    ],
  },
  {
    id: "quality-gate",
    label: "Quality Gate",
    description: "Pipeline → Check → Score",
    steps: [
      { kind: "pipeline", label: "Run Pipeline" },
      { kind: "check", label: "Quality Check" },
      { kind: "score", label: "AI Quality Score" },
    ],
  },
  {
    id: "tts-and-render",
    label: "TTS + Render",
    description: "Generate TTS → Render MP4",
    steps: [
      { kind: "tts", label: "Generate TTS" },
      { kind: "render", label: "Render MP4" },
    ],
  },
  {
    id: "image-tts-render",
    label: "Image + TTS + Render",
    description: "Generate Images → TTS → Render MP4",
    steps: [
      { kind: "image", label: "Generate Images" },
      { kind: "tts", label: "Generate TTS" },
      { kind: "render", label: "Render MP4" },
    ],
  },
];

export function listTemplates(): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES;
}

export function getTemplate(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id);
}

// ── Template → TaskTree translator (Phase 59) ──

/** Dependency edges per template. Value = step kinds that must complete before the key. */
export const TEMPLATE_DEPS: Record<string, Record<WorkflowStepKind, WorkflowStepKind[]>> = {
  "full-pipeline": {
    scaffold: [],
    image: ["scaffold"],
    pipeline: ["scaffold"],
    check: ["pipeline"],
    score: ["pipeline"],
    tts: ["check", "score", "image"],
    render: ["tts"],
  },
  "quality-gate": {
    pipeline: [],
    check: ["pipeline"],
    score: ["pipeline"],
  },
  "image-tts-render": {
    image: [],
    tts: [],
    render: ["image", "tts"],
  },
};

let nodeCounter = 0;
function nodeId(): string {
  return `tn_${Date.now()}_${++nodeCounter}`;
}

/** Convert a WorkflowTemplate into a TaskTree with dependency edges. */
export function buildTaskTree(
  template: WorkflowTemplate,
  options?: Record<string, unknown>,
): TaskTree {
  const depMap = TEMPLATE_DEPS[template.id];
  if (!depMap) {
    // Fallback: linear chain for templates without explicit deps
    return buildLinearTree(template, options);
  }

  const now = Date.now();
  const rootId = nodeId();
  const nodes: Record<string, TaskNode> = {
    [rootId]: {
      id: rootId,
      parentId: null,
      label: template.label,
      kind: "workflow",
      status: "pending",
      progress: 0,
      deps: [],
      children: [],
      metadata: { templateId: template.id, options },
    },
  };

  // Create a node for each step, tracking kind→id for deps
  const kindToId = new Map<WorkflowStepKind, string>();

  for (const step of template.steps) {
    const id = nodeId();
    const depKinds = depMap[step.kind] ?? [];
    const deps = depKinds.map((k) => kindToId.get(k)).filter(Boolean) as string[];

    nodes[id] = {
      id,
      parentId: rootId,
      label: step.label,
      kind: step.kind,
      status: "pending",
      progress: 0,
      deps,
      children: [],
    };
    kindToId.set(step.kind, id);
    nodes[rootId].children.push(id);
  }

  return { rootId, nodes, createdAt: now, updatedAt: now };
}

function buildLinearTree(template: WorkflowTemplate, options?: Record<string, unknown>): TaskTree {
  const now = Date.now();
  const rootId = nodeId();
  const nodes: Record<string, TaskNode> = {
    [rootId]: {
      id: rootId,
      parentId: null,
      label: template.label,
      kind: "workflow",
      status: "pending",
      progress: 0,
      deps: [],
      children: [],
      metadata: { templateId: template.id, options },
    },
  };

  let prevId: string | undefined;
  for (const step of template.steps) {
    const id = nodeId();
    nodes[id] = {
      id,
      parentId: rootId,
      label: step.label,
      kind: step.kind,
      status: "pending",
      progress: 0,
      deps: prevId ? [prevId] : [],
      children: [],
    };
    nodes[rootId].children.push(id);
    prevId = id;
  }

  return { rootId, nodes, createdAt: now, updatedAt: now };
}

// ── Options ──

export interface WorkflowTriggerOptions {
  seriesId: string;
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
}

// ── Progress mapping ──

export function stepProgress(
  stepIndex: number,
  totalSteps: number,
  stepInternalProgress: number,
): number {
  const rangeSize = 100 / totalSteps;
  return Math.floor(stepIndex * rangeSize + (stepInternalProgress / 100) * rangeSize);
}

// ── Workflow runner ──

export async function runWorkflow(
  template: WorkflowTemplate,
  options: WorkflowTriggerOptions,
  reportOverall: (p: number, msg?: string) => void,
  signal?: AbortSignal,
): Promise<WorkflowResult> {
  const { steps } = template;
  const totalSteps = steps.length;
  const stepOutputs = new Map<number, unknown>();

  const result: WorkflowResult = {
    templateId: template.id,
    startedAt: Date.now(),
    currentStep: -1,
    steps: steps.map((s) => ({
      kind: s.kind,
      label: s.label,
      status: "pending" as JobStatus,
      progress: 0,
    })),
    options: JSON.parse(JSON.stringify(options)),
  };

  for (let i = 0; i < totalSteps; i++) {
    if (signal?.aborted) {
      for (let j = i; j < totalSteps; j++) result.steps[j].status = "pending";
      result.finishedAt = Date.now();
      throw new Error("Cancelled");
    }
    const step = steps[i];
    result.currentStep = i;
    result.steps[i].status = "running";

    const makeProgress = (p: number, msg?: string) => {
      result.steps[i].progress = p;
      const overall = stepProgress(i, totalSteps, p);
      const label = msg ? `${step.label} — ${msg}` : step.label;
      reportOverall(overall, `Step ${i + 1}/${totalSteps}: ${label}`);
    };

    try {
      const output = await runStep(step.kind, i, options, stepOutputs, makeProgress);
      stepOutputs.set(i, output);
      result.steps[i].status = "completed";
      result.steps[i].progress = 100;
      // Capture agent report for UI display
      if (options.agent && output && typeof output === "object" && "_agentReport" in output) {
        result.steps[i].agentReport = (output as any)._agentReport;
      }
    } catch (err) {
      result.steps[i].status = "failed";
      result.steps[i].error = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      console.error(`[workflow] Step failed:`, err);
      result.finishedAt = Date.now();
      for (let j = i + 1; j < totalSteps; j++) {
        result.steps[j].status = "pending";
      }
      throw err;
    }
  }

  result.finishedAt = Date.now();
  return result;
}

/** Re-run a workflow starting from a given step index, copying completed steps from a previous result. */
export async function retryWorkflow(
  template: WorkflowTemplate,
  options: WorkflowTriggerOptions,
  previousResult: WorkflowResult,
  fromStep: number,
  reportOverall: (p: number, msg?: string) => void,
): Promise<WorkflowResult> {
  const { steps } = template;
  const totalSteps = steps.length;
  const stepOutputs = new Map<number, unknown>();

  const result: WorkflowResult = {
    templateId: template.id,
    startedAt: Date.now(),
    currentStep: -1,
    steps: steps.map((s, i) => {
      // Copy completed steps from previous result
      if (i < fromStep && previousResult.steps[i]) {
        return { ...previousResult.steps[i] };
      }
      return { kind: s.kind, label: s.label, status: "pending" as JobStatus, progress: 0 };
    }),
    options: JSON.parse(JSON.stringify(options)),
  };

  // Report progress for already-completed prefix steps
  const prefixProgress = Math.floor((fromStep / totalSteps) * 100);
  reportOverall(prefixProgress, `Retrying from step ${fromStep + 1}/${totalSteps}`);

  for (let i = fromStep; i < totalSteps; i++) {
    const step = steps[i];
    result.currentStep = i;
    result.steps[i].status = "running";

    const makeProgress = (p: number, msg?: string) => {
      result.steps[i].progress = p;
      const overall = stepProgress(i, totalSteps, p);
      const label = msg ? `${step.label} — ${msg}` : step.label;
      reportOverall(overall, `Step ${i + 1}/${totalSteps}: ${label}`);
    };

    try {
      const output = await runStep(step.kind, i, options, stepOutputs, makeProgress);
      stepOutputs.set(i, output);
      result.steps[i].status = "completed";
      result.steps[i].progress = 100;
      if (options.agent && output && typeof output === "object" && "_agentReport" in output) {
        result.steps[i].agentReport = (output as any)._agentReport;
      }
    } catch (err) {
      result.steps[i].status = "failed";
      result.steps[i].error = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      console.error(`[workflow] Step failed:`, err);
      result.finishedAt = Date.now();
      for (let j = i + 1; j < totalSteps; j++) {
        result.steps[j].status = "pending";
      }
      throw err;
    }
  }

  result.finishedAt = Date.now();
  return result;
}

// ── DAG-based workflow runner (Phase 61) ──

/** Shared TaskStore instance for workflow DAGs. */
const workflowTaskStore = new TaskStore();

/** Run a workflow using the DAG executor. Returns WorkflowResult for backward compat. */
export async function runWorkflowDAG(
  template: WorkflowTemplate,
  options: WorkflowTriggerOptions,
  reportOverall: (p: number, msg?: string) => void,
  signal?: AbortSignal,
): Promise<WorkflowResult> {
  const tree = buildTaskTree(template, options as Record<string, unknown>);
  const totalSteps = template.steps.length;
  const stepOutputs = new Map<string, unknown>();

  // Sync tree into store
  const storeTree = workflowTaskStore.createTree({
    label: tree.nodes[tree.rootId].label,
    kind: "workflow",
  });
  const idMap = new Map<string, string>();
  idMap.set(tree.rootId, storeTree.rootId);

  for (const node of Object.values(tree.nodes)) {
    if (node.id === tree.rootId) continue;
    const mappedDeps = node.deps.map((d) => idMap.get(d)!).filter(Boolean);
    const added = workflowTaskStore.addNode(storeTree.rootId, {
      label: node.label,
      kind: node.kind,
      deps: mappedDeps,
    })!;
    idMap.set(node.id, added.id);
  }

  // Build executor that bridges TaskNode → runStep
  let completedCount = 0;
  const executor: StepExecutor = async (node) => {
    const stepIndex = template.steps.findIndex((s) => s.kind === node.kind);
    const makeProgress = (p: number, msg?: string) => {
      const overall = stepProgress(stepIndex, totalSteps, p);
      reportOverall(overall, `${node.label}${msg ? ` — ${msg}` : ""}`);
    };

    const output = await runStep(node.kind as WorkflowStepKind, stepIndex, options, stepOutputs, makeProgress);
    stepOutputs.set(node.id, output);
    return output;
  };

  const loadedTree = workflowTaskStore.getTree(storeTree.rootId)!;
  await executeTaskTree(loadedTree, workflowTaskStore, executor, {
    signal,
    onProgress(done, total) {
      completedCount = done;
    },
  });

  // Convert TaskTree → WorkflowResult
  return treeToResult(template, workflowTaskStore.getTree(storeTree.rootId)!, options, stepOutputs);
}

/** Resume a failed workflow by resetting failed nodes and re-executing. */
export async function retryWorkflowDAG(
  treeId: string,
  template: WorkflowTemplate,
  options: WorkflowTriggerOptions,
  reportOverall: (p: number, msg?: string) => void,
): Promise<WorkflowResult> {
  const tree = workflowTaskStore.getTree(treeId);
  if (!tree) throw new Error(`Tree ${treeId} not found`);

  const totalSteps = template.steps.length;
  const stepOutputs = new Map<string, unknown>();

  // Reset failed/skipped nodes to pending
  for (const node of Object.values(tree.nodes)) {
    if (node.id === tree.rootId) continue;
    if (node.status === "failed" || node.status === "skipped") {
      workflowTaskStore.updateNode(treeId, node.id, {
        status: "pending",
        progress: 0,
        error: undefined,
        result: undefined,
        startedAt: undefined,
        finishedAt: undefined,
      });
    }
  }

  const executor: StepExecutor = async (node) => {
    const stepIndex = template.steps.findIndex((s) => s.kind === node.kind);
    const makeProgress = (p: number, msg?: string) => {
      const overall = stepProgress(stepIndex, totalSteps, p);
      reportOverall(overall, `${node.label}${msg ? ` — ${msg}` : ""}`);
    };

    const output = await runStep(node.kind as WorkflowStepKind, stepIndex, options, stepOutputs, makeProgress);
    stepOutputs.set(node.id, output);
    return output;
  };

  await executeTaskTree(tree, workflowTaskStore, executor);

  return treeToResult(template, workflowTaskStore.getTree(treeId)!, options, stepOutputs);
}

/** Get the task store (for API routes to query tree state). */
export function getWorkflowTaskStore(): TaskStore {
  return workflowTaskStore;
}

/** Convert a TaskTree back to WorkflowResult for backward compat. */
function treeToResult(
  template: WorkflowTemplate,
  tree: TaskTree,
  options: WorkflowTriggerOptions,
  stepOutputs: Map<string, unknown>,
): WorkflowResult {
  const stepNodes = Object.values(tree.nodes).filter((n) => n.id !== tree.rootId);
  const root = tree.nodes[tree.rootId];

  const result: WorkflowResult = {
    templateId: template.id,
    startedAt: root.startedAt ?? tree.createdAt,
    finishedAt: root.finishedAt,
    currentStep: stepNodes.filter((n) => n.status === "completed").length - 1,
    taskTreeId: tree.rootId,
    steps: template.steps.map((s) => {
      const node = stepNodes.find((n) => n.kind === s.kind);
      const status: JobStatus = node
        ? node.status === "skipped" ? "pending"
          : node.status as JobStatus
        : "pending";
      const output = node ? stepOutputs.get(node.id) : undefined;
      return {
        kind: s.kind,
        label: s.label,
        status,
        progress: node?.progress ?? 0,
        error: node?.error,
        result: output,
        agentReport: output && typeof output === "object" && "_agentReport" in (output as any)
          ? (output as any)._agentReport
          : undefined,
      };
    }),
    options: JSON.parse(JSON.stringify(options)),
  };

  return result;
}

async function runStep(
  kind: WorkflowStepKind,
  stepIndex: number,
  options: WorkflowTriggerOptions,
  stepOutputs: Map<number, unknown>,
  progress: (p: number, msg?: string) => void,
): Promise<unknown> {
  // ── Agent-backed path ──
  if (options.agent) {
    return runAgentStep(kind, options, stepOutputs, progress);
  }

  // ── Direct-call path (existing) ──
  switch (kind) {
    case "scaffold": {
      progress(10, "Starting scaffold");
      const res = await scaffold({
        series: options.seriesId,
        category: options.category as any,
        chapter: options.chapter,
        episode: options.episode,
        scenes: options.scenes,
        dryRun: options.dryRun,
        skipInstall: options.dryRun,
        repoRoot: REPO_ROOT,
      });
      if (!res.success) throw new Error(`Scaffold failed: ${res.errors.join(", ")}`);
      progress(90, "Scaffold complete");
      return res;
    }

    case "pipeline": {
      const seriesDir = resolveSeriesDir(options, stepOutputs);
      progress(5, "Starting pipeline");
      const res = await runPipeline(seriesDir, { mode: options.mode });
      if (!res.success) throw new Error(`Pipeline failed: ${res.errors.join(", ")}`);
      progress(90, "Pipeline complete");
      return res;
    }

    case "check": {
      const seriesDir = resolveSeriesDir(options, stepOutputs);
      progress(10, "Running quality check");
      const res = await runCheck(seriesDir, { mode: options.mode });
      progress(90, "Check complete");
      return res;
    }

    case "score": {
      const seriesDir = resolveSeriesDir(options, stepOutputs);
      progress(10, "Running AI scoring");
      const res = await runScore(seriesDir, { mode: options.mode });
      progress(90, "Scoring complete");
      return res;
    }

    case "tts": {
      const episodePath = resolveEpisodePath(options, stepOutputs);
      progress(5, "Generating TTS");
      const res = await generateTTS({
        episodePath,
        repoRoot: REPO_ROOT,
        engine: options.ttsEngine,
        onProgress: (msg) => progress(50, msg),
      });
      if (res.generated === 0 && res.skipped === 0) {
        throw new Error("TTS generated 0 audio files");
      }
      progress(90, `TTS done: ${res.generated} files`);
      return res;
    }

    case "render": {
      const episodeId = resolveEpisodeId(options, stepOutputs);
      progress(5, "Starting render");
      const res = await renderVideo({
        episodeId,
        onProgress: (msg) => progress(50, msg),
      });
      progress(90, "Render complete");
      return res;
    }

    case "image": {
      if (!options.images?.length) throw new Error("No images provided for image step");
      const seriesDir = resolveSeriesDir(options, stepOutputs);
      const assetType = options.imageAssetType ?? "characters";
      const outputDir = options.imageOutputDir ?? resolve(seriesDir, "assets", assetType);
      progress(5, `Generating ${options.images.length} image(s) → ${assetType}`);
      const res = await generateImageBatch({
        images: options.images,
        outputDir,
        skipExisting: options.skipExistingImages ?? true,
        browserConfig: { mode: "cdp", headed: true },
        onProgress: (msg) => progress(50, msg),
      });
      progress(90, `Images done: ${res.generated} generated, ${res.skipped} skipped`);
      return res;
    }

    default:
      throw new Error(`Unknown step kind: ${kind}`);
  }
}

// ── Agent-backed step execution ──

function buildStepPrompt(
  kind: WorkflowStepKind,
  options: WorkflowTriggerOptions,
  stepOutputs: Map<number, unknown>,
): string {
  const seriesDir = safeResolveSeriesDir(options, stepOutputs);
  const episodePath = safeResolveEpisodePath(options, stepOutputs);
  const episodeId = safeResolveEpisodeId(options, stepOutputs);
  const mode = options.mode ?? "hybrid";

  switch (kind) {
    case "scaffold":
      return [
        `Scaffold a new episode for series "${options.seriesId}".`,
        options.chapter != null ? `Chapter: ${options.chapter}` : null,
        options.episode != null ? `Episode: ${options.episode}` : null,
        options.category ? `Category: ${options.category}` : null,
        options.scenes ? `Scenes: ${options.scenes}` : null,
        options.dryRun ? "This is a dry run — do not write files." : null,
        "",
        "IMPORTANT: Use the sc_scaffold tool directly with these exact parameters:",
        `  series: "${options.seriesId}"`,
        options.chapter != null ? `  chapter: ${options.chapter}` : null,
        options.episode != null ? `  episode: ${options.episode}` : null,
        options.dryRun ? "  dryRun: true" : null,
        "",
        "Do NOT call sc_episode_list first — go straight to sc_scaffold.",
        `Series directory: ${resolve(PROJ_DIR, options.seriesId)}`,
      ].filter(Boolean).join("\n");

    case "pipeline":
      return [
        `Run the storygraph pipeline on series "${options.seriesId}".`,
        `Series directory: ${seriesDir}`,
        `Mode: ${mode}`,
        "Use sg_pipeline tool to run the pipeline. Report the results.",
      ].join("\n");

    case "check":
      return [
        `Run a quality check on series "${options.seriesId}".`,
        `Series directory: ${seriesDir}`,
        `Mode: ${mode}`,
        "Use sg_check tool. Report the gate score and any issues found.",
      ].join("\n");

    case "score":
      return [
        `Run AI quality scoring on series "${options.seriesId}".`,
        `Series directory: ${seriesDir}`,
        `Mode: ${mode}`,
        "Use sg_score tool to get the blended quality score. Report the results.",
      ].join("\n");

    case "tts":
      return [
        `Generate TTS audio for episode at "${episodePath}".`,
        options.ttsEngine ? `Engine: ${options.ttsEngine}` : "Use default TTS engine.",
        `Repo root: ${REPO_ROOT}`,
        "Run the TTS pipeline to generate audio files for all dialog lines in the episode.",
      ].join("\n");

    case "render":
      return [
        `Render episode "${episodeId}" to MP4.`,
        `Use the render_episode tool with episodeId "${episodeId}" to render the episode.`,
        "If render_episode is not available, fall back to: bun run build in the episode directory.",
        "Output should be 1920x1080 at 30fps.",
        `Expected output directory: ${resolve(REPO_ROOT, "bun_remotion_proj", options.seriesId, "out")}`,
      ].join("\n");

    case "image":
      return [
        `Generate ${options.images?.length ?? 0} images for series "${options.seriesId}".`,
        `Images: ${JSON.stringify(options.images)}`,
        `Output directory: ${options.imageOutputDir ?? resolve(seriesDir, "assets", options.imageAssetType ?? "characters")}`,
        options.skipExistingImages !== false ? "Skip already-generated images." : null,
      ].filter(Boolean).join("\n");

    default:
      return `Execute workflow step "${kind}" for series "${options.seriesId}".`;
  }
}

async function runAgentStep(
  kind: WorkflowStepKind,
  options: WorkflowTriggerOptions,
  stepOutputs: Map<number, unknown>,
  progress: (p: number, msg?: string) => void,
): Promise<unknown> {
  const agentName = STEP_AGENT_MAP[kind];
  const prompt = buildStepPrompt(kind, options, stepOutputs);

  progress(5, `Delegating to ${agentName}...`);

  let lastPct = 5;
  const agentResult = await bridge.runTask(agentName, prompt, {
    onEvent(event) {
      if (event.type === "turn_end") {
        lastPct = Math.min(80, lastPct + 15);
        progress(lastPct, `Agent turn complete`);
      } else if (event.type === "tool_start") {
        progress(lastPct, `Agent tool: ${event.toolName}`);
      } else if (event.type === "done") {
        progress(90, "Agent finished");
      }
    },
  });

  // Check if agent reported errors via tool calls
  const toolErrors = agentResult.toolCalls.filter((tc) => tc.isError);
  if (toolErrors.length > 0) {
    const msgs = toolErrors.map((tc) => `${tc.name}: ${JSON.stringify(tc.result).slice(0, 200)}`).join("; ");
    throw new Error(`Agent ${agentName} reported errors: ${msgs}`);
  }

  progress(100, "Step complete");
  return resolveAgentStepOutput(kind, options, stepOutputs, agentResult);
}

/** After agent step completes, read disk artifacts to produce step output
 *  compatible with existing path resolvers. */
function resolveAgentStepOutput(
  kind: WorkflowStepKind,
  options: WorkflowTriggerOptions,
  stepOutputs: Map<number, unknown>,
  agentResult: AgentTaskResult,
): unknown {
  switch (kind) {
    case "scaffold": {
      // Detect scaffold output by checking expected directory
      const seriesDir = resolve(PROJ_DIR, options.seriesId);
      const dirName = options.chapter && options.episode
        ? `${options.seriesId}-ch${options.chapter}-ep${options.episode}`
        : undefined;

      if (dirName) {
        const episodeDir = resolve(seriesDir, dirName);
        if (existsSync(episodeDir)) {
          return {
            success: true,
            naming: { dirName, episodeDir, seriesDir },
            _agentReport: agentResult.response,
          };
        }
      }

      // Scan for most recently created directory in series
      if (existsSync(seriesDir)) {
        const entries = readdirSync(seriesDir, { withFileTypes: true })
          .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "shared" && d.name !== "assets" && d.name !== "out" && d.name !== "storygraph_out")
          .map((d) => ({ name: d.name, mtime: statSync(resolve(seriesDir, d.name)).mtimeMs }))
          .sort((a, b) => b.mtime - a.mtime);

        if (entries.length > 0) {
          const dirName = entries[0].name;
          return {
            success: true,
            naming: { dirName, episodeDir: resolve(seriesDir, dirName), seriesDir },
            _agentReport: agentResult.response,
          };
        }
      }

      return { success: true, _agentReport: agentResult.response };
    }

    case "pipeline":
    case "check":
    case "score": {
      // These write to storygraph_out/ — return a marker that resolvers can use
      const seriesDir = safeResolveSeriesDir(options, stepOutputs);
      return {
        success: true,
        seriesDir,
        _agentReport: agentResult.response,
      };
    }

    case "tts": {
      const episodePath = safeResolveEpisodePath(options, stepOutputs);
      return {
        success: true,
        episodePath,
        generated: agentResult.toolCalls.filter((tc) => !tc.isError).length,
        skipped: 0,
        _agentReport: agentResult.response,
      };
    }

    case "render": {
      const episodeId = safeResolveEpisodeId(options, stepOutputs);
      return {
        success: true,
        episodeId,
        _agentReport: agentResult.response,
      };
    }

    case "image": {
      return {
        success: true,
        generated: agentResult.toolCalls.filter((tc) => !tc.isError).length,
        skipped: 0,
        _agentReport: agentResult.response,
      };
    }

    default:
      return { success: true, _agentReport: agentResult.response };
  }
}

// ── Input resolvers ──

interface ScaffoldOutput {
  success: boolean;
  naming: {
    dirName: string;
    episodeDir: string;
    seriesDir: string;
  };
  _agentReport?: string;
}

function getScaffoldOutput(stepOutputs: Map<number, unknown>): ScaffoldOutput | undefined {
  for (const [, v] of stepOutputs) {
    if (v && typeof v === "object" && "naming" in v) return v as ScaffoldOutput;
  }
  return undefined;
}

function resolveSeriesDir(options: WorkflowTriggerOptions, stepOutputs: Map<number, unknown>): string {
  const scaffoldOut = getScaffoldOutput(stepOutputs);
  if (scaffoldOut) return scaffoldOut.naming.seriesDir;
  return resolve(REPO_ROOT, "bun_remotion_proj", options.seriesId);
}

function resolveEpisodePath(options: WorkflowTriggerOptions, stepOutputs: Map<number, unknown>): string {
  if (options.episodePath) return options.episodePath;
  const scaffoldOut = getScaffoldOutput(stepOutputs);
  if (scaffoldOut) return scaffoldOut.naming.episodeDir;
  const seriesDir = resolve(REPO_ROOT, "bun_remotion_proj", options.seriesId);
  if (options.chapter && options.episode) {
    return resolve(seriesDir, `${options.seriesId}-ch${options.chapter}-ep${options.episode}`);
  }
  throw new Error("Cannot resolve episode path: need scaffold output or episodePath/chapter/episode");
}

function resolveEpisodeId(options: WorkflowTriggerOptions, stepOutputs: Map<number, unknown>): string {
  const scaffoldOut = getScaffoldOutput(stepOutputs);
  if (scaffoldOut) return scaffoldOut.naming.dirName;
  if (options.chapter && options.episode) {
    return `${options.seriesId}-ch${options.chapter}-ep${options.episode}`;
  }
  if (options.episodePath) {
    return options.episodePath.split("/").pop()!;
  }
  throw new Error("Cannot resolve episode ID: need scaffold output or chapter/episode");
}

// Safe variants that return a fallback string instead of throwing

function safeResolveSeriesDir(options: WorkflowTriggerOptions, stepOutputs: Map<number, unknown>): string {
  try { return resolveSeriesDir(options, stepOutputs); }
  catch { return resolve(PROJ_DIR, options.seriesId); }
}

function safeResolveEpisodePath(options: WorkflowTriggerOptions, stepOutputs: Map<number, unknown>): string {
  try { return resolveEpisodePath(options, stepOutputs); }
  catch { return options.episodePath ?? `unknown-episode`; }
}

function safeResolveEpisodeId(options: WorkflowTriggerOptions, stepOutputs: Map<number, unknown>): string {
  try { return resolveEpisodeId(options, stepOutputs); }
  catch {
    if (options.episodePath) return options.episodePath.split("/").pop()!;
    if (options.chapter && options.episode) return `${options.seriesId}-ch${options.chapter}-ep${options.episode}`;
    return `unknown-episode`;
  }
}
