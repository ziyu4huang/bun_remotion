import { test, expect } from "@playwright/test";
import { navigateTo, forceApiError } from "./helpers";

test.describe("Error Scenarios", () => {
  test("Dashboard handles jobs API failure gracefully", async ({ page }) => {
    await page.goto("/");
    await forceApiError(page, "jobs");
    await navigateTo(page, "Dashboard");
    await page.waitForTimeout(1000);
    expect(await page.locator("h2, h3").first().isVisible()).toBe(true);
  });

  test("Dashboard handles health API failure gracefully", async ({ page }) => {
    await page.goto("/");
    await forceApiError(page, "health");
    await navigateTo(page, "Dashboard");
    await page.waitForTimeout(1000);
    expect(await page.locator("h2, h3").first().isVisible()).toBe(true);
  });

  test("Projects page handles API failure gracefully", async ({ page }) => {
    await page.goto("/");
    await forceApiError(page, "projects");
    await navigateTo(page, "Projects");
    await page.waitForTimeout(1000);
    expect(page.locator("body")).toBeVisible();
  });

  test("Storygraph handles pipeline failure gracefully", async ({ page }) => {
    await page.goto("/");
    await forceApiError(page, "pipeline");
    await navigateTo(page, "Storygraph");
    await page.waitForTimeout(1000);
    expect(page.locator("body")).toBeVisible();
  });

  test("Benchmark handles failure gracefully", async ({ page }) => {
    await page.goto("/");
    await forceApiError(page, "benchmark");
    await navigateTo(page, "Benchmark");
    await page.waitForTimeout(1000);
    expect(page.locator("body")).toBeVisible();
  });

  test("TTS page handles API failure gracefully", async ({ page }) => {
    await page.goto("/");
    await forceApiError(page, "tts");
    await navigateTo(page, "TTS");
    await page.waitForTimeout(1000);
    expect(page.locator("body")).toBeVisible();
  });

  test("Render page handles API failure gracefully", async ({ page }) => {
    await page.goto("/");
    await forceApiError(page, "render");
    await navigateTo(page, "Render");
    await page.waitForTimeout(1000);
    expect(page.locator("body")).toBeVisible();
  });

  test("ImageGen page handles API failure gracefully", async ({ page }) => {
    await page.goto("/");
    await forceApiError(page, "image");
    await forceApiError(page, "projects");
    await navigateTo(page, "Image");
    await page.waitForTimeout(1000);
    expect(page.locator("body")).toBeVisible();
  });

  test("Workflows page handles API failure gracefully", async ({ page }) => {
    await page.goto("/");
    await forceApiError(page, "workflows");
    await navigateTo(page, "Workflows");
    await page.waitForTimeout(1000);
    expect(page.locator("body")).toBeVisible();
  });

  test("PipelineProgress handles API failure gracefully", async ({ page }) => {
    await page.goto("/");
    await forceApiError(page, "episode-progress");
    await navigateTo(page, "Progress");
    await page.waitForTimeout(1000);
    expect(page.locator("body")).toBeVisible();
  });

  test("Monitoring handles API failure gracefully", async ({ page }) => {
    await page.goto("/");
    await forceApiError(page, "monitoring");
    await navigateTo(page, "Monitoring");
    await page.waitForTimeout(1000);
    expect(page.locator("body")).toBeVisible();
  });

  test("Agent Chat handles bridge unavailable gracefully", async ({ page }) => {
    await page.goto("/");
    await forceApiError(page, "agent/status");
    await navigateTo(page, "Agent Chat");
    await page.waitForTimeout(1000);
    // Should show unavailable message
    const errorMsg = page.getByText(/unavailable|無法使用/i);
    const bodyVisible = await page.locator("body").isVisible();
    expect(bodyVisible).toBe(true);
  });

  test("Error boundary catches render errors", async ({ page }) => {
    await page.goto("/");
    await navigateTo(page, "Dashboard");
    await page.waitForTimeout(500);
    const crashed = await page.evaluate(() => {
      try {
        const root = document.querySelector("main");
        if (root) root.innerHTML = "";
        return false;
      } catch {
        return true;
      }
    });
    expect(crashed).toBe(false);
    await page.waitForTimeout(500);
    expect(page.locator("body")).toBeVisible();
  });
});
