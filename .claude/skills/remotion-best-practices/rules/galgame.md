---
name: galgame
description: Visual novel / galgame style video patterns — character sprites, dialog boxes, multi-character layout, image generation guidelines
metadata:
  tags: galgame, visual-novel, character, dialog, sprite, anime, VN
---

# Galgame / Visual Novel Style

When building a galgame (visual novel) style video in Remotion, follow these patterns
for authentic Japanese VN aesthetics.

---

## Image Generation — CRITICAL: generate with transparent background + half-body

When generating character images (via `/generate-image` or any AI image tool),
**always include these requirements in the prompt**:

```
anime style, half-body portrait (waist up), transparent background (PNG with alpha),
school uniform, facing forward, no background
```

**Why:** Post-processing background removal (color-key, flood fill) is fragile — white shirts
blend with light backgrounds, edges get jagged, and it wastes time. Generating with
transparent background from the start produces clean results.

**Prompt template for character generation:**
```
anime style character portrait, [character description], half-body from waist up,
school uniform, facing viewer, transparent PNG background, clean edges,
no background, high quality anime illustration
```

**Batch generation example:**
```js
// browser_run_code for /generate-image batch
async (page) => {
  const characters = [
    { file: 'xiaoming.png', prompt: 'anime style boy, brown messy hair, cheerful smile, white shirt red tie blue sweater vest, half-body portrait waist up, school uniform, facing viewer, transparent PNG background, no background, high quality anime illustration' },
    { file: 'xiaomei.png', prompt: 'anime style girl, long brown hair pink bows, gentle smile, white shirt pink bow tie gray skirt, half-body portrait waist up, school uniform, facing viewer, transparent PNG background, no background, high quality anime illustration' },
    { file: 'teacher.png', prompt: 'anime style male teacher, short dark hair glasses, white shirt blue gold tie, half-body portrait waist up, formal attire, facing viewer, transparent PNG background, no background, high quality anime illustration' },
  ];
  // ... (standard generate-image batch pattern)
}
```

### Image specs

| Property | Value |
|----------|-------|
| Format | PNG with alpha (RGBA) |
| Composition | Half-body, waist up |
| Pose | Facing viewer, neutral/slight expression |
| Background | Transparent (no background) |
| Resolution | 800-1200px wide |
| Placement | `public/images/<character>.png` |

---

## Character Sprite Component

```tsx
interface CharacterSpriteProps {
  character: Character;
  image?: string;
  speaking?: boolean;
  side?: "left" | "center" | "right";
  background?: boolean;  // dimmed, non-speaking character in scene
}
```

**Key rendering rules:**

- **Bottom-anchored**: `position: absolute; bottom: 0` — character stands on the dialog box
- **Height**: 70-75% of screen height — fills the scene above the dialog box
- **No name label below sprite** — name is shown in the dialog box name plate
- **Object fit**: `objectFit: "contain"`, `objectPosition: "bottom center"` — aligns feet to bottom
- **Speaking character**: full opacity, subtle breathing animation, slight glow
- **Non-speaking**: dimmed (opacity 0.3-0.5), desaturated, slightly scaled down (0.92)
- **Position map**: left=10%, center=50%, right=90% of screen width

```tsx
<div style={{
  position: "absolute",
  bottom: 0,
  left: side === "left" ? "10%" : side === "right" ? "90%" : "50%",
  transform: `translateX(${side === "center" ? "-50%" : side === "left" ? "-10%" : "-90%"})`,
  height: "75%",
  opacity: speaking ? 1 : 0.3,
}}>
  <Img
    src={staticFile(`images/${image}`)}
    style={{
      height: "100%",
      objectFit: "contain",
      objectPosition: "bottom center",
      filter: speaking
        ? "none"
        : "brightness(0.6) saturate(0.5)",
    }}
  />
</div>
```

---

## Dialog Box Component

Classic Japanese galgame dialog box pattern:

**Visual design:**
- Semi-transparent white background: `rgba(255, 255, 255, 0.92)`
- Dark outline border: `3px solid rgba(30, 20, 60, 0.85)`
- Rounded corners: `borderRadius: 12`
- Positioned at bottom with margin: `bottom: 40, left/right: 60`
- Shadow for depth: `0 4px 20px rgba(0,0,0,0.3)`

**Name plate:**
- Colored background matching character theme color
- Positioned above the box border: `top: -18, left: 24`
- White text, bold, with subtle shadow
- Spring animation for entrance

