import { Hono } from "hono";
import { resolve, normalize } from "node:path";
import { existsSync } from "node:fs";
import { scanSeriesAssets, scanAllAssets } from "../services/asset-scanner";
import type { ApiResponse, SeriesAssets, AssetSummary } from "../../shared/types";

const router = new Hono();

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

// Serve actual asset files for preview — must be before :seriesId routes
router.get("/file/*", async (c) => {
  const star = c.req.path.replace("/api/assets/file/", "");
  // Decode URL encoding
  const relPath = decodeURIComponent(star);
  const absPath = resolve(PROJ_DIR, relPath);
  const normalized = normalize(absPath);

  // Safety: only serve from bun_remotion_proj
  if (!normalized.startsWith(PROJ_DIR + "/") && normalized !== PROJ_DIR) {
    return c.json({ ok: false, error: "Forbidden" }, 403);
  }

  if (!existsSync(normalized)) {
    return c.json({ ok: false, error: "Not found" }, 404);
  }

  const file = Bun.file(normalized);
  return new Response(file);
});

router.get("/", (c) => {
  const summaries = scanAllAssets();
  return c.json<ApiResponse<AssetSummary[]>>({ ok: true, data: summaries });
});

router.get("/:seriesId", (c) => {
  const seriesId = c.req.param("seriesId");
  const assets = scanSeriesAssets(seriesId);
  return c.json<ApiResponse<SeriesAssets>>({ ok: true, data: assets });
});

router.get("/:seriesId/characters", (c) => {
  const seriesId = c.req.param("seriesId");
  const assets = scanSeriesAssets(seriesId);
  return c.json<ApiResponse>({ ok: true, data: assets.characters });
});

router.get("/:seriesId/backgrounds", (c) => {
  const seriesId = c.req.param("seriesId");
  const assets = scanSeriesAssets(seriesId);
  return c.json<ApiResponse>({ ok: true, data: assets.backgrounds });
});

router.get("/:seriesId/audio", (c) => {
  const seriesId = c.req.param("seriesId");
  const assets = scanSeriesAssets(seriesId);
  return c.json<ApiResponse>({ ok: true, data: assets.audio });
});

export const assetsRoutes = router;
