---
name: voiceover
description: Adding AI-generated voiceover to Remotion compositions using TTS
metadata:
  tags: voiceover, audio, tts, speech, edge-tts, gemini, mlx-tts, calculateMetadata, dynamic duration
---

# Adding AI voiceover to a Remotion composition

Generate speech audio per scene, write durations to `public/audio/durations.json`, then read
that file in `Root.tsx` to size the composition dynamically.

> **Critical:** Never import `child_process`, `fs`, `path`, or any Node.js built-ins in `src/`
> files — webpack can't resolve them (even with the `node:` prefix). All Node.js I/O belongs
> in `scripts/`. Pass results to `src/` via a JSON file loaded with `require()`.

---

## TTS Provider Options

### Option A — edge-tts (recommended default)

Microsoft Neural TTS via Python CLI. **Free, no API key, unlimited, MP3 output.**

```bash
pip install edge-tts          # one-time
python -m edge_tts --version  # verify
```

English voices: `en-US-AriaNeural` (warm), `en-US-GuyNeural` (professional)
Chinese voices: `zh-TW-HsiaoChenNeural`, `zh-TW-YunJheNeural`

Best for: >3 scenes, bulk generation, offline-capable, Windows/Linux/macOS.

### Option B — Gemini TTS (free tier)

`gemini-2.5-flash-preview-tts` via Google AI Studio. WAV output, 3 req/min rate limit.

**Prerequisites:** `GOOGLE_API_KEY` env var (get from aistudio.google.com/apikey)

Best for: 1–3 scenes, high-quality output, prefer not installing Python deps.

### Option C — mlx_tts (local, offline, Apple Silicon)

Qwen3-TTS or Kokoro on-device via MLX. Best Chinese quality. No API key.

**Prerequisites:** macOS Apple Silicon, Python 3.11+, setup at `mlx_tts/` in repo root.

See `.agent/memory/project/mlx-tts-integration.md` for full setup.

### Option D — ElevenLabs

Requires `ELEVENLABS_API_KEY`. High quality, paid.

---

## Full Workflow (edge-tts example)

### File structure

```
bun_remotion_proj/<my-video>/
  scripts/
    narration.ts            # narration text per scene
    generate-tts.ts         # TTS generation → writes durations.json
  public/
    audio/
      .gitkeep              # tracked
      01-title.mp3          # generated (gitignored)
      durations.json        # generated frame counts — commit this
  src/
    Root.tsx                # reads durations.json via require()
    <Composition>.tsx       # <Audio> in each <Sequence>
```

### Step 1: `scripts/narration.ts`

```typescript
export interface NarrationScript {
  scene: string;   // matches scenes/<Name>.tsx
  file: string;    // output filename in public/audio/
  text: string;    // narration text
}

export const narrations: NarrationScript[] = [
  { scene: "TitleScene",    file: "01-title.mp3",    text: "Meet Claude Code..." },
  { scene: "FeaturesScene", file: "02-features.mp3", text: "It reads your codebase..." },
];
```

**Pacing guidelines:**
- English TTS: ~130–150 words/min. For a 6s scene: max ~13 words.
- Chinese TTS: ~3 chars/sec. For an 8s scene: max ~24 chars.
- **Let audio drive scene length via `durations.json`** — don't guess frame counts.
- Leave a 1–2s visual lead-in before narration starts (use `Audio startFrom` or `from` offset).

### Step 2: `scripts/generate-tts.ts` (edge-tts)

```typescript
import { spawnSync, execSync } from "child_process";
import { statSync, mkdirSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { narrations } from "./narration";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..", "..");
const AUDIO_DIR = join(__dirname, "..", "public", "audio");
const VOICE = "en-US-AriaNeural";
const FPS = 30;

// Use Remotion's bundled ffprobe — no extra install needed
const FFPROBE = join(
  REPO_ROOT, "node_modules", "@remotion",
  `compositor-${process.platform}-${process.arch}-${process.platform === "win32" ? "msvc" : "gnu"}`,
  process.platform === "win32" ? "ffprobe.exe" : "ffprobe"
);

function synthesize(text: string, outPath: string) {
  const result = spawnSync("python", [
    "-m", "edge_tts", "--voice", VOICE, "--text", text, "--write-media", outPath,
  ], { encoding: "utf-8", timeout: 30_000 });
  if (result.status !== 0) throw new Error(result.stderr || `exit ${result.status}`);
}

function durationFrames(filePath: string): number {
  try {
    const out = execSync(
      `"${FFPROBE}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { encoding: "utf-8" }
    ).trim();
    return Math.ceil(parseFloat(out) * FPS) + 15; // +15 trailing buffer
  } catch { return 210; }
}

async function main() {
  mkdirSync(AUDIO_DIR, { recursive: true });
  const skipExisting = process.argv.includes("--skip-existing");

  for (let i = 0; i < narrations.length; i++) {
    const { scene, file, text } = narrations[i];
    const outPath = join(AUDIO_DIR, file);
    if (skipExisting && existsSync(outPath)) {
      console.log(`[${i + 1}] ${scene} — skipped`);
      continue;
    }
    console.log(`[${i + 1}/${narrations.length}] ${scene}...`);
    synthesize(text, outPath);
    console.log(`  → ${file} (${(statSync(outPath).size / 1024).toFixed(1)}KB)`);
    if (i < narrations.length - 1) await new Promise((r) => setTimeout(r, 300));
  }

  // Write durations.json — Root.tsx reads this; avoids Node.js imports in webpack
  const durations = narrations.map(({ file }) => {
    const p = join(AUDIO_DIR, file);
    return existsSync(p) ? durationFrames(p) : 210;
  });
  writeFileSync(join(AUDIO_DIR, "durations.json"), JSON.stringify(durations, null, 2) + "\n");
  console.log(`\ndurations.json: ${JSON.stringify(durations)}`);
}

