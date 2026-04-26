import { Hono } from "hono";
import { resolve } from "node:path";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { generateTTS } from "bun_tts";
import { createJob } from "../middleware/job-queue";
import type { ApiResponse, Job, TTSStatus } from "../../shared/types";

const router = new Hono();

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

router.get("/status", (c) => {
  // Use query param since episodeId contains "/" (e.g. "weapon-forger/weapon-forger-ch1-ep1")
  const episodeId = c.req.query("episodeId") ?? "";
  const episodePath = resolve(PROJ_DIR, episodeId);

  const narrationPath = resolve(episodePath, "scripts/narration.ts");
  const hasNarration = existsSync(narrationPath);

  const audioDir = resolve(episodePath, "public/audio");
  let audioFiles: string[] = [];
  let hasAudio = false;
  try {
    if (existsSync(audioDir)) {
      audioFiles = readdirSync(audioDir).filter((f) => f.endsWith(".wav") || f.endsWith(".mp3"));
      hasAudio = audioFiles.length > 0;
    }
  } catch { /* ignore */ }

  let voiceMap: Record<string, string> | undefined;
  if (hasNarration) {
    try {
      const manifestPath = resolve(audioDir, "voice-manifest.json");
      if (existsSync(manifestPath)) {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
        const map: Record<string, string> = {};
        for (const scene of manifest) {
          for (const seg of scene.segments) {
            map[seg.character] = seg.voice;
          }
        }
        if (Object.keys(map).length > 0) voiceMap = map;
      }
    } catch { /* ignore */ }
  }

  const status: TTSStatus = { episodeId, hasNarration, hasAudio, audioFiles, voiceMap };
  return c.json<ApiResponse<TTSStatus>>({ ok: true, data: status });
});

router.post("/generate", async (c) => {
  const body = await c.req.json<{ episodeId: string; scene?: string; skipExisting?: boolean; engine?: "mlx" | "gemini" }>();

  if (!body.episodeId) {
    return c.json<ApiResponse>({ ok: false, error: "episodeId is required" }, 400);
  }

  const episodePath = resolve(PROJ_DIR, body.episodeId);
  if (!existsSync(episodePath)) {
    return c.json<ApiResponse>({ ok: false, error: "Episode not found" }, 404);
  }

  const job = createJob("tts", async (progress) => {
    progress(5, "Starting TTS generation");
    const result = await generateTTS({
      episodePath,
      repoRoot: REPO_ROOT,
      sceneFilter: body.scene,
      skipExisting: body.skipExisting,
      engine: body.engine,
      onProgress: (msg) => {
        progress(50, msg);
      },
    });
    progress(100, `Generated ${result.generated} scene(s)`);
    return result;
  });

  return c.json<ApiResponse<Job>>({ ok: true, data: job }, 201);
});

export const ttsRoutes = router;
