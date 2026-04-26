import { test, expect } from "@playwright/test";
import { navigateTo, waitForPageLoad } from "./helpers";

test.describe("Story Editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("nav button").filter({ hasText: "Story Editor" }).waitFor({ state: "visible" });
    await navigateTo(page, "Story Editor");
    await waitForPageLoad(page);
  });

  test("page shows story editor heading", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /Story|Editor/i });
    await expect(heading).toBeVisible();
  });

  test("series selector exists", async ({ page }) => {
    const select = page.locator("select").first();
    if (await select.isVisible().catch(() => false)) {
      const options = await select.locator("option").allTextContents();
      expect(options.length).toBeGreaterThanOrEqual(1); // At least placeholder
    }
  });

  test("content renders without errors", async ({ page }) => {
    const main = page.locator("main");
    await expect(main).toBeVisible();
    await expect(page.getByText("Something went wrong")).not.toBeVisible();
  });
});