**Text:**
- Large: `fontSize: 42` (for 1080p)
- Dark color on white: `color: "#1a1a2e"`
- Line height: `1.8` for readability
- Typewriter effect: ~2.5 chars per frame
- Blinking cursor when typing completes

```tsx
<div style={{
  position: "absolute",
  bottom: 40, left: 60, right: 60,
}}>
  <div style={{
    background: "rgba(255, 255, 255, 0.92)",
    border: "3px solid rgba(30, 20, 60, 0.85)",
    borderRadius: 12,
    padding: "20px 32px 24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    minHeight: 140,
  }}>
    {/* Name plate - above border */}
    <div style={{
      position: "absolute",
      top: -18, left: 24,
      backgroundColor: character.color,
      color: "#fff",
      padding: "4px 20px",
      borderRadius: 6,
      fontSize: 24,
      fontWeight: 700,
    }}>
      {character.name}
    </div>

    {/* Dialog text */}
    <div style={{
      color: "#1a1a2e",
      fontSize: 42,
      lineHeight: 1.8,
      marginTop: 8,
    }}>
      {displayText}
    </div>
  </div>
</div>
```

---

## Multi-Character Scene Layout

Classic galgame shows **all characters in the scene simultaneously**,
with the speaking character highlighted:

```tsx
<AbsoluteFill>
  <BackgroundLayer image="classroom.png" />

  {/* Character on the right — speaking */}
  <CharacterSprite
    character="teacher"
    image="teacher.png"
    speaking={currentLine.character === "teacher"}
    side="right"
    background={currentLine.character !== "teacher"}
  />

  {/* Character on the left — not speaking */}
  <CharacterSprite
    character="xiaoming"
    image="xiaoming.png"
    speaking={currentLine.character === "xiaoming"}
    side="left"
    background={currentLine.character !== "xiaoming"}
  />

  <DialogBox lines={lines} sceneFrame={frame} sceneDuration={durationInFrames} />
</AbsoluteFill>
```

**Rules:**
- Always show all relevant characters, never swap one for another
- Speaking character: `speaking=true, background=false`
- Non-speaking: `speaking=false, background=true`
- Position: speaker on one side, listener on the other

---

## Background Layer

Keep backgrounds clean — the focus should be on characters and dialog:

- Use `objectFit: "cover"` for background images
- Subtle Ken Burns zoom (0.02 scale)
- Light gradient overlay for readability (not heavy darkening)
- Soft vignette only — no floating particles or decorative elements
- Background images go in `public/images/` (full-frame scenes like classroom, hallway)

```tsx
<div style={{
  position: "absolute", inset: 0, overflow: "hidden",
}}>
  <Img src={staticFile(`images/${image}`)}
    style={{ width: "100%", height: "100%", objectFit: "cover" }} />

  {/* Subtle readability overlay */}
  <div style={{
    position: "absolute", inset: 0,
    background: "linear-gradient(to bottom, rgba(10,5,30,0.15) 0%, rgba(10,5,30,0.5) 100%)",
  }} />
</div>
```

---

## Scene Structure

```
scenes/
  TitleScene.tsx      ← Title card with animations
  JokeScene1.tsx      ← Dialog scene with multi-character layout
  JokeScene2.tsx
  ...
  OutroScene.tsx      ← End screen
components/
  BackgroundLayer.tsx  ← Full-screen background
  CharacterSprite.tsx  ← Half-body character rendering
  DialogBox.tsx        ← Galgame-style dialog with name plate
  TitleCard.tsx        ← Title text animations
characters.ts          ← Character config, types, font loading
```

**Character config pattern:**
```tsx
export type Character = "xiaoming" | "xiaomei" | "teacher";

export interface CharacterConfig {
  name: string;       // 中文名
  color: string;      // Theme color for name plate, glow
  bgColor: string;    // Semi-transparent version
}

export const CHARACTERS: Record<Character, CharacterConfig> = {
  xiaoming: { name: "小明", color: "#60A5FA", bgColor: "rgba(59,130,246,0.25)" },
  xiaomei: { name: "小美", color: "#F472B6", bgColor: "rgba(236,72,153,0.25)" },
  teacher: { name: "王老師", color: "#FBBF24", bgColor: "rgba(245,158,11,0.25)" },
};
```

---

## TTS Voice — MUST match character gender

Each character needs a voice matching their gender. Never use a male voice for female characters.

