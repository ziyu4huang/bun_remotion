# bun_tts -- Code TODO

## Status: Stable

Core TTS pipeline works with dual backends (mlx_tts + Gemini). Used by `remotion_studio` and per-project generate-tts scripts.

## Known Issues

- **mlx_tts setup is manual**: Requires Python 3.11 venv with `mlx-audio`, `mlx-lm`, `einops`, `soundfile`, `sounddevice`. No automated setup script.
- **Throttle delays are hardcoded**: `1500ms` for mlx, `2000ms` for Gemini between segments. Not configurable.
- **Gemini rate limiting**: 429 retry parses delay from response body, but falls back to fixed 35s wait if parsing fails.
- **WAV output is uncompressed**: All output is PCM WAV at 24kHz. No MP3/OGG compression option.
- **Single-threaded generation**: Segments are generated sequentially per scene, scenes sequentially per episode.

## Scripts Reference

| Script | Lines | Status |
|--------|-------|--------|
| `src/tts-engine.ts` | 139 | Stable -- WAV utils, mlx subprocess, Gemini API |
| `src/tts-pipeline.ts` | 152 | Stable -- episode pipeline, narration.ts import, metadata output |

## Tests

| Test file | Tests | Status |
|-----------|-------|--------|
| `src/__tests__/tts-engine.test.ts` | 5 | Passing -- WAV header, concatenation, frame duration calculation |

Note: `tts-pipeline.ts` has no unit tests (requires real narration.ts + TTS backend). Integration-tested via per-project generate-tts scripts.

## P0 -- Required for reliability

- [ ] **Error recovery for mlx_tts subprocess**: If Python subprocess crashes mid-generation, the partial segment file is left behind. Add cleanup on error.

## P1 -- Nice-to-have improvements

- [ ] **Configurable throttle delays**: Add `throttleMs` to `TTSOptions` instead of hardcoded 1500/2000ms
- [ ] **Parallel segment generation**: Generate segments within a scene concurrently with configurable concurrency
- [ ] **MP3/OGG output**: Add ffmpeg-based compression step after WAV generation for smaller file sizes
- [ ] **mlx_tts setup script**: Add `scripts/setup-mlx.sh` to automate venv creation and dependency installation
- [ ] **Pipeline unit tests**: Mock `tts-engine` functions to test `tts-pipeline.ts` without real TTS backends
- [ ] **Progress events**: Emit typed events (segment-start, segment-done, scene-done) for better UI integration
