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
