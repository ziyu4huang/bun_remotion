# Weapon Forger (誰讓他煉器的！)

12-ep xianxia comedy series. Tone: "一本正經胡說八道" (deadpan absurd).

## Characters

| Character | Name | Voice | Color | Images |
|-----------|------|-------|-------|--------|
| zhoumo | 周墨 | uncle_fu (male) | #F59E0B (amber) | zhoumo.png, zhoumo-chibi.png |
| examiner | 考官 | serena (female) | #34D399 (emerald) | examiner.png, examiner-chibi.png |
| elder | 長老 | uncle_fu (male) | #A78BFA (purple) | elder.png |
| luyang | 陸陽 | uncle_fu (male) | #38BDF8 (sky blue) | luyang.png |
| mengjingzhou | 孟景舟 | uncle_fu (male) | #FB923C (orange) | mengjingzhou.png |
| narrator | — | uncle_fu (male) | — | — |

## Project Structure

```
weapon-forger/
  PLAN.md                    # This file
  fixture/
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
      images/                # Copies of fixture images (run sync-images.sh)
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

Dialog, character, and effect components now live in `bun_remotion_proj/shared/src/`. **New episodes MUST import from `@bun-remotion/shared`, not from `fixture/components/`.**

| Component | Import | Notes |
|-----------|--------|-------|
| CharacterSprite | `@bun-remotion/shared` | Use `emotion` prop (not `pose`), pass `characterConfig`, set `intensity="enhanced"` |
| DialogBox | `@bun-remotion/shared` | Pass `getCharacterConfig={(id) => CHARACTERS[id as Character]}` |
| BackgroundLayer | `@bun-remotion/shared` | Gradient default: `#0a0a1e→#1a0a2e→#2a1a0e` |
| ComicEffects | `@bun-remotion/shared` | 12 spring-based emoji effects |
| MangaSfx | `@bun-remotion/shared` | Manga onomatopoeia with starburst |
| SystemOverlay | `@bun-remotion/shared` | SystemNotification + SystemMessage |
| BattleEffects | `../../../fixture/components/BattleEffects` | **Project-local** — NOT shared |

See `/remotion-best-practices` skill → `rules/shared-components.md` for full API docs.

### Image Sync Convention

Each episode's `public/images/` contains **copies** of fixture images (NOT symlinks — Remotion's static server doesn't follow symlinks, causing 404 during render).

**Source of truth:** `fixture/characters/` and `fixture/backgrounds/`

After updating images in fixture, run the sync script:
```bash
bash fixture/scripts/sync-images.sh
```

This copies all fixture images into every episode's `public/images/`.

### Import Convention

**New episodes** import shared components and types from `@bun-remotion/shared`:

```typescript
// Shared components
import { CharacterSprite, DialogBox, BackgroundLayer, ComicEffects, MangaSfx, SystemNotification } from "@bun-remotion/shared";

// Shared types and fonts
import { notoSansTC, sfxFont, resolveCharacterImage, effectToEmoji } from "@bun-remotion/shared";
import type { Emotion, ComicEffect, CharacterConfig, DialogLine, MangaSfxEvent } from "@bun-remotion/shared";

// Per-group character definitions (weapon-forger specific)
import { CHARACTERS, type Character } from "../../../fixture/characters";

// Project-local only
import { BattleEffects } from "../../../fixture/components/BattleEffects";
```

**Legacy episodes** (ch1-ep1 through ch2-ep2) still import from `../../../fixture/components/`. These are pending migration — see TODO.md for each episode.

Episode `generate-tts` script path: `../fixture/scripts/generate-tts.ts` (relative from episode root).

## Episode Guide

