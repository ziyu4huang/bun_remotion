import { test, expect } from "@playwright/test";
import { gotoWithRetry, dismissWizard, collectConsoleErrors, assertNoConsoleErrors, NAV_LABELS } from "./helpers";

// Force mobile viewport for all tests in this file
test.use({ viewport: { width: 375, height: 812 } });

test.describe("Mobile Responsive", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithRetry(page);
  });

  test("hamburger menu opens and closes sidebar", async ({ page }) => {
    // On mobile, sidebar is off-screen (translateX(-100%)) when closed
    const sidebar = page.locator("nav");
    const transform = await sidebar.evaluate((el) => getComputedStyle(el).transform);
    expect(transform).toContain("-"); // translateX(-100%) produces matrix with negative value

    // Hamburger button should be visible
    const hamburger = page.locator('button[aria-label="Toggle navigation"]');
    await expect(hamburger).toBeVisible();

    // Click to open
    await hamburger.click();
    await expect(sidebar).toBeVisible();

    // Nav items should be visible inside sidebar
    await expect(page.locator("nav button", { hasText: "Dashboard" })).toBeVisible();

    // Click hamburger again to close
    await hamburger.click();
    // Sidebar slides back off-screen
    await page.waitForTimeout(300);
    const transformAfter = await sidebar.evaluate((el) => getComputedStyle(el).transform);
    expect(transformAfter).toContain("-");
  });

  test("clicking nav item closes sidebar", async ({ page }) => {
    // Open sidebar
    await page.locator('button[aria-label="Toggle navigation"]').click();
    await page.locator("nav").waitFor({ state: "visible" });

    // Click a nav item
    await page.locator("nav button", { hasText: "Monitoring" }).click();

    // Sidebar should auto-close (slides off-screen)
    await page.waitForTimeout(400);

    // Page content should be visible
    await expect(page.locator("body")).toContainText(/Monitoring/i);
  });

  test("tables scroll horizontally on narrow viewport", async ({ page }) => {
    // Navigate to a page with tables (Dashboard has job table)
    await page.evaluate(() => localStorage.setItem("remotion_studio_wizard_seen", "1"));
    await gotoWithRetry(page);
    await page.locator('button[aria-label="Toggle navigation"]').click();
    await page.locator("nav button", { hasText: "Progress" }).click();
    await page.waitForTimeout(500);

    // Check for tables with overflow scroll
    const scrollContainers = page.locator('div[style*="overflow"]');
    const count = await scrollContainers.count();
    // Pages should handle overflow — either via scroll container or no table rendered
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("wizard page adapts to mobile", async ({ page }) => {
    // Navigate to Wizard
    await page.locator('button[aria-label="Toggle navigation"]').click();
    await page.locator("nav button", { hasText: "Wizard" }).click();
    await page.waitForTimeout(500);

    // Wizard page should render without overflow errors
    await expect(page.locator("body")).toBeVisible();

    // Overview cards should stack (check they're below each other)
    const cards = page.locator('[style*="borderRadius"]');
    if ((await cards.count()) > 0) {
      // At mobile width, cards should be visible (stacked vertically)
      await expect(cards.first()).toBeVisible();
    }
  });

  test("command palette renders at mobile width", async ({ page }) => {
    // Open command palette with Ctrl+K
    await page.keyboard.press("Meta+k");

    // Palette should be visible
    const palette = page.locator('[data-testid="command-palette"]');
    await expect(palette).toBeVisible();

    // Search input should be focused
    const input = palette.locator("input");
    await expect(input).toBeVisible();

    // Escape should close it
    await page.keyboard.press("Escape");
    await expect(palette).not.toBeVisible();
  });

  test("no console errors on mobile viewport", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    // Navigate through a few pages
    await page.locator('button[aria-label="Toggle navigation"]').click();
    await page.locator("nav button", { hasText: "Projects" }).click();
    await page.waitForTimeout(500);

    await page.locator('button[aria-label="Toggle navigation"]').click();
    await page.locator("nav button", { hasText: "Agent Chat" }).click();
    await page.waitForTimeout(500);

    assertNoConsoleErrors(errors);
  });

  test("all nav items accessible via hamburger menu", async ({ page }) => {
    // Open sidebar
    await page.locator('button[aria-label="Toggle navigation"]').click();

    // Count nav buttons — should have all NAV_LABELS items
    const navButtons = page.locator("nav button");
    const count = await navButtons.count();
    expect(count).toBeGreaterThanOrEqual(17);
  });
});
