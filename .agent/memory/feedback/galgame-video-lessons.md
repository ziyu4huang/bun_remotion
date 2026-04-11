---
name: galgame-video-lessons
description: Lessons learned from building galgame-meme-theater: transparent BG, audio sync, image gen
type: feedback
---

# Galgame Video Production Lessons

## 1. AI image generation CANNOT produce transparent PNG backgrounds
- **Rule:** Never assume AI image generators (Gemini/Nano Banana) will output transparent backgrounds, even if you explicitly ask for "transparent PNG background with clean alpha edges" in the prompt.
- **Why:** Nano Banana always generates with a solid background. The alpha channel will be fully opaque (255) regardless of prompt wording.
- **How to apply:** Always run `rembg` (Python) as a post-processing step to remove backgrounds. Install: `pip install --break-system-packages "rembg[cpu]"`. Run: `rembg.remove(input_img)` saves with proper alpha channel.
- **Verification:** Always check alpha channel: `python3 -c "from PIL import Image; import numpy as np; a=np.array(Image.open('file.png')); print(f'Transparent: {(a[:,:,3]==0).sum()}')"`

## 2. TTS narration MUST match dialog line content exactly
- **Rule:** When a scene has both TTS audio and dialog subtitle text, the narration text must be the actual dialog lines read aloud — NOT a summary or description of the scene.
- **Why:** If the voice says "小雪又賴床了" while the subtitle shows "今天又要早八...我感覺我的靈魂還在被窩裡", the viewer perceives them as out of sync even though both play simultaneously.
- **How to apply:** In `scripts/narration.ts`, concatenate the actual dialog lines with natural pauses (periods/comma). The dialog lines and narration text must contain the same content in the same order.

## 3. Solid character backgrounds cause "black frames"
- **Rule:** When character sprites have solid (non-transparent) backgrounds, overlaying multiple characters creates dark/black patches that look like rendering bugs.
- **Why:** 3 character sprites with dark backgrounds stacked on top of each other + scene background = very dark area. User reports "black frames".
- **How to apply:** Always verify character sprites have transparency before rendering. Use rembg post-processing if needed.

## 4. browser_run_code "Run" button selector
- **Rule:** Use `page.locator('button:has-text("Run"):not([disabled])').first()` instead of `document.querySelector('[aria-label="Run the prompt"]')`.
- **Why:** The aria-label "Run the prompt" doesn't always exist on the Run button in Google AI Studio. The text-based selector is more reliable.
- **How to apply:** Always use new chat per image (`page.goto()` with model param) for reliable batch generation.
