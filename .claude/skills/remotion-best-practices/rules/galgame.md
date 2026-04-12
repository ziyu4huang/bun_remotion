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

## Image Generation — CRITICAL: transparent background + half-body + facing LEFT

When generating character images (via `/generate-image` or any AI image tool),
**always include these requirements in the prompt**:

```
anime style, half-body portrait (waist up), transparent background (PNG with alpha),
facing LEFT, solid magenta #FF00FF background, no background detail
```

### CRITICAL CONVENTION: ALL character images MUST face LEFT by default

This applies to **every** character image — normal sprites, chibi (Q版), battle poses, etc.
A consistent base direction makes Remotion flipping deterministic:

- Raw image → character **always** faces LEFT
- `side="left"` → `scaleX(-1)` flip to face RIGHT toward partner
- `side="right"` → no flip, already facing LEFT toward partner
- `side="center"` → no flip (facing audience)

**Background strategy:** Use `solid magenta #FF00FF background` in prompts — rembg removes
magenta cleanly. AI models cannot produce true transparent PNGs, so use a color key that's
easy to separate.

### Why include "transparent background" in prompts?

Even though AI can't actually produce transparency, asking for "no background" / simple backgrounds
makes rembg's job easier:
- Solid/simple backgrounds are easier to remove than complex scenes
- The subject is more cleanly separated from the background
- Fewer artifacts around hair and clothing edges

**Prompt template for normal sprites:**
```
anime style character portrait, [character description], facing LEFT,
[outfit details], half-body from waist up, solid magenta #FF00FF background,
clean edges, no background detail, high quality anime illustration
```

**Prompt template for chibi (Q版) sprites:**
```
chibi SD super deformed anime style [character description], facing LEFT,
[outfit details], very round head, tiny body, chibi proportions (head 2/3 of body),
half-body portrait, solid magenta #FF00FF background, clean edges,
no background detail, high quality chibi anime illustration
```

**Batch generation example (normal + chibi):**
```js
// browser_run_code for /generate-image batch
async (page) => {
  const characters = [
    { file: 'xiaoming.png', prompt: 'anime style boy, brown messy hair, cheerful smile, white shirt red tie blue sweater vest school uniform, facing LEFT, half-body portrait waist up, solid magenta #FF00FF background, no background detail, high quality anime illustration' },
    { file: 'xiaoming-chibi.png', prompt: 'chibi SD super deformed anime style boy, brown messy hair, cheerful smile, white shirt red tie blue sweater vest school uniform, facing LEFT, very round head tiny body, chibi proportions head 2/3 body, half-body portrait, solid magenta #FF00FF background, no background detail, high quality chibi anime illustration' },
    { file: 'xiaomei.png', prompt: 'anime style girl, long brown hair pink bows, gentle smile, white shirt pink bow tie gray pleated skirt school uniform, facing LEFT, half-body portrait waist up, solid magenta #FF00FF background, no background detail, high quality anime illustration' },
    { file: 'xiaomei-chibi.png', prompt: 'chibi SD super deformed anime style girl, long brown hair pink bows, gentle smile, white shirt pink bow tie gray pleated skirt school uniform, facing LEFT, very round head tiny body, chibi proportions head 2/3 body, half-body portrait, solid magenta #FF00FF background, no background detail, high quality chibi anime illustration' },
  ];
  // ... (standard generate-image batch pattern)
}
```

### Image specs

| Property | Normal | Chibi |
|----------|--------|-------|
| Format | PNG with alpha (RGBA) | PNG with alpha (RGBA) |
| Composition | Half-body, waist up | Half-body, waist up |
| Pose | **Facing LEFT**, neutral expression | **Facing LEFT**, cute expression |
| Background | Solid magenta `#FF00FF` (removed by rembg) | Solid magenta `#FF00FF` (removed by rembg) |
| Resolution | 800-1200px wide | 600-800px wide |
| Placement | `public/images/<name>.png` | `public/images/<name>-chibi.png` |
| Height in scene | 75% screen, max 900px | 40% screen, max 480px |
| Position | Bottom-anchored | Floats above dialog |

### Background removal (required for ALL images)

```bash
# Install (one-time)
pip3 install --break-system-packages "rembg[cpu]"

# Remove background — single image
python3 -c "
from rembg import remove
from PIL import Image
img = Image.open('character.png')
result = remove(img)
result.save('character.png')
print('Done')
"

# Batch removal
python3 -c "
from rembg import remove
from PIL import Image
import glob
for f in glob.glob('public/images/*.png'):
    img = Image.open(f)
    result = remove(img)
    result.save(f)
    print(f'{f}: done')
"
```

**Verify transparency after removal:**
```python
from PIL import Image; import numpy as np
a = np.array(Image.open('character.png'))
print(f'Transparent pixels: {(a[:,:,3]==0).sum()}/{a.size}')
```

### Image naming

| Type | Pattern | Example |
|------|---------|---------|
| Normal sprite | `<name>.png` | `xiuxiu.png` |
| Chibi sprite | `<name>-chibi.png` | `xiuxiu-chibi.png` |

### Remotion flip logic in CharacterSprite

```tsx
// Convention: ALL raw images face LEFT
const faceMirror = side === "left" ? -1 : 1;
// Applied as: transform: `scaleX(${faceMirror})`
```

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
- Positioned above the box border using `position: absolute; top: <negative offset>`
- White text, bold, with subtle shadow
- Spring animation for entrance
- **CRITICAL: `top` offset must scale with `fontSize`** — the name plate sits above the dialog box via a negative `top` value. If you change `fontSize`, you MUST recalculate `top` and `marginTop` on the text below, otherwise the name plate overlaps the dialog text.
  - Formula: `top` ≈ `-(fontSize * 0.75 + padding)` (e.g., fontSize 48 + padding 12 → `top: -42`)
  - Also increase dialog text `marginTop` proportionally (e.g., fontSize 48 → `marginTop: 20`)

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
    {/* NOTE: top offset MUST be recalculated when changing fontSize! */}
    {/* fontSize 24 → top: -18 | fontSize 48 → top: -42 */}
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

