import { Hono } from "hono";
import {
  listPlans,
  readPlan,
  readPlanRaw,
  writePlanRaw,
  readEpisodePlan,
  writeEpisodePlan,
  listRevisions,
  readRevision,
} from "../services/plan-editor";
import type { ApiResponse } from "../../shared/types";

const router = new Hono();

// List all series with PLAN.md
router.get("/", async (c) => {
  const plans = listPlans();
  return c.json<ApiResponse<typeof plans>>({ ok: true, data: plans });
});

// Read parsed PLAN.md (structured JSON)
router.get("/:seriesId", async (c) => {
  const result = await readPlan(c.req.param("seriesId"));
  if (!result) return c.json<ApiResponse>({ ok: false, error: "PLAN.md not found" }, 404);
  return c.json<ApiResponse<typeof result>>({ ok: true, data: result });
});

// Read raw PLAN.md markdown
router.get("/:seriesId/raw", async (c) => {
  const raw = readPlanRaw(c.req.param("seriesId"));
  if (raw === null) return c.json<ApiResponse>({ ok: false, error: "PLAN.md not found" }, 404);
  return c.json<ApiResponse<string>>({ ok: true, data: raw });
});

// List revisions
router.get("/:seriesId/revisions", async (c) => {
  const revs = listRevisions(c.req.param("seriesId"));
  return c.json<ApiResponse<typeof revs>>({ ok: true, data: revs });
});

// Read a specific revision
router.get("/:seriesId/revisions/:revId", async (c) => {
  const content = readRevision(c.req.param("seriesId"), c.req.param("revId"));
  if (content === null) return c.json<ApiResponse>({ ok: false, error: "Revision not found" }, 404);
  return c.json<ApiResponse<string>>({ ok: true, data: content });
});

// Write raw PLAN.md markdown
router.put("/:seriesId/raw", async (c) => {
  const body = await c.req.json<{ content: string }>();
  if (!body.content) return c.json<ApiResponse>({ ok: false, error: "content is required" }, 400);
  const result = writePlanRaw(c.req.param("seriesId"), body.content);
  if (!result.ok) return c.json<ApiResponse>({ ok: false, error: result.error }, 404);
  return c.json<ApiResponse<{ saved: boolean }>>({ ok: true, data: { saved: true } });
});

// Read episode-level PLAN.md
router.get("/:seriesId/episodes/*", async (c) => {
  const seriesId = c.req.param("seriesId");
  const episodeDir = c.req.path.replace(`/api/plans/${seriesId}/episodes/`, "");
  const raw = readEpisodePlan(seriesId, episodeDir);
  if (raw === null) return c.json<ApiResponse>({ ok: false, error: "Episode PLAN.md not found" }, 404);
  return c.json<ApiResponse<string>>({ ok: true, data: raw });
});

// Write episode-level PLAN.md
router.put("/:seriesId/episodes/*", async (c) => {
  const seriesId = c.req.param("seriesId");
  const episodeDir = c.req.path.replace(`/api/plans/${seriesId}/episodes/`, "");
  const body = await c.req.json<{ content: string }>();
  if (!body.content) return c.json<ApiResponse>({ ok: false, error: "content is required" }, 400);
  const result = writeEpisodePlan(seriesId, episodeDir, body.content);
  if (!result.ok) return c.json<ApiResponse>({ ok: false, error: result.error }, 404);
  return c.json<ApiResponse<{ saved: boolean }>>({ ok: true, data: { saved: true } });
});

export const planRoutes = router;
