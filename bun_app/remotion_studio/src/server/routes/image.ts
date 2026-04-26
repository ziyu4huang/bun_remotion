import { Hono } from "hono";
import { createJob } from "../middleware/job-queue";
import type { ApiResponse, Job, ImageStatus, CharacterProfile } from "../../shared/types";
import { generateImageBatch, buildCharacterPrompt, buildBackgroundPrompt } from "bun_image";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { getCharacterProfiles } from "../services/character-profiles";

const router = new Hono();

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const SERIES_DIR = (id: string) => resolve(REPO_ROOT, "bun_remotion_proj", id);

function countImages(dir: string, exts: string[]): number {
  if (!existsSync(dir)) return 0;
  try {
    return readdirSync(dir).filter((f) => exts.some((e) => f.endsWith(e))).length;
  } catch {
    return 0;
  }
}

// ── GET /status?seriesId=X ──

router.get("/status", (c) => {
  const seriesId = c.req.query("seriesId");
  if (!seriesId) return c.json<ApiResponse>({ ok: false, error: "seriesId is required" }, 400);

  const seriesDir = SERIES_DIR(seriesId);
  if (!existsSync(seriesDir)) return c.json<ApiResponse>({ ok: false, error: "Series not found" }, 404);

  const charDir = resolve(seriesDir, "assets", "characters");
  const bgDir = resolve(seriesDir, "assets", "backgrounds");

  const status: ImageStatus = {
    seriesId,
    characterDir: charDir,
    backgroundDir: bgDir,
    characters: countImages(charDir, [".png", ".jpg"]),
    backgrounds: countImages(bgDir, [".png", ".jpg"]),
  };

  return c.json<ApiResponse<ImageStatus>>({ ok: true, data: status });
});

// ── GET /characters?seriesId=X ──

router.get("/characters", (c) => {
  const seriesId = c.req.query("seriesId");
  if (!seriesId) return c.json<ApiResponse>({ ok: false, error: "seriesId is required" }, 400);

  const seriesDir = SERIES_DIR(seriesId);
  if (!existsSync(seriesDir)) return c.json<ApiResponse>({ ok: false, error: "Series not found" }, 404);

  const profiles = getCharacterProfiles(seriesId);
  return c.json<ApiResponse<CharacterProfile[]>>({ ok: true, data: profiles });
});

// ── POST /generate ──

router.post("/generate", async (c) => {
  const body = await c.req.json<{
    seriesId: string;
    images: Array<{
      filename: string;
      prompt: string;
      aspectRatio?: string;
      resolution?: string;
      metadata?: Record<string, unknown>;
    }>;
    outputDir?: string;
    skipExisting?: boolean;
    browserMode?: "cdp" | "persistent";
    browserChannel?: "chrome" | "msedge" | "";
    cdpEndpoint?: string;
    enhanceWithCharacter?: { facing: "LEFT" | "RIGHT" };
  }>();

  if (!body.seriesId) return c.json<ApiResponse>({ ok: false, error: "seriesId is required" }, 400);
  if (!body.images?.length) return c.json<ApiResponse>({ ok: false, error: "images array is required" }, 400);

  const seriesDir = SERIES_DIR(body.seriesId);

  const images = body.enhanceWithCharacter
    ? body.images.map((img) => ({
        ...img,
        prompt: buildCharacterPrompt(img.prompt, body.enhanceWithCharacter),
      }))
    : body.images;
  const outputDir = body.outputDir ?? resolve(seriesDir, "assets", "characters");

  const job = createJob("image-generate", async (progress) => {
    const result = await generateImageBatch({
      images,
      outputDir,
      skipExisting: body.skipExisting ?? true,
      browserConfig: {
        headed: true,
        mode: body.browserMode ?? "cdp",
        channel: body.browserChannel ?? "chrome",
        cdpEndpoint: body.cdpEndpoint,
      },
      onProgress: (msg) => progress(0, msg),
    });

    const pct = Math.round(((result.generated + result.skipped) / body.images.length) * 100);
    progress(pct, `Generated ${result.generated}, skipped ${result.skipped}, failed ${result.failed}`);
    return result;
  });

  return c.json<ApiResponse<Job>>({ ok: true, data: job }, 201);
});

export const imageRoutes = router;
