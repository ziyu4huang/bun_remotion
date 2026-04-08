---
name: generate-image-skill-lessons
description: Lessons learned from using /generate-image skill with Playwright + Google AI Studio Nano Banana
type: feedback
---

## Rule: Use `page.evaluate()` to click "Run the prompt" — `locator.click()` fails due to overlay interception

**Why:** The `locator.click()` and even `locator.click({ force: true })` timeout because `<div class="chat-session-content">` intercepts pointer events. Only `page.evaluate(() => document.querySelector('[aria-label="Run the prompt"]').click())` works reliably.

**How to apply:** Always use `page.evaluate()` for clicking the Run button:
```js
await page.evaluate(() => {
  const btn = document.querySelector('[aria-label="Run the prompt"]');
  if (btn) btn.click();
});
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

## Rule: Download images via Playwright download event, not file system

**Why:** The "right-click → Download button" approach from the original skill is fragile. Use `page.waitForEvent('download')` with clicking the image then the Download button — this reliably captures the download event and lets you `saveAs()` to any path.

**How to apply:**
```js
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 15000 }),
  (async () => {
    await page.getByRole('img', { name: /Generated Image/ }).last().click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Download")').first().click();
  })()
]);
await download.saveAs('/absolute/path/to/output.png');
```

## Rule: Wait for "Response ready." text, not fixed timeout

**Why:** Image generation takes 5-30 seconds. Fixed timeouts either waste time or fail. Using `page.locator('text=Response ready.').last().waitFor({ timeout: 45000 })` is more reliable.

**How to apply:** Always wait for the "Response ready." signal with 45s timeout after clicking Run.
