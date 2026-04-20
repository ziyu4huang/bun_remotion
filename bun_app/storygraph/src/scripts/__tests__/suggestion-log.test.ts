/**
 * Tests for suggestion-log.ts — Phase 33-D2.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  loadSuggestionLog,
  saveSuggestionLog,
  addSuggestionsFromReview,
  resolveAppliedSuggestions,
  computeSuggestionDeltas,
} from "../suggestion-log";
import type { QualityReview } from "../graphify-review";

const TMP_DIR = resolve(import.meta.dir, "__tmp_suggestion__");

function makeReview(overrides: Partial<QualityReview> = {}): QualityReview {
  return {
    version: "1.0",
    timestamp: "2026-04-20T00:00:00Z",
    series: "test-series",
    genre: "xianxia_comedy",
    reviewer: { tier: 2, model: "glm-5", mode: "hybrid" },
    decision: "REVIEW",
    overall_quality: 6.5,
    dimensions: [],
    fix_suggestions: [
      { target: "Plot Arc", action: "加入高潮場景", priority: "high", estimated_impact: 15 },
      { target: "Pacing", action: "調整節奏", priority: "medium", estimated_impact: 5 },
    ],
    reviewer_notes: "",
    input_gate_score: 85,
    input_blended_score: null,
    input_node_count: 50,
    input_edge_count: 60,
    ...overrides,
  };
}

beforeEach(() => {
  mkdirSync(TMP_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
});

describe("loadSuggestionLog", () => {
  test("returns empty log when no file exists", () => {
    const log = loadSuggestionLog(TMP_DIR);
    expect(log.entries).toEqual([]);
  });

  test("loads existing log", () => {
    const logPath = resolve(TMP_DIR, "suggestion-log.json");
    writeFileSync(logPath, JSON.stringify({
      version: "1.0",
      series: "test",
      entries: [{ id: "sug_1", target: "X", status: "open" }],
    }));
    const log = loadSuggestionLog(TMP_DIR);
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0].target).toBe("X");
  });

  test("handles corrupt file", () => {
    const logPath = resolve(TMP_DIR, "suggestion-log.json");
    writeFileSync(logPath, "not json");
    const log = loadSuggestionLog(TMP_DIR);
    expect(log.entries).toEqual([]);
  });
});

describe("addSuggestionsFromReview", () => {
  test("adds fix suggestions to log", () => {
    const count = addSuggestionsFromReview(TMP_DIR, makeReview(), 85);
    expect(count).toBe(2);
    const log = loadSuggestionLog(TMP_DIR);
    expect(log.entries).toHaveLength(2);
    expect(log.entries[0].target).toBe("Plot Arc");
    expect(log.entries[0].score_before).toBe(85);
    expect(log.entries[0].status).toBe("open");
  });

  test("skips duplicate open suggestions for same target", () => {
    addSuggestionsFromReview(TMP_DIR, makeReview(), 85);
    const count = addSuggestionsFromReview(TMP_DIR, makeReview(), 85);
    expect(count).toBe(0);
    const log = loadSuggestionLog(TMP_DIR);
    expect(log.entries).toHaveLength(2);
  });

  test("adds new suggestion if old one is resolved", () => {
    addSuggestionsFromReview(TMP_DIR, makeReview(), 85);
    // Resolve the first one
    const log = loadSuggestionLog(TMP_DIR);
    log.entries[0].status = "applied";
    saveSuggestionLog(TMP_DIR, log);

    const count = addSuggestionsFromReview(TMP_DIR, makeReview(), 90);
    expect(count).toBe(1); // Plot Arc re-added, Pacing still open
  });

  test("handles review with empty fix_suggestions", () => {
    const count = addSuggestionsFromReview(TMP_DIR, makeReview({ fix_suggestions: [] }), 100);
    expect(count).toBe(0);
  });
});

describe("resolveAppliedSuggestions", () => {
  test("resolves suggestions with significant score change", () => {
    addSuggestionsFromReview(TMP_DIR, makeReview(), 60);
    const result = resolveAppliedSuggestions(TMP_DIR, 80);
    expect(result.resolved).toBe(2);
    expect(result.still_open).toBe(0);

    const log = loadSuggestionLog(TMP_DIR);
    expect(log.entries[0].status).toBe("applied");
    expect(log.entries[0].score_delta).toBe(20);
    expect(log.entries[0].score_after).toBe(80);
  });

  test("does not resolve if score change < 5", () => {
    addSuggestionsFromReview(TMP_DIR, makeReview(), 85);
    const result = resolveAppliedSuggestions(TMP_DIR, 88);
    expect(result.resolved).toBe(0);
    expect(result.still_open).toBe(2);
  });

  test("resolves negative deltas (score dropped)", () => {
    addSuggestionsFromReview(TMP_DIR, makeReview(), 90);
    const result = resolveAppliedSuggestions(TMP_DIR, 75);
    expect(result.resolved).toBe(2);
    const log = loadSuggestionLog(TMP_DIR);
    expect(log.entries[0].score_delta).toBe(-15);
  });
});

describe("computeSuggestionDeltas", () => {
  test("computes avg delta per target", () => {
    addSuggestionsFromReview(TMP_DIR, makeReview(), 60);
    resolveAppliedSuggestions(TMP_DIR, 80);

    const log = loadSuggestionLog(TMP_DIR);
    const deltas = computeSuggestionDeltas(log);
    expect(deltas).toHaveLength(2);
    expect(deltas[0].avg_delta).toBe(20);
    expect(deltas[0].count).toBe(1);
  });

  test("returns empty for log with no applied entries", () => {
    addSuggestionsFromReview(TMP_DIR, makeReview(), 85);
    const log = loadSuggestionLog(TMP_DIR);
    const deltas = computeSuggestionDeltas(log);
    expect(deltas).toHaveLength(2);
    expect(deltas[0].count).toBe(0);
    expect(deltas[0].open).toBe(1);
  });

  test("averages multiple deltas for same target", () => {
    addSuggestionsFromReview(TMP_DIR, makeReview(), 60);
    resolveAppliedSuggestions(TMP_DIR, 80); // +20

    // Re-add after resolving
    const log = loadSuggestionLog(TMP_DIR);
    log.entries[0].status = "applied";
    saveSuggestionLog(TMP_DIR, log);
    addSuggestionsFromReview(TMP_DIR, makeReview({ fix_suggestions: [
      { target: "Plot Arc", action: "New fix", priority: "high", estimated_impact: 10 },
    ]}), 80);
    resolveAppliedSuggestions(TMP_DIR, 90); // +10

    const finalLog = loadSuggestionLog(TMP_DIR);
    const deltas = computeSuggestionDeltas(finalLog);
    const plotArc = deltas.find(d => d.target === "Plot Arc");
    expect(plotArc).toBeDefined();
    expect(plotArc!.avg_delta).toBe(15); // (20 + 10) / 2
  });
});
