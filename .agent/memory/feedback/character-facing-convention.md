---
name: character-facing-convention
description: ALL galgame character images (normal, chibi, battle poses) face LEFT by default, with Remotion flip rules
type: feedback
---

## Character Image Facing Convention

**Rule:** ALL galgame character images — normal sprites, chibi (Q版), battle poses, alternate outfits — must be generated facing LEFT by default.

**Why:** Establishes a consistent base direction so Remotion flipping is deterministic. You always know which way the character faces in the raw image, and flipping logic becomes simple based on screen position. This applies to every image type, not just chibi.

**How to apply:**

### Image Generation Prompt
Always include `facing LEFT` in ALL character prompts (normal and chibi):
```
// Normal sprite
anime style [description], facing LEFT, [outfit],
half-body portrait waist up, solid magenta #FF00FF background,
no background detail, high quality anime illustration

// Chibi sprite
chibi SD super deformed anime style [description], facing LEFT,
[outfit], very round head, tiny body, chibi proportions (head 2/3 of body),
half-body portrait, solid magenta #FF00FF background, clean edges,
no background detail, high quality chibi anime illustration
```

### Remotion Flip Logic
In `CharacterSprite.tsx`:
```tsx
// Convention: ALL raw images face LEFT
// Left side → flip to face RIGHT toward partner
// Right side → no flip, already facing LEFT toward partner
// Center → no flip (faces audience)
const faceMirror = side === "left" ? -1 : 1;
// Applied as: transform: `scaleX(${faceMirror})`
```

### Naming Convention
- Normal sprite: `<name>.png` (e.g., `xiuxiu.png`)
- Chibi sprite: `<name>-chibi.png` (e.g., `xiuxiu-chibi.png`)

### File Placement
- `public/images/<name>.png` — normal half-body sprite
- `public/images/<name>-chibi.png` — chibi Q版 sprite

### Background Strategy
Use solid magenta `#FF00FF` as background color in ALL generation prompts, then remove with `rembg`. AI models cannot generate true transparent PNGs.
