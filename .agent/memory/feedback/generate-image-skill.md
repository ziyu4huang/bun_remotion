---
name: generate-image-skill-lessons
description: Lessons learned from using /generate-image skill with Playwright + Google AI Studio Nano Banana
type: feedback
---

## Rule: Use `page.getByRole('button', { name: 'Run', exact: true }).click()` — NOT `page.evaluate()`

**Why:** `page.evaluate(() => document.querySelector('[aria-label="Run the prompt"]').click())` silently fails to trigger generation — no error thrown, but the prompt never submits. The Run button must be clicked via Playwright's locator API, not DOM evaluate. Use `page.getByRole('button', { name: 'Run', exact: true }).click()` which reliably triggers the generation.

**How to apply:**
```js
// Type prompt first
const textarea = page.locator('textarea').first();
await textarea.click();
await textarea.fill(prompt);
await page.waitForTimeout(1000);

// Click Run via role locator (NOT evaluate)
await page.getByRole('button', { name: 'Run', exact: true }).click();
```

## Rule: For batch generation, use new chat per image (`page.goto()`)

**Why:** Multi-turn chat accumulates DOM complexity — buttons get intercepted by overlays, scroll positions break, stale element references. Starting a fresh chat per image via `page.goto('https://aistudio.google.com/prompts/new_chat?model=gemini-2.5-flash-image')` is more reliable than reusing one chat.

**How to apply:** In a `browser_run_code` loop:
```js
for (const { file, prompt } of images) {
  await page.goto('https://aistudio.google.com/prompts/new_chat?model=gemini-2.5-flash-image');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1500);
  // dismiss, fill, evaluate-click, wait, download...
}
```

## Rule: Use `browser_run_code` for image generation, not individual MCP tool calls

**Why:** Individual MCP calls (snapshot → click → type → snapshot) are extremely slow and fragile. The snapshot refs go stale between steps. Using `browser_run_code` to execute a self-contained Playwright script is 5-10x faster and much more reliable.

**How to apply:** Always use `browser_run_code` for multi-step browser automation. Only use individual MCP tools for simple single-step actions like navigation.

## Rule: Download images via Playwright download event — click image first to open overlay

**Why:** The download button only appears in an overlay after clicking the generated image. You must: (1) click the image to open the overlay, (2) then click the Download button while listening for the download event. Clicking Download without the overlay open doesn't trigger a download event.

**How to apply:**
```js
// First click the generated image to open the overlay
await page.getByRole('img', { name: /Generated Image/ }).last().click();
await page.waitForTimeout(1500);

// Then download with event listener
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 15000 }),
  page.locator('button:has-text("Download")').first().click(),
]);
await download.saveAs('/absolute/path/to/output.png');

// Close overlay before next image
await page.locator('button:has-text("Close")').first().click();
```

## Rule: Wait for "Response ready." text, not fixed timeout

**Why:** Image generation takes 5-30 seconds. Fixed timeouts either waste time or fail. Using `page.locator('text=Response ready.').last().waitFor({ timeout: 45000 })` is more reliable.

**How to apply:** Always wait for the "Response ready." signal with 45s timeout after clicking Run.
