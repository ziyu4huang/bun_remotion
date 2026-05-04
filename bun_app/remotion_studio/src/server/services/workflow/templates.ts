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

// ── Category-template recommendations ──

export interface CategoryTemplateSuggestion {
  templateId: string;
  reason: string;
  /** Suggested defaults to pre-fill when triggering this template for this category */
  defaults?: Partial<WorkflowTriggerOptions>;
}

export type VideoCategoryId =
  | "narrative_drama"
  | "galgame_vn"
  | "tech_explainer"
  | "data_story"
  | "listicle"
  | "tutorial"
  | "shorts_meme";

export const CATEGORY_LABELS: Record<VideoCategoryId, { en: string; zh_TW: string }> = {
  narrative_drama: { en: "Narrative Drama", zh_TW: "敘事劇情" },
  galgame_vn: { en: "Galgame VN", zh_TW: "美少女遊戲風" },
  tech_explainer: { en: "Tech Explainer", zh_TW: "技術講解" },
  data_story: { en: "Data Story", zh_TW: "數據故事" },
  listicle: { en: "Listicle", zh_TW: "盤點清單" },
  tutorial: { en: "Tutorial", zh_TW: "教學指南" },
  shorts_meme: { en: "Shorts / Meme", zh_TW: "短影音迷因" },
};

export const CATEGORY_TEMPLATE_MAP: Record<VideoCategoryId, CategoryTemplateSuggestion[]> = {
  narrative_drama: [
    { templateId: "full-pipeline", reason: "Full production with character voices, dialog, and multi-scene rendering", defaults: { mode: "hybrid", ttsEngine: "mlx" } },
    { templateId: "scaffold-and-pipeline", reason: "Quick scaffold + KG extraction for story analysis" },
    { templateId: "quality-gate", reason: "Check narrative consistency and character quality" },
  ],
  galgame_vn: [
    { templateId: "full-pipeline", reason: "Full production with character sprites, dialog boxes, and emotional voice acting", defaults: { mode: "hybrid", ttsEngine: "gemini" } },
    { templateId: "tts-and-render", reason: "Regenerate voice lines and re-render after dialog edits" },
    { templateId: "image-tts-render", reason: "Update character images + voices + render" },
  ],
  tech_explainer: [
    { templateId: "scaffold-and-pipeline", reason: "Scaffold explainer structure with narration script", defaults: { mode: "ai" } },
    { templateId: "quality-gate", reason: "Verify technical accuracy and completeness" },
    { templateId: "tts-and-render", reason: "Generate narration voice-over and render", defaults: { ttsEngine: "gemini" } },
  ],
  data_story: [
    { templateId: "scaffold-and-pipeline", reason: "Scaffold data-driven story with narration", defaults: { mode: "ai" } },
    { templateId: "quality-gate", reason: "Verify data accuracy and narrative flow" },
    { templateId: "tts-and-render", reason: "Generate narration and render data visualizations", defaults: { ttsEngine: "gemini" } },
  ],
  listicle: [
    { templateId: "image-tts-render", reason: "Generate item images, add narration, and render" },
    { templateId: "tts-and-render", reason: "Regenerate narration for updated list items" },
  ],
  tutorial: [
    { templateId: "full-pipeline", reason: "Full tutorial production with step-by-step guide and code highlighting", defaults: { mode: "ai" } },
    { templateId: "scaffold-and-pipeline", reason: "Scaffold tutorial structure with step guide" },
    { templateId: "tts-and-render", reason: "Regenerate narration for updated steps" },
  ],
  shorts_meme: [
    { templateId: "image-tts-render", reason: "Quick image + SFX + render for short-form content" },
    { templateId: "tts-and-render", reason: "Fast render with sound effects only" },
  ],
};

export function getTemplatesForCategory(category: VideoCategoryId): CategoryTemplateSuggestion[] {
  return CATEGORY_TEMPLATE_MAP[category] ?? [];
}

export function getAllCategories(): VideoCategoryId[] {
  return Object.keys(CATEGORY_TEMPLATE_MAP) as VideoCategoryId[];
}
