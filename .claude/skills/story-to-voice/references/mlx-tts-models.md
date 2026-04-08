# MLX TTS Model Reference

Comparison of MLX-compatible TTS models for Apple Silicon M1 (8GB).

**Last updated:** 2026-04-08

## Ecosystem

All models below run via [mlx-audio](https://github.com/Blaizzy/mlx-audio) (6,618 stars):
```bash
pip install mlx-audio
```

## Model Comparison

### Tier 1: Best for M1 8GB + Chinese

| Model | Params | Memory | Chinese Voices | License | HuggingFace |
|-------|--------|--------|---------------|---------|-------------|
| **Kokoro-82M v1.1-zh** | 82M | ~400MB | **~100+** (`zf_001`~`zf_099` female, `zm_009`~`zm_100` male) | Apache-2.0 | `davidxifeng/Kokoro-82M-v1.1-zh` |
| **Qwen3-TTS-0.6B** | 0.6B | ~1-2GB | Preset + voice cloning | Apache-2.0 | `mlx-community/Qwen3-TTS-12Hz-0.6B-Base-8bit` |
| **Spark-TTS-0.5B** | 0.5B | ~1-2GB | Preset | **CC-BY-NC-SA** (non-commercial) | `mlx-community/Spark-TTS-0.5B-bf16` |

### Tier 2: Larger / Specialized

| Model | Params | Memory | Chinese Voices | License | HuggingFace |
|-------|--------|--------|---------------|---------|-------------|
| **Chatterbox-4bit** | 1.5B | ~1-2GB (4bit) | Expressive/emotional | MIT | `mlx-community/chatterbox-fp16` |
| **Ming-omni-tts-0.5B** | 0.5B | ~1-2GB | Voice cloning | Apache-2.0 | `mlx-community/Ming-omni-tts-0.5B-4bit` |
| **LongCat-AudioDiT-1B** | 1B | ~2-3GB | Voice cloning | MIT | `mlx-community/LongCat-AudioDiT-1B-bf16` |
| **Qwen3-TTS-1.7B-4bit** | 1.7B | ~2-3GB (4bit) | Same as 0.6B, higher quality | Apache-2.0 | `mlx-community/Qwen3-TTS-12Hz-1.7B-Base-4bit` |

### Non-MLX Alternatives (for reference)

| Tool | Type | Chinese Voices | Memory | Notes |
|------|------|---------------|--------|-------|
| **edge-tts** | Cloud (free) | 40+ (zh-TW, zh-CN) | 0 MB | Microsoft Edge API, needs internet |
| **ChatTTS** | Local (PyTorch) | Multiple expressive styles | ~2-4GB | Tight on 8GB, community MLX port exists |

## Current Setup

- **Model:** `mlx-community/Kokoro-82M-bf16` (English-only, 82M)
- **Engine:** `mlx_tts/generator.py` wrapping mlx-audio KokoroModel
- **Limitation:** Only 2 Chinese female voices (`zf_xiaobei`, `zf_xiaoni`)

## Upgrade Path

### Quick Win: Kokoro-82M v1.1-zh
Same architecture as current model, just swap the model ID:
- 100+ Chinese voices vs current 2
- Same memory footprint (~400MB)
- Same mlx-audio API, minimal code changes
- Uses `misaki[zh]` for Chinese G2P (already installed)

### Bigger Leap: Qwen3-TTS-0.6B
- State-of-the-art quality from Alibaba
- Voice cloning + custom voice design from text descriptions
- 10 languages supported
- Slightly more memory (~1-2GB) but fits M1 8GB
- Has a dedicated macOS app: https://github.com/kapi2800/qwen3-tts-apple-silicon

## GitHub Resources

- **mlx-audio**: https://github.com/Blaizzy/mlx-audio — Central MLX TTS library
- **Qwen3-TTS macOS app**: https://github.com/kapi2800/qwen3-tts-apple-silicon (439 stars)
- **Qwen3-TTS WebUI**: https://github.com/Blizaine/Qwen3-TTS-MLX-WebUI-Enhanced (39 stars)
- **F5-TTS MLX**: https://github.com/lucasnewman/f5-tts-mlx (614 stars, voice cloning)
- **speech-swift**: https://github.com/soniqo/speech-swift (559 stars, Swift native)
