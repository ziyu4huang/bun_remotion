---
name: create-remotion-video
description: >
  This skill should be used when the user asks to "/create-remotion-video", "create video",
  "new remotion project", "create remotion video", "make video with bun", "generate video",
  "remotion setup", "add composition", "add scene", "new video composition",
  or wants to scaffold, create, extend, or manage a Remotion video project using Bun.
metadata:
  version: 1.0.0
---

# /create-remotion-video — Scaffold & Manage Remotion Videos with Bun

Create, scaffold, and manage [Remotion](https://remotion.dev/) video projects using [Bun](https://bun.sh/) as the runtime. This skill handles project initialization, composition creation, scene management, and rendering.

## Quick Invocation

```
/create-remotion-video                        # Show this guide
/create-remotion-video init                   # Scaffold a new Remotion + Bun project
/create-remotion-video add-comp MyVideo       # Add a new composition to Root.tsx
/create-remotion-video add-scene MyComp SceneName  # Add scene to existing composition
/create-remotion-video render                 # Render all compositions to MP4
/create-remotion-video render MyVideo         # Render specific composition
/create-remotion-video studio                 # Open Remotion Studio for preview
/create-remotion-video upgrade                # Update Remotion to latest version
```

## Prerequisites

1. **Bun** installed (v1.0+). Install: `curl -fsSL https://bun.sh/install | bash` (macOS/Linux) or download from [github.com/oven-sh/bun/releases](https://github.com/oven-sh/bun/releases) (Windows)
2. **FFmpeg** available in PATH (required by Remotion for rendering)

## Project Structure Convention

```
project/
  package.json                  # Remotion + Bun deps
  tsconfig.json                 # ES2022, react-jsx, bundler resolution
  src/
    index.ts                    # registerRoot(RemotionRoot)
    Root.tsx                    # <Composition> declarations
    components/                 # Reusable animation primitives
    <video-name>/               # One folder per composition
      <VideoName>.tsx           # Main composition component
      scenes/                   # Scene components used by Sequence
```

## Commands Reference

### init — Scaffold New Project

Create a new Remotion + Bun project from scratch:

```bash
# Create project directory
mkdir my-video && cd my-video

# Initialize package.json
bun init -y

# Install Remotion (pin versions together)
bun add remotion@latest @remotion/cli@latest react react-dom
bun add -d @types/react @types/react-dom typescript

# Add trusted dependencies for native compositor
# (add to package.json trustedDependencies array)

# Create tsconfig.json
# Create src/index.ts, src/Root.tsx, src/components/

# Install and verify
bun install
bun start  # Opens Remotion Studio at localhost:3000
```

**Required package.json fields:**

```json
{
  "scripts": {
    "start": "remotion studio",
    "build": "remotion render <CompositionId> out/<filename>.mp4",
    "upgrade": "remotion upgrade"
  },
  "trustedDependencies": [
    "@remotion/compositor-linux-arm64-gnu",
    "@remotion/compositor-linux-arm64-musl",
    "@remotion/compositor-linux-x64-gnu",
    "@remotion/compositor-linux-x64-musl",
    "@remotion/compositor-win32-x64-msvc",
    "@remotion/compositor-darwin-arm64",
    "@remotion/compositor-darwin-x64"
  ]
}
```

**Required tsconfig.json:**

```json
{
  "compilerOptions": {
    "lib": ["dom", "esnext"],
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "outDir": "./dist"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

### Boilerplate Files

**src/index.ts:**
```typescript
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
```

**src/Root.tsx:**
```typescript
import { Composition } from "remotion";
import { MyVideo } from "./my-video/MyVideo";

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

**src/my-video/MyVideo.tsx (minimal starter):**
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

Add a new video composition to an existing project:

1. Create `src/<comp-name>/<CompName>.tsx` with the component
2. Import and register in `src/Root.tsx` as a new `<Composition>`
3. Update `package.json` build script if needed

### add-scene — Add Scene to Composition

Add a scene (used within `<Sequence>`) to an existing composition:

1. Create `src/<comp-name>/scenes/<SceneName>.tsx`
2. Import in the composition file
3. Add `<Sequence from={N} durationInFrames={M}><SceneName /></Sequence>`

### render — Render Video to MP4

```bash
# Render all compositions (needs explicit build script per comp)
bun run build

# Render specific composition directly
bunx remotion render <CompositionId> out/<filename>.mp4

# Custom settings
bunx remotion render <CompId> out/video.mp4 --fps=60 --width=3840 --height=2160
```

### studio — Dev Preview

```bash
bun start
# Opens http://localhost:3000 — Remotion Studio with timeline, scrubber, and preview
```

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
| `Cannot find module 'remotion'` | Not installed | `bun install` |
| FFmpeg not found | Missing system dependency | Install FFmpeg, ensure in PATH |
| White/blank video | Component returns null or no content | Check component renders visible content |
| Wrong duration | fps x durationInFrames mismatch | Recalculate: seconds * fps = durationInFrames |
| Remotion version mismatch | remotion and @remotion/cli different versions | Pin both to same version |
| Trusted dependency error | Missing trustedDependencies | Add compositor entries to package.json |

## References

- **Project memory:** `.agent/memory/project-overview.md` — full project structure and conventions
- **Remotion docs:** https://www.remotion.dev/docs/
- **Remotion API:** https://www.remotion.dev/docs/api/
- **Bun docs:** https://bun.sh/docs
