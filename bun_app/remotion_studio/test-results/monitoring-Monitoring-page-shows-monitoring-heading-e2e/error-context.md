# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: monitoring.spec.ts >> Monitoring >> page shows monitoring heading
- Location: e2e/monitoring.spec.ts:12:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Monitor/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /Monitor/i })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - heading "Bun Remotion" [level=2] [ref=e5]
    - button "Dashboard" [ref=e6] [cursor=pointer]
    - button "Monitoring" [active] [ref=e7] [cursor=pointer]
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
    - button "Workflows" [ref=e18] [cursor=pointer]
  - main [ref=e19]:
    - generic [ref=e20]: Loading monitoring data...
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { navigateTo, waitForPageLoad } from "./helpers";
  3  | 
  4  | test.describe("Monitoring", () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto("/");
  7  |     await page.locator("nav button").filter({ hasText: "Monitoring" }).waitFor({ state: "visible" });
  8  |     await navigateTo(page, "Monitoring");
  9  |     await waitForPageLoad(page);
  10 |   });
  11 | 
  12 |   test("page shows monitoring heading", async ({ page }) => {
  13 |     const heading = page.getByRole("heading", { name: /Monitor/i });
> 14 |     await expect(heading).toBeVisible();
     |                           ^ Error: expect(locator).toBeVisible() failed
  15 |   });
  16 | 
  17 |   test("summary cards or content renders", async ({ page }) => {
  18 |     const main = page.locator("main");
  19 |     await expect(main).toBeVisible();
  20 |     const text = await main.textContent();
  21 |     expect(text!.trim().length).toBeGreaterThan(0);
  22 |   });
  23 | 
  24 |   test("no console errors on monitoring page", async ({ page }) => {
  25 |     const errors: string[] = [];
  26 |     page.on("console", (msg) => {
  27 |       if (msg.type() === "error") errors.push(msg.text());
  28 |     });
  29 |     await page.waitForTimeout(1000);
  30 |     const filtered = errors.filter(
  31 |       (e) => !e.includes("favicon.ico") && !e.includes("devtools") && !e.includes("React DevTools"),
  32 |     );
  33 |     expect(filtered).toHaveLength(0);
  34 |   });
  35 | });
  36 | 
```