# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: build-ch3-ep2.spec.ts >> Build Ch3-Ep2 Autonomous Flow >> Step 4: Monitor Build Episode progress
- Location: e2e/build-ch3-ep2.spec.ts:200:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=/COMPLETED|FAILED/')
Expected: visible
Timeout: 120000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 120000ms
  - waiting for locator('text=/COMPLETED|FAILED/')

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
    - button "Workflows" [ref=e18] [cursor=pointer]
  - main [ref=e19]:
    - generic [ref=e21]:
      - generic [ref=e22]:
        - button "← Back" [ref=e23] [cursor=pointer]
        - heading "My Core Is Boss" [level=2] [ref=e24]
        - button "+ New Episode" [ref=e25] [cursor=pointer]
        - button "Ask Advisor" [ref=e26] [cursor=pointer]
      - generic [ref=e27]:
        - generic [ref=e28]: "Category: Narrative Drama"
        - generic [ref=e29]: "Episodes: 8"
        - generic [ref=e30]:
          - text: "Gate:"
          - generic [ref=e31]: 100/100
        - generic [ref=e32]: "Plan: Yes"
      - table [ref=e33]:
        - rowgroup [ref=e34]:
          - row "Episode Ch Ep Scaffold TTS Render Gate Build" [ref=e35]:
            - columnheader "Episode" [ref=e36]
            - columnheader "Ch" [ref=e37]
            - columnheader "Ep" [ref=e38]
            - columnheader "Scaffold" [ref=e39]
            - columnheader "TTS" [ref=e40]
            - columnheader "Render" [ref=e41]
            - columnheader "Gate" [ref=e42]
            - columnheader "Build" [ref=e43]
        - rowgroup [ref=e44]:
          - row "my-core-is-boss-ch1-ep1 1 1 Yes Yes Yes — Build" [ref=e45]:
            - cell "my-core-is-boss-ch1-ep1" [ref=e46]
            - cell "1" [ref=e47]
            - cell "1" [ref=e48]
            - cell "Yes" [ref=e49]
            - cell "Yes" [ref=e50]
            - cell "Yes" [ref=e51]
            - cell "—" [ref=e52]
            - cell "Build" [ref=e53]:
              - button "Build" [ref=e54] [cursor=pointer]
          - row "my-core-is-boss-ch1-ep2 1 2 Yes Yes Yes — Build" [ref=e55]:
            - cell "my-core-is-boss-ch1-ep2" [ref=e56]
            - cell "1" [ref=e57]
            - cell "2" [ref=e58]
            - cell "Yes" [ref=e59]
            - cell "Yes" [ref=e60]
            - cell "Yes" [ref=e61]
            - cell "—" [ref=e62]
            - cell "Build" [ref=e63]:
              - button "Build" [ref=e64] [cursor=pointer]
          - row "my-core-is-boss-ch1-ep3 1 3 Yes Yes Yes — Build" [ref=e65]:
            - cell "my-core-is-boss-ch1-ep3" [ref=e66]
            - cell "1" [ref=e67]
            - cell "3" [ref=e68]
            - cell "Yes" [ref=e69]
            - cell "Yes" [ref=e70]
            - cell "Yes" [ref=e71]
            - cell "—" [ref=e72]
            - cell "Build" [ref=e73]:
              - button "Build" [ref=e74] [cursor=pointer]
          - row "my-core-is-boss-ch2-ep1 2 1 Yes Yes Yes — Build" [ref=e75]:
            - cell "my-core-is-boss-ch2-ep1" [ref=e76]
            - cell "2" [ref=e77]
            - cell "1" [ref=e78]
            - cell "Yes" [ref=e79]
            - cell "Yes" [ref=e80]
            - cell "Yes" [ref=e81]
            - cell "—" [ref=e82]
            - cell "Build" [ref=e83]:
              - button "Build" [ref=e84] [cursor=pointer]
          - row "my-core-is-boss-ch2-ep2 2 2 Yes Yes Yes — Build" [ref=e85]:
            - cell "my-core-is-boss-ch2-ep2" [ref=e86]
            - cell "2" [ref=e87]
            - cell "2" [ref=e88]
            - cell "Yes" [ref=e89]
            - cell "Yes" [ref=e90]
            - cell "Yes" [ref=e91]
            - cell "—" [ref=e92]
            - cell "Build" [ref=e93]:
              - button "Build" [ref=e94] [cursor=pointer]
          - row "my-core-is-boss-ch2-ep3 2 3 Yes Yes Yes — Build" [ref=e95]:
            - cell "my-core-is-boss-ch2-ep3" [ref=e96]
            - cell "2" [ref=e97]
            - cell "3" [ref=e98]
            - cell "Yes" [ref=e99]
            - cell "Yes" [ref=e100]
            - cell "Yes" [ref=e101]
            - cell "—" [ref=e102]
            - cell "Build" [ref=e103]:
              - button "Build" [ref=e104] [cursor=pointer]
          - row "my-core-is-boss-ch3-ep1 3 1 Yes Yes Yes — Build" [ref=e105]:
            - cell "my-core-is-boss-ch3-ep1" [ref=e106]
            - cell "3" [ref=e107]
            - cell "1" [ref=e108]
            - cell "Yes" [ref=e109]
            - cell "Yes" [ref=e110]
            - cell "Yes" [ref=e111]
            - cell "—" [ref=e112]
            - cell "Build" [ref=e113]:
              - button "Build" [ref=e114] [cursor=pointer]
          - row "my-core-is-boss-ch3-ep2 3 2 Yes — — — Hide" [ref=e115]:
            - cell "my-core-is-boss-ch3-ep2" [ref=e116]
            - cell "3" [ref=e117]
            - cell "2" [ref=e118]
            - cell "Yes" [ref=e119]
            - cell "—" [ref=e120]
            - cell "—" [ref=e121]
            - cell "—" [ref=e122]
            - cell "Hide" [ref=e123]:
              - button "Hide" [active] [ref=e124] [cursor=pointer]
      - generic [ref=e126]:
        - heading "Build Progress" [level=3] [ref=e127]
        - generic [ref=e128]: RUNNING
