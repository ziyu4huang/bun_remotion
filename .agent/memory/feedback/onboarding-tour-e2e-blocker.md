---
name: Onboarding Tour E2E Blocker
description: OnboardingTour must skip in Playwright via navigator.webdriver check, not addInitScript hacks
type: feedback
---

**Rule:** Any overlay/modal that blocks the full page MUST check `navigator.webdriver` to auto-skip in Playwright.

**Why:** `OnboardingTour` (v0.36.0) used `localStorage` check only. In Playwright, `page.addInitScript` does NOT reliably set localStorage before React mounts — spent 3+ iterations proving this. The fix was a 1-line `if (navigator.webdriver) return;` in the hook. The wizard redirect already had this guard; the tour didn't.

**How to apply:** When creating any component with `position: fixed; inset: 0; z-index: 9999` (full-page overlay), always add:
```tsx
useEffect(() => {
  if (navigator.webdriver) return; // Skip in Playwright
  // ... rest of effect
}, []);
```

**Files affected:** `OnboardingTour.tsx`, `App.tsx` (wizard redirect — already has the guard)
