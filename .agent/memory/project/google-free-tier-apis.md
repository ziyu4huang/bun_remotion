---
name: google-free-tier-apis
description: Google AI Studio free tier API capabilities — TTS, embedding, chat, and limitations
type: reference
---

# Google AI Studio Free Tier APIs

**API Key:** `GOOGLE_API_KEY` env var (from https://aistudio.google.com/)

## Free Tier — Works

| Category | Model | Method | Notes |
|----------|-------|--------|-------|
| **TTS** | `gemini-2.5-flash-preview-tts` | `generateContent` | PCM 24kHz 16-bit mono, voices: Kore/Fenrir/Charon/Orus/Puck/Leda/Zephyr/Aoede |
| **Chat** | `gemini-2.5-flash` | `generateContent` | Main chat model |
| **Chat** | `gemini-2.5-pro` | `generateContent` | Pro chat model |
| **Embeddings** | `gemini-embedding-001` | `embedContent` | 3072 dims |
| **Embeddings** | `gemini-embedding-2-preview` | `embedContent` | Newer embedding model |
| **Image gen** | `gemini-2.5-flash-image` | `generateContent` | Gemini native image gen |
| **Music** | `lyria-3-clip-preview` | `generateContent` | Music generation |
| **Music** | `lyria-3-pro-preview` | `generateContent` | Music generation |
| **Gemma** | `gemma-3-*`, `gemma-4-*` | `generateContent` | Open models (1b-31b) |
| **Gemini 3** | `gemini-3-pro-preview`, `gemini-3-flash-preview` | `generateContent` | Newer Gemini |

## Free Tier — Does NOT Work (quota = 0)

| Category | Model | Reason |
|----------|-------|--------|
| **TTS Pro** | `gemini-2.5-pro-preview-tts` | Free tier quota is 0, needs billing |
| **Imagen** | `imagen-4.0-*` | `predict` method, likely needs billing |
| **VeO Video** | `veo-2.0-*`, `veo-3.*` | `predictLongRunning`, likely needs billing |

## API Pattern

- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:{METHOD}`
- **Auth:** `x-goog-api-key` header (no OAuth)
- **List models:** `GET /v1beta/models?key={API_KEY}`

## TTS Specifics

- Response: `candidates[0].content.parts[].inlineData.data` (base64)
- Audio format: `audio/L16;codec=pcm;rate=24000` (raw PCM, no WAV header)
- Must add 44-byte WAV header manually for playback
- Language auto-detected from text; can prepend instructions like `請用繁體中文台灣口音朗讀：`
- Voice selection via instruction: `Speak with the voice named Kore.`

## Test Scripts

- `tests/tts_api/gemini-tts-sample.ts` — TTS model comparison + voice tests
- `tests/tts_api/zh-tw-test.ts` — Chinese zh_TW story generation
- `tests/embedding_api/gemini-embed-sample.ts` — Embedding tests

## Skill

- `/generate-tts` — Generate speech audio using free tier Gemini TTS
