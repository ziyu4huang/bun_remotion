import { Hono } from "hono";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { runPipeline, runCheck, runScore } from "storygraph/pipeline-api";
import { jobService } from "../middleware/job-service";
import { bridge } from "../agent-bridge";
import {
  PROJ_DIR,
  readJsonSafe,
  computeCheckDeltas,
  readRegressionForSeries,
  listBaselines,
  updateBaseline,
  listRegressionStatuses,
} from "../services/benchmark";
import type { ApiResponse, Job, BenchmarkResult } from "../../shared/types";

const router = new Hono();

// ── GET /baselines ──

router.get("/baselines", (c) => {
  return c.json<ApiResponse<BenchmarkResult[]>>({ ok: true, data: listBaselines() });
});

// ── POST /run ── Full benchmark: pipeline → check → regression → score

router.post("/run", async (c) => {
  const body = await c.req.json<{ seriesId: string; mode?: "regex" | "ai" | "hybrid"; threshold?: number; agent?: boolean }>();

  if (!body.seriesId) {
    return c.json<ApiResponse>({ ok: false, error: "seriesId is required" }, 400);
  }

  const seriesDir = resolve(PROJ_DIR, body.seriesId);
  const mode = body.mode ?? "hybrid";
  const threshold = body.threshold ?? 10;

  // ── Agent-backed mode ──
  if (body.agent) {
    const job = jobService.create("benchmark-agent", async (progress) => {
      progress(5, "Starting agent benchmark...");
      let lastPct = 5;

      const agentResult = await bridge.runTask(
        "sg-benchmark-runner",
        `Run full benchmark on series "${body.seriesId}" with mode "${mode}" and threshold ${threshold}. Follow the complete benchmark workflow: pipeline → check → regression → score → report.`,
        {
          onEvent(event) {
            if (event.type === "turn_end") {
              lastPct = Math.min(80, lastPct + 15);
              progress(lastPct, "Agent working...");
            } else if (event.type === "tool_start") {
              progress(lastPct, `Agent tool: ${event.toolName}`);
            }
          },
        },
      );

      progress(85, "Reading artifacts...");
      const outDir = resolve(seriesDir, "storygraph_out");
      const gate = readJsonSafe<{ score?: number; decision?: string }>(resolve(outDir, "gate.json"));
      const { regressionStatus, baselineScore, scoreDelta, checkDeltas } = readRegressionForSeries(seriesDir, threshold);

      let blendedScore: number | null = null;
      let blendedDecision: string | null = null;
      try {
        const scoreResult = await runScore(seriesDir, { mode });
        blendedScore = scoreResult.blended.overall;
        blendedDecision = scoreResult.blended.decision;
      } catch { /* optional */ }

      progress(100, "Done");
      return {
        seriesId: body.seriesId,
        pipelineOk: agentResult.toolCalls.every((tc) => !tc.isError),
        gateScore: gate?.score ?? 0,
        gateDecision: gate?.decision ?? "UNKNOWN",
        blendedScore,
        blendedDecision,
        regressionStatus,
        baselineScore,
        scoreDelta,
        checkDeltas,
        agentReport: agentResult.response,
      } satisfies BenchmarkResult;
    });

    return c.json<ApiResponse<Job>>({ ok: true, data: job }, 201);
  }

  // ── Direct mode ──
  const job = jobService.create("benchmark", async (progress) => {
    progress(5, "Running pipeline");
    const pipelineResult = await runPipeline(seriesDir, { mode });
    if (!pipelineResult.success) {
      progress(100, "Pipeline failed");
      return { seriesId: body.seriesId, pipelineOk: false, error: pipelineResult.errors.join("; ") };
    }
    progress(30, "Pipeline complete");

    progress(35, "Running quality check");
    const checkResult = await runCheck(seriesDir, { mode });
    progress(60, "Check complete");

    progress(65, "Checking regression");
    const { regressionStatus, baselineScore, scoreDelta, checkDeltas } = readRegressionForSeries(seriesDir, threshold);
    progress(75, "Regression checked");

    progress(80, "Running quality score");
    let blendedScore: number | null = null;
    let blendedDecision: string | null = null;
    try {
      const scoreResult = await runScore(seriesDir, { mode });
      blendedScore = scoreResult.blended.overall;
      blendedDecision = scoreResult.blended.decision;
    } catch { /* optional */ }
    progress(95, "Benchmark complete");

    progress(100, "Done");
    return {
      seriesId: body.seriesId,
      pipelineOk: pipelineResult.success,
      gateScore: checkResult.gateScore,
      gateDecision: checkResult.gateDecision,
      blendedScore,
      blendedDecision,
      regressionStatus,
      baselineScore,
      scoreDelta,
      checkDeltas,
    } satisfies BenchmarkResult;
  });

  return c.json<ApiResponse<Job>>({ ok: true, data: job }, 201);
});

// ── POST /check ── Quality check only (job)

router.post("/check", async (c) => {
  const body = await c.req.json<{ seriesId: string; mode?: "regex" | "ai" | "hybrid" }>();

  if (!body.seriesId) {
    return c.json<ApiResponse>({ ok: false, error: "seriesId is required" }, 400);
  }

  const seriesDir = resolve(PROJ_DIR, body.seriesId);
  const mode = body.mode ?? "hybrid";

  const job = jobService.create("benchmark-check", async (progress) => {
    progress(10, "Running quality check");
    const result = await runCheck(seriesDir, { mode });
    progress(90, "Check complete");
    return result;
  });

  return c.json<ApiResponse<Job>>({ ok: true, data: job }, 201);
});

// ── POST /regression ── Sync regression check

router.post("/regression", (c) => {
  const body = c.req.json<{ seriesId: string; threshold?: number }>() as Promise<{ seriesId: string; threshold?: number }>;

  return body.then((b) => {
    if (!b.seriesId) {
      return c.json<ApiResponse>({ ok: false, error: "seriesId is required" }, 400);
    }

    const seriesDir = resolve(PROJ_DIR, b.seriesId);
    const threshold = b.threshold ?? 10;
    const { regressionStatus, baselineScore, scoreDelta, checkDeltas } = readRegressionForSeries(seriesDir, threshold);

    return c.json<ApiResponse<BenchmarkResult>>({
      ok: true,
      data: {
        seriesId: b.seriesId,
        pipelineOk: true,
        gateScore: 0,
        gateDecision: "UNKNOWN",
        blendedScore: null,
        blendedDecision: null,
        regressionStatus,
        baselineScore,
        scoreDelta,
        checkDeltas,
      },
    });
  });
});

// ── POST /baseline/:seriesId ── Update baseline

router.post("/baseline/:seriesId", (c) => {
  const seriesId = c.req.param("seriesId");
  try {
    const info = updateBaseline(seriesId);
    return c.json<ApiResponse<typeof info>>({ ok: true, data: info });
  } catch (e: any) {
    return c.json<ApiResponse>({ ok: false, error: e.message }, 404);
  }
});

// ── GET /regression-status ── Aggregate regression across all series

router.get("/regression-status", (c) => {
  const threshold = Number(c.req.query("threshold")) || 10;
  return c.json<ApiResponse>({ ok: true, data: listRegressionStatuses(threshold) });
});

export const benchmarkRoutes = router;
