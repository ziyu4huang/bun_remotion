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
Received length: 32
Received array:  ["Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Failed to load resource: the server responded with a status of 500 (Internal Server Error)", …]
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - heading "Bun Remotion" [level=2] [ref=e5]
    - button "Dashboard" [ref=e6] [cursor=pointer]
    - button "Monitoring" [ref=e7] [cursor=pointer]
    - button "Projects" [ref=e8] [cursor=pointer]
    - button "Story Editor" [ref=e9] [cursor=pointer]
    - button "Storygraph" [ref=e10] [cursor=pointer]
    - button "Quality" [ref=e11] [cursor=pointer]
    - button "Benchmark" [ref=e12] [cursor=pointer]
    - button "Agent Chat" [ref=e13] [cursor=pointer]
    - button "Assets" [ref=e14] [cursor=pointer]
    - button "TTS" [ref=e15] [cursor=pointer]
    - button "Render" [ref=e16] [cursor=pointer]
    - button "Image" [ref=e17] [cursor=pointer]
    - button "Workflows" [active] [ref=e18] [cursor=pointer]
  - main [ref=e19]:
    - generic [ref=e20]: Loading...
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