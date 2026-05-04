# galgame — Visual Novel Character Sprites

Prompt templates and conventions for generating character sprites for galgame/visual novel use. Works with any backend (zai, aistudio, mflux).

## CRITICAL: ALL characters MUST face LEFT

Every character image — normal sprites, chibi, battle poses, alternate outfits — must face LEFT. This makes Remotion flip logic deterministic:

- Raw image → character faces LEFT
- `side="left"` → `scaleX(-1)` flips to face RIGHT
- `side="right"` → no flip, faces LEFT toward partner
- `side="center"` → no flip, faces audience

## CRITICAL: AI cannot produce transparent backgrounds

AI models always produce a SOLID background even when asked for "transparent PNG". You MUST post-process with rembg — see `operations/background-removal.md`.

Use solid magenta `#FF00FF` backgrounds to make rembg's job easier (magenta is rarely part of character designs).

## Prompt Templates

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

**Battle pose:**
```
anime style [character] in [outfit], dynamic [pose] stance, [weapon/element],
facing LEFT, half-body portrait, solid magenta #FF00FF background,
no background detail, dramatic lighting, high quality anime illustration
```

## Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Normal | `<name>.png` | `xiuxiu.png` |
| Chibi | `<name>-chibi.png` | `xiuxiu-chibi.png` |
| Pose | `<name>-<pose>.png` | `zhoumo-angry.png` |
| Outfit | `<name>-<outfit>.png` | `luna-casual.png` |

## Batch Generation (AI Studio)

```bash
playwright-cli run-code "async page => {
  const characters = [
    { file: 'name1.png', prompt: 'anime style male cultivator, messy dark blue hair ponytail, blue eyes, white blue robes, facing LEFT, half-body portrait waist up, solid magenta #FF00FF background, no background detail, high quality anime illustration' },
    { file: 'name1-chibi.png', prompt: 'chibi SD super deformed anime style male cultivator, messy dark blue hair ponytail, big sparkly blue eyes, cute white blue robes, facing LEFT, very round head tiny body, chibi proportions head 2/3 body, half-body portrait, solid magenta #FF00FF background, no background detail, high quality chibi anime illustration' },
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

## Batch Generation (mflux)

```bash
for i in 1 2 3; do
  mflux-generate-flux2 \
    --model flux2-klein-4b \
    --prompt "PROMPT_HERE" \
    --quantize 4 --steps 4 \
    --width 512 --height 512 \
    --low-ram --mlx-cache-limit-gb 2.0 \
    --output "./output/mflux/character-${i}.png"
done
```

Then batch remove backgrounds:
```bash
python3 -c "
from rembg import remove
from PIL import Image
import glob
for f in sorted(glob.glob('./output/mflux/character-*.png')):
    img = Image.open(f)
    result = remove(img)
    result.save(f)
    print(f'{f}: background removed')
"
```

## Post-Processing Checklist

1. Generate with magenta background
2. Remove background with rembg
3. Verify transparency: `python3 -c "from PIL import Image; import numpy as np; a=np.array(Image.open('file.png')); print(f'Transparent: {(a[:,:,3]==0).sum()}/{a.size}')"` 
4. Check character faces LEFT
5. Rename to convention
