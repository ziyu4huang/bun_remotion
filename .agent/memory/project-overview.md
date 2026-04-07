---
name: project-overview
description: bun-remotion project overview — uses Bun + Remotion to generate AI videos programmatically
type: project
---

# bun-remotion — Project Overview

**What:** Video generation project using [Remotion](https://remotion.dev/) with [Bun](https://bun.sh/) as the JS runtime. Creates animated videos (MP4) using React components.

**Why:** Bun replaces npm for faster installs and runs; Remotion lets you build videos with React — no After Effects needed.

**How to apply:** When asked about this project, the video pipeline, or how Bun + Remotion work together.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun (bun install, bun start, bun run build) |
| Video framework | Remotion v4.0.290 |
| UI | React 18 + TypeScript 5.8 |
| Output | MP4 (1920x1080, 30fps) |

## Project Structure

```
src/
  index.ts                          # registerRoot entry point
  Root.tsx                          # RemotionRoot — declares Composition(s)
  components/                       # Reusable animation components
    FadeText.tsx                    # Fade-in text with translateY
    Candle.tsx                      # Candlestick chart element
    CandleChart.tsx                 # K-line chart container
  claude-code-intro/               # Example video composition
    ClaudeCodeIntro.tsx             # Main comp: 660 frames, 30fps, 22s
    scenes/
      TitleScene.tsx                # Logo + title reveal
      FeaturesScene.tsx             # Feature cards with spring animations
      TerminalScene.tsx             # Terminal simulation
      OutroScene.tsx                # End screen with CTA
  scenes/                           # Additional scene components
    TitleScene.tsx                  # Title scene
    KLineScene.tsx                  # K-line/candlestick scene
    PriceVolumeScene.tsx            # Price & volume scene
    SupportResistanceScene.tsx      # Support & resistance scene
    MovingAverageScene.tsx          # Moving average scene
    TradingHoursScene.tsx           # Trading hours scene
    LimitScene.tsx                  # Price limit scene
```

## Key Remotion Concepts Used

- **Composition**: Root container in `Root.tsx` — defines id, fps, width, height, durationInFrames
- **Sequence**: Timeline-based scene management (`<Sequence from={0} durationInFrames={150}>`)
- **useCurrentFrame()**: Hook for frame-based animation timing
- **interpolate()**: Value mapping with easing and clamping
- **AbsoluteFill**: Full-screen layout component
- **Easing**: Spring and cubic easing functions

## Commands

```bash
bun install          # Install dependencies
bun start            # Open Remotion Studio (dev preview in browser)
bun run build        # Render video to out/claude-code-intro.mp4
bun run upgrade      # Update Remotion packages
```

## package.json Essentials

- Remotion + @remotion/cli must be **same version** (pinned)
- `trustedDependencies` needed for Remotion's native compositor binaries
- No remotion.config.ts needed — defaults work fine with Bun
- tsconfig: `moduleResolution: "bundler"`, `jsx: "react-jsx"`, target ES2022
