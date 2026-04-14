# My Core Is Boss (我的核心是大佬)

「系統誤會流」喜劇系列。Tone: 「一本正經胡說八道」×「電子榨菜」。

## Characters

| Character | Name | Voice (mlx_tts) | Gender | Color |
|-----------|------|-----------------|--------|-------|
| linyi | 林逸 | ryan | male | #F59E0B (amber) |
| zhaoxiaoqi | 趙小七 | serena | female | #38BDF8 (sky blue) |
| xiaoelder | 蕭長老 | uncle_fu | male | #A78BFA (purple) |
| chenmo | 陳默 | ryan | male | #10B981 (emerald) (Ch8+) |
| narrator | — | vivian | female | #94A3B8 |

Voice configuration is centralized in `assets/voice-config.json` — single source of truth
for all engines (mlx_tts, gemini, edge_tts). See `voice-config.json` for per-engine mappings.

## Story Reference Files

For episode generation, load the relevant story context files as needed (instead of reading the full story):

- `assets/story/world-building.md` — world setting, cultivation system, location→background map
- `assets/story/characters.md` — character profiles, emotion guides, relationship dynamics, dialog style
- `assets/story/plot-arcs.md` — per-chapter/episode plot summaries with beats and effects
- `assets/story/plot-lines.md` — running gags, tracked threads, evolution table
- `assets/story/system-skills.md` — skill unlock progression, system versions, GameUI mapping
- `assets/presets/system-ui.ts` — system UI component presets (notifications, quests, HP bars)
- `assets/presets/battle-effects.ts` — xianxia battle effect configs (sword-qi, energy-wave, etc.)

## Project Structure

```
my-core-is-boss/
  PLAN.md                    # This file (technical reference)
  TODO.md                    # Overall project TODO
  assets/                    # Shared assets + code (source of truth)
    voice-config.json        # Centralized TTS voice config (per-engine, per-character)
    characters/              # Character images + JSON manifests (MULTI-EMOTION)
    backgrounds/             # Background images + JSON manifests
    characters.ts            # Character configs, types, Emotion, fonts, effects
    components/              # Shared React components
      BackgroundLayer.tsx
      CharacterSprite.tsx    # Supports `emotion` prop, resolves emotion images
      DialogBox.tsx
      ComicEffects.tsx
      MangaSfx.tsx
      SystemOverlay.tsx
      GameUI.tsx             # Game-style HUD (HpBar, LevelTag, QuestPanel, LoadingText)
      SceneIndicator.tsx
      ScreenShake.tsx
      dialogTiming.ts        # Shared getLineIndex() — proportional dialog-audio sync
    scripts/
      generate-tts.ts        # Shared TTS generator (mlx_tts + Gemini fallback)
      sync-images.sh         # Copy images from assets to episodes
    story/                   # Novel writing guides for AI agent context
      world-building.md
      characters.md
      plot-arcs.md
      plot-lines.md
      system-skills.md
    presets/                 # Reusable visual configuration presets
      system-ui.ts
      battle-effects.ts
  my-core-is-boss-ch1-ep1/   # Episode (lean — only scenes + narration)
  my-core-is-boss-ch1-ep2/
```

## Import Convention

Scenes import from assets using relative paths:

```typescript
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { notoSansTC, type DialogLine } from "../../../assets/characters";
import { PRESETS } from "../../../assets/presets/system-ui";
import { getBattleEffect } from "../../../assets/presets/battle-effects";
```

Components inside `assets/components/` import from `../characters` (sibling of components dir).
Episode `generate-tts` script path: `../assets/scripts/generate-tts.ts` (relative from episode root).

## Image Sync Convention

Each episode's `public/images/` contains **copies** of asset images (NOT symlinks — Remotion's static server doesn't follow symlinks, causing 404 during render).

**Source of truth:** `assets/characters/` and `assets/backgrounds/`

After updating images in assets, run the sync script:
```bash
bash assets/scripts/sync-images.sh
```

### Character JSON Format

