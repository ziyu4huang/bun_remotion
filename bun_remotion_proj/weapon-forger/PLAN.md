# Weapon Forger (誰讓他煉器的！)

12-ep xianxia comedy series. Tone: "一本正經胡說八道" (deadpan absurd).

## Chapter Rules

- **Episode count:** Each chapter MUST have **3-5 episodes**. No single-episode chapters.
- **Running gags:** Every episode MUST evolve at least 2 running gags (忘加按鈕, 現代科技用語, 法寶反噬).
- **Original artifact:** Each chapter should introduce at least one new 法寶 with absurd logic.
- **Arc closure:** Each chapter has a mini-arc with setup → escalation → cliffhanger into next chapter.

## Characters

| Character | Name | Voice (mlx_tts) | Gender | Color | Images | First Ep |
|-----------|------|-----------------|--------|-------|--------|----------|
| zhoumo | 周墨 | TBD | male | #F59E0B (amber) | zhoumo.png, zhoumo-chibi.png | ch1-ep1 |
| examiner | 考官 | serena | female | #34D399 (emerald) | examiner.png, examiner-chibi.png | ch1-ep1 |
| elder | 長老 | TBD | male | #A78BFA (purple) | elder.png | ch1-ep2 |
| luyang | 陸陽 | TBD | male | #38BDF8 (sky blue) | luyang.png | ch2-ep1 |
| mengjingzhou | 孟景舟 | TBD | male | #FB923C (orange) | mengjingzhou.png | ch2-ep1 |
| yunzhi | 雲芝 | serena | female | #EC4899 (pink) | yunzhi.png | ch4-ep1 (planned) |
| narrator | — | TBD | — | — | — | ch1-ep1 |

Voice configuration will be centralized in `assets/voice-config.json` — see TODO.md "TTS Voice Config Migration".
**Current problem:** zhoumo, elder, luyang, mengjingzhou, narrator ALL use `uncle_fu` — indistinguishable in shared scenes.
Need distinct voices per character when creating voice-config.json.

## Project Structure

```
weapon-forger/
  PLAN.md                    # This file
  assets/
    characters/              # Character images + JSON manifests
      zhoumo.png, zhoumo-chibi.png
      examiner.png, examiner-chibi.png
      elder.png
      *.json                 # Image generation metadata
    backgrounds/             # Group-specific background images
      sect-gate.png
    characters.ts            # Per-group: character configs, imports types/fonts from @bun-remotion/shared
    components/              # DEPRECATED — migrate to @bun-remotion/shared
      BattleEffects.tsx      # Project-local (NOT shared — different per project)
    scripts/
      generate-tts.ts        # Shared TTS generator (mlx_tts + Gemini fallback)
      sync-images.sh         # Image sync to episodes (legacy)
  weapon-forger-ch1-ep1/     # Episode (lean — only scenes + narration)
    public/
      images/                # Copies of assets images (run sync-images.sh)
      audio/                 # Episode-specific TTS output
    scripts/
      narration.ts           # Episode-specific narration + voice map
    src/
      scenes/                # Episode-specific scenes
      WeaponForgerCh1Ep1.tsx # Main component
      Root.tsx               # Composition
      index.ts               # registerRoot()
```

### Shared Components (@bun-remotion/shared)

Dialog, character, and effect components now live in `bun_remotion_proj/shared/src/`. **New episodes MUST import from `@bun-remotion/shared`, not from `assets/components/`.**

| Component | Import | Notes |
|-----------|--------|-------|
| CharacterSprite | `@bun-remotion/shared` | Use `emotion` prop (not `pose`), pass `characterConfig`, set `intensity="enhanced"` |
| DialogBox | `@bun-remotion/shared` | Pass `getCharacterConfig={(id) => CHARACTERS[id as Character]}` |
| BackgroundLayer | `@bun-remotion/shared` | Gradient default: `#0a0a1e→#1a0a2e→#2a1a0e` |
| ComicEffects | `@bun-remotion/shared` | 12 spring-based emoji effects |
| MangaSfx | `@bun-remotion/shared` | Manga onomatopoeia with starburst |
| SystemOverlay | `@bun-remotion/shared` | SystemNotification + SystemMessage |
| BattleEffects | `../../../assets/components/BattleEffects` | **Project-local** — NOT shared |

