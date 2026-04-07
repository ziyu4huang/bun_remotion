# CLAUDE.md - Project Knowledge Index

Knowledge base is organized in `.agent/memory/` by category. Read relevant files before working.

## Quick Reference

- **Project:** bun-remotion — AI video generation using Remotion + Bun
- **Tech stack:** Bun + Remotion v4.0.290 + React 18 + TypeScript 5.8
- **Output:** MP4 (1920x1080, 30fps) via FFmpeg
- **JS runtime:** Always use Bun (not npm). `bun install`, `bun run`
- **No config needed:** No remotion.config.ts — defaults work with Bun

## Commands

| Command | What It Does |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun start` | Open Remotion Studio (localhost:3000) |
| `bun run build` | Render to `out/claude-code-intro.mp4` |
| `bun run upgrade` | Update Remotion packages |

## Project Structure

```
src/
  index.ts                          # Entry point — registerRoot()
  Root.tsx                          # Composition declarations
  components/                       # Reusable animation components
    FadeText.tsx                    # Fade-in text with translateY
    Candle.tsx                      # Candlestick chart element
    CandleChart.tsx                 # K-line chart container
  claude-code-intro/                # Claude Code intro video
    ClaudeCodeIntro.tsx             # Main composition (660 frames, 22s)
    scenes/
      TitleScene.tsx                # Opening title animation
      FeaturesScene.tsx             # Feature showcase with spring animations
      TerminalScene.tsx             # Terminal simulation
      OutroScene.tsx                # End screen
  scenes/                           # Additional scene components
    TitleScene.tsx                  # Title scene
    KLineScene.tsx                  # K-line/candlestick scene
    PriceVolumeScene.tsx            # Price & volume scene
    SupportResistanceScene.tsx      # Support & resistance scene
    MovingAverageScene.tsx          # Moving average scene
    TradingHoursScene.tsx           # Trading hours scene
    LimitScene.tsx                  # Price limit scene
```

## Key Remotion APIs

| API | Purpose |
|-----|---------|
| `<Composition>` | Register a video with id, fps, dimensions, duration |
| `<Sequence>` | Place scenes on timeline with start frame + duration |
| `<AbsoluteFill>` | Full-screen layout container |
| `useCurrentFrame()` | Get current frame for animation logic |
| `interpolate()` | Map values with easing and clamping |
| `Easing` | Cubic, back, elastic, bounce easing functions |

## package.json Notes

- Remotion + @remotion/cli must be **same version** (pinned to 4.0.290)
- `trustedDependencies` needed for Remotion's native compositor binaries
- tsconfig: `moduleResolution: "bundler"`, `jsx: "react-jsx"`, target ES2022

## Knowledge Files

### project/
- [project-overview](.agent/memory/project-overview.md) - Tech stack, structure, commands, Remotion concepts

## Convention

- Each note: self-contained, category in folder name
- New categories: `.agent/memory/<category>/<kebab-case-name>.md`
- Update this index when adding new files
