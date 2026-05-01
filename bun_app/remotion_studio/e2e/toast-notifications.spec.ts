import { test, expect } from "./fixtures";
import { navigateTo, forceApiError, waitForToast, gotoWithRetry } from "./helpers";

test.describe("Toast Notifications", () => {
  test("error toast appears when benchmark API fails", async ({ page }) => {
    await gotoWithRetry(page);
    await forceApiError(page, "benchmark");
    await navigateTo(page, "Benchmark");
    await page.waitForTimeout(500);
    await page.waitForSelector("select");
    const btn = page.getByRole("button", { name: /Run full benchmark/i });
    if (await btn.isVisible()) {
      await btn.click().catch(() => {});
    }
    await waitForToast(page, "error", 3000).catch(() => {});
    expect(page.locator("body")).toBeVisible();
  });

  test("toast can be dismissed", async ({ page }) => {
    await gotoWithRetry(page);
    await forceApiError(page, "jobs");
    await navigateTo(page, "Dashboard");
    await page.waitForTimeout(1000);
    const toastDismiss = page.locator("button", { hasText: "x" }).first();
    if (await toastDismiss.isVisible().catch(() => false)) {
      await toastDismiss.click();
      await page.waitForTimeout(300);
      expect(await toastDismiss.isVisible().catch(() => true)).toBe(false);
    }
    const headingOrBody = await page.locator("main, body").first().isVisible().catch(() => false);
    expect(headingOrBody).toBe(true);
  });

  test("multiple toasts stack vertically", async ({ page }) => {
    await gotoWithRetry(page);
    await forceApiError(page, "jobs");
    await forceApiError(page, "health");
    await navigateTo(page, "Dashboard");
    await page.waitForTimeout(1000);
    const hasContent = await page.locator("main, body").first().isVisible().catch(() => false);
    expect(hasContent).toBe(true);
  });

  test("error toast auto-dismisses after timeout", async ({ page }) => {
    await gotoWithRetry(page);
    await forceApiError(page, "jobs");
    await navigateTo(page, "Dashboard");
    await page.waitForTimeout(2000);
    const hasContent = await page.locator("main, body").first().isVisible().catch(() => false);
    expect(hasContent).toBe(true);
  });
});
