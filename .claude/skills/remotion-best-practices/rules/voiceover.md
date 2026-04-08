---
name: voiceover
description: Adding AI-generated voiceover to Remotion compositions using TTS
metadata:
  tags: voiceover, audio, tts, speech, gemini, mlx-tts, calculateMetadata, dynamic duration
---

# Adding AI voiceover to a Remotion composition

Generate speech audio per scene, then use [`calculateMetadata`](./calculate-metadata) to dynamically size the composition to match the audio.

## TTS Provider Options

### Option A — Gemini TTS (recommended, free tier)

Uses `gemini-2.5-flash-preview-tts` via Google AI Studio. No billing required.

**Prerequisites:** `GOOGLE_API_KEY` env var (get from [aistudio.google.com/apikey](https://aistudio.google.com/apikey))

### Option B — mlx_tts (local, offline, Apple Silicon)

Uses Qwen3-TTS or Kokoro running on-device via MLX. Better Chinese quality. No API key.

**Prerequisites:** macOS Apple Silicon (M1+), Python 3.11+, setup at `mlx_tts/` in repo root.

```bash
source mlx_tts/.venv/bin/activate
cd mlx_tts
python -m mlx_tts save "text" -o public/audio/01-title.wav --voice uncle_fu --lang zh
```

See `.agent/memory/project/mlx-tts-integration.md` for full setup.

### Option C — ElevenLabs

Requires `ELEVENLABS_API_KEY`. High quality but paid.

```ts
const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: "Welcome to the show.",
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
    }),
  },
);
const audioBuffer = Buffer.from(await response.arrayBuffer());
writeFileSync(`public/audio/${scene.id}.mp3`, audioBuffer);
```

---

## add-tts — Full Workflow

### File Structure

```
apps/<my-video>/
  scripts/
    narration.ts          # Narration text per scene
    generate-tts.ts       # TTS generation script (Gemini)
  public/
    audio/
      .gitkeep            # tracked (keeps dir in git)
      01-scene.wav        # generated (gitignored)
  src/
    <Composition>.tsx     # <Audio> added to each <Sequence>
```

### Step 1: Create narration scripts (`scripts/narration.ts`)

```typescript
export interface NarrationScript {
  scene: string;    // matches scenes/<Name>.tsx
  file: string;     // output filename in public/audio/
  text: string;     // narration text
}

export const narrations: NarrationScript[] = [
  { scene: "TitleScene",  file: "01-title.wav",  text: "歡迎觀看..." },
  { scene: "SceneTwo",    file: "02-scene.wav",   text: "第二段內容..." },
];
```

**Pacing guidelines (Qwen3-TTS measured at speed=0.97):**
- Each Chinese character ≈ **0.33s** (~3 chars/sec, ~180 chars/min)
- For an 8-second (240-frame) scene: max ~24 chars
- For a 12-second scene: max ~36 chars
- **Use `calculateMetadata` to size scenes to audio duration** — don't try to match text to fixed frame counts. Let audio drive scene length.
- Leave 1–2 seconds at the start so narration doesn't begin before visuals appear

> **Note:** If using mlx_tts, each `python -m mlx_tts save` invocation reloads the model (~4s overhead). For 7+ scenes this adds ~30s total. This is acceptable but use `stv.sh produce` for preview audiobooks where you want a single model load.

### Step 2: Create TTS generation script (`scripts/generate-tts.ts`)

```typescript
import { narrations } from "./narration";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = join(__dirname, "..", "public", "audio");

const API_KEY = process.env.GOOGLE_API_KEY!;
const MODEL = "gemini-2.5-flash-preview-tts";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
// Voices: Kore (calm/clear), Aoede (warm), Charon (deep), Fenrir (expressive)
const VOICE = "Kore";
const SAMPLE_RATE = 24000;
const BYTE_RATE = SAMPLE_RATE * 2; // 16-bit mono

function createWavHeader(dataSize: number): Buffer {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(dataSize + 36, 4);
  h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22); h.writeUInt32LE(SAMPLE_RATE, 24);
  h.writeUInt32LE(BYTE_RATE, 28); h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34); h.write("data", 36);
  h.writeUInt32LE(dataSize, 40);
  return h;
}

async function generateTts(text: string, retries = 3): Promise<Buffer> {
  const prompt = `請用繁體中文台灣口音朗讀以下內容：\n${text}`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
          },
        },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const audioPart = data.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData?.mimeType?.startsWith("audio/")
      );
      if (!audioPart?.inlineData?.data) throw new Error("No audio in response");
      return Buffer.from(audioPart.inlineData.data, "base64");
    }
    if (res.status === 429 && attempt < retries) {
      const body = await res.text();
      const match = body.match(/retry in ([\d.]+)s/);
      const delaySec = match ? parseFloat(match[1]) + 2 : 35;
      console.log(`  Rate limited. Waiting ${delaySec}s...`);
      await new Promise((r) => setTimeout(r, delaySec * 1000));
      continue;
    }
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  throw new Error("Max retries exceeded");
}

async function main() {
  mkdirSync(AUDIO_DIR, { recursive: true });
  const skipExisting = process.argv.includes("--skip-existing");
  console.log(`Generating TTS for ${narrations.length} scene(s)...`);

  for (let i = 0; i < narrations.length; i++) {
    const { scene, file, text } = narrations[i];
    const outputPath = join(AUDIO_DIR, file);
    if (skipExisting && existsSync(outputPath)) {
      console.log(`[${i + 1}] ${scene} — skipped`);
      continue;
    }
    console.log(`[${i + 1}/${narrations.length}] ${scene}: ${text}`);
    const pcm = await generateTts(text);
    writeFileSync(outputPath, Buffer.concat([createWavHeader(pcm.length), pcm]));
    console.log(`  → ${file} (${(pcm.length / BYTE_RATE).toFixed(1)}s)`);
    if (i < narrations.length - 1) await new Promise((r) => setTimeout(r, 2000));
  }
}

main();
```

### Step 3: Add `<Audio>` to the composition

```typescript
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";

export const MyVideo: React.FC = () => (
  <AbsoluteFill>
    <Sequence from={0} durationInFrames={240}>
      <TitleScene />
      <Audio src={staticFile("audio/01-title.wav")} volume={1} />
    </Sequence>
    <Sequence from={240} durationInFrames={240}>
      <SceneTwo />
      <Audio src={staticFile("audio/02-scene.wav")} volume={1} />
    </Sequence>
  </AbsoluteFill>
);
```

Audio plays only during its `<Sequence>` window. Remotion automatically embeds audio into the rendered MP4.

### Step 4: Add npm scripts

```json
// apps/<my-video>/package.json
{
  "scripts": {
    "generate-tts": "bun run scripts/generate-tts.ts",
    "generate-tts:skip": "bun run scripts/generate-tts.ts --skip-existing"
  }
}
```

```json
// root package.json (convenience shortcut)
{
  "scripts": {
    "generate-tts:<name>": "cd apps/<my-video> && bun run generate-tts"
  }
}
```

### Step 5: Generate and render

```bash
# Generate audio files
bun run generate-tts:<name>

# Preview with audio in Remotion Studio
bun start:<name>

# Render MP4 with embedded audio
bun run build:<name>
```

---

## Dynamic composition duration with calculateMetadata

When audio duration drives the composition length, use [`calculateMetadata`](./calculate-metadata.md). Since `calculateMetadata` runs in Node.js, use `ffprobe` (always available since Remotion requires FFmpeg) to measure durations:

```tsx
// src/Root.tsx
import { Composition, CalculateMetadataFunction } from "remotion";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = join(__dirname, "..", "public", "audio");
const FPS = 30;

const AUDIO_FILES = ["01-title.wav", "02-scene.wav", "03-outro.wav"];

function audioFrames(filename: string): number {
  const absPath = join(AUDIO_DIR, filename);
  if (!existsSync(absPath)) return 240; // fallback when not yet generated
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${absPath}"`,
      { encoding: "utf-8" }
    ).trim();
    return Math.ceil(parseFloat(out) * FPS) + 15; // +15 frame trailing buffer
  } catch {
    return 240;
  }
}