See `/remotion-best-practices` skill → `rules/shared-components.md` for full API docs.

### Image Sync Convention

Each episode's `public/images/` contains **copies** of assets images (NOT symlinks — Remotion's static server doesn't follow symlinks, causing 404 during render).

**Source of truth:** `assets/characters/` and `assets/backgrounds/`

After updating images in assets, run the sync script:
```bash
bash assets/scripts/sync-images.sh
```

This copies all assets images into every episode's `public/images/`.

### Import Convention

**New episodes** import shared components and types from `@bun-remotion/shared`:

```typescript
// Shared components
import { CharacterSprite, DialogBox, BackgroundLayer, ComicEffects, MangaSfx, SystemNotification } from "@bun-remotion/shared";

// Shared types and fonts
import { notoSansTC, sfxFont, resolveCharacterImage, effectToEmoji } from "@bun-remotion/shared";
import type { Emotion, ComicEffect, CharacterConfig, DialogLine, MangaSfxEvent } from "@bun-remotion/shared";

// Per-group character definitions (weapon-forger specific)
import { CHARACTERS, type Character } from "../../../assets/characters";

// Project-local only
import { BattleEffects } from "../../../assets/components/BattleEffects";
```

**Legacy episodes** (ch1-ep1 through ch2-ep2) still import from `../../../assets/components/`. These are pending migration — see TODO.md for each episode.

Episode `generate-tts` script path: `../assets/scripts/generate-tts.ts` (relative from episode root).

## Episode Guide

| Episode | Title | Language | Characters | Status |
|---------|-------|----------|------------|--------|
| ch1-ep1 | 入宗考试 | zh-CN (Simplified) | zhoumo, examiner | Complete |
| ch1-ep2 | 成績公布 | zh-TW (Traditional) | zhoumo, examiner, elder | Complete |
| ch1-ep3 | 丹爐修復 | zh-TW (Traditional) | zhoumo, elder | Complete |
| ch2-ep1 | 禍害成軍 | zh-TW (Traditional) | zhoumo, luyang, mengjingzhou | Complete |
| ch2-ep2 | 低語洞窟 | zh-TW (Traditional) | zhoumo, luyang, mengjingzhou, soul | Complete |
| ch2-ep3 | 三人成虎 | zh-TW (Traditional) | zhoumo, luyang, mengjingzhou, elder | Complete |
| ch3-ep1 | 秘境探索 | zh-TW (Traditional) | zhoumo, luyang, mengjingzhou, elder | Complete |
| ch3-ep2 | 智商測試 | zh-TW (Traditional) | zhoumo, luyang, mengjingzhou | Planned |
| ch3-ep3 | 秘境逃脫 | zh-TW (Traditional) | zhoumo, luyang, mengjingzhou | Planned |
| ch4-ep1 | 飛舟事件 | zh-TW (Traditional) | zhoumo, luyang, mengjingzhou, yunzhi | Planned |
| ch4-ep2 | 宗門大比 | zh-TW (Traditional) | zhoumo, luyang, mengjingzhou, yunzhi | Planned |
| ch4-ep3 | 師姐的評估 | zh-TW (Traditional) | zhoumo, yunzhi, elder | Planned |

**Chapter summary:** Ch1 = 3 eps, Ch2 = 3 eps, Ch3 = 3 eps, Ch4 = 3 eps. Total: 12 eps.

## Adding a New Episode

Follow the `/remotion-best-practices` skill → load `rules/episode-creation.md` for the full workflow.

**Workflow summary:**
1. Read context (PLAN.md, previous narration.ts, previous outro teaser)
2. Write story draft → present **confirm block in zh_TW** → wait for user approval
3. After approval → scaffold episode (TODO.md → narration.ts → configs → scenes → update PLAN.md/dev.sh/package.json)
4. **Import from `@bun-remotion/shared`** for all shared components (CharacterSprite, DialogBox, etc.)
5. Verify style consistency against this PLAN.md
6. Generate TTS → verify in Studio → render MP4

