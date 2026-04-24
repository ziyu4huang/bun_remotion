import { Hono } from "hono";
import {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  listScheduleLog,
  startScheduler,
  stopScheduler,
  isSchedulerRunning,
  evaluateSchedules,
} from "../services/scheduler-service";
import type { ApiResponse } from "../../shared/types";

const router = new Hono();

// GET / — List schedules
router.get("/", (c) => {
  return c.json<ApiResponse>({ ok: true, data: listSchedules() });
});

// POST / — Create a schedule
router.post("/", async (c) => {
  const body = await c.req.json<{
    label?: string;
    seriesId?: string;
    templateId?: string;
    options?: Record<string, unknown>;
    intervalMs?: number;
    enabled?: boolean;
  }>();

  try {
    const schedule = createSchedule({
      label: body.label ?? "",
      seriesId: body.seriesId ?? "",
      templateId: body.templateId ?? "",
      options: body.options,
      intervalMs: body.intervalMs ?? 0,
      enabled: body.enabled,
    });
    return c.json<ApiResponse>({ ok: true, data: schedule }, 201);
  } catch (err) {
    return c.json<ApiResponse>({ ok: false, error: err instanceof Error ? err.message : String(err) }, 400);
  }
});

// ── Specific routes (must come before /:id) ──

// POST /evaluate — Manually trigger schedule evaluation
router.post("/evaluate", (c) => {
  const results = evaluateSchedules();
  return c.json<ApiResponse>({ ok: true, data: results });
});

// GET /log — List schedule execution log
router.get("/log", (c) => {
  return c.json<ApiResponse>({ ok: true, data: listScheduleLog() });
});

// POST /start — Start the scheduler tick loop
router.post("/start", (c) => {
  startScheduler();
  return c.json<ApiResponse>({ ok: true, data: { running: true } });
});

// POST /stop — Stop the scheduler tick loop
router.post("/stop", (c) => {
  stopScheduler();
  return c.json<ApiResponse>({ ok: true, data: { running: false } });
});

// GET /status — Check if scheduler is running
router.get("/status", (c) => {
  return c.json<ApiResponse>({ ok: true, data: { running: isSchedulerRunning() } });
});

// ── Parameterized routes ──

// GET /:id — Get a specific schedule
router.get("/:id", (c) => {
  const schedule = getSchedule(c.req.param("id"));
  if (!schedule) return c.json<ApiResponse>({ ok: false, error: "Not found" }, 404);
  return c.json<ApiResponse>({ ok: true, data: schedule });
});

// PUT /:id — Update a schedule
router.put("/:id", async (c) => {
  const body = await c.req.json<{
    label?: string;
    enabled?: boolean;
    intervalMs?: number;
    templateId?: string;
    options?: Record<string, unknown>;
  }>();

  try {
    const schedule = updateSchedule(c.req.param("id"), body);
    return c.json<ApiResponse>({ ok: true, data: schedule });
  } catch (err) {
    return c.json<ApiResponse>({ ok: false, error: err instanceof Error ? err.message : String(err) }, 400);
  }
});

// DELETE /:id — Delete a schedule
router.delete("/:id", (c) => {
  const deleted = deleteSchedule(c.req.param("id"));
  if (!deleted) return c.json<ApiResponse>({ ok: false, error: "Not found" }, 404);
  return c.json<ApiResponse>({ ok: true, data: { deleted: true } });
});

export const scheduleRoutes = router;
