# Weapon Forger (誰讓他煉器的！)

12-ep xianxia comedy series. Tone: "一本正經胡說八道" (deadpan absurd).

## Chapter Rules

- **Episode count:** Each chapter MUST have **3-5 episodes**. No single-episode chapters.
- **Running gags:** Every episode MUST evolve at least 2 running gags (忘加按鈕, 現代科技用語, 法寶反噬).
- **Original artifact:** Each chapter should introduce at least one new 法寶 with absurd logic.
- **Arc closure:** Each chapter has a mini-arc with setup → escalation → cliffhanger into next chapter.

## Characters

| Character | Name | Voice | Color | Images | First Ep |
|-----------|------|-------|-------|--------|----------|
| zhoumo | 周墨 | uncle_fu (male) | #F59E0B (amber) | zhoumo.png, zhoumo-chibi.png | ch1-ep1 |
| examiner | 考官 | serena (female) | #34D399 (emerald) | examiner.png, examiner-chibi.png | ch1-ep1 |
| elder | 長老 | uncle_fu (male) | #A78BFA (purple) | elder.png | ch1-ep2 |
| luyang | 陸陽 | uncle_fu (male) | #38BDF8 (sky blue) | luyang.png | ch2-ep1 |
| mengjingzhou | 孟景舟 | uncle_fu (male) | #FB923C (orange) | mengjingzhou.png | ch2-ep1 |
| yunzhi | 雲芝 | serena (female) | #EC4899 (pink) | yunzhi.png | ch4-ep1 (planned) |
| narrator | — | uncle_fu (male) | — | — | ch1-ep1 |

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
bash scripts/dev.sh studio weapon-forger-ch2-ep3
bash scripts/dev.sh studio weapon-forger-ch3-ep1

# Render
bash scripts/dev.sh render weapon-forger-ch1-ep1
bash scripts/dev.sh render weapon-forger-ch1-ep2
bash scripts/dev.sh render weapon-forger-ch1-ep3
bash scripts/dev.sh render weapon-forger-ch2-ep1
bash scripts/dev.sh render weapon-forger-ch2-ep2
bash scripts/dev.sh render weapon-forger-ch2-ep3
bash scripts/dev.sh render weapon-forger-ch3-ep1

# TTS
bun run generate-tts:wf-ch1-ep1
bun run generate-tts:wf-ch1-ep2
bun run generate-tts:wf-ch1-ep3
bun run generate-tts:wf-ch2-ep1
bun run generate-tts:wf-ch2-ep2
bun run generate-tts:wf-ch2-ep3
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

**Ep3 — 三人成虎：** 滄溟子的殘魂恢復後成為邏輯修正小組的「名譽顧問」。三人接到第二個任務：修復後山崩塌的「藏經閣」。藏經閣裡的書籍會攻擊靠近的人——因為三百年沒人看過它們，「書的怨念」形成了自動防禦。陸陽的投降表被一本書搶走並讀了出聲，孟景舟的論文被一本書批改了，加上滿滿的紅筆。周墨發現解決方法很簡單：給每本書「點讚」。書籍們得到認可後停止攻擊，但現在藏經閣裡的書都會主動找周墨要「更新評價」。招牌缺陷延續：周墨給書加了「自動評價系統」但忘加評價標準——書們開始互相吹捧，藏經閣的文學水平直線下降。

### 第三章：秘境探索（3 episodes）

**Ep1 — 秘境探索：** 長老派邏輯修正小組參加五年一次的宗門秘境探索。別家宗門在認真破解上古禁制，周墨掏出了「雷射切割陣法」——效率很高，但把整座秘境的禁制全切斷了，觸發了自毀倒數。招牌缺陷延續：雷射筆沒有方向限制，出口也被切斷了。現在問題很簡單：在一百八十息之內，找到一個不存在的出口。

**Ep2 — 智商測試：** 邏輯修正小組在自毀倒計時中瘋狂找出口，結果發現秘境的核心藏著一個更大的秘密——上古大能設計這個秘境的真正目的，是為了測試後人的智商。秘境的核心是一個「邏輯謎題陣」，只有智商不超過某個閾值的人才能通過（這也是為什麼周墨能通過所有關卡）。其他宗門的天才弟子們因為想太多全部失敗，只有周墨用「最笨的方法」一路過關。招牌缺陷延續：周墨解謎的方法太直接，把秘境的防禦系統也解了。

