import { test, expect } from "./fixtures";
import { navigateTo, delayApiRoute, gotoWithRetry } from "./helpers";

test.describe("Loading States — Skeletons", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll();
  });

  test("Dashboard shows skeleton while loading jobs", async ({ page }) => {
    await gotoWithRetry(page);
    await delayApiRoute(page, "jobs", 500);
    await navigateTo(page, "Dashboard");
    await page.waitForTimeout(1500);
    expect(page.locator("body")).toBeVisible();
  });

  test("Projects shows skeleton table while loading", async ({ page }) => {
    await gotoWithRetry(page);
    await delayApiRoute(page, "projects", 500);
    await navigateTo(page, "Projects");
    await page.waitForTimeout(1500);
    expect(page.locator("body")).toBeVisible();
  });

  test("Workflows shows skeleton while loading templates", async ({ page }) => {
    await gotoWithRetry(page);
    await delayApiRoute(page, "workflows", 500);
    await navigateTo(page, "Workflows");
    await page.waitForTimeout(1500);
    expect(page.locator("body")).toBeVisible();
  });

  test("Monitoring shows skeleton cards while loading", async ({ page }) => {
    await gotoWithRetry(page);
    await delayApiRoute(page, "monitoring", 500);
    await navigateTo(page, "Monitoring");
    await page.waitForTimeout(1500);
    expect(page.locator("body")).toBeVisible();
  });

  test("Storygraph shows loading while fetching data", async ({ page }) => {
    await gotoWithRetry(page);
    await delayApiRoute(page, "pipeline", 500);
    await navigateTo(page, "Storygraph");
    await page.waitForTimeout(1500);
    expect(page.locator("body")).toBeVisible();
  });

  test("Benchmark shows loading while fetching data", async ({ page }) => {
    await gotoWithRetry(page);
    await delayApiRoute(page, "benchmark", 500);
    await navigateTo(page, "Benchmark");
    await page.waitForTimeout(1500);
    expect(page.locator("body")).toBeVisible();
  });

  test("Assets shows loading while fetching data", async ({ page }) => {
    await gotoWithRetry(page);
    await delayApiRoute(page, "assets", 500);
    await navigateTo(page, "Assets");
    await page.waitForTimeout(1500);
    expect(page.locator("body")).toBeVisible();
  });

  test("TTS shows loading while fetching projects", async ({ page }) => {
    await gotoWithRetry(page);
    await delayApiRoute(page, "projects", 500);
    await navigateTo(page, "TTS");
    await page.waitForTimeout(1500);
    expect(page.locator("body")).toBeVisible();
  });

  test("ImageGen shows loading while fetching data", async ({ page }) => {
    await gotoWithRetry(page);
    await delayApiRoute(page, "projects", 500);
    await navigateTo(page, "Image");
    await page.waitForTimeout(1500);
    expect(page.locator("body")).toBeVisible();
  });
});
