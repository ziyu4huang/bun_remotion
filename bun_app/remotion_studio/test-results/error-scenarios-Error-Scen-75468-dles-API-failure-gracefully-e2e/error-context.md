# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: error-scenarios.spec.ts >> Error Scenarios >> PipelineProgress handles API failure gracefully
- Location: e2e/error-scenarios.spec.ts:78:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('body')
Expected: visible
Received: undefined

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('body')

```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { navigateTo, forceApiError } from "./helpers";
  3   | 
  4   | test.describe("Error Scenarios", () => {
  5   |   test("Dashboard handles jobs API failure gracefully", async ({ page }) => {
  6   |     await page.goto("/");
  7   |     await forceApiError(page, "jobs");
  8   |     await navigateTo(page, "Dashboard");
  9   |     await page.waitForTimeout(1000);
  10  |     expect(await page.locator("h2, h3").first().isVisible()).toBe(true);
  11  |   });
  12  | 
  13  |   test("Dashboard handles health API failure gracefully", async ({ page }) => {
  14  |     await page.goto("/");
  15  |     await forceApiError(page, "health");
  16  |     await navigateTo(page, "Dashboard");
  17  |     await page.waitForTimeout(1000);
  18  |     expect(await page.locator("h2, h3").first().isVisible()).toBe(true);
  19  |   });
  20  | 
  21  |   test("Projects page handles API failure gracefully", async ({ page }) => {
  22  |     await page.goto("/");
  23  |     await forceApiError(page, "projects");
  24  |     await navigateTo(page, "Projects");
  25  |     await page.waitForTimeout(1000);
  26  |     expect(page.locator("body")).toBeVisible();
  27  |   });
  28  | 
  29  |   test("Storygraph handles pipeline failure gracefully", async ({ page }) => {
  30  |     await page.goto("/");
  31  |     await forceApiError(page, "pipeline");
  32  |     await navigateTo(page, "Storygraph");
  33  |     await page.waitForTimeout(1000);
  34  |     expect(page.locator("body")).toBeVisible();
  35  |   });
  36  | 
  37  |   test("Benchmark handles failure gracefully", async ({ page }) => {
  38  |     await page.goto("/");
  39  |     await forceApiError(page, "benchmark");
  40  |     await navigateTo(page, "Benchmark");
  41  |     await page.waitForTimeout(1000);
  42  |     expect(page.locator("body")).toBeVisible();
  43  |   });
  44  | 
  45  |   test("TTS page handles API failure gracefully", async ({ page }) => {
  46  |     await page.goto("/");
  47  |     await forceApiError(page, "tts");
  48  |     await navigateTo(page, "TTS");
  49  |     await page.waitForTimeout(1000);
  50  |     expect(page.locator("body")).toBeVisible();
  51  |   });
  52  | 
  53  |   test("Render page handles API failure gracefully", async ({ page }) => {
  54  |     await page.goto("/");
  55  |     await forceApiError(page, "render");
  56  |     await navigateTo(page, "Render");
  57  |     await page.waitForTimeout(1000);
  58  |     expect(page.locator("body")).toBeVisible();
  59  |   });
  60  | 
  61  |   test("ImageGen page handles API failure gracefully", async ({ page }) => {
  62  |     await page.goto("/");
  63  |     await forceApiError(page, "image");
  64  |     await forceApiError(page, "projects");
  65  |     await navigateTo(page, "Image");
  66  |     await page.waitForTimeout(1000);
  67  |     expect(page.locator("body")).toBeVisible();
  68  |   });
  69  | 
  70  |   test("Workflows page handles API failure gracefully", async ({ page }) => {
  71  |     await page.goto("/");
  72  |     await forceApiError(page, "workflows");
  73  |     await navigateTo(page, "Workflows");
  74  |     await page.waitForTimeout(1000);
  75  |     expect(page.locator("body")).toBeVisible();
  76  |   });
  77  | 
  78  |   test("PipelineProgress handles API failure gracefully", async ({ page }) => {
  79  |     await page.goto("/");
  80  |     await forceApiError(page, "episode-progress");
  81  |     await navigateTo(page, "Progress");
  82  |     await page.waitForTimeout(1000);
> 83  |     expect(page.locator("body")).toBeVisible();
      |                                  ^ Error: expect(locator).toBeVisible() failed
  84  |   });
  85  | 
  86  |   test("Monitoring handles API failure gracefully", async ({ page }) => {
  87  |     await page.goto("/");
  88  |     await forceApiError(page, "monitoring");
  89  |     await navigateTo(page, "Monitoring");
  90  |     await page.waitForTimeout(1000);
  91  |     expect(page.locator("body")).toBeVisible();
  92  |   });
  93  | 
  94  |   test("Agent Chat handles bridge unavailable gracefully", async ({ page }) => {
  95  |     await page.goto("/");
  96  |     await forceApiError(page, "agent/status");
  97  |     await navigateTo(page, "Agent Chat");
  98  |     await page.waitForTimeout(1000);
  99  |     // Should show unavailable message
  100 |     const errorMsg = page.getByText(/unavailable|無法使用/i);
  101 |     const bodyVisible = await page.locator("body").isVisible();
  102 |     expect(bodyVisible).toBe(true);
  103 |   });
  104 | 
  105 |   test("Error boundary catches render errors", async ({ page }) => {
  106 |     await page.goto("/");
  107 |     await navigateTo(page, "Dashboard");
  108 |     await page.waitForTimeout(500);
  109 |     const crashed = await page.evaluate(() => {
  110 |       try {
  111 |         const root = document.querySelector("main");
  112 |         if (root) root.innerHTML = "";
  113 |         return false;
  114 |       } catch {
  115 |         return true;
  116 |       }
  117 |     });
  118 |     expect(crashed).toBe(false);
  119 |     await page.waitForTimeout(500);
  120 |     expect(page.locator("body")).toBeVisible();
  121 |   });
  122 | });
  123 | 
```