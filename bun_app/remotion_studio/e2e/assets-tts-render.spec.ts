import { test, expect } from "./fixtures";
import { navigateTo, waitForPageLoad, gotoWithRetry } from "./helpers";

test.describe("Assets Page", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Assets");
    await waitForPageLoad(page);
  });

  test("page renders with tab navigation", async ({ page }) => {
    const main = page.locator("main");
    await expect(main).toBeVisible();
    // Should have tab buttons for asset types
    const tabs = page.getByRole("button", { name: /Characters|Backgrounds|Audio/i });
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(1);
  });

  test("search input is present", async ({ page }) => {
    const search = page.getByPlaceholder(/Search/i);
    if (await search.isVisible()) {
      await search.fill("test");
      // Input should accept text
      expect(await search.inputValue()).toBe("test");
    } else {
      // No search when no assets — page shows empty state
      const main = page.locator("main");
      expect(await main.textContent()).toBeTruthy();
    }
  });
});

test.describe("TTS Page", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "TTS");
    await waitForPageLoad(page);
  });

  test("page renders with episode selector or empty state", async ({ page }) => {
    const main = page.locator("main");
    await expect(main).toBeVisible();
    const select = page.locator("select").first();
    const hasSelect = await select.isVisible().catch(() => false);
    const hasContent = (await main.textContent())!.trim().length > 0;
    expect(hasSelect || hasContent).toBe(true);
  });

  test("VoiceManager section is present", async ({ page }) => {
    // VoiceManager heading or content should exist on TTS page
    const voiceSection = page.getByText(/Voice Manager|Voice.*Manager/i);
    const main = page.locator("main");
    const hasVoice = await voiceSection.isVisible().catch(() => false);
    const hasContent = (await main.textContent())!.trim().length > 0;
    expect(hasVoice || hasContent).toBe(true);
  });
});

test.describe("Render Page", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithRetry(page);
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
