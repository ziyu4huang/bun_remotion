# Engine: Gemini TTS

**Free tier** · Requires `GOOGLE_API_KEY` · Outputs WAV (PCM + header) · 3 req/min

---

## Model

```
gemini-2.5-flash-preview-tts   ✅ free tier works
gemini-2.5-pro-preview-tts     ❌ quota = 0 on free tier
```

Always use `gemini-2.5-flash-preview-tts`.

---

## Voices

| Voice | Character |
|-------|-----------|
| Kore | Versatile (good default) |
| Fenrir | Male, deep |
| Charon | Calm, measured |
| Orus | Energetic |
| Puck | Bright, youthful |
| Leda | Female, warm |
| Zephyr | Soft, gentle |
| Aoede | Storytelling |

If no `--voice` given, do NOT include a voice instruction — let the model auto-select.

---

## Execution Steps

### 1. Build prompt text

```
[optional] Speak with the voice named {voice}.
[optional for CJK] 請用繁體中文台灣口音朗讀以下內容：
{text}
```

- Combine all instructions into a single `parts[].text` string.
- For `--lang zh_TW`: prepend `請用繁體中文台灣口音朗讀以下內容：\n`
- For `--lang ja_JP`: prepend `以下の文章を日本語で読んでください：\n`

### 2. API call (Bun fetch)

Write and run this as a Bun TypeScript snippet:

```typescript
import { writeFileSync, mkdirSync, existsSync } from "fs";

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = "gemini-2.5-flash-preview-tts";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const promptText = /* assembled prompt */;
const body = {
  contents: [{ role: "user", parts: [{ text: promptText }] }],
  generationConfig: { responseModalities: ["AUDIO"] },
};

const res = await fetch(url, {
  method: "POST",
  headers: { "x-goog-api-key": API_KEY!, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
const data = await res.json();
const part = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
if (!part) throw new Error("No audio in response: " + JSON.stringify(data));

const pcm = Buffer.from(part.inlineData.data, "base64");
```

### 3. Add WAV header (required — Gemini outputs raw PCM)

Gemini returns `audio/L16;codec=pcm;rate=24000` — raw bytes, NOT a valid audio file.  
Add a 44-byte RIFF/WAV header so it can be opened on any OS:

```typescript
function pcmToWav(pcm: Buffer, sampleRate = 24000, ch = 1, bits = 16): Buffer {
  const byteRate = (sampleRate * ch * bits) / 8;
  const blockAlign = (ch * bits) / 8;
  const hdr = Buffer.alloc(44);
  hdr.write("RIFF", 0);
  hdr.writeUInt32LE(36 + pcm.length, 4);
  hdr.write("WAVE", 8);
  hdr.write("fmt ", 12);
  hdr.writeUInt32LE(16, 16);
  hdr.writeUInt16LE(1, 20);       // PCM
  hdr.writeUInt16LE(ch, 22);
  hdr.writeUInt32LE(sampleRate, 24);
  hdr.writeUInt32LE(byteRate, 28);
  hdr.writeUInt16LE(blockAlign, 32);
  hdr.writeUInt16LE(bits, 34);
  hdr.write("data", 36);
  hdr.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([hdr, pcm]);
}

const wav = pcmToWav(pcm);
writeFileSync(outPath, wav);   // outPath ends in .wav
```

### 4. Output naming

Default: `./output/<slug>.wav`  
Slug = first 5 words of text, lowercase, spaces → hyphens, strip non-ascii.

---

## Rate Limits (Free Tier)

| Limit | Value |
|-------|-------|
| Requests per minute | **3** |
| Daily quota | Limited (reset at midnight PT) |
| On 429 | Wait for `retryDelay` from error body, then retry |

For >3 items, add a 25-second delay between requests or switch to edge-tts.

---

## Error Handling

| Error | Action |
|-------|--------|
| HTTP 429 | Show retryDelay from error, wait, retry once |
| HTTP 400 | Log body — usually malformed request |
| `text` part in response instead of audio | Model refused — simplify the prompt |
| `GOOGLE_API_KEY` not set | Stop, tell user to set env var |
