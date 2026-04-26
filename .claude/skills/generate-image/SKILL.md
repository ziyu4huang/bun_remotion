---
name: generate-image
description: >
  Use when: "generate image", "create image", "AI image", "aistudio image",
  "gemini image", "imagen", "/generate-image", "nano banana", "image.z.ai",
  "z.ai image".
  Triggers on: image generation.
metadata:
  version: 5.0.0
---

# /generate-image — AI Image Generation

**Primary: image.z.ai** (GLM-Image, free). Fallback: Google AI Studio Nano Banana.

## CRITICAL: Always use CDP

Never launch Playwright-controlled Chrome for login-required sites. Google detects automation and blocks login.

Always connect to user's real Chrome via CDP:
1. User launches: `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222`
2. Code uses `chromium.connectOverCDP("http://localhost:9222")`
3. Only close our page — never close user's browser

## image.z.ai Workflow

### Via bun_app/bun_image module (recommended)

```typescript
import { generateImageBatch } from "bun_image";
const result = await generateImageBatch({
  images: [{ filename: "hero.png", prompt: "...", aspectRatio: "1:1" }],
  outputDir: "/path/to/assets/characters",
  browserConfig: { mode: "cdp" },
});
```

### Key Selectors

| Element | Selector |
|---------|----------|
| Prompt textarea | `page.locator('textarea').first()` |
| Aspect ratio | `page.locator('[role=combobox]').first()` then option: 1:1, 3:4, 4:3, **16:9**, 9:16, 21:9, 9:21 |
| Resolution | `page.locator('[role=combobox]').nth(1)` — default 1K |
| Watermark | `checkbox "去水印"` — checked by default |
| Generate button | `page.locator('button').filter({ hasText: '开始生成' })` |
| Generated image | `page.getByRole('img', { name: 'Generated' })` — on /create page |
| Download URL | Regex `url=([^&]+)` on img `src`, then curl |

### Rate Limiting

- Free: **~3 images per 5 minutes**
- Error: `429` / "太火爆了"
- **Fastest recovery: close + reopen** (`playwright-cli close` then `open --headed --persistent`)
- Batch: generate 3 → close + reopen → generate 3 more

## On Demand

| Topic | File |
|-------|------|
| Character sprites, transparency, prompt templates | [references/character-sprites.md](references/character-sprites.md) |
| Legacy Google AI Studio workflow | [references/legacy-aistudio.md](references/legacy-aistudio.md) |
