# bun_tts — Plan

> Full specs → GitHub issue #32 (PRD)

## Quick Reference

- **Version:** v0.1.0 — Stable
- **Purpose:** TTS generation (mlx_tts local + Gemini API)
- **Tests:** 5 pass (WAV header, concatenation, frame duration)
- **Consumers:** remotion_studio, per-project generate-tts scripts

## Architecture

- `tts-engine.ts` — WAV utils + mlx subprocess + Gemini API wrapper
- `tts-pipeline.ts` — generateTTS() orchestration (narration.ts → per-scene WAV)

## Key Exports

```ts
generateTTS(options: TTSOptions): Promise<TTSResult>
wavDurationFrames(filePath, fps): number
createWavHeader(dataSize): Buffer
concatenateWavs(segmentPaths, outputPath): void
generateViaMlxTts(text, outputPath, voice, opts): void
generateViaGemini(text, voice, narratorLang): Promise<Buffer>
```

## Backend Selection

`mlx` on macOS (default), `gemini` on other platforms. Override with `--engine` flag.