## Scene Transitions — use TransitionSeries for proper effects

**Preferred approach:** Use `@remotion/transitions` with `TransitionSeries` for varied, polished scene transitions (fade, slide, wipe, clockWipe). This replaces the manual fade-in/fade-out pattern which only produces crossfade.

```bash
# Add dependency
bun add @remotion/transitions@4.0.290
```

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { clockWipe } from "@remotion/transitions/clock-wipe";

const TRANSITION_FRAMES = 15; // 0.5s

<AbsoluteFill style={{ backgroundColor: "#0a051e" }}>
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={d(0)}>
      <TitleScene />
      <Audio src={staticFile("audio/01-title.wav")} />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition
      presentation={fade()}
      timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
    />

    <TransitionSeries.Sequence durationInFrames={d(1)}>
      <JokeScene1 />
      <Audio src={staticFile("audio/02-joke1.wav")} />
    </TransitionSeries.Sequence>

    {/* Vary transition types for visual interest: */}
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />
    <TransitionSeries.Sequence durationInFrames={d(2)}>...</TransitionSeries.Sequence>

    <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />
    <TransitionSeries.Sequence durationInFrames={d(3)}>...</TransitionSeries.Sequence>

    <TransitionSeries.Transition presentation={clockWipe({ width: 1920, height: 1080 })} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />
    <TransitionSeries.Sequence durationInFrames={d(4)}>...</TransitionSeries.Sequence>
  </TransitionSeries>
</AbsoluteFill>
```

**Duration calculation with TransitionSeries:**
```tsx
// In Root.tsx — transitions overlap, so subtract them from total
const NUM_TRANSITIONS = scenes.length - 1;
const totalDuration =
  sceneDurationsData.reduce((sum, d) => sum + d, 0) -
  NUM_TRANSITIONS * TRANSITION_FRAMES;
```

**API notes (Remotion 4.0.290):**
- `Easing.back()` takes a `number`, not an object: `Easing.back(0.3)` NOT `Easing.back({ overshoot: 0.3 })`
- `clockWipe()` requires `{ width, height }` props: `clockWipe({ width: 1920, height: 1080 })`
- With TransitionSeries, scenes do NOT need their own fade-in/fade-out — the transition handles it
- Available: `fade()`, `slide()`, `wipe()`, `flip()`, `clockWipe()` from `@remotion/transitions/*`

**Fallback (if TransitionSeries unavailable):** Use per-scene fade-in/fade-out with overlap:
```tsx
const globalFade = interpolate(frame,
  [0, 15, durationInFrames - 15, durationInFrames],
  [0, 1, 1, 0],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);
return <AbsoluteFill style={{ opacity: globalFade }}>...</AbsoluteFill>;
```

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
| Solid color background on sprites | Looks unprofessional, doesn't blend with scene backgrounds | Use solid magenta #FF00FF in prompt, then rembg to remove |
| Name label below character sprite | Not how galgames work — name goes in dialog box | Show name in dialog box name plate only |
| Character images facing right or viewer | Inconsistent flip logic, unpredictable results | ALL images face LEFT; flip in Remotion based on side |
| Dark gradient dialog box | Looks like subtitles, not a galgame | Use white/light dialog box with dark outline |
| Showing only one character at a time | Breaks immersion, not how VNs work | Show all characters, highlight speaker |
| Heavy particle effects on backgrounds | Distracting, clashes with character focus | Clean backgrounds with subtle overlay only |
| Post-processing background removal | Fragile, jagged edges, white shirts blend with light BG | Generate transparent from the start |
| Male voice for female characters | Jarring mismatch, breaks immersion | Match voice to character gender in config |
| No transitions between scenes | Jarring cuts or black frame gaps | Use TransitionSeries with varied transition types |
| Title = just particles + text | Underwhelming first impression | Use spring scale-in, flash/bloom, screen shake |
| Forgetting to update dev.sh | `build:<alias>` fails with "Unknown app" | Add app to ALL_APPS + get_comp_id() in scripts/dev.sh |
| Scaling name plate fontSize without adjusting `top` offset | Name badge overlaps dialog text — the negative `top` value anchors the badge above the box | Recalculate `top` ≈ `-(fontSize × 0.75 + padding)` and increase text `marginTop` proportionally |

---

## Automatic Build Workflow — ALWAYS run TTS + render in background

After creating or modifying a galgame episode, the full pipeline should run automatically:

**Step 1 — Generate TTS (background):**
```bash
bun run generate-tts:<alias>   # run_in_background: true
```

**Step 2 — On TTS completion, immediately render (background):**
```bash
bun run build:<alias>           # run_in_background: true
```

**Never wait for the user to ask "can it render?"** — kick off the render automatically as soon as TTS finishes.

**Registration checklist for new apps:**
- [ ] `bun_remotion_proj/<app>/` created with package.json, tsconfig.json, src/
- [ ] `scripts/dev.sh` — app name in `ALL_APPS` + `get_comp_id()` case
- [ ] Root `package.json` — `start:<alias>`, `build:<alias>`, `generate-tts:<alias>`
- [ ] `CLAUDE.md` — app added to project structure tree
- [ ] `bun install` from repo root
- [ ] TTS generated + render kicked off (both in background)
