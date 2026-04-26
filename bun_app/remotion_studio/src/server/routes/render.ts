import { Hono } from "hono";
import { resolve, normalize } from "node:path";
import { existsSync } from "node:fs";
import { getRenderStatus, renderVideo } from "../services/remotion-renderer";
import { createJob } from "../middleware/job-queue";
import type { ApiResponse, Job, RenderStatus } from "../../shared/types";

const router = new Hono();

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

router.get("/status", (c) => {
  const episodeId = c.req.query("episodeId") ?? "";
  const status = getRenderStatus(episodeId);
  return c.json<ApiResponse<RenderStatus>>({ ok: true, data: status });
});

router.post("/trigger", async (c) => {
  const body = await c.req.json<{ episodeId: string }>();

  if (!body.episodeId) {
    return c.json<ApiResponse>({ ok: false, error: "episodeId is required" }, 400);
  }

  const job = createJob("render", async (progress) => {
    progress(5, "Starting render");
    const result = await renderVideo({
      episodeId: body.episodeId,
      onProgress: (msg) => progress(50, msg),
    });
    progress(100, "Render complete");
    return result;
  });

  return c.json<ApiResponse<Job>>({ ok: true, data: job }, 201);
});

router.get("/preview", async (c) => {
  const episodeId = c.req.query("episodeId") ?? "";
  const status = getRenderStatus(episodeId);

  if (!status.hasRender || !status.outputPath) {
    return c.json<ApiResponse>({ ok: false, error: "No render found" }, 404);
  }

  const normalized = normalize(status.outputPath);
  if (!normalized.startsWith(PROJ_DIR) && !normalized.startsWith(resolve(REPO_ROOT, "out"))) {
    return c.json<ApiResponse>({ ok: false, error: "Forbidden" }, 403);
  }

  if (!existsSync(normalized)) {
    return c.json<ApiResponse>({ ok: false, error: "File not found" }, 404);
  }

  const file = Bun.file(normalized);
  return new Response(file, {
    headers: { "Content-Type": "video/mp4", "Accept-Ranges": "bytes" },
  });
});

export const renderRoutes = router;
