# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: projects.spec.ts >> Projects >> project list has at least one project row
- Location: e2e/projects.spec.ts:22:3

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
    - button "Projects" [active] [ref=e8] [cursor=pointer]
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
    - generic [ref=e20]: Loading projects...
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { navigateTo, waitForPageLoad } from "./helpers";
  3   | 
  4   | test.describe("Projects", () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto("/");
  7   |     await page.locator("nav button").filter({ hasText: "Projects" }).waitFor({ state: "visible" });
  8   |     await navigateTo(page, "Projects");
  9   |     await waitForPageLoad(page);
  10  |   });
  11  | 
  12  |   test("project list shows table with correct headers", async ({ page }) => {
  13  |     const table = page.locator("table").first();
  14  |     await expect(table).toBeVisible();
  15  | 
  16  |     const expectedHeaders = ["Series", "Category", "Episodes", "Scaffolded", "Gate Score", "Plan"];
  17  |     for (const h of expectedHeaders) {
  18  |       await expect(table.locator("th", { hasText: h })).toBeVisible();
  19  |     }
  20  |   });
  21  | 
  22  |   test("project list has at least one project row", async ({ page }) => {
  23  |     const rows = page.locator("table").first().locator("tbody tr");
  24  |     const count = await rows.count();
> 25  |     expect(count).toBeGreaterThanOrEqual(1);
      |                   ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  26  |   });
  27  | 
  28  |   test("+ New Episode button exists", async ({ page }) => {
  29  |     await expect(page.getByRole("button", { name: "+ New Episode" })).toBeVisible();
  30  |   });
  31  | 
  32  |   test("clicking project row opens detail view", async ({ page }) => {
  33  |     const firstRow = page.locator("table").first().locator("tbody tr").first();
  34  |     const projectName = await firstRow.locator("td").first().textContent();
  35  |     await firstRow.click();
  36  | 
  37  |     // Should show back button and project name
  38  |     await expect(page.getByText("← Back")).toBeVisible();
  39  |     await expect(page.getByText(projectName!)).toBeVisible();
  40  | 
  41  |     // Should show category and episodes metadata
  42  |     await expect(page.getByText(/Category:/)).toBeVisible();
  43  |     await expect(page.getByText(/Episodes:/)).toBeVisible();
  44  |   });
  45  | 
  46  |   test("back button returns to list view", async ({ page }) => {
  47  |     // Navigate into detail
  48  |     const firstRow = page.locator("table").first().locator("tbody tr").first();
  49  |     await firstRow.click();
  50  |     await expect(page.getByText("← Back")).toBeVisible();
  51  | 
  52  |     // Click back
  53  |     await page.getByText("← Back").click();
  54  | 
  55  |     // Should see project list table again
  56  |     const table = page.locator("table").first();
  57  |     await expect(table).toBeVisible();
  58  |     await expect(table.locator("th", { hasText: "Series" })).toBeVisible();
  59  |   });
  60  | 
  61  |   test("detail view shows episode table", async ({ page }) => {
  62  |     const firstRow = page.locator("table").first().locator("tbody tr").first();
  63  |     await firstRow.click();
  64  | 
  65  |     // Either episode table renders, or we see "No episodes found"
  66  |     const epTable = page.locator("table").last().locator("th", { hasText: "Episode" });
  67  |     const noEpisodes = page.getByText("No episodes found");
  68  | 
  69  |     const hasTable = await epTable.isVisible().catch(() => false);
  70  |     const hasNone = await noEpisodes.isVisible().catch(() => false);
  71  |     expect(hasTable || hasNone).toBe(true);
  72  |   });
  73  | 
  74  |   test("Ask Advisor button toggles advisor panel", async ({ page }) => {
  75  |     const firstRow = page.locator("table").first().locator("tbody tr").first();
  76  |     await firstRow.click();
  77  | 
  78  |     // Click Ask Advisor
  79  |     const advisorBtn = page.getByRole("button", { name: /Ask Advisor|Hide Advisor/i });
  80  |     await expect(advisorBtn).toBeVisible();
  81  |     await advisorBtn.click();
  82  | 
  83  |     // Button should toggle to "Hide Advisor"
  84  |     await expect(page.getByRole("button", { name: "Hide Advisor" })).toBeVisible({ timeout: 3_000 });
  85  | 
  86  |     // Some advisor UI should appear (input or heading)
  87  |     const advisorUI = page.locator("main").getByText(/Advisor|advisor/i);
  88  |     await expect(advisorUI.first()).toBeVisible({ timeout: 3_000 });
  89  | 
  90  |     // Click Hide Advisor
  91  |     await page.getByRole("button", { name: "Hide Advisor" }).click();
  92  | 
  93  |     // Button should toggle back
  94  |     await expect(page.getByRole("button", { name: "Ask Advisor" })).toBeVisible({ timeout: 2_000 });
  95  |   });
  96  | 
  97  |   test("Build button exists in episode rows", async ({ page }) => {
  98  |     const firstRow = page.locator("table").first().locator("tbody tr").first();
  99  |     await firstRow.click();
  100 | 
  101 |     // Episode table should have Build buttons
  102 |     const buildButtons = page.getByRole("button", { name: "Build" });
  103 |     const count = await buildButtons.count();
  104 |     // At least one episode should exist
  105 |     expect(count).toBeGreaterThanOrEqual(0);
  106 |   });
  107 | 
  108 |   test("+ New Episode opens create form", async ({ page }) => {
  109 |     await page.getByRole("button", { name: "+ New Episode" }).click();
  110 | 
  111 |     // Should show back button
  112 |     await expect(page.getByText(/Back/i)).toBeVisible();
  113 | 
  114 |     // Should show series dropdown
  115 |     const select = page.locator("select").first();
  116 |     await expect(select).toBeVisible();
  117 |   });
  118 | 
  119 |   test("back from create form returns to project list", async ({ page }) => {
  120 |     await page.getByRole("button", { name: "+ New Episode" }).click();
  121 |     await expect(page.getByText(/Back/i)).toBeVisible();
  122 | 
  123 |     await page.getByText(/Back/i).click();
  124 | 
  125 |     // Should be back at project list
```