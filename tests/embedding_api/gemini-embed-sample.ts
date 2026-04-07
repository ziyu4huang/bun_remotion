/**
 * Gemini Embedding API test (free tier)
 * Run: bun tests/embedding_api/gemini-embed-sample.ts
 *
 * ── Prerequisites ──────────────────────────────────────────────
 * 1. Go to https://aistudio.google.com/
 * 2. Sign in with Google account
 * 3. Click "Get API Key" → create project → copy key
 * 4. Set env var:
 *      pwsh:  $env:GOOGLE_API_KEY = "AIzaSy..."
 *      bash:  export GOOGLE_API_KEY="AIzaSy..."
 *
 * ── Free Tier Works For ────────────────────────────────────────
 * - Text:       gemini-2.5-flash, gemini-2.5-pro
 * - Embeddings: gemini-embedding-001 (3072 dims), gemini-embedding-2-preview
 *
 * ── Free Tier Does NOT Work ────────────────────────────────────
 * - Image gen:  gemini-3.1-flash-image-preview, gemini-2.5-flash-image
 *               (requires pay-as-you-go billing, ~$0.05/image)
 *
 * ── API Pattern ────────────────────────────────────────────────
 * - Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:embedContent
 * - Auth:     x-goog-api-key header (no OAuth needed)
 * - List all: GET /v1beta/models?key={API_KEY}
 * ──────────────────────────────────────────────────────────────
 */

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("GOOGLE_API_KEY not set");
  process.exit(1);
}

const MODEL = "gemini-embedding-001";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent`;

const texts = [
  "A cute pixel art banana wearing sunglasses",
  "A banana on a beach towel",
  "A red sports car drifting on a mountain road",
];

console.log(`Testing ${MODEL} embeddings...\n`);

for (const text of texts) {
  const t0 = Date.now();
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "x-goog-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: `models/${MODEL}`, content: { parts: [{ text }] } }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Error ${res.status}: ${err}`);
    continue;
  }

  const data = await res.json();
  const vec = data.embedding?.values ?? [];
  console.log(`"${text}"`);
  console.log(`  dims: ${vec.length}, first5: [${vec.slice(0, 5).map((v: number) => v.toFixed(4))}] (${Date.now() - t0}ms)\n`);
}

// Batch embed for similarity comparison
console.log("Cosine similarity:");
const vecs: number[][] = [];
for (const text of texts) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ model: `models/${MODEL}`, content: { parts: [{ text }] } }),
  });
  const data = await res.json();
  vecs.push(data.embedding?.values ?? []);
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

console.log(`  banana vs banana-beach: ${cosine(vecs[0], vecs[1]).toFixed(4)}`);
console.log(`  banana vs sports-car:   ${cosine(vecs[0], vecs[2]).toFixed(4)}`);
console.log(`  banana-beach vs car:    ${cosine(vecs[1], vecs[2]).toFixed(4)}`);
