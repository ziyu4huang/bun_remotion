import { resolve } from "node:path";
import { existsSync, readFileSync, copyFileSync, readdirSync } from "node:fs";
import type { BaselineInfo, RegressionSeriesStatus, BenchmarkResult } from "../../shared/types";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
export const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

export function readJsonSafe<T>(filePath: string): T | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function computeCheckDeltas(
  baseline: { checks?: Array<{ name: string; score_impact: number }> } | null,
  current: { checks?: Array<{ name: string; score_impact: number }> },
): string[] | undefined {
  const baselineChecks = new Map((baseline?.checks ?? []).map((ch) => [ch.name, ch.score_impact]));
  const deltas: string[] = [];
  for (const cur of current.checks ?? []) {
    const prev = baselineChecks.get(cur.name);
    if (prev != null && cur.score_impact !== prev) {
      const d = cur.score_impact - prev;
      deltas.push(`${cur.name}: ${prev} → ${cur.score_impact} (${d > 0 ? "+" : ""}${d})`);
    }
  }
  return deltas.length > 0 ? deltas : undefined;
}

interface RegressionResult {
  regressionStatus: BenchmarkResult["regressionStatus"];
  baselineScore: number | null;
  scoreDelta: number | null;
  checkDeltas: string[] | undefined;
}

export function readRegressionForSeries(
  seriesDir: string,
  threshold: number,
): RegressionResult {
  const outDir = resolve(seriesDir, "storygraph_out");
  const baselinePath = resolve(outDir, "baseline-gate.json");
  const currentGatePath = resolve(outDir, "gate.json");

  if (!existsSync(baselinePath)) {
    return {
      regressionStatus: "NO_BASELINE" as const,
      baselineScore: null,
      scoreDelta: null,
      checkDeltas: undefined,
    };
  }

  const baseline = readJsonSafe<{ score?: number; checks?: Array<{ name: string; score_impact: number }> }>(baselinePath);
  const current = readJsonSafe<{ score?: number; decision?: string; checks?: Array<{ name: string; score_impact: number }> }>(currentGatePath);
  const baselineScore = baseline?.score ?? null;

  if (!current?.score) {
    return { regressionStatus: "NO_GATE", baselineScore, scoreDelta: null, checkDeltas: undefined };
  }

  const scoreDelta = current.score - (baselineScore ?? 0);
  return {
    regressionStatus: Math.abs(scoreDelta) > threshold ? "REGRESSION" : "OK",
    baselineScore,
    scoreDelta,
    checkDeltas: computeCheckDeltas(baseline, current),
  };
}

export function listSeriesDirs(): string[] {
  return readdirSync(PROJ_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "shared" && d.name !== "shared-fixture")
    .map((d) => d.name);
}

export function readBaselineInfo(seriesId: string): BaselineInfo {
  const outDir = resolve(PROJ_DIR, seriesId, "storygraph_out");
  const baselinePath = resolve(outDir, "baseline-gate.json");
  const currentGatePath = resolve(outDir, "gate.json");

  const info: BaselineInfo = {
    seriesId,
    hasBaseline: false,
    baselineScore: null,
    baselineDate: null,
    currentScore: null,
    delta: null,
  };

  if (existsSync(baselinePath)) {
    const baseline = readJsonSafe<{ score?: number; timestamp?: string }>(baselinePath);
    info.hasBaseline = true;
    info.baselineScore = baseline?.score ?? null;
    info.baselineDate = baseline?.timestamp ?? null;
  }

  const current = readJsonSafe<{ score?: number }>(currentGatePath);
  info.currentScore = current?.score ?? null;

  if (info.baselineScore != null && info.currentScore != null) {
    info.delta = info.currentScore - info.baselineScore;
  }

  return info;
}

export function listBaselines(): BaselineInfo[] {
  return listSeriesDirs().map(readBaselineInfo);
}

export function updateBaseline(seriesId: string): BaselineInfo {
  const outDir = resolve(PROJ_DIR, seriesId, "storygraph_out");
  const currentGatePath = resolve(outDir, "gate.json");
  const baselinePath = resolve(outDir, "baseline-gate.json");

  if (!existsSync(currentGatePath)) {
    throw new Error("No gate.json found — run pipeline first");
  }

  const gate = readJsonSafe<{ score?: number; decision?: string; timestamp?: string }>(currentGatePath);
  copyFileSync(currentGatePath, baselinePath);

  return {
    seriesId,
    hasBaseline: true,
    baselineScore: gate?.score ?? null,
    baselineDate: gate?.timestamp ?? new Date().toISOString(),
    currentScore: gate?.score ?? null,
    delta: 0,
  };
}

export function listRegressionStatuses(threshold: number): RegressionSeriesStatus[] {
  return listSeriesDirs().map((seriesId) => {
    const seriesDir = resolve(PROJ_DIR, seriesId);
    const outDir = resolve(seriesDir, "storygraph_out");
    const baselinePath = resolve(outDir, "baseline-gate.json");
    const currentGatePath = resolve(outDir, "gate.json");

    const status: RegressionSeriesStatus = {
      seriesId,
      hasBaseline: existsSync(baselinePath),
      baselineScore: null,
      baselineDate: null,
      currentScore: null,
      scoreDelta: null,
      regressionStatus: "NO_BASELINE",
    };

    if (status.hasBaseline) {
      const baseline = readJsonSafe<{ score?: number; timestamp?: string }>(baselinePath);
      status.baselineScore = baseline?.score ?? null;
      status.baselineDate = baseline?.timestamp ?? null;
    }

    const current = readJsonSafe<{ score?: number }>(currentGatePath);
    status.currentScore = current?.score ?? null;

    if (!current?.score) {
      status.regressionStatus = "NO_GATE";
    } else if (status.hasBaseline && status.baselineScore != null) {
      const delta = current.score - status.baselineScore;
      status.scoreDelta = delta;
      status.regressionStatus = Math.abs(delta) > threshold ? "REGRESSION" : "OK";

      const baseline = readJsonSafe<{ checks?: Array<{ name: string; score_impact: number }> }>(baselinePath);
      const checkDeltas = computeCheckDeltas(baseline, current as { checks?: Array<{ name: string; score_impact: number }> });
      if (checkDeltas) status.checkDeltas = checkDeltas;
    }

    return status;
  });
}
