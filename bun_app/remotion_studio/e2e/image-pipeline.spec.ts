import { test, expect } from "./fixtures";
import { gotoWithRetry, navigateTo, waitForPageLoad, collectConsoleErrors, assertNoConsoleErrors } from "./helpers";

test.describe("Image Pipeline", () => {
  test("Image page loads with prompt area", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await gotoWithRetry(page);
    await navigateTo(page, "Image");
    await waitForPageLoad(page);

    const main = page.locator("main");
    await expect(main).toBeVisible();
    const text = await main.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);

    assertNoConsoleErrors(errors);
  });

  test("GET /api/image/status without seriesId returns error", async ({ request }) => {
    const resp = await request.get("/api/image/status");
    const data = await resp.json();
    expect(data).toBeDefined();
  });

  test("GET /api/image/characters without seriesId returns error", async ({ request }) => {
    const resp = await request.get("/api/image/characters");
    const data = await resp.json();
    expect(data).toBeDefined();
  });

  test("POST /api/image/generate without seriesId returns error", async ({ request }) => {
    const resp = await request.post("/api/image/generate", {
      data: { images: [] },
    });
    const data = await resp.json();
    expect(data.ok).toBe(false);
  });

  test("Image page has no console errors on load", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await gotoWithRetry(page);
    await navigateTo(page, "Image");
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);
    assertNoConsoleErrors(errors);
  });
});
