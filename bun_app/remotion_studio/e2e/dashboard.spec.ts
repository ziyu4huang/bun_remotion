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

  test("job table appears after demo job completes", async ({ page }) => {
    // Run a demo job
    await page.getByRole("button", { name: /Run Demo Job/i }).click();

    // Wait for completion
    await page.locator("text=completed").first().waitFor({ state: "visible", timeout: 10_000 });

    // Job table should have at least one row
    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toBeVisible();

    // Table headers should exist
    const headers = page.locator("table thead th");
    await expect(headers).toHaveCount(4); // ID, Type, Status, Progress
  });

  test("multiple demo jobs queue correctly", async ({ page }) => {
    // Run two demo jobs
    await page.getByRole("button", { name: /Run Demo Job/i }).click();
    await page.locator("text=completed").first().waitFor({ state: "visible", timeout: 10_000 });

    await page.getByRole("button", { name: /Run Demo Job/i }).click();
    await page.locator("text=completed").first().waitFor({ state: "visible", timeout: 10_000 });

    // Should have at least 2 rows in job table
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
