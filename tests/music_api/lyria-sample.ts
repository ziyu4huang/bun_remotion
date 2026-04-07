/**
 * Lyria Music Generation API test (free tier)
 * Run: bun tests/music_api/lyria-sample.ts
 *
 * ── Prerequisites ──────────────────────────────────────────────
 * GOOGLE_API_KEY env var must be set
 *
 * ── Models ─────────────────────────────────────────────────────
 * - lyria-3-clip-preview
 * - lyria-3-pro-preview
 *
 * ── API Pattern ────────────────────────────────────────────────
 * Endpoint: POST /v1beta/models/{MODEL}:generateContent
 * Auth:     x-goog-api-key header
 * Response: likely audio in inlineData (similar to TTS)
 * Output:   tests/music_api/output/
 * ──────────────────────────────────────────────────────────────
 */

import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) { console.error("GOOGLE_API_KEY not set"); process.exit(1); }

const OUTPUT_DIR = join(import.meta.dirname ?? __dirname, "output");
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const MODELS = [
  "lyria-3-clip-preview",
  "lyria-3-pro-preview",
];

const PROMPTS = [
  "Generate a short upbeat jazz piano melody, 10 seconds",
  "Create an ambient electronic pad sound, 8 seconds",
];

async function testModel(model: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const body: any = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
    },
  };

  const t0 = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-goog-api-key": API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    // Extract just the message from error JSON
    try {
      const j = JSON.parse(err);
      return { ok: false, error: `${res.status}: ${j.error?.message ?? err.slice(0, 200)}` };
    } catch {
      return { ok: false, error: `${res.status}: ${err.slice(0, 200)}` };
    }
  }

  const data = await res.json();

  // Check for text error response
  const textPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text);
  if (textPart?.text) {
    return { ok: false, error: textPart.text.slice(0, 200) };
  }

  // Check for audio data
  const audioPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  if (!audioPart?.inlineData) {
    // Log full response structure for debugging
    return { ok: false, error: `No audio in response. Structure: ${JSON.stringify(data.candidates?.[0]?.content?.parts?.map((p: any) => Object.keys(p)))}` };
  }

  const { mimeType, data: b64 } = audioPart.inlineData;
  const buf = Buffer.from(b64, "base64");
  const ext = mimeType.includes("mp3") ? "mp3" : mimeType.includes("wav") ? "wav" : "pcm";
  const filename = `${model.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.${ext}`;
  const filepath = join(OUTPUT_DIR, filename);
  writeFileSync(filepath, buf);

  return {
    ok: true,
    file: `${filepath} (${(buf.length / 1024).toFixed(1)}KB, ${Date.now() - t0}ms)`,
    mimeType,
  };
}

console.log("=== Lyria Music Generation Free Tier Test ===\n");

for (const model of MODELS) {
  console.log(`--- ${model} ---`);
  for (const prompt of PROMPTS) {
    console.log(`  Prompt: "${prompt.slice(0, 50)}..."`);
    const r = await testModel(model, prompt);
    if (r.ok) {
      console.log(`  [OK] ${r.file} (mime: ${r.mimeType})`);
    } else {
      console.log(`  [FAIL] ${r.error}`);
    }
  }
  console.log();
}

console.log(`Output: ${OUTPUT_DIR}`);
