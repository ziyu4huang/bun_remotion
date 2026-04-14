# Debugging

Verification methods and common bug fixes for Remotion rendering.

---

## debugging — `remotion still`, black-frame diagnosis, common pitfalls
- **Quick verify:** `bunx remotion still <CompId> --frame=<N> --output /tmp/test.png`, then check mean brightness (>50 = OK, <30 = black frame).
- **Top bugs:** ScreenShake with `delay=undefined` (NaN pushes content off-screen), fade-out with hardcoded frames, `Easing.elastic()`/`Easing.back()` wrong arity, `Math.random()` causing non-deterministic renders, symlinks in `public/` causing 404.
- **Studio vs render:** Canvas compositor handles transforms/z-index differently from browser DOM. Always `remotion still` after ScreenShake or z-index changes.
- For details, read `debugging.md`.

---

## Cross-References
- Related: `../utilities/ffmpeg.md` -- re-encode trimmed videos to avoid frozen frames
- Related: `../config/compositions.md` -- `<Sequence>` layout and timing
