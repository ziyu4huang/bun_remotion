import { Hono } from "hono";
import { configStore } from "../services/config-store.js";
import type { ApiResponse } from "../../shared/types.js";

const config = new Hono();

/** GET /api/config — full config (masked keys) */
config.get("/", (c) => {
  const cfg = configStore.get();
  return c.json<ApiResponse>({
    ok: true,
    data: {
      defaults: cfg.defaults,
      apiKeys: configStore.getMaskedApiKeys(),
    },
  });
});

/** POST /api/config/api-keys — set API keys */
config.post("/api-keys", async (c) => {
  const body = await c.req.json<{ glm?: string; deepseek?: string; google?: string }>();
  configStore.setApiKeys({
    glm: body.glm || undefined,
    deepseek: body.deepseek || undefined,
    google: body.google || undefined,
  });
  return c.json<ApiResponse>({
    ok: true,
    data: configStore.getMaskedApiKeys(),
  });
});

/** POST /api/config/default-model — set default model */
config.post("/default-model", async (c) => {
  const body = await c.req.json<{ model: string }>();
  if (!body.model) {
    return c.json<ApiResponse>({ ok: false, error: "model is required" }, 400);
  }
  configStore.setDefaultModel(body.model);
  return c.json<ApiResponse>({ ok: true, data: { model: body.model } });
});

export { config as configRoutes };
