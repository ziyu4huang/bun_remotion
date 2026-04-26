# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Smoke Tests — All Pages Load >> Projects page loads without console errors
- Location: e2e/smoke.spec.ts:36:5

# Error details

```
Error: Console errors found:
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Failed to load resource: the server responded with a status of 404 (Not Found)
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
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
  1  | import type { Page } from "@playwright/test";
  2  | 
  3  | /** Click a sidebar nav button by its label text. */
  4  | export async function navigateTo(page: Page, label: string) {
  5  |   await page.locator("nav button", { hasText: label }).click();
  6  |   await page.waitForTimeout(300);
  7  | }
  8  | 
  9  | /** Wait for loading indicators to disappear (pages show "Loading..." text). */
  10 | export async function waitForPageLoad(page: Page) {
  11 |   const loading = page.getByText("Loading...");
  12 |   if (await loading.isVisible().catch(() => false)) {
  13 |     await loading.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {});
  14 |   }
  15 | }
  16 | 
  17 | /** Collect console.error messages from the page. */
  18 | export function collectConsoleErrors(page: Page): string[] {
  19 |   const errors: string[] = [];
  20 |   page.on("console", (msg) => {
  21 |     if (msg.type() === "error") errors.push(msg.text());
  22 |   });
  23 |   return errors;
  24 | }
  25 | 
  26 | /** Assert that no console errors were collected (ignoring known benign ones). */
  27 | export function assertNoConsoleErrors(errors: string[]) {
  28 |   const filtered = errors.filter(
  29 |     (e) =>
  30 |       !e.includes("favicon.ico") &&
  31 |       !e.includes("devtools") &&
  32 |       !e.includes("Download the React DevTools"),
  33 |   );
  34 |   if (filtered.length > 0) {
> 35 |     throw new Error(`Console errors found:\n${filtered.join("\n")}`);
     |           ^ Error: Console errors found:
  36 |   }
  37 | }
  38 | 
  39 | /** Check if agent bridge is available; returns true if available. */
  40 | export async function isAgentBridgeAvailable(page: Page): Promise<boolean> {
  41 |   const resp = await page.request.get("http://localhost:5173/api/agent/status");
  42 |   if (!resp.ok()) return false;
  43 |   const data = await resp.json();
  44 |   return data.ok === true;
  45 | }
  46 | 
  47 | /** All 13 nav labels matching App.tsx NAV array. */
  48 | export const NAV_LABELS = [
  49 |   "Dashboard",
  50 |   "Monitoring",
  51 |   "Projects",
  52 |   "Story Editor",
  53 |   "Storygraph",
  54 |   "Quality",
  55 |   "Benchmark",
  56 |   "Agent Chat",
  57 |   "Assets",
  58 |   "TTS",
  59 |   "Render",
  60 |   "Image",
  61 |   "Workflows",
  62 | ] as const;
  63 | 
```