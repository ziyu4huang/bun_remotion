/**
 * remotion_types — Shared video structure types for bun-remotion.
 *
 * Used by episodeforge (project generation) and storygraph (KG pipeline).
 * Agents: read this barrel for the public API, not individual files.
 *
 * Exports:
 *   category-types  — 7 video categories, detection, helpers
 *   scene-templates  — CompositionSpec builders per category
 *   presets/*        — Per-category preset data (storygraph explainer, etc.)
 */

// Category taxonomy
export type {
  VideoCategoryId,
  VideoCategory,
  SceneTemplate,
  AnimationStyle,
  AudioMode,
  AspectRatio,
} from "./category-types";

export {
  VIDEO_CATEGORIES,
  getCategory,
  listCategoryIds,
  detectCategoryFromDirname,
  genreToCategory,
  estimateSceneCount,
} from "./category-types";

// Scene templates & composition specs
export type {
  SceneSpec,
  CompositionSpec,
  TechExplainerData,
  NarrativeDramaData,
  GalgameVNData,
  ListicleData,
  TutorialData,
  DataStoryData,
  ShortsMemeData,
} from "./scene-templates";

export {
  buildTechExplainerSpec,
  buildNarrativeDramaSpec,
  buildGalgameVNSpec,
  buildListicleSpec,
  buildTutorialSpec,
  buildDataStorySpec,
  buildShortsMemeSpec,
  buildCompositionSpec,
} from "./scene-templates";

// Storygraph pipeline contracts
export type {
  PipelineMode,
  PipelineRequest,
  StepResult,
  PipelineResponse,
  CheckRequest,
  GateCheck,
  CheckResponse,
  ScoreRequest,
  BlendedScore,
  ProgrammaticScore,
  AIScore,
  ScoreResponse,
  PipelineStatusResponse,
  SuggestionCategory,
  SuggestionSeverity,
  Suggestion,
  SuggestResponse,
  HealthStatus,
  HealthDimension,
  HealthResponse,
  GateFile,
  AIPipelineOptions,
} from "./storygraph-contracts";

export {
  isPipelineResponse,
  isCheckResponse,
  isScoreResponse,
  isGateFile,
} from "./storygraph-contracts";

// Presets
export type { TechExplainerPreset } from "./presets/tech-explainer-presets";
export {
  storygraphExplainerPreset,
  storygraphExplainerData,
  TECH_EXPLAINER_PRESETS,
  detectTechExplainerPreset,
} from "./presets/tech-explainer-presets";