```

# Test source

```ts
  134 |     const count = await rows.count();
  135 |     for (let i = 0; i < count; i++) {
  136 |       const text = await rows.nth(i).locator("td").first().textContent();
  137 |       if (text?.match(/my-core-is-boss|My Core Is Boss/i)) {
  138 |         await rows.nth(i).click();
  139 |         break;
  140 |       }
  141 |     }
  142 |     await expect(page.getByText("← Back")).toBeVisible({ timeout: 5_000 });
  143 | 
  144 |     // Find the Ch3-Ep2 row and click Build
  145 |     const epTable = page.locator("table").last();
  146 |     const epRows = epTable.locator("tbody tr");
  147 |     const epCount = await epRows.count();
  148 | 
  149 |     let ch3Ep2Row = null;
  150 |     for (let i = 0; i < epCount; i++) {
  151 |       const epId = await epRows.nth(i).locator("td").first().textContent();
  152 |       if (epId?.includes("ch3-ep2") || epId?.includes("ch3.ep2")) {
  153 |         ch3Ep2Row = epRows.nth(i);
  154 |         break;
  155 |       }
  156 |     }
  157 | 
  158 |     if (!ch3Ep2Row) {
  159 |       // Episode might not appear yet — try refreshing
  160 |       console.log("Ch3-Ep2 not found in episode list, refreshing...");
  161 |       await page.reload();
  162 |       await waitForPageLoad(page);
  163 | 
  164 |       const epRows2 = page.locator("table").last().locator("tbody tr");
  165 |       const epCount2 = await epRows2.count();
  166 |       for (let i = 0; i < epCount2; i++) {
  167 |         const epId = await epRows2.nth(i).locator("td").first().textContent();
  168 |         console.log(`  Episode: ${epId}`);
  169 |         if (epId?.includes("ch3-ep2") || epId?.includes("ch3.ep2")) {
  170 |           ch3Ep2Row = epRows2.nth(i);
  171 |           break;
  172 |         }
  173 |       }
  174 |     }
  175 | 
  176 |     if (!ch3Ep2Row) {
  177 |       console.log("Ch3-Ep2 not found — listing all episode IDs:");
  178 |       const allRows = page.locator("table").last().locator("tbody tr");
  179 |       for (let i = 0; i < await allRows.count(); i++) {
  180 |         const id = await allRows.nth(i).locator("td").first().textContent();
  181 |         console.log(`  [${i}] ${id}`);
  182 |       }
  183 |     }
  184 | 
  185 |     expect(ch3Ep2Row).not.toBeNull();
  186 | 
  187 |     // Click Build button in that row
  188 |     const buildBtn = ch3Ep2Row!.getByRole("button", { name: "Build" });
  189 |     await expect(buildBtn).toBeVisible();
  190 |     await buildBtn.click();
  191 | 
  192 |     // Build progress panel should appear
  193 |     await expect(page.getByText("Build Progress")).toBeVisible({ timeout: 5_000 });
  194 | 
  195 |     await page.screenshot({ path: "e2e/screenshots/04-build-started.png", fullPage: true });
  196 | 
  197 |     console.log("Build triggered — monitoring progress...");
  198 |   });
  199 | 
  200 |   test("Step 4: Monitor Build Episode progress", async ({ page }) => {
  201 |     // Navigate to project detail
  202 |     await page.goto("/");
  203 |     await navigateTo(page, "Projects");
  204 |     await waitForPageLoad(page);
  205 | 
  206 |     const table = page.locator("table").first();
  207 |     const rows = table.locator("tbody tr");
  208 |     const count = await rows.count();
  209 |     for (let i = 0; i < count; i++) {
  210 |       const text = await rows.nth(i).locator("td").first().textContent();
  211 |       if (text?.match(/my-core-is-boss|My Core Is Boss/i)) {
  212 |         await rows.nth(i).click();
  213 |         break;
  214 |       }
  215 |     }
  216 |     await expect(page.getByText("← Back")).toBeVisible({ timeout: 5_000 });
  217 | 
  218 |     // Find Ch3-Ep2 and click View (build should already be running or completed)
  219 |     const epRows = page.locator("table").last().locator("tbody tr");
  220 |     const epCount = await epRows.count();
  221 |     for (let i = 0; i < epCount; i++) {
  222 |       const epId = await epRows.nth(i).locator("td").first().textContent();
  223 |       if (epId?.includes("ch3-ep2") || epId?.includes("ch3.ep2")) {
  224 |         const viewBtn = epRows.nth(i).getByRole("button", { name: /View|Build/ });
  225 |         if (await viewBtn.isVisible()) {
  226 |           await viewBtn.click();
  227 |         }
  228 |         break;
  229 |       }
  230 |     }
  231 | 
  232 |     // Wait for build to complete or fail (generous timeout for TTS + render)
  233 |     const completedOrFailed = page.locator("text=/COMPLETED|FAILED/");
> 234 |     await expect(completedOrFailed).toBeVisible({ timeout: 120_000 });
      |                                     ^ Error: expect(locator).toBeVisible() failed
  235 | 
  236 |     await page.screenshot({ path: "e2e/screenshots/05-build-final.png", fullPage: true });
  237 | 
  238 |     // Check final status
  239 |     const statusEl = page.locator("text=/COMPLETED|FAILED/").first();
  240 |     const statusText = await statusEl.textContent();
  241 |     console.log(`Build final status: ${statusText}`);
  242 | 
  243 |     if (statusText?.includes("COMPLETED")) {
  244 |       await expect(page.getByText(/All \d+ steps completed successfully/)).toBeVisible();
  245 |       console.log("All build steps completed successfully!");
  246 |     } else {
  247 |       // Log error details
  248 |       const errorEl = page.locator("[style*='ffebee']");
  249 |       if (await errorEl.isVisible()) {
  250 |         const errorText = await errorEl.textContent();
  251 |         console.log(`Build failed: ${errorText}`);
  252 |       }
  253 |     }
  254 |   });
  255 | });
  256 | 
```