Each character emotion has a `{character}-{emotion}.json` manifest with fields: `file`, `type`, `emotion`, `character`, `facing`, `description`, `prompt`, `backgroundStrategy`, `color`, `width`.

### Background JSON Format

Each background has a `{name}.json` manifest with fields: `file`, `description`, `prompt`, `color`, `chapters`.

## Episode Guide

| Ch | Ep | Title | Characters | Status |
|----|-----|-------|------------|--------|
| 1 | 1 | 首次誤會 | linyi, zhaoxiaoqi, xiaoelder | Scaffolding Complete |
| 1 | 2 | 任務跳過 | linyi, zhaoxiaoqi | Scaffolding Complete |
| 1 | 3 | Bug 利用 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 2 | 1 | 掛機修仙 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 2 | 2 | 經驗值農場 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 2 | 3 | 技能點分配 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 3 | 1 | 速通記錄 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 3 | 2 | 隱藏關卡 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 3 | 3 | 秘境 BOSS | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 4 | 1-4 | 副本開團 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 5 | 1-3 | 跨服 PK | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 6 | 1-3 | 系統更新 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 7 | 1-4 | 公會戰 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 8 | 1-4 | 另一個玩家 | linyi, zhaoxiaoqi, xiaoelder, chenmo | Planned |
| 9 | 1-4 | 終局副本 | linyi, zhaoxiaoqi, xiaoelder, chenmo | Planned |
| 10 | 1-3 | New Game+ | linyi, zhaoxiaoqi, xiaoelder, chenmo | Planned |

**Total: 10 chapters, 34 episodes**

## Commands

```bash
# Studio
bash scripts/dev.sh studio my-core-is-boss-ch1-ep1
bash scripts/dev.sh studio my-core-is-boss-ch1-ep2

# Render
bash scripts/dev.sh render my-core-is-boss-ch1-ep1
bash scripts/dev.sh render my-core-is-boss-ch1-ep2

# TTS
bun run generate-tts:mcb-ch1-ep1
bun run generate-tts:mcb-ch1-ep2
```

## Adding a New Episode

Follow the `/remotion-best-practices` skill for the full workflow.

**Workflow summary:**
1. Read `PLAN.md` + relevant `assets/story/*.md` files for the target chapter
2. Write story draft → present **confirm block in zh_TW** → wait for user approval
3. After approval → scaffold episode
4. Verify style consistency
5. Generate TTS → verify in Studio → render MP4

**File checklist for each new episode:**
```
my-core-is-boss-chN-epM/
  TODO.md, package.json, tsconfig.json
  scripts/narration.ts
  src/index.ts, src/Root.tsx, src/MyCoreIsBossChNEpM.tsx
  src/scenes/TitleScene.tsx, ContentScene*.tsx, OutroScene.tsx
  public/images/  (synced from assets)
  public/audio/   (generated by TTS, gitignored)
```

**Config updates (3 places):**
- `scripts/dev.sh` — add to `ALL_APPS` + `get_comp_id()` case
- Root `package.json` — add `start:mcb-chN-epM`, `build:mcb-chN-epM`, `generate-tts:mcb-chN-epM`
- This `PLAN.md` — update Episode Guide table

## Style Notes (vs. weapon-forger)

- **配色：** 科技感 (#0a0a2e→#0a1a3e→#1a0a2e) vs 鍛造風格 (#0a0a1e→#1a0a2e→#2a1a0e)
- **新增：** `GameUI.tsx` — 遊戲風格 HUD (HP bars, level tags, quest panels)
- **新增：** `assets/presets/` — 系統 UI + 戰鬥特效預設
- **新增：** `assets/story/` — 小說寫作結構指南
- **升級：** 多表情圖片系統 — `CharacterSprite` 透過 `emotion` prop 切換
- **相同：** 字體 (NotoSansTC + MaShanZheng/ZCOOLKuaiLe/ZhiMangXing)、DialogBox、ComicEffects、MangaSfx
- **相同：** 角色面向 — 所有圖片預設朝左，Remotion 中根據位置翻轉
