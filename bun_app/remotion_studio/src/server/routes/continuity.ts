import { Hono } from "hono";
import { runContinuityCheck } from "../services/continuity-check.js";

export const continuityRoutes = new Hono();

continuityRoutes.get("/:seriesId", (c) => {
  const seriesId = c.req.param("seriesId");
  const report = runContinuityCheck(seriesId);
  return c.json({ ok: true, data: report });
});
