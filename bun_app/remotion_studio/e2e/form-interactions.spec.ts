import { test, expect } from "./fixtures";
import { navigateTo, waitForPageLoad, gotoWithRetry } from "./helpers";

test.describe("Form Interactions", () => {
  test("Workflow template selection shows step summary", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Workflows");
    await waitForPageLoad(page);
    const select = page.locator("select").first();
    if (await select.isVisible()) {
      const options = await select.locator("option").count();
      if (options > 1) {
        await select.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        const steps = page.getByText(/Steps/i);
        const arrows = page.getByText("→");
        expect(await steps.isVisible().catch(() => false) || await arrows.isVisible().catch(() => false)).toBe(true);
      }
    }
  });

  test("Workflow trigger button disabled until template selected", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Workflows");
    await waitForPageLoad(page);
    const btn = page.getByRole("button", { name: /Run Workflow/i });
    if (await btn.isVisible()) {
      expect(await btn.isDisabled()).toBe(true);
    }
  });

  test("Benchmark agent buttons are visible", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Benchmark");
    await waitForPageLoad(page);
    await expect(page.getByRole("button", { name: /Run full benchmark/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Compare all baselines/i })).toBeVisible();
  });

  test("Create Episode form auto-fills chapter/episode", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Projects");
    await waitForPageLoad(page);
    const btn = page.getByRole("button", { name: /New Episode/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(500);
      const seriesSelect = page.locator("select").first();
      const options = await seriesSelect.locator("option").count();
      if (options > 1) {
        await seriesSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        const chapterInput = page.locator('input[type="number"]').first();
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
    const row = page.locator("table tbody tr").first();
    if (await row.isVisible()) {
      await row.click();
      await page.waitForTimeout(500);
      const back = page.getByRole("button", { name: /Back/i }).first();
      expect(await back.isVisible().catch(() => false)).toBe(true);
    }
  });
});
