---
name: mlx-tts-models
description: MLX-compatible TTS models — Qwen3-TTS (default) and Kokoro-82M — voice catalogs, benchmarks, memory usage
type: project
---

# MLX TTS Models

## Current Default

**Qwen3-TTS-12Hz-0.6B-CustomVoice-8bit** (`mlx-community/Qwen3-TTS-12Hz-0.6B-CustomVoice-8bit`)
- Size: 1.2 GB on disk
- Peak memory: ~4 GB (M1 8GB safe)
- RTF: ~0.78-0.96x (faster than realtime)
- Voice cloning: Yes (via ref_audio + ref_text)
- License: Apache-2.0
- Requires: Python 3.11+, `mlx-audio>=0.2.9`, `mlx-lm>=0.29.1`
- venv: `mlx_tts/.venv/`

## Fallback: Kokoro-82M

**Kokoro-82M-bf16** (`mlx-community/Kokoro-82M-bf16`)
- Size: ~350 MB on disk
- Peak memory: ~1 GB
- RTF: ~1.4x (slower than realtime)
- Voice cloning: No
- License: Apache-2.0

## Qwen3-TTS Voice Catalog (9 preset)

| Voice | Gender | Language | Accent | Notes |
|-------|--------|----------|--------|-------|
| `serena` | Female | Chinese (Mandarin) | Standard | Warm, default Chinese |
| `vivian` | Female | Chinese (Mandarin) | Standard | Clear |
| `aiden` | Male | English | American | |
| `ryan` | Male | English | American | Natural, conversational |
| `ono_anna` | Female | Japanese | Standard | |
| `sohee` | Female | Korean | Standard | |
| `uncle_fu` | Male | Chinese (Mandarin) | Standard | Uncle-style, narrator |
| `eric` | Male | Chinese | **Sichuan dialect** | Dialect — avoid unless requested |
| `dylan` | Male | Chinese | **Beijing dialect** | Dialect — avoid unless requested |

**Dialect rule:** Do NOT use `eric` or `dylan` unless the user explicitly requests Sichuan or Beijing dialect. Default to standard Mandarin voices.

## Kokoro-82M Voice Catalog (23 preset)

| Voice | Gender | Language | Accent | Style |
|-------|--------|----------|--------|-------|
| `af_heart` | Female | English (US) | American | Warm, expressive |
| `af_sarah` | Female | English (US) | American | Professional |
| `af_bella` | Female | English (US) | American | Bright, energetic |
| `af_sky` | Female | English (US) | American | Calm, soothing |
| `af_nicole` | Female | English (US) | American | Natural conversational |
| `af_nova` | Female | English (US) | American | Smooth, confident |
| `am_adam` | Male | English (US) | American | Deep, authoritative |
| `am_michael` | Male | English (US) | American | Friendly, clear |
| `am_echo` | Male | English (US) | American | Resonant |
| `am_liam` | Male | English (US) | American | Casual, relaxed |
| `bf_emma` | Female | English (UK) | British | Elegant, precise |
| `bf_isabella` | Female | English (UK) | British | Warm, refined |
| `bm_george` | Male | English (UK) | British | Classic, distinguished |
| `bm_lewis` | Male | English (UK) | British | Calm, measured |
| `bm_daniel` | Male | English (UK) | British | Formal newsreader |
| `zf_xiaobei` | Female | Chinese | Mandarin | Lively, youthful |
| `zf_xiaoni` | Female | Chinese | Mandarin | Gentle, warm |
| `zm_yunjian` | Male | Chinese | Mandarin | Deep, broadcast |
| `zm_yunxi` | Male | Chinese | Mandarin | Natural, conversational |
| `jf_alpha` | Female | Japanese | Standard | Clear, expressive |
| `jf_gongitsune` | Female | Japanese | Standard | Storyteller |
| `jm_kumo` | Male | Japanese | Standard | Calm, measured |

## Supported Languages (Qwen3-TTS)

Chinese, English, Japanese, Korean, German, Italian, Portuguese, Spanish, French, Russian, Beijing dialect, Sichuan dialect (auto-detected from text).

## Memory Usage Benchmarks (M1 8GB)

### Qwen3-TTS-0.6B-CustomVoice-8bit

| Metric | Value |
|--------|-------|
| Model load time | ~3.6-4.1s |
| Peak GPU memory (per segment) | **5.35-6.21 GB** |
| Avg GPU memory (per segment) | ~5.96 GB |
| Peak RSS (first segment cold) | ~1029 MB |
| Avg RSS (steady state) | ~630 MB |
| RTF per segment | ~1.15-1.31x |
| Overall RTF (19 seg story) | 0.79x |
| Story: 19 seg, 2.8 min audio | 131s wall time, 3678 KB FLAC |

**Per-voice memory (Qwen3-TTS):**
| Voice | Avg Peak | Segments |
|-------|----------|----------|
| `uncle_fu` | 5.94 GB | 8 |
| `serena` | 6.00 GB | 6 |
| `vivian` | 5.96 GB | 5 |

**Memory pattern:** First segment spikes higher (cold cache). Subsequent segments stabilize around 5.6-6.2 GB. `mx.clear_cache()` between segments helps. Memory is voice-independent — all voices use similar GPU memory.

**Estimation formula:** For a story with N segments of ~10s audio each:
- Total audio: N * 10s
- Wall time: ~N * 7s (0.79x RTF)
- Peak GPU: ~6.2 GB (constant after first segment)
- RSS: ~1 GB

### Kokoro-82M-bf16

| Metric | Value |
|--------|-------|
| Model load time | ~1.9s |
| Peak GPU memory | ~0.7-1.0 GB |
| RTF | ~1.4x (slower than realtime) |

### M1 8GB Safety Assessment

- **Qwen3-TTS: Tight but workable.** Peak 6.2 GB leaves ~1.8 GB for macOS + other apps. Close tabs and heavy apps before generation. First segment is highest risk.
- **Kokoro-82M: Very safe.** Peak ~1 GB, plenty of headroom.
- **Recommendation:** Use Qwen3-TTS for quality, switch to Kokoro if system is memory-constrained.

**Why:** Need accurate memory estimates for M1 8GB constraint.
**How to apply:** When user asks about memory, feasibility, or performance estimates for story generation.
