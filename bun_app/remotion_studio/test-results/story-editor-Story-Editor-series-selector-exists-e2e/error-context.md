# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: story-editor.spec.ts >> Story Editor >> series selector exists
- Location: e2e/story-editor.spec.ts:17:3

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 1
Received:    0
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - heading "Bun Remotion" [level=2] [ref=e5]
    - button "Dashboard" [ref=e6] [cursor=pointer]
    - button "Monitoring" [ref=e7] [cursor=pointer]
    - button "Projects" [ref=e8] [cursor=pointer]
    - button "Story Editor" [active] [ref=e9] [cursor=pointer]
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
    - generic [ref=e21]:
      - heading "Story Editor" [level=2] [ref=e22]
      - combobox [ref=e23]
      - generic [ref=e24]:
        - button "Sections" [ref=e25] [cursor=pointer]
        - button "Edit" [ref=e26] [cursor=pointer]
        - button "Preview" [ref=e27] [cursor=pointer]
      - button "Save" [disabled] [ref=e29]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { navigateTo, waitForPageLoad } from "./helpers";
  3  | 
  4  | test.describe("Story Editor", () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto("/");
  7  |     await page.locator("nav button").filter({ hasText: "Story Editor" }).waitFor({ state: "visible" });
  8  |     await navigateTo(page, "Story Editor");
  9  |     await waitForPageLoad(page);
  10 |   });
  11 | 
  12 |   test("page shows story editor heading", async ({ page }) => {
  13 |     const heading = page.getByRole("heading", { name: /Story|Editor/i });
  14 |     await expect(heading).toBeVisible();
  15 |   });
  16 | 
  17 |   test("series selector exists", async ({ page }) => {
  18 |     const select = page.locator("select").first();
  19 |     if (await select.isVisible().catch(() => false)) {
  20 |       const options = await select.locator("option").allTextContents();
> 21 |       expect(options.length).toBeGreaterThanOrEqual(1); // At least placeholder
     |                              ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  22 |     }
  23 |   });
  24 | 
  25 |   test("content renders without errors", async ({ page }) => {
  26 |     const main = page.locator("main");
  27 |     await expect(main).toBeVisible();
  28 |     await expect(page.getByText("Something went wrong")).not.toBeVisible();
  29 |   });
  30 | });
  31 | 
```