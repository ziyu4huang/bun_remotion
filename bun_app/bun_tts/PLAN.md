# bun_tts -- Code Plan

## Current State (v0.1.0)

Text-to-speech utility for bun-remotion. Generates WAV audio from narration scripts with support for multiple TTS backends and character voice mapping.

**Working:**
- **Dual TTS backend:**
  - `mlx_tts`: Local MLX-based TTS via Python subprocess (macOS default)
  - `Gemini TTS`: Google Gemini 2.5 Flash TTS API (fallback for non-macOS)
- **WAV utilities:**
  - `createWavHeader()`: 44-byte WAV header generation (24kHz, 16-bit, mono)
  - `concatenateWavs()`: Multi-segment WAV concatenation (PCM chunk merging)
  - `wavDurationFrames()`: Frame count calculation from WAV data size + byte rate
- **Pipeline orchestration (`generateTTS`):**
  - Reads narration.ts from episode directory
  - Extracts `narrations`, `VOICE_MAP`, `VOICE_DESCRIPTION`, `NARRATOR_LANG`
  - Generates per-segment WAV files, concatenates per-scene audio
  - Outputs: scene WAV files, `durations.json`, `segment-durations.json`, `voice-manifest.json`
  - Supports `--skip-existing`, `--scene-filter`, `--engine` options

**Consumers:**
- `remotion_studio` (workspace dependency)
- Per-project `generate-tts` scripts in `bun_remotion_proj/<name>/scripts/generate-tts.ts`

## Module Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/index.ts` | 10 | Barrel export -- re-exports tts-pipeline and tts-engine |
| `src/tts-engine.ts` | 139 | Low-level WAV utilities + backend wrappers (mlx, Gemini) |
| `src/tts-pipeline.ts` | 152 | High-level `generateTTS()` -- reads narration.ts, generates audio |

## Dependencies

| Dependency | Type | Notes |
|-----------|------|-------|
| `mlx_tts` Python venv | External | Required for local TTS on macOS. Path: `<repoRoot>/mlx_tts/.venv/bin/python` |
| `GOOGLE_API_KEY` | Env var | Required for Gemini TTS backend |
| `narration.ts` | Input file | Each episode must have `scripts/narration.ts` with `narrations[]`, `VOICE_MAP` |

## Exports

### tts-pipeline.ts

```ts
generateTTS(options: TTSOptions): Promise<TTSResult>
```

Types: `TTSOptions`, `TTSResult`, `TTSSceneResult`

### tts-engine.ts

```ts
wavDurationFrames(filePath: string, fps: number): number
createWavHeader(dataSize: number): Buffer
concatenateWavs(segmentPaths: string[], outputPath: string): void
generateViaMlxTts(text: string, outputPath: string, voice: string, opts: MlxTtsOptions): void
generateViaGemini(text: string, voice: string, narratorLang: string, retries?: number): Promise<Buffer>
```

Constants: `SAMPLE_RATE` (24000), `BYTE_RATE` (48000)

## Backend Selection Logic

```
if engine === "mlx" || (engine undefined && platform === "darwin") → mlx_tts
if engine === "gemini" || (engine undefined && platform !== "darwin") → Gemini TTS
```

## Output Files

| File | Format | Purpose |
|------|--------|---------|
| `public/audio/<scene>.wav` | WAV | Per-scene concatenated audio |
| `public/audio/durations.json` | JSON | Array of frame counts per scene |
| `public/audio/segment-durations.json` | JSON | Per-scene segment-level frame durations |
| `public/audio/voice-manifest.json` | JSON | Full manifest with character, voice, text per segment |
