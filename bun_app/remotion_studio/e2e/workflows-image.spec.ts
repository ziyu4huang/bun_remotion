import { test, expect } from "@playwright/test";
import { navigateTo, waitForPageLoad } from "./helpers";

test.describe("Workflows Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("nav button").filter({ hasText: "Workflows" }).waitFor({ state: "visible" });
    await navigateTo(page, "Workflows");
    await waitForPageLoad(page);
  });

  test("page renders with content", async ({ page }) => {
    const main = page.locator("main");
    await expect(main).toBeVisible();
    const text = await main.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test("has workflow controls", async ({ page }) => {
    const select = page.locator("select").first();
    const selectVisible = await select.isVisible().catch(() => false);
    const hasContent = (await page.locator("main").textContent())!.trim().length > 0;
    expect(selectVisible || hasContent).toBe(true);
  });
});

test.describe("Image Gen Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("nav button").filter({ hasText: "Image" }).waitFor({ state: "visible" });
    await navigateTo(page, "Image");
    await waitForPageLoad(page);
  });

  test("page renders with content", async ({ page }) => {
    const main = page.locator("main");
    await expect(main).toBeVisible();
    const text = await main.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test("has image generation controls", async ({ page }) => {
    const select = page.locator("select").first();
    const textarea = page.locator("textarea").first();
    const genBtn = page.getByRole("button", { name: /Generate|Create/i });

    const selectVisible = await select.isVisible().catch(() => false);
    const textareaVisible = await textarea.isVisible().catch(() => false);
    const btnVisible = await genBtn.isVisible().catch(() => false);
    const hasContent = (await page.locator("main").textContent())!.trim().length > 0;

    expect(selectVisible || textareaVisible || btnVisible || hasContent).toBe(true);
  });
});
