# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kanban.spec.ts >> Episode Kanban >> series filter dropdown exists
- Location: e2e/kanban.spec.ts:27:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('select').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('select').first()

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
      - button "▦ Kanban" [active] [ref=e14] [cursor=pointer]:
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
        - heading "Kanban Board" [level=1] [ref=e53]
        - paragraph [ref=e54]: Episode pipeline status at a glance
      - generic [ref=e55]:
        - button "All (30)" [ref=e56] [cursor=pointer]
        - button "galgame-meme-theater (7)" [ref=e57] [cursor=pointer]
        - button "my-core-is-boss (12)" [ref=e58] [cursor=pointer]
        - button "storygraph-explainer (3)" [ref=e59] [cursor=pointer]
        - button "weapon-forger (8)" [ref=e60] [cursor=pointer]
        - button "Refresh" [ref=e61] [cursor=pointer]
      - generic [ref=e62]:
        - generic [ref=e63]:
          - generic [ref=e64]:
            - generic [ref=e65]: Scaffold
            - generic [ref=e66]: 3 Waiting
          - generic [ref=e67]:
            - generic [ref=e68]:
              - generic [ref=e69]:
                - generic [ref=e70]: Ch1-Ep1
                - generic [ref=e71]: Waiting
              - generic [ref=e72]: Storygraph Explainer
            - generic [ref=e81]:
              - generic [ref=e82]:
                - generic [ref=e83]: Ch1-Ep2
                - generic [ref=e84]: Waiting
              - generic [ref=e85]: Storygraph Explainer
            - generic [ref=e94]:
              - generic [ref=e95]:
                - generic [ref=e96]: Ch1-Ep3
                - generic [ref=e97]: Waiting
              - generic [ref=e98]: Storygraph Explainer
        - generic [ref=e107]:
          - generic [ref=e108]:
            - generic [ref=e109]: KG
            - generic [ref=e110]: 27 Waiting
          - generic [ref=e111]:
            - generic [ref=e112]:
              - generic [ref=e113]:
                - generic [ref=e114]: Ep1
                - generic [ref=e115]: Waiting
              - generic [ref=e116]: Galgame Meme Theater
            - generic [ref=e125]:
              - generic [ref=e126]:
                - generic [ref=e127]: Ep2
                - generic [ref=e128]: Waiting
              - generic [ref=e129]: Galgame Meme Theater
            - generic [ref=e138]:
              - generic [ref=e139]:
                - generic [ref=e140]: Ep3
                - generic [ref=e141]: Waiting
              - generic [ref=e142]: Galgame Meme Theater
            - generic [ref=e151]:
              - generic [ref=e152]:
                - generic [ref=e153]: Ep4
                - generic [ref=e154]: Waiting
              - generic [ref=e155]: Galgame Meme Theater
            - generic [ref=e164]:
              - generic [ref=e165]:
                - generic [ref=e166]: Ep5
                - generic [ref=e167]: Waiting
              - generic [ref=e168]: Galgame Meme Theater
            - generic [ref=e177]:
              - generic [ref=e178]:
                - generic [ref=e179]: Ep6
                - generic [ref=e180]: Waiting
              - generic [ref=e181]: Galgame Meme Theater
            - generic [ref=e190]:
              - generic [ref=e191]:
                - generic [ref=e192]: Ep7
                - generic [ref=e193]: Waiting
              - generic [ref=e194]: Galgame Meme Theater
            - generic [ref=e203]:
              - generic [ref=e204]:
                - generic [ref=e205]: Ch1-Ep1
                - generic [ref=e206]: Waiting
              - generic [ref=e207]: My Core Is Boss
            - generic [ref=e216]:
              - generic [ref=e217]:
                - generic [ref=e218]: Ch1-Ep2
                - generic [ref=e219]: Waiting
              - generic [ref=e220]: My Core Is Boss
            - generic [ref=e229]:
              - generic [ref=e230]:
                - generic [ref=e231]: Ch1-Ep3
                - generic [ref=e232]: Waiting
              - generic [ref=e233]: My Core Is Boss
            - generic [ref=e242]:
              - generic [ref=e243]:
                - generic [ref=e244]: Ch2-Ep1
                - generic [ref=e245]: Waiting
              - generic [ref=e246]: My Core Is Boss
            - generic [ref=e255]:
              - generic [ref=e256]:
                - generic [ref=e257]: Ch2-Ep2
                - generic [ref=e258]: Waiting
              - generic [ref=e259]: My Core Is Boss
            - generic [ref=e268]:
              - generic [ref=e269]:
                - generic [ref=e270]: Ch2-Ep3
                - generic [ref=e271]: Waiting
              - generic [ref=e272]: My Core Is Boss
            - generic [ref=e281]:
              - generic [ref=e282]:
                - generic [ref=e283]: Ch3-Ep1
                - generic [ref=e284]: Waiting
              - generic [ref=e285]: My Core Is Boss
            - generic [ref=e294]:
              - generic [ref=e295]:
                - generic [ref=e296]: Ch3-Ep2
                - generic [ref=e297]: Waiting
              - generic [ref=e298]: My Core Is Boss
            - generic [ref=e307]:
              - generic [ref=e308]:
                - generic [ref=e309]: Ch3-Ep3
                - generic [ref=e310]: Waiting
              - generic [ref=e311]: My Core Is Boss
            - generic [ref=e320]:
              - generic [ref=e321]:
                - generic [ref=e322]: Ch3-Ep4
                - generic [ref=e323]: Waiting
              - generic [ref=e324]: My Core Is Boss
            - generic [ref=e333]:
              - generic [ref=e334]:
                - generic [ref=e335]: Ch3-Ep5
                - generic [ref=e336]: Waiting
              - generic [ref=e337]: My Core Is Boss
            - generic [ref=e346]:
              - generic [ref=e347]:
                - generic [ref=e348]: Ch3-Ep6
                - generic [ref=e349]: Waiting
              - generic [ref=e350]: My Core Is Boss
            - generic [ref=e359]:
              - generic [ref=e360]:
                - generic [ref=e361]: Ch1-Ep1
                - generic [ref=e362]: Waiting
              - generic [ref=e363]: Weapon Forger
            - generic [ref=e372]:
              - generic [ref=e373]:
                - generic [ref=e374]: Ch1-Ep2
                - generic [ref=e375]: Waiting
              - generic [ref=e376]: Weapon Forger
            - generic [ref=e385]:
              - generic [ref=e386]:
                - generic [ref=e387]: Ch1-Ep3
                - generic [ref=e388]: Waiting
              - generic [ref=e389]: Weapon Forger
            - generic [ref=e398]:
              - generic [ref=e399]:
                - generic [ref=e400]: Ch2-Ep1
                - generic [ref=e401]: Waiting
              - generic [ref=e402]: Weapon Forger
            - generic [ref=e411]:
              - generic [ref=e412]:
                - generic [ref=e413]: Ch2-Ep2
                - generic [ref=e414]: Waiting
              - generic [ref=e415]: Weapon Forger
            - generic [ref=e424]:
              - generic [ref=e425]:
                - generic [ref=e426]: Ch2-Ep3
                - generic [ref=e427]: Waiting
              - generic [ref=e428]: Weapon Forger
            - generic [ref=e437]:
              - generic [ref=e438]:
                - generic [ref=e439]: Ch3-Ep1
                - generic [ref=e440]: Waiting
              - generic [ref=e441]: Weapon Forger
            - generic [ref=e450]:
              - generic [ref=e451]:
                - generic [ref=e452]: Ch3-Ep2
                - generic [ref=e453]: Waiting
              - generic [ref=e454]: Weapon Forger
        - generic [ref=e463]:
          - generic [ref=e464]:
            - generic [ref=e465]: Check
            - generic [ref=e466]: 0 Waiting
          - generic [ref=e468]: Empty
        - generic [ref=e469]:
          - generic [ref=e470]:
            - generic [ref=e471]: Score
            - generic [ref=e472]: 0 Waiting
          - generic [ref=e474]: Empty
        - generic [ref=e475]:
          - generic [ref=e476]:
            - generic [ref=e477]: Image
            - generic [ref=e478]: 0 Waiting
          - generic [ref=e480]: Empty
        - generic [ref=e481]:
          - generic [ref=e482]:
            - generic [ref=e483]: TTS
            - generic [ref=e484]: 0 Waiting
          - generic [ref=e486]: Empty
        - generic [ref=e487]:
          - generic [ref=e488]:
            - generic [ref=e489]: Render
            - generic [ref=e490]: 0 Waiting
          - generic [ref=e492]: Empty
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { navigateTo, waitForPageLoad, collectConsoleErrors, assertNoConsoleErrors } from "./helpers";
  3  | 
  4  | test.describe("Episode Kanban", () => {
  5  |   let errors: string[];
  6  | 
  7  |   test.beforeEach(async ({ page }) => {
  8  |     errors = collectConsoleErrors(page);
  9  |     await page.goto("/");
  10 |     await navigateTo(page, "Kanban");
  11 |     await waitForPageLoad(page);
  12 |   });
  13 | 
  14 |   test.afterEach(() => assertNoConsoleErrors(errors));
  15 | 
  16 |   test("page loads with heading", async ({ page }) => {
  17 |     await expect(page.getByRole("heading", { name: /Kanban/i })).toBeVisible();
  18 |   });
  19 | 
  20 |   test("shows pipeline stage columns", async ({ page }) => {
  21 |     const columns = ["Scaffold", "KG", "Check", "Score", "Image", "TTS", "Render"];
  22 |     for (const col of columns) {
  23 |       await expect(page.getByText(col, { exact: false }).first()).toBeVisible({ timeout: 3_000 });
  24 |     }
  25 |   });
  26 | 
  27 |   test("series filter dropdown exists", async ({ page }) => {
  28 |     const filterEl = page.locator("select").first();
> 29 |     await expect(filterEl).toBeVisible();
     |                            ^ Error: expect(locator).toBeVisible() failed
  30 |   });
  31 | 
  32 |   test("refresh button exists", async ({ page }) => {
  33 |     const refreshBtn = page.getByRole("button", { name: /refresh|重新整理/i });
  34 |     await expect(refreshBtn).toBeVisible();
  35 |   });
  36 | 
  37 |   test("shows empty state or episode cards", async ({ page }) => {
  38 |     const emptyState = page.getByText(/No episodes found|找不到集數/i);
  39 |     const cardElements = page.locator("[data-kanban-card]");
  40 | 
  41 |     const hasEmpty = await emptyState.isVisible().catch(() => false);
  42 |     const hasCards = await cardElements.count().then((c) => c > 0);
  43 |     expect(hasEmpty || hasCards || true).toBe(true); // Page rendered without crash
  44 |   });
  45 | });
  46 | 
```