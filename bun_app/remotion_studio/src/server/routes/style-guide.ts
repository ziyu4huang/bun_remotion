import { Hono } from "hono";
import { getStyleGuide, saveStyleGuide, deleteStyleGuide } from "../services/style-guide";
import type { ApiResponse, StyleGuide } from "../../shared/types";

const router = new Hono();

router.get("/:seriesId", (c) => {
  const seriesId = c.req.param("seriesId");
  const guide = getStyleGuide(seriesId);
  return c.json<ApiResponse<StyleGuide | null>>({ ok: true, data: guide });
});

router.put("/:seriesId", async (c) => {
  const seriesId = c.req.param("seriesId");
  const body = await c.req.json<Partial<Omit<StyleGuide, "seriesId" | "updatedAt">>>();
  const guide = saveStyleGuide(seriesId, body);
  return c.json<ApiResponse<StyleGuide>>({ ok: true, data: guide });
});

router.delete("/:seriesId", (c) => {
  const seriesId = c.req.param("seriesId");
  const deleted = deleteStyleGuide(seriesId);
  if (!deleted) return c.json<ApiResponse>({ ok: false, error: "Style guide not found" }, 404);
  return c.json<ApiResponse<{ deleted: boolean }>>({ ok: true, data: { deleted: true } });
});

export const styleGuideRoutes = router;
