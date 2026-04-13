---
name: no-playwright-visual-verify
description: Use playwright-cli for quick headless verification of Remotion scenes. Studio is only for debugging visual bugs.
type: feedback
---

## Headless Verification is the Default; Studio is for Bugs Only

**Rule:** After scaffolding a Remotion episode, use `playwright-cli` for quick headless verification. Only open Remotion Studio when there's a visual bug to debug.

**Why:** The previous rule ("don't use Playwright for Remotion verification") was too restrictive. `playwright-cli` is cheap — `snapshot` gives DOM structure, `screenshot` captures frames, and `eval` can check computed styles. This catches obvious issues (blank scenes, missing images, broken layout) without needing Studio or expensive AI image analysis. Studio is interactive and requires the user to watch — save it for actual debugging.

**How to apply:**

### Actual workflow that works (tested on ep5)

```bash
# 1. Start Studio for the specific episode (NOT from root — must cd into episode dir)
bash scripts/dev.sh studio galgame-meme-theater-ep5  # background

# 2. Wait for server (check HTTP 200)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# 3. Open in playwright-cli
playwright-cli open http://localhost:3000 --browser=chrome-for-testing

# 4. Navigate to composition
playwright-cli goto "http://localhost:3000/GalgameMemeTheaterEp5"

# 5. DOM snapshot to verify structure
playwright-cli snapshot --depth=5
# Expected: TransitionSeries, 6 TS.Sequence entries, audio file refs, kanji elements

# 6. Screenshot for visual check
playwright-cli screenshot --filename=ep5-title.png

# 7. Play video to advance frames, then screenshot content scene
playwright-cli click e97  # Play button
playwright-cli screenshot --filename=ep5-content.png

# 8. Close
playwright-cli close
```

### Prerequisites

```bash
playwright-cli install-browser chrome-for-testing  # one-time setup
```

### Limitations discovered

- **Canvas brightness check doesn't work** — Remotion Studio renders via WebGL, not a standard DOM canvas accessible via `getImageData()`
- **Screenshot filenames must be within allowed roots** — default allowed roots are the project dir and `.playwright-cli/`. Can't write to `/tmp/`
- **Studio must be started from the episode directory** — if started from root, the composition won't be found (it loads the first app alphabetically)
- **Don't use `playwright-cli eval` with template literals** — bash substitution conflicts with `$` in JS expressions. Use `run-code` instead.

### What to check in headless mode

- **DOM structure**: snapshot should show expected elements (background, characters, dialog box)
- **No blank frames**: screenshot + check mean brightness > 50 (or just visually inspect the PNG)
- **Text rendering**: check that title text, dialog text are visible in snapshot
- **Image loading**: check that `<img>` elements have loaded (no broken images)

### When to use Remotion Studio instead

- User reports a specific visual issue (animation timing, color, positioning)
- Need to scrub through the timeline interactively
- Debugging transition effects
- Checking audio sync (headless can't play audio)

### What NOT to do

- Don't use AI image analysis on screenshots (expensive in tokens, unreliable for small text)
- Don't use `remotion still` when playwright-cli snapshot is sufficient (playwright is faster)
