---
name: edge-tts
description: Microsoft Edge TTS via Python — free, no API key, Windows-compatible, zh-TW neural voices. Tested 2026-04-10.
type: project
---

# Edge TTS (Microsoft Neural)

## What It Is

Microsoft Edge's built-in TTS engine, accessible via the `edge-tts` Python package.  
Same backend as Azure Cognitive Services Neural TTS — neural quality, completely free, no API key needed.

## Setup

```bash
pip install edge-tts          # one-time
python -m edge_tts --version  # verify: edge-tts 7.2.8
```

Tested on Python 3.14 (Windows) — works fine.

## Usage Pattern (from Bun/Node)

Uses `spawnSync` from `child_process` — pure subprocess call, no WebSocket plumbing:

```typescript
import { spawnSync, statSync } from "child_process";

const result = spawnSync("python", [
  "-m", "edge_tts",
  "--voice", "zh-TW-HsiaoChenNeural",
  "--text", "你好世界",
  "--write-media", "./output/hello.mp3",
], { encoding: "utf-8", timeout: 30_000 });
```

Output is **MP3 directly** — no conversion needed, playable anywhere on Windows.

## Verified zh-TW Voices (tested 2026-04-10)

| Voice | Gender | Notes |
|-------|--------|-------|
| `zh-TW-HsiaoChenNeural` | Female | Warm, natural — **recommended default** |
| `zh-TW-YunJheNeural` | Male | Clear, professional |
| `zh-TW-HsiaoYuNeural` | Female | Bright, energetic |

## Test Results

All 3 test cases passed in `tests/tts_api/edge-tts-test.ts`:
- zh-TW-HsiaoChenNeural: 37KB MP3, 1.9s
- zh-TW-YunJheNeural: 31KB MP3, 2.8s  
- en-US-AriaNeural: 45KB MP3, 4.9s

## Rate Limits

None enforced. Same engine as Edge browser. Keep ~3 req/sec max as courtesy.

## Why Prefer Over Gemini for TTS

| Factor | Edge TTS | Gemini TTS |
|--------|----------|------------|
| API key | Not needed | Requires `GOOGLE_API_KEY` |
| Rate limit | None (personal use) | 3 req/min free tier |
| Output format | MP3 (ready to play) | Raw PCM → needs WAV header |
| Latency | ~2-5s | ~4-19s |
| zh-TW quality | Excellent (Azure Neural) | Good (auto-detected) |

## Test Script

`tests/tts_api/edge-tts-test.ts` — run with `bun tests/tts_api/edge-tts-test.ts`

## Skill Integration

`/generate-tts` skill (v2.0) auto-selects edge-tts when Python is available.  
See `.claude/skills/generate-tts/engines/edge-tts.md` for full implementation guide.

**Why:** Discovered during Windows TTS testing — edge-tts has no rate limits and outputs MP3 directly, making it the better default over Gemini for personal use.  
**How to apply:** Always check edge-tts first when user needs TTS on Windows. Suggest Gemini only if Python unavailable or user specifically wants Gemini voices.
