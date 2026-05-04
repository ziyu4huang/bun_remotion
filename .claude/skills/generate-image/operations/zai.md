# zai — z.ai Free Web UI

Free image generation via GLM-Image at https://image.z.ai/. Requires Google login (one-time). Automated via Playwright.

## Prerequisites

- `playwright-cli` or Playwright MCP plugin enabled
- User logged into z.ai via Google (one-time, persisted with `--persistent`)

## Platform-specific browser launch

**macOS:**
```bash
playwright-cli open "https://image.z.ai/"
```

**Windows 11 (use --headed --persistent):**
```bash
playwright-cli open --headed --browser chrome --persistent "https://image.z.ai/"
```

## Execution Steps

### Step 1: Open browser and verify login

```bash
playwright-cli open "https://image.z.ai/"
playwright-cli snapshot
```

If not logged in (no History link in nav), **STOP** and tell user to log in with Google. Wait for confirmation.

### Step 2: Fill prompt and generate

```bash
playwright-cli run-code "async page => {
  const prompt = 'YOUR_PROMPT_HERE';
  const textbox = page.getByRole('textbox', { name: /Enter your creative description/ });
  await textbox.fill(prompt);
  await page.waitForTimeout(500);
  const genButton = page.locator(\"button:has-text('Start Generation')\").first();
  await genButton.click();
  return 'Generation started';
}"
```

### Step 3: Wait for completion

```bash
playwright-cli run-code "async page => {
  await page.waitForFunction(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.includes('Generating')) return false;
      if (btn.textContent.includes('Start Generation') && !btn.disabled) return true;
    }
    return false;
  }, { timeout: 120000 });
  await page.waitForTimeout(2000);
  return 'Done';
}"
```

### Step 4: Extract image URL and download

```bash
# Get URL
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    return document.querySelector('img[alt=\"Generated\"]')?.src;
  });
}"

# Download (separate Bash call — do NOT download inside run-code)
curl -sL -o "./output/image.png" "URL_FROM_ABOVE"
```

### Step 5: Verify and show

1. `ls -la ./output/image.png`
2. `Read` tool on the file
3. Report: filename, size, prompt

## Key Selectors

| Element | Selector |
|---------|----------|
| Prompt textbox (home) | `page.getByRole('textbox', { name: /Enter your creative description/ })` |
| Prompt textbox (create) | `page.getByRole('textbox', { name: /Describe the image you want to generate/ })` |
| Start Generation | `page.locator("button:has-text('Start Generation')").first()` |
| Generated image | `document.querySelector('img[alt='Generated']')` |
| No Watermark | `page.getByRole('checkbox', { name: 'No Watermark' })` |

## Error Handling

| Situation | Action |
|-----------|--------|
| Not logged in | Stop, ask user to log in |
| Generation never completes | Check for error messages, retry once |
| No generated image found | Page may not have navigated to /create, retry |
| Download fails | Try extracting base64 src as fallback |

## Notes

- File format is JPEG despite URL containing .png — verify with `file` command
- Do NOT use multi-arg `page.evaluate()` — crashes playwright-cli
- Close browser when done: `playwright-cli close`

## Manual Fallback

If automation fails, tell user to:
1. Open https://image.z.ai/ in regular browser
2. Log in with Google
3. Paste prompt → Start Generation → Right-click Save
