# ClaudeCodeIntro

A Remotion video project that serves as a **testbed for Remotion best practices** — built alongside the `bun-remotion` monorepo. The video content is a short promotional intro for Claude Code.

## Purpose

This sub-project is the primary playground for exploring and validating Remotion patterns:

- Scene composition with `<Sequence>` and `<AbsoluteFill>`
- Dynamic duration via `calculateMetadata` (audio-driven timing)
- Spring + interpolate animations with `Easing`
- TTS narration pipeline (edge-tts → MP3 → per-scene audio)
- Font loading, transitions, subtitle overlays

## Video Overview

**22s intro for Claude Code** — 4 scenes, 660 frames at 30fps, 1920×1080.

| Scene | Frames | Content |
|-------|--------|---------|
| TitleScene | ~150 | Logo + title animation with floating particles |
| FeaturesScene | ~180 | 4 feature cards with staggered spring-in |
| TerminalScene | ~210 | Animated terminal showing a Claude session |
| OutroScene | ~120 | CTA + install command, global fade-out |

See `scene_preview.md` for detailed ASCII layouts and animation breakdowns.

## Commands

Run from the **repo root** (see [CLAUDE.md](../../CLAUDE.md) for the no-cd rule):

```bash
# Studio preview
bun start:claude
# or: pwsh scripts/dev.ps1 studio claude-code-intro

# Render to MP4
bun run build
# or: pwsh scripts/dev.ps1 render claude-code-intro

# Generate TTS audio (edge-tts, en-US-AriaNeural)
bun run generate-tts:claude           # regenerate all
bun run --cwd bun_remotion_proj/claude-code-intro generate-tts:skip  # skip existing
```

## Structure

```
claude-code-intro/
  src/
    index.ts                # registerRoot()
    Root.tsx                # <Composition> declarations
    ClaudeCodeIntro.tsx     # Main composition, calculateMetadata, <Sequence> wiring
    scenes/
      TitleScene.tsx        # Opening title with particles
      FeaturesScene.tsx     # Feature cards
      TerminalScene.tsx     # Terminal simulation
      OutroScene.tsx        # End screen + CTA
  scripts/
    generate-tts.ts         # edge-tts narration generator (--skip-existing flag)
    narration.ts            # Narration text per scene
  public/                   # Static assets (audio MP3s, fonts)
  out/                      # Rendered MP4 output (gitignored)
  scene_preview.md          # ASCII scene layouts
  TODO.md                   # Known issues and planned improvements
```

## TTS Pipeline

Narration is driven by `scripts/narration.ts`. Running `generate-tts` calls edge-tts for each scene and writes MP3 files + a `durations.json` into `public/`. `calculateMetadata` reads `durations.json` at render time to set exact frame durations.

`durations.json` is committed so the repo renders without re-running TTS. Regenerate it when narration text changes.

## Best Practices Explored

- `calculateMetadata` for audio-driven dynamic duration
- `useVideoConfig()` for scene-relative fade timing
- `spring()` for physics-based entrance animations
- `interpolate()` with `Easing.bezier` for fine-tuned curves
- `staticFile()` for referencing `public/` assets
- Per-scene `<Audio>` elements inside `<Sequence>` blocks