type Props = { sceneDurations: number[] };

const calculateMetadata: CalculateMetadataFunction<Props> = async () => {
  const sceneDurations = AUDIO_FILES.map(audioFrames);
  return {
    durationInFrames: sceneDurations.reduce((sum, d) => sum + d, 0),
    props: { sceneDurations },
  };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MyVideo"
    component={MyVideo}
    durationInFrames={AUDIO_FILES.length * 240}    // fallback default
    fps={FPS}
    width={1920}
    height={1080}
    defaultProps={{ sceneDurations: AUDIO_FILES.map(() => 240) }}
    calculateMetadata={calculateMetadata}
  />
);
```

In the composition component, use `sceneDurations` from props to position `<Sequence>` elements:

```tsx
export type Props = { sceneDurations: number[] };

export const MyVideo: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? 240;
  const starts = sceneDurations.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + d(i - 1));
    return acc;
  }, []);

  return (
    <AbsoluteFill>
      {scenes.map(({ Scene, audio }, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={d(i)}>
          <Scene />
          <Audio src={staticFile(audio)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
```

If using [`<TransitionSeries>`](./transitions.md), subtract the overlap from total duration.

---

## Gitignore

Generated audio is gitignored; the directory is kept via `.gitkeep`:

```gitignore
**/public/audio/*.wav
**/public/audio/*.mp3
```

---

## Reference example

See `apps/taiwan-stock-market/` for a complete working example:
- `scripts/narration.ts` — 7 scenes of Traditional Chinese narration
- `scripts/generate-tts.ts` — Gemini TTS with voice config, retry logic, WAV headers
- `src/TaiwanStockMarket.tsx` — `<Audio>` in each `<Sequence>`
