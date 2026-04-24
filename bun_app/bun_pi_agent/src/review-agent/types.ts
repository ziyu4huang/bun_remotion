/**
 * Phase 43: Review Agent types.
 *
 * Episode/story quality review produced by GLM5-turbo.
 * Output: storygraph_out/quality-review.json (version "2.0")
 */

export type ReviewDecision =
  | "APPROVE"
  | "APPROVE_WITH_FIXES"
  | "REQUEST_RERUN"
  | "BLOCK";

export interface ReviewDimensions {
  semantic_correctness: number;   // 0-10
  creative_quality: number;       // 0-10
  genre_fit: number;              // 0-10
  pacing: number;                 // 0-10
  character_consistency: number;  // 0-10
  regression_vs_previous: number; // 0-10
}

export interface FixSuggestion {
  target: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

export interface ReviewMeta {
  version: "2.0";
  timestamp: string;
  series: string;
  genre: string;
  model: string;
  input_gate_score: number;
  input_quality_score: number | null;
  input_node_count: number;
  input_edge_count: number;
  episodes_reviewed: number;
}

export interface ReviewResult {
  decision: ReviewDecision;
  dimensions: ReviewDimensions;
  overall: number; // 0-10
  strengths: string[];
  weaknesses: string[];
  fix_suggestions: FixSuggestion[];
  summary_zhTW: string;
  _meta: ReviewMeta;
}

/** Gate.json check item (subset of fields we read). */
export interface GateCheck {
  name: string;
  status: "PASS" | "WARN" | "FAIL" | "SKIP";
  score_impact: number;
  fix_suggestion_zhTW: string;
}

/** Gate.json shape (subset we consume). */
export interface GateJson {
  version: string;
  series: string;
  genre: string;
  score: number;
  decision: "PASS" | "WARN" | "FAIL";
  checks: GateCheck[];
}

/** kg-quality-score.json blended section (subset). */
export interface QualityScoreBlended {
  overall: number;
  decision: string;
}
