# Effects

Audio visualization, Lottie, charts, 3D, light leaks, and map animations.

---

## audio-visualization -- Spectrum, waveform, bass-reactive
- `useWindowedAudioData()` loads data; `visualizeAudio()` for bars, `visualizeAudioWaveform()` for waves.
- Pass `frame` from parent, never `useCurrentFrame()` in children inside `<Sequence>`.
- For details, read `audio-visualization.md`.

---

## light-leaks -- WebGL transition overlays (>= 4.0.415)
- `<LightLeak>` from `@remotion/light-leaks` in `<TransitionSeries.Overlay>`. Props: `seed`, `hueShift`.
- For details, read `light-leaks.md`.

---

## lottie -- Embed Lottie JSON animations
- Fetch with `delayRender()`/`continueRender()`, render `<Lottie animationData={...} />`.
- For details, read `lottie.md`.

---

## charts -- Bar, pie, line with SVG and `@remotion/paths`
- No third-party animations; drive from `useCurrentFrame()`. Use `evolvePath()` for line draws.
- For details, read `charts.md`.

---

## 3d -- Three.js / React Three Fiber
- `<ThreeCanvas width height>` with lighting. `useFrame()` forbidden; use `useCurrentFrame()`.
- `<Sequence>` inside canvas must set `layout="none"`.
- For details, read `3d.md`.

---

## maps -- Mapbox animations
- `interactive: false`, `fadeDuration: 0`, `useDelayRender()`. Render with `--gl=angle --concurrency=1`.
- For details, read `maps.md`.

---

## Cross-References
- Related: `../config/calculate-metadata.md` -- dynamic duration
- Related: `../utilities/get-audio-duration.md` -- audio length
