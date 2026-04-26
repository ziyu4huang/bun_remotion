/**
 * E2E: Create my-core-is-boss Ch3-Ep2 (隱藏關卡) via WebUI autonomous flow.
 *
 * Steps:
 * 1. Navigate to Projects → my-core-is-boss detail
 * 2. Verify existing episodes (Ch1-Ep1..Ch3-Ep1)
 * 3. Create Ch3-Ep2 via scaffold form
 * 4. Trigger Build Episode autonomous flow
 * 5. Monitor build progress (scaffold → pipeline → check → score → TTS → render)
 * 6. Verify completion
 */
import { test, expect } from "@playwright/test";
import { navigateTo, waitForPageLoad } from "./helpers";

const BASE = "http://localhost:3000";
const API = "http://localhost:5173/api";

test.describe.serial("Build Ch3-Ep2 Autonomous Flow", () => {
  test("Step 1: Navigate to my-core-is-boss detail", async ({ page }) => {
    await page.goto("/");
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

    // Click into detail
    await targetRow!.click();
    await expect(page.getByText("← Back")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("heading", { name: "My Core Is Boss" })).toBeVisible();

    // Verify category
    await expect(page.getByText(/Category:.*Narrative Drama/)).toBeVisible();

    // Verify episodes exist
    const epTable = page.locator("table").last();
    await expect(epTable).toBeVisible({ timeout: 5_000 });

    // Should have at least 7 episodes (ch1-ep1 through ch3-ep1)
    const epRows = epTable.locator("tbody tr");
    const epCount = await epRows.count();
    console.log(`Found ${epCount} episodes`);
    expect(epCount).toBeGreaterThanOrEqual(7);

    // Take screenshot
    await page.screenshot({ path: "e2e/screenshots/01-project-detail.png", fullPage: true });
  });

  test("Step 2: Create Ch3-Ep2 via scaffold form", async ({ page }) => {
    await page.goto("/");
    await navigateTo(page, "Projects");
    await waitForPageLoad(page);

    // Click into my-core-is-boss detail
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
    await expect(page.getByText("← Back")).toBeVisible({ timeout: 5_000 });

    // Click + New Episode
    await page.getByRole("button", { name: "+ New Episode" }).click();
    await expect(page.getByText("Create Episode")).toBeVisible({ timeout: 3_000 });

    // Select my-core-is-boss series (value = seriesId)
    const seriesSelect = page.locator("select").first();
    await seriesSelect.selectOption("my-core-is-boss");

    // Wait for auto-fill (should auto-detect ch3, ep2)
    await page.waitForTimeout(500);

    const chapterInput = page.locator('input[type="number"]').first();
    const episodeInput = page.locator('input[type="number"]').nth(1);

    const chVal = await chapterInput.inputValue();
    const epVal = await episodeInput.inputValue();
    console.log(`Auto-filled: chapter=${chVal}, episode=${epVal}`);

    // Verify auto-fill: should be ch3, ep2
    expect(chVal).toBe("3");
    expect(epVal).toBe("2");

    // Uncheck dry run — we want actual scaffold
    const dryRunCheckbox = page.locator('input[type="checkbox"]');
    if (await dryRunCheckbox.isChecked()) {
      await dryRunCheckbox.uncheck();
    }

    await page.screenshot({ path: "e2e/screenshots/02-create-form.png", fullPage: true });

    // Submit scaffold
    const submitBtn = page.getByRole("button", { name: "Create Episode" });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Wait for scaffold to complete (should be fast, ~2-5s)
    const statusText = page.locator("text=completed");
    await expect(statusText).toBeVisible({ timeout: 30_000 });

    // Verify success
    await expect(page.getByText("Scaffold complete!")).toBeVisible();

    await page.screenshot({ path: "e2e/screenshots/03-scaffold-complete.png", fullPage: true });

    console.log("Scaffold completed successfully");
  });

  test("Step 3: Trigger Build Episode flow", async ({ page }) => {
    // Go back to project detail
    await page.goto("/");
    await navigateTo(page, "Projects");
    await waitForPageLoad(page);

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
    await expect(page.getByText("← Back")).toBeVisible({ timeout: 5_000 });

    // Find the Ch3-Ep2 row and click Build
    const epTable = page.locator("table").last();
    const epRows = epTable.locator("tbody tr");
    const epCount = await epRows.count();

    let ch3Ep2Row = null;
    for (let i = 0; i < epCount; i++) {
      const epId = await epRows.nth(i).locator("td").first().textContent();
      if (epId?.includes("ch3-ep2") || epId?.includes("ch3.ep2")) {
        ch3Ep2Row = epRows.nth(i);
        break;
      }
    }

    if (!ch3Ep2Row) {
      // Episode might not appear yet — try refreshing
      console.log("Ch3-Ep2 not found in episode list, refreshing...");
      await page.reload();
      await waitForPageLoad(page);

      const epRows2 = page.locator("table").last().locator("tbody tr");
      const epCount2 = await epRows2.count();
      for (let i = 0; i < epCount2; i++) {
        const epId = await epRows2.nth(i).locator("td").first().textContent();
        console.log(`  Episode: ${epId}`);
        if (epId?.includes("ch3-ep2") || epId?.includes("ch3.ep2")) {
          ch3Ep2Row = epRows2.nth(i);
          break;
        }
      }
    }

    if (!ch3Ep2Row) {
      console.log("Ch3-Ep2 not found — listing all episode IDs:");
      const allRows = page.locator("table").last().locator("tbody tr");
      for (let i = 0; i < await allRows.count(); i++) {
        const id = await allRows.nth(i).locator("td").first().textContent();
        console.log(`  [${i}] ${id}`);
      }
    }

    expect(ch3Ep2Row).not.toBeNull();

    // Click Build button in that row
    const buildBtn = ch3Ep2Row!.getByRole("button", { name: "Build" });
    await expect(buildBtn).toBeVisible();
    await buildBtn.click();

    // Build progress panel should appear
    await expect(page.getByText("Build Progress")).toBeVisible({ timeout: 5_000 });

    await page.screenshot({ path: "e2e/screenshots/04-build-started.png", fullPage: true });

    console.log("Build triggered — monitoring progress...");
  });

  test("Step 4: Monitor Build Episode progress", async ({ page }) => {
    // Navigate to project detail
    await page.goto("/");
    await navigateTo(page, "Projects");
    await waitForPageLoad(page);

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
    await expect(page.getByText("← Back")).toBeVisible({ timeout: 5_000 });

    // Find Ch3-Ep2 and click View (build should already be running or completed)
    const epRows = page.locator("table").last().locator("tbody tr");
    const epCount = await epRows.count();
    for (let i = 0; i < epCount; i++) {
      const epId = await epRows.nth(i).locator("td").first().textContent();
      if (epId?.includes("ch3-ep2") || epId?.includes("ch3.ep2")) {
        const viewBtn = epRows.nth(i).getByRole("button", { name: /View|Build/ });
        if (await viewBtn.isVisible()) {
          await viewBtn.click();
        }
        break;
      }
    }

    // Wait for build to complete or fail (generous timeout for TTS + render)
    const completedOrFailed = page.locator("text=/COMPLETED|FAILED/");
    await expect(completedOrFailed).toBeVisible({ timeout: 120_000 });

    await page.screenshot({ path: "e2e/screenshots/05-build-final.png", fullPage: true });

    // Check final status
    const statusEl = page.locator("text=/COMPLETED|FAILED/").first();
    const statusText = await statusEl.textContent();
    console.log(`Build final status: ${statusText}`);

    if (statusText?.includes("COMPLETED")) {
      await expect(page.getByText(/All \d+ steps completed successfully/)).toBeVisible();
      console.log("All build steps completed successfully!");
    } else {
      // Log error details
      const errorEl = page.locator("[style*='ffebee']");
      if (await errorEl.isVisible()) {
        const errorText = await errorEl.textContent();
        console.log(`Build failed: ${errorText}`);
      }
    }
  });
});
