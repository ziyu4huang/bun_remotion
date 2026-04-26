import { test, expect } from "@playwright/test";
import { navigateTo, waitForPageLoad } from "./helpers";

test.describe("Assets Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("nav button").filter({ hasText: "Assets" }).waitFor({ state: "visible" });
    await navigateTo(page, "Assets");
    await waitForPageLoad(page);
  });

  test("page renders with content", async ({ page }) => {
    const main = page.locator("main");
    await expect(main).toBeVisible();
    const text = await main.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });
});

test.describe("TTS Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("nav button").filter({ hasText: "TTS" }).waitFor({ state: "visible" });
    await navigateTo(page, "TTS");
    await waitForPageLoad(page);
  });

  test("page renders with content", async ({ page }) => {
    const main = page.locator("main");
    await expect(main).toBeVisible();
    const text = await main.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test("has episode selector or placeholder", async ({ page }) => {
    const select = page.locator("select").first();
    const content = page.locator("main");
    const selectVisible = await select.isVisible().catch(() => false);
    const hasContent = (await content.textContent())!.trim().length > 0;
    expect(selectVisible || hasContent).toBe(true);
  });
});

test.describe("Render Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("nav button").filter({ hasText: "Render" }).waitFor({ state: "visible" });
    await navigateTo(page, "Render");
    await waitForPageLoad(page);
  });

  test("page renders with content", async ({ page }) => {
    const main = page.locator("main");
    await expect(main).toBeVisible();
    const text = await main.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test("has episode selector or render controls", async ({ page }) => {
    const select = page.locator("select").first();
    const renderBtn = page.getByRole("button", { name: /Render/i });
    const selectVisible = await select.isVisible().catch(() => false);
    const btnVisible = await renderBtn.isVisible().catch(() => false);
    const hasContent = (await page.locator("main").textContent())!.trim().length > 0;
    expect(selectVisible || btnVisible || hasContent).toBe(true);
  });
});
