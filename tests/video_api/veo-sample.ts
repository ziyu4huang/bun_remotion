/**
 * VeO Video Generation API test (free tier)
 * Run: bun tests/video_api/veo-sample.ts
 *
 * ── Prerequisites ──────────────────────────────────────────────
 * GOOGLE_API_KEY env var must be set
 *
 * ── Models ─────────────────────────────────────────────────────
 * - veo-2.0-generate-001
 * - veo-3.0-generate-001
 * - veo-3.0-fast-generate-001
 *
 * ── API Pattern ────────────────────────────────────────────────
 * Endpoint: POST /v1beta/models/{MODEL}:predictLongRunning
 * Auth:     x-goog-api-key header
 * Response: operation name for polling
 * Polling:  GET /v1beta/{operation.name}
 * Output:   tests/video_api/output/
 * ──────────────────────────────────────────────────────────────
 */

import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) { console.error("GOOGLE_API_KEY not set"); process.exit(1); }

const OUTPUT_DIR = join(import.meta.dirname ?? __dirname, "output");
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const MODELS = [
  "veo-3.0-fast-generate-001",
  "veo-3.0-generate-001",
  "veo-2.0-generate-001",
];

const PROMPT = "A cute cat playing with a ball of yarn, cinematic lighting, 3 seconds";

async function pollOperation(operationName: string, maxWaitMs = 120000) {
  const url = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${API_KEY}`;
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 5000)); // poll every 5s
    const res = await fetch(url);
    if (!res.ok) {
      return { ok: false, error: `Poll error ${res.status}` };
    }
    const op = await res.json();

    if (op.done) {
      if (op.error) {
        return { ok: false, error: op.error.message ?? JSON.stringify(op.error) };
      }
      return { ok: true, response: op.response };
    }

    console.log(`    ... polling (${((Date.now() - start) / 1000).toFixed(0)}s)`);
  }

  return { ok: false, error: "Polling timeout" };
}

async function testModel(model: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning`;

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

  const op = await res.json();
  const operationName = op.name;
  if (!operationName) {
    return { ok: false, error: `No operation name in response. Keys: ${Object.keys(op).join(", ")}` };
  }

  console.log(`    Operation: ${operationName}, polling...`);

  const result = await pollOperation(operationName);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  // Extract video data from response
  const resp = result.response;
  const predictions = resp?.predictions ?? resp?.generatedSamples ?? [];
  if (predictions.length === 0) {
    return { ok: false, error: `No video in response. Structure: ${JSON.stringify(Object.keys(resp ?? {}))}` };
  }

  const pred = predictions[0];
  const b64 = pred.bytesBase64Encoded ?? pred.video?.bytesBase64Encoded;
  if (!b64) {
    return { ok: false, error: `No video bytes. Keys: ${Object.keys(pred).join(", ")}` };
  }

  const buf = Buffer.from(b64, "base64");
  const ext = pred.mimeType?.includes("mp4") ? "mp4" : "webm";
  const filename = `${model.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.${ext}`;
  const filepath = join(OUTPUT_DIR, filename);
  writeFileSync(filepath, buf);

  return {
    ok: true,
    file: `${filepath} (${(buf.length / 1024).toFixed(1)}KB, ${Date.now() - t0}ms)`,
    mimeType: pred.mimeType,
  };
}

console.log("=== VeO Video Generation Free Tier Test ===\n");
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
