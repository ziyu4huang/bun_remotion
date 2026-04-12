---
name: weapon-forger-ep2-lessons
description: Critical bugs found in weapon-forger ch1-ep2: ScreenShake with undefined delay, OutroScene fadeOut timing, elder missing image prop
type: feedback
---

# Weapon-Forger Ch1-Ep2 Lessons

## 1. ScreenShake with `delay=undefined` causes BLACK FRAMES
- **Rule:** ScreenShake component MUST handle `undefined` delay by returning children unmodified. Never default `delay` to `0` — that makes shake permanently active.
- **Why:** `Math.max(0, frame - undefined)` = `Math.max(0, NaN)` = `0`. This means `f=0` always, `decay=1` always, and `noise2D` produces large offsets every frame, pushing ALL content off-screen. The entire scene renders as the container background color (near-black).
- **How to apply:** Always check `if (delay === undefined) return <>{children}</>;` at the top of ScreenShake. Also add early return when `f >= duration` (shake finished). This applies to ANY wrapper component that takes an optional delay/trigger parameter.

## 2. OutroScene fadeOut must use `durationInFrames`, not hardcoded frame numbers
- **Rule:** Fade-out animations MUST reference `durationInFrames` from `useVideoConfig()`, not hardcoded frame values like `[180, 230]`.
- **Why:** The outro has 1170 frames (39s). Hardcoding `fadeOut` at frames 180-230 means the entire outro goes blank after 7.7 seconds. Using `durationInFrames - 60` to `durationInFrames - 10` makes it relative to actual scene length.
- **How to apply:** Any scene with a fade-out must compute it relative to `durationInFrames`. Pattern: `interpolate(frame, [durationInFrames - 60, durationInFrames - 10], [1, 0])`.

## 3. New characters MUST have an image file and `image` prop
- **Rule:** Every character in `<CharacterSprite>` must have a corresponding `image` prop AND a PNG file in `public/images/`. Without both, the fallback placeholder (colored box with first character) renders.
- **Why:** The elder character was added to ep2 without an image file or `image` prop. The CharacterSprite fell through to its placeholder `<div>` showing "長". This was invisible at small preview sizes but obvious in full render.
- **How to apply:** When adding a new character: (1) generate or create an image, (2) save as `public/images/<name>.png`, (3) pass `image="<name>.png"` to every `<CharacterSprite>` instance for that character, in ALL scenes.

## 4. Use `remotion still` to verify renders, not just Studio preview
- **Rule:** Always render test frames with `bunx remotion still <CompId> --frame=N --output /tmp/test.png` and check pixel brightness. Studio preview can be misleading.
- **Why:** Remotion Studio renders React components in the DOM (browser), while `remotion still/render` renders to canvas (offscreen). Components that use CSS features like `clipPath`, `conic-gradient`, or complex transforms may look different. The ScreenShake bug was invisible in Studio (noise2D offsets were small in DOM) but catastrophic in render (content pushed completely off-screen).
- **How to apply:** After any scene change, render a still frame from the middle of each scene and verify brightness > 50. Quick check: `python3 -c "from PIL import Image; print(Image.open('frame.png').convert('RGB').mean())"` — should be > 50 for content scenes.
