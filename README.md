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

## Setup After Cloning

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [FFmpeg](https://ffmpeg.org/download.html) (required for rendering to MP4)

### One-time setup

**PowerShell (Windows):**
```powershell
.\scripts\setup.ps1
```

**Bash (macOS/Linux):**
```bash
bun install
```

The script checks for Bun and FFmpeg, then installs all workspace dependencies.

## How It Works

```
React components → Remotion renders each frame → FFmpeg encodes → MP4
```

1. **Compositions** (`Root.tsx`) define video specs (resolution, fps, duration)
2. **Scenes** are React components animated with frame-based hooks (`useCurrentFrame()`, `interpolate()`)
3. **Sequences** (`<Sequence from={0} durationInFrames={150}>`) arrange scenes on a timeline
4. **Render** — `bun run build` calls `remotion render` which renders every frame and encodes to MP4

## Project Structure

This is a Bun workspace monorepo. Each video project lives in `apps/`, shared components in `packages/shared/`.

```
bun-remotion/
  package.json                        # Root: workspaces config + shared deps
  tsconfig.json                       # Base tsconfig (extended by workspaces)
  packages/
    shared/                           # @bun-remotion/shared
      src/
        FadeText.tsx                  # Fade-in text effect
        Candle.tsx                    # Candlestick chart element
        CandleChart.tsx               # K-line chart container
  apps/
    claude-code-intro/                # Claude Code intro video (22s)
      src/
        ClaudeCodeIntro.tsx           # Main composition (660 frames)
        scenes/                       # Title, Features, Terminal, Outro
    taiwan-stock-market/              # Taiwan Stock Market educational video (56s)
      src/
        TaiwanStockMarket.tsx         # Main composition (1680 frames)
        scenes/                       # 7 financial education scenes
```

## Commands

| Command | What It Does |
|---------|-------------|
| `bun install` | Install all workspace dependencies |
| `bun start` | Open ClaudeCodeIntro in Remotion Studio |
| `bun start:claude` | Open ClaudeCodeIntro in Remotion Studio |
| `bun start:stock` | Open TaiwanStockMarket in Remotion Studio |
| `bun run build` | Render ClaudeCodeIntro to MP4 |
| `bun run build:stock` | Render TaiwanStockMarket to MP4 |
| `bun run build:all` | Render all projects |
| `bun run upgrade` | Update Remotion packages |

## Tech Stack

| Layer | Tool |
|-------|------|
| Runtime | Bun (workspace monorepo) |
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

## Why Bun Instead of npm

- **~25x faster** `bun install` vs `npm install`
- Built-in TypeScript support (no ts-node needed)
- Built-in `bun run` for scripts
- Native workspace monorepo support
- `bun.lock` is faster to read/write than `package-lock.json`
