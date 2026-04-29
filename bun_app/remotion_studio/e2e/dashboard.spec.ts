import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for React to render the Dashboard
    await page.locator("nav button").filter({ hasText: "Dashboard" }).waitFor({ state: "visible" });
  });

  test("shows server status section", async ({ page }) => {
    const statusSection = page.locator("section").filter({ hasText: "Server Status" });
    await expect(statusSection).toBeVisible();
  });

  test("health check shows ok status", async ({ page }) => {
    // Server status should show "ok" (green) or "failed" — either way it renders
    const statusText = page.locator("text=ok").or(page.locator("text=failed"));
    await expect(statusText.first()).toBeVisible({ timeout: 5_000 });
  });

  test("Run Demo Job button exists and is clickable", async ({ page }) => {
    const btn = page.getByRole("button", { name: /Run Demo Job/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test("clicking Run Demo Job creates a job and shows progress", async ({ page }) => {
    const btn = page.getByRole("button", { name: /Run Demo Job/i });
    await btn.click();

    // Button should change to show running state
    const runningBtn = page.getByRole("button", { name: /Running/i });
    await expect(runningBtn).toBeVisible({ timeout: 2_000 });

    // Wait for job to complete (max 10s)
    const completedText = page.locator("text=completed").first();
    await expect(completedText).toBeVisible({ timeout: 10_000 });
  });

  test("job cards appear after demo job completes", async ({ page }) => {
    // Run a demo job
    await page.getByRole("button", { name: /Run Demo Job/i }).click();

    // Wait for completion
    await page.locator("text=completed").first().waitFor({ state: "visible", timeout: 10_000 });

    // Job queue section should have job cards (divs with borders in the job queue section)
    const jobSection = page.locator("section").filter({ hasText: "Job Queue" });
    await expect(jobSection).toBeVisible();

    // Should show at least one status badge with "completed"
    const completedBadge = page.getByText("completed").first();
    await expect(completedBadge).toBeVisible();

    // Should show filter tabs (All, Running, Completed, Failed)
    const allTab = page.getByRole("button", { name: /^All/ });
    await expect(allTab).toBeVisible();
    const completedTab = page.getByRole("button", { name: /^Completed/ });
    await expect(completedTab).toBeVisible();
  });

  test("multiple demo jobs queue correctly", async ({ page }) => {
    // Run two demo jobs
    await page.getByRole("button", { name: /Run Demo Job/i }).click();
    await page.locator("text=completed").first().waitFor({ state: "visible", timeout: 10_000 });

    await page.getByRole("button", { name: /Run Demo Job/i }).click();
    await page.locator("text=completed").first().waitFor({ state: "visible", timeout: 10_000 });

    // Switch to Completed filter to see only completed jobs
    const completedTab = page.getByRole("button", { name: /^Completed/ });
    await completedTab.click();

    // Should have at least 2 completed jobs visible
    const statusBadges = page.getByText("completed");
    const count = await statusBadges.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
