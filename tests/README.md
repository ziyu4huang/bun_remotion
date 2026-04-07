# tests/ — API Demo Scripts

Quick demos using **Bun** + **Google Gemini API**. All use `GOOGLE_API_KEY` env var.

## Get Your Free API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with Google
3. Click **"Get API Key"** → create project → copy key
4. Set env var:
   ```powershell
   # PowerShell
   $env:GOOGLE_API_KEY = "AIzaSy..."
   ```
   ```bash
   # Bash
   export GOOGLE_API_KEY="AIzaSy..."
   ```

## Free Tier — What You Get (No Credit Card)

| Capability | Models | Free? |
|---|---|---|
| **Text chat** | gemini-2.5-flash, gemini-2.5-pro | Yes |
| **Embeddings** | gemini-embedding-001 (3072 dims) | Yes |
| **Image generation** | gemini-3.1-flash-image-preview | **No** — needs billing |

## Scripts

### `embedding_api/gemini-embed-sample.ts` — Free tier, works immediately
```bash
bun tests/embedding_api/gemini-embed-sample.ts
```
Outputs 3072-dim vectors and cosine similarity between texts.

### `image_api/nanao-banana.ts` — Requires pay-as-you-go billing
```bash
bun tests/image_api/nanao-banana.ts                              # Nano Banana 2
bun tests/image_api/nanao-banana.ts gemini-2.5-flash-image       # Nano Banana v1
```
Generates an image and saves as `nanao-output.png`. ~$0.05/image.

## Useful API Endpoints

- List all models: `GET /v1beta/models?key={API_KEY}`
- Embed text: `POST /v1beta/models/gemini-embedding-001:embedContent`
- Generate: `POST /v1beta/models/{MODEL}:generateContent`
- Auth header: `x-goog-api-key: {API_KEY}` (no OAuth needed)

## Docs

- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
