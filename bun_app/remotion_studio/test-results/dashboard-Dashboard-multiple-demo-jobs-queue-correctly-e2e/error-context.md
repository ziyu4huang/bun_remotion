# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard >> multiple demo jobs queue correctly
- Location: e2e/dashboard.spec.ts:56:3

# Error details

```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('text=completed').first() to be visible

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
    - button "Workflows" [ref=e18] [cursor=pointer]
  - main [ref=e19]:
    - generic [ref=e20]:
      - heading "Dashboard" [level=1] [ref=e21]
      - generic [ref=e22]:
        - heading "Server Status" [level=3] [ref=e23]
        - generic [ref=e24]: ...
      - generic [ref=e25]:
        - heading "Job Queue" [level=3] [ref=e26]
        - button "Run Demo Job" [active] [ref=e27] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Dashboard", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/");
  6  |     // Wait for React to render the Dashboard
  7  |     await page.locator("nav button").filter({ hasText: "Dashboard" }).waitFor({ state: "visible" });
  8  |   });
  9  | 
  10 |   test("shows server status section", async ({ page }) => {
  11 |     const statusSection = page.locator("section").filter({ hasText: "Server Status" });
  12 |     await expect(statusSection).toBeVisible();
  13 |   });
  14 | 
  15 |   test("health check shows ok status", async ({ page }) => {
  16 |     // Server status should show "ok" (green) or "failed" — either way it renders
  17 |     const statusText = page.locator("text=ok").or(page.locator("text=failed"));
  18 |     await expect(statusText.first()).toBeVisible({ timeout: 5_000 });
  19 |   });
  20 | 
  21 |   test("Run Demo Job button exists and is clickable", async ({ page }) => {
  22 |     const btn = page.getByRole("button", { name: /Run Demo Job/i });
  23 |     await expect(btn).toBeVisible();
  24 |     await expect(btn).toBeEnabled();
  25 |   });
  26 | 
  27 |   test("clicking Run Demo Job creates a job and shows progress", async ({ page }) => {
  28 |     const btn = page.getByRole("button", { name: /Run Demo Job/i });
  29 |     await btn.click();
  30 | 
  31 |     // Button should change to show running state
  32 |     const runningBtn = page.getByRole("button", { name: /Running/i });
  33 |     await expect(runningBtn).toBeVisible({ timeout: 2_000 });
  34 | 
  35 |     // Wait for job to complete (max 10s)
  36 |     const completedText = page.locator("text=completed").first();
  37 |     await expect(completedText).toBeVisible({ timeout: 10_000 });
  38 |   });
  39 | 
  40 |   test("job table appears after demo job completes", async ({ page }) => {
  41 |     // Run a demo job
  42 |     await page.getByRole("button", { name: /Run Demo Job/i }).click();
  43 | 
  44 |     // Wait for completion
  45 |     await page.locator("text=completed").first().waitFor({ state: "visible", timeout: 10_000 });
  46 | 
  47 |     // Job table should have at least one row
  48 |     const rows = page.locator("table tbody tr");
  49 |     await expect(rows.first()).toBeVisible();
  50 | 
  51 |     // Table headers should exist
  52 |     const headers = page.locator("table thead th");
  53 |     await expect(headers).toHaveCount(4); // ID, Type, Status, Progress
  54 |   });
  55 | 
  56 |   test("multiple demo jobs queue correctly", async ({ page }) => {
  57 |     // Run two demo jobs
  58 |     await page.getByRole("button", { name: /Run Demo Job/i }).click();
> 59 |     await page.locator("text=completed").first().waitFor({ state: "visible", timeout: 10_000 });
     |                                                  ^ TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
  60 | 
  61 |     await page.getByRole("button", { name: /Run Demo Job/i }).click();
  62 |     await page.locator("text=completed").first().waitFor({ state: "visible", timeout: 10_000 });
  63 | 
  64 |     // Should have at least 2 rows in job table
  65 |     const rows = page.locator("table tbody tr");
  66 |     const count = await rows.count();
  67 |     expect(count).toBeGreaterThanOrEqual(2);
  68 |   });
  69 | });
  70 | 
```