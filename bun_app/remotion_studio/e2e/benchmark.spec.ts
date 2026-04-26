import { test, expect } from "@playwright/test";
import { navigateTo, waitForPageLoad } from "./helpers";

test.describe("Benchmark", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("nav button").filter({ hasText: "Benchmark" }).waitFor({ state: "visible" });
    await navigateTo(page, "Benchmark");
    await waitForPageLoad(page);
  });

  test("page shows benchmark heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Benchmark/i })).toBeVisible();
  });

  test("project selector dropdown exists", async ({ page }) => {
    const select = page.locator("select").first();
    await expect(select).toBeVisible();
  });

  test("mode selector shows options", async ({ page }) => {
    const selects = page.locator("select");
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Second select should be the mode selector
    const modeSelect = selects.nth(1);
    await expect(modeSelect).toBeVisible();
  });

  test("threshold input exists with default value", async ({ page }) => {
    const threshold = page.locator('input[type="number"]');
    await expect(threshold).toBeVisible();
    const value = await threshold.inputValue();
    expect(Number(value)).toBe(10);
  });

  test("run buttons are disabled when no project selected", async ({ page }) => {
    const runBtn = page.getByRole("button", { name: /Run Full Benchmark|Agent Benchmark/i });
    const regBtn = page.getByRole("button", { name: /Regression Check/i });

    await expect(runBtn).toBeDisabled();
    await expect(regBtn).toBeDisabled();
  });

  test("baselines table renders with correct headers", async ({ page }) => {
    // Table should exist
    const table = page.locator("table").last();
    await expect(table).toBeVisible();

    // Check headers
    const headers = ["Series", "Baseline", "Current", "Delta", "Status", "Actions"];
    for (const h of headers) {
      await expect(table.locator("th", { hasText: h })).toBeVisible();
    }
  });

  test("selecting project enables run buttons", async ({ page }) => {
    const select = page.locator("select").first();
    const options = await select.locator("option").allTextContents();
    const projectOptions = options.filter((o) => !o.includes("Select"));

    if (projectOptions.length === 0) {
      test.skip();
      return;
    }

    await select.selectOption({ index: 1 });

    const runBtn = page.getByRole("button", { name: /Run Full Benchmark|Agent Benchmark/i });
    await expect(runBtn).toBeEnabled();
  });

  test("agent mode toggle changes button text", async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]');
    const label = page.getByText("Agent mode");

    if (!(await label.isVisible())) {
      test.skip();
      return;
    }

    // Before toggle
    await expect(page.getByRole("button", { name: /Run Full Benchmark/i })).toBeVisible();

    // Toggle agent mode
    await checkbox.click();

    // Button text should change
    await expect(page.getByRole("button", { name: /Agent Benchmark/i })).toBeVisible();
  });
});
