import { Hono } from "hono";
import { scaffold } from "../../../../episodeforge/src/scaffold";
import { createJob } from "../middleware/job-queue";
import { evaluateTrigger } from "../services/automation-rules";
import type { ApiResponse, Job } from "../../shared/types";
import type { ScaffoldOptions } from "../../../../episodeforge/src/scaffold";
import type { VideoCategoryId } from "remotion_types";

const router = new Hono();

interface ScaffoldBody {
  series: string;
  category?: VideoCategoryId;
  chapter?: number;
  episode?: number;
  scenes?: number;
  dryRun?: boolean;
}

router.post("/", async (c) => {
  const body = await c.req.json<ScaffoldBody>();

  if (!body.series) {
    return c.json<ApiResponse>({ ok: false, error: "series is required" }, 400);
  }

  const options: ScaffoldOptions = {
    series: body.series,
    category: body.category,
    chapter: body.chapter,
    episode: body.episode,
    scenes: body.scenes,
    dryRun: body.dryRun,
  };

  // Run scaffold as a background job
  const job = createJob("scaffold", async (progress) => {
    progress(10, "Validating options");
    progress(30, "Computing naming");
    const result = await scaffold(options);
    progress(90, "Files written");

    // Evaluate automation rules after scaffold
    try {
      evaluateTrigger({
        trigger: "scaffold_complete",
        seriesId: body.series,
      });
    } catch {
      // Don't fail the scaffold job if automation evaluation errors
    }

    return result;
  });

  return c.json<ApiResponse<Job>>({ ok: true, data: job }, 201);
});

export const scaffoldRoutes = router;
