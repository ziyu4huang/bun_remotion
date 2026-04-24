/**
 * Parse GLM response into typed ReviewResult.
 *
 * Handles: markdown fences, truncated JSON, missing fields, score clamping.
 */

import { stripMarkdownFence, repairTruncatedJSON } from "./ai-call";
import type { ReviewResult, ReviewDimensions, FixSuggestion, ReviewDecision } from "./types";

const VALID_DECISIONS = new Set<string>(["APPROVE", "APPROVE_WITH_FIXES", "REQUEST_RERUN", "BLOCK"]);

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parseDimensions(raw: any): ReviewDimensions {
  const d = raw ?? {};
  return {
    semantic_correctness: clamp(d.semantic_correctness, 0, 10, 5),
    creative_quality: clamp(d.creative_quality, 0, 10, 5),
    genre_fit: clamp(d.genre_fit, 0, 10, 5),
    pacing: clamp(d.pacing, 0, 10, 5),
    character_consistency: clamp(d.character_consistency, 0, 10, 5),
    regression_vs_previous: clamp(d.regression_vs_previous, 0, 10, 5),
  };
}

function parseFixSuggestions(raw: any): FixSuggestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s: any) => s && typeof s === "object")
    .map((s: any) => ({
      target: String(s.target ?? ""),
      suggestion: String(s.suggestion ?? ""),
      priority: ["high", "medium", "low"].includes(s.priority) ? s.priority : "medium",
    }))
    .filter(s => s.target || s.suggestion);
}

function parseStringArray(raw: any): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s: any) => typeof s === "string" && s.trim()).map(String);
}

/**
 * Parse raw GLM response text into a ReviewResult.
 * Returns null if the response is unparseable.
 *
 * NOTE: _meta is NOT filled here — the CLI fills it after parsing.
 */
export function parseReviewResponse(raw: string): Omit<ReviewResult, "_meta"> | null {
  let cleaned = stripMarkdownFence(raw.trim());

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try repair
    const repaired = repairTruncatedJSON(cleaned);
    try {
      parsed = JSON.parse(repaired);
    } catch {
      console.error("[review-parser] Failed to parse response even after repair");
      return null;
    }
  }

  // Validate required fields
  if (!parsed || typeof parsed !== "object") return null;

  const decision: ReviewDecision = VALID_DECISIONS.has(parsed.decision)
    ? parsed.decision
    : "APPROVE_WITH_FIXES";

  const dimensions = parseDimensions(parsed.dimensions);
  const overall = clamp(parsed.overall, 0, 10, 5);

  return {
    decision,
    dimensions,
    overall,
    strengths: parseStringArray(parsed.strengths),
    weaknesses: parseStringArray(parsed.weaknesses),
    fix_suggestions: parseFixSuggestions(parsed.fix_suggestions),
    summary_zhTW: typeof parsed.summary_zhTW === "string" ? parsed.summary_zhTW : "",
  };
}
