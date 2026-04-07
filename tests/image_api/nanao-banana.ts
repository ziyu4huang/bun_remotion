/**
 * Nano Banana 2 (Gemini 3.1 Flash Image) API test
 * Uses GOOGLE_API_KEY from env
 * Run: bun tests/image_api/nanao-banana.ts [model]
 *   Default: gemini-3.1-flash-image-preview
 *   Alt:    gemini-2.5-flash-image
 *
 * ── Prerequisites ──────────────────────────────────────────────
 * 1. Go to https://aistudio.google.com/
 * 2. Sign in with Google account
 * 3. Click "Get API Key" → create project → copy key
 * 4. Set env var:
 *      pwsh:  $env:GOOGLE_API_KEY = "AIzaSy..."
 *      bash:  export GOOGLE_API_KEY="AIzaSy..."
 *
 * ── IMPORTANT: Image Gen is NOT Free ──────────────────────────
 * Image generation requires pay-as-you-go billing enabled.
 * Free tier quota = 0 for image models.
 * Cost: ~$0.05/image for Nano Banana 2.
 * Enable billing at: https://aistudio.google.com/ → Billing
 *
 * ── Free Tier Works For ────────────────────────────────────────
 * - Text:       gemini-2.5-flash, gemini-2.5-pro
 * - Embeddings: gemini-embedding-001 (3072 dims)
 *
 * ── API Pattern ────────────────────────────────────────────────
 * - Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent
 * - Auth:     x-goog-api-key header (no OAuth needed)
 * ──────────────────────────────────────────────────────────────
 */

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("GOOGLE_API_KEY not set");
  process.exit(1);
}

const MODEL = process.argv[2] || "gemini-3.1-flash-image-preview";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const prompt = "A cute pixel art style banana wearing sunglasses, sitting on a beach towel. Simple and fun. No text.";

console.log(`Calling ${MODEL}...`);
const t0 = Date.now();

const res = await fetch(URL, {
  method: "POST",
  headers: {
    "x-goog-api-key": API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  }),
});

if (!res.ok) {
  const err = await res.text();
  console.error(`API error ${res.status}: ${err}`);
  process.exit(1);
}

const data = await res.json();
const parts = data.candidates?.[0]?.content?.parts ?? [];

let saved = false;
for (const part of parts) {
  if (part.text) {
    console.log("Text:", part.text);
  } else if (part.inlineData) {
    const buf = Buffer.from(part.inlineData.data, "base64");
    const outPath = new URL("./nanao-output.png", import.meta.url).pathname;
    await Bun.write(outPath, buf);
    console.log(`Image saved: ${outPath} (${buf.length} bytes)`);
    saved = true;
  }
}

if (!saved) {
  console.log("No image in response. Full response:");
  console.log(JSON.stringify(data, null, 2));
}

console.log(`Done in ${Date.now() - t0}ms`);
