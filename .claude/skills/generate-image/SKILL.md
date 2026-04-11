---
name: generate-image
description: >
  Use when: "generate image", "create image", "AI image", "aistudio image",
  "gemini image", "imagen", "/generate-image", "nano banana".
  Triggers on: image generation, AI Studio, gemini image gen.
metadata:
  version: 2.0.0
---

# /generate-image — AI Image Generation via Google AI Studio

Generate images using Google's Nano Banana (Gemini) model through the Google AI Studio web interface, automated via Playwright.

---

## Usage

```
/generate-image <prompt> [options]
```

**Arguments:**
- `<prompt>` — Image description (required). What you want to generate.
- `free` — Use free tier (Nano Banana / gemini-2.5-flash-image). Default.
- `pro` — Use paid tier (Nano Banana Pro).
- `pro2` — Use paid tier (Nano Banana 2, newest).
- `--output <path>` — Save image to specific path instead of `./output/`

**Examples:**
```
/generate-image a cute cat wearing a hat
/generate-image cyberpunk cityscape pro
/generate-image fantasy dragon free --output assets/hero.png
```

---

## Models

| Model | Tier | Flag | Description |
|-------|------|------|-------------|
| Nano Banana | Free | `free` (default) | gemini-2.5-flash-image, state-of-the-art image gen |
| Nano Banana 2 | Paid | `pro2` | Pro-level visual intelligence, Flash-speed |
| Nano Banana Pro | Paid | `pro` | State-of-the-art image generation and editing |

---

## Execution Steps

Follow these steps **in order**.

### Step 1: Check browser state
- If no browser is open or not on Google AI Studio, navigate to: `https://aistudio.google.com/prompts/new_chat`
- If user is not logged in, **STOP** and tell the user to log in first. Wait for them to confirm login.
- Dismiss any "Terms of Service" dialog by clicking "Dismiss"

### Step 2: Select model
1. Take a snapshot to see current page state
2. Look for "Image Generation" category button — click it
3. Wait for the model list to appear, take another snapshot
4. Select the appropriate model based on the tier flag:
   - `free`: Click button with heading "Nano Banana" that does NOT have a "Paid" badge nearby
   - `pro`: Click button with heading "Nano Banana Pro" (has "Paid" badge)
   - `pro2`: Click button with heading "Nano Banana 2" (has "Paid" badge)
5. Verify the URL contains the correct model parameter (e.g. `model=gemini-2.5-flash-image`)

### Step 3: Generate and download image (use `browser_run_code`)

Use `browser_run_code` to execute the entire generate-and-download workflow atomically. This is faster and more reliable than individual MCP tool calls.

**Single image:**
```js
async (page) => {
  const prompt = 'YOUR_PROMPT_HERE';
  const outputPath = '/absolute/path/to/output.png';

  // 1. Fill prompt and append to chat
  const textbox = page.getByRole('textbox', { name: 'Enter a prompt' });
  await textbox.fill(prompt);
  await page.keyboard.press('Alt+Enter');
  await page.waitForTimeout(500);

  // 2. Click "Run the prompt" — MUST use evaluate() to bypass overlay interception
  await page.evaluate(() => {
    document.querySelector('[aria-label="Run the prompt"]')?.click();
  });

  // 3. Wait for generation to complete
  await page.locator('text=Response ready.').last().waitFor({ timeout: 40000 });

  // 4. Download the last generated image
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    (async () => {
      await page.getByRole('img', { name: /Generated Image/ }).last().click();
      await page.waitForTimeout(800);
      await page.locator('button:has-text("Download")').first().click();
    })()
  ]);

  await download.saveAs(outputPath);

  // 5. Dismiss overlay
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  return `Saved: ${outputPath}`;
}
```

**Multiple images (batch):**
```js
async (page) => {
  const images = [
    { file: 'name1.png', prompt: 'prompt 1' },
    { file: 'name2.png', prompt: 'prompt 2' },
    // ...
  ];
  const baseDir = '/absolute/path/to/output/dir';
  const results = [];

  for (const { file, prompt } of images) {
    try {
      // Use NEW CHAT for each image — more reliable than multi-turn
      await page.goto('https://aistudio.google.com/prompts/new_chat?model=gemini-2.5-flash-image');
      await page.waitForTimeout(2000);
      await page.keyboard.press('Escape'); // dismiss toast
      await page.waitForTimeout(500);

      // Fill prompt
      const textbox = page.getByRole('textbox', { name: 'Enter a prompt' });
      await textbox.waitFor({ state: 'visible', timeout: 10000 });
      await textbox.fill(prompt);
      await page.waitForTimeout(300);

      // Click Run button — use text selector, NOT aria-label
      const runButton = page.locator('button:has-text("Run"):not([disabled])').first();
      await runButton.waitFor({ state: 'visible', timeout: 5000 });
      await runButton.click();

      // Wait for response
      await page.locator('text=Response ready.').last().waitFor({ timeout: 60000 });
      await page.waitForTimeout(1000); // Extra buffer for image rendering

      // Download
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15000 }),
        (async () => {
          await page.getByRole('img', { name: /Generated Image/ }).last().click();
          await page.waitForTimeout(800);
          await page.locator('button:has-text("Download")').first().click();
        })()
      ]);

      await download.saveAs(`${baseDir}/${file}`);
      results.push(`${file}: OK`);
    } catch (err) {
      results.push(`${file}: FAILED - ${err.message}`);
      // Try to recover by pressing Escape
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(1000);
    }
  }

  return results.join('\n');
}
```

