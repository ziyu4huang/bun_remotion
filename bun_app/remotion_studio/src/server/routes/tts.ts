import { Hono } from "hono";
import { resolve } from "node:path";
import { existsSync, readdirSync, readFileSync, mkdirSync } from "node:fs";
import { generateTTS } from "bun_tts";
import { jobService } from "../middleware/job-service";
import { listVoices } from "../services/voice-registry";
import { getCharacterProfiles, updateCharacterVoice } from "../services/character-profiles";
import type { ApiResponse, Job, TTSStatus, VoiceInfo, CharacterProfile } from "../../shared/types";

const router = new Hono();

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");
const PREVIEW_DIR = resolve(REPO_ROOT, "bun_app/remotion_studio/data/voice-previews");

// ── GET /voices ──

router.get("/voices", (c) => {
  const engine = c.req.query("engine") as "mlx" | "gemini" | undefined;
  const voices = listVoices(engine);
  return c.json<ApiResponse<VoiceInfo[]>>({ ok: true, data: voices });
});

// ── GET /status ──

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

  const job = jobService.create("tts", async (progress) => {
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

// ── GET /characters?seriesId=X ──

router.get("/characters", (c) => {
  const seriesId = c.req.query("seriesId");
  if (!seriesId) {
    return c.json<ApiResponse>({ ok: false, error: "seriesId is required" }, 400);
  }
  const profiles = getCharacterProfiles(seriesId);
  return c.json<ApiResponse<CharacterProfile[]>>({ ok: true, data: profiles });
});

// ── PUT /characters/:seriesId/voice ──

router.put("/characters/:seriesId/voice", async (c) => {
  const { seriesId } = c.req.param();
  const body = await c.req.json<{ characterId: string; voice: string }>();

  if (!body.characterId || !body.voice) {
    return c.json<ApiResponse>({ ok: false, error: "characterId and voice are required" }, 400);
  }

  const validVoices = listVoices().map((v) => v.id);
  if (!validVoices.includes(body.voice)) {
    return c.json<ApiResponse>({ ok: false, error: `Unknown voice: ${body.voice}` }, 400);
  }

  const ok = updateCharacterVoice(seriesId, body.characterId, body.voice);
  if (!ok) {
    return c.json<ApiResponse>({ ok: false, error: "Character not found" }, 404);
  }

  const profiles = getCharacterProfiles(seriesId);
  const updated = profiles.find((p) => p.id === body.characterId);
  return c.json<ApiResponse<CharacterProfile>>({ ok: true, data: updated });
});

// ── POST /preview-voice ──

router.post("/preview-voice", async (c) => {
  const body = await c.req.json<{ voice: string; engine: "mlx" | "gemini"; text?: string }>();
  if (!body.voice || !body.engine) {
    return c.json<ApiResponse>({ ok: false, error: "voice and engine are required" }, 400);
  }

  const validVoices = listVoices(body.engine);
  if (!validVoices.find((v) => v.id === body.voice)) {
    return c.json<ApiResponse>({ ok: false, error: `Unknown voice: ${body.voice} for engine ${body.engine}` }, 400);
  }

  const previewText = body.text || "你好，這是語音測試。";
  const cacheKey = `${body.engine}_${body.voice}`;
  const cachePath = resolve(PREVIEW_DIR, `${cacheKey}.wav`);

  // Serve cached preview
  if (existsSync(cachePath)) {
    return c.json<ApiResponse<{ url: string }>>({ ok: true, data: { url: `/tts/preview-file/${cacheKey}.wav` } });
  }

  // Generate preview
  mkdirSync(PREVIEW_DIR, { recursive: true });

  try {
    if (body.engine === "mlx") {
      const { generateViaMlxTts } = await import("bun_tts/tts-engine");
      generateViaMlxTts(previewText, cachePath, body.voice, {
        mlxRoot: resolve(REPO_ROOT, "mlx_tts"),
        speed: "0.97",
        lang: "zh",
      });
    } else {
      const { generateViaGemini, createWavHeader } = await import("bun_tts/tts-engine");
      const pcmBuffer = await generateViaGemini(previewText, body.voice, "zh-TW");
      // Gemini returns raw PCM, wrap in WAV header
      const { writeFileSync: wf } = await import("node:fs");
      wf(cachePath, Buffer.concat([createWavHeader(pcmBuffer.length), pcmBuffer]));
    }

    return c.json<ApiResponse<{ url: string }>>({ ok: true, data: { url: `/tts/preview-file/${cacheKey}.wav` } });
  } catch (err: any) {
    return c.json<ApiResponse>({ ok: false, error: `Preview failed: ${err.message}` }, 500);
  }
});

// ── GET /preview-file/:file ── (serves cached preview WAV)

router.get("/preview-file/:file", (c) => {
  const file = c.req.param("file");
  if (!file.endsWith(".wav") || file.includes("..")) {
    return c.json<ApiResponse>({ ok: false, error: "Invalid file" }, 400);
  }
  const filePath = resolve(PREVIEW_DIR, file);
  if (!existsSync(filePath)) {
    return c.json<ApiResponse>({ ok: false, error: "Not found" }, 404);
  }
  const data = readFileSync(filePath);
  return new Response(data, {
    headers: { "Content-Type": "audio/wav", "Cache-Control": "public, max-age=86400" },
  });
});

export const ttsRoutes = router;
