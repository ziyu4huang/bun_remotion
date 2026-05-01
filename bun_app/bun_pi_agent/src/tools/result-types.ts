/**
 * Structured Tool Context Protocol — typed result shapes for all bun_pi_agent tools.
 *
 * Every tool result `details` field follows the ToolResultDetails shape,
 * giving downstream consumers (logs, UI, tests) a consistent envelope
 * with tool name, success flag, and tool-specific structured data.
 *
 * Tool groups: remotion (3), storygraph (10), scaffold (3), tts (3), render (3), image (3) = 25 tools
 */

// ─── Base ───────────────────────────────────────────────────────────

export interface ToolResultBase {
  tool: string;
  success: boolean;
  data: Record<string, unknown>;
}

export interface ToolResultError {
  tool: string;
  success: false;
  data: { error: string };
}

// ─── Remotion Tools (rm_*) ─────────────────────────────────────────

export interface RmAnalyzeData {
  episode: string;
  analysisDimensions: string[];
  scores: Record<string, number>;
  issues: string[];
  category: string;
  scenes: Array<{
    name: string;
    frames: number;
    seconds: number;
    dialogCount: number;
    characters: string[];
    effects: string[];
  }>;
  characterStats: Record<string, { lineCount: number; sceneCount: number }>;
  effectDistribution: Record<string, number>;
  emotionDistribution: Record<string, number>;
  totalFrames: number;
  totalSeconds: number;
  voiceMap: Record<string, string>;
  source: "storygraph" | "src" | "hybrid";
}

export interface RmSuggestData {
  episode: string;
  suggestionCount: number;
  categories: string[];
  seriesName: string;
  episodeCount: number;
  suggestions: Array<{
    severity: string;
    category: string;
    description: string;
    affectedEpisodes: string[];
    hint: string;
  }>;
  storyDebtCount: number;
  focus: string;
}

export interface RmLintData {
  episode: string;
  issues: Array<{ rule: string; severity: string; file: string }>;
  passCount: number;
  failCount: number;
  rulesChecked: string[];
  totalIssues: number;
  errors: number;
  warnings: number;
  strict: boolean;
}

// ─── Storygraph Tools (sg_*) ───────────────────────────────────────

export interface SgPipelineData {
  seriesId: string;
  mode: string;
  nodes: number;
  edges: number;
  communities: number;
  durationMs: number;
}

export interface SgCheckData {
  seriesId: string;
  gateScore: number;
  decision: string;
  checkCount: number;
  failures: string[];
}

export interface SgScoreData {
  seriesId: string;
  blendedScore: number;
  dimensions: string[];
}

export interface SgStatusData {
  hasEpisodeData: boolean;
  hasMergedGraph: boolean;
  hasGate: boolean;
  hasQualityScore: boolean;
  hasHTML: boolean;
  episodeCount?: number;
  nodeCount?: number;
  edgeCount?: number;
  gateScore?: number;
  gateDecision?: string;
  blendedScore?: number;
  blendedDecision?: string;
}

export interface SgRegressionData {
  hasBaseline?: boolean;
  exitCode?: number;
  baselineScore?: number;
  currentScore?: number;
  scoreDelta?: number;
  threshold?: number;
  regressed?: boolean;
  direction?: string;
}

export interface SgBaselineUpdateData {
  baselineScore: number;
  baselineDecision: string;
  baselinePath: string;
}

export interface SgBaselineListData {
  series: Array<{
    name: string;
    dir: string;
    hasBaseline: boolean;
    baselineScore?: number;
    baselineDate?: string;
    currentScore?: number;
    delta?: number;
  }>;
}

export interface SgSuggestData {
  genre: string;
  episodeCount: number;
  latestEpisode: string;
  suggestions: Array<{
    severity: string;
    category: string;
    description_zhTW: string;
    affectedCharacters: string[];
    affectedEpisodes: string[];
    fixHint?: string;
  }>;
  storyDebtCount: number;
}

export interface SgHealthData {
  gateScore: number;
  gateDecision: string;
  episodeCount: number;
  latestEpisode: string;
  dimensions: Array<{
    name: string;
    status: string;
    score?: number;
    summary_zhTW: string;
  }>;
  storyDebtCount: number;
  storyDebtItems: string[];
}

