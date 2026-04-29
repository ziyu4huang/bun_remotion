# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: benchmark.spec.ts >> Benchmark >> project selector dropdown exists
- Location: e2e/benchmark.spec.ts:16:3

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
      - button "📊 Benchmark" [active] [ref=e30] [cursor=pointer]:
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
    - generic [ref=e52]: Loading benchmarks...
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { navigateTo, waitForPageLoad } from "./helpers";
  3  | 
  4  | test.describe("Benchmark", () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto("/");
  7  |     await page.locator("nav button").filter({ hasText: "Benchmark" }).waitFor({ state: "visible" });
  8  |     await navigateTo(page, "Benchmark");
  9  |     await waitForPageLoad(page);
  10 |   });
  11 | 
  12 |   test("page shows benchmark heading", async ({ page }) => {
  13 |     await expect(page.getByRole("heading", { name: /Benchmark/i })).toBeVisible();
  14 |   });
  15 | 
  16 |   test("project selector dropdown exists", async ({ page }) => {
  17 |     const select = page.locator("select").first();
> 18 |     await expect(select).toBeVisible();
     |                          ^ Error: expect(locator).toBeVisible() failed
  19 |   });
  20 | 
  21 |   test("mode selector shows options", async ({ page }) => {
  22 |     const selects = page.locator("select");
  23 |     const count = await selects.count();
  24 |     expect(count).toBeGreaterThanOrEqual(2);
  25 | 
  26 |     // Second select should be the mode selector
  27 |     const modeSelect = selects.nth(1);
  28 |     await expect(modeSelect).toBeVisible();
  29 |   });
  30 | 
  31 |   test("threshold input exists with default value", async ({ page }) => {
  32 |     const threshold = page.locator('input[type="number"]');
  33 |     await expect(threshold).toBeVisible();
  34 |     const value = await threshold.inputValue();
  35 |     expect(Number(value)).toBe(10);
  36 |   });
  37 | 
  38 |   test("run buttons are disabled when no project selected", async ({ page }) => {
  39 |     const runBtn = page.getByRole("button", { name: /Run Full Benchmark|Agent Benchmark/i });
  40 |     const regBtn = page.getByRole("button", { name: /Regression Check/i });
  41 | 
  42 |     await expect(runBtn).toBeDisabled();
  43 |     await expect(regBtn).toBeDisabled();
  44 |   });
  45 | 
  46 |   test("baselines table renders with correct headers", async ({ page }) => {
  47 |     // Table should exist
  48 |     const table = page.locator("table").last();
  49 |     await expect(table).toBeVisible();
  50 | 
  51 |     // Check headers
  52 |     const headers = ["Series", "Baseline", "Current", "Delta", "Status", "Actions"];
  53 |     for (const h of headers) {
  54 |       await expect(table.locator("th", { hasText: h })).toBeVisible();
  55 |     }
  56 |   });
  57 | 
  58 |   test("selecting project enables run buttons", async ({ page }) => {
  59 |     const select = page.locator("select").first();
  60 |     const options = await select.locator("option").allTextContents();
  61 |     const projectOptions = options.filter((o) => !o.includes("Select"));
  62 | 
  63 |     if (projectOptions.length === 0) {
  64 |       test.skip();
  65 |       return;
  66 |     }
  67 | 
  68 |     await select.selectOption({ index: 1 });
  69 | 
  70 |     const runBtn = page.getByRole("button", { name: /Run Full Benchmark|Agent Benchmark/i });
  71 |     await expect(runBtn).toBeEnabled();
  72 |   });
  73 | 
  74 |   test("agent mode toggle changes button text", async ({ page }) => {
  75 |     const checkbox = page.locator('input[type="checkbox"]');
  76 |     const label = page.getByText("Agent mode");
  77 | 
  78 |     if (!(await label.isVisible())) {
  79 |       test.skip();
  80 |       return;
  81 |     }
  82 | 
  83 |     // Before toggle
  84 |     await expect(page.getByRole("button", { name: /Run Full Benchmark/i })).toBeVisible();
  85 | 
  86 |     // Toggle agent mode
  87 |     await checkbox.click();
  88 | 
  89 |     // Button text should change
  90 |     await expect(page.getByRole("button", { name: /Agent Benchmark/i })).toBeVisible();
  91 |   });
  92 | });
  93 | 
```