import { Router } from "./router.js";
import { handleHealth } from "./routes/health.js";
import { handleChat } from "./routes/chat.js";
import {
  handlePing,
  handleAgentsList,
  handleAgentRead,
  handleRunCreate,
  handleRunRead,
  handleRunCancel,
  handleRunEvents,
} from "./routes/acp.js";

export function createRouter(): Router {
  const router = new Router();

  // Legacy endpoints
  router.get("/health", () => handleHealth());
  router.post("/chat", (req) => handleChat(req));

  // ACP endpoints
  router.get("/ping", () => handlePing());
  router.get("/agents", () => handleAgentsList());
  router.get("/agents/:name", (_req, ctx) => handleAgentRead(ctx.params.name));
  router.post("/runs", (req) => handleRunCreate(req));
  router.get("/runs/:id", (_req, ctx) => handleRunRead(ctx.params.id));
  router.post("/runs/:id", () =>
    Response.json({ error: "Not implemented" }, { status: 501 }),
  );
  router.post("/runs/:id/cancel", (_req, ctx) =>
    handleRunCancel(ctx.params.id),
  );
  router.get("/runs/:id/events", (_req, ctx) =>
    handleRunEvents(ctx.params.id),
  );

  return router;
}
