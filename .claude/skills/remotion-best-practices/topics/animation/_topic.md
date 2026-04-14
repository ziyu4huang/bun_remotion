# Animation & Timing

Animation primitives, sequencing, transitions, and timing patterns.
Read this when animating elements, building scene transitions, or sequencing content.

---

## animations — Fundamentals

- All animations driven by `useCurrentFrame()`. CSS transitions and Tailwind `animate-*` are FORBIDDEN.
- Durations in seconds x `fps` from `useVideoConfig()`.
- Optional `delay` on wrappers: return `<>{children}</>` when undefined. `delay=0` default => `Math.max(0,NaN)=0` => black frames.
- `Easing.elastic()` 1 arg max; `Easing.back()` takes number not object; `Easing.cubic` is property not function.
- For details, read `animations.md`.

## timing — Interpolation and spring configs

- `interpolate(frame, [in], [out], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })` — always clamp.
- `spring({ frame, fps, config })` returns 0-1. Presets: smooth `{damping:200}`, snappy `{damping:20,stiffness:200}`, bouncy `{damping:8}`.
- Map spring to custom ranges: `interpolate(springProgress, [0,1], [from,to])`.
- Easing = convexity (`Easing.in`/`out`/`inOut`) + curve (`quad`/`sin`/`exp`/`circle`).
- For full config tables, read `timing.md`.

## text-animations — Text reveal effects

- Typewriter: `text.slice(0, charsToShow)`, NOT per-span opacity. Speed: Chinese ~2.5 chars/frame, English ~4.
- Sentence pauses (10 frames after `。！？.!?`); blinking cursor when done (`frame/15 % 2`).
- Scale-in: `Easing.out(Easing.back(0.3))` for overshoot settle.
- For all patterns, read `text-animations.md`.

## sequencing — Arranging content in time

- `<Sequence from={offset} durationInFrames={len}>` delays + auto-unmounts. Local frames are 0-based inside.
- Always set `name` prop for Studio timeline. Always `premountFor={fps}`.
- `<Series>` plays items back-to-back; negative `offset` for overlaps.
- For nested patterns, read `sequencing.md`.

## transitions — Scene transitions

- `<TransitionSeries>` from `@remotion/transitions`. Transitions shorten total duration; Overlays do not.
- `presentation` (`fade()`, `slide({direction})`, `wipe()`, `clockWipe()`) + `timing` (`linearTiming()`, `springTiming()`).
- Total = sum of sequences - sum of transitions. Use `timing.getDurationInFrames({fps})`.
- For full catalog, read `transitions.md`.

## trimming — Cutting start/end

- Negative `from` trims start: `<Sequence from={-15}>` starts at local frame 15.
- Nest to combine: outer `from={30}` delays, inner `from={-15}` trims.
- For examples, read `trimming.md`.

---

## Cross-References

- Related: `../narrative/dialog-driven.md` — scene architecture
- Related: `../config/calculate-metadata.md` — dynamic duration
