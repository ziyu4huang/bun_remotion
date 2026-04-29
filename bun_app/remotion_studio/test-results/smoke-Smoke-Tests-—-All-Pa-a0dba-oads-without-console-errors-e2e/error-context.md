# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Smoke Tests — All Pages Load >> Assets page loads without console errors
- Location: e2e/smoke.spec.ts:54:5

# Error details

```
Error: expect(locator).not.toBeVisible() failed

Locator:  getByText('Something went wrong')
Expected: not visible
Received: visible
Timeout:  5000ms

Call log:
  - Expect "not toBeVisible" with timeout 5000ms
  - waiting for getByText('Something went wrong')
    9 × locator resolved to <h3>Something went wrong</h3>
      - unexpected value "visible"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - heading "Remotion Studio" [level=2] [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]: Overview
      - button "■ Dashboard" [ref=e8] [cursor=pointer]:
        - generic [ref=e9]: ■
        - text: Dashboard
      - button "● Monitoring" [ref=e10] [cursor=pointer]:
        - generic [ref=e11]: ●
        - text: Monitoring
      - button "▣ Progress" [ref=e12] [cursor=pointer]:
        - generic [ref=e13]: ▣
        - text: Progress
      - button "▦ Kanban" [ref=e14] [cursor=pointer]:
        - generic [ref=e15]: ▦
        - text: Kanban
    - generic [ref=e16]:
      - generic [ref=e17]: Production
      - button "📁 Projects" [ref=e18] [cursor=pointer]:
        - generic [ref=e19]: 📁
        - text: Projects
      - button "✍ Story Editor" [ref=e20] [cursor=pointer]:
        - generic [ref=e21]: ✍
        - text: Story Editor
      - button "⚙ Workflows" [ref=e22] [cursor=pointer]:
        - generic [ref=e23]: ⚙
        - text: Workflows
    - generic [ref=e24]:
      - generic [ref=e25]: Analysis
      - button "🕸 Storygraph" [ref=e26] [cursor=pointer]:
        - generic [ref=e27]: 🕸
        - text: Storygraph
      - button "✔ Quality" [ref=e28] [cursor=pointer]:
        - generic [ref=e29]: ✔
        - text: Quality
      - button "📊 Benchmark" [ref=e30] [cursor=pointer]:
        - generic [ref=e31]: 📊
        - text: Benchmark
    - generic [ref=e32]:
      - generic [ref=e33]: AI
      - button "🤖 Agent Chat" [ref=e34] [cursor=pointer]:
        - generic [ref=e35]: 🤖
        - text: Agent Chat
    - generic [ref=e36]:
      - generic [ref=e37]: Assets
      - button "🖼 Assets" [active] [ref=e38] [cursor=pointer]:
        - generic [ref=e39]: 🖼
        - text: Assets
      - button "🔊 TTS" [ref=e40] [cursor=pointer]:
        - generic [ref=e41]: 🔊
        - text: TTS
      - button "▶ Render" [ref=e42] [cursor=pointer]:
        - generic [ref=e43]: ▶
        - text: Render
      - button "🎨 Image" [ref=e44] [cursor=pointer]:
        - generic [ref=e45]: 🎨
        - text: Image
    - generic [ref=e46]:
      - button "◐" [ref=e47] [cursor=pointer]
      - button "中" [ref=e48] [cursor=pointer]
  - main [ref=e49]:
    - generic [ref=e51]:
      - generic [ref=e52]: "!"
      - heading "Something went wrong" [level=3] [ref=e53]
      - paragraph [ref=e54]: "Minified React error #310; visit https://reactjs.org/docs/error-decoder.html?invariant=310 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
      - button "Reload Page" [ref=e55] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { navigateTo, waitForPageLoad, collectConsoleErrors, assertNoConsoleErrors, NAV_LABELS } from "./helpers";
  3  | 
  4  | test.describe("API Health", () => {
  5  |   test("GET /api/health responds with ok", async ({ request }) => {
  6  |     const resp = await request.get("/api/health");
  7  |     expect(resp.ok()).toBe(true);
  8  |     const data = await resp.json();
  9  |     expect(data.ok).toBe(true);
  10 |     expect(data.data.status).toBe("ok");
  11 |   });
  12 | 
  13 |   test("GET /api/jobs returns array", async ({ request }) => {
  14 |     const resp = await request.get("/api/jobs");
  15 |     expect(resp.ok()).toBe(true);
  16 |     const data = await resp.json();
  17 |     expect(data.ok).toBe(true);
  18 |     expect(Array.isArray(data.data)).toBe(true);
  19 |   });
  20 | });
  21 | 
  22 | test.describe("Smoke Tests — All Pages Load", () => {
  23 |   test("default page is Dashboard", async ({ page }) => {
  24 |     const errors = collectConsoleErrors(page);
  25 |     await page.goto("/");
  26 |     // Wait for React to hydrate and sidebar to render
  27 |     await page.locator("nav button").filter({ hasText: "Dashboard" }).waitFor({ state: "visible" });
  28 | 
  29 |     // Active nav button should be Dashboard with highlighted background
  30 |     const activeBtn = page.locator("nav button").filter({ hasText: "Dashboard" });
  31 |     const bg = await activeBtn.evaluate((el) => getComputedStyle(el).background);
  32 |     expect(bg).toContain("227, 242, 253");
  33 | 
  34 |     // Main content should be non-empty
  35 |     const main = page.locator("main");
  36 |     await expect(main).toBeVisible();
  37 |     const text = await main.textContent();
  38 |     expect(text!.trim().length).toBeGreaterThan(0);
  39 | 
  40 |     assertNoConsoleErrors(errors);
  41 |   });
  42 | 
  43 |   test("sidebar shows all 13 navigation items", async ({ page }) => {
  44 |     await page.goto("/");
  45 |     const buttons = page.locator("nav button");
  46 |     await expect(buttons).toHaveCount(13);
  47 | 
  48 |     for (const label of NAV_LABELS) {
  49 |       await expect(buttons.filter({ hasText: label })).toBeVisible();
  50 |     }
  51 |   });
  52 | 
  53 |   for (const label of NAV_LABELS) {
  54 |     test(`${label} page loads without console errors`, async ({ page }) => {
  55 |       const errors = collectConsoleErrors(page);
  56 |       await page.goto("/");
  57 |       await navigateTo(page, label);
  58 |       await waitForPageLoad(page);
  59 | 
  60 |       // Page should have non-empty main content
  61 |       const main = page.locator("main");
  62 |       await expect(main).toBeVisible();
  63 |       const text = await main.textContent();
  64 |       expect(text!.trim().length).toBeGreaterThan(0);
  65 | 
  66 |       // Should not show generic error text
  67 |       const errorText = page.getByText("Something went wrong");
> 68 |       await expect(errorText).not.toBeVisible();
     |                                   ^ Error: expect(locator).not.toBeVisible() failed
  69 | 
  70 |       assertNoConsoleErrors(errors);
  71 |     });
  72 |   }
  73 | });
  74 | 
```