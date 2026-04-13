---
name: comic-effects
description: Comic effect types for character reactions — surprise, shock, sweat, sparkle, etc.
metadata:
  tags: comic, effects, emoji, reaction, dialog, character
---

# Comic Effects

Japanese manga/anime-style emoji reactions that appear above the speaking character.
Defined per dialog line, rendered by `<ComicEffects>` component.

---

## Type Definition

```tsx
export type ComicEffect =
  | "surprise"  // ?! — wobble animation
  | "shock"     // ! — scale-in burst
  | "sweat"     // 💧 — drop with physics
  | "sparkle"   // ✨ — multiple sparkles
  | "heart"     // ❤️ — heartbeat pulse
  | "anger"     // 💢 — pulsing veins
  | "dots"      // ... — sequential dots
  | "cry"       // 😢 — tears
  | "laugh"     // 😆 — bounce
  | "fire"      // 🔥 — flicker
  | "shake"     // handled by CharacterSprite, not ComicEffects
  | null;       // no effect
```

## Integration with Dialog Lines

```tsx
interface DialogLine {
  character: string;
  text: string;
  effect?: ComicEffect;  // optional — null/undefined = no effect
}

const dialogLines: DialogLine[] = [
  { character: "xiaoming", text: "什麼！？", effect: "surprise" },
  { character: "xiaomei", text: "哈哈太好笑了！", effect: "laugh" },
  { character: "xiaoming", text: "我…我沒有哭啦…", effect: "cry" },
  { character: "xiaomei", text: "哼！", effect: "anger" },
];
```

## Usage in Scene

```tsx
import { ComicEffects } from "../components/ComicEffects";

// In scene component — render current line's effect
<ComicEffects
  effect={currentLine.effect ?? null}
  side={
    currentLine.character === "protagonist" ? "left" :
    currentLine.character === "elder" ? "center" : "right"
  }
/>
```

## Effect Selection Guide

| Emotion | Effect | When to use |
|---------|--------|-------------|
| Unexpected news | `surprise` | ?! reaction to surprising statement |
| Shock/fear | `shock` | ! moment of alarm |
| Nervous/awkward | `sweat` | 💧 uncomfortable situation |
| Pleased/impressed | `sparkle` | ✨ admiring something |
| Love/affection | `heart` | ❤️ romantic or cute moment |
| Frustrated/annoyed | `anger` | 💢 irritation or anger |
| Speechless/confused | `dots` | ... at a loss for words |
| Sad/touching | `cry` | 😢 emotional moment |
| Amused | `laugh` | 😆 finding something funny |
| Intense/passionate | `fire` | 🔥 heated moment |
| Physical shake | `shake` | CharacterSprite handles this (not ComicEffects) |

## Rules

- **One effect per line** — don't stack multiple ComicEffects
- **Match effect to tone** — `surprise` for genuine shock, `sweat` for mild awkwardness
- **Not every line needs an effect** — overuse dilutes impact. Use effects on punchlines and emotional peaks.
- **Effect follows the speaker** — the `side` prop matches the speaking character's position
- **`shake` is different** — it's handled by CharacterSprite's animation system, not the ComicEffects overlay

## See also

- [./dialog-driven.md](./dialog-driven.md) — How effects integrate with dialog-driven architecture
- [./galgame.md](./galgame.md) — Full ComicEffects component implementation
