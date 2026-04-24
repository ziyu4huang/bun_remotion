---
name: cdp-login-check
description: Always verify z.ai login state before starting batch image generation. Auto-detect OAuth pages.
type: feedback
---

**Rule:** Before any batch image generation via CDP, check if Chrome is logged in to z.ai. The CDP bridge must auto-detect OAuth authorize pages and either auto-click authorize or fail fast with a clear "NOT_LOGGED_IN" error instead of silently hanging.

**Why:** Batch generation of 13 images takes 15-25 minutes. If z.ai session expired mid-run, the bridge silently hangs on the OAuth redirect page forever, wasting time. The user had to manually authorize and restart.

**How to apply:**
1. Before generating each image, check current page URL for `oauth/authorize` or `auth/oauth`
2. If found, attempt auto-click authorize button, then wait for redirect back to z.ai
3. If no textarea visible after redirect, throw `NOT_LOGGED_IN` error with clear instructions
4. The `ensureLoggedIn()` function in `cdp-image-bridge.cjs` handles this
5. Always check `curl -s http://localhost:9222/json` tab URLs before starting batch jobs
