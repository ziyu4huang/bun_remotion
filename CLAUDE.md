# CLAUDE.md - Project Knowledge Index

Knowledge base is organized in `.agent/memory/` by category. Read relevant files before working.

## Quick Reference

- **Project:** bun-remotion — AI video generation using Remotion + Bun
- **Tech stack:** Bun + Remotion v4.0.290 + React 18 + TypeScript 5.8
- **Output:** MP4 (1920x1080, 30fps) via FFmpeg
- **JS runtime:** Always use Bun (not npm). `bun install`, `bun run`
- **No config needed:** No remotion.config.ts — defaults work with Bun

## Commands

All commands run from the **repo root**. Do NOT `cd` into `bun_remotion_proj/` — scripts handle directory changes internally via `scripts/dev.sh` (macOS/Linux) or `scripts/dev.ps1` (Windows).

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
bash scripts/dev.sh studio <app-name>
bash scripts/dev.sh render <app-name>
bash scripts/dev.sh render-all
```

## Project Structure

```
bun-remotion/
  package.json                        # Root: shared deps (remotion, react, typescript)
  tsconfig.json                       # Base tsconfig (extended by each app)
  bun_remotion_proj/
    shared/                           # @bun-remotion/shared
      src/
        index.ts                      # Barrel export
        FadeText.tsx                  # Fade-in text with translateY
        Candle.tsx                    # Candlestick chart element
        CandleChart.tsx               # K-line chart container
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
    three-little-pigs/                # @bun-remotion/three-little-pigs
    galgame-youth-jokes/              # Galgame youth jokes video
    galgame-meme-theater/             # Galgame meme theater ep1
    galgame-meme-theater-ep2/         # Galgame meme theater ep2 — gaming memes
    galgame-meme-theater-ep3/         # Galgame meme theater ep3 — Taiwan daily life
    galgame-meme-theater-ep4/         # Galgame meme theater ep4 — Student golden age
    xianxia-system-meme-ep1/          # System novel meme ep1 — Fail mission = erased (chibi + battle FX)
    xianxia-system-meme-ep2/          # System novel meme ep2 — EnergyWave + KamehamehaBeam battle FX
    weapon-forger-ch1-ep1/             # Weapon forger ch1 ep1 — Sect entrance exam (12-ep series)
    weapon-forger-ch1-ep2/             # Weapon forger ch1 ep2 — Results announced (zh_TW, manga SFX, shape effects)
```

## CRITICAL: Never `cd` into subdirectories

Claude Code's Bash tool persists the working directory across calls. Once you `cd bun_remotion_proj/xxx`, **all subsequent commands run from that directory** — including `bun run build:stock` which expects to be at the repo root. This causes silent failures and wrong-context bugs.

**Rules:**
- NEVER run `cd bun_remotion_proj/<name>` in Bash commands — not standalone, not with `&&`
- ALWAYS run commands from the repo root
- Use `scripts/dev.sh` for studio/render (macOS) or `scripts/dev.ps1` (Windows)
- For sub-app scripts, use `bun run --cwd bun_remotion_proj/<name> <script>` — sets CWD only for the spawned process, agent CWD stays at repo root
- For file operations, use absolute paths or Read/Write/Edit tools instead of `cd`

**Approved patterns:**
```bash
# ✅ studio/render
bash scripts/dev.sh studio claude-code-intro
bash scripts/dev.sh render claude-code-intro

# ✅ sub-app scripts (generate-tts, etc.)
bun run --cwd bun_remotion_proj/claude-code-intro generate-tts
bun run generate-tts:claude   # root package.json shortcut (also uses --cwd)

# ✅ direct script by path (no cd needed; __dirname resolves correctly)
bun bun_remotion_proj/claude-code-intro/scripts/generate-tts.ts

