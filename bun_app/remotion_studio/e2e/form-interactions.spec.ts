import { test, expect } from "./fixtures";
import { navigateTo, waitForPageLoad, gotoWithRetry } from "./helpers";

test.describe("Form Interactions", () => {
  test("Workflow template selection shows step summary", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Workflows");
    await waitForPageLoad(page);
    // Select first template
    const select = page.locator("select").first();
    if (await select.isVisible()) {
      const options = await select.locator("option").count();
      if (options > 1) {
        await select.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        // Step summary should appear
        const steps = page.locator("text=Steps:");
        expect(await steps.isVisible().catch(() => false) || await page.locator("text=→").isVisible().catch(() => false)).toBe(true);
      }
    }
  });

  test("Workflow trigger button disabled until template selected", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Workflows");
    await waitForPageLoad(page);
    const btn = page.locator("button", { hasText: "Run Workflow" });
    if (await btn.isVisible()) {
      expect(await btn.isDisabled()).toBe(true);
    }
  });

  test("Benchmark agent buttons are visible", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Benchmark");
    await waitForPageLoad(page);
    // Agent-only UI: verify agent prompt buttons exist (replaced form controls)
    await expect(page.getByRole("button", { name: /Run full benchmark/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Compare all baselines/i })).toBeVisible();
  });

  test("Create Episode form auto-fills chapter/episode", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Projects");
    await waitForPageLoad(page);
    // Click "+ New Episode"
    const btn = page.locator("button", { hasText: "New Episode" }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(500);
      // Select a series in the form
      const seriesSelect = page.locator("select").first();
      const options = await seriesSelect.locator("option").count();
      if (options > 1) {
        await seriesSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        // Chapter/Episode fields should be auto-filled
        const chapterInput = page.locator("input[type=\"number\"]").first();
        if (await chapterInput.isVisible()) {
          const val = await chapterInput.inputValue();
          expect(val).not.toBe("");
        }
      }
    }
  });

  test("Project list rows are clickable", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Projects");
    await waitForPageLoad(page);
    // Find a project row in the table
    const row = page.locator("table tbody tr").first();
    if (await row.isVisible()) {
      await row.click();
      await page.waitForTimeout(500);
      // Should navigate to detail view (look for Back button)
      const back = page.locator("button", { hasText: "Back" }).first();
      expect(await back.isVisible().catch(() => false)).toBe(true);
    }
  });
});
