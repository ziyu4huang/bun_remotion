import { test, expect } from "@playwright/test";

test.describe("i18n Language Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Reset to English first
    const enBtn = page.locator("button", { hasText: /^中$|En/ }).first();
    if (await enBtn.isVisible().catch(() => false)) {
      const text = await enBtn.textContent();
      if (text?.trim() === "中") {
        // Currently in English mode (shows "中" to switch to Chinese)
        // Do nothing, already in English
      } else {
        // Currently in Chinese mode (shows "En" to switch to English)
        await enBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test("language toggle button exists in sidebar", async ({ page }) => {
    const toggleBtn = page.locator("button", { hasText: /^中$|En$/ });
    await expect(toggleBtn).toBeVisible();
  });

  test("clicking toggle switches to Chinese", async ({ page }) => {
    const zhBtn = page.locator("button", { hasText: "中" });
    await expect(zhBtn).toBeVisible();
    await zhBtn.click();
    await page.waitForTimeout(300);

    // Nav labels should change to Chinese
    await expect(page.locator("nav button", { hasText: "儀表板" })).toBeVisible({ timeout: 3_000 });
    await expect(page.locator("nav button", { hasText: "專案" })).toBeVisible();
  });

  test("clicking toggle again switches back to English", async ({ page }) => {
    // Switch to Chinese first
    const zhBtn = page.locator("button", { hasText: "中" });
    await zhBtn.click();
    await page.waitForTimeout(300);

    // Now should show "En" button to switch back
    const enBtn = page.locator("button", { hasText: "En" });
    await expect(enBtn).toBeVisible();
    await enBtn.click();
    await page.waitForTimeout(300);

    // Nav labels should be back in English
    await expect(page.locator("nav button", { hasText: "Dashboard" })).toBeVisible({ timeout: 3_000 });
  });

  test("language persists after navigation", async ({ page }) => {
    // Switch to Chinese
    const zhBtn = page.locator("button", { hasText: "中" });
    await zhBtn.click();
    await page.waitForTimeout(300);

    // Navigate to another page
    await page.locator("nav button", { hasText: "監控" }).click();
    await page.waitForTimeout(300);

    // Should still be in Chinese (button shows "En")
    const enBtn = page.locator("button", { hasText: "En" });
    await expect(enBtn).toBeVisible();
  });
});
