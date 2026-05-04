# bun_image — Plan

> Full specs → GitHub issue #31 (PRD)

## Quick Reference

- **Version:** v0.1.0 — Stable
- **Purpose:** Image generation on z.ai via Playwright CDP
- **Tests:** 19 pass (8 pipeline + 11 url-utils)
- **Consumers:** bun_pi_agent, remotion_studio

## Architecture

- `image-engine.ts` — ZaiImageEngine (Playwright, CDP + persistent modes)
- `image-pipeline.ts` — generateImage(), generateImageBatch(), CDP bridge
- `url-utils.ts` — URL extraction, filename sanitization, prompt builders
- `cdp-image-bridge.cjs` — Node.js subprocess (Bun WebSocket workaround)

## Key Exports

```ts
generateImage(opts): Promise<ImageResult>
generateImageBatch(opts): Promise<ImageBatchResult>
extractImageUrl(proxySrc): string
buildCharacterPrompt(description, opts?): string
buildBackgroundPrompt(description, opts?): string
```
