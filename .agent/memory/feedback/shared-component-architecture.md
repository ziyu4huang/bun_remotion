---
name: shared-component-architecture
description: Unified @bun-remotion/shared component system replacing per-group fixture component duplication
type: feedback
---

# Shared Component Architecture (`@bun-remotion/shared`)

## What changed (2026-04-14)
Extracted duplicated components from weapon-forger, galgame-meme-theater, my-core-is-boss fixture directories into a single shared package `@bun-remotion/shared`.

**Why:** 3+ groups had forked copies of CharacterSprite (255/187/199 lines), DialogBox, ComicEffects, etc. ~174MB of duplicated images across 14 episodes. Bug fixes had to be applied 3x.

**How to apply:**
- New episodes MUST import components from `@bun-remotion/shared`, not from `../../../fixture/components/`
- Use `emotion` prop (not `pose`) on CharacterSprite
- Pass `characterConfig={CHARACTERS[character]}` explicitly (no global CHARACTERS import inside shared components)
- Use `intensity="enhanced"` for weapon-forger/xianxia, `intensity="subtle"` for galgame
- Per-group `fixture/components/` are deprecated — will be deleted after all episodes migrate

## Shared Package Structure

```
bun_remotion_proj/shared/src/
  types.ts          # Emotion (13 values), ComicEffect (12), CharacterConfig, DialogLine, MangaSfxEvent, manifests
  fonts.ts          # NotoSansTC, MaShanZheng, ZCOOLKuaiLe, ZhiMangXing, sfxFont()
  utils.ts          # resolveCharacterImage(character, emotion?), effectToEmoji()
  components/
    CharacterSprite.tsx  # Unified: emotion + chibi + face mirror + intensity
    DialogBox.tsx        # getCharacterConfig callback (no hardcoded CHARACTERS)
    BackgroundLayer.tsx  # Ken Burns zoom background
    ComicEffects.tsx     # 12 spring-based emoji effects
    MangaSfx.tsx         # Starburst onomatopoeia
    SystemOverlay.tsx    # SystemNotification + SystemMessage
```

## Key Design Decisions
- `Emotion` superset: includes weapon-forger poses (angry, shocked, smirk, nervous) + my-core-is-boss emotions (smile, laugh, sweat, think, cry, gloating, confused, chibi)
- `BattleEffects.tsx` is NOT shared — genuinely different per project (different exports/animations)
- `DialogBox` uses `getCharacterConfig: (id: string) => CharacterConfig` callback instead of importing a global CHARACTERS map

## Import Pattern (new episodes)

```typescript
import { CharacterSprite, DialogBox, ComicEffects, MangaSfx, BackgroundLayer, SystemNotification } from "@bun-remotion/shared";
import { notoSansTC, maShanZheng, sfxFont, resolveCharacterImage, effectToEmoji } from "@bun-remotion/shared";
import type { Emotion, ComicEffect, CharacterConfig, DialogLine, MangaSfxEvent } from "@bun-remotion/shared";
```

## Per-Group `characters.ts` Adaptation
Each group keeps its own `characters.ts` for character definitions but imports types/fonts/utils from shared:
```typescript
import { notoSansTC, sfxFont, effectToEmoji } from "@bun-remotion/shared";
import type { CharacterConfig, DialogLine, Emotion, ComicEffect } from "@bun-remotion/shared";
export type CharacterPose = Emotion;  // backward compat alias for weapon-forger
export type Character = "zhoumo" | "examiner" | ...;
export const CHARACTERS: Record<Character, CharacterConfig> = { ... };
```
