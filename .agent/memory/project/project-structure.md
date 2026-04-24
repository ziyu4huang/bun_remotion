---
name: project-structure
description: Full project directory tree for bun-remotion — Remotion video projects, bun_app utilities, and shared components
type: project
---

# Project Structure

## bun_remotion_proj/ — Remotion Video Projects

```
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
        TitleScene.tsx, FeaturesScene.tsx, TerminalScene.tsx, OutroScene.tsx
  taiwan-stock-market/              # @bun-remotion/taiwan-stock-market
    src/
      TaiwanStockMarket.tsx         # Main composition (1680 frames, 56s)
      scenes/ (TitleScene, KLineScene, PriceVolumeScene, SupportResistanceScene, MovingAverageScene, TradingHoursScene, LimitScene)
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
      scripts/sync-images.sh          # Copy fixture images into episodes (NOT symlinks)
    weapon-forger-ch1-ep1/            # Ep1 — Sect entrance exam
    weapon-forger-ch1-ep2/            # Ep2 — Results announced
    weapon-forger-ch1-ep3/            # Ep3 — Furnace repair
  my-core-is-boss/                  # My core is boss series (34-ep planned)
  storygraph-explainer/             # Storygraph explainer series (3-ep, tech_explainer)
```

## bun_app/ — Utility Packages

```
bun_app/
  storygraph/        # Story knowledge graph engine — CLI + pipeline scripts
    src/
      cli.ts                        # CLI entry point (bun run storygraph)
      pipeline-api.ts               # Exportable: runPipeline, runScore, runCheck, getPipelineStatus
      scripts/
        series-config.ts            # Per-series genre/category config
        graphify-pipeline.ts        # Full pipeline orchestrator
        graphify-episode.ts         # Per-episode extraction
        graphify-merge.ts           # Cross-episode merge
        graphify-consistency.ts     # Quality gate checks
        ai-client.ts                # GLM-5 API client
        subagent-prompt.ts          # AI prompt builders
        ... (many more scripts)
  episodeforge/      # Episode scaffolder — generates Remotion project from PLAN.md
    src/
      index.ts                      # CLI entry
      scaffold.ts                   # Exportable scaffold() function
  bun_webui/         # Web UI — Hono API + React SPA for pipeline orchestration
    src/
      server/
        index.ts                    # Hono app + Bun.serve()
        middleware/job-queue.ts     # Background job queue with SSE streaming
        routes/ (projects, pipeline, quality, assets, tts, render, workflows)
        services/ (project-scanner, asset-scanner, remotion-renderer, workflow-engine)
      client/
        App.tsx                     # React SPA with sidebar nav
        api.ts                      # Typed API client with SSE
        pages/ (Dashboard, Projects, Pipeline, Quality, Assets, TTS, Render, Workflows)
      shared/types.ts               # Shared API types
  bun_tts/           # TTS engine — MLX + Gemini backends
    src/
      tts-engine.ts                 # WAV utils + voice configuration
      tts-pipeline.ts               # generateTTS() pipeline
  remotion_types/    # Shared types — category taxonomy, scene templates
    src/
      category-types.ts             # 7 video categories + detectCategoryFromDirname
      scene-templates.ts            # Per-category CompositionSpec builders
      tech-explainer-presets.ts     # Storygraph explainer data
```
