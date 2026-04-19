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
        index.ts                      # Barrel export (types, fonts, utils, components)
        types.ts                      # Emotion, ComicEffect, CharacterConfig, DialogLine, manifests
        fonts.ts                      # NotoSansTC, MaShanZheng, ZCOOLKuaiLe, ZhiMangXing, sfxFont()
        utils.ts                      # resolveCharacterImage(), effectToEmoji()
        FadeText.tsx                  # Fade-in text with translateY
        Candle.tsx                    # Candlestick chart element
        CandleChart.tsx               # K-line chart container
        components/
          index.ts                    # Component barrel
          CharacterSprite.tsx         # Unified: emotion + chibi + face mirror + intensity
          DialogBox.tsx               # Typewriter dialog with name plate
          BackgroundLayer.tsx         # Ken Burns zoom background
          ComicEffects.tsx            # Spring-based emoji effects (12 types)
          MangaSfx.tsx                # Manga onomatopoeia with starburst
          SystemOverlay.tsx           # System notification + message overlays
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
    galgame-meme-theater/             # Galgame meme theater (PLAN.md + fixture/)
      galgame-meme-theater-ep1/       # EP1 — everyday absurdity
      galgame-meme-theater-ep2/       # EP2 — gaming memes
      galgame-meme-theater-ep3/       # EP3 — Taiwan daily life
      galgame-meme-theater-ep4/       # EP4 — Student golden age
      galgame-meme-theater-ep5/       # EP5 — Workplace survival guide
    xianxia-system-meme-ep1/          # System novel meme ep1 — Fail mission = erased (chibi + battle FX)
    xianxia-system-meme-ep2/          # System novel meme ep2 — EnergyWave + KamehamehaBeam battle FX
    weapon-forger/                      # Weapon forger series (12-ep)
      fixture/                          # Shared assets (characters, backgrounds, components)
        characters/                     # Character PNGs (canonical source)
        backgrounds/                    # Background PNGs (canonical source)
        components/                     # Shared React components
        scripts/sync-images.sh          # Copy fixture images into episodes (NOT symlinks — Remotion can't follow them)
      weapon-forger-ch1-ep1/            # Ep1 — Sect entrance exam
      weapon-forger-ch1-ep2/            # Ep2 — Results announced
      weapon-forger-ch1-ep3/            # Ep3 — Furnace repair
```

## Video Categories

Every Remotion project has a **category** that determines scene structure, animation style, and audio mode.
Defined in `bun_app/remotion_types/src/category-types.ts`.

| Category | zh_TW | Projects | Dialog System |
|----------|-------|----------|---------------|
| **Narrative Drama** | 敘事劇情 | weapon-forger, my-core-is-boss, xianxia-system-meme | dialogLines[] |
| **Galgame VN** | 美少女遊戲風 | galgame-meme-theater, galgame-youth-jokes | dialogLines[] |
| **Tech Explainer** | 技術講解 | claude-code-intro, *(storygraph-intro)* | narration_script |
| **Data Story** | 數據故事 | taiwan-stock-market | narration_script |
| **Listicle** | 盤點清單 | *(none yet)* | item_list |
| **Tutorial** | 教學指南 | *(none yet)* | step_guide |
| **Shorts / Meme** | 短影音迷因 | *(none yet)* | none (sfx only) |

**Category ≠ Genre.** Genre = story content style (xianxia_comedy). Category = video format (narrative_drama).
A series has BOTH: `weapon-forger → xianxia_comedy + narrative_drama`.

## Post-clone setup

After a fresh clone, weapon-forger episodes need symlinks to shared images:
```bash
bash bun_remotion_proj/weapon-forger/fixture/scripts/sync-images.sh
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
- [bun-pi-agent](.agent/memory/project/bun-pi-agent.md) - Coding assistant agent (renamed to bun_pi_agent): pi-agent-core/ai/coding-agent, CLI+HTTP SSE, z.ai provider
- [google-free-tier-apis](.agent/memory/project/google-free-tier-apis.md) - Google AI Studio free tier APIs: TTS (3 req/min, PCM→WAV), embedding, chat, image gen status
- [edge-tts](.agent/memory/project/edge-tts.md) - Microsoft Edge TTS via Python: free, no API key, zh-TW neural voices, MP3 output, Windows-tested
- [mlx-tts-integration](.agent/memory/project/mlx-tts-integration.md) - mlx_tts Python TTS engine at mlx_tts/: setup.sh, voices, story pipeline, model details
- [mlx-tts-models](.agent/memory/project/mlx-tts-models.md) - MLX-compatible TTS models for M1 8GB: Kokoro-82M-zh, Qwen3-TTS, Spark-TTS, edge-tts comparison
- [weapon-forger-series](.agent/memory/project/weapon-forger-series.md) - Weapon-forger (誰讓他煉器的) 12-ep series: characters, zh_TW, style consistency rules
- [galgame-meme-theater-series](.agent/memory/project/galgame-meme-theater-series.md) - Galgame meme theater series: PLAN.md pattern, ep1-ep5, zh_TW, workplace theme
- [web-ui-vision](.agent/memory/project/web-ui-vision.md) - Web UI long-term plan: Bun + Hono + React SPA, Phase 35-39, full pipeline orchestration

