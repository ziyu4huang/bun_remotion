import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");
const BASELINES_DIR = resolve(REPO_ROOT, "bun_app/storygraph/test-corpus/baselines");

// ── Types ──

export interface SeriesQualitySnapshot {
  seriesId: string;
  gateScore: number | null;
  blendedScore: number | null;
  decision: string | null;
  previousScore: number | null;
  scoreDelta: number | null;
  trend: "improving" | "stable" | "declining" | "new";
  nodeCount: number;
  edgeCount: number;
  communityCount: number;
  aiDimensions: Record<string, number> | null;
  aiOverall: number | null;
  breakdown: Record<string, number | null> | null;
  generatorMode: string | null;
  genre: string | null;
}

export interface RegressionAlert {
  seriesId: string;
  metric: string;
  baseline: number;
  current: number;
  delta: number;
  deltaPercent: number;
  isRegression: boolean;
}

export interface ScoreHistoryPoint {
  date: string;
  gateScore: number;
  blendedScore: number | null;
  aiOverall: number | null;
}

// ── Helpers ──

function readJsonSafe<T>(filePath: string): T | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

interface GateJson {
  version?: string;
  score?: number;
  previous_score?: number;
  score_delta?: number;
  decision?: string;
  genre?: string;
  generator?: { mode?: string };
  quality_breakdown?: Record<string, number | null>;
  checks?: { name: string; status: string }[];
}

interface MergedGraph {
  nodes?: unknown[];
  edges?: unknown[];
  communities?: unknown[];
}

interface QualityScore {
  ai?: {
    dimensions?: Record<string, number>;
    overall?: number;
  };
  blended?: {
    overall?: number;
    decision?: string;
  };
  programmatic?: { score?: number };
}

// ── Cross-series comparison ──

export function getCrossSeriesComparison(): SeriesQualitySnapshot[] {
  const results: SeriesQualitySnapshot[] = [];

  const dirs = readdirSync(PROJ_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "shared" && d.name !== "shared-fixture");

  for (const dir of dirs) {
    const seriesId = dir.name;
    const outDir = resolve(PROJ_DIR, seriesId, "storygraph_out");

    const gate = readJsonSafe<GateJson>(resolve(outDir, "gate.json"));
    const merged = readJsonSafe<MergedGraph>(resolve(outDir, "merged-graph.json"));
    const quality = readJsonSafe<QualityScore>(resolve(outDir, "kg-quality-score.json"));

    if (!gate && !quality) continue;

    const gateScore = gate?.score ?? null;
    const prevScore = gate?.previous_score ?? null;
    const aiOverall = quality?.ai?.overall ?? null;

    let blendedScore: number | null = null;
    if (gateScore != null && aiOverall != null) {
      blendedScore = Math.round((0.4 * gateScore + 0.6 * aiOverall * 10) * 10) / 10;
    }

    let trend: SeriesQualitySnapshot["trend"] = "new";
    if (gateScore != null && prevScore != null) {
      const delta = gateScore - prevScore;
      if (delta > 5) trend = "improving";
      else if (delta < -5) trend = "declining";
      else trend = "stable";
    } else if (gateScore != null) {
      trend = "stable";
    }

    results.push({
      seriesId,
      gateScore,
      blendedScore,
      decision: gate?.decision ?? quality?.blended?.decision ?? null,
      previousScore: prevScore,
      scoreDelta: gate?.score_delta ?? null,
      trend,
      nodeCount: merged?.nodes?.length ?? 0,
      edgeCount: merged?.edges?.length ?? 0,
      communityCount: merged?.communities?.length ?? 0,
      aiDimensions: quality?.ai?.dimensions ?? null,
      aiOverall,
      breakdown: gate?.quality_breakdown ?? quality?.programmatic?.["quality_breakdown"] ?? null,
      generatorMode: gate?.generator?.mode ?? null,
      genre: gate?.genre ?? null,
    });
  }

  return results;
}

// ── Regression alerts ──

