# CLAUDE.md - Project Knowledge Index

Knowledge base is organized in `.agent/memory/` by category. Read relevant files before working.

## Quick Reference

- **Project:** bun-remotion — AI video generation using Remotion + Bun (workspace monorepo)
- **Tech stack:** Bun workspaces + Remotion v4.0.290 + React 18 + TypeScript 5.8
- **Output:** MP4 (1920x1080, 30fps) via FFmpeg
- **JS runtime:** Always use Bun (not npm). `bun install`, `bun run`
- **No config needed:** No remotion.config.ts — defaults work with Bun

## Commands

All commands run from the **repo root**. Do NOT `cd` into `apps/` — scripts handle directory changes internally via `scripts/dev.ps1`.

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

Direct script usage (bypasses package.json):
```
pwsh scripts/dev.ps1 studio <app-name>
pwsh scripts/dev.ps1 render <app-name>
pwsh scripts/dev.ps1 render-all
```

## Project Structure

```
bun-remotion/
  package.json                        # Root: workspaces config + shared deps
  tsconfig.json                       # Base tsconfig (extended by workspaces)
  packages/
    shared/                           # @bun-remotion/shared
      src/
        index.ts                      # Barrel export
        FadeText.tsx                  # Fade-in text with translateY
        Candle.tsx                    # Candlestick chart element
        CandleChart.tsx               # K-line chart container
  apps/
    claude-code-intro/                # @bun-remotion/claude-code-intro
      src/
        index.ts                      # registerRoot()
        Root.tsx                      # Composition declarations
        ClaudeCodeIntro.tsx           # Main composition (660 frames, 22s)
        scenes/
          TitleScene.tsx              # Opening title animation
          FeaturesScene.tsx           # Feature showcase with spring animations
          TerminalScene.tsx           # Terminal simulation
          OutroScene.tsx              # End screen
    taiwan-stock-market/              # @bun-remotion/taiwan-stock-market
      src/
        index.ts                      # registerRoot()
        Root.tsx                      # Composition declarations
        TaiwanStockMarket.tsx         # Main composition (1680 frames, 56s)
        scenes/
          TitleScene.tsx              # Title scene
          KLineScene.tsx              # K-line/candlestick scene
          PriceVolumeScene.tsx        # Price & volume scene
          SupportResistanceScene.tsx  # Support & resistance scene
          MovingAverageScene.tsx      # Moving average scene
          TradingHoursScene.tsx       # Trading hours scene
          LimitScene.tsx              # Price limit scene
```

## CRITICAL: Never `cd` into subdirectories

Claude Code's Bash tool persists the working directory across calls. Once you `cd apps/xxx`, **all subsequent commands run from that directory** — including `bun run build:stock` which expects to be at the repo root. This causes silent failures and wrong-context bugs.

**Rules:**
- NEVER run `cd apps/<name>` or `cd packages/<name>` in Bash commands
- ALWAYS run commands from the repo root
- Use `scripts/dev.ps1` for app-specific operations (it uses `Push-Location`/`Pop-Location` internally and restores CWD)
- For file operations, use absolute paths or Read/Write/Edit tools instead of `cd`

## Workspace Conventions

- **Root** holds shared deps (`remotion`, `typescript`) and workspace config
- **`packages/shared/`** — reusable components, imported as `@bun-remotion/shared`
- **`apps/<name>/`** — each Remotion video project is self-contained with its own `package.json`, `tsconfig.json`, `src/index.ts`, `src/Root.tsx`
- Each app has its own `node_modules` via hoisting from root
- To add a new video project: create `apps/<name>/` with `package.json` (use `@bun-remotion/shared` as `workspace:*`), `tsconfig.json`, `src/index.ts`, `src/Root.tsx`

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
- tsconfig base: `moduleResolution: "bundler"`, `jsx: "react-jsx"`, target ES2022, `composite: true`

## Memory (project-based, in `.agent/memory/`)

All memory — project knowledge, user feedback, preferences — lives here. This replaces the separate `~/.claude-glm/` auto memory. Checked into git so it persists across machines.

### project/
- [project-overview](.agent/memory/project/project-overview.md) - Tech stack, structure, commands, Remotion concepts
- [google-free-tier-apis](.agent/memory/project/google-free-tier-apis.md) - Google AI Studio free tier APIs: TTS, embedding, chat, image gen status

### feedback/
- [skill-creation](.agent/memory/feedback/skill-creation.md) - User prefers structured SKILL.md with references/ and scripts/ subdirectories
- [no-cd-in-bash](.agent/memory/feedback/no-cd-in-bash.md) - Never cd in Bash tool — CWD persists across calls causing silent failures

## Convention

- All memory stored in `.agent/memory/` (project-based, checked into git)
- Each note: self-contained, with YAML frontmatter (name, description, type)
- Types: `project`, `feedback`, `user`, `reference`
- New categories: `.agent/memory/<category>/<kebab-case-name>.md`
- Update this index when adding new files
- Do NOT use `~/.claude-glm/.../memory/` — this project uses project-based memory only
