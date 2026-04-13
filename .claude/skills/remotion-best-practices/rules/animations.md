---
name: animations
description: Fundamental animation skills for Remotion
metadata:
  tags: animations, transitions, frames, useCurrentFrame
---

All animations MUST be driven by the `useCurrentFrame()` hook.  
Write animations in seconds and multiply them by the `fps` value from `useVideoConfig()`.

```tsx
import { useCurrentFrame } from "remotion";

export const FadeIn = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  return <div style={{ opacity }}>Hello World!</div>;
};
```

CSS transitions or animations are FORBIDDEN - they will not render correctly.
Tailwind animation class names are FORBIDDEN - they will not render correctly.

## Wrapper Effects with Optional Delay

When creating wrapper components (ScreenShake, ScreenFlash, etc.) that accept an optional `delay` prop:

```tsx
// CORRECT: handle undefined delay
const ScreenShake: React.FC<{ delay?: number; children: React.ReactNode }> = ({ delay, children }) => {
  const frame = useCurrentFrame();
  if (delay === undefined) return <>{children}</>; // ← CRITICAL: no-op when not triggered
  const f = Math.max(0, frame - delay);
  if (f >= duration) return <>{children}</>;     // ← early exit when effect is done
  // ... apply effect
};

// WRONG: default delay to 0 makes effect permanently active
const ScreenShake: React.FC<{ delay?: number; children: React.ReactNode }> = ({ delay = 0, children }) => {
  // Math.max(0, frame - undefined) = Math.max(0, NaN) = 0 → always active!
  // This pushes ALL content off-screen → black frames in render
};
```

**Why this matters:** `Math.max(0, NaN)` returns `0`, not `NaN`. An undefined delay makes `f=0` permanently, keeping the effect at full intensity forever.

## Easing API Gotchas

### `Easing.elastic(bounciness)` — only 1 argument

```tsx
// CORRECT: 1 argument (bounciness, default 1)
Easing.elastic(1)
Easing.elastic(3)  // more bouncy

// WRONG: 2 arguments — TypeScript error, silent failure at runtime
Easing.elastic(1, 0.3)  // TS2554: Expected 0-1 arguments, but got 2
```

### `Easing.back(overshoot)` — takes a number, not an object

```tsx
// CORRECT:
Easing.back(0.3)

// WRONG: D3-style object syntax
Easing.back({ overshoot: 0.3 })
```

### Effect Triggering by Dialog Index

In dialog-driven scenes, effects should fire at specific dialog lines. Calculate frame offsets from the dialog line index:

```tsx
const dialogLines: DialogLine[] = [/* ... */];
const lineDuration = durationInFrames / dialogLines.length;
const currentLineIndex = Math.min(
  Math.floor(frame / lineDuration),
  dialogLines.length - 1,
);

// Calculate absolute frame where a specific line starts
const targetFrame = (lineIndex / dialogLines.length) * durationInFrames;
const frameOffset = frame - targetFrame; // 0 when line starts, increases

// Use frameOffset to trigger effects at the right moment
{frameOffset >= 0 && frameOffset < 30 && (
  <ImpactBurst delay={0} />
)}
```

**Pattern:** Define key moments by `currentLineIndex` ranges, not hardcoded frame numbers. This makes scenes adaptive to duration changes (e.g., when TTS audio length changes).

```tsx
// Dramatic moments defined by dialog progress
const isElderEntrance = currentLineIndex >= 8 && currentLineIndex <= 9;
const isPassMoment = currentLineIndex === 12;

// Conditionally render effects based on which line is active
{isElderEntrance && (
  <>
    <ScreenShake delay={Math.floor(elderFrame)} intensity={15} />
    <TriangleBurst delay={Math.floor(elderFrame)} />
  </>
)}
```
