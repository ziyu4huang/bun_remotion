---
name: mlx-tts-integration
description: mlx_tts Python TTS engine — Qwen3-TTS (default) + Kokoro-82M, setup, voices, story pipeline
type: project
---

# mlx_tts Integration

Python TTS engine (Qwen3-TTS + Kokoro on Apple Silicon MLX) integrated at `mlx_tts/` within the bun-remotion repo.

**Why:** Provides local, offline, high-quality TTS for narrating Remotion videos. No API key needed; runs fully on-device via Metal.
**How to apply:** When generating audio narration for videos, or when using the `/story-to-voice` or `/generate-tts` skills.

## Location

```
bun-remotion/
  mlx_tts/
    .venv/                    # Python 3.11 venv (REQUIRED — Python 3.9 incompatible)
    models/                   # Locally cached models
      Qwen3-TTS-12Hz-0.6B-CustomVoice-8bit/  # Default model
    setup.sh
    requirements.txt
    story_to_voice.py
    webui.py
    story_studio.py
    book_manager.py
    mlx_tts/
      generator.py             # TTSGenerator — supports Kokoro + Qwen3 backends
      voices.py                # Voice catalog for both models
      cli.py
    stories/
    books/
  output/                      # Generated audio (gitignored)
```

## Setup

```bash
cd mlx_tts
python3.11 -m venv .venv
source .venv/bin/activate
pip install mlx-audio mlx-lm einops soundfile sounddevice
```

**Requirements:** macOS Apple Silicon (M1+), Python 3.11+ (3.9 incompatible due to type union syntax)

## Default Model

**Qwen3-TTS-12Hz-0.6B-CustomVoice-8bit** — set as `DEFAULT_MODEL` in `generator.py`
- Better Chinese quality than Kokoro
- 9 preset voices + voice cloning
- ~1.2 GB, ~4 GB peak memory

## Produce Audio

```bash
source mlx_tts/.venv/bin/activate
cd mlx_tts
python -m mlx_tts save "text" -o output.wav --voice serena --lang zh
python -m mlx_tts speak "text" --voice serena
```

## Speech Rate (Qwen3-TTS)

- **~3 Chinese chars/sec** at default speed (speed = 1.0 or 0.97)
- 8-second scene → max ~24 chars of Chinese narration text
- 12-second scene → max ~36 chars
- Each `python -m mlx_tts save` invocation **reloads the model** (~4.2s overhead)
  - For 7 scenes: ~29s overhead on top of generation time
  - Use `batch` command or `stv.sh produce` to load model once if generating many segments

## Remotion Integration Pattern

When using mlx_tts for Remotion per-scene audio:
1. Generate per-scene WAV files via `python -m mlx_tts save` (from `generate-tts.ts`)
2. Use `calculateMetadata` + `ffprobe` in Root.tsx to measure actual audio durations
3. Pass `sceneDurations: number[]` as props → each `<Sequence>` adapts to audio length
4. Story.json at `mlx_tts/stories/<name>.story.json` serves as spec + full preview audiobook
   - Run `scripts/stv.sh produce` for a concatenated preview; per-scene files come from generate-tts.ts

## Story JSON Voice Assignment (Qwen3-TTS)

- Narrator (male): `uncle_fu`
- Male protagonist: `ryan`
- Female protagonist: `serena`
- **Never use dialect voices** (`eric`, `dylan`) unless user explicitly requests
- Language auto-detected by Qwen3-TTS — `lang` field is informational

## Skill

`/story-to-voice` at `.claude/skills/story-to-voice/SKILL.md`
