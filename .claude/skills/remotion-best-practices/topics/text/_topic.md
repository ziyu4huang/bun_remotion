# Text

Fonts, subtitles, text measurement, and caption workflows.

---

## fonts -- Google and local fonts
- Google: `loadFont()` from `@remotion/google-fonts/<Name>`. Local: `loadFont()` from `@remotion/fonts` with `staticFile()`.
- For details, read `fonts.md`.

---

## subtitles -- `Caption` type from `@remotion/captions`
- Fields: `text`, `startMs`, `endMs`, `timestampMs`, `confidence`.
- For details, read `subtitles.md`.

---

## measuring-text -- `measureText()`, `fitText()`, `fillTextBox()`
- From `@remotion/layout-utils`. Load fonts first; use `validateFontIsLoaded: true`.
- For details, read `measuring-text.md`.

---

## import-srt-captions -- Parse `.srt` to `Caption[]`
- `parseSrt()` from `@remotion/captions`. Wrap in `useDelayRender()`.
- For details, read `import-srt-captions.md`.

---

## transcribe-captions -- Whisper.cpp to caption JSON
- `installWhisperCpp()` + `transcribe()` + `toCaptions()`. Convert audio to 16KHz WAV first.
- For details, read `transcribe-captions.md`.

---

## display-captions -- TikTok-style pages with word highlighting
- `createTikTokStyleCaptions()` groups by `combineTokensWithinMilliseconds`. Pages in `<Sequence>` from `page.startMs`.
- Highlight via `token.fromMs`/`token.toMs`. Use `whiteSpace: "pre"`.
- For details, read `display-captions.md`.

---

## Cross-References
- Related: `../utilities/get-audio-duration.md` -- align captions with audio
- Related: `../config/calculate-metadata.md` -- set duration from audio
