---
name: generate-image
description: >
  Use when: "generate image", "create image", "AI image", "aistudio image",
  "gemini image", "imagen", "/generate-image", "nano banana".
  Triggers on: image generation, AI Studio, gemini image gen.
metadata:
  version: 3.0.0
---

# /generate-image — AI Image Generation via Google AI Studio

Generate images using Google's Nano Banana (Gemini) model through the Google AI Studio web interface, automated via `playwright-cli`.

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

| Model | Tier | Flag | URL param | Description |
|-------|------|------|-----------|-------------|
| Nano Banana | Free | `free` (default) | `model=gemini-2.5-flash-image` | state-of-the-art image gen |
| Nano Banana 2 | Paid | `pro2` | `model=gemini-2.5-flash-preview-image-generation` | Pro-level visual intelligence, Flash-speed |
| Nano Banana Pro | Paid | `pro` | `model=gemini-2.5-pro-preview-06-05` | State-of-the-art image generation and editing |

---

## Execution Steps

Follow these steps **in order**.

### Step 1: Open browser and check login state

```bash
playwright-cli open https://aistudio.google.com/prompts/new_chat
```

Take a snapshot to verify page state:
```bash
playwright-cli snapshot
```

- If user is not logged in (redirected to login page), **STOP** and tell the user to log in first. Wait for them to confirm login.
- If a "Terms of Service" dialog appears, click the Dismiss button using the ref from the snapshot.
- Dismiss any toast/banner by pressing Escape: `playwright-cli press Escape`

### Step 2: Select model

1. Take a snapshot: `playwright-cli snapshot`
2. Look for "Image Generation" category button in the snapshot — click it using its ref
3. Take another snapshot to see the model list
4. Select the appropriate model based on the tier flag:
   - `free`: Click "Nano Banana" button (does NOT have a "Paid" badge)
   - `pro`: Click "Nano Banana Pro" button (has "Paid" badge)
   - `pro2`: Click "Nano Banana 2" button (has "Paid" badge)
5. Verify the URL changed to include the correct model parameter

### Step 3: Generate and download image

Use `playwright-cli run-code` to execute the entire generate-and-download workflow atomically. This is faster and more reliable than individual CLI commands.

**Single image:**
```bash
playwright-cli run-code "async page => {
  const prompt = 'YOUR_PROMPT_HERE';
  const outputPath = '/absolute/path/to/output.png';

  // 1. Fill prompt
  const textbox = page.getByRole('textbox', { name: 'Enter a prompt' });
  await textbox.fill(prompt);
  await page.waitForTimeout(300);

  // 2. Click Run button
  const runButton = page.locator(\"button:has-text('Run'):not([disabled])\").first();
  await runButton.click();

  // 3. Wait for generation to complete
  await page.locator('text=Response ready.').last().waitFor({ timeout: 60000 });
  await page.waitForTimeout(1000);

  // 4. Download the generated image
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    (async () => {
      await page.getByRole('img', { name: /Generated Image/ }).last().click();
      await page.waitForTimeout(800);
      await page.locator(\"button:has-text('Download')\").first().click();
    })()
  ]);
  await download.saveAs(outputPath);

  // 5. Dismiss overlay
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  return 'Saved: ' + outputPath;
}"
```

**Multiple images (batch) — use NEW CHAT for each image:**
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
      // NEW CHAT for each image — more reliable than multi-turn
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

### Step 4: Confirm and show result
1. Verify the file exists: `ls -la <output-path>`
2. Display the image to the user using the Read tool
3. Report: filename, file size, and the prompt used

---

## Output

