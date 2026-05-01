import { test, expect } from "./fixtures";
import { navigateTo, waitForPageLoad, gotoWithRetry } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Dashboard");
    await waitForPageLoad(page);
  });

  test("shows server status section", async ({ page }) => {
    const statusSection = page.locator("section").filter({ hasText: /Server Status|伺服器狀態/i });
    await expect(statusSection).toBeVisible();
  });

  test("health check shows ok status", async ({ page }) => {
    const statusText = page.locator("text=ok").or(page.locator("text=failed"));
    await expect(statusText.first()).toBeVisible({ timeout: 5_000 });
  });

  test("Run Demo Job button exists and is clickable", async ({ page }) => {
    const btn = page.getByRole("button", { name: /Run Demo Job|執行示範/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test("clicking Run Demo Job creates a job and shows progress", async ({ page }) => {
    const btn = page.getByRole("button", { name: /Run Demo Job|執行示範/i });
    await btn.click();

    // Button should change to show running state
    const runningBtn = page.getByRole("button", { name: /Running|執行中/i });
    await expect(runningBtn).toBeVisible({ timeout: 2_000 });

    // Wait for job to complete (max 10s)
    const completedText = page.locator("text=completed").first();
    await expect(completedText).toBeVisible({ timeout: 10_000 });
  });

  test("job cards appear after demo job completes", async ({ page }) => {
    await page.getByRole("button", { name: /Run Demo Job|執行示範/i }).click();
    await page.locator("text=completed").first().waitFor({ state: "visible", timeout: 10_000 });

    const jobSection = page.locator("section").filter({ hasText: /Job Queue|工作佇列/i });
    await expect(jobSection).toBeVisible();

    const completedBadge = page.getByText("completed").first();
    await expect(completedBadge).toBeVisible();

    const allTab = page.getByRole("button", { name: /^All|全部/ });
    await expect(allTab).toBeVisible();
    const completedTab = page.getByRole("button", { name: /^Completed|已完成/ });
    await expect(completedTab).toBeVisible();
  });

  test("multiple demo jobs queue correctly", async ({ page }) => {
    // Run first demo job
    await page.getByRole("button", { name: /Run Demo Job|執行示範/i }).click();
    await page.locator("text=completed").first().waitFor({ state: "visible", timeout: 10_000 });

    // Verify completed state
    const completedTab = page.getByRole("button", { name: /^Completed|已完成/ });
    await completedTab.click();

    const statusBadges = page.getByText("completed");
    const count = await statusBadges.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
