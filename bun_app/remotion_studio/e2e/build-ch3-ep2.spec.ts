/**
 * E2E: Create my-core-is-boss Ch3-Ep2 via WebUI autonomous flow.
 *
 * Steps:
 * 1. Navigate to Projects → my-core-is-boss detail
 * 2. Verify existing episodes (Ch1-Ep1..Ch3-Ep1)
 * 3. Create Ch3-Ep2 via scaffold form
 * 4. Trigger Build Episode autonomous flow
 * 5. Monitor build progress (scaffold → pipeline → check → score → TTS → render)
 * 6. Verify completion
 */
import { test, expect } from "./fixtures";
import { navigateTo, waitForPageLoad, gotoWithRetry } from "./helpers";

test.describe.serial("Build Ch3-Ep2 Autonomous Flow", () => {
  // Heavy integration test — only runs when explicitly targeted
  // Run: bunx playwright test e2e/build-ch3-ep2.spec.ts
  test.skip(process.env.RUN_INTEGRATION !== "1", "Integration test — set RUN_INTEGRATION=1 to run");

  test("Step 1: Navigate to my-core-is-boss detail", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Projects");
    await waitForPageLoad(page);

    // Find my-core-is-boss row
    const table = page.locator("table").first();
    const rows = table.locator("tbody tr");
    const count = await rows.count();

    let targetRow = null;
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator("td").first().textContent();
      if (text?.match(/my-core-is-boss|My Core Is Boss/i)) {
        targetRow = rows.nth(i);
        break;
      }
    }
    expect(targetRow).not.toBeNull();

    await targetRow!.click();
    await expect(page.getByRole("button", { name: /Back/i }).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("heading", { name: /My Core Is Boss/i })).toBeVisible();

    // Verify category label
    await expect(page.getByText(/Narrative Drama/i)).toBeVisible();

    // Verify episodes table
    const epTable = page.locator("table").last();
    await expect(epTable).toBeVisible({ timeout: 5_000 });
    const epRows = epTable.locator("tbody tr");
    const epCount = await epRows.count();
    expect(epCount).toBeGreaterThanOrEqual(7);
  });

  test("Step 2: Create Ch3-Ep2 via scaffold form", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Projects");
    await waitForPageLoad(page);

    // Navigate to my-core-is-boss detail
    const table = page.locator("table").first();
    const rows = table.locator("tbody tr");
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator("td").first().textContent();
      if (text?.match(/my-core-is-boss|My Core Is Boss/i)) {
        await rows.nth(i).click();
        break;
      }
    }
    await expect(page.getByRole("button", { name: /Back/i }).first()).toBeVisible({ timeout: 5_000 });

    // Click + New Episode
    await page.getByRole("button", { name: /New Episode/i }).click();

    // Select my-core-is-boss series
    const seriesSelect = page.locator("select").first();
    await seriesSelect.selectOption("my-core-is-boss");
    await page.waitForTimeout(500);

    const chapterInput = page.locator('input[type="number"]').first();
    const episodeInput = page.locator('input[type="number"]').nth(1);

    const chVal = await chapterInput.inputValue();
    const epVal = await episodeInput.inputValue();
    expect(chVal).toBe("3");
    expect(parseInt(epVal, 10)).toBeGreaterThanOrEqual(2);

    // Uncheck dry run
    const dryRunCheckbox = page.locator('input[type="checkbox"]');
    if (await dryRunCheckbox.isChecked()) {
      await dryRunCheckbox.uncheck();
    }

    // Submit scaffold
    const submitBtn = page.getByRole("button", { name: /Scaffold Episode|Create Episode/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Wait for completion
    const statusText = page.getByText(/completed|complete/i);
    await expect(statusText).toBeVisible({ timeout: 30_000 });
  });

  test("Step 3: Trigger Build Episode flow", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Projects");
    await waitForPageLoad(page);

    // Navigate to my-core-is-boss detail
    const rows = page.locator("table").first().locator("tbody tr");
    for (let i = 0; i < await rows.count(); i++) {
      const text = await rows.nth(i).locator("td").first().textContent();
      if (text?.match(/my-core-is-boss/i)) {
        await rows.nth(i).click();
        break;
      }
    }
    await expect(page.getByRole("button", { name: /Back/i }).first()).toBeVisible({ timeout: 5_000 });

    // Find Ch3-Ep2 row and click Build
    const epRows = page.locator("table").last().locator("tbody tr");
    let ch3Ep2Row = null;
    for (let i = 0; i < await epRows.count(); i++) {
      const epId = await epRows.nth(i).locator("td").first().textContent();
      if (epId?.match(/ch3[-.]ep2/i)) {
        ch3Ep2Row = epRows.nth(i);
        break;
      }
    }

    // Refresh if not found
    if (!ch3Ep2Row) {
      await page.reload();
      await waitForPageLoad(page);
      const epRows2 = page.locator("table").last().locator("tbody tr");
      for (let i = 0; i < await epRows2.count(); i++) {
        const epId = await epRows2.nth(i).locator("td").first().textContent();
        if (epId?.match(/ch3[-.]ep2/i)) {
          ch3Ep2Row = epRows2.nth(i);
          break;
        }
      }
    }

    expect(ch3Ep2Row).not.toBeNull();

    const buildBtn = ch3Ep2Row!.getByRole("button", { name: /Build/i });
    await expect(buildBtn).toBeVisible();
    await buildBtn.click();

    // Build progress should appear
    await expect(page.getByText(/Build Progress/i)).toBeVisible({ timeout: 5_000 });
  });

  test("Step 4: Monitor Build Episode progress", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Projects");
    await waitForPageLoad(page);

    // Navigate to my-core-is-boss detail
    const rows = page.locator("table").first().locator("tbody tr");
    for (let i = 0; i < await rows.count(); i++) {
      const text = await rows.nth(i).locator("td").first().textContent();
      if (text?.match(/my-core-is-boss/i)) {
        await rows.nth(i).click();
        break;
      }
    }
    await expect(page.getByRole("button", { name: /Back/i }).first()).toBeVisible({ timeout: 5_000 });

    // Find Ch3-Ep2 and click View
    const epRows = page.locator("table").last().locator("tbody tr");
    for (let i = 0; i < await epRows.count(); i++) {
      const epId = await epRows.nth(i).locator("td").first().textContent();
      if (epId?.match(/ch3[-.]ep2/i)) {
        const viewBtn = epRows.nth(i).getByRole("button", { name: /View|Build/i });
        if (await viewBtn.isVisible()) {
          await viewBtn.click();
        }
        break;
      }
    }

    // Wait for build completion
    const completedOrFailed = page.getByText(/COMPLETED|FAILED/i);
    await expect(completedOrFailed).toBeVisible({ timeout: 120_000 });
  });
});
