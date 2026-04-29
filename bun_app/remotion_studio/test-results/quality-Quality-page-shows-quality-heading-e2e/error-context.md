# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quality.spec.ts >> Quality >> page shows quality heading
- Location: e2e/quality.spec.ts:12:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Quality/i })
Expected: visible
Error: strict mode violation: getByRole('heading', { name: /Quality/i }) resolved to 2 elements:
    1) <h1>Quality Dashboard</h1> aka getByRole('heading', { name: 'Quality Dashboard' })
    2) <h3>Ask Quality Agent</h3> aka getByRole('heading', { name: 'Ask Quality Agent' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /Quality/i })

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
      - button "✔ Quality" [active] [ref=e28] [cursor=pointer]:
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
        - heading "Quality Dashboard" [level=1] [ref=e53]
        - paragraph [ref=e54]: Cross-series quality metrics, regression alerts, and gate checks
      - generic [ref=e55]:
        - heading "Ask Quality Agent" [level=3] [ref=e56]
        - paragraph [ref=e57]: The agent analyzes quality data, explains scores, checks regressions, and suggests improvements.
        - generic [ref=e58]:
          - button "How's my overall quality?" [ref=e59] [cursor=pointer]
          - button "Investigate 1 regression(s)" [ref=e60] [cursor=pointer]
      - generic [ref=e61]:
        - strong [ref=e62]: Regression Alerts
        - generic [ref=e63]: "weapon-forger — gate_score: 100 → 70 (-30%)"
      - generic [ref=e64]:
        - button "Cross-Series" [ref=e65] [cursor=pointer]
        - button "Per-Series" [ref=e66] [cursor=pointer]
      - generic [ref=e67]:
        - heading "Cross-Series Comparison" [level=3] [ref=e68]
        - table [ref=e69]:
          - rowgroup [ref=e70]:
            - row "Series Gate Blended Decision Trend Nodes Edges Comm. AI Score Mode Genre" [ref=e71]:
              - columnheader "Series" [ref=e72]
              - columnheader "Gate" [ref=e73]
              - columnheader "Blended" [ref=e74]
              - columnheader "Decision" [ref=e75]
              - columnheader "Trend" [ref=e76]
              - columnheader "Nodes" [ref=e77]
              - columnheader "Edges" [ref=e78]
              - columnheader "Comm." [ref=e79]
              - columnheader "AI Score" [ref=e80]
              - columnheader "Mode" [ref=e81]
              - columnheader "Genre" [ref=e82]
          - rowgroup [ref=e83]:
            - row "storygraph-explainer 100 — PASS → 0 127 0 0 — hybrid generic" [ref=e84] [cursor=pointer]:
              - cell "storygraph-explainer" [ref=e85]
              - cell "100" [ref=e86]
              - cell "—" [ref=e87]
              - cell "PASS" [ref=e88]
              - cell "→ 0" [ref=e89]:
                - generic [ref=e90]: → 0
              - cell "127" [ref=e91]
              - cell "0" [ref=e92]
              - cell "0" [ref=e93]
              - cell "—" [ref=e94]
              - cell "hybrid" [ref=e95]
              - cell "generic" [ref=e96]
            - row "my-core-is-boss 100 74.8% PASS → 0 318 0 0 5.8 hybrid xianxia_comedy" [ref=e97] [cursor=pointer]:
              - cell "my-core-is-boss" [ref=e98]
              - cell "100" [ref=e99]
              - cell "74.8%" [ref=e100]
              - cell "PASS" [ref=e101]
              - cell "→ 0" [ref=e102]:
                - generic [ref=e103]: → 0
              - cell "318" [ref=e104]
              - cell "0" [ref=e105]
              - cell "0" [ref=e106]
              - cell "5.8" [ref=e107]
              - cell "hybrid" [ref=e108]
              - cell "xianxia_comedy" [ref=e109]
            - row "galgame-meme-theater 100 65.2% PASS ↑ +100 35 0 0 4.2 hybrid galgame_meme" [ref=e110] [cursor=pointer]:
              - cell "galgame-meme-theater" [ref=e111]
              - cell "100" [ref=e112]
              - cell "65.2%" [ref=e113]
              - cell "PASS" [ref=e114]
              - cell "↑ +100" [ref=e115]:
                - generic [ref=e116]: ↑ +100
              - cell "35" [ref=e117]
              - cell "0" [ref=e118]
              - cell "0" [ref=e119]
              - cell "4.2" [ref=e120]
              - cell "hybrid" [ref=e121]
              - cell "galgame_meme" [ref=e122]
            - row "weapon-forger 70 65.2% PASS ↓ -15 333 0 0 6.2 hybrid xianxia_comedy" [ref=e123] [cursor=pointer]:
              - cell "weapon-forger" [ref=e124]
              - cell "70" [ref=e125]
              - cell "65.2%" [ref=e126]
              - cell "PASS" [ref=e127]
              - cell "↓ -15" [ref=e128]:
                - generic [ref=e129]: ↓ -15
              - cell "333" [ref=e130]
              - cell "0" [ref=e131]
              - cell "0" [ref=e132]
              - cell "6.2" [ref=e133]
              - cell "hybrid" [ref=e134]
              - cell "xianxia_comedy" [ref=e135]
            - row "xianxia-system-meme 100 78.4% PASS → 0 31 0 0 6.4 hybrid xianxia_comedy" [ref=e136] [cursor=pointer]:
              - cell "xianxia-system-meme" [ref=e137]
              - cell "100" [ref=e138]
              - cell "78.4%" [ref=e139]
              - cell "PASS" [ref=e140]
              - cell "→ 0" [ref=e141]:
                - generic [ref=e142]: → 0
              - cell "31" [ref=e143]
              - cell "0" [ref=e144]
              - cell "0" [ref=e145]
              - cell "6.4" [ref=e146]
              - cell "hybrid" [ref=e147]
              - cell "xianxia_comedy" [ref=e148]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { navigateTo, waitForPageLoad } from "./helpers";
  3  | 
  4  | test.describe("Quality", () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto("/");
  7  |     await page.locator("nav button").filter({ hasText: "Quality" }).waitFor({ state: "visible" });
  8  |     await navigateTo(page, "Quality");
  9  |     await waitForPageLoad(page);
  10 |   });
  11 | 
  12 |   test("page shows quality heading", async ({ page }) => {
  13 |     const heading = page.getByRole("heading", { name: /Quality/i });
> 14 |     await expect(heading).toBeVisible();
     |                           ^ Error: expect(locator).toBeVisible() failed
  15 |   });
  16 | 
  17 |   test("view toggle buttons exist", async ({ page }) => {
  18 |     const overviewBtn = page.getByRole("button", { name: /Cross-Series|Overview/i });
  19 |     const perSeriesBtn = page.getByRole("button", { name: /Per-Series/i });
  20 |     const overviewVisible = await overviewBtn.isVisible().catch(() => false);
  21 |     const perSeriesVisible = await perSeriesBtn.isVisible().catch(() => false);
  22 |     expect(overviewVisible || perSeriesVisible).toBe(true);
  23 |   });
  24 | 
  25 |   test("quality content renders without errors", async ({ page }) => {
  26 |     const main = page.locator("main");
  27 |     await expect(main).toBeVisible();
  28 |     const text = await main.textContent();
  29 |     expect(text!.trim().length).toBeGreaterThan(0);
  30 | 
  31 |     // Should not show generic error
  32 |     await expect(page.getByText("Something went wrong")).not.toBeVisible();
  33 |   });
  34 | });
  35 | 
```