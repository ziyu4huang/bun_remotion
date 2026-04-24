---
name: remotion-api-reference
description: Remotion API quick reference and package.json configuration notes
type: project
---

# Remotion API Reference

## Key APIs

| API | Purpose |
|-----|---------|
| `<Composition>` | Register a video with id, fps, dimensions, duration |
| `<Sequence>` | Place scenes on timeline with start frame + duration |
| `<AbsoluteFill>` | Full-screen layout container |
| `useCurrentFrame()` | Get current frame for animation logic |
| `interpolate()` | Map values with easing and clamping |
| `Easing` | Cubic, back, elastic, bounce easing functions |

## package.json Configuration

- Remotion + @remotion/cli must be **same version** (pinned to 4.0.290)
- `trustedDependencies` needed for Remotion's native compositor binaries
- tsconfig base: `moduleResolution: "bundler"`, `jsx: "react-jsx"`, target ES2022, `composite: true`

## Workspace Conventions

- **Root** holds shared deps (`remotion`, `react`, `typescript`) in `package.json`
- **`bun_remotion_proj/shared/`** — reusable components, imported as `@bun-remotion/shared`
- **`bun_remotion_proj/<name>/`** — each Remotion video project is self-contained with its own `package.json`, `tsconfig.json`, `src/index.ts`, `src/Root.tsx`
- To add a new video project: create `bun_remotion_proj/<name>/` with `package.json`, `tsconfig.json`, `src/index.ts`, `src/Root.tsx`
