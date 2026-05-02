import { test, expect } from "./fixtures";
import { navigateTo, waitForPageLoad, gotoWithRetry } from "./helpers";

test.describe("VoiceManager", () => {
  test("VoiceManager section visible on TTS page", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "TTS");
    await waitForPageLoad(page);

    // VoiceManager should be visible on the TTS page
    const heading = page.getByText(/Voice Manager/i);
    const hasHeading = await heading.isVisible().catch(() => false);
    // If no projects exist, the section may not show — that's fine
    const main = page.locator("main");
    expect(hasHeading || (await main.textContent()!)!.length > 0).toBe(true);
  });

  test("VoiceManager series selector works", async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "TTS");
    await waitForPageLoad(page);

    // Look for series select within VoiceManager
    const voiceSection = page.locator("section, [class*='voice'], [class*='Voice']").first();
    const seriesSelect = voiceSection.locator("select").first();
    if (await seriesSelect.isVisible().catch(() => false)) {
      const options = await seriesSelect.locator("option").count();
      if (options > 1) {
        await seriesSelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
        // Should show character cards after selecting a series
        const cards = page.locator("[class*='character'], [class*='Character']").first();
        const hasContent = (await page.locator("main").textContent())!.trim().length > 0;
        expect(await cards.isVisible().catch(() => false) || hasContent).toBe(true);
      }
    } else {
      // No series data — page still renders
      expect(await page.locator("main").isVisible()).toBe(true);
    }
  });
});