export interface SgDualReviewData {
  verdict: string;
  pipeline_score: number;
  reviewer_score: number;
  dimensions: {
    score_accuracy: number;
    check_fairness: number;
    completeness: number;
  };
  false_positives: string[];
  false_negatives: string[];
  recommendations: string[];
  reviewers: string[];
}

// ─── Scaffold Tools (sc_*) ─────────────────────────────────────────

export interface ScScaffoldData {
  series: string;
  episode: string;
  filesCreated: string[];
  dryRun: boolean;
}

export interface ScSeriesListData {
  series: Array<{
    id: string;
    displayName: string;
    category: string;
    chapterBased: boolean;
    standalone: boolean;
    defaultContentScenes: number;
  }>;
}

export interface ScEpisodeListData {
  episodes: Array<{ name: string; path: string; hasPlan: boolean }>;
  seriesDir: string;
}

// ─── TTS Tools (tts_*) ─────────────────────────────────────────────

export interface TtsGenerateData {
  episode: string;
  engine: string;
  scenesGenerated: string[];
  skipExisting: boolean;
  generated: number;
  skipped: number;
}

export interface TtsVoicesData {
  source: "voice-config.json" | "narration.ts";
  path: string;
  config?: Record<string, unknown>;
  voiceMap?: Record<string, string>;
}

export interface TtsStatusData {
  episode: string;
  hasAudio: boolean;
  fileCount: number;
  totalDurationSec?: number;
  complete: boolean;
  hasDurations: boolean;
  hasSegmentDurations: boolean;
  hasManifest: boolean;
}

// ─── Render Tools (render_*) ───────────────────────────────────────

export interface RenderEpisodeData {
  episode: string;
  outputPath: string;
  fileSizeKb: number;
  durationSec: number;
}

export interface RenderStatusData {
  episode: string;
  hasRender: boolean;
  isStale: boolean;
  fileSizeKb?: number;
  outputPath?: string;
  modifiedAt?: string;
}

export interface RenderListData {
  total: number;
  rendered: number;
  notRendered: number;
  stale: number;
  episodes: Array<{
    id: string;
    hasRender: boolean;
    sizeMb?: string;
    modified?: string;
    stale?: boolean;
  }>;
}

// ─── Image Tools (image_*) ─────────────────────────────────────────

export interface ImageGenerateData {
  seriesId: string;
  requested: number;
  generated: number;
  failed: number;
  skipped: number;
  files: string[];
}

export interface ImageStatusData {
  characterCount: number;
  backgroundCount: number;
  manifestCount: number;
  unpairedCount: number;
}

export interface ImageCharactersData {
  characters: Array<{
    id: string;
    name: string;
    color: string;
    voice: string;
    appearance: string | null;
    basePrompt: string | null;
    emotions: string[];
    variants: Array<{ type: string; emotion: string | null; facing: string; file: string }>;
  }>;
}

// ─── Discriminated Union ───────────────────────────────────────────

export type ToolName =
  | "rm_analyze" | "rm_suggest" | "rm_lint"
  | "sg_pipeline" | "sg_check" | "sg_score" | "sg_status" | "sg_regression"
  | "sg_baseline_update" | "sg_baseline_list" | "sg_suggest" | "sg_health" | "sg_dual_review"
  | "sc_scaffold" | "sc_series_list" | "sc_episode_list"
  | "tts_generate" | "tts_voices" | "tts_status"
  | "render_episode" | "render_status" | "render_list"
  | "image_generate" | "image_status" | "image_characters";

interface ToolDataMap {
  rm_analyze: RmAnalyzeData;
  rm_suggest: RmSuggestData;
  rm_lint: RmLintData;
  sg_pipeline: SgPipelineData;
  sg_check: SgCheckData;
  sg_score: SgScoreData;
  sg_status: SgStatusData;
  sg_regression: SgRegressionData;
  sg_baseline_update: SgBaselineUpdateData;
  sg_baseline_list: SgBaselineListData;
  sg_suggest: SgSuggestData;
  sg_health: SgHealthData;
  sg_dual_review: SgDualReviewData;
  sc_scaffold: ScScaffoldData;
  sc_series_list: ScSeriesListData;
  sc_episode_list: ScEpisodeListData;
  tts_generate: TtsGenerateData;
  tts_voices: TtsVoicesData;
  tts_status: TtsStatusData;
  render_episode: RenderEpisodeData;
  render_status: RenderStatusData;
  render_list: RenderListData;
  image_generate: ImageGenerateData;
  image_status: ImageStatusData;
  image_characters: ImageCharactersData;
}

