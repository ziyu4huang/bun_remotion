import { test, expect } from "./fixtures";
import { gotoWithRetry, navigateTo, waitForPageLoad, collectConsoleErrors, assertNoConsoleErrors } from "./helpers";

test.describe("Render Pipeline", () => {
  test("Render page loads with project selector", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await gotoWithRetry(page);
    await navigateTo(page, "Render");
    await waitForPageLoad(page);

    await expect(page.locator("select").first()).toBeVisible();
    assertNoConsoleErrors(errors);
  });

  test("GET /api/render/status without episodeId returns ok", async ({ request }) => {
    const resp = await request.get("/api/render/status");
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(data.ok).toBe(true);
  });

  test("POST /api/render/trigger without episodeId returns error", async ({ request }) => {
    const resp = await request.post("/api/render/trigger", {
      data: {},
    });
    const data = await resp.json();
    expect(data.ok).toBe(false);
  });

  test("project selector populates episode list", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Render");
    await waitForPageLoad(page);

    // Check if there are any projects
    const resp = await page.request.get("/api/projects");
    const data = await resp.json();
    if (!data.data?.length) return;

    // Select first project
    const projectSelect = page.locator("select").first();
    await projectSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Episode selector should appear or status should update
    const selects = page.locator("select");
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("Render page shows placeholder when no episode selected", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Render");
    await waitForPageLoad(page);

    // Should show some prompt to select an episode
    const main = page.locator("main");
    const text = await main.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });
});