**Ep3 — 秘境逃脫：** 秘境的核心其實是上古大能留下的「煉器寶庫」，裡面存放著大量上古法寶藍圖。周墨拿到藍圖後如獲至寶，但秘境的出口需要用特定的「鑰匙」打開——而這把鑰匙被周墨當成廢鐵丟進了他的「材料回收箱」。招牌缺陷延續：周墨的材料回收箱沒有分類功能，他在三千多件廢鐵中翻找鑰匙。其他宗門的弟子們已經開始在秘境裡蓋房子了。

### 第四章：师姐的"肯定"（3 episodes）

**Ep1 — 飛舟事件：** 宗門大比，各組需要煉製飛舟。其他組煉出華麗的仙鶴、威武的蛟龍。周墨煉出「能自動折疊成板磚的飛舟」——設計理念是「便於攜帶」。飛舟在比試中折疊成板磚，不小心把隔壁組的仙鶴拍扁了。師姐雲芝第一次登場，對周墨的法寶進行「嚴格評估」，結論是：「設計理念很實用，但執行方式有問題。比如，你忘了加展開按鈕。」招牌缺陷延續：飛舟忘加展開按鈕，只能永遠保持板磚形態。

**Ep2 — 宗門大比：** 周墨的板磚飛舟被強制參賽。比試項目包括速度、防禦、載重。周墨用工程師思維解決問題：速度靠「流線型板磚」通過風阻測試，防禦靠「板磚夠硬」，載重靠「板磚面積大」。其他組的飛舟紛紛墜落，只有板磚穩穩落地。但評委認為這不是飛舟，這是一塊磚。招牌缺陷延續：周墨說服評委的邏輯太過硬核，評委們開始懷疑自己的專業水平。

**Ep3 — 師姐的評估：** 雲芝師姐正式對周墨進行評估，讓他修復一座損壞的上古煉器爐。周墨修好了，但爐子多了「語音助手」功能——會在別人煉器時給出「建議」，建議內容包括「溫度太高了，建議降低三百度」和「你這個手法不對，建議參考第三章第七節」。全宗門的煉器師瘋了。招牌缺陷延續：語音助手沒有音量控制（和 ch1-ep3 丹爐問題相同——周墨的設計模式重複），而且會在半夜朗讀上古煉器手冊。

## 招牌梗追蹤（Running Gags）

Every episode MUST evolve these running gags — they are the series' identity.

| 梗 | Ep1 | Ep2 | Ep3 | Ch2-Ep1 | Ch2-Ep2 | Ch2-Ep3 | Ch3-Ep1 | Ep4+ |
|----|-----|-----|-----|---------|---------|---------|---------|------|
| 忘加按鈕 | 忘加停止按鈕 | 飛劍仍收不回來 | 記得加定時休眠，但忘加音量控制 | 改良壓力釋放模組但忘加防爆閥 | 滄溟子忘加拔劍按鈕 → 家族遺傳 | 忘加評價標準 → 書們互相吹捧 | 雷射筆忘加方向控制 → 出口被切斷 | TBD |
| 現代科技用語 | 模組化設計、使用者體驗 | 演算法、手機 | 情感交互界面、系統升級 | 壓力釋放模組、演算法思維、被動技能、離線終端 | 自動防禦系統、密碼重設、記憶區段、人工智慧、常規維護 | 資訊系統、認可系統、自動評價系統、評價標準 | 雷射切割陣法、聚焦式靈氣切割陣法發射器、冗餘設計、備份系統、計時觸發的自動防禦協議 | TBD |
| 法寶反噬 | 飛劍搶儲物袋 | 考官袋未取回 | 丹爐半夜唱歌 | 第三個鍋爐爆炸 | 滄溟之劍三千年沒人能拔出 | 藏經閣書籍假評價工廠 | 雷射筆切了禁制也切了出口 → 自毀倒數 | TBD |

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

## 标志性原创法宝

| 法宝名称 | 看起来的功能 | 实际逻辑 |
|:----|:----|:----|
| "众生平等"印 | 范围压制 | 将方圆十里所有人智商拉低到二哈水平 |
| "顺着网线"飞剑 | 远程狙击 | 锁定骂人的声音波动，无视空间防御 |
| "反向跳槽"傀儡 | 战斗替身 | 被打坏后抱住敌人大腿喊"爸爸我投降"并吸收灵石 |
| "百分百被空手接白刃"剑 | 必中攻击 | 强力磁场让对方手掌贴在剑刃上 |
