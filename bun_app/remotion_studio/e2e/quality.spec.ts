import { test, expect } from "@playwright/test";
import { navigateTo, waitForPageLoad } from "./helpers";

test.describe("Quality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("nav button").filter({ hasText: "Quality" }).waitFor({ state: "visible" });
    await navigateTo(page, "Quality");
    await waitForPageLoad(page);
  });

  test("page shows quality heading", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /Quality/i });
    await expect(heading).toBeVisible();
  });

  test("view toggle buttons exist", async ({ page }) => {
    const overviewBtn = page.getByRole("button", { name: /Cross-Series|Overview/i });
    const perSeriesBtn = page.getByRole("button", { name: /Per-Series/i });
    const overviewVisible = await overviewBtn.isVisible().catch(() => false);
    const perSeriesVisible = await perSeriesBtn.isVisible().catch(() => false);
    expect(overviewVisible || perSeriesVisible).toBe(true);
  });

  test("quality content renders without errors", async ({ page }) => {
    const main = page.locator("main");
    await expect(main).toBeVisible();
    const text = await main.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);

    // Should not show generic error
    await expect(page.getByText("Something went wrong")).not.toBeVisible();
  });
});
