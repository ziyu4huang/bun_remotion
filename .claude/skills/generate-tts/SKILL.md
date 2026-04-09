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

Multi-engine free TTS: **Edge TTS** (Microsoft Neural, no API key) + **Gemini TTS** (Google free tier).

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
| `--engine <name>` | auto | Force `gemini` or `edge-tts` |
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
| Both + bulk (>3 segments) | **edge-tts** — avoids Gemini rate limit |
| Neither available | Error — show setup from env-check.md |

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