**Character config with voice field:**
```tsx
export interface CharacterConfig {
  name: string;
  color: string;
  bgColor: string;
  position: "left" | "center" | "right";
  voice: string;  // TTS voice name — must match gender
}

export const CHARACTERS: Record<Character, CharacterConfig> = {
  xiaoxue: { name: "小雪", color: "#F472B6", bgColor: "rgba(244,114,182,0.25)", position: "left", voice: "xiaoxuan" },
  xiaoyue: { name: "小月", color: "#818CF8", bgColor: "rgba(129,140,248,0.25)", position: "right", voice: "xiaoyu" },
  xiaoying: { name: "小樱", color: "#FB923C", bgColor: "rgba(251,146,60,0.25)", position: "center", voice: "xiaomei" },
};
```

**Voice selection by provider:**

| Provider | Female voices | Male voices |
|----------|--------------|-------------|
| mlx_tts | xiaoxuan, xiaomei, xiaoyu | uncle_fu |
| Gemini TTS | Kore, Aoede | Charon, Fenrir |
| edge-tts | zh-TW-HsiaoChenNeural | zh-TW-YunJheNeural |

**Per-line voice switching:** If the TTS engine can't switch voices mid-audio, generate separate audio files per character line and concatenate them with `sox` or ffmpeg. Never use a single narrator voice for multi-character dialog.

---

## Scene Transitions — prevent black frame gaps

The container `<AbsoluteFill>` has a dark background color. When one scene fades out and the next hasn't faded in yet, that dark background becomes visible as "black seconds."

**Rule:** Every scene must have both a fade-in AND a fade-out that overlap with adjacent scenes.

```tsx
// In EVERY scene component:
const { durationInFrames } = useVideoConfig();
const FADE_FRAMES = 15; // 0.5s

const globalFade = interpolate(
  frame,
  // Fade in during first FADE_FRAMES, fade out during last FADE_FRAMES
  [0, FADE_FRAMES, durationInFrames - FADE_FRAMES, durationInFrames],
  [0, 1, 1, 0],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);

return (
  <AbsoluteFill style={{ opacity: globalFade }}>
    {/* ... scene content */}
  </AbsoluteFill>
);
```

This ensures scene A's fade-out overlaps with scene B's fade-in, creating a smooth cross-dissolve through the container background.

---

## Title Scene — must be visually impactful

A title scene with only floating particles and fade text is NOT enough. The opening is the first impression.

**Minimum requirements for a galgame title:**
1. **Bold typography** — spring-animated scale-in, not just a simple fade
2. **At least one "hook" element** — character silhouette reveal, dramatic flash, screen shake, or bloom glow
3. **Audio stinger** — a short impactful sound (not just narration) in the first 1-2 seconds
4. **No dead air** — something should always be moving on screen

**Pattern: dramatic anime-style title:**
```tsx
// Scale-in with spring easing — feels like an anime OP
const titleScale = interpolate(frame, [10, 40], [2.5, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  ...Easing.out(Easing.back({ overshoot: 0.3 })),
});

const titleOpacity = interpolate(frame, [10, 20], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});

// Subtitle slides in after title
const subtitleY = interpolate(frame, [30, 50], [30, 0], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
  ...Easing.out(Easing.cubic),
});

// Brief flash/bloom at the peak moment
const flashOpacity = interpolate(frame, [8, 15, 25], [0, 0.8, 0], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
```

---

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Full-body character images | Takes too much screen space, feet hidden by dialog box | Generate half-body (waist up) |
| Solid color background on sprites | Looks unprofessional, doesn't blend with scene backgrounds | Generate with transparent background |
| Name label below character sprite | Not how galgames work — name goes in dialog box | Show name in dialog box name plate only |
| Dark gradient dialog box | Looks like subtitles, not a galgame | Use white/light dialog box with dark outline |
| Showing only one character at a time | Breaks immersion, not how VNs work | Show all characters, highlight speaker |
| Heavy particle effects on backgrounds | Distracting, clashes with character focus | Clean backgrounds with subtle overlay only |
| Post-processing background removal | Fragile, jagged edges, white shirts blend with light BG | Generate transparent from the start |
| Male voice for female characters | Jarring mismatch, breaks immersion | Match voice to character gender in config |
| No fade-in on scenes after title | Dark container background visible between scenes (black seconds) | Every scene must fade-in AND fade-out with overlap |
| Title = just particles + text | Underwhelming first impression | Use spring scale-in, flash/bloom, audio stinger |
