/**
 * Generate multi-voice TTS audio for all scenes in 系統文小說梗 第一集.
 *
 * Each scene narration is split into per-character segments with matching voices:
 *   修修 (xiuxiu)   → uncle_fu  (male, standard Mandarin)
 *   系統 (system)   → serena    (female, standard Mandarin)
 *   師姐 (shijie)   → vivian    (female, standard Mandarin)
 *   narrator        → uncle_fu  (male, standard Mandarin)
 *
 * Segments are generated separately and concatenated via ffmpeg/sox.
 *
 * On macOS  → uses mlx_tts (local, offline, no API key needed)
 * Otherwise → falls back to Gemini TTS (requires GOOGLE_API_KEY env var)
 *
 * Usage:
 *   bun run scripts/generate-tts.ts                 # generate all scenes
 *   bun run scripts/generate-tts.ts --skip-existing  # skip already-generated
 *   bun run scripts/generate-tts.ts --scene JokeScene1
 */

import { narrations, VOICE_MAP, VOICE_DESCRIPTION, type VoiceCharacter } from "./narration";
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(__dirname, "..");
const REPO_ROOT = join(APP_DIR, "..", "..");
const AUDIO_DIR = join(APP_DIR, "public", "audio");
const SEGMENTS_DIR = join(AUDIO_DIR, "_segments"); // temp dir for per-segment audio

// ─── mlx_tts config (macOS) ───────────────────────────────────────────────────
const MLX_TTS_ROOT = join(REPO_ROOT, "mlx_tts");
const MLX_PYTHON = join(MLX_TTS_ROOT, ".venv", "bin", "python");
const MLX_SPEED = "0.97";
const MLX_LANG = "zh";

// ─── Gemini TTS config (fallback) ─────────────────────────────────────────────
const GEMINI_MODEL = "gemini-2.5-flash-preview-tts";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
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
function generateViaMlxTts(text: string, outputPath: string, voice: string): void {
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
    "--voice", voice,
    "--speed", MLX_SPEED,
    "--lang", MLX_LANG,
  ], {
    cwd: MLX_TTS_ROOT,
    stdio: ["ignore", "inherit", "inherit"],
  });
}

