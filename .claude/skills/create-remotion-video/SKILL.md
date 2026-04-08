---
name: create-remotion-video
description: >
  This skill should be used when the user asks to "/create-remotion-video", "create video",
  "new remotion project", "create remotion video", "make video with bun", "generate video",
  "remotion setup", "add composition", "add scene", "new video composition",
  or wants to scaffold, create, extend, or manage a Remotion video project using Bun.
metadata:
  version: 2.0.0
---

# /create-remotion-video — Scaffold & Manage Remotion Videos with Bun

Create, scaffold, and manage [Remotion](https://remotion.dev/) video projects using [Bun](https://bun.sh/) as the runtime. This skill handles project initialization, composition creation, scene management, and rendering within the bun-remotion workspace monorepo.

## Quick Invocation

```
/create-remotion-video                        # Show this guide
/create-remotion-video init my-video          # Scaffold a new Remotion app in apps/my-video
/create-remotion-video add-comp MyVideo       # Add a new composition to Root.tsx
/create-remotion-video add-scene MyComp SceneName  # Add scene to existing composition
/create-remotion-video add-tts my-video       # Add TTS narration to an existing app
/create-remotion-video render                 # Render all compositions to MP4
/create-remotion-video render MyVideo         # Render specific composition
/create-remotion-video studio                 # Open Remotion Studio for preview
/create-remotion-video upgrade                # Update Remotion to latest version
```

## Prerequisites

1. **Bun** installed (v1.0+). Install: `curl -fsSL https://bun.sh/install | bash` (macOS/Linux) or download from [github.com/oven-sh/bun/releases](https://github.com/oven-sh/bun/releases) (Windows)
2. **FFmpeg** available in PATH (required by Remotion for rendering)

## Monorepo Structure

This project uses Bun workspaces. Each video is an app in `apps/`, shared components live in `packages/shared/`.

```
bun-remotion/
  package.json                  # Root: workspaces config + shared deps
  tsconfig.json                 # Base tsconfig (extended by workspaces)
  packages/
    shared/                     # @bun-remotion/shared — reusable components
      src/
        index.ts                # Barrel export
  apps/
    claude-code-intro/          # Example app
      package.json
      tsconfig.json
      src/
        index.ts                # registerRoot(RemotionRoot)
        Root.tsx                # <Composition> declarations
        <CompositionName>.tsx   # Main composition component
        scenes/                 # Scene components used by Sequence
    my-video/                   # Your new app goes here
```

## Commands Reference

### init — Scaffold New App in Monorepo

Create a new Remotion video app inside the workspace:

```bash
# From the monorepo root:
# 1. Create the app directory
mkdir -p apps/my-video/src/scenes

# 2. Create apps/my-video/package.json
# (see template below)

# 3. Create apps/my-video/tsconfig.json
# (extends root tsconfig)

# 4. Create src/index.ts, src/Root.tsx, composition, scenes

# 5. Install dependencies
bun install

# 6. Open Studio
cd apps/my-video && bun start
```

**Required package.json for new app:**

```json
{
  "name": "@bun-remotion/my-video",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "remotion studio",
    "build": "remotion render MyVideo out/my-video.mp4",
    "upgrade": "remotion upgrade"
  },
  "dependencies": {
    "@bun-remotion/shared": "workspace:*",
    "@remotion/cli": "4.0.290",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "18.3.18",
    "@types/react-dom": "18.3.5"
  }
}
```

**Required tsconfig.json for new app:**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

After creating, add a convenience script to root `package.json`:
```json
"start:my-video": "cd apps/my-video && bun start",
"build:my-video": "cd apps/my-video && bun run build"
```

### Boilerplate Files

**apps/my-video/src/index.ts:**
```typescript
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
```

**apps/my-video/src/Root.tsx:**
```typescript
import { Composition } from "remotion";
import { MyVideo } from "./MyVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
```

**apps/my-video/src/MyVideo.tsx (minimal starter):**
```typescript
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const MyVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{
      backgroundColor: "#0d0d0d",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity,
    }}>
      <div style={{ color: "#fff", fontSize: 80 }}>Hello Remotion</div>
    </AbsoluteFill>
  );
};
```

### add-comp — Add New Composition

Add a new video composition to an existing app:

1. Create `apps/<app>/src/<CompName>.tsx` with the component
2. Import and register in `apps/<app>/src/Root.tsx` as a new `<Composition>`
3. Update `apps/<app>/package.json` build script if needed

### add-scene — Add Scene to Composition

Add a scene (used within `<Sequence>`) to an existing composition:

1. Create `apps/<app>/src/scenes/<SceneName>.tsx`
2. Import in the composition file
3. Add `<Sequence from={N} durationInFrames={M}><SceneName /></Sequence>`

### render — Render Video to MP4

```bash
# Render from root (uses per-app build scripts)
bun run build
bun run build:stock

# Render specific composition directly from app directory
cd apps/my-video && bun run build
cd apps/my-video && bunx remotion render MyVideo out/video.mp4

# Custom settings
bunx remotion render MyVideo out/video.mp4 --fps=60 --width=3840 --height=2160
```

### studio — Dev Preview

```bash
# From root
bun start              # ClaudeCodeIntro
bun start:stock        # TaiwanStockMarket

# From app directory
cd apps/my-video && bun start
# Opens http://localhost:3000 — Remotion Studio with timeline, scrubber, and preview
```

## Using Shared Components

Import from `@bun-remotion/shared` in any app:

```typescript
import { FadeText, Candle, CandleChart } from "@bun-remotion/shared";
```

Available components:
- `FadeText` — Fade-in text with translateY animation
- `Candle` — Candlestick chart element
- `CandleChart` — K-line chart container
- `CandleData` — TypeScript interface for candle data

To add a new shared component:
1. Create the component in `packages/shared/src/`
2. Export it from `packages/shared/src/index.ts`

## Remotion Animation API Cheat Sheet

### Core Hooks

| Hook | Purpose |
|------|---------|
| `useCurrentFrame()` | Current frame number (0-based) |
| `useVideoConfig()` | Get fps, width, height, durationInFrames |
| `interpolate(value, inputRange, outputRange, options)` | Map value with easing/clamping |
| `spring({frame, fps, config})` | Physics-based spring animation |

### Core Components

| Component | Purpose |
|-----------|---------|
| `<AbsoluteFill>` | Full-screen container (width x height) |
| `<Sequence from={N} durationInFrames={M}>` | Timeline segment |
| `<Composition>` | Register a video in Root.tsx |
| `<OffthreadVideo>` | Play an external video clip |
| `<Img>` | Display image |

### Easing Functions

```typescript
import { Easing } from "remotion";

Easing.linear()
Easing.ease(t)
Easing.in(easing)
Easing.out(easing)
Easing.inOut(easing)
Easing.back(amount)
Easing.elastic(amplitude)
Easing.bounce()
```

### interpolate Options

```typescript
interpolate(frame, [0, 30], [0, 100], {
  extrapolateLeft: "clamp",   // or "extend", "wrap"
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
});
```

## Common Patterns

### Fade In + Slide Up
```typescript
const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
const y = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: "clamp" });
// style={{ opacity, transform: `translateY(${y}px)` }}
```

### Scale with Spring
```typescript
const scale = interpolate(frame, [0, 25], [0.6, 1], {
  ...Easing.out(Easing.back(1.5)),
  extrapolateRight: "clamp",
});
```

### Staggered List Animation
```typescript
{items.map((item, i) => {
  const delay = i * 10;
  const opacity = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div key={i} style={{ opacity }}>{item}</div>;
})}
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module 'remotion'` | Not installed | `bun install` from root |
| `Cannot find module '@bun-remotion/shared'` | Workspace not resolved | Run `bun install` from root |
| FFmpeg not found | Missing system dependency | Install FFmpeg, ensure in PATH |
| White/blank video | Component returns null or no content | Check component renders visible content |
| Wrong duration | fps x durationInFrames mismatch | Recalculate: seconds * fps = durationInFrames |
| Remotion version mismatch | remotion and @remotion/cli different versions | Pin both to same version |
| Trusted dependency error | Missing trustedDependencies | Add compositor entries to root package.json |

## TTS Narration Integration

Add spoken narration to any Remotion video using Gemini TTS (free tier). Audio is generated via a script in the project folder and embedded into the video via Remotion's `<Audio>` component.

### Prerequisites

- `GOOGLE_API_KEY` env var set (Google AI Studio free key)
- Uses `gemini-2.5-flash-preview-tts` model (no billing required)

### File Structure

```
apps/<my-video>/
  scripts/
    narration.ts          # Narration text per scene
    generate-tts.ts       # TTS generation script
  public/
    audio/
      .gitkeep            # tracked (keeps dir in git)
      01-scene.wav        # generated (gitignored)
  src/
    <Composition>.tsx     # <Audio> added to each <Sequence>
```

### add-tts — Add Narration to Existing App

#### Step 1: Create narration scripts (`scripts/narration.ts`)

```typescript
export interface NarrationScript {
  scene: string;    // matches scenes/<Name>.tsx
  file: string;     // output filename in public/audio/
  text: string;     // narration text
}

export const narrations: NarrationScript[] = [
  { scene: "TitleScene", file: "01-title.wav", text: "歡迎觀看..." },
  { scene: "SceneTwo", file: "02-scene-two.wav", text: "第二段內容..." },
];
```

**Guidelines:**
- One narration entry per scene/Sequence
- **Qwen3-TTS speech rate:** ~3 chars/sec (180 chars/min). For an 8s scene: max ~24 chars. **Use `calculateMetadata` to let audio drive scene length** rather than trying to match text to a fixed frame count.
- Language should match the visual content

#### Step 2: Create TTS generation script (`scripts/generate-tts.ts`)

Copy from `apps/taiwan-stock-market/scripts/generate-tts.ts` as a template. Key points:
- Imports narrations from `./narration.ts`
- Calls Gemini TTS API for each scene
- Writes WAV files (PCM 24kHz, 16-bit, mono) to `public/audio/`
- Adds proper WAV headers to raw PCM data
- 1-second delay between requests to avoid rate limiting

#### Step 3: Add `<Audio>` to composition

Import `Audio` and `staticFile` from `remotion`, then add inside each `<Sequence>`:

```typescript
import { Audio, staticFile } from "remotion";

// Inside composition:
<Sequence from={0} durationInFrames={240}>
  <TitleScene />
  <Audio src={staticFile("audio/01-title.wav")} volume={1} />
</Sequence>
```

Audio plays only during its Sequence's time window. Remotion automatically embeds audio into the rendered MP4.

#### Step 4: Add npm script

```json
// apps/<my-video>/package.json
"generate-tts": "bun run scripts/generate-tts.ts"

// Root package.json
"generate-tts:<name>": "cd apps/<my-video> && bun run generate-tts"
```

#### Step 5: Generate and render

```bash
# Generate audio files
bun run generate-tts:<name>

# Preview with audio
bun start:<name>

# Render video with embedded audio
bun run build:<name>
```

### Gitignore

Generated audio files are gitignored via root `.gitignore`:
```
**/public/audio/*.wav
**/public/audio/*.mp3
```
The `public/audio/` directory is kept in git via `.gitkeep`.

### Example: Taiwan Stock Market

See `apps/taiwan-stock-market/` for a complete working example:
- `scripts/narration.ts` — 7 scenes of Traditional Chinese narration
- `scripts/generate-tts.ts` — TTS generation with Gemini API
- `src/TaiwanStockMarket.tsx` — `<Audio>` in each `<Sequence>`

## References

- **Project memory:** `.agent/memory/project-overview.md` — full project structure and conventions
- **Remotion docs:** https://www.remotion.dev/docs/
- **Remotion API:** https://www.remotion.dev/docs/api/
- **Bun docs:** https://bun.sh/docs
