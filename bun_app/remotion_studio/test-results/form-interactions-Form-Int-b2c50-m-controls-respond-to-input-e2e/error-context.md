# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: form-interactions.spec.ts >> Form Interactions >> Benchmark form controls respond to input
- Location: e2e/form-interactions.spec.ts:31:3

# Error details

```
Test timeout of 15000ms exceeded.
```

```
Error: locator.click: Test timeout of 15000ms exceeded.
Call log:
  - waiting for locator('nav button').filter({ hasText: 'Benchmark' })

```

# Test source

```ts
  1  | import type { Page } from "@playwright/test";
  2  | 
  3  | /** Click a sidebar nav button by its label text. */
  4  | export async function navigateTo(page: Page, label: string) {
> 5  |   await page.locator("nav button", { hasText: label }).click();
     |                                                        ^ Error: locator.click: Test timeout of 15000ms exceeded.
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
  35 |     throw new Error(`Console errors found:\n${filtered.join("\n")}`);
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
  51 |   "Progress",
  52 |   "Kanban",
  53 |   "Projects",
  54 |   "Story Editor",
  55 |   "Storygraph",
  56 |   "Quality",
  57 |   "Benchmark",
  58 |   "Agent Chat",
  59 |   "Assets",
  60 |   "TTS",
  61 |   "Render",
  62 |   "Image",
  63 |   "Workflows",
  64 | ] as const;
  65 | 
  66 | /** Intercept an API route and return an error response. */
  67 | export async function forceApiError(page: Page, path: string, status = 500, error = "Internal server error") {
  68 |   await page.route(`**/api/${path}**`, (route) =>
  69 |     route.fulfill({
  70 |       status,
  71 |       contentType: "application/json",
  72 |       body: JSON.stringify({ ok: false, error }),
  73 |     }),
  74 |   );
  75 | }
  76 | 
  77 | /** Intercept an API route and delay the response. */
  78 | export async function delayApiRoute(page: Page, path: string, delayMs: number) {
  79 |   await page.route(`**/api/${path}**`, async (route) => {
  80 |     await new Promise((r) => setTimeout(r, delayMs));
  81 |     route.continue();
  82 |   });
  83 | }
  84 | 
  85 | /** Wait for a toast notification of a given type to appear. */
  86 | export async function waitForToast(page: Page, type: "success" | "error" | "info", timeout = 5000) {
  87 |   return page.locator(`[data-toast-type="${type}"]`).first().waitFor({ timeout });
  88 | }
  89 | 
```