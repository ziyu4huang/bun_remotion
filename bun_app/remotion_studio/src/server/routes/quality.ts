import { Hono } from "hono";
import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { getCrossSeriesComparison, getRegressionAlerts, getScoreHistory } from "../services/quality-comparison";
import type { ApiResponse } from "../../shared/types";

const router = new Hono();

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");

// ── Cross-series comparison ──

router.get("/compare", (c) => {
  const comparison = getCrossSeriesComparison();
  return c.json<ApiResponse>({ ok: true, data: comparison });
});

// ── Regression alerts ──

router.get("/regression", (c) => {
  const threshold = Number(c.req.query("threshold")) || 10;
  const alerts = getRegressionAlerts(threshold);
  return c.json<ApiResponse>({ ok: true, data: alerts });
});

// ── Score history ──

router.get("/history/:seriesId", (c) => {
  const seriesId = c.req.param("seriesId");
  const history = getScoreHistory(seriesId);
  return c.json<ApiResponse>({ ok: true, data: history });
});

// ── Per-series quality (existing) ──

router.get("/:seriesId", (c) => {
  const seriesId = c.req.param("seriesId");
  const outDir = resolve(REPO_ROOT, "bun_remotion_proj", seriesId, "storygraph_out");

  const gatePath = resolve(outDir, "gate.json");
  const scorePath = resolve(outDir, "kg-quality-score.json");

  const result: Record<string, unknown> = { seriesId };

  if (existsSync(gatePath)) {
    try {
      result.gate = JSON.parse(readFileSync(gatePath, "utf-8"));
    } catch { /* ignore */ }
  }

  if (existsSync(scorePath)) {
    try {
      result.qualityScore = JSON.parse(readFileSync(scorePath, "utf-8"));
    } catch { /* ignore */ }
  }

  if (!result.gate && !result.qualityScore) {
    return c.json<ApiResponse>({ ok: false, error: "No pipeline data found" }, 404);
  }

  return c.json<ApiResponse>({ ok: true, data: result });
});

export const qualityRoutes = router;
