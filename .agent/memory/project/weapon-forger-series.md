---
name: weapon-forger-series
description: Weapon-forger (誰讓他煉器的) video series: characters, episodes, style guide, zh_TW locale
type: project
---

# Weapon-Forger Series (誰讓他煉器的！)

## Series Overview
- 12-episode xianxia comedy series about Zhou Mo (周墨), a logical thinker who applies modern engineering to weapon forging
- Built with Remotion + Bun, TTS via mlx_tts
- Locale: zh_TW (Traditional Chinese) — all dialog, UI text, scene titles
- Style: manga/anime-inspired with comic effects, battle FX, handwritten fonts

## Episodes
| Episode | Directory | Title | Scenes | Duration |
|---------|-----------|-------|--------|----------|
| Ch1 Ep1 | weapon-forger-ch1-ep1 | 入宗考試 | Title + 2 Content + Outro | ~4min |
| Ch1 Ep2 | weapon-forger-ch1-ep2 | 成績公布 | Title + 2 Content + Outro | ~4min |

## Characters
| Character | Name | Color | Voice | Side | Images |
|-----------|------|-------|-------|------|--------|
| zhoumo | 周墨 | #F59E0B (gold) | uncle_fu (male) | left | zhoumo.png, zhoumo-chibi.png |
| examiner | 考官 | #34D399 (green) | serena (female) | right | examiner.png, examiner-chibi.png |
| elder | 長老 | #A78BFA (purple) | uncle_fu (male) | center | elder.png |

## Style Consistency Rules (MUST follow for all episodes)
- **Title scene**: Clean gradient background (#0a0a1e→#1a0a2e→#2a1a0e), spring-animated text, forge fire glow. NO battle effects in title.
- **Fonts**: NotoSansTC (UI), MaShanZheng (brush calligraphy SFX), ZCOOLKuaiLe (playful SFX), ZhiMangXing (action SFX)
- **Dialog**: White semi-transparent box, colored name plate with spring entrance, typewriter effect
- **Background**: sect-gate.png with dark gradient overlay, Ken Burns zoom
- **Transitions**: TransitionSeries with varied types (clockWipe, wipe, slide, fade)
- **Character sprites**: Bottom-anchored, 75% height, speaking=full opacity+breathing, non-speaking=dimmed+desaturated
- **Face convention**: ALL images face LEFT by default, flip in Remotion by side position

## Audio Files
- `public/audio/01-title.wav`, `02-content1.wav`, `03-content2.wav`, `04-outro.wav`
- `public/audio/durations.json` — frame durations per scene, drives dynamic composition duration