export function getRegressionAlerts(threshold = 10): RegressionAlert[] {
  const alerts: RegressionAlert[] = [];

  if (!existsSync(BASELINES_DIR)) return alerts;

  const baselineDirs = readdirSync(BASELINES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const bDir of baselineDirs) {
    const seriesId = bDir.name;
    const seriesBaselineDir = resolve(BASELINES_DIR, seriesId);

    // Find latest baseline
    const gateFiles = readdirSync(seriesBaselineDir)
      .filter((f) => f.startsWith("gate-") && f.endsWith(".json"))
      .sort();

    if (gateFiles.length === 0) continue;

    const latestBaseline = readJsonSafe<GateJson>(resolve(seriesBaselineDir, gateFiles[gateFiles.length - 1]));
    if (!latestBaseline) continue;

    // Read current
    const currentGate = readJsonSafe<GateJson>(resolve(PROJ_DIR, seriesId, "storygraph_out", "gate.json"));
    if (!currentGate || currentGate.score == null) continue;

    const baselineScore = latestBaseline.score ?? 0;
    const currentScore = currentGate.score;
    const delta = currentScore - baselineScore;
    const deltaPercent = baselineScore > 0 ? Math.round((delta / baselineScore) * 100) : (delta > 0 ? 100 : 0);

    alerts.push({
      seriesId,
      metric: "gate_score",
      baseline: baselineScore,
      current: currentScore,
      delta,
      deltaPercent,
      isRegression: deltaPercent < -threshold,
    });

    // Also check blended score if baseline has it
    const scoreFiles = readdirSync(seriesBaselineDir)
      .filter((f) => f.startsWith("kg-quality-score-") && f.endsWith(".json"))
      .sort();

    if (scoreFiles.length > 0) {
      const baselineQuality = readJsonSafe<QualityScore>(resolve(seriesBaselineDir, scoreFiles[scoreFiles.length - 1]));
      const currentQuality = readJsonSafe<QualityScore>(resolve(PROJ_DIR, seriesId, "storygraph_out", "kg-quality-score.json"));

      if (baselineQuality?.blended?.overall != null && currentQuality?.blended?.overall != null) {
        const bBlended = baselineQuality.blended.overall;
        const cBlended = currentQuality.blended.overall;
        const bDelta = cBlended - bBlended;
        const bDeltaPct = bBlended > 0 ? Math.round((bDelta / bBlended) * 100) : 0;

        alerts.push({
          seriesId,
          metric: "blended_score",
          baseline: Math.round(bBlended * 1000) / 10,
          current: Math.round(cBlended * 1000) / 10,
          delta: Math.round(bDelta * 1000) / 10,
          deltaPercent: bDeltaPct,
          isRegression: bDeltaPct < -threshold,
        });
      }
    }
  }

  return alerts;
}

// ── Score history ──

export function getScoreHistory(seriesId: string): ScoreHistoryPoint[] {
  const seriesBaselineDir = resolve(BASELINES_DIR, seriesId);
  if (!existsSync(seriesBaselineDir)) return [];

  const points: ScoreHistoryPoint[] = [];

  const gateFiles = readdirSync(seriesBaselineDir)
    .filter((f) => f.startsWith("gate-") && f.endsWith(".json"))
    .sort();

  for (const gf of gateFiles) {
    const dateMatch = gf.match(/gate-(\d{8})\.json/);
    if (!dateMatch) continue;
    const date = dateMatch[1];
    const gate = readJsonSafe<GateJson>(resolve(seriesBaselineDir, gf));
    if (!gate) continue;

    // Try to find matching quality score
    const scoreFile = resolve(seriesBaselineDir, `kg-quality-score-${date}.json`);
    const quality = readJsonSafe<QualityScore>(scoreFile);

    points.push({
      date,
      gateScore: gate.score ?? 0,
      blendedScore: quality?.blended?.overall != null
        ? Math.round(quality.blended.overall * 1000) / 10
        : null,
      aiOverall: quality?.ai?.overall ?? null,
    });
  }

  // Add current state as final point
  const currentGate = readJsonSafe<GateJson>(resolve(PROJ_DIR, seriesId, "storygraph_out", "gate.json"));
  const currentQuality = readJsonSafe<QualityScore>(resolve(PROJ_DIR, seriesId, "storygraph_out", "kg-quality-score.json"));

  if (currentGate?.score != null) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    // Avoid duplicate if baseline was created today
    const lastDate = points.length > 0 ? points[points.length - 1].date : "";
    if (today !== lastDate) {
      points.push({
        date: today,
        gateScore: currentGate.score,
        blendedScore: currentQuality?.blended?.overall != null
          ? Math.round(currentQuality.blended.overall * 1000) / 10
          : null,
        aiOverall: currentQuality?.ai?.overall ?? null,
      });
    }
  }

  return points;
}
