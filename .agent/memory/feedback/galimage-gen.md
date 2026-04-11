---
name: galgame-image-generation
description: When generating character images for galgame videos, always request transparent background + half-body in the prompt — never post-process to remove backgrounds
type: feedback
---

# Galgame Image Generation: Generate Transparent + Half-Body Upfront

**Rule:** When generating character sprites for galgame/visual-novel style Remotion videos, always include "half-body portrait (waist up), transparent PNG background, no background" in the image generation prompt.

**Why:** The user explicitly pointed out that 去背取半身照片 (background-removed half-body photos) are essential for Japanese galgame style. Post-processing background removal (color-key, flood fill) is fragile — white shirts blend with light backgrounds, edges get jagged, and it wastes significant time. Generating with transparent background from the start produces clean alpha-channel PNGs.

**How to apply:**
- When using `/generate-image` for galgame characters, always append "half-body portrait waist up, transparent PNG background, no background, facing viewer, high quality anime illustration" to the prompt
- See `remotion-best-practices/rules/galgame.md` for full patterns
- See `generate-image/SKILL.md` Tips section for galgame batch example
- Never rely on post-processing (Python/Pillow) to remove backgrounds from solid-color images