| Episode | Title | Language | Characters | Status |
|---------|-------|----------|------------|--------|
| ch1-ep1 | 入宗考试 | zh-CN (Simplified) | zhoumo, examiner | Complete |
| ch1-ep2 | 成績公布 | zh-TW (Traditional) | zhoumo, examiner, elder | Complete |
| ch1-ep3 | 丹爐修復 | zh-TW (Traditional) | zhoumo, elder | Complete |
| ch2-ep1 | 禍害成軍 | zh-TW (Traditional) | zhoumo, luyang, mengjingzhou | Complete |
| ch2-ep2 | 低語洞窟 | zh-TW (Traditional) | zhoumo, luyang, mengjingzhou, soul | Complete |
| ch3-ep1 | 秘境探索 | zh-TW (Traditional) | zhoumo, luyang, mengjingzhou, elder | Complete |

## Adding a New Episode

Follow the `/remotion-best-practices` skill → load `rules/episode-creation.md` for the full workflow.

**Workflow summary:**
1. Read context (PLAN.md, previous narration.ts, previous outro teaser)
2. Write story draft → present **confirm block in zh_TW** → wait for user approval
3. After approval → scaffold episode (TODO.md → narration.ts → configs → scenes → update PLAN.md/dev.sh/package.json)
4. **Import from `@bun-remotion/shared`** for all shared components (CharacterSprite, DialogBox, etc.)
5. Verify style consistency against this PLAN.md
6. Generate TTS → verify in Studio → render MP4

**Migration status:** Episodes ch1-ep1 through ch2-ep2 still use legacy `fixture/components/` imports. New episodes (ch3+) must use `@bun-remotion/shared`.

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
  public/images/                             # Synced from fixture (run sync-images.sh)
  public/audio/                              # Generated by TTS (gitignored)
```

**Config updates (3 places):**
- `scripts/dev.sh` — add to `ALL_APPS` + `get_comp_id()` case
- Root `package.json` — add `start:wf-chN-epM`, `build:wf-chN-epM`, `generate-tts:wf-chN-epM`
- This `PLAN.md` — update Episode Guide table + Story Arcs + Commands

## Commands

```bash
# Studio
bash scripts/dev.sh studio weapon-forger-ch1-ep1
bash scripts/dev.sh studio weapon-forger-ch1-ep2
bash scripts/dev.sh studio weapon-forger-ch1-ep3
bash scripts/dev.sh studio weapon-forger-ch2-ep1
bash scripts/dev.sh studio weapon-forger-ch2-ep2
bash scripts/dev.sh studio weapon-forger-ch3-ep1

# Render
bash scripts/dev.sh render weapon-forger-ch1-ep1
bash scripts/dev.sh render weapon-forger-ch1-ep2
bash scripts/dev.sh render weapon-forger-ch1-ep3
bash scripts/dev.sh render weapon-forger-ch2-ep1
bash scripts/dev.sh render weapon-forger-ch2-ep2
bash scripts/dev.sh render weapon-forger-ch3-ep1

