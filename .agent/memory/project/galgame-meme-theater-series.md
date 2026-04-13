---
name: galgame-meme-theater-series
description: Galgame meme theater series — PLAN.md pattern, ep1-ep5, zh_TW, characters, themes
type: project
---

# Galgame Meme Theater Series

## Series Bible: PLAN.md

The series has a PLAN.md at `bun_remotion_proj/galgame-meme-theater/PLAN.md` — created during ep5 scaffolding (learned from weapon-forger pattern).

**Why:** Before ep5, the series had no central reference doc. Each episode was self-contained with no episode guide, no command reference, no naming conventions documented. PLAN.md fixes this.

**How to apply:** When creating ep6+, always read PLAN.md first. Update episode guide table and commands after scaffolding.

## Characters (unchanged across all episodes)

- 小雪 (xiaoxue) — serena voice, #F472B6, 元氣系
- 小月 (xiaoyue) — vivian voice, #818CF8, 毒舌學霸
- 小樱 (xiaoying) — serena voice, #FB923C, 天然呆

## Episodes (ep1-ep5)

| Ep | Title | Theme | Key Jokes |
|----|-------|-------|-----------|
| 1 | 美少女日常荒謬 | Everyday absurdity | — |
| 2 | 網路與遊戲 | Internet & gaming | — |
| 3 | 台灣生活日常 | Taiwan daily life | 過年靈魂拷問, 夜市 |
| 4 | 學生黃金時代 | Student life | 期末考, 手搖飲, 捷運, 實習 |
| 5 | 職場求生指南 | Workplace | 面試, 畫大餅, 開會廢話, 加班 |

## Series Structure

```
galgame-meme-theater/
  PLAN.md              # Series bible
  fixture/             # Shared characters, backgrounds, components, scripts
  galgame-meme-theater-epN/  # Each episode is self-contained
```

- Fixture dir uses `sync-images.sh` to copy images into each episode's `public/images/`
- `fixture/characters.ts` has shared Character type, DialogLine type, ComicEffect types
- `fixture/components/` has BackgroundLayer, CharacterSprite, ComicEffects, DialogBox, TitleCard

## Episode Pattern

Each episode has exactly 6 scenes: TitleScene + 4 JokeScenes + OutroScene.
Each joke scene uses a different background to match its theme.
The TitleScene is a 6-phase cinematic sequence (title slam → hold → joke teasers → character showcase → build-up → fade out).
The OutroScene lists 4 takeaway lines matching the 4 joke themes.

## Key Difference from weapon-forger

- Flat numbering (ep1-epN) vs chapter-based (chN-epM)
- No running gags table — each episode is a standalone theme
- Single narrator voice (serena) vs per-character voice assignment
- Narration format: plain text per scene vs per-character segments
- Simpler confirm template (no running gags section)
