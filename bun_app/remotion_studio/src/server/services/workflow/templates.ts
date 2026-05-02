import { resolve } from "node:path";
import type {
  WorkflowStepKind,
  WorkflowTemplate,
} from "../../../shared/types";

export const REPO_ROOT = resolve(import.meta.dir, "../../../../../..");
export const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

// ── Step-to-agent mapping (agent-backed mode) ──

export const STEP_AGENT_MAP: Record<WorkflowStepKind, string> = {
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
