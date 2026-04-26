# Voice Lookup Tables

Quick reference for selecting the right voice per engine. For multi-episode series, define mapping in `assets/voice-config.json`.

## MLX TTS (Apple Silicon, local)

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

## Gemini TTS (Google, cloud)

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

## Edge TTS (Microsoft, cloud, free)

| Model | Voice | Gender | Locale | Best For |
|-------|-------|--------|--------|----------|
| **Microsoft Neural** | `zh-TW-HsiaoChenNeural` | Female | zh-TW | Taiwanese Chinese, warm (recommended) |
| | `zh-TW-YunJheNeural` | Male | zh-TW | Taiwanese Chinese, male leads |
| | `zh-TW-HsiaoYuNeural` | Female | zh-TW | Taiwanese Chinese, youthful |
| | `zh-CN-XiaoxiaoNeural` | Female | zh-CN | Mainland Chinese, expressive |
| | `zh-CN-YunxiNeural` | Male | zh-CN | Mainland Chinese, warm male |
| | `en-US-AriaNeural` | Female | en-US | English, natural/warm |
| | `en-US-GuyNeural` | Male | en-US | English, professional |

## Cross-engine character mapping

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
1. Characters in same scene must have distinct voices
2. Voice gender should match character gender
3. Characters that never share scenes can reuse voice
4. Narrator needs distinct voice from all dialog characters
