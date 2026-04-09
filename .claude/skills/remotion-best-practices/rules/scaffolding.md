---
name: scaffolding
description: Scaffold and manage Remotion video projects in the bun-remotion monorepo
metadata:
  tags: scaffold, init, monorepo, bun, workspace, new-project
---

# Scaffolding Remotion Projects (bun-remotion monorepo)

## Monorepo structure

```
bun-remotion/
  package.json              # Root: shared deps (remotion, react, typescript)
  tsconfig.json             # Base tsconfig extended by each app
  bun_remotion_proj/
    shared/                 # @bun-remotion/shared — reusable components
      src/index.ts
    <app-name>/             # each video project
      package.json
      tsconfig.json
      src/
        index.ts            # registerRoot(RemotionRoot)
        Root.tsx            # <Composition> declarations
        <Composition>.tsx   # main composition component
        scenes/             # scene components used by <Sequence>
      scripts/              # TTS generation, data scripts
      public/
        audio/              # generated audio (gitignored *.wav/*.mp3)
      out/                  # rendered MP4 (gitignored)
```

## Commands (always from repo root)

```bash
bun install                              # install all workspace deps
bun start                               # open default app in Remotion Studio
pwsh scripts/dev.ps1 studio <app-name>  # open specific app
pwsh scripts/dev.ps1 render <app-name>  # render specific app
pwsh scripts/dev.ps1 render-all         # render all apps
```

**Never `cd` into subdirectories** — CWD persists across Bash calls and breaks root-relative scripts.

---

## init — Scaffold a new app

```bash
# 1. Create directories
mkdir -p bun_remotion_proj/my-video/src/scenes
mkdir -p bun_remotion_proj/my-video/public/audio
```

**`bun_remotion_proj/my-video/package.json`:**
```json
{
  "name": "@bun-remotion/my-video",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "remotion studio",
    "build": "remotion render MyVideo out/my-video.mp4",
    "generate-tts": "bun run scripts/generate-tts.ts"
  }
}
```

**`bun_remotion_proj/my-video/tsconfig.json`:**
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

**`src/index.ts`:**
```typescript
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
```

**`src/Root.tsx` (with TTS-driven duration):**
```typescript
import { Composition, CalculateMetadataFunction } from "remotion";
import { MyVideo } from "./MyVideo";

// Written by scripts/generate-tts.ts — falls back to 210f per scene
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

**`src/MyVideo.tsx` (minimal starter):**
```typescript
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import type { Props } from "./Root";

const scenes = [
  { Scene: () => <div>Scene One</div>, audio: "audio/01-scene.mp3" },
];

export const MyVideo: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? 210;
  const starts = sceneDurations.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + d(i - 1));
    return acc;
  }, []);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0d0d" }}>
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

After creating, add convenience scripts to root `package.json`:
```json
"start:my-video": "pwsh scripts/dev.ps1 studio my-video",
"build:my-video": "pwsh scripts/dev.ps1 render my-video",
"generate-tts:my-video": "cd bun_remotion_proj/my-video && bun run generate-tts"
```

Then run `bun install` from repo root to link the new workspace.

---

## add-comp — Add a new composition

1. Create `bun_remotion_proj/<app>/src/<CompName>.tsx`
2. Import and add `<Composition>` in `src/Root.tsx`
3. Add a build script entry in `<app>/package.json` if needed

---

## add-scene — Add a scene to a composition

1. Create `bun_remotion_proj/<app>/src/scenes/<SceneName>.tsx`
2. Import in the composition file
3. Add a `<Sequence from={starts[i]} durationInFrames={d(i)}>` entry
4. Add narration entry in `scripts/narration.ts`

---

## Using shared components

```typescript
import { FadeText, Candle, CandleChart } from "@bun-remotion/shared";
```

Add new shared components to `bun_remotion_proj/shared/src/` and export from `index.ts`.

---

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module 'remotion'` | Not installed | `bun install` from repo root |
| `Cannot find module '@bun-remotion/shared'` | Workspace not resolved | `bun install` from repo root |
| `UnhandledSchemeError: node:child_process` | Node built-in imported in webpack-bundled file | Use `require()` pattern for data; never import `node:*` in `src/` files |
| `Can't resolve 'child_process'` | Same as above, without `node:` prefix | Move any Node.js logic to `scripts/`, not `src/` |
| FFmpeg not found | Missing system dep | Use `@remotion/compositor-<platform>/ffprobe` — bundled with Remotion |
| White/blank video | Component returns null | Check component renders visible content |
| Wrong duration | fps × durationInFrames mismatch | Recalculate: `seconds × fps = durationInFrames` |
| Remotion version mismatch | `remotion` and `@remotion/cli` differ | Pin both to same version in root `package.json` |
| `durations.json` stale | Audio regenerated but JSON not updated | Always run `generate-tts.ts` to completion (it writes `durations.json`) |

---

## Key rule: no Node.js imports in `src/`

Remotion bundles `src/` with webpack for the browser. Webpack cannot resolve `child_process`,
`fs`, `path`, `url` — not even with the `node:` prefix.

**Pattern: write data files from scripts, read them via `require()` in `src/`.**

```
scripts/generate-tts.ts   ←  runs in Bun/Node, can use fs/child_process freely
  └─ writes public/audio/durations.json

src/Root.tsx               ←  bundled by webpack
  └─ const data = require("../public/audio/durations.json")  ✅
  └─ import { execSync } from "child_process"                ❌
```
