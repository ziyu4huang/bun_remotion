# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: loading-states.spec.ts >> Loading States — Skeletons >> Storygraph shows loading while fetching data
- Location: e2e/loading-states.spec.ts:37:3

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
  1  | import { test, expect } from "@playwright/test";
  2  | import { navigateTo, delayApiRoute } from "./helpers";
  3  | 
  4  | test.describe("Loading States — Skeletons", () => {
  5  |   test("Dashboard shows skeleton while loading jobs", async ({ page }) => {
  6  |     await page.goto("/");
  7  |     await delayApiRoute(page, "jobs", 500);
  8  |     await navigateTo(page, "Dashboard");
  9  |     await page.waitForTimeout(1500);
  10 |     expect(page.locator("body")).toBeVisible();
  11 |   });
  12 | 
  13 |   test("Projects shows skeleton table while loading", async ({ page }) => {
  14 |     await page.goto("/");
  15 |     await delayApiRoute(page, "projects", 500);
  16 |     await navigateTo(page, "Projects");
  17 |     await page.waitForTimeout(1500);
  18 |     expect(page.locator("body")).toBeVisible();
  19 |   });
  20 | 
  21 |   test("Workflows shows skeleton while loading templates", async ({ page }) => {
  22 |     await page.goto("/");
  23 |     await delayApiRoute(page, "workflows", 500);
  24 |     await navigateTo(page, "Workflows");
  25 |     await page.waitForTimeout(1500);
  26 |     expect(page.locator("body")).toBeVisible();
  27 |   });
  28 | 
  29 |   test("Monitoring shows skeleton cards while loading", async ({ page }) => {
  30 |     await page.goto("/");
  31 |     await delayApiRoute(page, "monitoring", 500);
  32 |     await navigateTo(page, "Monitoring");
  33 |     await page.waitForTimeout(1500);
  34 |     expect(page.locator("body")).toBeVisible();
  35 |   });
  36 | 
  37 |   test("Storygraph shows loading while fetching data", async ({ page }) => {
  38 |     await page.goto("/");
  39 |     await delayApiRoute(page, "pipeline", 500);
  40 |     await navigateTo(page, "Storygraph");
  41 |     await page.waitForTimeout(1500);
> 42 |     expect(page.locator("body")).toBeVisible();
     |                                  ^ Error: expect(locator).toBeVisible() failed
  43 |   });
  44 | 
  45 |   test("Benchmark shows loading while fetching data", async ({ page }) => {
  46 |     await page.goto("/");
  47 |     await delayApiRoute(page, "benchmark", 500);
  48 |     await navigateTo(page, "Benchmark");
  49 |     await page.waitForTimeout(1500);
  50 |     expect(page.locator("body")).toBeVisible();
  51 |   });
  52 | 
  53 |   test("Assets shows loading while fetching data", async ({ page }) => {
  54 |     await page.goto("/");
  55 |     await delayApiRoute(page, "assets", 500);
  56 |     await navigateTo(page, "Assets");
  57 |     await page.waitForTimeout(1500);
  58 |     expect(page.locator("body")).toBeVisible();
  59 |   });
  60 | 
  61 |   test("TTS shows loading while fetching projects", async ({ page }) => {
  62 |     await page.goto("/");
  63 |     await delayApiRoute(page, "projects", 500);
  64 |     await navigateTo(page, "TTS");
  65 |     await page.waitForTimeout(1500);
  66 |     expect(page.locator("body")).toBeVisible();
  67 |   });
  68 | 
  69 |   test("ImageGen shows loading while fetching data", async ({ page }) => {
  70 |     await page.goto("/");
  71 |     await delayApiRoute(page, "projects", 500);
  72 |     await navigateTo(page, "Image");
  73 |     await page.waitForTimeout(1500);
  74 |     expect(page.locator("body")).toBeVisible();
  75 |   });
  76 | });
  77 | 
```