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

## STEP 0 — Auto-test environment (ALWAYS do this first)

**Read [`env-check.md`](env-check.md) and follow its instructions.**

It detects: platform, Python/edge-tts availability, GOOGLE_API_KEY. Do NOT skip.

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

## Engine Selection (after env-check)

| Condition | Use |
|-----------|-----|
| User specified `--engine` | Honor it |
| Edge TTS available | **edge-tts** — unlimited, MP3 |
| Only Gemini key | **gemini** — 3 req/min free, WAV |
| MLX TTS available (Apple Silicon) | **mlx-tts** — local, best Chinese voices |
| Both + bulk (>3 segments) | **edge-tts** — avoids rate limit |

## Load on Demand

- Platform doc: [`platforms/windows.md`](platforms/windows.md) / [`platforms/macos.md`](platforms/macos.md) / [`platforms/linux.md`](platforms/linux.md)
- Engine doc: [`engines/edge-tts.md`](engines/edge-tts.md) / [`engines/gemini.md`](engines/gemini.md) / [`engines/mlx-tts.md`](engines/mlx-tts.md)
- Voice tables: [`references/voices.md`](references/voices.md) — MLX, Gemini, Edge TTS voice lookup + cross-engine mapping
