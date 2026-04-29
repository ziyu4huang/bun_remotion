import { Hono } from "hono";
import { cors } from "hono/cors";
import { createJob, listJobs, getJob, sseStream, cancelJob, deleteJob, markInterruptedJobs, listJobHistory } from "./middleware/job-queue";
import { requestTimeout } from "./middleware/request-timeout";
import { projectRoutes } from "./routes/projects";
import { scaffoldRoutes } from "./routes/scaffold";
import { pipelineRoutes } from "./routes/pipeline";
import { qualityRoutes } from "./routes/quality";
import { assetsRoutes } from "./routes/assets";
import { ttsRoutes } from "./routes/tts";
import { renderRoutes } from "./routes/render";
import { workflowRoutes } from "./routes/workflows";
import { automationRoutes } from "./routes/automation";
import { monitoringRoutes } from "./routes/monitoring";
import { webhookRoutes } from "./routes/webhooks";
import { scheduleRoutes } from "./routes/schedules";
import { exportImportRoutes } from "./routes/export-import";
import { planRoutes } from "./routes/plans";
import { imageRoutes } from "./routes/image";
import { benchmarkRoutes } from "./routes/benchmark";
import { agentRoutes } from "./routes/agent";
import { episodeProgressRoutes } from "./routes/episode-progress";
import { batchRoutes } from "./routes/batch";
import type { ApiResponse, Job } from "../shared/types";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const app = new Hono();

app.use("/*", cors());
app.use("/api/*", requestTimeout());

// Global error handler — prevents unhandled errors from crashing the process
app.onError((err, c) => {
  console.error(`[remotion_studio] Request error:`, err);
  return c.json({ ok: false, error: err.message }, 500);
});

// ── Health ──

app.get("/api/health", (c) =>
  c.json({ ok: true, data: { status: "ok", timestamp: new Date().toISOString() } }),
);

// ── Jobs ──

app.get("/api/jobs", (c) => {
  const status = c.req.query("status");
  const jobs = listJobs(status);
  return c.json<ApiResponse<Job[]>>({ ok: true, data: jobs });
});

app.get("/api/jobs/history", (c) => {
  const olderThanParam = c.req.query("olderThan");
  const olderThanMs = olderThanParam ? parseOlderThan(olderThanParam) : undefined;
  const history = listJobHistory(olderThanMs);
  return c.json<ApiResponse<Job[]>>({ ok: true, data: history });
});

app.post("/api/jobs/:id/cancel", (c) => {
  const job = cancelJob(c.req.param("id"));
  if (!job) return c.json<ApiResponse>({ ok: false, error: "Job not found or not cancellable" }, 400);
  return c.json<ApiResponse<Job>>({ ok: true, data: job });
});

app.delete("/api/jobs/:id", (c) => {
  const ok = deleteJob(c.req.param("id"));
  if (!ok) return c.json<ApiResponse>({ ok: false, error: "Job not found" }, 404);
  return c.json<ApiResponse<{ deleted: boolean }>>({ ok: true, data: { deleted: true } });
});

app.get("/api/jobs/:id", (c) => {
  const job = getJob(c.req.param("id"));
  if (!job) return c.json<ApiResponse>({ ok: false, error: "Not found" }, 404);
  return c.json<ApiResponse<Job>>({ ok: true, data: job });
});

app.get("/api/jobs/:id/stream", (c) => sseStream(c.req.param("id")));

function parseOlderThan(val: string): number {
  const num = parseInt(val, 10);
  if (val.endsWith("h")) return num * 60 * 60 * 1000;
  if (val.endsWith("d")) return num * 24 * 60 * 60 * 1000;
  return num; // treat as ms
}

// ── Demo job (remove after Phase 36) ──

app.post("/api/jobs/demo", async (c) => {
  const job = createJob("demo", async (progress) => {
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 200));
      progress(i, `Step ${i / 10}/10`);
    }
    return { message: "Demo complete" };
  });
  return c.json<ApiResponse<Job>>({ ok: true, data: job }, 201);
});

// ── Route groups ──

app.route("/api/projects", projectRoutes);
app.route("/api/scaffold", scaffoldRoutes);
app.route("/api/pipeline", pipelineRoutes);
app.route("/api/quality", qualityRoutes);
app.route("/api/assets", assetsRoutes);
app.route("/api/tts", ttsRoutes);
app.route("/api/render", renderRoutes);
app.route("/api/workflows", workflowRoutes);
app.route("/api/automation", automationRoutes);
app.route("/api/monitoring", monitoringRoutes);
app.route("/api/webhooks", webhookRoutes);
app.route("/api/schedules", scheduleRoutes);
app.route("/api/export", exportImportRoutes);
app.route("/api/plans", planRoutes);
app.route("/api/image", imageRoutes);
app.route("/api/benchmark", benchmarkRoutes);
app.route("/api/agent", agentRoutes);
app.route("/api/episode-progress", episodeProgressRoutes);
app.route("/api/batch", batchRoutes);

// ── Serve built client (production) ──

const MIME_MAP: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

function getMimeType(ext: string): string {
  return MIME_MAP[ext] || "application/octet-stream";
}

const clientDir = resolve(import.meta.dir, "../../dist/client");
if (existsSync(clientDir)) {
  app.get("/*", async (c) => {
    const path = c.req.path === "/" ? "/index.html" : c.req.path;
    const filePath = resolve(clientDir, path.slice(1));
    const file = Bun.file(filePath);
    if (await file.exists()) {
      const ext = filePath.slice(filePath.lastIndexOf("."));
      return new Response(file, { headers: { "Content-Type": getMimeType(ext) } });
    }
    // SPA fallback
    const indexFile = Bun.file(resolve(clientDir, "index.html"));
    return new Response(indexFile, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  });
}

// ── Start server ──

if (import.meta.main) {
  const port = Number(process.env.PORT) || 5173;

  // Restart recovery: mark interrupted jobs as failed
  const interrupted = markInterruptedJobs();
  if (interrupted > 0) {
    console.log(`[remotion_studio] Marked ${interrupted} interrupted job(s) as failed`);
  }

  const server = Bun.serve({ fetch: app.fetch, port });
  console.log(`[remotion_studio] API server running on http://localhost:${port}`);

  process.on("unhandledRejection", (reason) => {
    console.error("[remotion_studio] Unhandled rejection:", reason);
  });

  process.on("uncaughtException", (err) => {
    console.error("[remotion_studio] Uncaught exception:", err);
  });

  const shutdown = (signal: string) => {
    console.log(`[remotion_studio] Received ${signal}, shutting down...`);
    server.stop(true);
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

export { app };
