import { Hono } from "hono";
import {
  listRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  listEvents,
  evaluateTrigger,
  type AutomationRule,
} from "../services/automation-rules";
import { startWatcher, stopWatcher } from "../services/file-watcher";
import type { ApiResponse } from "../../shared/types";

const router = new Hono();

// GET /rules — List all automation rules
router.get("/rules", (c) => {
  const rules = listRules();
  return c.json<ApiResponse<AutomationRule[]>>({ ok: true, data: rules });
});

// POST /rules — Create a new rule
router.post("/rules", async (c) => {
  const body = await c.req.json<{
    name?: string;
    enabled?: boolean;
    trigger?: string;
    triggerCondition?: { threshold?: number };
    action?: { type: string; templateId: string; options?: Record<string, unknown> };
    cooldownMs?: number;
  }>();

  try {
    const rule = createRule({
      name: body.name ?? "",
      enabled: body.enabled ?? true,
      trigger: body.trigger as AutomationRule["trigger"],
      triggerCondition: body.triggerCondition,
      action: {
        type: "run_workflow",
        templateId: body.action?.templateId ?? "",
        options: (body.action?.options ?? {}) as any,
      },
      cooldownMs: body.cooldownMs ?? 60_000,
    });
    return c.json<ApiResponse<AutomationRule>>({ ok: true, data: rule }, 201);
  } catch (err) {
    return c.json<ApiResponse>({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }, 400);
  }
});

// PUT /rules/:id — Update a rule (enable/disable, change config)
router.put("/rules/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<Partial<Pick<AutomationRule, "name" | "enabled" | "triggerCondition" | "cooldownMs" | "action">>>();

  try {
    const rule = updateRule(id, body);
    return c.json<ApiResponse<AutomationRule>>({ ok: true, data: rule });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes("not found") ? 404 : 400;
    return c.json<ApiResponse>({ ok: false, error: msg }, status);
  }
});

// DELETE /rules/:id — Delete a rule
router.delete("/rules/:id", (c) => {
  const id = c.req.param("id");
  const deleted = deleteRule(id);
  if (!deleted) return c.json<ApiResponse>({ ok: false, error: "Rule not found" }, 404);
  return c.json<ApiResponse>({ ok: true });
});

// GET /events — List recent automation events
router.get("/events", (c) => {
  const limit = Number(c.req.query("limit")) || 50;
  const evts = listEvents(limit);
  return c.json<ApiResponse>({ ok: true, data: evts });
});

// POST /watcher/start — Start file watcher
router.post("/watcher/start", (c) => {
  startWatcher();
  return c.json<ApiResponse>({ ok: true, data: { watching: true } });
});

// POST /watcher/stop — Stop file watcher
router.post("/watcher/stop", (c) => {
  stopWatcher();
  return c.json<ApiResponse>({ ok: true, data: { watching: false } });
});

export const automationRoutes = router;
