---
name: galgame-meme-theater-series
description: Galgame meme theater series — PLAN.md pattern, ep1-ep7, zh_TW, characters, themes, bun_graphify support
type: project
---

# Galgame Meme Theater Series

## Series Bible: PLAN.md

The series has a PLAN.md at `bun_remotion_proj/galgame-meme-theater/PLAN.md`.

**How to apply:** When creating ep8+, always read PLAN.md first. Update episode guide table and commands after scaffolding.

## Characters (unchanged across all episodes)

- 小雪 (xiaoxue) — serena voice, #F472B6, 元氣系
- 小月 (xiaoyue) — vivian voice, #818CF8, 毒舌學霸
- 小樱 (xiaoying) — serena voice, #FB923C, 天然呆

## Episodes (ep1-ep7)

| Ep | Title | Theme | Status |
|----|-------|-------|--------|
| 1 | 美少女日常荒謬 | 日常生活中的荒謬場景 | Complete (not rendered) |
| 2 | 網路與遊戲篇 | 網路文化與遊戲梗 | Complete |
| 3 | 台灣日常篇 | 台灣人的日常真實寫照 | Complete |
| 4 | 學生黃金時代 | 期末考、手搖飲、捷運、實習 | Complete |
| 5 | 職場求生指南 | 面試、畫大餅、開會廢話、加班文化 | Complete |
| 6 | 戀愛煩惱大會 | 暗戀、直男迷惑、LINE聊天、催婚 | Complete |
| 7 | AI 時代求生 | AI代寫作業、AI回訊息、深度偽造、人類存在的意義 | Complete |

## Series Structure

```
galgame-meme-theater/
  PLAN.md              # Series bible
  assets/              # Shared characters, backgrounds, components, scripts, story, presets
  galgame-meme-theater-epN/  # Each episode is self-contained
```

- `assets/scripts/sync-images.sh` copies images into each episode's `public/images/`
- `assets/story/` has 5 story reference files: world-building, characters, plot-arcs, plot-lines, meme-topics
- `assets/presets/reaction-effects.ts` — curated ComicEffect combos

## Episode Pattern

Each episode has 6 scenes: TitleScene + 4 JokeScenes + OutroScene.
Each joke scene uses a different background to match its theme.
The OutroScene lists 4 takeaway lines matching the 4 joke themes.

## Key Difference from weapon-forger

- Flat numbering (ep1-epN) vs chapter-based (chN-epM)
- No running gags table in PLAN.md — gags tracked in `assets/story/plot-lines.md` (Signature Running Gags format)
- Single narrator voice (serena) vs per-character voice assignment (ep1-6 flat, ep7 per-character segments)
- Narration format: ep1 uses flat text per scene, ep7 uses per-character segments

## bun_graphify Support

Added 2026-04-16: series-config.ts has `galgameMemeTheaterConfig` with flat ep pattern.
- EP_ID format: `ep1`, `ep2`, ... (not `ch1ep1`)
- Gag source: `plot_lines_md` with `assets/story/plot-lines.md`
- Gag parsing: evolution-chain format (## Signature Running Gags)
- Pipeline output: 35 nodes, 49 edges, 15 link edges, 6 PASS / 1 WARN
