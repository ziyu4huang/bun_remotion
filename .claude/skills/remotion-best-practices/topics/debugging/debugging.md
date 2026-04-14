---
name: debugging
description: Verification methods and common bug fixes for Remotion video rendering
metadata:
  tags: debug, verify, remotion-still, brightness, black-frame, common-bugs, ScreenShake
---

# Debugging Remotion Videos

---

## Quick Verify: `remotion still`

The fastest way to check if a scene renders correctly:

```bash
# From repo root — render a single frame to PNG
bunx remotion still <CompositionId> --frame=<N> --output /tmp/test.png

# Example: check frame 300 of ep5
bunx remotion still GalgameMemeTheaterEp5 --frame=300 --output /tmp/test.png
```

**Pick the right frame:** Use a mid-scene frame (not frame 0 which may be a transition).

### Brightness Check

```bash
python3 -c "
from PIL import Image
a = Image.open('/tmp/test.png')
print(f'Mean brightness: {a.convert(\"RGB\").mean():.1f}')
"
```

| Brightness | Status |
|-----------|--------|
| > 50 | OK — content visible |
| 30–50 | Suspicious — check for dark overlays |
| < 30 | BUG — likely black frame (ScreenShake NaN, missing content, wrong z-index) |

---

## Common Bugs

### 1. ScreenShake with `delay=undefined` → BLACK FRAMES

**The #1 cause of black frames.** `Math.max(0, frame - undefined)` = `Math.max(0, NaN)` = `0`, so the shake is permanently active and pushes ALL content off-screen.

```tsx
// ❌ WRONG — delay defaults to 0, shake is permanently active
const ScreenShake: React.FC<{ delay?: number; children: React.ReactNode }> = ({ delay = 0, children }) => {
  const f = Math.max(0, frame - delay); // NaN → 0 → always shaking
  // ...
};

// ✅ CORRECT — handle undefined explicitly
const ScreenShake: React.FC<{ delay?: number; children: React.ReactNode }> = ({ delay, children }) => {
  const frame = useCurrentFrame();
  if (delay === undefined) return <>{children}</>; // ← CRITICAL: no-op when not triggered
  const f = Math.max(0, frame - delay);
  if (f >= duration) return <>{children}</>;     // ← early exit when done
  // ... apply effect
};
```

**This applies to ALL wrapper effects:** ScreenShake, ScreenFlash, and any component that wraps children with a transform.

### 2. Fade-out with hardcoded frames → early blank

```tsx
// ❌ WRONG — goes blank at frame 120 regardless of actual scene length
const fadeOut = interpolate(frame, [90, 120], [1, 0], { extrapolateRight: "clamp" });

// ✅ CORRECT — tracks actual scene end
const { durationInFrames } = useVideoConfig();
const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames - 10], [1, 0], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
```

### 3. `Easing.elastic()` — only 1 argument

```tsx
// ❌ WRONG — TypeScript error, silent runtime failure
Easing.elastic(1, 0.3)

// ✅ CORRECT — bounciness only
Easing.elastic(1)   // gentle
Easing.elastic(3)   // very bouncy
```

### 4. `Easing.back()` — takes a number, not an object

```tsx
// ❌ WRONG — D3-style object syntax
Easing.back({ overshoot: 0.3 })

// ✅ CORRECT — plain number
Easing.back(0.3)    // subtle overshoot
Easing.back(1.5)    // dramatic overshoot
```

### 5. `Easing.cubic` is a property, not a function

```tsx
// ❌ WRONG
Easing.cubic()

// ✅ CORRECT
Easing.cubic
```

### 6. Hardcoded frame numbers for dialog events

```tsx
// ❌ WRONG — breaks when TTS audio length changes
{frame >= 120 && <ImpactBurst />}

// ✅ CORRECT — adaptive to any duration
const targetFrame = (3 / dialogLines.length) * durationInFrames;
{frame >= targetFrame && frame < targetFrame + 30 && <ImpactBurst />}
```

