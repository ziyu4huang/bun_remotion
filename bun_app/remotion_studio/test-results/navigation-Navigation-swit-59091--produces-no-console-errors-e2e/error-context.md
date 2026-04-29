# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> Navigation >> switching between all pages produces no console errors
- Location: e2e/navigation.spec.ts:23:3

# Error details

```
Error: expect(received).toHaveLength(expected)

Expected length: 0
Received length: 2
Received array:  ["Error: Minified React error #310; visit https://reactjs.org/docs/error-decoder.html?invariant=310 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at kt (http://localhost:5173/assets/index-BQUOIZW6.js:38:17858)
    at Object.Sd [as useMemo] (http://localhost:5173/assets/index-BQUOIZW6.js:38:21553)
    at be.useMemo (http://localhost:5173/assets/index-BQUOIZW6.js:9:6300)
    at Yf (http://localhost:5173/assets/index-BQUOIZW6.js:60:81374)
    at zi (http://localhost:5173/assets/index-BQUOIZW6.js:38:17263)
    at Bi (http://localhost:5173/assets/index-BQUOIZW6.js:40:3159)
    at fc (http://localhost:5173/assets/index-BQUOIZW6.js:40:45248)
    at dc (http://localhost:5173/assets/index-BQUOIZW6.js:40:40098)
    at Op (http://localhost:5173/assets/index-BQUOIZW6.js:40:40026)
    at eo (http://localhost:5173/assets/index-BQUOIZW6.js:40:39879)", "[ErrorBoundary] Error: Minified React error #310; visit https://reactjs.org/docs/error-decoder.html?invariant=310 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at kt (http://localhost:5173/assets/index-BQUOIZW6.js:38:17858)
    at Object.Sd [as useMemo] (http://localhost:5173/assets/index-BQUOIZW6.js:38:21553)
    at be.useMemo (http://localhost:5173/assets/index-BQUOIZW6.js:9:6300)
    at Yf (http://localhost:5173/assets/index-BQUOIZW6.js:60:81374)
    at zi (http://localhost:5173/assets/index-BQUOIZW6.js:38:17263)
    at Bi (http://localhost:5173/assets/index-BQUOIZW6.js:40:3159)
    at fc (http://localhost:5173/assets/index-BQUOIZW6.js:40:45248)
    at dc (http://localhost:5173/assets/index-BQUOIZW6.js:40:40098)
    at Op (http://localhost:5173/assets/index-BQUOIZW6.js:40:40026)
    at eo (http://localhost:5173/assets/index-BQUOIZW6.js:40:39879)·
    at Yf (http://localhost:5173/assets/index-BQUOIZW6.js:60:80553)
    at Lg (http://localhost:5173/assets/index-BQUOIZW6.js:74:26817)
    at jf (http://localhost:5173/assets/index-BQUOIZW6.js:53:16214)
    at main
    at div
    at _g (http://localhost:5173/assets/index-BQUOIZW6.js:74:23440)
    at mf (http://localhost:5173/assets/index-BQUOIZW6.js:41:3662)
    at _f (http://localhost:5173/assets/index-BQUOIZW6.js:60:16585)"]
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
      - button "⚙ Workflows" [active] [ref=e22] [cursor=pointer]:
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
      - button "🖼 Assets" [ref=e38] [cursor=pointer]:
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
  2  | import { navigateTo, NAV_LABELS } from "./helpers";
  3  | 
  4  | test.describe("Navigation", () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto("/");
  7  |     await page.locator("nav button").filter({ hasText: "Dashboard" }).waitFor({ state: "visible" });
  8  |   });
  9  | 
  10 |   test("active page is highlighted in sidebar", async ({ page }) => {
  11 |     // Dashboard should be active by default
  12 |     const dashboardBtn = page.locator("nav button").filter({ hasText: "Dashboard" });
  13 |     const bg = await dashboardBtn.evaluate((el) => getComputedStyle(el).background);
  14 |     expect(bg).toContain("227, 242, 253");
  15 | 
  16 |     // Navigate to Projects — Dashboard should lose highlight, Projects should gain it
  17 |     await navigateTo(page, "Projects");
  18 |     const projectsBtn = page.locator("nav button").filter({ hasText: "Projects" });
  19 |     const projectsBg = await projectsBtn.evaluate((el) => getComputedStyle(el).background);
  20 |     expect(projectsBg).toContain("227, 242, 253");
  21 |   });
  22 | 
  23 |   test("switching between all pages produces no console errors", async ({ page }) => {
  24 |     const errors: string[] = [];
  25 |     page.on("console", (msg) => {
  26 |       if (msg.type() === "error") errors.push(msg.text());
  27 |     });
  28 | 
  29 |     for (const label of NAV_LABELS) {
  30 |       await navigateTo(page, label);
  31 |       await page.waitForTimeout(300);
  32 |     }
  33 | 
  34 |     const filtered = errors.filter(
  35 |       (e) => !e.includes("favicon.ico") && !e.includes("devtools") && !e.includes("React DevTools"),
  36 |     );
> 37 |     expect(filtered).toHaveLength(0);
     |                      ^ Error: expect(received).toHaveLength(expected)
  38 |   });
  39 | 
  40 |   test("page content changes when navigating", async ({ page }) => {
  41 |     // Each page should produce different main content
  42 |     const contents: string[] = [];
  43 | 
  44 |     for (const label of ["Dashboard", "Projects", "Storygraph"]) {
  45 |       await navigateTo(page, label);
  46 |       await page.waitForTimeout(500);
  47 |       const text = await page.locator("main").textContent();
  48 |       contents.push(text!.trim().slice(0, 50));
  49 |     }
  50 | 
  51 |     // Pages should have different content
  52 |     expect(new Set(contents).size).toBe(3);
  53 |   });
  54 | });
  55 | 
```