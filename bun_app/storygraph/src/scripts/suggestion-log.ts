/**
 * Fix suggestion tracking — Phase 33-D2.
 *
 * Tracks fix suggestions from quality reviews over time, resolves them
 * when scores improve, and computes per-target suggestion deltas.
 *
 * Storage: storygraph_out/suggestion-log.json
 *
 * Usage:
 *   bun run storygraph calibrate <series-dir>   (shows deltas)
 */

import { resolve } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { QualityReview } from "./graphify-review";

// ─── Types ───

interface SuggestionEntry {
  id: string;
  timestamp: string;
  series: string;
  source: "quality_review" | "gate_fix";
  target: string;
  action: string;
  priority: "high" | "medium" | "low";
  estimated_impact: number;
  status: "open" | "applied" | "dismissed";
  applied_timestamp: string | null;
  score_before: number | null;
  score_after: number | null;
  score_delta: number | null;
}

interface SuggestionLog {
  version: "1.0";
  series: string;
  entries: SuggestionEntry[];
}

interface SuggestionDelta {
  target: string;
  count: number;
  avg_delta: number;
  applied: number;
  open: number;
}

// ─── Functions ───

function loadSuggestionLog(outDir: string): SuggestionLog {
  const logPath = resolve(outDir, "suggestion-log.json");
  if (!existsSync(logPath)) {
    return { version: "1.0", series: "", entries: [] };
  }
  try {
    return JSON.parse(readFileSync(logPath, "utf-8"));
  } catch {
    return { version: "1.0", series: "", entries: [] };
  }
}

function saveSuggestionLog(outDir: string, log: SuggestionLog): void {
  const logPath = resolve(outDir, "suggestion-log.json");
  writeFileSync(logPath, JSON.stringify(log, null, 2));
}

function addSuggestionsFromReview(
  outDir: string,
  review: QualityReview,
  gateScore: number
): number {
  const log = loadSuggestionLog(outDir);
  const ts = new Date().toISOString();
  const datePrefix = ts.replace(/[-:T]/g, "").slice(0, 8);
  let added = 0;

  for (let i = 0; i < review.fix_suggestions.length; i++) {
    const sug = review.fix_suggestions[i];

    // Skip duplicate suggestions for same target that are still open
    const existing = log.entries.find(
      e => e.target === sug.target && e.status === "open"
    );
    if (existing) continue;

    log.entries.push({
      id: `sug_${datePrefix}_${log.entries.length}`,
      timestamp: ts,
      series: review.series,
      source: "quality_review",
      target: sug.target,
      action: sug.action,
      priority: sug.priority,
      estimated_impact: sug.estimated_impact,
      status: "open",
      applied_timestamp: null,
      score_before: gateScore,
      score_after: null,
      score_delta: null,
    });
    added++;
  }

  log.series = review.series || log.series;
  saveSuggestionLog(outDir, log);
  return added;
}

function resolveAppliedSuggestions(
  outDir: string,
  currentGateScore: number
): { resolved: number; still_open: number } {
  const log = loadSuggestionLog(outDir);
  let resolved = 0;

  for (const entry of log.entries) {
    if (entry.status !== "open") continue;
    if (entry.score_before === null) continue;

    const delta = currentGateScore - entry.score_before;

    // Resolve if score changed by at least 5 points (in either direction)
    if (Math.abs(delta) >= 5) {
      entry.status = "applied";
      entry.applied_timestamp = new Date().toISOString();
      entry.score_after = currentGateScore;
      entry.score_delta = delta;
      resolved++;
    }
  }

  saveSuggestionLog(outDir, log);
  const stillOpen = log.entries.filter(e => e.status === "open").length;
  return { resolved, still_open: stillOpen };
}

function computeSuggestionDeltas(log: SuggestionLog): SuggestionDelta[] {
  const byTarget = new Map<string, { deltas: number[]; applied: number; open: number }>();

  for (const entry of log.entries) {
    if (!byTarget.has(entry.target)) {
      byTarget.set(entry.target, { deltas: [], applied: 0, open: 0 });
    }
    const bucket = byTarget.get(entry.target)!;
    if (entry.status === "applied" && entry.score_delta !== null) {
      bucket.deltas.push(entry.score_delta);
      bucket.applied++;
    }
    if (entry.status === "open") {
      bucket.open++;
    }
  }

  const results: SuggestionDelta[] = [];
  for (const [target, data] of byTarget) {
    const avgDelta = data.deltas.length > 0
      ? data.deltas.reduce((a, b) => a + b, 0) / data.deltas.length
      : 0;
    results.push({
      target,
      count: data.deltas.length,
      avg_delta: Math.round(avgDelta * 100) / 100,
      applied: data.applied,
      open: data.open,
    });
  }

  return results.sort((a, b) => b.avg_delta - a.avg_delta);
}

// ─── Exports ───

export {
  loadSuggestionLog,
  saveSuggestionLog,
  addSuggestionsFromReview,
  resolveAppliedSuggestions,
  computeSuggestionDeltas,
};
export type { SuggestionEntry, SuggestionLog, SuggestionDelta };