# TTS
bun run generate-tts:wf-ch1-ep1
bun run generate-tts:wf-ch1-ep2
bun run generate-tts:wf-ch1-ep3
bun run generate-tts:wf-ch2-ep1
bun run generate-tts:wf-ch2-ep2
bun run generate-tts:wf-ch3-ep1
```

---

## Story Arcs

### 第一章：入宗考试

**Ep1 — 入宗考试：** 周墨参加问道宗入宗测试，炼制了一把"全自动自导向飞剑"。飞剑没有飞向靶子，而是飞向了考官的储物袋——因为周墨设定的逻辑是"寻找灵气密度最高的目标"。考官认为此子具备问道宗"不当人"的潜质，破格录取。

**Ep2 — 成績公布：** 考官追責周墨，長老突然現身。長老看了飛劍後大為讚賞，認為煉器峰三百年來法寶設計越來越保守，周墨的創新思路正是他們需要的。周墨通過考試，但考官的儲物袋至今沒拿回來（因為飛劍沒有停止按鈕）。

**Ep3 — 丹爐修復：** 周墨正式加入煉器峰，長老交給他第一個任務：修復一座三百年歷史的丹爐。這座丹爐會說話且脾氣暴躁，因為被忽視了三百年。周墨發現問題的核心是「使用者體驗」，為丹爐安裝了情緒管理系統、語音控制和音樂播放功能。丹爐不再罵人——改為半夜唱歌。周墨加了定時休眠，但忘了加音量控制（招牌缺陷延續）。

### 第二章：与"祸害三人组"汇合

**Ep1 — 禍害成軍：** 周墨在煉器峰改良壓力釋放模組，炸掉了第三個鍋爐。爆炸聲引來了正在附近練「投降劍法」的陸陽（核心招式：「我認輸」和「別打了」，防守效率極高——因為對手笑到沒力氣）。隨後孟景舟登場，天賦是「單身光環」（被動技能，方圓三丈內女性自動遠離）。他已經寫了七篇論文研究自己為什麼沒有女朋友。三人發現彼此的共同點——「都不正常」——成立了「問道宗邏輯修正小組」。招牌缺陷延續：周墨改良了壓力釋放模組但忘加防爆閥。

**Ep2 — 低語洞窟：** 邏輯修正小組第一次正式任務——探索後山的低語洞窟。洞窟裡住著上古劍仙滄溟子的殘魂，已嚇跑十七批弟子。周墨把殘魂當成「離線終端」來修復，修好後發現——滄溟子是問道宗第三代長老，他煉了一把宗門至寶「滄溟之劍」，但三千年来沒人能拔出來。原因：他忘記加拔劍按鈕。招牌缺陷延續：周墨說「原來忘加按鈕是家族遺傳」。

### 第三章：秘境探索

**Ep1 — 秘境探索：** 長老派邏輯修正小組參加五年一次的宗門秘境探索。別家宗門在認真破解上古禁制，周墨掏出了「雷射切割陣法」——效率很高，但把整座秘境的禁制全切斷了，觸發了自毀倒數。招牌缺陷延續：雷射筆沒有方向限制，出口也被切斷了。現在問題很簡單：在一百八十息之內，找到一個不存在的出口。

### 第四章：师姐的"肯定"

云芝师姐看着周墨炼出的"能自动折叠成板砖的飞舟"，陷入沉思。

## 招牌梗追蹤（Running Gags）

Every episode MUST evolve these running gags — they are the series' identity.

| 梗 | Ep1 | Ep2 | Ep3 | Ch2-Ep1 | Ch2-Ep2 | Ch3-Ep1 | Ep4+ |
|----|-----|-----|-----|---------|---------|---------|------|
| 忘加按鈕 | 忘加停止按鈕 | 飛劍仍收不回來 | 記得加定時休眠，但忘加音量控制 | 改良壓力釋放模組但忘加防爆閥 | 滄溟子忘加拔劍按鈕 → 家族遺傳 | 雷射筆忘加方向控制 → 出口被切斷 | TBD |
| 現代科技用語 | 模組化設計、使用者體驗 | 演算法、手機 | 情感交互界面、系統升級 | 壓力釋放模組、演算法思維、被動技能、離線終端 | 自動防禦系統、密碼重設、記憶區段、人工智慧、常規維護 | 雷射切割陣法、聚焦式靈氣切割陣法發射器、冗餘設計、備份系統、計時觸發的自動防禦協議 | TBD |
| 法寶反噬 | 飛劍搶儲物袋 | 考官袋未取回 | 丹爐半夜唱歌 | 第三個鍋爐爆炸 | 滄溟之劍三千年沒人能拔出 | 雷射筆切了禁制也切了出口 → 自毀倒數 | TBD |

## 标志性原创法宝

| 法宝名称 | 看起来的功能 | 实际逻辑 |
|:----|:----|:----|
| "众生平等"印 | 范围压制 | 将方圆十里所有人智商拉低到二哈水平 |
| "顺着网线"飞剑 | 远程狙击 | 锁定骂人的声音波动，无视空间防御 |
| "反向跳槽"傀儡 | 战斗替身 | 被打坏后抱住敌人大腿喊"爸爸我投降"并吸收灵石 |
| "百分百被空手接白刃"剑 | 必中攻击 | 强力磁场让对方手掌贴在剑刃上 |
