import { test, expect } from "@playwright/test";
import { navigateTo, NAV_LABELS } from "./helpers";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("nav button").filter({ hasText: "Dashboard" }).waitFor({ state: "visible" });
  });

  test("active page is highlighted in sidebar", async ({ page }) => {
    // Dashboard should be active by default
    const dashboardBtn = page.locator("nav button").filter({ hasText: "Dashboard" });
    const bg = await dashboardBtn.evaluate((el) => getComputedStyle(el).background);
    expect(bg).toContain("227, 242, 253");

    // Navigate to Projects — Dashboard should lose highlight, Projects should gain it
    await navigateTo(page, "Projects");
    const projectsBtn = page.locator("nav button").filter({ hasText: "Projects" });
    const projectsBg = await projectsBtn.evaluate((el) => getComputedStyle(el).background);
    expect(projectsBg).toContain("227, 242, 253");
  });

  test("switching between all pages produces no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    for (const label of NAV_LABELS) {
      await navigateTo(page, label);
      await page.waitForTimeout(300);
    }

    const filtered = errors.filter(
      (e) => !e.includes("favicon.ico") && !e.includes("devtools") && !e.includes("React DevTools"),
    );
    expect(filtered).toHaveLength(0);
  });

  test("page content changes when navigating", async ({ page }) => {
    // Each page should produce different main content
    const contents: string[] = [];

    for (const label of ["Dashboard", "Projects", "Storygraph"]) {
      await navigateTo(page, label);
      await page.waitForTimeout(500);
      const text = await page.locator("main").textContent();
      contents.push(text!.trim().slice(0, 50));
    }

    // Pages should have different content
    expect(new Set(contents).size).toBe(3);
  });
});
