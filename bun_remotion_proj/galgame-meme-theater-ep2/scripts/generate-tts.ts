/**
 * Generate TTS audio for all scenes in 美少女梗圖劇場 第二集.
 *
 * On macOS  → uses mlx_tts (Qwen3-TTS, local, offline, no API key needed)
 * Otherwise → falls back to Gemini TTS (requires GOOGLE_API_KEY env var)
 *
 * Voices per character (FEMALE — matching character gender):
 *   小雪 → serena (warm, energetic)
 *   小月 → vivian (clear, composed)
 *   小樱 → serena (warm, soft)
 *   Narrator → serena
 *
 * Usage:
 *   bun run scripts/generate-tts.ts                 # generate all scenes
 *   bun run scripts/generate-tts.ts --skip-existing  # skip already-generated
 *   bun run scripts/generate-tts.ts --scene JokeScene1
 */

import { narrations } from "./narration";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(__dirname, "..");
const REPO_ROOT = join(APP_DIR, "..", "..");
const AUDIO_DIR = join(APP_DIR, "public", "audio");

// ─── mlx_tts config (macOS) ───────────────────────────────────────────────────
const MLX_TTS_ROOT = join(REPO_ROOT, "mlx_tts");
const MLX_PYTHON = join(MLX_TTS_ROOT, ".venv", "bin", "python");
const MLX_VOICE = "serena"; // Female voice — all characters are female
const MLX_SPEED = "0.97";
const MLX_LANG = "zh";

// ─── Gemini TTS config (fallback) ─────────────────────────────────────────────
const GEMINI_MODEL = "gemini-2.5-flash-preview-tts";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_VOICE = "Kore"; // Female voice
const SAMPLE_RATE = 24000;
const BYTE_RATE = SAMPLE_RATE * 2; // 16-bit mono

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const skipExisting = args.includes("--skip-existing");
const sceneFilter = (() => {
  const idx = args.indexOf("--scene");
  return idx !== -1 ? (args[idx + 1] ?? null) : null;
})();

// ─── WAV duration from header ─────────────────────────────────────────────────
function wavDurationFrames(filePath: string, fps: number): number {
  const buf = readFileSync(filePath);
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  return Math.ceil((dataSize / byteRate) * fps) + 15;
}

// ─── WAV header helper (for Gemini PCM output) ────────────────────────────────
function createWavHeader(dataSize: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(dataSize + 36, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(BYTE_RATE, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return header;
}

// ─── mlx_tts generator (macOS) ────────────────────────────────────────────────
function generateViaMlxTts(text: string, outputPath: string): void {
  if (!existsSync(MLX_PYTHON)) {
    throw new Error(
      `mlx_tts venv not found at ${MLX_PYTHON}\n` +
      `Setup: cd mlx_tts && python3.11 -m venv .venv && ` +
      `.venv/bin/pip install mlx-audio mlx-lm einops soundfile sounddevice`
    );
  }
  execFileSync(MLX_PYTHON, [
    "-m", "mlx_tts", "save",
    text,
    "-o", outputPath,
    "--voice", MLX_VOICE,
    "--speed", MLX_SPEED,
    "--lang", MLX_LANG,
  ], {
    cwd: MLX_TTS_ROOT,
    stdio: ["ignore", "inherit", "inherit"],
  });
}

// ─── Gemini TTS generator (fallback) ──────────────────────────────────────────
async function generateViaGemini(text: string, retries = 3): Promise<Buffer> {
  const API_KEY = process.env.GOOGLE_API_KEY;
  if (!API_KEY) {
    throw new Error(
      "GOOGLE_API_KEY not set. Get a free key at https://aistudio.google.com/apikey\n" +
      "On macOS, install mlx_tts instead to avoid needing an API key."
    );
  }
  const prompt = `請用繁體中文台灣口音朗讀以下內容，用說故事的語氣：\n${text}`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: GEMINI_VOICE },
            },
          },
        },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const audioPart = data.candidates?.[0]?.content?.parts?.find(
        (p: { inlineData?: { mimeType?: string; data?: string } }) =>
          p.inlineData?.mimeType?.startsWith("audio/")
      );
      if (!audioPart?.inlineData?.data) {
        throw new Error("No audio in API response:\n" + JSON.stringify(data, null, 2));
      }
      return Buffer.from(audioPart.inlineData.data, "base64");
    }
    if (res.status === 429 && attempt < retries) {
      const body = await res.text();
      const match = body.match(/retry in ([\d.]+)s/);
      const delaySec = match ? parseFloat(match[1]) + 2 : 35;
      console.log(`  Rate limited. Waiting ${delaySec.toFixed(0)}s (attempt ${attempt + 1}/${retries})...`);
      await new Promise((r) => setTimeout(r, delaySec * 1000));
      continue;
    }
    throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  }
  throw new Error("Max retries exceeded");
}

// ─── Main ──────────────────────────────────────────────
async function main() {
  mkdirSync(AUDIO_DIR, { recursive: true });

  const useMlxTts = process.platform === "darwin";
  const backend = useMlxTts ? `mlx_tts (${MLX_VOICE}, speed ${MLX_SPEED})` : `Gemini TTS (${GEMINI_VOICE})`;

  const filtered = sceneFilter
    ? narrations.filter((n) => n.scene === sceneFilter)
    : narrations;

  if (filtered.length === 0) {
    console.error(`No scenes found${sceneFilter ? ` matching "${sceneFilter}"` : ""}.`);
    process.exit(1);
  }

  console.log(`Backend: ${backend}`);
  console.log(`Voice: ${MLX_VOICE} (female) — all characters are female`);
  console.log(`Generating TTS for ${filtered.length} scene(s)...\n`);

  let generated = 0;
  let skipped = 0;

  for (let i = 0; i < filtered.length; i++) {
    const { scene, file, text } = filtered[i];
    const outputPath = join(AUDIO_DIR, file);

    if (skipExisting && existsSync(outputPath)) {
      console.log(`[${i + 1}/${filtered.length}] ${scene} — skipped (exists)`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${filtered.length}] ${scene}`);
    console.log(`  Text: ${text}`);

    try {
      if (useMlxTts) {
        generateViaMlxTts(text, outputPath);
        console.log(`  → ${file}`);
      } else {
        const pcm = await generateViaGemini(text);
        writeFileSync(outputPath, Buffer.concat([createWavHeader(pcm.length), pcm]));
        console.log(`  → ${file} (${(pcm.length / BYTE_RATE).toFixed(1)}s)`);
      }
      generated++;
    } catch (err) {
      console.error(`  FAILED: ${err}`);
      process.exit(1);
    }

    if (useMlxTts && i < filtered.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
    if (!useMlxTts && i < filtered.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Write durations.json
  const durationsJson = narrations.map(({ file }) => {
    const p = join(AUDIO_DIR, file);
    return existsSync(p) ? wavDurationFrames(p, 30) : 240;
  });
  writeFileSync(join(AUDIO_DIR, "durations.json"), JSON.stringify(durationsJson, null, 2) + "\n");
  console.log(`\nDone. Generated: ${generated}, Skipped: ${skipped}`);
  console.log(`Audio files:   ${AUDIO_DIR}`);
  console.log(`durations.json written (reload Remotion Studio to pick up new timings)`);
}

main();