// ─── Gemini TTS generator (fallback) ──────────────────────────────────────────
async function generateViaGemini(text: string, voice: string, retries = 3): Promise<Buffer> {
  const API_KEY = process.env.GOOGLE_API_KEY;
  if (!API_KEY) {
    throw new Error(
      "GOOGLE_API_KEY not set. Get a free key at https://aistudio.google.com/apikey\n" +
      "On macOS, install mlx_tts instead to avoid needing an API key."
    );
  }
  const prompt = `請用標準中文普通話朗讀以下內容：\n${text}`;
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
              prebuiltVoiceConfig: { voiceName: voice },
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

// ─── Concatenate WAV files ─────────────────────────────────────────────────────
function concatenateWavs(segmentPaths: string[], outputPath: string): void {
  if (segmentPaths.length === 1) {
    // Single segment — just rename
    const buf = readFileSync(segmentPaths[0]);
    writeFileSync(outputPath, buf);
    try { unlinkSync(segmentPaths[0]); } catch { /* ignore */ }
    return;
  }

  // Manual concatenation: extract raw PCM data from each segment and write a single WAV header
  const pcmChunks: Buffer[] = [];
  let totalDataSize = 0;
  const sampleRate = 24000; // mlx_tts outputs 24kHz 16-bit mono

  for (const p of segmentPaths) {
    const buf = readFileSync(p);
    // Find "data" chunk — skip any extra chunks in the header
    let dataOffset = 12; // skip RIFF header (12 bytes)
    while (dataOffset < buf.length - 8) {
      const chunkId = buf.toString('ascii', dataOffset, dataOffset + 4);
      const chunkSize = buf.readUInt32LE(dataOffset + 4);
      if (chunkId === 'data') {
        const pcmData = buf.slice(dataOffset + 8, dataOffset + 8 + chunkSize);
        pcmChunks.push(pcmData);
        totalDataSize += pcmData.length;
        break;
      }
      dataOffset += 8 + chunkSize;
    }
    try { unlinkSync(p); } catch { /* ignore */ }
  }

  // Write combined WAV
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(totalDataSize + 36, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);      // fmt chunk size
  header.writeUInt16LE(1, 20);       // PCM
  header.writeUInt16LE(1, 22);       // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate (sampleRate * channels * bitsPerSample/8)
  header.writeUInt16LE(2, 32);       // block align
  header.writeUInt16LE(16, 34);      // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(totalDataSize, 40);

  writeFileSync(outputPath, Buffer.concat([header, ...pcmChunks]));
}

// ─── Write voice manifest ─────────────────────────────────────────────────────
function writeVoiceManifest(): void {
  const manifest = narrations.map(n => ({
    scene: n.scene,
    file: n.file,
    segments: n.segments.map(s => ({
      character: s.character,
      voice: VOICE_MAP[s.character],
      voiceDescription: VOICE_DESCRIPTION[s.character],
      text: s.text,
    })),
  }));

  const outPath = join(AUDIO_DIR, "voice-manifest.json");
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Voice manifest written: ${outPath}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  mkdirSync(AUDIO_DIR, { recursive: true });
  mkdirSync(SEGMENTS_DIR, { recursive: true });

  const useMlxTts = process.platform === "darwin";

  const filtered = sceneFilter
    ? narrations.filter((n) => n.scene === sceneFilter)
    : narrations;

  if (filtered.length === 0) {
    console.error(`No scenes found${sceneFilter ? ` matching "${sceneFilter}"` : ""}.`);
    process.exit(1);
  }

  console.log(`Backend: ${useMlxTts ? "mlx_tts (multi-voice)" : "Gemini TTS (multi-voice)"}`);
  console.log(`Voice mapping:`);
  for (const [char, voice] of Object.entries(VOICE_MAP)) {
    const desc = VOICE_DESCRIPTION[char as VoiceCharacter];
    console.log(`  ${char} → ${voice} (${desc.gender}, ${desc.accent})`);
  }
  console.log(`\nGenerating TTS for ${filtered.length} scene(s)...\n`);

  let generated = 0;
  let skipped = 0;

  for (let i = 0; i < filtered.length; i++) {
    const { scene, file, segments } = filtered[i];
    const outputPath = join(AUDIO_DIR, file);

    if (skipExisting && existsSync(outputPath)) {
      console.log(`[${i + 1}/${filtered.length}] ${scene} — skipped (exists)`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${filtered.length}] ${scene} (${segments.length} segments)`);

    try {
      const segmentPaths: string[] = [];

      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s];
        const voice = VOICE_MAP[seg.character];
        const segPath = join(SEGMENTS_DIR, `${scene}-${s}-${voice}.wav`);

        console.log(`  segment ${s + 1}/${segments.length}: ${seg.character} (${voice}) — "${seg.text.slice(0, 30)}..."`);

        if (useMlxTts) {
          generateViaMlxTts(seg.text, segPath, voice);
        } else {
          const pcm = await generateViaGemini(seg.text, voice);
          writeFileSync(segPath, Buffer.concat([createWavHeader(pcm.length), pcm]));
        }

        segmentPaths.push(segPath);

        // Small delay between segments to avoid memory pressure
        if (useMlxTts && s < segments.length - 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
        if (!useMlxTts && s < segments.length - 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      // Concatenate segments into final scene audio
      concatenateWavs(segmentPaths, outputPath);
      console.log(`  → ${file} (${segments.length} segments concatenated)`);
      generated++;
    } catch (err) {
      console.error(`  FAILED: ${err}`);
      process.exit(1);
    }
  }

  // Write durations.json
  const durationsJson = narrations.map(({ file }) => {
    const p = join(AUDIO_DIR, file);
    return existsSync(p) ? wavDurationFrames(p, 30) : 240;
  });
  writeFileSync(join(AUDIO_DIR, "durations.json"), JSON.stringify(durationsJson, null, 2) + "\n");

  // Write voice manifest
  writeVoiceManifest();

  // Cleanup _segments dir if empty
  try {
    const remaining = readdirSync(SEGMENTS_DIR);
    if (remaining.length === 0) {
      unlinkSync(SEGMENTS_DIR);
    }
  } catch { /* ignore */ }

  console.log(`\nDone. Generated: ${generated}, Skipped: ${skipped}`);
  console.log(`Audio files:   ${AUDIO_DIR}`);
  console.log(`durations.json written (reload Remotion Studio to pick up new timings)`);
}

main();
