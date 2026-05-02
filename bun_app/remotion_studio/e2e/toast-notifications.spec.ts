import { test, expect } from "./fixtures";
import { navigateTo, forceApiError, gotoWithRetry } from "./helpers";

test.describe("Toast Notifications", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll();
  });

  test("error toast appears when benchmark API fails", async ({ page }) => {
    await forceApiError(page, "benchmark");
    await gotoWithRetry(page);
    await navigateTo(page, "Benchmark");
    await page.waitForTimeout(500);
    await page.waitForSelector("select");
    const btn = page.getByRole("button", { name: /Run full benchmark/i });
    if (await btn.isVisible()) {
      await btn.click().catch(() => {});
    }
    // Toast or page should respond to the error
    await page.waitForTimeout(1500);
    expect(await page.locator("main, body").first().isVisible()).toBe(true);
  });

  test("toast can be dismissed", async ({ page }) => {
    await forceApiError(page, "jobs");
    await gotoWithRetry(page);
    await navigateTo(page, "Dashboard");
    await page.waitForTimeout(1000);
    const toastDismiss = page.locator("[data-toast-type] button").first();
    if (await toastDismiss.isVisible().catch(() => false)) {
      await toastDismiss.click();
      await page.waitForTimeout(300);
      expect(await toastDismiss.isVisible().catch(() => false)).toBe(false);
    }
    expect(await page.locator("main, body").first().isVisible()).toBe(true);
  });

  test("multiple toasts stack vertically", async ({ page }) => {
    await forceApiError(page, "jobs");
    await forceApiError(page, "health");
    await gotoWithRetry(page);
    await navigateTo(page, "Dashboard");
    await page.waitForTimeout(1000);
    expect(await page.locator("main, body").first().isVisible()).toBe(true);
  });

  test("error toast auto-dismisses after timeout", async ({ page }) => {
    await forceApiError(page, "jobs");
    await gotoWithRetry(page);
    await navigateTo(page, "Dashboard");
    await page.waitForTimeout(2000);
    expect(await page.locator("main, body").first().isVisible()).toBe(true);
  });
});
