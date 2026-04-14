# Engine: MLX TTS (Apple Silicon)

**Free** · Local · Requires Python + mlx-audio + Apple Silicon Mac · Outputs WAV/FLAC

---

## Prerequisites

```bash
pip install mlx-audio        # central MLX TTS library (github.com/Blaizzy/mlx-audio)
pip install misaki[zh]       # Chinese G2P for Kokoro voices
```

Verify:
```bash
python -c "import mlx_audio; print('mlx-audio OK')"
```

---

## Model Comparison (M1 8GB)

### Tier 1: Best for M1 8GB + Chinese

| Model | Params | Memory | Chinese Voices | License | HuggingFace |
|-------|--------|--------|---------------|---------|-------------|
| **Kokoro-82M v1.1-zh** | 82M | ~400MB | **~100+** (`zf_*` female, `zm_*` male) | Apache-2.0 | `davidxifeng/Kokoro-82M-v1.1-zh` |
| **Qwen3-TTS-0.6B** | 0.6B | ~1-2GB | Preset + voice cloning | Apache-2.0 | `mlx-community/Qwen3-TTS-12Hz-0.6B-Base-8bit` |
| **Spark-TTS-0.5B** | 0.5B | ~1-2GB | Preset | CC-BY-NC-SA | `mlx-community/Spark-TTS-0.5B-bf16` |

### Tier 2: Larger / Specialized

| Model | Params | Memory | Chinese Voices | License | HuggingFace |
|-------|--------|--------|---------------|---------|-------------|
| **Chatterbox-4bit** | 1.5B | ~1-2GB | Expressive/emotional | MIT | `mlx-community/chatterbox-fp16` |
| **Ming-omni-tts-0.5B** | 0.5B | ~1-2GB | Voice cloning | Apache-2.0 | `mlx-community/Ming-omni-tts-0.5B-4bit` |
| **LongCat-AudioDiT-1B** | 1B | ~2-3GB | Voice cloning | MIT | `mlx-community/LongCat-AudioDiT-1B-bf16` |
| **Qwen3-TTS-1.7B-4bit** | 1.7B | ~2-3GB | Same as 0.6B, higher quality | Apache-2.0 | `mlx-community/Qwen3-TTS-12Hz-1.7B-Base-4bit` |

### Non-MLX Alternatives (for reference)

| Tool | Type | Chinese Voices | Memory | Notes |
|------|------|---------------|--------|-------|
| edge-tts | Cloud (free) | 40+ (zh-TW, zh-CN) | 0 MB | Microsoft Edge API, needs internet |
| ChatTTS | Local (PyTorch) | Multiple expressive styles | ~2-4GB | Tight on 8GB, community MLX port exists |

---

## Recommended Voices

### Qwen3-TTS (default, best quality)

| Voice | Gender | Personality | Best For |
|-------|--------|-------------|----------|
| `uncle_fu` | Male | Uncle-style, warm | Narrator, older male characters |
| `ryan` | Male | Natural, conversational | Male protagonists, young adults |
| `aiden` | Male | American English | English-speaking characters |
| `serena` | Female | Warm, expressive | Female protagonists, narrators |
| `vivian` | Female | Clear | Supporting female characters |

**Dialect Rule:** Qwen3-TTS has two dialect voices (`eric` = Sichuan, `dylan` = Beijing). **Do NOT use dialect voices unless the user explicitly requests a specific dialect.**

**Qwen3-TTS Notes:**
- Emotion `speed` field is ignored — it has no speed parameter. Keep in JSON for Kokoro compatibility.
- Language is auto-detected from text — the `lang` field is informational only.
- Memory: Peak ~6.2 GB GPU. First segment has cold-start spike (~1 GB RSS). Close heavy apps on M1 8GB.
- Segment length: Keep under ~15s output (roughly 2-3 sentences).

### Kokoro-82M (fallback, fast + light)

| Voice | Gender | Personality | Best For |
|-------|--------|-------------|----------|
| `zm_yunjian` | Male | Deep, broadcast | Narrator, authoritative figures |
| `zm_yunxi` | Male | Natural, warm | Male protagonists, love interests |
| `zf_xiaobei` | Female | Lively, bright | Female protagonists, young women |
| `zf_xiaoni` | Female | Gentle, soft | Motherly figures, gentle characters |

### English Voices

| Voice | Gender | Personality | Best For |
|-------|--------|-------------|----------|
| `af_heart` | Female | Warm, emotional | Female protagonists |
| `af_sarah` | Female | Professional | Authority figures |
| `af_nova` | Female | Confident | Strong female leads |
| `am_adam` | Male | Deep, resonant | Male protagonists |
| `bm_george` | Male | Classic, rich (British) | Narrator (default for EN) |

### Japanese Voices

| Voice | Gender | Personality | Best For |
|-------|--------|-------------|----------|
| `jm_kumo` | Male | Calm | Narrator, male leads |
| `jf_alpha` | Female | Expressive | Female leads |

---

## Available Emotions

| Key | Label | Speed Mult | Use For |
|-----|-------|-----------|---------|
| `neutral` | Neutral | 1.0x | Default dialogue |
| `happy` | Happy | 1.08x | Joyful, warm moments |
| `excited` | Excited | 1.18x | Action, surprise, energy |
| `sad` | Sad | 0.85x | Loss, sorrow, melancholy |
| `calm` | Calm | 0.92x | Peaceful, endings, reflection |
| `serious` | Serious | 0.95x | Authority, tension, danger |
| `whispery` | Whispery | 0.88x | Intimate, secrets, close |
| `storytelling` | Storytelling | 0.97x | Narration, reading aloud |

---

## Upgrade Path

### Quick Win: Kokoro-82M v1.1-zh
Same architecture as current model, just swap the model ID:
- 100+ Chinese voices vs original 2
- Same memory footprint (~400MB)
- Same mlx-audio API, minimal code changes
- Uses `misaki[zh]` for Chinese G2P

### Bigger Leap: Qwen3-TTS-0.6B
- State-of-the-art quality from Alibaba
- Voice cloning + custom voice design from text descriptions
- 10 languages supported
- Slightly more memory (~1-2GB) but fits M1 8GB

## Resources

- **mlx-audio**: https://github.com/Blaizzy/mlx-audio
- **Qwen3-TTS macOS app**: https://github.com/kapi2800/qwen3-tts-apple-silicon
- **F5-TTS MLX**: https://github.com/lucasnewman/f5-tts-mlx (voice cloning)
