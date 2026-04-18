---
name: generate-image-skill-lessons
description: Lessons from /generate-image skill — image.z.ai rate limits, facing LEFT, rembg, browser session management
type: feedback
---

## Rule: image.z.ai rate limit — close+reopen browser to reset

**Why:** Free tier allows ~3 images per 5 min. After that, 429 "太火爆了" error. Waiting 5+ min works but closing browser (`playwright-cli close`) and reopening (`playwright-cli open --headed --persistent`) resets the rate limit faster.

**How to apply:** Generate max 3 images, then close+reopen before continuing. Never try to wait in-page — the 429 persists across page reloads within the same browser session.

## Rule: "facing LEFT" must be emphasized multiple times in prompt

**Why:** AI models (both GLM-Image and Gemini) frequently ignore a single "facing LEFT" instruction. First yunzhi attempt produced a forward-facing character. Second attempt with 3+ mentions of LEFT succeeded.

**How to apply:** In character prompts, include at least 2-3 directional cues:
```
...facing LEFT, the character is looking toward the left side of the image,
face turned to face LEFT direction...
```

## Rule: Always use `--headed --persistent` for browser sessions

**Why:** User explicitly requested headed Chrome so they can see/interact, and persistent profile so login survives across browser close/reopen. Non-persistent sessions require re-login every time.

**How to apply:** `playwright-cli open --headed --persistent https://image.z.ai`

## Rule: AI ignores solid color background requests — rembg still works

**Why:** Requesting "solid magenta #FF00FF background" often produces black or other colors instead. rembg can still remove these backgrounds but edges may be less clean than with magenta.

**How to apply:** Always plan for rembg post-processing regardless of prompt. Magenta prompt is still worth including for best results.

## Rule: image.z.ai URL extraction via regex on img src

**Why:** The generated image src is a Next.js proxy URL. The actual image URL is in the `url=` query parameter, URL-encoded. Must decode before use.

**How to apply:**
```js
const src = await genImg.getAttribute('src');
const urlMatch = src.match(/url=([^&]+)/);
const realUrl = decodeURIComponent(urlMatch[1]);
// Then: curl -sL -o output.png realUrl
```

## Rule: Use `run-code` for multi-step browser automation

**Why:** Individual CLI commands (snapshot → click → type) are slow and refs go stale. `run-code` executes self-contained Playwright scripts atomically.

**How to apply:** Always wrap generate workflows in `playwright-cli run-code "async page => { ... }"`.

## Legacy rules (Google AI Studio / Nano Banana)

- Use `page.getByRole('button', { name: 'Run', exact: true })` — NOT `evaluate()`
- Batch: new chat per image via `page.goto()`
- Download: click image first → overlay → Download button → `waitForEvent('download')`
- Wait for "Response ready." text, not fixed timeout
