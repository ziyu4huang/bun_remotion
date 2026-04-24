import { Hono } from "hono";
import { getMonitoringOverview, getSeriesHealthDetail } from "../services/monitoring";
import type { ApiResponse } from "../../shared/types";

const router = new Hono();

router.get("/overview", (c) => {
  const overview = getMonitoringOverview();
  return c.json<ApiResponse>({ ok: true, data: overview });
});

router.get("/series/:seriesId", (c) => {
  const health = getSeriesHealthDetail(c.req.param("seriesId"));
  if (!health) return c.json<ApiResponse>({ ok: false, error: "Series not found" }, 404);
  return c.json<ApiResponse>({ ok: true, data: health });
});

export const monitoringRoutes = router;
