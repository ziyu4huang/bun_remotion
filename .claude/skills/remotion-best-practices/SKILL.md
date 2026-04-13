---
name: remotion-best-practices
description: Best practices for Remotion - Video creation in React
metadata:
  tags: remotion, video, react, animation, composition
---

## When to use

Use this skill whenever you are dealing with Remotion code — scaffolding projects, animations,
audio, TTS voiceover, transitions, fonts, and more.

## Common Patterns (most-used, load these first)

When building a narrative video scene, these 4 rules cover 90% of what you need:

- [rules/dialog-driven.md](rules/dialog-driven.md) — **Core scene architecture**: `dialogLines[]` as single source of truth, `currentLineIndex`, adaptive frame calculation, scene layer structure
- [rules/comic-effects.md](rules/comic-effects.md) — **Character reactions**: ComicEffect types (surprise, shock, sweat, sparkle, etc.), integration with dialog lines
- [rules/environmental-effects.md](rules/environmental-effects.md) — **Scene theming**: accent colors, ambient glow, scene indicators, atmospheric effects per scene
- [rules/debugging.md](rules/debugging.md) — **Verify renders**: `remotion still` + brightness check, ScreenShake NaN pitfall, common bugs

---

## Workflow Guides

- [rules/episode-creation.md](rules/episode-creation.md) — Episode creation workflow for multi-episode series — PLAN.md, confirm format (zh_TW), story writing, scaffolding order, quality gates
- [rules/shared-fixture-images.md](rules/shared-fixture-images.md) — **Shared fixture images**: staticFile + sync-images.sh pattern for multi-episode series. Why webpack imports DON'T work for cross-episode assets
- [rules/scaffolding.md](rules/scaffolding.md) — Scaffold new apps, add compositions/scenes, monorepo structure, common errors
- [rules/voiceover.md](rules/voiceover.md) — Adding AI-generated voiceover (edge-tts/Gemini/mlx_tts) with dynamic duration via durations.json
- [rules/galgame.md](rules/galgame.md) — Galgame / visual novel style — character sprites, dialog boxes, multi-character layout, image generation guidelines, battle effects

---

## Animation & Timing

- [rules/animations.md](rules/animations.md) — Fundamental animation skills: useCurrentFrame, spring, interpolate, wrapper effects, easing gotchas
- [rules/timing.md](rules/timing.md) — Interpolation curves: linear, easing, spring animations, spring configs (smooth/snappy/bouncy/heavy)
- [rules/text-animations.md](rules/text-animations.md) — Typewriter effect, scale-in titles, slide-in subtitles, fade text
- [rules/sequencing.md](rules/sequencing.md) — Sequencing patterns: Sequence, Series, premounting, nested sequences, name prop
- [rules/transitions.md](rules/transitions.md) — Scene transitions: TransitionSeries, fade/slide/wipe/flip/clockWipe, overlays, duration calculation
- [rules/trimming.md](rules/trimming.md) — Trimming animations: cut beginning or end

---

## Media

- [rules/audio.md](rules/audio.md) — Using audio: import, trim, volume, speed, pitch, mute, loop
- [rules/sfx.md](rules/sfx.md) — Sound effects
- [rules/videos.md](rules/videos.md) — Embedding videos: trim, volume, speed, loop, pitch
- [rules/images.md](rules/images.md) — Embedding images: Img component, staticFile, dynamic paths, sizing
- [rules/assets.md](rules/assets.md) — Importing images, videos, audio, and fonts
- [rules/gifs.md](rules/gifs.md) — Displaying GIFs synchronized with timeline

---

## Visual Effects

- [rules/audio-visualization.md](rules/audio-visualization.md) — Audio spectrum bars, waveforms, bass-reactive effects
- [rules/light-leaks.md](rules/light-leaks.md) — Light leak overlay effects
- [rules/lottie.md](rules/lottie.md) — Lottie animations
- [rules/charts.md](rules/charts.md) — Chart and data visualization (bar, pie, line, stock)

---

## Text & Captions

- [rules/fonts.md](rules/fonts.md) — Loading Google Fonts and local fonts
- [rules/subtitles.md](rules/subtitles.md) — Captions and subtitles
- [rules/measuring-text.md](rules/measuring-text.md) — Measuring text dimensions, fitting to containers

---

## Composition & Config

- [rules/compositions.md](rules/compositions.md) — Defining compositions, stills, folders, default props, dynamic metadata
- [rules/calculate-metadata.md](rules/calculate-metadata.md) — Dynamically set composition duration, dimensions, and props
- [rules/parameters.md](rules/parameters.md) — Make a video parametrizable by adding a Zod schema
- [rules/tailwind.md](rules/tailwind.md) — Using TailwindCSS in Remotion

---

## Advanced

- [rules/3d.md](rules/3d.md) — 3D content using Three.js and React Three Fiber
- [rules/maps.md](rules/maps.md) — Mapbox integration
- [rules/ffmpeg.md](rules/ffmpeg.md) — FFmpeg operations: trimming, silence detection
- [rules/transparent-videos.md](rules/transparent-videos.md) — Rendering with transparency
- [rules/can-decode.md](rules/can-decode.md) — Check if a video can be decoded
- [rules/extract-frames.md](rules/extract-frames.md) — Extract frames from videos
- [rules/get-audio-duration.md](rules/get-audio-duration.md) — Get audio duration
- [rules/get-video-duration.md](rules/get-video-duration.md) — Get video duration
- [rules/get-video-dimensions.md](rules/get-video-dimensions.md) — Get video dimensions
- [rules/measuring-dom-nodes.md](rules/measuring-dom-nodes.md) — Measure DOM element dimensions
- [rules/import-srt-captions.md](rules/import-srt-captions.md) — Import SRT caption files
- [rules/transcribe-captions.md](rules/transcribe-captions.md) — Transcribe captions from audio
- [rules/display-captions.md](rules/display-captions.md) — Display captions on video
