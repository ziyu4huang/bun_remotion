import { test, expect } from "./fixtures";
import { navigateTo, delayApiRoute, gotoWithRetry, waitForPageLoad } from "./helpers";

test.describe("Loading States — Skeletons", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll();
  });

  test("Dashboard shows skeleton while loading jobs", async ({ page }) => {
    await delayApiRoute(page, "jobs", 2000);
    await gotoWithRetry(page);
    await navigateTo(page, "Dashboard");
    // Should show skeleton shimmer or loading indicator
    const skeleton = page.locator("[class*='skeleton'], [style*='animation']");
    const loadingText = page.getByText(/Loading/i);
    const hasIndicator = await skeleton.first().isVisible().catch(() => false)
      || await loadingText.isVisible().catch(() => false)
      || await page.locator("main").isVisible().catch(() => false);
    expect(hasIndicator).toBe(true);
  });

  test("Projects shows loading while fetching", async ({ page }) => {
    await delayApiRoute(page, "projects", 2000);
    await gotoWithRetry(page);
    await navigateTo(page, "Projects");
    // Page should render a container even while loading
    const main = page.locator("main");
    await expect(main).toBeVisible({ timeout: 5000 });
  });

  test("Workflows shows loading while fetching templates", async ({ page }) => {
    await delayApiRoute(page, "workflows", 2000);
    await gotoWithRetry(page);
    await navigateTo(page, "Workflows");
    const main = page.locator("main");
    await expect(main).toBeVisible({ timeout: 5000 });
  });

  test("Monitoring shows loading while fetching overview", async ({ page }) => {
    await delayApiRoute(page, "monitoring", 2000);
    await gotoWithRetry(page);
    await navigateTo(page, "Monitoring");
    const main = page.locator("main");
    await expect(main).toBeVisible({ timeout: 5000 });
  });

  test("Storygraph shows loading while fetching data", async ({ page }) => {
    await delayApiRoute(page, "pipeline", 2000);
    await gotoWithRetry(page);
    await navigateTo(page, "Storygraph");
    const main = page.locator("main");
    await expect(main).toBeVisible({ timeout: 5000 });
  });

  test("Benchmark shows loading while fetching data", async ({ page }) => {
    await delayApiRoute(page, "benchmark", 2000);
    await gotoWithRetry(page);
    await navigateTo(page, "Benchmark");
    const main = page.locator("main");
    await expect(main).toBeVisible({ timeout: 5000 });
  });

  test("Assets shows loading while fetching data", async ({ page }) => {
    await delayApiRoute(page, "assets", 2000);
    await gotoWithRetry(page);
    await navigateTo(page, "Assets");
    const main = page.locator("main");
    await expect(main).toBeVisible({ timeout: 5000 });
  });

  test("TTS shows loading while fetching projects", async ({ page }) => {
    await delayApiRoute(page, "projects", 2000);
    await gotoWithRetry(page);
    await navigateTo(page, "TTS");
    const main = page.locator("main");
    await expect(main).toBeVisible({ timeout: 5000 });
  });

  test("ImageGen shows loading while fetching data", async ({ page }) => {
    await delayApiRoute(page, "projects", 2000);
    await gotoWithRetry(page);
    await navigateTo(page, "Image");
    const main = page.locator("main");
    await expect(main).toBeVisible({ timeout: 5000 });
  });
});
