# Engine: Edge TTS (Microsoft Neural)

**Completely free** · No API key · Requires Python + `edge-tts` · Outputs MP3

---

## Prerequisites

```bash
pip install edge-tts    # one-time setup
```

Verify:
```bash
python -m edge_tts --version    # should print: edge-tts X.X.X
```

List all available voices:
```bash
python -m edge_tts --list-voices
```

---

## Recommended Voices

### Chinese (zh-TW)
| Voice | Gender | Character |
|-------|--------|-----------|
| `zh-TW-HsiaoChenNeural` | Female | Warm, natural — **recommended default** |
| `zh-TW-YunJheNeural` | Male | Clear, professional |
| `zh-TW-HsiaoYuNeural` | Female | Bright, energetic |

### Chinese (zh-CN)
| Voice | Gender | Character |
|-------|--------|-----------|
| `zh-CN-XiaoxiaoNeural` | Female | Warm, expressive |
| `zh-CN-YunxiNeural` | Male | Clear |

### English (en-US)
| Voice | Gender | Character |
|-------|--------|-----------|
| `en-US-AriaNeural` | Female | Natural, conversational |
| `en-US-GuyNeural` | Male | Clear, professional |
| `en-US-JennyNeural` | Female | Warm |

Auto-select voice by `--lang`:
- `zh_TW` → `zh-TW-HsiaoChenNeural`
- `zh_CN` → `zh-CN-XiaoxiaoNeural`
- `en_US` → `en-US-AriaNeural`
- `ja_JP` → `ja-JP-NanamiNeural`

---

## Execution Steps

### 1. Build CLI command

Use `spawnSync` from Node/Bun's `child_process`:

```typescript
import { spawnSync } from "child_process";
import { statSync, mkdirSync, existsSync } from "fs";

function synthesize(voice: string, text: string, outPath: string, rate?: string, pitch?: string) {
  const args = [
    "-m", "edge_tts",
    "--voice", voice,
    "--text", text,
    "--write-media", outPath,
  ];
  if (rate)  args.push("--rate", rate);
  if (pitch) args.push("--pitch", pitch);

  const result = spawnSync("python", args, { encoding: "utf-8", timeout: 30_000 });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `exit ${result.status}`);
  }
  return statSync(outPath).size;
}
```

### 2. Output format

Edge TTS outputs **MP3** directly. No conversion needed. Output path should end in `.mp3`.

### 3. Output naming

Default: `./output/<slug>.mp3`  
Slug = first 5 words of text, lowercase, spaces → hyphens.

### 4. Run with error handling

```typescript
if (!existsSync("./output")) mkdirSync("./output", { recursive: true });

const outPath = "./output/my-audio.mp3";
try {
  const size = synthesize("zh-TW-HsiaoChenNeural", text, outPath, "+5%");
  console.log(`Saved: ${outPath} (${(size/1024).toFixed(1)}KB)`);
} catch (e) {
  console.error("edge-tts failed:", e.message);
}
```

---

## Rate Limits

No enforced API quota. Stays within the same engine Microsoft Edge browser uses.  
Be polite: no faster than ~3 requests/second in bulk. Add a small delay between batches.

---

## CLI Reference

```bash
# Basic
python -m edge_tts --voice zh-TW-HsiaoChenNeural --text "你好" --write-media out.mp3

# With speed/pitch
python -m edge_tts --voice en-US-AriaNeural --text "Hello" --rate "+20%" --pitch "+0Hz" --write-media out.mp3

# List voices (filter)
python -m edge_tts --list-voices | grep zh-TW
```
