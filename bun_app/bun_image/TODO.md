# bun_image -- Code TODO

## Status: Stable

Core image generation pipeline works. Used by `bun_pi_agent` and `remotion_studio`.

## Known Issues

- **Bun WebSocket incompatibility**: Playwright `connectOverCDP()` requires Node.js subprocess (`cdp-image-bridge.cjs`). This is a Bun runtime limitation, not fixable in app code.
- **z.ai login required**: CDP mode requires user to be logged into z.ai in their Chrome browser. No programmatic login.
- **Rate limiting**: No built-in rate limiting or retry for z.ai generation failures beyond browser timeout.
- **Hardcoded z.ai URL**: `ZAI_URL = "https://image.z.ai/"` is hardcoded in CDP bridge**: `ZAI_URL = "https://image.z.ai/"` is not configurable.

## Scripts Reference

| Script | Lines | Status |
|--------|-------|--------|
| `src/image-engine.ts` | 174 | Stable -- Playwright browser automation, CDP + persistent modes |
| `src/image-pipeline.ts` | 231 | Stable -- batch generation, CDP bridge, skip-existing, metadata |
| `src/url-utils.ts` | 62 | Stable -- URL extraction, filename sanitization, prompt builders |
| `src/cdp-image-bridge.cjs` | 169 | Stable -- Node.js CDP subprocess for Bun compatibility |

## Tests

| Test file | Tests | Status |
|-----------|-------|--------|
| `src/__tests__/image-pipeline.test.ts` | 8 | Passing -- batch generation, skip-existing, metadata, failure handling |
| `src/__tests__/url-utils.test.ts` | 11 | Passing -- URL extraction, filename sanitization, character/background prompts |

## P1 -- Nice-to-have improvements

- [ ] **Configurable z.ai URL**: Extract `ZAI_URL` as a parameter or env var for staging/testing
- [ ] **Retry with backoff**: Add automatic retry for transient browser failures (page timeout, navigation errors)
- [ ] **Image validation**: Verify downloaded image is valid PNG (check magic bytes) before reporting success
- [ ] **Concurrent batch generation**: Generate multiple images in parallel with configurable concurrency limit
- [ ] **Gemini Imagen backend**: Add `generateViaGemini()` as an alternative to browser-based z.ai, similar to bun_tts's Gemini TTS backend
