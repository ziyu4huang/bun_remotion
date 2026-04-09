/**
 * Gemini TTS API test (free tier)
 * Run: bun tests/tts_api/gemini-tts-sample.ts
 *
 * ── Prerequisites ──────────────────────────────────────────────
 * 1. GOOGLE_API_KEY env var must be set
 *      pwsh:  $env:GOOGLE_API_KEY = "AIzaSy..."
 *      bash:  export GOOGLE_API_KEY="AIzaSy..."
 *
 * ── Free Tier Status ────────────────────────────────────────────
 * - gemini-2.5-flash-preview-tts  ✅ WORKS (PCM audio, ~3-5s per request)
 * - gemini-2.5-pro-preview-tts    ❌ Free tier quota = 0 (needs billing)
 *
 * ── API Pattern ────────────────────────────────────────────────
 * - Endpoint: POST /v1beta/models/{MODEL}:generateContent
 * - Auth:     x-goog-api-key header
 * - Body:     generationConfig.responseModalities = ["AUDIO"]
 * - Voices:   Kore, Fenrir, Charon, Orus, Puck, Leda, Zephyr, Aoede
 * - Response: audio/pcm in parts[].inlineData.data (base64)
 * - Output dir: tests/tts_api/output/
 * ──────────────────────────────────────────────────────────────
 */

import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("GOOGLE_API_KEY not set");
  process.exit(1);
}

const OUTPUT_DIR = join(import.meta.dirname ?? __dirname, "output");
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const MODELS = [
  "gemini-2.5-flash-preview-tts",
  "gemini-2.5-pro-preview-tts",
];

const TEST_TEXTS = [
  "Hello! This is a test of Google's free text-to-speech API using Gemini.",
  "The quick brown fox jumps over the lazy dog.",
  "Today's stock market saw significant gains in the technology sector.",
];

// Known voice names for Gemini TTS
const VOICES = ["Kore", "Fenrir", "Charon", "Orus", "Puck", "Leda", "Zephyr", "Aoede"];

// Gemini returns raw PCM (24000 Hz, 16-bit, mono) — wrap with WAV RIFF header
// so the output is playable on Windows without FFmpeg.
function pcmToWav(pcmData: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmData.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmData.length, 40);
  return Buffer.concat([header, pcmData]);
}

interface TTSResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          mimeType: string;
          data: string;
        };
        text?: string;
      }>;
    };
  }>;
}

async function synthesize(model: string, text: string, voice?: string): Promise<{ ok: boolean; file?: string; error?: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  // Build the prompt parts — instruction + text to speak
  const parts: any[] = [];
  if (voice) {
    parts.push({ text: `Speak with the voice named ${voice}.` });
  }
  parts.push({ text });

  const body: any = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["AUDIO"],
    },
  };

  const t0 = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: `HTTP ${res.status}: ${err}` };
  }

  const data: TTSResponse = await res.json();

  // Check for error in text response
  const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text);
  if (textPart?.text) {
    return { ok: false, error: textPart.text };
  }

  const audioPart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!audioPart?.inlineData) {
    return { ok: false, error: "No audio data in response" };
  }

  const { mimeType, data: b64 } = audioPart.inlineData;
  const voiceTag = voice ? `_${voice}` : "";
  const safeText = text.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_");
  const modelTag = model.replace(/[^a-zA-Z0-9]/g, "_");

  let outBuf: Buffer;
  let ext: string;
  if (mimeType.includes("mp3")) {
    ext = "mp3";
    outBuf = Buffer.from(b64, "base64");
  } else if (mimeType.includes("wav")) {
    ext = "wav";
    outBuf = Buffer.from(b64, "base64");
  } else {
    // Raw PCM — add WAV header so it's playable on Windows
    ext = "wav";
    outBuf = pcmToWav(Buffer.from(b64, "base64"));
  }

  const filename = `${modelTag}${voiceTag}_${safeText}.${ext}`;
  const filepath = join(OUTPUT_DIR, filename);

  writeFileSync(filepath, outBuf);
  const size = (outBuf.length / 1024).toFixed(1);

  return { ok: true, file: `${filepath} (${size}KB, ${Date.now() - t0}ms)` };
}

// ── Run tests ──

console.log("=== Gemini TTS Free Tier Test ===\n");

for (const model of MODELS) {
  console.log(`--- ${model} ---`);

  // Test 1: basic synthesis
  const r1 = await synthesize(model, TEST_TEXTS[0]);
  if (r1.ok) {
    console.log(`  [OK] Basic:     ${r1.file}`);
  } else {
    console.log(`  [FAIL] Basic:   ${r1.error}`);
  }

  // Test 2: different text
  const r2 = await synthesize(model, TEST_TEXTS[1]);
  if (r2.ok) {
    console.log(`  [OK] Tongue tw: ${r2.file}`);
  } else {
    console.log(`  [FAIL] Tongue tw: ${r2.error}`);
  }

  // Test 3: with voice name (try first 3 voices)
  for (const voice of VOICES.slice(0, 3)) {
    const rv = await synthesize(model, TEST_TEXTS[2], voice);
    if (rv.ok) {
      console.log(`  [OK] Voice ${voice}:  ${rv.file}`);
    } else {
      console.log(`  [FAIL] Voice ${voice}: ${rv.error}`);
    }
  }

  console.log();
}

console.log(`Output files saved to: ${OUTPUT_DIR}`);
