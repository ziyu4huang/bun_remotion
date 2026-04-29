# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empty-states.spec.ts >> Empty States >> Assets shows empty state when no series
- Location: e2e/empty-states.spec.ts:46:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Assets|素材/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /Assets|素材/i })

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
      - button "🖼 Assets" [active] [ref=e38] [cursor=pointer]:
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
    - generic [ref=e51]:
      - generic [ref=e52]: "!"
      - heading "Something went wrong" [level=3] [ref=e53]
      - paragraph [ref=e54]: "Minified React error #310; visit https://reactjs.org/docs/error-decoder.html?invariant=310 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
      - button "Reload Page" [ref=e55] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { navigateTo, waitForPageLoad } from "./helpers";
  3   | 
  4   | test.describe("Empty States", () => {
  5   |   test("PipelineProgress shows empty state when no episodes", async ({ page }) => {
  6   |     await page.route("**/api/episode-progress**", (route) =>
  7   |       route.fulfill({
  8   |         status: 200,
  9   |         contentType: "application/json",
  10  |         body: JSON.stringify({
  11  |           ok: true,
  12  |           data: {
  13  |             episodes: [],
  14  |             summary: { totalEpisodes: 0, completedEpisodes: 0, avgCompletion: 0, byStep: {} },
  15  |           },
  16  |         }),
  17  |       }),
  18  |     );
  19  |     await page.goto("/");
  20  |     await navigateTo(page, "Progress");
  21  |     await waitForPageLoad(page);
  22  | 
  23  |     // Should show empty state or zero counts
  24  |     const zeroText = page.getByText(/0 episode|0 集|No episodes|找不到集數/i);
  25  |     const summaryVisible = await zeroText.isVisible().catch(() => false);
  26  |     // Page should render without crash
  27  |     await expect(page.getByRole("heading", { name: /Progress|進度/i })).toBeVisible();
  28  |   });
  29  | 
  30  |   test("Projects shows empty state when no projects", async ({ page }) => {
  31  |     await page.route("**/api/projects**", (route) =>
  32  |       route.fulfill({
  33  |         status: 200,
  34  |         contentType: "application/json",
  35  |         body: JSON.stringify({ ok: true, data: [] }),
  36  |       }),
  37  |     );
  38  |     await page.goto("/");
  39  |     await navigateTo(page, "Projects");
  40  |     await waitForPageLoad(page);
  41  | 
  42  |     // Page should render without crash even with empty data
  43  |     await expect(page.getByRole("heading", { name: /Projects|專案/i })).toBeVisible();
  44  |   });
  45  | 
  46  |   test("Assets shows empty state when no series", async ({ page }) => {
  47  |     await page.route("**/api/assets**", (route) =>
  48  |       route.fulfill({
  49  |         status: 200,
  50  |         contentType: "application/json",
  51  |         body: JSON.stringify({ ok: true, data: { series: [] } }),
  52  |       }),
  53  |     );
  54  |     await page.goto("/");
  55  |     await navigateTo(page, "Assets");
  56  |     await waitForPageLoad(page);
  57  | 
  58  |     // Should show empty state or prompt
> 59  |     await expect(page.getByRole("heading", { name: /Assets|素材/i })).toBeVisible();
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
  60  |   });
  61  | 
  62  |   test("Kanban shows empty state when no episodes", async ({ page }) => {
  63  |     await page.route("**/api/episode-progress**", (route) =>
  64  |       route.fulfill({
  65  |         status: 200,
  66  |         contentType: "application/json",
  67  |         body: JSON.stringify({
  68  |           ok: true,
  69  |           data: {
  70  |             episodes: [],
  71  |             summary: { totalEpisodes: 0, completedEpisodes: 0, avgCompletion: 0, byStep: {} },
  72  |           },
  73  |         }),
  74  |       }),
  75  |     );
  76  |     await page.goto("/");
  77  |     await navigateTo(page, "Kanban");
  78  |     await waitForPageLoad(page);
  79  | 
  80  |     // Should show empty state
  81  |     await expect(page.getByRole("heading", { name: /Kanban|看板/i })).toBeVisible();
  82  |   });
  83  | 
  84  |   test("TTS shows empty state when no episodes scaffolded", async ({ page }) => {
  85  |     await page.route("**/api/projects**", (route) =>
  86  |       route.fulfill({
  87  |         status: 200,
  88  |         contentType: "application/json",
  89  |         body: JSON.stringify({ ok: true, data: [{ seriesId: "test", name: "Test", category: "tech_explainer", episodes: [] }] }),
  90  |       }),
  91  |     );
  92  |     await page.goto("/");
  93  |     await navigateTo(page, "TTS");
  94  |     await waitForPageLoad(page);
  95  | 
  96  |     // Should show select prompt
  97  |     await expect(page.getByRole("heading", { name: /TTS|語音/i })).toBeVisible();
  98  |   });
  99  | });
  100 | 
```