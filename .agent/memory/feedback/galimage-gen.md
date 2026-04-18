---
name: galgame-image-generation
description: Galgame character image generation: prompt for solid magenta BG, always rembg post-process, emphasize facing LEFT
type: feedback
---

## Rule: Generate with solid magenta BG + rembg — AI cannot produce transparent PNGs

**Why:** AI models (GLM-Image, Gemini) always produce solid backgrounds regardless of "transparent" requests. Post-processing with rembg is mandatory. Using magenta #FF00FF in the prompt gives rembg the cleanest edge separation.

**How to apply:**
1. Prompt must include: `solid magenta #FF00FF background, no background detail, facing LEFT, half-body portrait waist up`
2. Download the generated image
3. Run rembg: `python3 -c "from rembg import remove; from PIL import Image; img = Image.open('x.png'); remove(img).save('x.png')"`
4. Verify: `python3 -c "from PIL import Image; import numpy as np; a = np.array(Image.open('x.png')); print(f'Transparent: {(a[:,:,3]==0).sum()}/{a[:,:,3].size}')"`

## Rule: Emphasize "facing LEFT" 2-3 times in prompt

**Why:** AI models frequently ignore a single "facing LEFT" instruction. First yunzhi attempt faced forward; second attempt with multiple LEFT mentions succeeded.

**How to apply:** Include directional cues at least twice:
```
...facing LEFT, the character is looking toward the left side of the image,
face turned to face LEFT direction...
```

## Rule: Use 3:4 ratio for character portraits, 16:9 for backgrounds

**Why:** Character portraits need vertical aspect for half-body shots. Backgrounds need landscape for 1920x1080 Remotion output.

**How to apply:** Set combobox ratio to 3:4 for characters, 16:9 for backgrounds on image.z.ai.