# ❌ never — persists CWD
cd bun_remotion_proj/claude-code-intro && bun run generate-tts
```

## Workspace Conventions

- **Root** holds shared deps (`remotion`, `react`, `typescript`) in `package.json`
- **`bun_remotion_proj/shared/`** — reusable components, imported as `@bun-remotion/shared`
- **`bun_remotion_proj/<name>/`** — each Remotion video project is self-contained with its own `package.json`, `tsconfig.json`, `src/index.ts`, `src/Root.tsx`
- To add a new video project: create `bun_remotion_proj/<name>/` with `package.json`, `tsconfig.json`, `src/index.ts`, `src/Root.tsx`

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
- [shared-fixture](.agent/memory/project/shared-fixture.md) - Reusable background images in shared-fixture/background/
- [bun-pi-agent](.agent/memory/project/bun-pi-agent.md) - Coding assistant agent: pi-agent-core/ai/coding-agent, CLI+HTTP SSE, z.ai provider
- [google-free-tier-apis](.agent/memory/project/google-free-tier-apis.md) - Google AI Studio free tier APIs: TTS (3 req/min, PCM→WAV), embedding, chat, image gen status
- [edge-tts](.agent/memory/project/edge-tts.md) - Microsoft Edge TTS via Python: free, no API key, zh-TW neural voices, MP3 output, Windows-tested
- [mlx-tts-integration](.agent/memory/project/mlx-tts-integration.md) - mlx_tts Python TTS engine at mlx_tts/: setup.sh, voices, story pipeline, model details
- [mlx-tts-models](.agent/memory/project/mlx-tts-models.md) - MLX-compatible TTS models for M1 8GB: Kokoro-82M-zh, Qwen3-TTS, Spark-TTS, edge-tts comparison
- [weapon-forger-series](.agent/memory/project/weapon-forger-series.md) - Weapon-forger (誰讓他煉器的) 12-ep series: characters, zh_TW, style consistency rules

### reference/
- [tree-sitter-python](.agent/memory/reference/tree-sitter-python.md) - tree-sitter v0.25+ Python API, grammar packages, Windows-specific notes
- [zai-provider](.agent/memory/reference/zai-provider.md) - z.ai API provider: Z_AI_API_KEY alias, model IDs (glm-4.5/4.6), pi-ai compat

### feedback/
- [character-facing-convention](.agent/memory/feedback/character-facing-convention.md) - ALL galgame character images face LEFT by default, Remotion flip rules by side position
- [no-playwright-visual-verify](.agent/memory/feedback/no-playwright-visual-verify.md) - Don't use Playwright + image analysis to verify Remotion layout — trust math, render output, let user verify
- [skill-creation](.agent/memory/feedback/skill-creation.md) - Skill structure: v2 load-on-demand (SKILL.md + engines/ + platforms/ + env-check.md) vs v1 (references/ + scripts/)
- [no-cd-in-bash](.agent/memory/feedback/no-cd-in-bash.md) - Never cd in Bash tool — CWD persists across calls causing silent failures
- [generate-image-skill](.agent/memory/feedback/generate-image-skill.md) - Lessons learned: use browser_run_code for batch, Escape overlay before next prompt, aria-label selectors
- [remotion-sequence-name](.agent/memory/feedback/remotion-sequence-name.md) - Always use name prop on Sequence for readable Studio timeline
- [graphify-windows-lessons](.agent/memory/feedback/graphify-windows-lessons.md) - graphify v0.3.20 on Windows: extension patching, tree-sitter API, encoding, Verilog AST
- [graphify-query-explain-lessons](.agent/memory/feedback/graphify-query-explain-lessons.md) - querying graph.json: links vs edges, node ID disambiguation, explain pipeline
- [parallel-bash-failure-cascade](.agent/memory/feedback/parallel-bash-failure-cascade.md) - isolate risky Bash calls; one failure cancels all parallel siblings
- [galimage-gen](.agent/memory/feedback/galimage-gen.md) - Galgame char images: always generate transparent BG + half-body upfront, never post-process
- [galgame-video-lessons](.agent/memory/feedback/galgame-video-lessons.md) - AI can't make transparent PNGs (use rembg), TTS must match dialog text, solid BGs cause black frames, Run button selector fix
- [battle-effects-ep2](.agent/memory/feedback/battle-effects-ep2.md) - Battle FX improvements: AnimatedLine primitive, EnergyWave (multi-line arcs), KamehamehaBeam (charge→fire→impact), ScreenShake
- [weapon-forger-ep2-lessons](.agent/memory/feedback/weapon-forger-ep2-lessons.md) - ScreenShake undefined delay = black frames, fadeOut use durationInFrames, elder image prop, remotion still verify

## Convention

- All memory stored in `.agent/memory/` (project-based, checked into git)
- Each note: self-contained, with YAML frontmatter (name, description, type)
- Types: `project`, `feedback`, `user`, `reference`
- New categories: `.agent/memory/<category>/<kebab-case-name>.md`
- Update this index when adding new files
- Do NOT use `~/.claude-glm/.../memory/` — this project uses project-based memory only
