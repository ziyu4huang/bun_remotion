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

**Primary: [image.z.ai](https://image.z.ai)** (GLM-Image, free).
Fallback: Google AI Studio Nano Banana (see bottom section).

---

## CRITICAL: Always use CDP (Chrome DevTools Protocol)

**Never launch Playwright-controlled Chrome for login-required sites.** Google detects automation and blocks login with "this browser or app may not be secure."

**Always connect to user's real Chrome via CDP:**

1. User launches Chrome with remote debugging:
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   ```

2. Code uses `chromium.connectOverCDP("http://localhost:9222")` to connect

3. Uses existing browser context (with cookies/login sessions)

4. When done, only close our page — never close the user's browser

**Why:** Google and other OAuth providers detect Playwright's automation flags and block login. CDP reuses the user's authenticated Chrome session.

---

## image.z.ai Workflow

### Via bun_app/bun_image module (recommended)

```typescript
import { generateImageBatch } from "bun_image";
const result = await generateImageBatch({
  images: [{ filename: "hero.png", prompt: "...", aspectRatio: "1:1" }],
  outputDir: "/path/to/assets/characters",
  browserConfig: { mode: "cdp" },  // ALWAYS use CDP
});
```

### Via WebUI API

```bash
curl -X POST http://localhost:5173/api/image/generate \
  -H "Content-Type: application/json" \
  -d '{"seriesId":"weapon-forger","images":[{"filename":"hero.png","prompt":"...","aspectRatio":"1:1"}],"browserMode":"cdp"}'
```

```bash
playwright-cli run-code "async page => {
  await page.goto('https://image.z.ai/');
  await page.waitForTimeout(2000);

  const textbox = page.locator('textarea').first();
  await textbox.waitFor({ state: 'visible', timeout: 10000 });
  await textbox.fill('YOUR_PROMPT');
  await page.waitForTimeout(500);

  // Set aspect ratio (skip for default 9:16)
  const ratioCombo = page.locator('[role=combobox]').first();
  await ratioCombo.click({ timeout: 5000 });
  await page.waitForTimeout(800);
  await page.locator('[role=option]').filter({ hasText: '16:9' }).first().click();
  await page.waitForTimeout(300);

  // Generate
  await page.locator('button').filter({ hasText: '开始生成' }).click();
  await page.waitForURL('**/create**', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(8000);

  // Wait for result
  const genImg = page.getByRole('img', { name: 'Generated' });
  await genImg.waitFor({ state: 'visible', timeout: 90000 });
  await page.waitForTimeout(2000);

  // Extract download URL from proxy src
  const src = await genImg.getAttribute('src');
  const urlMatch = src.match(/url=([^&]+)/);
  return decodeURIComponent(urlMatch[1]);
}"
```

### Step 3: Download + verify

```bash
curl -sL -o /path/to/output.png "RETURNED_URL"
ls -la /path/to/output.png
```

### Rate Limiting

- Free tier: **~3 images per 5 minutes**
- Error: `429 Too Many Requests` / "太火爆了，稍后再试吧！"
- **Fastest recovery: close browser + reopen** (`playwright-cli close` then `open --headed --persistent`)
- Waiting 5+ min also works but close+reopen is faster
- Batch strategy: generate 3 → close + reopen → generate 3 more

### Key Selectors

| Element | Selector |
|---------|----------|
| Prompt textarea | `page.locator('textarea').first()` |
| Aspect ratio | `page.locator('[role=combobox]').first()` then option: 1:1, 3:4, 4:3, **16:9**, 9:16, 21:9, 9:21 |
| Resolution | `page.locator('[role=combobox]').nth(1)` — default 1K |
| Watermark | `checkbox "去水印"` — checked by default |
| Generate button | `page.locator('button').filter({ hasText: '开始生成' })` |
| Generated image | `page.getByRole('img', { name: 'Generated' })` — on /create page |
| Download URL | Regex `url=([^&]+)` on img `src` attribute, then curl |

---

## Character Sprites (Galgame / Visual Novel)

### ALL character images MUST face LEFT

Consistent base direction makes Remotion flip logic deterministic:
- Raw image → faces LEFT
- `side="left"` → `scaleX(-1)` flips to face RIGHT
- `side="right"` → no flip

**Warning:** AI models often ignore "facing LEFT" — emphasize strongly in prompt with multiple mentions:
```
...the character is positioned facing toward the LEFT side, looking to the left,
face turned LEFT direction, facing LEFT...
```

### AI CANNOT produce transparent backgrounds

Post-process with rembg:

```bash
pip3 install --break-system-packages "rembg[cpu]"

python3 -c "
from rembg import remove
from PIL import Image
img = Image.open('character.png')
result = remove(img)
result.save('character.png')
print('Done')
"
```

Use **solid magenta `#FF00FF`** background in prompt for cleanest rembg results. AI may produce black/other colors instead — rembg still works but edges may be less clean.

Verify transparency:
```python
from PIL import Image; import numpy as np
a = np.array(Image.open('character.png'))
print(f'Transparent: {(a[:,:,3]==0).sum()}/{a[:,:,3].size}')
```

### Prompt templates

**Normal sprite:**
```
anime style [gender] character, [appearance], [outfit],
facing LEFT, the character is looking toward the left side of the image,
half-body portrait waist up, solid magenta #FF00FF background,
no background detail, high quality anime illustration
```

**Chibi (Q版):**
```
chibi SD super deformed anime style [description],
facing LEFT, very round head tiny body, chibi proportions,
half-body portrait, solid magenta #FF00FF background,
no background detail, high quality chibi anime illustration
```

**Background (full scene):**
```
anime style [scene description], xianxia atmosphere,
dark palette with [color] highlights, cinematic wide shot
```

**Naming convention:**
- Normal: `<name>.png` | Chibi: `<name>-chibi.png` | Pose: `<name>-<pose>.png`
- Backgrounds: descriptive e.g. `forge-interior.png`, `cave.png`

---

## Legacy: Google AI Studio (FALLBACK)

Only use if image.z.ai is down or user requests it.

1. Open: `playwright-cli open https://aistudio.google.com/prompts/new_chat`
2. Select "Image Generation" → "Nano Banana" (free)
3. Use `run-code`: fill textbox → click Run → wait "Response ready." → click image → Download
4. Selectors: textbox `{ name: 'Enter a prompt' }`, Run button `has-text('Run')`, img `{ name: /Generated Image/ }`
5. Always press Escape after download to dismiss overlay

See git history (v3.0.0) for full Nano Banana workflow details.
