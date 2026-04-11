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

## 5. Opening scene must be visually impactful — particles are NOT enough
- **Rule:** A title scene with only floating particles + fade text is underwhelming. The opening is the first impression and must "hook" the viewer within 2-3 seconds.
- **Why:** In galgame-meme-theater, the TitleScene was just a gradient background + 20 small dots + text. Users reported "not shocking enough." Particles alone look like a placeholder, not a polished intro.
- **How to apply:** Use at least one of: dramatic scale-in entrance, screen shake, flash/bloom effect, character silhouette reveal, bold typography with spring animation, or a short "stinger" animation. The title should feel like an anime OP intro, not a PowerPoint slide.

## 6. Scene transitions cause "black seconds" — fade-out/fade-in must overlap
- **Rule:** When scene A fades out and scene B starts, the container background color becomes visible in the gap. You MUST ensure fade-out of scene A overlaps with fade-in of scene B so the viewer never sees the raw container background.
- **Why:** In galgame-meme-theater, the `AbsoluteFill` has `backgroundColor: "#0a051e"` (near-black). TitleScene fades out at frames 90-120, but the next scene (JokeScene1) starts at frame 120 with no fade-in — creating ~15 frames (0.5s) of dark background visible between scenes.
- **How to apply:** Either: (a) make each scene handle its own fade-in from the first 15 frames (so it fades in as the previous fades out), or (b) use a dedicated transition `<Sequence>` between scenes, or (c) use a cross-dissolve pattern where both scenes are visible during the transition window. Never rely on the container background to bridge scene gaps.

## 7. TTS voice MUST match character gender — don't use a male voice for female characters
- **Rule:** When generating TTS for character dialog, each character must have a voice that matches their gender. A single "narrator" voice is only acceptable for pure narration (no character speaking).
- **Why:** In galgame-meme-theater, `MLX_VOICE = "uncle_fu"` (clearly a male voice) was used for ALL dialog lines, but all three characters (小雪, 小月, 小樱) are female. The mismatch between female character sprites and male voice is jarring and breaks immersion.
- **How to apply:** Define a `voice` field in the character config. In the TTS script, select the voice based on which character is speaking each line. For mlx_tts, use female voices (e.g., "xiaoxuan", "xiaomei"). For Gemini TTS, use female voices (e.g., "Kore", "Aoede"). For edge-tts, use `zh-TW-HsiaoChenNeural` (female). If the TTS engine doesn't support per-line voice switching in a single audio file, generate separate audio per character and concatenate them.
