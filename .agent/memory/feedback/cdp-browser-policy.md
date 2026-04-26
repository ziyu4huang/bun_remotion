---
name: CDP Browser Policy for External Web Resources
description: Always use Chrome DevTools Protocol (CDP) to connect to user's real Chrome for accessing external web resources like z.ai. Never launch Playwright-controlled browsers for login-required sites.
type: feedback
---

**Rule:** Always use CDP mode (`chromium.connectOverCDP()`) when accessing external web resources that require authentication (z.ai, Google services, etc.). Never launch Playwright-controlled Chrome for login-required sites — Google detects automation and blocks login with "this browser or app may not be secure."

**Why:** Google and other OAuth providers detect Playwright's automation flags (`navigator.webdriver`, Chrome DevTools Protocol attachment markers) and block login. Connecting to the user's already-running Chrome via CDP reuses their authenticated sessions without triggering security warnings.

**How to apply:**
1. User launches Chrome with `--remote-debugging-port=9222`
2. Code uses `chromium.connectOverCDP("http://localhost:9222")` to connect
3. Use `browser.contexts()[0]` to get existing context (with cookies)
4. When done, only close our page — never close the user's browser
5. For WebUI routes, pass `browserMode: "cdp"` (default) in request body
6. Persistent profile mode (`launchPersistentContext`) is fallback only — it may trigger Google security warnings

**Files affected:** `bun_app/bun_image/src/image-engine.ts`, `bun_app/remotion_studio/src/server/routes/image.ts`, any future modules that automate external web resources.

**CDP launch command for user:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```
