import { test, expect } from "@playwright/test";
import { navigateTo, waitForPageLoad } from "./helpers";

test.describe("Monitoring", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("nav button").filter({ hasText: "Monitoring" }).waitFor({ state: "visible" });
    await navigateTo(page, "Monitoring");
    await waitForPageLoad(page);
  });

  test("page shows monitoring heading", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /Monitor/i });
    await expect(heading).toBeVisible();
  });

  test("summary cards or content renders", async ({ page }) => {
    const main = page.locator("main");
    await expect(main).toBeVisible();
    const text = await main.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test("no console errors on monitoring page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.waitForTimeout(1000);
    const filtered = errors.filter(
      (e) => !e.includes("favicon.ico") && !e.includes("devtools") && !e.includes("React DevTools"),
    );
    expect(filtered).toHaveLength(0);
  });
});
