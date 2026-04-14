# Utilities

FFmpeg, media probing, transparent videos, frame extraction, and DOM measurement.

---

## ffmpeg -- FFmpeg/FFprobe via Remotion CLI
- `bunx remotion ffmpeg` / `bunx remotion ffprobe`. Trim via re-encode or `<Video trimBefore/trimAfter>`.
- For details, read `ffmpeg.md`.

---

## transparent-videos -- ProRes or WebM with alpha
- ProRes: `--codec=prores --prores-profile=4444 --pixel-format=yuva444p10le`. WebM: `--codec=vp9 --pixel-format=yuva420p`.
- For details, read `transparent-videos.md`.

---

## can-decode -- Browser decode check
- Mediabunny `Input` + `UrlSource`. Call `track.canDecode()`.
- For details, read `can-decode.md`.

---

## extract-frames -- Frames at timestamps
- `extractFrames()` with timestamps or async callback. `sample.draw(ctx, 0, 0)`. Supports `AbortSignal`.
- For details, read `extract-frames.md`.

---

## duration and dimensions (audio/video)
- Mediabunny `Input` + `UrlSource`; `computeDuration()`, `getPrimaryVideoTrack()`. Use `staticFile()` in Remotion.
- For details, read `get-audio-duration.md`, `get-video-duration.md`, `get-video-dimensions.md`.

---

## measuring-dom-nodes -- Measurement under Remotion scale
- `useCurrentScale()` then divide `getBoundingClientRect()` by scale.
- For details, read `measuring-dom-nodes.md`.

---

## Cross-References
- Related: `../config/calculate-metadata.md` -- feed durations into metadata
- Related: `../debugging/debugging.md` -- verify with `remotion still`
