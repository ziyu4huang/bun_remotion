# bun_image -- Code Plan

## Current State (v0.1.0)

Image generation utility for bun-remotion. Automates image generation on z.ai (image.z.ai) via Playwright browser automation with CDP (Chrome DevTools Protocol) support.

**Working:**
- `ZaiImageEngine`: Playwright-based browser automation for z.ai image generation
  - CDP mode: connects to user's real Chrome (default) -- no Google login issues
  - Persistent mode: launches persistent Chrome profile (may trigger Google security warning)
  - Auto restart after N images to avoid memory leaks
  - Aspect ratio, resolution, watermark removal controls
- `generateImage()`: single image generation with optional local download
- `generateImageBatch()`: batch generation with skip-existing, metadata companion files, progress callbacks
- CDP bridge (`cdp-image-bridge.cjs`): Node.js subprocess for CDP mode (Bun WebSocket incompatible with Playwright CDP)
- URL utilities: extract real URLs from Next.js proxy, sanitize filenames, prompt builders for character/background images
- Full test suite with mock engine (8 tests)

**Consumers:**
- `bun_pi_agent` (workspace dependency)
- `remotion_studio` (workspace dependency)

## Module Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/index.ts` | 17 | Barrel -- re-exports from image-pipeline and url-utils |
| `src/image-engine.ts` | 174 | `ZaiImageEngine` class -- Playwright browser session, single image generation, download |
| `src/image-pipeline.ts` | 231 | `generateImage()`, `generateImageBatch()`, CDP bridge subprocess, batch orchestration with skip/metadata |
| `src/url-utils.ts` | 62 | `extractImageUrl()`, `sanitizeFilename()`, `buildCharacterPrompt()`, `buildBackgroundPrompt()` |
| `src/cdp-image-bridge.cjs` | 169 | Node.js subprocess for CDP mode -- connects to Chrome, generates images, downloads results |

## Dependencies

| Dependency | Purpose | Required |
|-----------|---------|----------|
| `playwright` | Browser automation (z.ai interaction) | Yes |
| `Bun` | `Bun.write()` for file I/O | Yes |

**External requirements:**
- Chrome/Chromium running with `--remote-debugging-port=9222` for CDP mode
- Active z.ai login session in Chrome for CDP mode
- Node.js available for CDP bridge subprocess (Bun's WebSocket incompatible with Playwright CDP)

## Exports

### image-pipeline.ts

```ts
generateImage(opts: ImageGenerateOptions & { outputDir?, filename? }): Promise<ImageResult>
generateImageBatch(opts: ImageBatchOptions): Promise<ImageBatchResult>
```

Types: `ImageGenerateOptions`, `ImageResult`, `ImageBatchItem`, `ImageBatchOptions`, `ImageBatchResult`, `BrowserSessionConfig`, `EngineLike`

### url-utils.ts

```ts
extractImageUrl(proxySrc: string): string
sanitizeFilename(name: string): string
buildCharacterPrompt(description: string, opts?: CharacterPromptOptions): string
buildBackgroundPrompt(description: string, opts?: BackgroundPromptOptions): string
```

## Browser Session Modes

| Mode | How it works | Login required | Best for |
|------|-------------|---------------|----------|
| `cdp` (default) | Connects to running Chrome via CDP | Uses existing Chrome session | Production -- no auth issues |
| `persistent` | Launches Chrome with persistent profile | May trigger Google security | Testing / headless environments |
