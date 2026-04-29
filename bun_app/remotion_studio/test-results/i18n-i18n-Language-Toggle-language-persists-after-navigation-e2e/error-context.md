# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: i18n.spec.ts >> i18n Language Toggle >> language persists after navigation
- Location: e2e/i18n.spec.ts:53:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button').filter({ hasText: 'En' })
Expected: visible
Error: strict mode violation: locator('button').filter({ hasText: 'En' }) resolved to 2 elements:
    1) <button title="Switch to English">En</button> aka getByRole('button', { name: 'En', exact: true })
    2) <button>Analyze production bottlenecks</button> aka getByRole('button', { name: 'Analyze production bottlenecks' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button').filter({ hasText: 'En' })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - heading "Remotion Studio" [level=2] [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]: 總覽
      - button "■ 儀表板" [ref=e8] [cursor=pointer]:
        - generic [ref=e9]: ■
        - text: 儀表板
      - button "● 監控" [active] [ref=e10] [cursor=pointer]:
        - generic [ref=e11]: ●
        - text: 監控
      - button "▣ 進度" [ref=e12] [cursor=pointer]:
        - generic [ref=e13]: ▣
        - text: 進度
      - button "▦ 看板" [ref=e14] [cursor=pointer]:
        - generic [ref=e15]: ▦
        - text: 看板
    - generic [ref=e16]:
      - generic [ref=e17]: 製作
      - button "📁 專案" [ref=e18] [cursor=pointer]:
        - generic [ref=e19]: 📁
        - text: 專案
      - button "✍ 故事編輯器" [ref=e20] [cursor=pointer]:
        - generic [ref=e21]: ✍
        - text: 故事編輯器
      - button "⚙ 工作流" [ref=e22] [cursor=pointer]:
        - generic [ref=e23]: ⚙
        - text: 工作流
    - generic [ref=e24]:
      - generic [ref=e25]: 分析
      - button "🕸 故事圖譜" [ref=e26] [cursor=pointer]:
        - generic [ref=e27]: 🕸
        - text: 故事圖譜
      - button "✔ 品質" [ref=e28] [cursor=pointer]:
        - generic [ref=e29]: ✔
        - text: 品質
      - button "📊 基準測試" [ref=e30] [cursor=pointer]:
        - generic [ref=e31]: 📊
        - text: 基準測試
    - generic [ref=e32]:
      - generic [ref=e33]: AI
      - button "🤖 AI 對話" [ref=e34] [cursor=pointer]:
        - generic [ref=e35]: 🤖
        - text: AI 對話
    - generic [ref=e36]:
      - generic [ref=e37]: 素材
      - button "🖼 素材庫" [ref=e38] [cursor=pointer]:
        - generic [ref=e39]: 🖼
        - text: 素材庫
      - button "🔊 語音合成" [ref=e40] [cursor=pointer]:
        - generic [ref=e41]: 🔊
        - text: 語音合成
      - button "▶ 渲染" [ref=e42] [cursor=pointer]:
        - generic [ref=e43]: ▶
        - text: 渲染
      - button "🎨 圖片生成" [ref=e44] [cursor=pointer]:
        - generic [ref=e45]: 🎨
        - text: 圖片生成
    - generic [ref=e46]:
      - button "◐" [ref=e47] [cursor=pointer]
      - button "En" [ref=e48] [cursor=pointer]
  - main [ref=e49]:
    - generic [ref=e50]:
      - generic [ref=e51]:
        - heading "監控" [level=1] [ref=e53]
        - paragraph [ref=e54]: 管線健康度、系列進度與最近活動
      - generic [ref=e55]:
        - generic [ref=e56]:
          - generic [ref=e57]: Series
          - generic [ref=e58]: "5"
        - generic [ref=e59]:
          - generic [ref=e60]: Episodes
          - generic [ref=e61]: "30"
        - generic [ref=e62]:
          - generic [ref=e63]: Scaffolded
          - generic [ref=e64]: "27"
        - generic [ref=e65]:
          - generic [ref=e66]: Rendered
          - generic [ref=e67]: "20"
        - generic [ref=e68]:
          - generic [ref=e69]: Completion
          - generic [ref=e70]: 67%
        - generic [ref=e71]:
          - generic [ref=e72]: Avg Gate
          - generic [ref=e73]: 94/100
        - generic [ref=e74]:
          - generic [ref=e75]: Avg Blended
          - generic [ref=e76]: N/A
      - generic [ref=e78]:
        - button "What should I work on next?" [ref=e79] [cursor=pointer]
        - button "Analyze production bottlenecks" [ref=e80] [cursor=pointer]
        - button "Quality summary" [ref=e81] [cursor=pointer]
      - generic [ref=e82]:
        - generic [ref=e83]:
          - heading "系列健康度" [level=3] [ref=e84]
          - generic [ref=e85]:
            - generic [ref=e86]: ↑ 進步中
            - generic [ref=e87]: → 穩定
            - generic [ref=e88]: ↓ 下降中
            - generic [ref=e89]: ★ 新增
        - table [ref=e90]:
          - rowgroup [ref=e91]:
            - row "Series Category Episodes Progress Gate Blended Decision Graph Trend" [ref=e92]:
              - columnheader "Series" [ref=e93]
              - columnheader "Category" [ref=e94]
              - columnheader "Episodes" [ref=e95]
              - columnheader "Progress" [ref=e96]
              - columnheader "Gate" [ref=e97]
              - columnheader "Blended" [ref=e98]
              - columnheader "Decision" [ref=e99]
              - columnheader "Graph" [ref=e100]
              - columnheader "Trend" [ref=e101]
          - rowgroup [ref=e102]:
            - row "Galgame Meme Theater galgame_vn 7/7 100% 100 — PASS 35n/0e/0c ↑ improving" [ref=e103]:
              - cell "Galgame Meme Theater" [ref=e104]
              - cell "galgame_vn" [ref=e105]:
                - generic [ref=e106]: galgame_vn
              - cell "7/7" [ref=e107]
              - cell "100%" [ref=e108]:
                - generic [ref=e112]: 100%
              - cell "100" [ref=e113]
              - cell "—" [ref=e114]
              - cell "PASS" [ref=e115]:
                - generic [ref=e116]: PASS
              - cell "35n/0e/0c" [ref=e117]
              - cell "↑ improving" [ref=e118]:
                - generic [ref=e119]: ↑ improving
            - row "My Core Is Boss narrative_drama 8/12 67% 100 — PASS 318n/0e/0c → stable" [ref=e120]:
              - cell "My Core Is Boss" [ref=e121]
              - cell "narrative_drama" [ref=e122]:
                - generic [ref=e123]: narrative_drama
              - cell "8/12" [ref=e124]
              - cell "67%" [ref=e125]:
                - generic [ref=e129]: 67%
              - cell "100" [ref=e130]
              - cell "—" [ref=e131]
              - cell "PASS" [ref=e132]:
                - generic [ref=e133]: PASS
              - cell "318n/0e/0c" [ref=e134]
              - cell "→ stable" [ref=e135]:
                - generic [ref=e136]: → stable
            - row "Storygraph Explainer tech_explainer 0/3 0% 100 — PASS 127n/0e/0c → stable" [ref=e137]:
              - cell "Storygraph Explainer" [ref=e138]
              - cell "tech_explainer" [ref=e139]:
                - generic [ref=e140]: tech_explainer
              - cell "0/3" [ref=e141]
              - cell "0%" [ref=e142]:
                - generic [ref=e145]: 0%
              - cell "100" [ref=e146]
              - cell "—" [ref=e147]
              - cell "PASS" [ref=e148]:
                - generic [ref=e149]: PASS
              - cell "127n/0e/0c" [ref=e150]
              - cell "→ stable" [ref=e151]:
                - generic [ref=e152]: → stable
            - row "Weapon Forger narrative_drama 5/8 63% 70 — PASS 333n/0e/0c ↓ declining" [ref=e153]:
              - cell "Weapon Forger" [ref=e154]
              - cell "narrative_drama" [ref=e155]:
                - generic [ref=e156]: narrative_drama
              - cell "5/8" [ref=e157]
              - cell "63%" [ref=e158]:
                - generic [ref=e162]: 63%
              - cell "70" [ref=e163]
              - cell "—" [ref=e164]
              - cell "PASS" [ref=e165]:
                - generic [ref=e166]: PASS
              - cell "333n/0e/0c" [ref=e167]
              - cell "↓ declining" [ref=e168]:
                - generic [ref=e169]: ↓ declining
            - row "Xianxia System Meme narrative_drama 0/0 0% 100 — PASS 31n/0e/0c → stable" [ref=e170]:
              - cell "Xianxia System Meme" [ref=e171]
              - cell "narrative_drama" [ref=e172]:
                - generic [ref=e173]: narrative_drama
              - cell "0/0" [ref=e174]
              - cell "0%" [ref=e175]:
                - generic [ref=e178]: 0%
              - cell "100" [ref=e179]
              - cell "—" [ref=e180]
              - cell "PASS" [ref=e181]:
                - generic [ref=e182]: PASS
              - cell "31n/0e/0c" [ref=e183]
              - cell "→ stable" [ref=e184]:
                - generic [ref=e185]: → stable
      - generic [ref=e186]:
        - heading "最近活動" [level=3] [ref=e187]
        - table [ref=e188]:
          - rowgroup [ref=e189]:
            - row "Time Series Type Detail" [ref=e190]:
              - columnheader "Time" [ref=e191]
              - columnheader "Series" [ref=e192]
              - columnheader "Type" [ref=e193]
              - columnheader "Detail" [ref=e194]
          - rowgroup [ref=e195]:
            - row "2026/4/29 下午5:10:41 weapon-forger pipeline Pipeline run (gate 70)" [ref=e196]:
              - cell "2026/4/29 下午5:10:41" [ref=e197]
              - cell "weapon-forger" [ref=e198]
              - cell "pipeline" [ref=e199]
              - cell "Pipeline run (gate 70)" [ref=e200]
            - row "2026/4/29 上午9:03:24 my-core-is-boss pipeline Pipeline run (gate 100)" [ref=e201]:
              - cell "2026/4/29 上午9:03:24" [ref=e202]
              - cell "my-core-is-boss" [ref=e203]
              - cell "pipeline" [ref=e204]
              - cell "Pipeline run (gate 100)" [ref=e205]
            - row "2026/4/29 上午8:29:21 xianxia-system-meme pipeline Pipeline run (gate 100)" [ref=e206]:
              - cell "2026/4/29 上午8:29:21" [ref=e207]
              - cell "xianxia-system-meme" [ref=e208]
              - cell "pipeline" [ref=e209]
              - cell "Pipeline run (gate 100)" [ref=e210]
            - row "2026/4/29 上午8:26:51 galgame-meme-theater pipeline Pipeline run (gate 100)" [ref=e211]:
              - cell "2026/4/29 上午8:26:51" [ref=e212]
              - cell "galgame-meme-theater" [ref=e213]
              - cell "pipeline" [ref=e214]
              - cell "Pipeline run (gate 100)" [ref=e215]
            - row "2026/4/29 上午8:26:45 storygraph-explainer pipeline Pipeline run (gate 100)" [ref=e216]:
              - cell "2026/4/29 上午8:26:45" [ref=e217]
              - cell "storygraph-explainer" [ref=e218]
              - cell "pipeline" [ref=e219]
              - cell "Pipeline run (gate 100)" [ref=e220]
            - row "2026/4/26 下午2:24:02 my-core-is-boss scaffold Scaffolded my-core-is-boss-ch3-ep6" [ref=e221]:
              - cell "2026/4/26 下午2:24:02" [ref=e222]
              - cell "my-core-is-boss" [ref=e223]
              - cell "scaffold" [ref=e224]
              - cell "Scaffolded my-core-is-boss-ch3-ep6" [ref=e225]
            - row "2026/4/26 下午2:15:52 my-core-is-boss scaffold Scaffolded my-core-is-boss-ch3-ep5" [ref=e226]:
              - cell "2026/4/26 下午2:15:52" [ref=e227]
              - cell "my-core-is-boss" [ref=e228]
              - cell "scaffold" [ref=e229]
              - cell "Scaffolded my-core-is-boss-ch3-ep5" [ref=e230]
            - row "2026/4/26 下午2:07:30 my-core-is-boss scaffold Scaffolded my-core-is-boss-ch3-ep4" [ref=e231]:
              - cell "2026/4/26 下午2:07:30" [ref=e232]
              - cell "my-core-is-boss" [ref=e233]
              - cell "scaffold" [ref=e234]
              - cell "Scaffolded my-core-is-boss-ch3-ep4" [ref=e235]
            - row "2026/4/26 下午1:59:06 my-core-is-boss scaffold Scaffolded my-core-is-boss-ch3-ep3" [ref=e236]:
              - cell "2026/4/26 下午1:59:06" [ref=e237]
              - cell "my-core-is-boss" [ref=e238]
              - cell "scaffold" [ref=e239]
              - cell "Scaffolded my-core-is-boss-ch3-ep3" [ref=e240]
            - row "2026/4/26 上午11:21:55 my-core-is-boss scaffold Scaffolded my-core-is-boss-ch3-ep2" [ref=e241]:
              - cell "2026/4/26 上午11:21:55" [ref=e242]
              - cell "my-core-is-boss" [ref=e243]
              - cell "scaffold" [ref=e244]
              - cell "Scaffolded my-core-is-boss-ch3-ep2" [ref=e245]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("i18n Language Toggle", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/");
  6  |     // Reset to English first
  7  |     const enBtn = page.locator("button", { hasText: /^中$|En/ }).first();
  8  |     if (await enBtn.isVisible().catch(() => false)) {
  9  |       const text = await enBtn.textContent();
  10 |       if (text?.trim() === "中") {
  11 |         // Currently in English mode (shows "中" to switch to Chinese)
  12 |         // Do nothing, already in English
  13 |       } else {
  14 |         // Currently in Chinese mode (shows "En" to switch to English)
  15 |         await enBtn.click();
  16 |         await page.waitForTimeout(300);
  17 |       }
  18 |     }
  19 |   });
  20 | 
  21 |   test("language toggle button exists in sidebar", async ({ page }) => {
  22 |     const toggleBtn = page.locator("button", { hasText: /^中$|En$/ });
  23 |     await expect(toggleBtn).toBeVisible();
  24 |   });
  25 | 
  26 |   test("clicking toggle switches to Chinese", async ({ page }) => {
  27 |     const zhBtn = page.locator("button", { hasText: "中" });
  28 |     await expect(zhBtn).toBeVisible();
  29 |     await zhBtn.click();
  30 |     await page.waitForTimeout(300);
  31 | 
  32 |     // Nav labels should change to Chinese
  33 |     await expect(page.locator("nav button", { hasText: "儀表板" })).toBeVisible({ timeout: 3_000 });
  34 |     await expect(page.locator("nav button", { hasText: "專案" })).toBeVisible();
  35 |   });
  36 | 
  37 |   test("clicking toggle again switches back to English", async ({ page }) => {
  38 |     // Switch to Chinese first
  39 |     const zhBtn = page.locator("button", { hasText: "中" });
  40 |     await zhBtn.click();
  41 |     await page.waitForTimeout(300);
  42 | 
  43 |     // Now should show "En" button to switch back
  44 |     const enBtn = page.locator("button", { hasText: "En" });
  45 |     await expect(enBtn).toBeVisible();
  46 |     await enBtn.click();
  47 |     await page.waitForTimeout(300);
  48 | 
  49 |     // Nav labels should be back in English
  50 |     await expect(page.locator("nav button", { hasText: "Dashboard" })).toBeVisible({ timeout: 3_000 });
  51 |   });
  52 | 
  53 |   test("language persists after navigation", async ({ page }) => {
  54 |     // Switch to Chinese
  55 |     const zhBtn = page.locator("button", { hasText: "中" });
  56 |     await zhBtn.click();
  57 |     await page.waitForTimeout(300);
  58 | 
  59 |     // Navigate to another page
  60 |     await page.locator("nav button", { hasText: "監控" }).click();
  61 |     await page.waitForTimeout(300);
  62 | 
  63 |     // Should still be in Chinese (button shows "En")
  64 |     const enBtn = page.locator("button", { hasText: "En" });
> 65 |     await expect(enBtn).toBeVisible();
     |                         ^ Error: expect(locator).toBeVisible() failed
  66 |   });
  67 | });
  68 | 
```