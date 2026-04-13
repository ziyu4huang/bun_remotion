---
name: dialog-driven
description: Dialog-driven scene architecture — the core pattern for all narrative video scenes
metadata:
  tags: dialog, scene, architecture, dialogLines, currentLineIndex, timing
---

# Dialog-Driven Scene Architecture

This is the **core pattern** for every narrative scene across all series (galgame, weapon-forger, xianxia).
The `dialogLines[]` array is the single source of truth — everything derives from it.

---

## The Pattern

```tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

interface DialogLine {
  character: string;
  text: string;
  effect?: string;  // ComicEffect type — see comic-effects.md
  sfx?: any[];      // MangaSfx events — see galgame.md
}

const dialogLines: DialogLine[] = [
  { character: "xiaoming", text: "你今天看起來不太對勁。", effect: "surprise" },
  { character: "xiaomei", text: "因為我發現了一個驚人的秘密。" },
  { character: "xiaoming", text: "什麼秘密？快說！", effect: "shock" },
];

export const MyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // 1. Current line — drives EVERYTHING
  const lineDuration = durationInFrames / dialogLines.length;
  const currentLineIndex = Math.min(
    Math.floor(frame / lineDuration),
    dialogLines.length - 1,
  );
  const currentLine = dialogLines[currentLineIndex];

  // 2. Key moments by line index (adaptive to duration changes)
  const isRevealMoment = currentLineIndex >= 2;

  // 3. Frame offset for triggering effects at specific lines
  const targetFrame = (2 / dialogLines.length) * durationInFrames;
  const frameOffset = frame - targetFrame;

  return (
    <AbsoluteFill>
      {/* Background */}
      {/* Characters — speaking state from currentLine.character */}
      {/* Effects — triggered by currentLineIndex or frameOffset */}
      {/* DialogBox — displays currentLine.text */}
    </AbsoluteFill>
  );
};
```

---

## Key Rules

### 1. Never hardcode frame numbers for dialog events

Hardcoded frames break when TTS audio length changes. Always calculate from line index:

```tsx
// ❌ WRONG — breaks when duration changes
{frame >= 120 && frame < 150 && <ImpactBurst />}

// ✅ CORRECT — adaptive to any duration
const targetFrame = (3 / dialogLines.length) * durationInFrames;
const frameOffset = frame - targetFrame;
{frameOffset >= 0 && frameOffset < 30 && <ImpactBurst />}
```

### 2. Define moments by `currentLineIndex` ranges

```tsx
const isAngerPhase = currentLineIndex >= 0 && currentLineIndex <= 4;
const isElderEntrance = currentLineIndex >= 8 && currentLineIndex <= 9;
const isReveal = currentLineIndex === 12;
```

### 3. Everything derives from `currentLine`

Character speaking state, comic effects, SFX, notifications — all from one source:

```tsx
<CharacterSprite character="A" speaking={currentLine.character === "A"} side="left" />
<CharacterSprite character="B" speaking={currentLine.character === "B"} side="right" />
<ComicEffects effect={currentLine.effect} side={currentLine.character === "A" ? "left" : "right"} />
<MangaSfx events={currentLine.sfx ?? []} />
```

### 4. `lineDuration` is the natural timing unit

Each line gets equal time. Alternative: per-line timing in `durations.json` for variable-length lines.

---

## Scene Structure Template

Every dialog scene follows this layer order (bottom to top in z-index):

```
AbsoluteFill
  └─ BackgroundLayer          ← scene background image + overlay
  └─ Environmental effects    ← ambient glow, particles (see environmental-effects.md)
  └─ CharacterSprite (×N)     ← all characters, speaking state from currentLine
  └─ ComicEffects             ← emoji reactions above speaker
  └─ MangaSfx                 ← text effects for dramatic moments
  └─ ScreenShake (wrapper)    ← wraps background + characters (NOT effects)
  └─ DialogBox                ← typewriter text + name plate (always on top)
  └─ Scene indicator          ← brief name at scene start (fades out)
```

---

## With Effects (full example)

```tsx
export const ContentScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const lineDuration = durationInFrames / dialogLines.length;
  const currentLineIndex = Math.min(
    Math.floor(frame / lineDuration),
    dialogLines.length - 1,
  );
  const currentLine = dialogLines[currentLineIndex];

  // Dramatic moment: elder appears at line 8
  const elderFrame = (8 / dialogLines.length) * durationInFrames;
  const isElderEntrance = currentLineIndex >= 8 && currentLineIndex <= 9;

  // Pass moment: line 12
  const passFrame = (12 / dialogLines.length) * durationInFrames;

  return (
    <AbsoluteFill>
      {/* ScreenShake wraps everything it should shake */}
      <ScreenShake delay={isElderEntrance ? Math.floor(elderFrame) : undefined}>
        <BackgroundLayer image="classroom.png" />
        <CharacterSprite character="zhoumo" speaking={currentLine.character === "zhoumo"} side="left" />
        <CharacterSprite character="examiner" speaking={currentLine.character === "examiner"} side="right" />
        {currentLineIndex >= 8 && (
          <CharacterSprite character="elder" speaking={currentLine.character === "elder"} side="center" />
        )}
        <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
      </ScreenShake>

      {/* Effects are siblings (not inside ScreenShake) */}
      {isElderEntrance && (
        <>
          <TriangleBurst x={960} y={500} delay={Math.floor(elderFrame)} color="#A78BFA" />
          <ImpactBurst x={960} y={500} delay={Math.floor(elderFrame)} color="#A78BFA" />
        </>
      )}

      {/* Comic effects follow the current speaker */}
      <ComicEffects effect={currentLine.effect} side={
        currentLine.character === "zhoumo" ? "left" :
        currentLine.character === "elder" ? "center" : "right"
      } />

      {/* Scene indicator — fades in/out at scene start */}
      <SceneIndicator text="成績公布" color="#A78BFA" />
    </AbsoluteFill>
  );
};
```

---

## Three-Character Layout

When a scene has 3+ characters (common with authority figures):

```tsx
<CharacterSprite character="protagonist" side="left" speaking={currentLine.character === "protagonist"} />
<CharacterSprite character="rival" side="right" speaking={currentLine.character === "rival"} />
{/* Authority figure — appears mid-scene */}
{currentLineIndex >= 8 && (
  <CharacterSprite character="elder" side="center" speaking={currentLine.character === "elder"} />
)}
```

**Rules:**
- Authority figure goes center
- Center characters can appear mid-scene (wrap in conditional)
- When center speaks, side characters dim automatically via `background` prop

---

## See also

- [./comic-effects.md](./comic-effects.md) — ComicEffect types for dialog line reactions
- [./environmental-effects.md](./environmental-effects.md) — Per-scene theming (accent color, glow, ambient)
- [./galgame.md](./galgame.md) — Full galgame-specific patterns (CharacterSprite, DialogBox, MangaSfx)
- [./debugging.md](./debugging.md) — Verification: `remotion still`, brightness check, common bugs
