# aistudio — Google AI Studio (Nano Banana)

Generate images via Google's Nano Banana models through AI Studio, automated via Playwright.

## Prerequisites

- Playwright MCP plugin enabled with msedge channel (`/plugin playwright`)
- User logged into Google in Edge browser
- For paid tiers: billing configured in AI Studio

## Models

| Model | Flag | Tier | URL param |
|-------|------|------|-----------|
| Nano Banana | `free` (default) | Free | `model=gemini-2.5-flash-image` |
| Nano Banana 2 | `pro2` | Paid | `model=gemini-2.5-flash-preview-image-generation` |
| Nano Banana Pro | `pro` | Paid | `model=gemini-2.5-pro-preview-06-05` |

## Execution Steps

### Step 1: Open browser and check login

```bash
playwright-cli open https://aistudio.google.com/prompts/new_chat
playwright-cli snapshot
```

- If not logged in → **STOP**, ask user to log in
- Dismiss ToS dialog or toasts with Escape

### Step 2: Select model

1. Snapshot → find "Image Generation" category → click
2. Snapshot → select model by tier flag
3. Verify URL has correct model parameter

### Step 3: Generate and download (single image)

```bash
playwright-cli run-code "async page => {
  const prompt = 'YOUR_PROMPT_HERE';
  const outputPath = '/absolute/path/to/output.png';

  const textbox = page.getByRole('textbox', { name: 'Enter a prompt' });
  await textbox.fill(prompt);
  await page.waitForTimeout(300);

  const runButton = page.locator(\"button:has-text('Run'):not([disabled])\").first();
  await runButton.click();

  await page.locator('text=Response ready.').last().waitFor({ timeout: 60000 });
  await page.waitForTimeout(1000);

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    (async () => {
      await page.getByRole('img', { name: /Generated Image/ }).last().click();
      await page.waitForTimeout(800);
      await page.locator(\"button:has-text('Download')\").first().click();
    })()
  ]);
  await download.saveAs(outputPath);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  return 'Saved: ' + outputPath;
}"
```

### Batch (multiple images — NEW CHAT per image)

```bash
playwright-cli run-code "async page => {
  const images = [
    { file: 'name1.png', prompt: 'prompt 1' },
    { file: 'name2.png', prompt: 'prompt 2' },
  ];
  const baseDir = '/absolute/path/to/output/dir';
  const results = [];

  for (const { file, prompt } of images) {
    try {
      await page.goto('https://aistudio.google.com/prompts/new_chat?model=gemini-2.5-flash-image');
      await page.waitForTimeout(2000);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      const textbox = page.getByRole('textbox', { name: 'Enter a prompt' });
      await textbox.waitFor({ state: 'visible', timeout: 10000 });
      await textbox.fill(prompt);
      await page.waitForTimeout(300);

      const runButton = page.locator(\"button:has-text('Run'):not([disabled])\").first();
      await runButton.waitFor({ state: 'visible', timeout: 5000 });
      await runButton.click();

      await page.locator('text=Response ready.').last().waitFor({ timeout: 60000 });
      await page.waitForTimeout(1000);

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15000 }),
        (async () => {
          await page.getByRole('img', { name: /Generated Image/ }).last().click();
          await page.waitForTimeout(800);
          await page.locator(\"button:has-text('Download')\").first().click();
        })()
      ]);
      await download.saveAs(baseDir + '/' + file);
      results.push(file + ': OK');
    } catch (err) {
      results.push(file + ': FAILED - ' + err.message);
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(1000);
    }
  }
  return results.join('\\n');
}"
```

### Step 4: Verify and show

1. `ls -la <output-path>`
2. `Read` tool on the file
3. Report: filename, size, prompt

## Key Selectors

| Element | Selector |
|---------|----------|
| Prompt textbox | `page.getByRole('textbox', { name: 'Enter a prompt' })` |
| Run button | `page.locator("button:has-text('Run'):not([disabled])").first()` |
| Generated image | `page.getByRole('img', { name: /Generated Image/ }).last()` |
| Download button | `page.locator("button:has-text('Download')").first()` |
| Response ready | `page.locator('text=Response ready.').last()` |

## Error Handling

| Situation | Action |
|-----------|--------|
| Not logged in | Stop, ask user to log in |
| Run button disabled | Check prompt was entered correctly |
| Textbox not visible | Press Escape to dismiss overlay, retry |
| Download not triggered | Click image again, wait longer |
| Generation fails | Check error messages, retry once |

## Tips

- Always use `run-code` for the full workflow — 5-10x faster than individual commands
- For batch: ALWAYS new chat per image — more reliable than multi-turn
- Always press Escape after download — overlay blocks textbox
- Use `.last()` selectors for multi-turn chats
- Wait for "Response ready." — don't use fixed timeouts
- If download fails, extract base64 `src` attribute as fallback
- Close browser when done
