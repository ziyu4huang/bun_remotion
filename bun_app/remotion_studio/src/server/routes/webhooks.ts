import { Hono } from "hono";
import {
  listSecrets,
  createSecret,
  deleteSecret,
  listDeliveries,
  triggerWebhook,
} from "../services/webhook-service";
import type { ApiResponse } from "../../shared/types";

const router = new Hono();

// GET / — List webhook secrets (secret values masked)
router.get("/", (c) => {
  const secrets = listSecrets().map((s) => ({
    id: s.id,
    label: s.label,
    secret: s.secret.slice(0, 8) + "...",
    createdAt: s.createdAt,
  }));
  return c.json<ApiResponse>({ ok: true, data: secrets });
});

// POST / — Create a new webhook secret
router.post("/", async (c) => {
  const body = await c.req.json<{ label?: string }>();
  if (!body.label?.trim()) {
    return c.json<ApiResponse>({ ok: false, error: "label is required" }, 400);
  }
  const secret = createSecret(body.label);
  return c.json<ApiResponse>({ ok: true, data: secret }, 201);
});

// DELETE /:id — Delete a webhook secret
router.delete("/:id", (c) => {
  const deleted = deleteSecret(c.req.param("id"));
  if (!deleted) return c.json<ApiResponse>({ ok: false, error: "Not found" }, 404);
  return c.json<ApiResponse>({ ok: true, data: { deleted: true } });
});

// POST /trigger — Trigger a workflow via webhook
router.post("/trigger", async (c) => {
  const body = await c.req.json<{
    webhookId?: string;
    signature?: string;
    seriesId?: string;
    templateId?: string;
    options?: Record<string, unknown>;
  }>();

  if (!body.webhookId || !body.signature || !body.seriesId || !body.templateId) {
    return c.json<ApiResponse>({
      ok: false,
      error: "webhookId, signature, seriesId, and templateId are required",
    }, 400);
  }

  const delivery = triggerWebhook({
    webhookId: body.webhookId,
    signature: body.signature,
    seriesId: body.seriesId,
    templateId: body.templateId,
    options: body.options,
  });

  if (delivery.status === "auth_failed") {
    return c.json<ApiResponse>({ ok: false, error: delivery.error }, 401);
  }
  if (delivery.status === "template_not_found") {
    return c.json<ApiResponse>({ ok: false, error: delivery.error }, 400);
  }
  if (delivery.status === "error") {
    return c.json<ApiResponse>({ ok: false, error: delivery.error }, 500);
  }

  return c.json<ApiResponse>({ ok: true, data: delivery }, 200);
});

// GET /deliveries — List recent webhook deliveries
router.get("/deliveries", (c) => {
  const deliveries = listDeliveries();
  return c.json<ApiResponse>({ ok: true, data: deliveries });
});

export const webhookRoutes = router;
