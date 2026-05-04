/**
 * storygraph-contracts — Formal request/response types for the Storygraph pipeline API.
 *
 * These types mirror the shapes produced by storygraph/pipeline-api functions
 * and consumed by remotion_studio server routes. They serve as the contract
 * between the two workspace packages.
 *
 * Pipeline flow: scaffold → pipeline → check → score → (image ‖ tts) → render
 */

// ─── Pipeline mode ───

export type PipelineMode = "regex" | "ai" | "hybrid";

// ─── Pipeline Run ───

export interface PipelineRequest {
  seriesId: string;
  mode?: PipelineMode;
}

export interface StepResult {
  step: string;
  success: boolean;
  duration_ms: number;
  message?: string;
}

export interface PipelineResponse {
  success: boolean;
  seriesDir: string;
  outputDir: string;
  steps: StepResult[];
  errors: string[];
}

// ─── Quality Check ───

export interface CheckRequest {
  seriesId: string;
  mode?: PipelineMode;
}

export interface GateCheck {
  name: string;
  status: string;
  score_impact: number;
}

export interface CheckResponse {
  success: boolean;
  seriesDir: string;
  gatePath: string;
  gateScore: number;
  gateDecision: string;
  checks: GateCheck[];
  errors: string[];
}

// ─── AI Scoring ───

export interface ScoreRequest {
  seriesId: string;
  mode?: PipelineMode;
}

export interface BlendedScore {
  overall: number;
  decision: string;
  formula: string;
}

export interface ProgrammaticScore {
  score: number;
  decision: string;
}

export interface AIScore {
  overall: number;
  justification: string;
}

export interface ScoreResponse {
  success: boolean;
  seriesDir: string;
  outputPath: string;
  blended: BlendedScore;
  programmatic: ProgrammaticScore;
  ai: AIScore | null;
  errors: string[];
}

// ─── Pipeline Status ───

export interface PipelineStatusResponse {
  hasEpisodeData: boolean;
  hasMergedGraph: boolean;
  hasGate: boolean;
  hasQualityScore: boolean;
  hasHTML: boolean;
  gateScore?: number;
  gateDecision?: string;
  blendedScore?: number;
  blendedDecision?: string;
  episodeCount?: number;
  nodeCount?: number;
  edgeCount?: number;
}

// ─── Suggest ───

export type SuggestionCategory =
  | "foreshadow_debt" | "flat_arc" | "gag_stagnation" | "missing_interaction"
  | "thematic_gap" | "pacing_issue" | "trait_gap" | "duplicate_risk";

export type SuggestionSeverity = "high" | "medium" | "low";

export interface Suggestion {
  category: SuggestionCategory;
  severity: SuggestionSeverity;
  description_zhTW: string;
  affectedCharacters: string[];
  affectedEpisodes: string[];
  fixHint?: string;
}

export interface SuggestResponse {
  success: boolean;
  seriesDir: string;
  targetEpId?: string;
  genre: string;
  episodeCount: number;
  latestEpisode: string;
  suggestions: Suggestion[];
  storyDebtCount: number;
  errors: string[];
}

// ─── Health ───

export type HealthStatus = "good" | "warn" | "alert";

export interface HealthDimension {
  name: string;
  status: HealthStatus;
  summary_zhTW: string;
  score: number | null;
}

export interface HealthResponse {
  success: boolean;
  seriesDir: string;
  genre: string;
  episodeCount: number;
  latestEpisode: string;
  gateScore: number;
  gateDecision: string;
  dimensions: HealthDimension[];
  storyDebtCount: number;
  storyDebtItems: string[];
  errors: string[];
}

// ─── Gate.json on-disk schema ───

export interface GateFile {
  score: number;
  decision: string;
  checks: Array<{
    name: string;
    status: string;
    score_impact?: number;
    evidence?: string[];
    details?: string;
    fix_suggestion_zhTW?: string;
  }>;
  quality_breakdown?: Record<string, number>;
}

// ─── AI Pipeline Options (shared across all operations) ───

export interface AIPipelineOptions {
  mode?: PipelineMode;
  provider?: string;
  model?: string;
}

// ─── Type guards ───

export function isPipelineResponse(v: unknown): v is PipelineResponse {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.success === "boolean"
    && typeof r.seriesDir === "string"
    && Array.isArray(r.steps)
    && Array.isArray(r.errors);
}

export function isCheckResponse(v: unknown): v is CheckResponse {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.success === "boolean"
    && typeof r.gateScore === "number"
    && typeof r.gateDecision === "string"
    && Array.isArray(r.checks);
}

export function isScoreResponse(v: unknown): v is ScoreResponse {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.success === "boolean"
    && typeof r === "object"
    && typeof (r.blended as Record<string, unknown>)?.overall === "number";
}

export function isGateFile(v: unknown): v is GateFile {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.score === "number"
    && typeof r.decision === "string"
    && Array.isArray(r.checks);
}