### reference/
- [tree-sitter-python](.agent/memory/reference/tree-sitter-python.md) - tree-sitter v0.25+ Python API, grammar packages, Windows-specific notes
- [zai-provider](.agent/memory/reference/zai-provider.md) - z.ai API provider: Z_AI_API_KEY alias, model IDs (glm-4.5/4.6), pi-ai compat

### feedback/
- [shared-component-architecture](.agent/memory/feedback/shared-component-architecture.md) - Unified @bun-remotion/shared: CharacterSprite, DialogBox, ComicEffects etc. — use `emotion` not `pose`, import from shared
- [character-facing-convention](.agent/memory/feedback/character-facing-convention.md) - ALL galgame character images face LEFT by default, Remotion flip rules by side position
- [no-playwright-visual-verify](.agent/memory/feedback/no-playwright-visual-verify.md) - Don't use Playwright + image analysis to verify Remotion layout — trust math, render output, let user verify
- [skill-creation](.agent/memory/feedback/skill-creation.md) - Skill structure: v2 load-on-demand (SKILL.md + engines/ + platforms/ + env-check.md) vs v1 (references/ + scripts/)
- [no-cd-in-bash](.agent/memory/feedback/no-cd-in-bash.md) - Never cd in Bash tool — CWD persists across calls causing silent failures
- [generate-image-skill](.agent/memory/feedback/generate-image-skill.md) - Lessons learned: use browser_run_code for batch, Escape overlay before next prompt, aria-label selectors
- [remotion-sequence-name](.agent/memory/feedback/remotion-sequence-name.md) - Always use name prop on Sequence for readable Studio timeline
- [graphify-windows-lessons](.agent/memory/feedback/graphify-windows-lessons.md) - graphify v0.3.20 on Windows: extension patching, tree-sitter API, encoding, Verilog AST
- [storygraph-story-kg](.agent/memory/feedback/storygraph-story-kg.md) - Story KG pipeline: subagent for NL analysis, federated merge, Playwright verify, HTML template bugs
- [graphify-query-explain-lessons](.agent/memory/feedback/graphify-query-explain-lessons.md) - querying graph.json: links vs edges, node ID disambiguation, explain pipeline
- [parallel-bash-failure-cascade](.agent/memory/feedback/parallel-bash-failure-cascade.md) - isolate risky Bash calls; one failure cancels all parallel siblings
- [galimage-gen](.agent/memory/feedback/galimage-gen.md) - Galgame char images: always generate transparent BG + half-body upfront, never post-process
- [galgame-video-lessons](.agent/memory/feedback/galgame-video-lessons.md) - AI can't make transparent PNGs (use rembg), TTS must match dialog text, solid BGs cause black frames, Run button selector fix
- [battle-effects-ep2](.agent/memory/feedback/battle-effects-ep2.md) - Battle FX improvements: AnimatedLine primitive, EnergyWave (multi-line arcs), KamehamehaBeam (charge→fire→impact), ScreenShake
- [weapon-forger-ep2-lessons](.agent/memory/feedback/weapon-forger-ep2-lessons.md) - ScreenShake undefined delay = black frames, fadeOut use durationInFrames, elder image prop, remotion still verify
- [no-duplicate-tool-runs](.agent/memory/feedback/no-duplicate-tool-runs.md) - Don't re-run long commands (render, build) that already completed — check output instead
- [my-core-is-boss-ep1-lessons](.agent/memory/feedback/my-core-is-boss-ep1-lessons.md) - normalizeEffects export, deterministic ScreenShake, SceneIndicator extraction, derive side from CHARACTERS
- [dialog-audio-sync](.agent/memory/feedback/dialog-audio-sync.md) - Proportional dialog timing via segment-durations.json + getLineIndex() — equal division causes text-audio mismatch
- [remotion-no-symlinks](.agent/memory/feedback/remotion-no-symlinks.md) - Remotion static server can't follow symlinks — always copy files for public/ assets, never symlink
- [confirm-format-zhtw](.agent/memory/feedback/confirm-format-zhtw.md) - When presenting episode content for user confirmation, show all story/dialog in zh_TW — never English summaries
- [fixture-to-assets-migration](.agent/memory/feedback/fixture-to-assets-migration.md) - SOP: fixture→assets rename + story guides + genre presets. my-core-is-boss done, galgame-meme-theater & weapon-forger pending
- [episode-polish-checklist](.agent/memory/feedback/episode-polish-checklist.md) - Post-scaffold polish: effect pacing (≤50%), background variety, title hook, outro QuestBadge
- [plan-todo-sync-enforcement](.agent/memory/feedback/plan-todo-sync-enforcement.md) - Episode PLAN.md + workspace sections drift for legacy series — sync check runs first in episode-setup topic

## Convention

- All memory stored in `.agent/memory/` (project-based, checked into git)
- Each note: self-contained, with YAML frontmatter (name, description, type)
- Types: `project`, `feedback`, `user`, `reference`
- New categories: `.agent/memory/<category>/<kebab-case-name>.md`
- Update this index when adding new files
- Do NOT use `~/.claude-glm/.../memory/` — this project uses project-based memory only
