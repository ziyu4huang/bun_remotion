# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: projects.spec.ts >> Projects >> Ask Advisor button toggles advisor panel
- Location: e2e/projects.spec.ts:74:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Hide Advisor' })
Expected: visible
Timeout: 3000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 3000ms
  - waiting for getByRole('button', { name: 'Hide Advisor' })

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
      - button "📁 Projects" [ref=e18] [cursor=pointer]:
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
          - button "← Back" [ref=e53] [cursor=pointer]
          - generic [ref=e54]:
            - heading "Galgame Meme Theater" [level=1] [ref=e56]
            - paragraph [ref=e57]: galgame_vn
          - button "+ New Episode" [ref=e58] [cursor=pointer]
          - button "Hide" [active] [ref=e59] [cursor=pointer]
        - generic [ref=e60]:
          - generic [ref=e61]: "Category: Galgame VN"
          - generic [ref=e62]: "Episodes: 7"
          - generic [ref=e63]:
            - text: "Gate:"
            - generic [ref=e64]: 100/100
          - generic [ref=e65]: "Plan: Yes"
        - table [ref=e66]:
          - rowgroup [ref=e67]:
            - row "Episode Ch Ep Scaffold TTS Render Gate Build" [ref=e68]:
              - columnheader "Episode" [ref=e69]
              - columnheader "Ch" [ref=e70]
              - columnheader "Ep" [ref=e71]
              - columnheader "Scaffold" [ref=e72]
              - columnheader "TTS" [ref=e73]
              - columnheader "Render" [ref=e74]
              - columnheader "Gate" [ref=e75]
              - columnheader "Build" [ref=e76]
          - rowgroup [ref=e77]:
            - row "galgame-meme-theater-ep1 — 1 Yes — Yes — Build" [ref=e78]:
              - cell "galgame-meme-theater-ep1" [ref=e79]
              - cell "—" [ref=e80]
              - cell "1" [ref=e81]
              - cell "Yes" [ref=e82]
              - cell "—" [ref=e83]
              - cell "Yes" [ref=e84]
              - cell "—" [ref=e85]
              - cell "Build" [ref=e86]:
                - button "Build" [ref=e87] [cursor=pointer]
            - row "galgame-meme-theater-ep2 — 2 Yes — Yes — Build" [ref=e88]:
              - cell "galgame-meme-theater-ep2" [ref=e89]
              - cell "—" [ref=e90]
              - cell "2" [ref=e91]
              - cell "Yes" [ref=e92]
              - cell "—" [ref=e93]
              - cell "Yes" [ref=e94]
              - cell "—" [ref=e95]
              - cell "Build" [ref=e96]:
                - button "Build" [ref=e97] [cursor=pointer]
            - row "galgame-meme-theater-ep3 — 3 Yes — Yes — Build" [ref=e98]:
              - cell "galgame-meme-theater-ep3" [ref=e99]
              - cell "—" [ref=e100]
              - cell "3" [ref=e101]
              - cell "Yes" [ref=e102]
              - cell "—" [ref=e103]
              - cell "Yes" [ref=e104]
              - cell "—" [ref=e105]
              - cell "Build" [ref=e106]:
                - button "Build" [ref=e107] [cursor=pointer]
            - row "galgame-meme-theater-ep4 — 4 Yes — Yes — Build" [ref=e108]:
              - cell "galgame-meme-theater-ep4" [ref=e109]
              - cell "—" [ref=e110]
              - cell "4" [ref=e111]
              - cell "Yes" [ref=e112]
              - cell "—" [ref=e113]
              - cell "Yes" [ref=e114]
              - cell "—" [ref=e115]
              - cell "Build" [ref=e116]:
                - button "Build" [ref=e117] [cursor=pointer]
            - row "galgame-meme-theater-ep5 — 5 Yes — Yes — Build" [ref=e118]:
              - cell "galgame-meme-theater-ep5" [ref=e119]
              - cell "—" [ref=e120]
              - cell "5" [ref=e121]
              - cell "Yes" [ref=e122]
              - cell "—" [ref=e123]
              - cell "Yes" [ref=e124]
              - cell "—" [ref=e125]
              - cell "Build" [ref=e126]:
                - button "Build" [ref=e127] [cursor=pointer]
            - row "galgame-meme-theater-ep6 — 6 Yes — Yes — Build" [ref=e128]:
              - cell "galgame-meme-theater-ep6" [ref=e129]
              - cell "—" [ref=e130]
              - cell "6" [ref=e131]
              - cell "Yes" [ref=e132]
              - cell "—" [ref=e133]
              - cell "Yes" [ref=e134]
              - cell "—" [ref=e135]
              - cell "Build" [ref=e136]:
                - button "Build" [ref=e137] [cursor=pointer]
            - row "galgame-meme-theater-ep7 — 7 Yes — Yes — Build" [ref=e138]:
              - cell "galgame-meme-theater-ep7" [ref=e139]
              - cell "—" [ref=e140]
              - cell "7" [ref=e141]
              - cell "Yes" [ref=e142]
              - cell "—" [ref=e143]
              - cell "Yes" [ref=e144]
              - cell "—" [ref=e145]
              - cell "Build" [ref=e146]:
                - button "Build" [ref=e147] [cursor=pointer]
        - button "Review Checklist (7 episodes) ▼" [ref=e149] [cursor=pointer]:
          - generic [ref=e150]: Review Checklist (7 episodes)
          - generic [ref=e151]: ▼
      - generic [ref=e152]:
        - generic [ref=e154]:
          - heading "Story Advisor" [level=3] [ref=e155]
          - generic [ref=e156]: studio-advisor · Galgame Meme Theater
        - generic [ref=e158]: Ask about story, characters, pacing, or suggestions for this series
        - generic [ref=e160]:
          - textbox "Ask about story, characters, pacing, or suggestions for this series" [ref=e161]
          - button "Ask" [disabled] [ref=e162] [cursor=pointer]
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
> 84  |     await expect(page.getByRole("button", { name: "Hide Advisor" })).toBeVisible({ timeout: 3_000 });
      |                                                                      ^ Error: expect(locator).toBeVisible() failed
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
  126 |     const table = page.locator("table").first();
  127 |     await expect(table).toBeVisible();
  128 |     await expect(table.locator("th", { hasText: "Series" })).toBeVisible();
  129 |   });
  130 | });
  131 | 
```