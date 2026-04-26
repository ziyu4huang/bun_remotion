import { Hono } from "hono";
import {
  exportProjectConfig,
  listExportableSeries,
  importProjectConfig,
} from "../services/export-import-service";
import type { ApiResponse, ProjectExport } from "../../shared/types";

const router = new Hono();

// ── List exportable series ──

router.get("/", (c) => {
  const series = listExportableSeries();
  return c.json<ApiResponse<typeof series>>({ ok: true, data: series });
});

// ── Export series config ──

router.get("/:seriesId", (c) => {
  const seriesId = c.req.param("seriesId");
  const config = exportProjectConfig(seriesId);
  if (!config) {
    return c.json<ApiResponse>({ ok: false, error: "Series not found" }, 404);
  }
  return c.json<ApiResponse<ProjectExport>>({ ok: true, data: config });
});

// ── Download as file ──

router.get("/:seriesId/download", (c) => {
  const seriesId = c.req.param("seriesId");
  const config = exportProjectConfig(seriesId);
  if (!config) {
    return c.json<ApiResponse>({ ok: false, error: "Series not found" }, 404);
  }
  const json = JSON.stringify(config, null, 2);
  return new Response(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${seriesId}-config.json"`,
    },
  });
});

// ── Import series config ──

router.post("/import", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json<ApiResponse>({ ok: false, error: "Invalid JSON body" }, 400);
  }

  try {
    const result = importProjectConfig(body);
    return c.json<ApiResponse<typeof result>>({ ok: true, data: result }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return c.json<ApiResponse>({ ok: false, error: message }, 400);
  }
});

export const exportImportRoutes = router;
