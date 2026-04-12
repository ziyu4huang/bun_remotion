---
name: no-playwright-visual-verify
description: Don't use Playwright + image analysis to verify Remotion output — too expensive in tokens. Trust layout math instead.
type: feedback
---

## Don't use Playwright + Image Analysis for Remotion Verification

**Rule:** Do NOT use Playwright screenshot + AI image analysis to verify Remotion layout correctness. This is extremely expensive in Agent tokens and image analysis cost.

**Why:** Each Playwright screenshot + image analysis round-trip costs significant tokens and time. Visual AI analysis of small Studio previews is unreliable anyway — the AI can't accurately read small text or precise positioning from the embedded Studio view.

**How to apply:**
- Trust the layout math — calculate positions from CSS values (top/left percentages, fontSize, margins)
- Trust interpolation values — verify frame ranges are non-overlapping by reading the code
- Use `bun run build` to render and check output file exists (not visual correctness)
- Use Playwright ONLY for interactive debugging when user reports a specific visual issue
- For layout verification, reason about the DOM structure: if element A has opacity 0 when element B appears, they don't overlap
- Check accessibility tree snapshots (cheap) instead of screenshots when needed
- Render the video and let the user watch it — they'll report if something looks wrong
