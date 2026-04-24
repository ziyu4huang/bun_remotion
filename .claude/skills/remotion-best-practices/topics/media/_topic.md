# Media

Audio, video, images, and voiceover integration.
Read this when adding media assets or TTS to a Remotion project.

---

## audio — Audio playback

- Import `<Audio>` from `@remotion/media` (not `remotion`). Requires `@remotion/media` package.
- Use `trimBefore`/`trimAfter` (in frames) to clip audio; wrap in `<Sequence>` to delay start.
- Volume accepts a callback `(frame) => number` — frame counter starts at 0 when audio begins, not at composition frame.
- `toneFrequency` pitch shifting only works during server-side rendering, not in Studio preview or `<Player />`.

For full Audio API, read `audio.md`.

## sfx — Sound effects

- Use `<Audio>` from `@remotion/sfx` with remote URLs (e.g. `https://remotion.media/whoosh.wav`).
- Built-in SFX: whoosh, whip, page-turn, switch, mouse-click, shutter-modern, shutter-old, ding, bruh, vine-boom, windows-xp-error.
- For more SFX, see https://github.com/kapishdima/soundcn/tree/main/assets.

For SFX patterns, read `sfx.md`.

## videos — Video embedding

- Import `<Video>` from `@remotion/media`. Use `staticFile()` for local files in `public/`.
- `trimBefore`/`trimAfter` are in frames. Use `style` prop with `objectFit: "cover"` for sizing.
- `playbackRate` controls speed; reverse playback is not supported.
- `toneFrequency` pitch shifting only works during server-side rendering.

For full Video API, read `videos.md`.

## images — Image display

- **MUST use `<Img>` from `remotion`** — never raw `<img>`, Next.js `<Image>`, or CSS `background-image`. `<Img>` waits for load to prevent blank frames.
- Place images in `public/` and reference with `staticFile("photo.png")`. Remote URLs work without `staticFile()`.
- Use `getImageDimensions()` to get dimensions at runtime (useful in `calculateMetadata`).
- For animated GIFs, use `<AnimatedImage>` or `<Gif>` from `@remotion/gif` instead.

For Img component and staticFile patterns, read `images.md`.

## image-gen — AI image generation (z.ai)

- **ALWAYS use CDP mode** (`chromium.connectOverCDP`) to connect to user's real Chrome. Never launch Playwright-controlled Chrome for login-required sites — Google blocks automation.
- User launches Chrome: `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222`
- Module: `bun_app/bun_image/` — `generateImageBatch()` with `browserConfig: { mode: "cdp" }`
- WebUI: `POST /api/image/generate` with `browserMode: "cdp"` (default)
- Rate limit: ~3 images per 5 minutes. Auto-restart after 3 images.
- Character sprites: always face LEFT, solid magenta background, rembg for transparency.
- See `/generate-image` skill for full workflow and prompt templates.

## assets — Asset imports

- All local assets live in `public/`. **Always use `staticFile()`** to reference them — handles encoding and subdirectory deployment.
- Use Remotion components (`<Img>`, `<Video>`, `<Audio>`) instead of native HTML — they ensure assets are loaded before rendering.
- Special characters in filenames (`#`, `?`, `&`) are auto-encoded by `staticFile()`.

For import patterns, read `assets.md`.

## gifs — GIF display

- Use `<AnimatedImage>` (supports GIF, APNG, AVIF, WebP) — synchronized with Remotion's timeline.
- Control fit with `fit` prop (`"fill"`, `"contain"`, `"cover"`). Control looping with `loopBehavior` (`"loop"`, `"pause-after-finish"`, `"clear-after-finish"`).
- Use `getGifDurationInSeconds()` from `@remotion/gif` in `calculateMetadata` to size composition to GIF length.
- Fallback: `<Gif>` from `@remotion/gif` (GIF-only, wider browser support).

For GIF sync patterns, read `gifs.md`.

## voiceover — TTS and narration

- **Never import Node.js built-ins (`fs`, `path`, `child_process`) in `src/`** — webpack can't resolve them. All I/O belongs in `scripts/`; pass results via JSON loaded with `require()`.
- Generate TTS per scene in `scripts/`, write frame durations to `public/audio/durations.json`, read in `Root.tsx` with `require()` to size composition dynamically.
- Narration text MUST match on-screen dialog exactly (not summaries). Voice MUST match character gender.
- TTS providers: edge-tts (free, unlimited, MP3), Gemini (free tier, 3 req/min, WAV), mlx_tts (local Apple Silicon, best Chinese quality).

For full TTS workflow (edge-tts/Gemini/mlx_tts), read `voiceover.md`.

---

## Cross-References

- Related: `../narrative/galgame.md` — per-character voice selection
- Related: `../config/calculate-metadata.md` — dynamic duration from audio