**Migration status:** Episodes ch1-ep1 through ch2-ep2 still use legacy `assets/components/` imports. New episodes (ch3+) must use `@bun-remotion/shared`.

**File checklist for each new episode:**
```
weapon-forger-chN-epM/
  TODO.md                                    # Task tracker
  package.json                               # @bun-remotion/weapon-forger-chN-epM
  tsconfig.json                              # extends ../../../tsconfig.json
  scripts/narration.ts                       # Episode dialog + voice map
  src/index.ts                               # registerRoot()
  src/Root.tsx                               # <Composition> with TTS-driven duration
  src/WeaponForgerChNEpM.tsx                 # Main component + TransitionSeries
  src/scenes/TitleScene.tsx                  # Title card (copy from prev ep, update text)
  src/scenes/ContentScene1.tsx               # Scene 1 dialog + effects
  src/scenes/ContentScene2.tsx               # Scene 2 dialog + effects
  src/scenes/OutroScene.tsx                  # Credits + teaser (update text)
  public/images/                             # Synced from assets (run sync-images.sh)
  public/audio/                              # Generated by TTS (gitignored)
```

**Config updates (3 places):**
- `scripts/dev.sh` — add to `ALL_APPS` + `get_comp_id()` case
- Root `package.json` — add `start:wf-chN-epM`, `build:wf-chN-epM`, `generate-tts:wf-chN-epM`
- This `PLAN.md` — update Episode Guide table + Story Arcs + Commands

## Commands

```bash
# Pattern: replace <ep> with episode name (e.g., weapon-forger-ch1-ep1)
bash scripts/dev.sh studio <ep>       # Open in Remotion Studio
bash scripts/dev.sh render <ep>       # Render to MP4
bun run generate-tts:wf-<chN-epM>     # Generate TTS audio
```

---

## Story Reference Files

Story content extracted to focused files under `assets/story/`:

| File | Content |
|------|---------|
| `assets/story/world-building.md` | 世界觀、地點、背景圖對應、視覺風格 |
| `assets/story/characters.md` | 角色詳細、表情系統、對話風格、關係動態 |
| `assets/story/plot-arcs.md` | 每集摘要、節拍、所需角色/特效 |
| `assets/story/plot-lines.md` | 招牌梗追蹤、情節線、原創法寶清單 |

Visual presets under `assets/presets/`:

| File | Content |
|------|---------|
| `assets/presets/battle-effects.ts` | 戰鬥特效預設（飛劍、能量波、爆炸等） |
| `assets/presets/weapon-crafting.ts` | 煉器場景預設（爐火、錘擊、出爐等） |

## Knowledge Graph Stats

Per-episode KG extraction from narration.ts (regenerated 2026-04-14):

| Episode | Nodes | Links | Comms | Characters | Tech Terms | Traits |
|---------|-------|-------|-------|------------|------------|--------|
| ch1-ep1 | 24 | 25 | 3 | 3 | 8 | 5 |
| ch1-ep2 | 26 | 31 | 3 | 4 | 6 | 8 |
| ch1-ep3 | 24 | 27 | 3 | 3 | 6 | 7 |
| ch2-ep1 | 24 | 29 | 4 | 4 | 5 | 7 |
| ch2-ep2 | 28 | 39 | 4 | 5 | 4 | 11 |
| ch2-ep3 | 26 | 38 | 3 | 5 | 4 | 9 |
| ch3-ep1 | 25 | 36 | 3 | 5 | 3 | 9 |

**Merged graph:** 177 nodes, 371 edges, 85 link edges (same_character: 61, gag_evolves: 18, story_continues: 6)

**Visualization:** `bun_graphify_out/graph.html` (merged, episode-colored)

**Observations:**
- Tech terms decrease from ch1 (8) → ch3 (3) — ch3+ episodes should use more tech vocabulary
- ch2-ep2 has the richest graph (28 nodes, 39 links) — good scene complexity
- Character traits grow across episodes as characters develop
