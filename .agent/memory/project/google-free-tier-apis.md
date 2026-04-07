---
name: google-free-tier-apis
description: Google AI Studio free tier API capabilities — tested and verified
type: reference
---

# Google AI Studio Free Tier APIs

**API Key:** `GOOGLE_API_KEY` env var (from https://aistudio.google.com/)

## Free Tier — WORKS (tested & confirmed)

| Category | Model | Method | Notes |
|----------|-------|--------|-------|
| **TTS** | `gemini-2.5-flash-preview-tts` | `generateContent` | PCM 24kHz 16-bit mono, 8 voices |
| **Chat** | `gemini-2.5-flash`, `gemini-2.5-pro` | `generateContent` | Main chat models |
| **Embeddings** | `gemini-embedding-001` | `embedContent` | 3072 dims |
| **Embeddings** | `gemini-embedding-2-preview` | `embedContent` | Newer embedding model |
| **Image gen** | `gemini-2.5-flash-image` | `generateContent` | Gemini native image gen (via Playwright) |
| **AQA** | `aqa` | `generateAnswer` | Attributed Q&A with citations, ~900ms |
| **Gemma** | `gemma-3-*`, `gemma-4-*` | `generateContent` | Open models (1b-31b) |
| **Gemini 3** | `gemini-3-pro-preview`, `gemini-3-flash-preview` | `generateContent` | Newer Gemini |

## Free Tier — Does NOT Work (quota = 0, needs billing)

| Category | Model | Reason |
|----------|-------|--------|
| **TTS Pro** | `gemini-2.5-pro-preview-tts` | Free tier quota = 0 |
| **Music** | `lyria-3-clip-preview`, `lyria-3-pro-preview` | Free tier quota = 0 |
| **Imagen** | `imagen-4.0-fast/generate/ultra-generate-001` | "Imagen 3 is only available on paid plans" |
| **VeO Video** | `veo-3.0-*` | Free tier quota = 0 |
| **VeO Video** | `veo-2.0-generate-001` | Requires GCP billing explicitly |

## API Pattern

- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:{METHOD}`
- **Auth:** `x-goog-api-key` header (no OAuth)
- **List models:** `GET /v1beta/models?key={API_KEY}`

## TTS Details

- Response: `candidates[0].content.parts[].inlineData.data` (base64)
- Audio format: `audio/L16;codec=pcm;rate=24000` (raw PCM, no WAV header)
- Must add 44-byte WAV header manually for playback
- Language auto-detected from text; can prepend instructions like `請用繁體中文台灣口音朗讀：`
- Voice selection via instruction: `Speak with the voice named Kore.`
- Voices: Kore, Fenrir, Charon, Orus, Puck, Leda, Zephyr, Aoede

## AQA Details

- Endpoint: `POST /v1beta/models/aqa:generateAnswer`
- Requires `inlinePassages` field with passage id + content
- Requires `answerStyle: "ABSTRACTIVE"`
- Response: `{ answer.content.parts[].text, answerableProbability, answer.groundingAttributions }`
- English only

## Test Scripts

- `tests/tts_api/gemini-tts-sample.ts` — TTS model comparison + voice tests
- `tests/tts_api/zh-tw-test.ts` — Chinese zh_TW story generation
- `tests/embedding_api/gemini-embed-sample.ts` — Embedding tests
- `tests/music_api/lyria-sample.ts` — Lyria music test (paid only)
- `tests/image_api/imagen-sample.ts` — Imagen test (paid only)
- `tests/video_api/veo-sample.ts` — VeO video test (paid only)
- `tests/aqa_api/aqa-sample.ts` — AQA attributed Q&A test

## Skills

- `/generate-tts` — Generate speech audio using free tier Gemini TTS
- `/generate-image` — Generate images via Google AI Studio (Playwright)
