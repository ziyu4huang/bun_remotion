---
name: dialog-name-plate-sizing
description: When scaling the galgame dialog name plate fontSize, must recalculate the negative top offset and text marginTop to prevent overlap
type: feedback
---

## Rule

When changing the dialog name plate `fontSize`, you MUST also recalculate the `top` offset (which anchors the badge above the dialog box) and the dialog text `marginTop`.

**Why:** The name plate uses `position: absolute; top: -18` to sit above the dialog box border. This offset was calibrated for `fontSize: 24`. When fontSize was increased to 48 (2x), the badge became ~60px tall but only 18px was above the box — the remaining 42px overlapped into the dialog text area, which only had `marginTop: 8`.

**How to apply:**
- Formula: `top` ≈ `-(fontSize × 0.75 + verticalPadding)`
- Example: fontSize 48 + padding 12 → `top: -42`
- Also increase dialog text `marginTop` proportionally (fontSize 48 → `marginTop: 20`)
- This applies to ANY absolutely-positioned element that uses negative offsets to "peek" above a container — if you scale the element, scale the offset too
