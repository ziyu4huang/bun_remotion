---
name: mlx-tts-integration
description: mlx_tts Python TTS engine integrated into bun-remotion — setup, voices, story pipeline
type: project
---

# mlx_tts Integration

Python TTS engine (Kokoro-82M on Apple Silicon MLX) integrated at `mlx_tts/` within the bun-remotion repo.

**Why:** Provides local, offline, high-quality TTS for narrating Remotion videos. No API key needed; runs fully on-device via Metal.

**How to apply:** When generating audio narration for videos, or when using the `/story-to-voice` or `/generate-tts` skills.

## Location

```
bun-remotion/
  mlx_tts/                   # Python TTS engine (copied from dev_mlx/mlx_tts)
    setup.sh                 # Bootstrap: creates .venv + installs deps + downloads model
    requirements.txt         # All deps including misaki[en], jieba, fastapi, uvicorn
    story_to_voice.py        # CLI: produce, parse-chapter, init-book, produce-book
    webui.py                 # TTS Studio server (port 7860)
    story_studio.py          # Story Studio server (port 7861)
    book_manager.py          # Book project CRUD
    mlx_tts/                 # Core library package
      generator.py           # TTSGenerator class wrapping Kokoro-82M
      voices.py              # Voice catalog, emotions, languages
      cli.py                 # Basic CLI
    stories/                 # Single-story .story.json files
    books/                   # Multi-chapter book projects
  output/                    # Generated audio output (gitignored via **/output/)
```

## Setup (fresh machine)

```bash
cd mlx_tts
./setup.sh              # creates .venv, installs deps, pre-downloads model
# or skip model download:
./setup.sh --no-model
```

**Requirements:** macOS Apple Silicon (M1/M2/M3/M4), Python 3.11+

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `mlx-audio>=0.4.0` | Kokoro-82M TTS engine on MLX |
| `misaki[en]>=0.9.4` | G2P engine (MUST use `[en]` extra — includes `num2words`) |
| `jieba>=0.42.1` | Chinese word segmentation |
| `fastapi` + `uvicorn` | WebUI servers |
| `anthropic` | AI story/content generation (needs `ANTHROPIC_API_KEY`) |

## Model

- **ID:** `mlx-community/Kokoro-82M-bf16`
- **Size:** ~350 MB, cached in `~/.cache/huggingface/hub/`
- **Auto-downloads** on first use; also downloads `en_core_web_sm` spacy model on first EN generation
- **Sample rate:** 24000 Hz

## Voice Catalog

### Chinese (Mandarin)
| Voice | Gender | Style |
|-------|--------|-------|
| `zm_yunjian` | Male | Deep, broadcast — Narrator |
| `zm_yunxi` | Male | Warm, natural — Male protagonist |
| `zf_xiaobei` | Female | Lively, bright — Female protagonist |
| `zf_xiaoni` | Female | Gentle, soft — Motherly |

### English (British)
| Voice | Gender | Style |
|-------|--------|-------|
| `bm_george` | Male | Classic, rich — default EN narrator |
| `bm_lewis` | Male | Calm, steady |
| `bf_emma` | Female | Elegant |

### English (American)
| Voice | Gender | Style |
|-------|--------|-------|
| `am_adam` | Male | Deep, resonant |
| `af_heart` | Female | Warm, emotional |
| `af_bella` | Female | Bright, energetic |

## Produce Audio

```bash
# Single story JSON → audio
.venv/bin/python story_to_voice.py produce path/to/story.json --output path/to/out.flac

# Multi-chapter book
.venv/bin/python story_to_voice.py produce-book books/<name>/
```

## Story JSON Format

Output to `output/` (gitignored). Key fields per segment:
- `voice`: voice ID (e.g. `bm_george`, `zm_yunxi`, `zf_xiaobei`)
- `lang`: `"en-gb"`, `"en-us"`, `"zh"`, `"ja"`, `"es"`
- `emotion`: `neutral` | `happy` | `excited` | `sad` | `calm` | `serious` | `whispery` | `storytelling`
- `speed`: float (emotion table defaults: calm=0.92, sad=0.85, whispery=0.88, storytelling=0.97)

## Performance (M-series Apple Silicon)

- RTF ~0.13–0.32x (produces audio 3–8x faster than real-time)
- 54s story → produced in ~7.6s

## Skill

`/story-to-voice` skill at `.claude/skills/story-to-voice/SKILL.md` — full instructions for single stories and multi-chapter books.
