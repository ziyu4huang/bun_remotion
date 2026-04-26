import type { Page } from "@playwright/test";

/** Click a sidebar nav button by its label text. */
export async function navigateTo(page: Page, label: string) {
  await page.locator("nav button", { hasText: label }).click();
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

/** All 13 nav labels matching App.tsx NAV array. */
export const NAV_LABELS = [
  "Dashboard",
  "Monitoring",
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
] as const;
