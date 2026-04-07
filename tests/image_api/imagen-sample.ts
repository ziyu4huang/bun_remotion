/**
 * Imagen Image Generation API test (free tier)
 * Run: bun tests/image_api/imagen-sample.ts
 *
 * ── Prerequisites ──────────────────────────────────────────────
 * GOOGLE_API_KEY env var must be set
 *
 * ── Models ─────────────────────────────────────────────────────
 * - imagen-4.0-fast-generate-001
 * - imagen-4.0-generate-001
 * - imagen-4.0-ultra-generate-001
 *
 * ── API Pattern ────────────────────────────────────────────────
 * Endpoint: POST /v1beta/models/{MODEL}:predict
 * Auth:     x-goog-api-key header
 * Response: image bytes
 * Output:   tests/image_api/output/
 * ──────────────────────────────────────────────────────────────
 */

import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) { console.error("GOOGLE_API_KEY not set"); process.exit(1); }

const OUTPUT_DIR = join(import.meta.dirname ?? __dirname, "output");
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const MODELS = [
  "imagen-4.0-fast-generate-001",
  "imagen-4.0-generate-001",
  "imagen-4.0-ultra-generate-001",
];

const PROMPT = "A cute pixel art banana wearing sunglasses on a tropical beach";

async function testModel(model: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;

  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
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
    try {
      const j = JSON.parse(err);
      return { ok: false, error: `${res.status}: ${j.error?.message ?? err.slice(0, 200)}` };
    } catch {
      return { ok: false, error: `${res.status}: ${err.slice(0, 200)}` };
    }
  }

  const data = await res.json();

  // Imagen returns predictions array with bytesBase64Encoded
  const predictions = data.predictions ?? [];
  if (predictions.length === 0) {
    return { ok: false, error: "No predictions in response" };
  }

  const pred = predictions[0];
  const b64 = pred.bytesBase64Encoded;
  if (!b64) {
    return { ok: false, error: `No image data. Keys: ${Object.keys(pred).join(", ")}` };
  }

  const buf = Buffer.from(b64, "base64");
  const ext = pred.mimeType?.includes("png") ? "png" : "jpg";
  const filename = `${model.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.${ext}`;
  const filepath = join(OUTPUT_DIR, filename);
  writeFileSync(filepath, buf);

  return {
    ok: true,
    file: `${filepath} (${(buf.length / 1024).toFixed(1)}KB, ${Date.now() - t0}ms)`,
    mimeType: pred.mimeType,
  };
}

console.log("=== Imagen Image Generation Free Tier Test ===\n");
console.log(`Prompt: "${PROMPT}"\n`);

for (const model of MODELS) {
  console.log(`--- ${model} ---`);
  const r = await testModel(model, PROMPT);
  if (r.ok) {
    console.log(`  [OK] ${r.file} (mime: ${r.mimeType})`);
  } else {
    console.log(`  [FAIL] ${r.error}`);
  }
  console.log();
}

console.log(`Output: ${OUTPUT_DIR}`);
