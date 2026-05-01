import { test, expect } from "./fixtures";
import { navigateTo, waitForPageLoad, collectConsoleErrors, assertNoConsoleErrors, NAV_LABELS, gotoWithRetry } from "./helpers";

test.describe("API Health", () => {
  test("GET /api/health responds with ok", async ({ request }) => {
    const resp = await request.get("/api/health");
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(data.ok).toBe(true);
    expect(data.data.status).toBe("ok");
  });

  test("GET /api/jobs returns array", async ({ request }) => {
    const resp = await request.get("/api/jobs");
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});

test.describe("Smoke Tests — All Pages Load", () => {
  test("default page is Dashboard", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await gotoWithRetry(page);
    // Wait for React to hydrate and sidebar to render
    await page.locator("nav button").filter({ hasText: "Dashboard" }).waitFor({ state: "visible" });

    // Active nav button should be Dashboard with highlighted background
    const activeBtn = page.locator("nav button").filter({ hasText: "Dashboard" });
    const bg = await activeBtn.evaluate((el) => getComputedStyle(el).background);
    expect(bg).toContain("227, 242, 253");

    // Main content should be non-empty
    const main = page.locator("main");
    await expect(main).toBeVisible();
    const text = await main.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);

    assertNoConsoleErrors(errors);
  });

  test("sidebar shows all navigation items", async ({ page }) => {
    await gotoWithRetry(page);
    const buttons = page.locator("nav button");

    for (const label of NAV_LABELS) {
      await expect(buttons.filter({ hasText: label })).toBeVisible();
    }
  });

  for (const label of NAV_LABELS) {
    test(`${label} page loads without console errors`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await gotoWithRetry(page);
      await navigateTo(page, label);
      await waitForPageLoad(page);

      // Page should have non-empty main content
      const main = page.locator("main");
      await expect(main).toBeVisible();
      const text = await main.textContent();
      expect(text!.trim().length).toBeGreaterThan(0);

      // Should not show generic error text
      const errorText = page.getByText("Something went wrong");
      await expect(errorText).not.toBeVisible();

      assertNoConsoleErrors(errors);
    });
  }
});
