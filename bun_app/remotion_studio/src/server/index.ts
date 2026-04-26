import { Hono } from "hono";
import { cors } from "hono/cors";
import { createJob, listJobs, getJob, sseStream } from "./middleware/job-queue";
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
import type { ApiResponse, Job } from "../shared/types";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const app = new Hono();

app.use("/*", cors());

// ── Health ──

app.get("/api/health", (c) =>
  c.json({ ok: true, data: { status: "ok", timestamp: new Date().toISOString() } }),
);

// ── Jobs ──

app.get("/api/jobs", (c) => {
  const jobs = listJobs();
  return c.json<ApiResponse<Job[]>>({ ok: true, data: jobs });
});

app.get("/api/jobs/:id", (c) => {
  const job = getJob(c.req.param("id"));
  if (!job) return c.json<ApiResponse>({ ok: false, error: "Not found" }, 404);
  return c.json<ApiResponse<Job>>({ ok: true, data: job });
});

app.get("/api/jobs/:id/stream", (c) => sseStream(c.req.param("id")));

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

// ── Serve built client (production) ──

const clientDir = resolve(import.meta.dir, "../../dist/client");
if (existsSync(clientDir)) {
  app.get("/*", async (c) => {
    const path = c.req.path === "/" ? "/index.html" : c.req.path;
    const file = Bun.file(resolve(clientDir, path.slice(1)));
    if (await file.exists()) return new Response(file);
    // SPA fallback
    return new Response(Bun.file(resolve(clientDir, "index.html")));
  });
}

// ── Start server ──

if (import.meta.main) {
  const port = Number(process.env.PORT) || 5173;
  Bun.serve({ fetch: app.fetch, port });
  console.log(`[remotion_studio] API server running on http://localhost:${port}`);
}

export { app };
