import { Hono } from "hono";
import { resolve } from "node:path";
import { existsSync, readFileSync, readdirSync, copyFileSync, statSync } from "node:fs";
import { runPipeline, runCheck, runScore } from "../../../../storygraph/src/pipeline-api";
import { createJob } from "../middleware/job-queue";
import { runAgentTask } from "../agent-bridge.js";
import type { ApiResponse, Job, BenchmarkResult, BaselineInfo } from "../../shared/types";

const router = new Hono();

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

function readJsonSafe<T>(filePath: string): T | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

// ── GET /baselines ──

router.get("/baselines", (c) => {
  const dirs = readdirSync(PROJ_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "shared" && d.name !== "shared-fixture");

  const baselines: BaselineInfo[] = [];

  for (const dir of dirs) {
    const seriesId = dir.name;
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

    baselines.push(info);
  }

  return c.json<ApiResponse<BaselineInfo[]>>({ ok: true, data: baselines });
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

  // ── Agent-backed mode: delegate to sg-benchmark-runner ──
  if (body.agent) {
    const job = createJob("benchmark-agent", async (progress) => {
      progress(5, "Starting agent benchmark...");
      let lastPct = 5;

      const agentResult = await runAgentTask(
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

      // Agent tools wrote artifacts to disk — read them for structured result
      const outDir = resolve(seriesDir, "storygraph_out");
      const gatePath = resolve(outDir, "gate.json");
      const baselinePath = resolve(outDir, "baseline-gate.json");

      const gate = readJsonSafe<{ score?: number; decision?: string; checks?: Array<{ name: string; score_impact: number }> }>(gatePath);
      const baseline = readJsonSafe<{ score?: number; checks?: Array<{ name: string; score_impact: number }> }>(baselinePath);

      let regressionStatus: BenchmarkResult["regressionStatus"] = "NO_BASELINE";
      let baselineScore: number | null = null;
      let scoreDelta: number | null = null;
      let checkDeltas: string[] | undefined;

      if (gate?.score != null) {
        if (existsSync(baselinePath) && baseline?.score != null) {
          baselineScore = baseline.score;
          scoreDelta = gate.score - baselineScore;
          regressionStatus = Math.abs(scoreDelta) > threshold ? "REGRESSION" : "OK";

          const baselineChecks = new Map((baseline.checks ?? []).map((ch) => [ch.name, ch.score_impact]));
          checkDeltas = [];
          for (const cur of (gate.checks ?? [])) {
            const prev = baselineChecks.get(cur.name);
            if (prev != null && cur.score_impact !== prev) {
              const d = cur.score_impact - prev;
              checkDeltas.push(`${cur.name}: ${prev} → ${cur.score_impact} (${d > 0 ? "+" : ""}${d})`);
            }
          }
          if (checkDeltas.length === 0) checkDeltas = undefined;
        } else {
          regressionStatus = "NO_BASELINE";
        }
      } else {
        regressionStatus = "NO_GATE";
      }

      // Try blended score
      let blendedScore: number | null = null;
      let blendedDecision: string | null = null;
      try {
        const scoreResult = await runScore(seriesDir, { mode });
        blendedScore = scoreResult.blended.overall;
        blendedDecision = scoreResult.blended.decision;
      } catch { /* optional */ }

      progress(100, "Done");

      const result: BenchmarkResult = {
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
      };

      return result;
    });

    return c.json<ApiResponse<Job>>({ ok: true, data: job }, 201);
  }

  // ── Direct mode: existing pipeline-api calls ──

  const job = createJob("benchmark", async (progress) => {
    // Step 1: Pipeline
    progress(5, "Running pipeline");
    const pipelineResult = await runPipeline(seriesDir, { mode });
    if (!pipelineResult.success) {
      progress(100, "Pipeline failed");
      return { seriesId: body.seriesId, pipelineOk: false, error: pipelineResult.errors.join("; ") };
    }
    progress(30, "Pipeline complete");

    // Step 2: Quality check
    progress(35, "Running quality check");
    const checkResult = await runCheck(seriesDir, { mode });
    progress(60, "Check complete");

    // Step 3: Regression
    progress(65, "Checking regression");
    const outDir = resolve(seriesDir, "storygraph_out");
    const baselinePath = resolve(outDir, "baseline-gate.json");
    let regressionStatus: BenchmarkResult["regressionStatus"] = "NO_BASELINE";
    let baselineScore: number | null = null;
    let scoreDelta: number | null = null;
    let checkDeltas: string[] | undefined;

    if (existsSync(baselinePath)) {
      const baseline = readJsonSafe<{ score?: number; checks?: Array<{ name: string; score_impact: number }> }>(baselinePath);
      baselineScore = baseline?.score ?? null;

      if (checkResult.success) {
        scoreDelta = checkResult.gateScore - (baselineScore ?? 0);
        regressionStatus = Math.abs(scoreDelta) > threshold ? "REGRESSION" : "OK";

        const baselineChecks = new Map((baseline?.checks ?? []).map((ch) => [ch.name, ch.score_impact]));
        checkDeltas = [];
        for (const cur of checkResult.checks) {
          const prev = baselineChecks.get(cur.name);
          if (prev != null && cur.score_impact !== prev) {
            const d = cur.score_impact - prev;
            checkDeltas.push(`${cur.name}: ${prev} → ${cur.score_impact} (${d > 0 ? "+" : ""}${d})`);
          }
        }
        if (checkDeltas.length === 0) checkDeltas = undefined;
      }
    } else if (!checkResult.success) {
      regressionStatus = "NO_GATE";
    } else {
      regressionStatus = "NO_BASELINE";
    }
    progress(75, "Regression checked");

    // Step 4: Quality score
    progress(80, "Running quality score");
    let blendedScore: number | null = null;
    let blendedDecision: string | null = null;
    try {
      const scoreResult = await runScore(seriesDir, { mode });
      blendedScore = scoreResult.blended.overall;
      blendedDecision = scoreResult.blended.decision;
    } catch {
      // Score is optional
    }
    progress(95, "Benchmark complete");

    const result: BenchmarkResult = {
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
    };

    progress(100, "Done");
    return result;
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

  const job = createJob("benchmark-check", async (progress) => {
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
    const outDir = resolve(seriesDir, "storygraph_out");
    const baselinePath = resolve(outDir, "baseline-gate.json");
    const currentGatePath = resolve(outDir, "gate.json");
    const threshold = b.threshold ?? 10;

    if (!existsSync(baselinePath)) {
      return c.json<ApiResponse<BenchmarkResult>>({
        ok: true,
        data: {
          seriesId: b.seriesId,
          pipelineOk: true,
          gateScore: 0,
          gateDecision: "UNKNOWN",
          blendedScore: null,
          blendedDecision: null,
          regressionStatus: "NO_BASELINE",
          baselineScore: null,
          scoreDelta: null,
        },
      });
    }

    const baseline = readJsonSafe<{ score?: number; checks?: Array<{ name: string; score_impact: number }> }>(baselinePath);
    const current = readJsonSafe<{ score?: number; decision?: string; checks?: Array<{ name: string; score_impact: number }> }>(currentGatePath);

    if (!current?.score) {
      return c.json<ApiResponse<BenchmarkResult>>({
        ok: true,
        data: {
          seriesId: b.seriesId,
          pipelineOk: false,
          gateScore: 0,
          gateDecision: "UNKNOWN",
          blendedScore: null,
          blendedDecision: null,
          regressionStatus: "NO_GATE",
          baselineScore: baseline?.score ?? null,
          scoreDelta: null,
        },
      });
    }

    const scoreDelta = current.score - (baseline?.score ?? 0);
    const regressed = Math.abs(scoreDelta) > threshold;

    const baselineChecks = new Map((baseline?.checks ?? []).map((ch) => [ch.name, ch.score_impact]));
    const checkDeltas: string[] = [];
    for (const cur of (current?.checks ?? [])) {
      const prev = baselineChecks.get(cur.name);
      if (prev != null && cur.score_impact !== prev) {
        const d = cur.score_impact - prev;
        checkDeltas.push(`${cur.name}: ${prev} → ${cur.score_impact} (${d > 0 ? "+" : ""}${d})`);
      }
    }

    return c.json<ApiResponse<BenchmarkResult>>({
      ok: true,
      data: {
        seriesId: b.seriesId,
        pipelineOk: true,
        gateScore: current.score,
        gateDecision: current.decision ?? "UNKNOWN",
        blendedScore: null,
        blendedDecision: null,
        regressionStatus: regressed ? "REGRESSION" : "OK",
        baselineScore: baseline?.score ?? null,
        scoreDelta,
        checkDeltas: checkDeltas.length > 0 ? checkDeltas : undefined,
      },
    });
  });
});

// ── POST /baseline/:seriesId ── Update baseline

router.post("/baseline/:seriesId", (c) => {
  const seriesId = c.req.param("seriesId");
  const outDir = resolve(PROJ_DIR, seriesId, "storygraph_out");
  const currentGatePath = resolve(outDir, "gate.json");
  const baselinePath = resolve(outDir, "baseline-gate.json");

  if (!existsSync(currentGatePath)) {
    return c.json<ApiResponse>({ ok: false, error: "No gate.json found — run pipeline first" }, 404);
  }

  const gate = readJsonSafe<{ score?: number; decision?: string; timestamp?: string }>(currentGatePath);
  copyFileSync(currentGatePath, baselinePath);

  const info: BaselineInfo = {
    seriesId,
    hasBaseline: true,
    baselineScore: gate?.score ?? null,
    baselineDate: gate?.timestamp ?? new Date().toISOString(),
    currentScore: gate?.score ?? null,
    delta: 0,
  };

  return c.json<ApiResponse<BaselineInfo>>({ ok: true, data: info });
});

export const benchmarkRoutes = router;