### Step 4: Confirm and show result
1. Verify the file exists using Bash `ls -la`
2. Display the image to the user using the Read tool
3. Report: filename, file size, and the prompt used

---

## Output

- Default output directory: `./output/`
- `output/` is in `.gitignore` (won't be committed)
- Image format: PNG
- Use `--output <path>` to save to a custom location

---

## Key Selectors

| Element | Selector | Notes |
|---------|----------|-------|
| Prompt textbox | `page.getByRole('textbox', { name: 'Enter a prompt' })` | Must be visible (no overlay) |
| Run the prompt | `page.locator('button:has-text("Run"):not([disabled])').first()` | **Use text selector** — aria-label "Run the prompt" is unreliable |
| Generated image | `page.getByRole('img', { name: /Generated Image/ }).last()` | Use `.last()` for latest |
| Download button | `page.locator('button:has-text("Download")').first()` | Only visible after clicking image |
| Response ready | `page.locator('text=Response ready.').last()` | Wait for this before downloading |
| Image overlay dismiss | `page.keyboard.press('Escape')` | MUST press before next prompt |

---

## Error Handling

| Situation | Action |
|-----------|--------|
| User not logged in | Stop and ask user to log in |
| Model button not found | Take screenshot, ask user to verify page state |
| Run button disabled | Check if prompt was entered correctly |
| Textbox not visible | Press Escape to dismiss any overlay, retry |
| Image generation fails | Check for error messages, retry once |
| Download not triggered | Try clicking the image again, wait longer |
| Playwright not connected | Tell user to ensure Playwright MCP plugin is running |
| `textbox.fill()` timeout | Overlay is blocking — press Escape first |

---

## Prerequisites

- Playwright MCP plugin must be running
- User must have a Google account logged in
- For paid tiers, user must have billing configured in Google AI Studio

---

## Tips

- **Always use `browser_run_code`** for multi-step operations — it's 5-10x faster than individual MCP tool calls
- **CRITICAL: Use text-based Run button selector** — `page.locator('button:has-text("Run"):not([disabled])').first()` is reliable. The `aria-label="Run the prompt"` selector is NOT always present.
- **For batch: ALWAYS use new chat per image** — `page.goto('https://aistudio.google.com/prompts/new_chat?model=gemini-2.5-flash-image')` is more reliable than multi-turn in one chat
- **Always press Escape after download** — the image overlay blocks the textbox
- **Use `.last()` selectors** — in multi-turn chats, always target the last occurrence
- **Wait for "Response ready."** — don't use fixed timeouts; wait for the actual signal
- **The image is a data URL** — if download fails, you can extract `src` attribute (base64) as fallback

---

## Galgame / Visual Novel Character Images

When generating character sprites for galgame-style Remotion videos, **always include these in the prompt**:

```
half-body portrait (waist up), transparent PNG background, no background,
school uniform, facing viewer, high quality anime illustration
```

### CRITICAL: AI models CANNOT produce transparent backgrounds

**Nano Banana (and most AI image generators) will always produce a SOLID background**, even when you explicitly ask for "transparent PNG background". The output will have alpha=255 everywhere.

**You MUST post-process with rembg to remove backgrounds:**

```bash
# Install (one-time)
pip3 install --break-system-packages "rembg[cpu]"

# Remove background from a character sprite
python3 -c "
from rembg import remove
from PIL import Image
img = Image.open('character.png')
result = remove(img)
result.save('character.png')
print('Done')
"
```

**Batch removal for multiple characters:**
```python
from rembg import remove
from PIL import Image
import os

for f in ['xiaoxue.png', 'xiaoyue.png', 'xiaoying.png']:
    img = Image.open(f)
    result = remove(img)
    result.save(f)
    print(f'{f}: background removed')
```

**Verification:** Always check transparency after removal:
```python
from PIL import Image; import numpy as np
a = np.array(Image.open('character.png'))
print(f'Transparent pixels: {(a[:,:,3]==0).sum()}/{a.size}')
```

### Why include "transparent background" in prompts?

Even though AI can't actually produce transparency, asking for "no background" / simple backgrounds makes rembg's job easier:
- Solid/simple backgrounds are easier to remove than complex scenes
- The subject is more cleanly separated from the background
- Fewer artifacts around hair and clothing edges

### Prompt template:
```
anime style [gender] character, [appearance details], [outfit],
half-body portrait waist up, facing viewer, no background,
high quality anime illustration
```

**Example batch for a school galgame:**
```js
const characters = [
  { file: 'xiaoming.png', prompt: 'anime style boy, brown messy hair, cheerful smile, white shirt red tie blue sweater vest school uniform, half-body portrait waist up, facing viewer, no background, high quality anime illustration' },
  { file: 'xiaomei.png', prompt: 'anime style girl, long brown hair pink bows, gentle smile, white shirt pink bow tie gray pleated skirt school uniform, half-body portrait waist up, facing viewer, no background, high quality anime illustration' },
  { file: 'teacher.png', prompt: 'anime style male teacher, short dark hair glasses, white shirt blue gold tie formal attire, half-body portrait waist up, facing viewer, no background, high quality anime illustration' },
];
```

See `/remotion-best-practices` → `rules/galgame.md` for full galgame rendering patterns.