- Default output directory: `./output/`
- `output/` is in `.gitignore` (won't be committed)
- Image format: PNG
- Use `--output <path>` to save to a custom path

---

## Key Selectors

| Element | Selector (for `run-code`) | Notes |
|---------|---------------------------|-------|
| Prompt textbox | `page.getByRole('textbox', { name: 'Enter a prompt' })` | Must be visible (no overlay) |
| Run the prompt | `page.locator("button:has-text('Run'):not([disabled])").first()` | **Use text selector** — aria-label is unreliable |
| Generated image | `page.getByRole('img', { name: /Generated Image/ }).last()` | Use `.last()` for latest |
| Download button | `page.locator("button:has-text('Download')").first()` | Only visible after clicking image |
| Response ready | `page.locator('text=Response ready.').last()` | Wait for this before downloading |
| Image overlay dismiss | `page.keyboard.press('Escape')` | MUST press before next prompt |

---

## Error Handling

| Situation | Action |
|-----------|--------|
| User not logged in | Stop and ask user to log in |
| Model button not found | Take snapshot, ask user to verify page state |
| Run button disabled | Check if prompt was entered correctly |
| Textbox not visible | Press Escape to dismiss any overlay, retry |
| Image generation fails | Check for error messages, retry once |
| Download not triggered | Try clicking the image again, wait longer |
| `run-code` fails | Check playwright-cli is installed: `playwright-cli --version` |
| `textbox.fill()` timeout | Overlay is blocking — press Escape first |

---

## Prerequisites

- `playwright-cli` must be installed (`npm install -g @playwright/cli@latest` or `npx playwright-cli`)
- User must have a Google account logged in
- For paid tiers, user must have billing configured in Google AI Studio

---

## Tips

- **Always use `run-code`** for the generate-and-download workflow — it's 5-10x faster than individual CLI commands
- **For batch: ALWAYS use new chat per image** — `page.goto('...new_chat?model=...')` is more reliable than multi-turn
- **Always press Escape after download** — the image overlay blocks the textbox
- **Use `.last()` selectors** — in multi-turn chats, always target the last occurrence
- **Wait for "Response ready."** — don't use fixed timeouts; wait for the actual signal
- **The image is a data URL** — if download fails, you can extract `src` attribute (base64) as fallback
- **Close browser when done**: `playwright-cli close`

---

## Galgame / Visual Novel Character Images

When generating character sprites for galgame-style Remotion videos, **always include these in the prompt**:

```
half-body portrait (waist up), solid magenta #FF00FF background,
no background detail, facing LEFT, high quality anime illustration
```

### CRITICAL CONVENTION: ALL character images MUST face LEFT

This applies to **every** character image — normal sprites, chibi (Q版), battle poses, alternate outfits. A consistent base direction makes Remotion flip logic deterministic:
- Raw image → character **always** faces LEFT
- `side="left"` → `scaleX(-1)` flips to face RIGHT toward partner
- `side="right"` → no flip, already facing LEFT toward partner
- `side="center"` → no flip (facing audience)

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

### Why use solid magenta #FF00FF background?

Even though AI can't produce transparency, using a solid magenta background makes rembg's job easier:
- Magenta is rarely part of character designs, so rembg separates cleanly
- Solid color backgrounds are easier to remove than complex scenes
- Fewer artifacts around hair and clothing edges

### Prompt templates:

**Normal sprite:**
```
anime style [gender] character, [appearance details], [outfit],
facing LEFT, half-body portrait waist up, solid magenta #FF00FF background,
no background detail, high quality anime illustration
```

**Chibi (Q版) sprite:**
```
chibi SD super deformed anime style [description], facing LEFT,
[outfit], very round head, tiny body, chibi proportions (head 2/3 of body),
half-body portrait, solid magenta #FF00FF background, clean edges,
no background detail, high quality chibi anime illustration
```

**Naming convention:**
- Normal: `<name>.png` (e.g., `xiuxiu.png`)
- Chibi: `<name>-chibi.png` (e.g., `xiuxiu-chibi.png`)
- Pose: `<name>-<pose>.png` (e.g., `zhoumo-angry.png`)

**Example batch with both normal and chibi:**
```bash
playwright-cli run-code "async page => {
  const characters = [
    { file: 'xiuxiu.png', prompt: 'anime style male cultivator, messy dark blue hair ponytail, blue eyes, white blue robes, facing LEFT, half-body portrait waist up, solid magenta #FF00FF background, no background detail, high quality anime illustration' },
    { file: 'xiuxiu-chibi.png', prompt: 'chibi SD super deformed anime style male cultivator, messy dark blue hair ponytail, big sparkly blue eyes, cute white blue robes, facing LEFT, very round head tiny body, chibi proportions head 2/3 body, half-body portrait, solid magenta #FF00FF background, no background detail, high quality chibi anime illustration' },
  ];
  const baseDir = '/absolute/path/to/output';
  const results = [];
  for (const { file, prompt } of characters) {
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

See `/remotion-best-practices` → `rules/galgame.md` for full galgame rendering patterns.
