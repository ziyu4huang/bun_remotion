import { resolve } from "node:path";
import { scaffold } from "../../../../episodeforge/src/scaffold";
import { runPipeline, runCheck, runScore } from "../../../../storygraph/src/pipeline-api";
import { generateTTS } from "../../../../bun_tts/src/tts-pipeline";
import { generateImageBatch } from "../../../../bun_image/src/image-pipeline";
import { renderVideo } from "./remotion-renderer";
import type {
  WorkflowStepKind,
  WorkflowStepDef,
  WorkflowTemplate,
  WorkflowStepStatus,
  WorkflowResult,
  JobStatus,
} from "../../shared/types";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");

// ── Templates ──

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "full-pipeline",
    label: "Full Pipeline",
    description: "Scaffold → Pipeline → Check → Score → TTS → Render",
    steps: [
      { kind: "scaffold", label: "Scaffold Episode" },
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

// ── Options ──

export interface WorkflowTriggerOptions {
  seriesId: string;
  chapter?: number;
  episode?: number;
  category?: string;
  scenes?: number;
  mode?: "regex" | "ai" | "hybrid";
  ttsEngine?: "mlx" | "gemini";
  episodePath?: string; // for tts-and-render template (existing episode)
  dryRun?: boolean; // scaffold-only dry run (no files written)
  images?: Array<{ filename: string; prompt: string; aspectRatio?: string; metadata?: Record<string, unknown> }>;
  imageOutputDir?: string; // override output dir (default: seriesDir/assets/<imageAssetType>)
  imageAssetType?: "characters" | "backgrounds"; // which assets dir to use (default: characters)
  skipExistingImages?: boolean; // skip already-generated images (default: true)
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
  };

  for (let i = 0; i < totalSteps; i++) {
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
    } catch (err) {
      result.steps[i].status = "failed";
      result.steps[i].error = err instanceof Error ? err.message : String(err);
      result.finishedAt = Date.now();
      // Mark remaining steps as still pending
      for (let j = i + 1; j < totalSteps; j++) {
        result.steps[j].status = "pending";
      }
      throw err;
    }
  }

  result.finishedAt = Date.now();
  return result;
}

async function runStep(
  kind: WorkflowStepKind,
  stepIndex: number,
  options: WorkflowTriggerOptions,
  stepOutputs: Map<number, unknown>,
  progress: (p: number, msg?: string) => void,
): Promise<unknown> {
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

// ── Input resolvers ──

interface ScaffoldOutput {
  success: boolean;
  naming: {
    dirName: string;
    episodeDir: string;
    seriesDir: string;
  };
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
  // Fallback: use seriesId to derive
  const seriesDir = resolve(REPO_ROOT, "bun_remotion_proj", options.seriesId);
  if (options.chapter && options.episode) {
    return resolve(seriesDir, `${options.seriesId}-ch${options.chapter}-ep${options.episode}`);
  }
  throw new Error("Cannot resolve episode path: need scaffold output or episodePath/chapter/episode");
}

function resolveEpisodeId(options: WorkflowTriggerOptions, stepOutputs: Map<number, unknown>): string {
  const scaffoldOut = getScaffoldOutput(stepOutputs);
  if (scaffoldOut) return scaffoldOut.naming.dirName;
  // Fallback: derive from options
  if (options.chapter && options.episode) {
    return `${options.seriesId}-ch${options.chapter}-ep${options.episode}`;
  }
  // For tts-and-render template: episodePath contains the dirName
  if (options.episodePath) {
    return options.episodePath.split("/").pop()!;
  }
  throw new Error("Cannot resolve episode ID: need scaffold output or chapter/episode");
}
