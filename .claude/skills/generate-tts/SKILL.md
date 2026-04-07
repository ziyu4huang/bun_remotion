---
name: generate-tts
description: >
  Use when: "generate tts", "text to speech", "tts", "voice", "narration",
  "/generate-tts", "speak", "read aloud", "audio narration", "配音", "語音".
  Triggers on: TTS, text-to-speech, voice generation, audio narration.
metadata:
  version: 1.0.0
---

# /generate-tts — Text-to-Speech via Gemini (Free Tier)

Generate speech audio using Google's `gemini-2.5-flash-preview-tts` model. No billing required.

---

## Usage

```
/generate-tts <text> [options]
```

**Arguments:**
- `<text>` — The text to speak (required). Can be any language.
- `--voice <name>` — Voice preset (default: auto). See Voices below.
- `--lang <code>` — Language hint, e.g. `zh_TW`, `en_US`, `ja_JP` (default: auto-detect from text).
- `--output <path>` — Output file path (default: `./output/<slug>.wav`).

**Examples:**
```
/generate-tts 從前有一座山，山裡住著一隻小貓
/generate-tts Hello world, this is a test
/generate-tts 今天的天氣真好 --voice Kore --lang zh_TW
/generate-tts The quick brown fox --voice Fenrir --output ./output/fox.wav
```

---

## Model

| Model | Tier | Notes |
|-------|------|-------|
| `gemini-2.5-flash-preview-tts` | Free | PCM 24kHz 16-bit mono, ~3-5s per request |
| `gemini-2.5-pro-preview-tts` | Paid only | Free tier quota = 0 |

**Always use `gemini-2.5-flash-preview-tts`.**

---

## Voices

| Voice | Description |
|-------|-------------|
| Kore | Default, versatile |
| Fenrir | Male, deep |
| Charon | Calm, measured |
| Orus | Energetic |
| Puck | Bright, youthful |
| Leda | Female, warm |
| Zephyr | Soft, gentle |
| Aoede | Storytelling |

If no voice specified, do NOT include a voice instruction — let the model auto-select.

---

## API Details

- **Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent`
- **Auth:** `x-goog-api-key` header with `GOOGLE_API_KEY` env var
- **Request body:**
  ```json
  {
    "contents": [{ "role": "user", "parts": [{ "text": "<instruction + text>" }] }],
    "generationConfig": { "responseModalities": ["AUDIO"] }
  }
  ```
- **Response:** `candidates[0].content.parts[].inlineData.data` — base64-encoded PCM audio
- **Audio format:** `audio/L16;codec=pcm;rate=24000` (24kHz, 16-bit, mono, little-endian)

---

## Execution Steps

### Step 1: Validate input
- Ensure `GOOGLE_API_KEY` env var is set. If not, tell user to set it.
- Ensure text is provided. If not, ask the user what text to speak.
- Ensure `./output/` directory exists (create if needed).

### Step 2: Build the request
- Construct the prompt text:
  - If `--lang` specified and text is CJK: prepend language instruction, e.g. `請用繁體中文台灣口音朗讀以下內容：\n{text}`
  - If `--voice` specified: prepend `Speak with the voice named {voice}.`
  - Otherwise, just use the raw text
- Set `generationConfig.responseModalities = ["AUDIO"]`

### Step 3: Call the API
- POST to the endpoint with `x-goog-api-key` header
- If HTTP 429: report quota exceeded and suggest waiting
- If other error: report the error message

### Step 4: Decode and save
- Extract base64 data from `candidates[0].content.parts[].inlineData.data`
- Decode to buffer
- Add a 44-byte WAV header (PCM 24kHz, 16-bit, mono):
  ```
  RIFF header: "RIFF", fileSize+36, "WAVE"
  fmt chunk:   "fmt ", 16, 1(PCM), 1(mono), 24000, 48000, 2, 16
  data chunk:  "data", dataSize, <pcm bytes>
  ```
- Save as `.wav` to the output path
- Default naming: `./output/<slug>.wav` where slug is first 5 words of text, lowercase, hyphens

### Step 5: Report
- Print file path, file size, duration (bytes / 48000 seconds)
- Tell the user the file is ready

---

## Prerequisites

- `GOOGLE_API_KEY` env var must be set (Google AI Studio free API key)
- No billing or Playwright required — this uses the REST API directly

---

## Error Handling

| Situation | Action |
|-----------|--------|
| `GOOGLE_API_KEY` not set | Stop and ask user to set it |
| HTTP 429 | Report quota exceeded, suggest retry after delay shown in error |
| HTTP 400 | Report the error, likely invalid request body |
| No audio in response | Log the full response and report |
| Text too long | Gemini TTS has a character limit; suggest splitting into chunks |
