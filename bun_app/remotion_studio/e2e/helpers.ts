import type { Page } from "@playwright/test";

/** Click a sidebar nav button by its label text. */
export async function navigateTo(page: Page, label: string) {
  const btn = page.locator("nav button", { hasText: label });
  await btn.waitFor({ state: "visible", timeout: 10_000 });
  await btn.click();
  await page.waitForTimeout(300);
}

/** Wait for loading indicators to disappear (pages show "Loading..." text). */
export async function waitForPageLoad(page: Page) {
  const loading = page.getByText("Loading...");
  if (await loading.isVisible().catch(() => false)) {
    await loading.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {});
  }
}

/** Collect console.error messages from the page. */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

/** Assert that no console errors were collected (ignoring known benign ones). */
export function assertNoConsoleErrors(errors: string[]) {
  const filtered = errors.filter(
    (e) =>
      !e.includes("favicon.ico") &&
      !e.includes("devtools") &&
      !e.includes("Download the React DevTools"),
  );
  if (filtered.length > 0) {
    throw new Error(`Console errors found:\n${filtered.join("\n")}`);
  }
}

/** Check if agent bridge is available; returns true if available. */
export async function isAgentBridgeAvailable(page: Page): Promise<boolean> {
  const resp = await page.request.get("http://localhost:5173/api/agent/status");
  if (!resp.ok()) return false;
  const data = await resp.json();
  return data.ok === true;
}

/** All nav labels matching App.tsx NAV array (plus Settings). */
export const NAV_LABELS = [
  "Wizard",
  "Dashboard",
  "Monitoring",
  "Progress",
  "Kanban",
  "Projects",
  "Story Editor",
  "Storygraph",
  "Quality",
  "Benchmark",
  "Agent Chat",
  "Assets",
  "TTS",
  "Render",
  "Image",
  "Workflows",
  "Settings",
] as const;

/** Intercept an API route and return an error response. */
export async function forceApiError(page: Page, path: string, status = 500, error = "Internal server error") {
  await page.route(`**/api/${path}**`, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error }),
    }),
  );
}

/** Intercept an API route and delay the response. */
export async function delayApiRoute(page: Page, path: string, delayMs: number) {
  await page.route(`**/api/${path}**`, async (route) => {
    await new Promise((r) => setTimeout(r, delayMs));
    route.continue();
  });
}

/** Wait for a toast notification of a given type to appear. */
export async function waitForToast(page: Page, type: "success" | "error" | "info", timeout = 5000) {
  return page.locator(`[data-toast-type="${type}"]`).first().waitFor({ timeout });
}

/**
 * Suppress wizard auto-redirect and onboarding tour.
 * Must be called BEFORE the first page.goto so addInitScript runs before React.
 */
let _initApplied = new WeakSet<Page>();
function ensureDismissInit(page: Page) {
  if (_initApplied.has(page)) return;
  _initApplied.add(page);
  page.addInitScript("localStorage.setItem('remotion_studio_wizard_seen','1');localStorage.setItem('remotion_studio_tour_seen','1');localStorage.setItem('remotion_studio_locale','en');");
}

/** page.goto with retry — handles Vite server degradation during long suites. */
export async function gotoWithRetry(page: Page, url = "/", retries = 3) {
  ensureDismissInit(page);
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { timeout: 15_000, waitUntil: "domcontentloaded" });
      // Also set directly in case addInitScript didn't take effect
      await page.evaluate(() => {
        try {
          localStorage.setItem("remotion_studio_wizard_seen", "1");
          localStorage.setItem("remotion_studio_tour_seen", "1");
          localStorage.setItem("remotion_studio_locale", "en");
        } catch {}
      });
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      // Longer backoff for later retries — server may need time to recover
      await new Promise((r) => setTimeout(r, 3_000 * (i + 1)));
    }
  }
}

/** Prevent Wizard auto-redirect for first-time visitors. Call AFTER page.goto. */
export async function dismissWizard(page: Page) {
  ensureDismissInit(page);
}
