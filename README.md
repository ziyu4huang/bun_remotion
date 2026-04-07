# bun-remotion

Create AI-generated videos programmatically using [Remotion](https://remotion.dev/) + [Bun](https://bun.sh/).

## What Is This

This project uses **Remotion** (a React-based video framework) to build videos as React components. **Bun** replaces npm/yarn for faster package management and script execution. The result: you write React, you get MP4.

## Quick Start

```bash
# Install dependencies
bun install

# Open dev preview (Remotion Studio in browser)
bun start

# Render video to MP4
bun run build
```

Output: `out/claude-code-intro.mp4` (1920x1080, 30fps, 22s)

## How It Works

```
React components → Remotion renders each frame → FFmpeg encodes → MP4
```

1. **Compositions** (`Root.tsx`) define video specs (resolution, fps, duration)
2. **Scenes** are React components animated with frame-based hooks (`useCurrentFrame()`, `interpolate()`)
3. **Sequences** (`<Sequence from={0} durationInFrames={150}>`) arrange scenes on a timeline
4. **Render** — `bun run build` calls `remotion render` which renders every frame and encodes to MP4

## Project Structure

```
src/
  index.ts                  # Entry point — registerRoot()
  Root.tsx                  # Video composition declarations
  components/               # Reusable animation components
    FadeText.tsx            # Fade-in text effect
    Candle.tsx              # Candlestick chart element
    CandleChart.tsx         # K-line chart container
  claude-code-intro/        # Claude Code intro video
    ClaudeCodeIntro.tsx     # Main composition (660 frames, 22s)
    scenes/
      TitleScene.tsx        # Opening title animation
      FeaturesScene.tsx     # Feature showcase with spring animations
      TerminalScene.tsx     # Terminal simulation
      OutroScene.tsx        # End screen
  scenes/                   # Additional scene components
    TitleScene.tsx          # Title scene
    KLineScene.tsx          # K-line/candlestick scene
    PriceVolumeScene.tsx    # Price & volume scene
    SupportResistanceScene.tsx  # Support & resistance scene
    MovingAverageScene.tsx  # Moving average scene
    TradingHoursScene.tsx   # Trading hours scene
    LimitScene.tsx          # Price limit scene
```

## Tech Stack

| Layer | Tool |
|-------|------|
| Runtime | Bun |
| Video Framework | Remotion v4.0.290 |
| UI | React 18 + TypeScript |
| Output | MP4 via FFmpeg |

## Key Remotion APIs Used

| API | Purpose |
|-----|---------|
| `<Composition>` | Register a video with id, fps, dimensions, duration |
| `<Sequence>` | Place scenes on timeline with start frame + duration |
| `<AbsoluteFill>` | Full-screen layout container |
| `useCurrentFrame()` | Get current frame for animation logic |
| `interpolate()` | Map values with easing and clamping |
| `Easing` | Cubic, back, elastic, bounce easing functions |

## Commands

| Command | What It Does |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun start` | Open Remotion Studio (localhost:3000) |
| `bun run build` | Render to `out/claude-code-intro.mp4` |
| `bun run upgrade` | Update Remotion to latest version |

## Why Bun Instead of npm

- **~25x faster** `bun install` vs `npm install`
- Built-in TypeScript support (no ts-node needed)
- Built-in `bun run` for scripts
- `bun.lock` is faster to read/write than `package-lock.json`