### 7. Missing `image` prop on CharacterSprite

CharacterSprite falls through to a colored placeholder box. Every character MUST have:
- `image="<name>.png"` prop on every `<CharacterSprite>` instance
- The PNG file must exist in `public/images/`

### 8. Symlinks in `public/` → 404 during render

Remotion's static server (used by both Studio and `remotion render`) **cannot follow symlinks**.
Symlinked files in `public/` will 404 during render even if they appear to work in a browser.

```bash
# ❌ WRONG — symlinks cause 404 at render time
ln -sf ../../../fixture/characters/zhoumo.png public/images/zhoumo.png

# ✅ CORRECT — always copy actual files
cp ../../../fixture/characters/zhoumo.png public/images/zhoumo.png
```

**Verify:** After running any sync script, check with `ls -la public/images/` — no `->` arrows should appear.

**This affects:** ALL `public/` assets (images, audio, fonts, data files). Any file served by Remotion's static server must be a real file, not a symlink.

### 9. `Math.random()` in effects → non-deterministic rendering

`Math.random()` produces different results per render. This means:
- Studio preview ≠ rendered output
- Repeated renders produce different shake/flicker patterns
- Remotion's frame cache can't work (every render is "new")

```tsx
// ❌ WRONG — different every render, cache can't work
const shakeX = (Math.random() - 0.5) * 2 * intensity * decay;

// ✅ CORRECT — deterministic noise based on frame number
const noise = Math.sin(elapsed * 12.9898 + 78.233) * 43758.5453 % 1;
const shakeX = (noise - 0.5) * 2 * intensity * decay;
```

**This applies to ALL visual effects:** ScreenShake, particle systems, flicker, noise textures. Any random visual must be seeded by frame number.

### 10. `durations.json` stale data

If audio was regenerated but `durations.json` wasn't updated, scene durations will be wrong.

**Fix:** Always run `generate-tts.ts` to completion — it writes `durations.json` as its last step.

**Detection:** If scenes feel too long or too short after TTS regeneration, check that `durations.json` timestamps match the audio files.

---

## Canvas vs DOM Rendering Differences

Remotion Studio renders in the browser (DOM + CSS). The actual render uses a canvas compositor.
Some things look different:

| Aspect | Studio (DOM) | Render (Canvas) |
|--------|-------------|----------------|
| ScreenShake noise | Small, subtle | Can be catastrophic (pushes content off-screen) |
| CSS transforms | May clip gracefully | Clips at canvas bounds |
| WebGL elements | Accessible via DOM | Not accessible via canvas |
| z-index stacking | Browser resolves | Different compositing order possible |

**Rule:** After any scene change that involves ScreenShake, transforms, or z-index, run `remotion still` to verify the canvas output matches expectations.

---

## Debugging Workflow

1. **After writing a new scene:**
   ```bash
   bunx remotion still <CompId> --frame=<mid-scene> --output /tmp/test.png
   # Check mean brightness > 50
   ```

2. **After modifying ScreenShake or wrapper effects:**
   ```bash
   # Check frames at the effect trigger point AND before/after
   bunx remotion still <CompId> --frame=<trigger-5> --output /tmp/before.png
   bunx remotion still <CompId> --frame=<trigger> --output /tmp/during.png
   bunx remotion still <CompId> --frame=<trigger+30> --output /tmp/after.png
   ```

3. **After changing scene duration (TTS re-generation):**
   - Verify fade-outs still align with scene end
   - Verify dialog line timing hasn't shifted effects to wrong moments
   - Check that `durations.json` is up to date

---

## See also

- [animations](../animation/animations.md) — Spring and easing API gotchas
- [dialog-driven](../narrative/dialog-driven.md) — Adaptive frame calculation pattern
- [galgame](../narrative/galgame.md) — Common Mistakes table (full list)
