# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quality.spec.ts >> Quality >> view toggle buttons exist
- Location: e2e/quality.spec.ts:17:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
    - button "Quality" [active] [ref=e11] [cursor=pointer]
    - button "Benchmark" [ref=e12] [cursor=pointer]
    - button "Agent Chat" [ref=e13] [cursor=pointer]
    - button "Assets" [ref=e14] [cursor=pointer]
    - button "TTS" [ref=e15] [cursor=pointer]
    - button "Render" [ref=e16] [cursor=pointer]
    - button "Image" [ref=e17] [cursor=pointer]
    - button "Workflows" [ref=e18] [cursor=pointer]
  - main [ref=e19]:
    - generic [ref=e20]: Loading...
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { navigateTo, waitForPageLoad } from "./helpers";
  3  | 
  4  | test.describe("Quality", () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto("/");
  7  |     await page.locator("nav button").filter({ hasText: "Quality" }).waitFor({ state: "visible" });
  8  |     await navigateTo(page, "Quality");
  9  |     await waitForPageLoad(page);
  10 |   });
  11 | 
  12 |   test("page shows quality heading", async ({ page }) => {
  13 |     const heading = page.getByRole("heading", { name: /Quality/i });
  14 |     await expect(heading).toBeVisible();
  15 |   });
  16 | 
  17 |   test("view toggle buttons exist", async ({ page }) => {
  18 |     const overviewBtn = page.getByRole("button", { name: /Cross-Series|Overview/i });
  19 |     const perSeriesBtn = page.getByRole("button", { name: /Per-Series/i });
  20 |     const overviewVisible = await overviewBtn.isVisible().catch(() => false);
  21 |     const perSeriesVisible = await perSeriesBtn.isVisible().catch(() => false);
> 22 |     expect(overviewVisible || perSeriesVisible).toBe(true);
     |                                                 ^ Error: expect(received).toBe(expected) // Object.is equality
  23 |   });
  24 | 
  25 |   test("quality content renders without errors", async ({ page }) => {
  26 |     const main = page.locator("main");
  27 |     await expect(main).toBeVisible();
  28 |     const text = await main.textContent();
  29 |     expect(text!.trim().length).toBeGreaterThan(0);
  30 | 
  31 |     // Should not show generic error
  32 |     await expect(page.getByText("Something went wrong")).not.toBeVisible();
  33 |   });
  34 | });
  35 | 
```