export type ToolResultDetails<T extends ToolName = ToolName> =
  | { tool: T; success: true; data: ToolDataMap[T] }
  | { tool: T; success: false; data: { error: string } };

/** Type helper: extract the data shape for a given tool name. */
export type ToolDataFor<T extends ToolName> = ToolDataMap[T];

// ─── Runtime helper ────────────────────────────────────────────────

/**
 * Create a details object with the standard shape.
 *
 * @param tool     — tool name (e.g. "rm_analyze", "sg_pipeline")
 * @param success  — whether the tool invocation succeeded
 * @param data     — tool-specific structured payload
 */
export function details(
  tool: string,
  success: boolean,
  data: Record<string, unknown>,
): ToolResultBase {
  return { tool, success, data } as ToolResultBase;
}

// ─── Validation helpers ────────────────────────────────────────────

/** Known tool names for validation. */
export const ALL_TOOL_NAMES: ToolName[] = [
  "rm_analyze", "rm_suggest", "rm_lint",
  "sg_pipeline", "sg_check", "sg_score", "sg_status", "sg_regression",
  "sg_baseline_update", "sg_baseline_list", "sg_suggest", "sg_health", "sg_dual_review",
  "sc_scaffold", "sc_series_list", "sc_episode_list",
  "tts_generate", "tts_voices", "tts_status",
  "render_episode", "render_status", "render_list",
  "image_generate", "image_status", "image_characters",
];

/** Required fields that every successful result must have. */
const REQUIRED_PER_TOOL: Partial<Record<ToolName, string[]>> = {
  rm_analyze: ["episode", "category", "scenes", "totalFrames"],
  rm_suggest: ["episode", "suggestionCount", "categories"],
  rm_lint: ["episode", "issues", "rulesChecked"],
  sg_pipeline: ["seriesId"],
  sg_check: ["seriesId", "gateScore", "decision"],
  sg_score: ["seriesId", "blendedScore"],
  sg_status: ["hasEpisodeData"],
  sg_regression: [],
  sg_baseline_update: ["baselineScore"],
  sg_baseline_list: ["series"],
  sg_suggest: [],
  sg_health: [],
  sg_dual_review: ["verdict", "pipeline_score"],
  sc_scaffold: ["series"],
  sc_series_list: ["series"],
  sc_episode_list: ["episodes"],
  tts_generate: ["episode", "engine"],
  tts_voices: ["source"],
  tts_status: ["episode", "hasAudio"],
  render_episode: ["episode", "outputPath"],
  render_status: ["episode", "hasRender"],
  render_list: ["total", "rendered"],
  image_generate: ["seriesId", "generated"],
  image_status: ["characterCount"],
  image_characters: ["characters"],
};

/**
 * Validate a tool result has the expected shape.
 * Returns an array of validation errors (empty if valid).
 */
export function validateResult(result: ToolResultBase): string[] {
  const errors: string[] = [];

  if (!result.tool) {
    errors.push("missing tool name");
    return errors;
  }

  if (typeof result.success !== "boolean") {
    errors.push("missing or invalid success flag");
  }

  if (!result.data || typeof result.data !== "object") {
    errors.push("missing data object");
    return errors;
  }

  // Error results only need an error message
  if (!result.success) {
    if (!result.data.error) errors.push("error result missing 'error' field");
    return errors;
  }

  // Success results must have required fields
  const toolName = result.tool as ToolName;
  const required = REQUIRED_PER_TOOL[toolName];
  if (required) {
    for (const field of required) {
      if (!(field in result.data)) {
        errors.push(`missing required field '${field}'`);
      }
    }
  }

  return errors;
}
