---
name: cdp-chrome-login
description: How to handle Google login + image generation on image.z.ai via Playwright CDP
type: feedback
---

## CDP Chrome Automation for image.z.ai

**Must use CDP mode** (`chromium.connectOverCDP("http://localhost:9222")`), NOT `chromium.launch()`. Google detects automated browsers and blocks login. CDP uses the user's real Chrome session with existing cookies.

**Chrome launch:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 "https://image.z.ai/"
```

**Verify CDP:** `curl -s http://localhost:9222/json/version`

**Login flow when not logged in:**
1. Connect via CDP → find the image.z.ai page
2. Click "Sign in with Google" button on image.z.ai
3. Google OAuth opens → click "Agree" / "同意"
4. Redirected back to image.z.ai with session

**Image generation flow (verified working):**
1. Navigate to `https://image.z.ai/create`
2. Use Playwright `textarea.fill()` (NOT `evaluate`) — React needs proper input events
3. Button text is "开始生成" (not "生成") — located at `button:has-text('开始生成')`
4. Button is disabled until textarea has content (React state)
5. After clicking, wait ~30s for result — image count increases (watch for new `img[alt="Generated"]`)
6. No "下载" download button text to detect — instead check for `img[alt="Generated"]` with width > 300
7. Decode Next.js proxy URL: `/_next/image?url=<encoded>` → `decodeURIComponent(searchParams.get("url"))`
8. Download via `page.request.get(realUrl)` — returns JPEG even with .png extension (1280x1280)

**Why:** Google blocks `chromium.launch()`. CDP connects to real Chrome bypassing detection. Only close the page, not the browser. React textarea needs Playwright `fill()` not `evaluate` to trigger state.

**How to apply:** Always use CDP mode for login-required sites. Use `fill()` for React inputs. Detect generation completion by image count/alt text, not download buttons.