main();
```

For Gemini TTS, see the full API example in the legacy section below.

### Step 3: `src/Root.tsx` — read `durations.json`

```typescript
import { Composition, CalculateMetadataFunction } from "remotion";
import { MyVideo } from "./MyVideo";

// Written by scripts/generate-tts.ts. Falls back to 210f per scene if not generated.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sceneDurationsData: number[] = (() => {
  try { return require("../public/audio/durations.json"); }
  catch { return Array(4).fill(210); }
})();

export type Props = { sceneDurations: number[] };

const calculateMetadata: CalculateMetadataFunction<Props> = async () => ({
  durationInFrames: sceneDurationsData.reduce((sum, d) => sum + d, 0),
  props: { sceneDurations: sceneDurationsData },
});

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MyVideo"
    component={MyVideo}
    durationInFrames={sceneDurationsData.reduce((sum, d) => sum + d, 0)}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ sceneDurations: sceneDurationsData }}
    calculateMetadata={calculateMetadata}
  />
);
```

### Step 4: `src/<Composition>.tsx` — add `<Audio>`

```typescript
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import type { Props } from "./Root";

const scenes = [
  { Scene: TitleScene,    audio: "audio/01-title.mp3" },
  { Scene: FeaturesScene, audio: "audio/02-features.mp3" },
];

export const MyVideo: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? 210;
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

Audio plays only during its `<Sequence>` window. Remotion embeds audio into the rendered MP4.

### Step 5: Add scripts to `package.json`

```json
// bun_remotion_proj/<my-video>/package.json
{
  "scripts": {
    "generate-tts": "bun run scripts/generate-tts.ts",
    "generate-tts:skip": "bun run scripts/generate-tts.ts --skip-existing"
  }
}

// root package.json
{
  "scripts": {
    "generate-tts:<name>": "cd bun_remotion_proj/<my-video> && bun run generate-tts"
  }
}
```

### Step 6: Generate and render

```bash
# Generate audio + durations.json
bun run generate-tts:<name>

# Preview with audio in Remotion Studio
bun start:<name>

# Render MP4 with embedded audio
bun run build:<name>
```

---

## Fade-out that tracks scene end

When using `calculateMetadata`, scene durations change at runtime. Hardcoded fadeouts like
`interpolate(frame, [95, 120], [1, 0])` will fire before the scene ends. Instead:

```tsx
import { useVideoConfig } from "remotion";

const { durationInFrames } = useVideoConfig();
const globalFade = interpolate(
  frame,
  [durationInFrames - 30, durationInFrames],
  [1, 0],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);
```

---

## Gitignore

```gitignore
**/public/audio/*.wav
**/public/audio/*.mp3
# durations.json is intentionally NOT gitignored — commit it so
# the video builds without regenerating audio on a fresh clone.
```

---

## Legacy: Gemini TTS generation script

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
const VOICE = "Kore"; // Kore (calm/clear), Aoede (warm), Charon (deep), Fenrir (expressive)
const SAMPLE_RATE = 24000;
const BYTE_RATE = SAMPLE_RATE * 2;

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

function wavDurationFrames(filePath: string, fps = 30): number {
  const buf = require("fs").readFileSync(filePath);
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  return Math.ceil((dataSize / byteRate) * fps) + 15;
}

async function generateTts(text: string, retries = 3): Promise<Buffer> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
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
      const match = (await res.text()).match(/retry in ([\d.]+)s/);
      const delay = match ? parseFloat(match[1]) + 2 : 35;
      console.log(`  Rate limited. Waiting ${delay}s...`);
      await new Promise((r) => setTimeout(r, delay * 1000));
      continue;
    }
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  throw new Error("Max retries exceeded");
}

async function main() {
  mkdirSync(AUDIO_DIR, { recursive: true });
  const skipExisting = process.argv.includes("--skip-existing");

  for (let i = 0; i < narrations.length; i++) {
    const { scene, file, text } = narrations[i];
    const outPath = join(AUDIO_DIR, file);
    if (skipExisting && existsSync(outPath)) { console.log(`[${i+1}] ${scene} — skipped`); continue; }
    console.log(`[${i+1}/${narrations.length}] ${scene}: ${text}`);
    const pcm = await generateTts(text);
    writeFileSync(outPath, Buffer.concat([createWavHeader(pcm.length), pcm]));
    console.log(`  → ${file} (${(pcm.length / BYTE_RATE).toFixed(1)}s)`);
    if (i < narrations.length - 1) await new Promise((r) => setTimeout(r, 2000));
  }

  // Write durations.json
  const durations = narrations.map(({ file }) => {
    const p = join(AUDIO_DIR, file);
    return existsSync(p) ? wavDurationFrames(p) : 210;
  });
  writeFileSync(join(AUDIO_DIR, "durations.json"), JSON.stringify(durations, null, 2) + "\n");
}

main();
```

---

## Reference examples

- `bun_remotion_proj/claude-code-intro/` — edge-tts English, 4 scenes, MP3, `durations.json`
- `bun_remotion_proj/taiwan-stock-market/` — Gemini/mlx_tts Chinese, 7 scenes, WAV, `durations.json`
