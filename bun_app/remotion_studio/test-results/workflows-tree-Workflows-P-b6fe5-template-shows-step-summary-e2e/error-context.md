# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflows-tree.spec.ts >> Workflows Page >> selecting template shows step summary
- Location: e2e/workflows-tree.spec.ts:29:3

# Error details

```
Test timeout of 15000ms exceeded.
```

```
Error: locator.getAttribute: Test timeout of 15000ms exceeded.
Call log:
  - waiting for locator('select').first().locator('option').nth(1)

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
  2  | import { navigateTo, waitForPageLoad } from "./helpers";
  3  | 
  4  | test.describe("Workflows Page", () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto("/");
  7  |     await page.locator("nav button").filter({ hasText: "Workflows" }).waitFor({ state: "visible" });
  8  |     await navigateTo(page, "Workflows");
  9  |     await waitForPageLoad(page);
  10 |   });
  11 | 
  12 |   test("page renders with template selector", async ({ page }) => {
  13 |     const main = page.locator("main");
  14 |     await expect(main).toBeVisible();
  15 |     const heading = page.getByRole("heading", { name: "Workflows" });
  16 |     await expect(heading).toBeVisible();
  17 |     const select = page.locator("select").first();
  18 |     await expect(select).toBeVisible();
  19 |   });
  20 | 
  21 |   test("template selector has options after loading", async ({ page }) => {
  22 |     const select = page.locator("select").first();
  23 |     await select.waitFor({ state: "visible" });
  24 |     // Should have at least a default option
  25 |     const options = await select.locator("option").count();
  26 |     expect(options).toBeGreaterThanOrEqual(1);
  27 |   });
  28 | 
  29 |   test("selecting template shows step summary", async ({ page }) => {
  30 |     const select = page.locator("select").first();
> 31 |     const firstOption = await select.locator("option").nth(1).getAttribute("value");
     |                                                               ^ Error: locator.getAttribute: Test timeout of 15000ms exceeded.
  32 |     if (!firstOption) return; // No templates loaded (API unavailable)
  33 |     await select.selectOption(firstOption);
  34 |     // Should show step info
  35 |     const stepInfo = page.getByText("Steps:");
  36 |     await expect(stepInfo).toBeVisible({ timeout: 2000 });
  37 |   });
  38 | 
  39 |   test("Run Workflow button exists and is disabled without template", async ({ page }) => {
  40 |     const btn = page.getByRole("button", { name: /Run Workflow/i });
  41 |     // Button only appears after template selection
  42 |     const btnVisible = await btn.isVisible().catch(() => false);
  43 |     if (btnVisible) {
  44 |       await expect(btn).toBeDisabled();
  45 |     }
  46 |   });
  47 | 
  48 |   test("no console errors on load", async ({ page }) => {
  49 |     const errors: string[] = [];
  50 |     page.on("console", (msg) => {
  51 |       if (msg.type() === "error") errors.push(msg.text());
  52 |     });
  53 |     await page.reload();
  54 |     await waitForPageLoad(page);
  55 |     const filtered = errors.filter(
  56 |       (e) => !e.includes("favicon.ico") && !e.includes("devtools"),
  57 |     );
  58 |     expect(filtered).toEqual([]);
  59 |   });
  60 | });
  61 | 
  62 | test.describe("Workflows Tree View", () => {
  63 |   test.beforeEach(async ({ page }) => {
  64 |     await page.goto("/");
  65 |     await navigateTo(page, "Workflows");
  66 |     await waitForPageLoad(page);
  67 |   });
  68 | 
  69 |   test("tree view section appears with Task Tree heading after workflow with tree", async ({ page }) => {
  70 |     // If there's a previously run job with a tree, the section should show
  71 |     // Otherwise, verify the page doesn't crash when tree is absent
  72 |     const main = page.locator("main");
  73 |     await expect(main).toBeVisible();
  74 | 
  75 |     // Tree heading only appears when tree data exists
  76 |     const treeHeading = page.getByText("Task Tree");
  77 |     const treeVisible = await treeHeading.isVisible().catch(() => false);
  78 |     // Just verify the page is stable regardless
  79 |     expect(await main.textContent()).toBeTruthy();
  80 |   });
  81 | 
  82 |   test("flat step list shows when no tree is available", async ({ page }) => {
  83 |     // Without running a workflow, no step list should appear
  84 |     const stepsHeading = page.getByText("Steps");
  85 |     const stepsVisible = await stepsHeading.isVisible().catch(() => false);
  86 |     // Steps only appear after running a workflow
  87 |     expect(typeof stepsVisible).toBe("boolean");
  88 |   });
  89 | });
  90 | 
```