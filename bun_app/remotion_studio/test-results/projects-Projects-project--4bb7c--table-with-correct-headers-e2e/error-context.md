# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: projects.spec.ts >> Projects >> project list shows table with correct headers
- Location: e2e/projects.spec.ts:12:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('table').first().locator('th').filter({ hasText: 'Gate Score' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('table').first().locator('th').filter({ hasText: 'Gate Score' })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - heading "Remotion Studio" [level=2] [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]: Overview
      - button "■ Dashboard" [ref=e8] [cursor=pointer]:
        - generic [ref=e9]: ■
        - text: Dashboard
      - button "● Monitoring" [ref=e10] [cursor=pointer]:
        - generic [ref=e11]: ●
        - text: Monitoring
      - button "▣ Progress" [ref=e12] [cursor=pointer]:
        - generic [ref=e13]: ▣
        - text: Progress
      - button "▦ Kanban" [ref=e14] [cursor=pointer]:
        - generic [ref=e15]: ▦
        - text: Kanban
    - generic [ref=e16]:
      - generic [ref=e17]: Production
      - button "📁 Projects" [active] [ref=e18] [cursor=pointer]:
        - generic [ref=e19]: 📁
        - text: Projects
      - button "✍ Story Editor" [ref=e20] [cursor=pointer]:
        - generic [ref=e21]: ✍
        - text: Story Editor
      - button "⚙ Workflows" [ref=e22] [cursor=pointer]:
        - generic [ref=e23]: ⚙
        - text: Workflows
    - generic [ref=e24]:
      - generic [ref=e25]: Analysis
      - button "🕸 Storygraph" [ref=e26] [cursor=pointer]:
        - generic [ref=e27]: 🕸
        - text: Storygraph
      - button "✔ Quality" [ref=e28] [cursor=pointer]:
        - generic [ref=e29]: ✔
        - text: Quality
      - button "📊 Benchmark" [ref=e30] [cursor=pointer]:
        - generic [ref=e31]: 📊
        - text: Benchmark
    - generic [ref=e32]:
      - generic [ref=e33]: AI
      - button "🤖 Agent Chat" [ref=e34] [cursor=pointer]:
        - generic [ref=e35]: 🤖
        - text: Agent Chat
    - generic [ref=e36]:
      - generic [ref=e37]: Assets
      - button "🖼 Assets" [ref=e38] [cursor=pointer]:
        - generic [ref=e39]: 🖼
        - text: Assets
      - button "🔊 TTS" [ref=e40] [cursor=pointer]:
        - generic [ref=e41]: 🔊
        - text: TTS
      - button "▶ Render" [ref=e42] [cursor=pointer]:
        - generic [ref=e43]: ▶
        - text: Render
      - button "🎨 Image" [ref=e44] [cursor=pointer]:
        - generic [ref=e45]: 🎨
        - text: Image
    - generic [ref=e46]:
      - button "◐" [ref=e47] [cursor=pointer]
      - button "中" [ref=e48] [cursor=pointer]
  - main [ref=e49]:
    - generic [ref=e50]:
      - generic [ref=e51]:
        - generic [ref=e52]:
          - heading "Projects (5)" [level=1] [ref=e54]
          - paragraph [ref=e55]: Manage series and episodes
        - button "+ New Episode" [ref=e56] [cursor=pointer]
      - table [ref=e57]:
        - rowgroup [ref=e58]:
          - row "Series Category Episodes Scaffolded Gate Plan" [ref=e59]:
            - columnheader "Series" [ref=e60]
            - columnheader "Category" [ref=e61]
            - columnheader "Episodes" [ref=e62]
            - columnheader "Scaffolded" [ref=e63]
            - columnheader "Gate" [ref=e64]
            - columnheader "Plan" [ref=e65]
        - rowgroup [ref=e66]:
          - row "Galgame Meme Theater Galgame VN 7 7 100/100 Yes" [ref=e67] [cursor=pointer]:
            - cell "Galgame Meme Theater" [ref=e68]
            - cell "Galgame VN" [ref=e69]
            - cell "7" [ref=e70]
            - cell "7" [ref=e71]
            - cell "100/100" [ref=e72]:
              - generic [ref=e73]: 100/100
            - cell "Yes" [ref=e74]
          - row "My Core Is Boss Narrative Drama 12 12 100/100 Yes" [ref=e75] [cursor=pointer]:
            - cell "My Core Is Boss" [ref=e76]
            - cell "Narrative Drama" [ref=e77]
            - cell "12" [ref=e78]
            - cell "12" [ref=e79]
            - cell "100/100" [ref=e80]:
              - generic [ref=e81]: 100/100
            - cell "Yes" [ref=e82]
          - row "Storygraph Explainer Tech Explainer 3 0 100/100 Yes" [ref=e83] [cursor=pointer]:
            - cell "Storygraph Explainer" [ref=e84]
            - cell "Tech Explainer" [ref=e85]
            - cell "3" [ref=e86]
            - cell "0" [ref=e87]
            - cell "100/100" [ref=e88]:
              - generic [ref=e89]: 100/100
            - cell "Yes" [ref=e90]
          - row "Weapon Forger Narrative Drama 8 8 70/100 Yes" [ref=e91] [cursor=pointer]:
            - cell "Weapon Forger" [ref=e92]
            - cell "Narrative Drama" [ref=e93]
            - cell "8" [ref=e94]
            - cell "8" [ref=e95]
            - cell "70/100" [ref=e96]:
              - generic [ref=e97]: 70/100
            - cell "Yes" [ref=e98]
          - row "Xianxia System Meme Narrative Drama 0 0 100/100 —" [ref=e99] [cursor=pointer]:
            - cell "Xianxia System Meme" [ref=e100]
            - cell "Narrative Drama" [ref=e101]
            - cell "0" [ref=e102]
            - cell "0" [ref=e103]
            - cell "100/100" [ref=e104]:
              - generic [ref=e105]: 100/100
            - cell "—" [ref=e106]
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
> 18  |       await expect(table.locator("th", { hasText: h })).toBeVisible();
      |                                                         ^ Error: expect(locator).toBeVisible() failed
  19  |     }
  20  |   });
  21  | 
  22  |   test("project list has at least one project row", async ({ page }) => {
  23  |     const rows = page.locator("table").first().locator("tbody tr");
  24  |     const count = await rows.count();
  25  |     expect(count).toBeGreaterThanOrEqual(1);
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
```