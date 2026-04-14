---
name: generate-tts
description: >
  Use when: "generate tts", "text to speech", "tts", "voice", "narration",
  "/generate-tts", "speak", "read aloud", "audio narration", "配音", "語音".
  Triggers on: TTS, text-to-speech, voice generation, audio narration.
metadata:
  version: 2.0.0
---

# /generate-tts — Text-to-Speech Generation

Multi-engine free TTS: **Edge TTS** (Microsoft Neural, no API key) + **Gemini TTS** (Google free tier) + **MLX TTS** (Apple Silicon local).

---

## STEP 0 — Auto-test environment (ALWAYS do this first)

**Read [`env-check.md`](env-check.md) and follow its instructions.**

It runs Bash checks to detect: platform, Python/edge-tts availability, GOOGLE_API_KEY.  
It tells you which engine to use and which platform doc to load.  
Do NOT skip — engine availability differs per machine.

---

## Usage

```
/generate-tts <text> [options]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--voice <name>` | auto | Engine-specific voice name |
| `--lang <code>` | auto | Language hint: `zh_TW`, `en_US`, `ja_JP` |
| `--output <path>` | `./output/<slug>.<ext>` | Output file path |
| `--engine <name>` | auto | Force `gemini`, `edge-tts`, or `mlx-tts` |
| `--rate <pct>` | — | Speed adjustment: `+20%`, `-10%` (edge-tts only) |

**Examples:**
```
/generate-tts 從前有一座山，山裡住著一隻小貓
/generate-tts Hello world --voice Aria --engine edge-tts
/generate-tts 今天天氣真好 --voice Kore --lang zh_TW --engine gemini
/generate-tts The quick brown fox --output ./fox.mp3
```

---

## Engine Selection (after env-check)

| Condition | Use |
|-----------|-----|
| User specified `--engine` | Honor it (error if unavailable) |
| Edge TTS available (Python) | **edge-tts** — unlimited, MP3 output |
| Only Gemini key set | **gemini** — 3 req/min free, WAV output |
| MLX TTS available (Apple Silicon) | **mlx-tts** — local, WAV/FLAC output, best Chinese voices |
| Both + bulk (>3 segments) | **edge-tts** — avoids Gemini rate limit |
| Neither available | Error — show setup from env-check.md |

---

## Engine → Model → Voice Lookup Table

Quick reference for selecting the right voice. For multi-episode series, define this
mapping in `assets/voice-config.json` for consistency across all episodes.

### MLX TTS (Apple Silicon, local)

| Model | Voice | Gender | Style | Best For |
|-------|-------|--------|-------|----------|
| **Qwen3-TTS-0.6B** (default) | `uncle_fu` | Male | Uncle-style, warm | Narrator, older male characters, elders |
| | `ryan` | Male | Natural, conversational | Male protagonists, young adults |
| | `serena` | Female | Warm, expressive | Female protagonists, warm characters |
| | `vivian` | Female | Clear, articulate | Narrator, supporting female characters |
| | `eric` | Male | **Sichuan dialect** | Only when dialect explicitly requested |
| | `dylan` | Male | **Beijing dialect** | Only when dialect explicitly requested |
| **Kokoro-82M** (fallback) | `zm_yunjian` | Male | Deep, broadcast | Narrator, authoritative figures |
| | `zm_yunxi` | Male | Natural, warm | Male protagonists |
| | `zf_xiaobei` | Female | Lively, bright | Young female characters |
| | `zf_xiaoni` | Female | Gentle, soft | Motherly/gentle characters |
| | `af_heart` | Female | Warm (EN) | English female leads |
| | `am_adam` | Male | Deep (EN) | English male leads |
| | `bm_george` | Male | British (EN) | English narrator |

### Gemini TTS (Google, cloud)

| Model | Voice | Gender | Style | Best For |
|-------|-------|--------|-------|----------|
| **gemini-2.5-flash-preview-tts** | `Kore` | — | Versatile, balanced | Default/narrator |
| | `Fenrir` | Male | Deep, dramatic | Male leads, authoritative |
| | `Charon` | — | Calm, measured | Elders, mentors, authority |
| | `Orus` | — | Energetic, sharp | Young characters, action |
| | `Puck` | — | Bright, youthful | Energetic/comedic characters |
| | `Leda` | Female | Warm, mature | Female leads, warm characters |
| | `Zephyr` | — | Soft, gentle | Gentle/quiet characters |
| | `Aoede` | — | Storytelling | Narrator, dramatic reading |

### Edge TTS (Microsoft, cloud, free)

| Model | Voice | Gender | Locale | Best For |
|-------|-------|--------|--------|----------|
| **Microsoft Neural** | `zh-TW-HsiaoChenNeural` | Female | zh-TW | Taiwanese Chinese, warm (recommended) |
| | `zh-TW-YunJheNeural` | Male | zh-TW | Taiwanese Chinese, male leads |
| | `zh-TW-HsiaoYuNeural` | Female | zh-TW | Taiwanese Chinese, youthful |
| | `zh-CN-XiaoxiaoNeural` | Female | zh-CN | Mainland Chinese, expressive |
| | `zh-CN-YunxiNeural` | Male | zh-CN | Mainland Chinese, warm male |
| | `en-US-AriaNeural` | Female | en-US | English, natural/warm |
| | `en-US-GuyNeural` | Male | en-US | English, professional |

### Cross-engine character mapping example

For a character that appears across different engines (e.g., `linyi`):

```json
{
  "linyi": {
    "voices": {
      "mlx_tts": "ryan",
      "gemini": "Fenrir",
      "edge_tts": "zh-TW-YunJheNeural"
    }
  }
}
```

**Voice assignment rules:**
1. Characters in the same scene must have distinct voices
2. Voice gender should match character gender (unless comedic intent)
3. Characters that never share scenes can reuse the same voice
4. Narrator needs a distinct voice from all dialog characters in its scenes

---

## Load on Demand

After env-check determines platform + engine, read:

- Platform doc:
  - `win32` → [`platforms/windows.md`](platforms/windows.md)
  - `darwin` → [`platforms/macos.md`](platforms/macos.md)
  - `linux` → [`platforms/linux.md`](platforms/linux.md)

- Engine doc:
  - Edge TTS → [`engines/edge-tts.md`](engines/edge-tts.md)
  - Gemini → [`engines/gemini.md`](engines/gemini.md)
  - MLX TTS → [`engines/mlx-tts.md`](engines/mlx-tts.md) (Apple Silicon only)
