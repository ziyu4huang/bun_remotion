import { test, expect } from "./fixtures";
import { gotoWithRetry, navigateTo, waitForPageLoad, collectConsoleErrors, assertNoConsoleErrors } from "./helpers";

test.describe("Storygraph Pipeline", () => {
  test("Storygraph page loads with series selector and mode buttons", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await gotoWithRetry(page);
    await navigateTo(page, "Storygraph");
    await waitForPageLoad(page);

    await expect(page.locator("select").first()).toBeVisible();
    await expect(page.getByText("Extract KG")).toBeVisible();
    await expect(page.getByText("Quality Gate")).toBeVisible();
    await expect(page.getByText("AI Score")).toBeVisible();

    assertNoConsoleErrors(errors);
  });

  test("mode selector switches between hybrid/regex/ai", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Storygraph");
    await waitForPageLoad(page);

    const modeSelect = page.locator("select").nth(1);
    await expect(modeSelect).toBeVisible();

    for (const mode of ["hybrid", "regex", "ai"]) {
      await modeSelect.selectOption(mode);
      await expect(modeSelect).toHaveValue(mode);
    }
  });

  test("GET /api/pipeline/status returns ok for known series", async ({ request }) => {
    // List projects first to get a real series ID
    const listResp = await request.get("/api/projects");
    expect(listResp.ok()).toBe(true);
    const projects = await listResp.json();
    if (!projects.data?.length) return;

    const seriesId = projects.data[0].id;
    const resp = await request.get(`/api/pipeline/status/${seriesId}`);
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(data.ok).toBe(true);
  });

  test("POST /api/pipeline/run without seriesId returns error", async ({ request }) => {
    const resp = await request.post("/api/pipeline/run", {
      data: {},
    });
    // Should fail or return error since no seriesId
    const data = await resp.json();
    expect(data.ok).toBe(false);
  });

  test("advisor panel opens and closes", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Storygraph");
    await waitForPageLoad(page);

    const advisorBtn = page.getByText("Ask Advisor");
    if (await advisorBtn.isVisible()) {
      await advisorBtn.click();
      // Advisor panel should appear
      await page.waitForTimeout(500);

      const hideBtn = page.getByText("Hide Advisor");
      if (await hideBtn.isVisible()) {
        await hideBtn.click();
        await page.waitForTimeout(300);
        await expect(advisorBtn).toBeVisible();
      }
    }
  });
});
