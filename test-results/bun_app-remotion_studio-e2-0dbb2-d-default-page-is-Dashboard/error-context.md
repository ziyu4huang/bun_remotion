# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bun_app/remotion_studio/e2e/smoke.spec.ts >> Smoke Tests — All Pages Load >> default page is Dashboard
- Location: bun_app/remotion_studio/e2e/smoke.spec.ts:5:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { navigateTo, waitForPageLoad, collectConsoleErrors, assertNoConsoleErrors, NAV_LABELS } from "./helpers";
  3  | 
  4  | test.describe("Smoke Tests — All Pages Load", () => {
  5  |   test("default page is Dashboard", async ({ page }) => {
  6  |     const errors = collectConsoleErrors(page);
> 7  |     await page.goto("/");
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  8  |     // Wait for React to hydrate and sidebar to render
  9  |     await page.locator("nav button").filter({ hasText: "Dashboard" }).waitFor({ state: "visible" });
  10 | 
  11 |     // Active nav button should be Dashboard with highlighted background
  12 |     const activeBtn = page.locator("nav button").filter({ hasText: "Dashboard" });
  13 |     const bg = await activeBtn.evaluate((el) => getComputedStyle(el).background);
  14 |     expect(bg).toContain("227, 242, 253");
  15 | 
  16 |     // Main content should be non-empty
  17 |     const main = page.locator("main");
  18 |     await expect(main).toBeVisible();
  19 |     const text = await main.textContent();
  20 |     expect(text!.trim().length).toBeGreaterThan(0);
  21 | 
  22 |     assertNoConsoleErrors(errors);
  23 |   });
  24 | 
  25 |   test("sidebar shows all 13 navigation items", async ({ page }) => {
  26 |     await page.goto("/");
  27 |     const buttons = page.locator("nav button");
  28 |     await expect(buttons).toHaveCount(13);
  29 | 
  30 |     for (const label of NAV_LABELS) {
  31 |       await expect(buttons.filter({ hasText: label })).toBeVisible();
  32 |     }
  33 |   });
  34 | 
  35 |   for (const label of NAV_LABELS) {
  36 |     test(`${label} page loads without console errors`, async ({ page }) => {
  37 |       const errors = collectConsoleErrors(page);
  38 |       await page.goto("/");
  39 |       await navigateTo(page, label);
  40 |       await waitForPageLoad(page);
  41 | 
  42 |       // Page should have non-empty main content
  43 |       const main = page.locator("main");
  44 |       await expect(main).toBeVisible();
  45 |       const text = await main.textContent();
  46 |       expect(text!.trim().length).toBeGreaterThan(0);
  47 | 
  48 |       // Should not show generic error text
  49 |       const errorText = page.getByText("Something went wrong");
  50 |       await expect(errorText).not.toBeVisible();
  51 | 
  52 |       assertNoConsoleErrors(errors);
  53 |     });
  54 |   }
  55 | });
  56 | 
```