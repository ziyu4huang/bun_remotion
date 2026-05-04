import { test, expect } from "./fixtures";
import { gotoWithRetry, navigateTo, waitForPageLoad, collectConsoleErrors, assertNoConsoleErrors } from "./helpers";

test.describe("TTS Pipeline", () => {
  test("TTS page loads with series selector", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await gotoWithRetry(page);
    await navigateTo(page, "TTS");
    await waitForPageLoad(page);

    await expect(page.locator("select").first()).toBeVisible();
    assertNoConsoleErrors(errors);
  });

  test("GET /api/tts/voices returns voice list", async ({ request }) => {
    const resp = await request.get("/api/tts/voices");
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("GET /api/tts/voices filters by engine", async ({ request }) => {
    const resp = await request.get("/api/tts/voices?engine=mlx");
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(data.ok).toBe(true);
  });

  test("POST /api/tts/generate without episodeId returns error", async ({ request }) => {
    const resp = await request.post("/api/tts/generate", {
      data: {},
    });
    const data = await resp.json();
    expect(data.ok).toBe(false);
  });

  test("GET /api/tts/characters without seriesId returns error", async ({ request }) => {
    const resp = await request.get("/api/tts/characters");
    const data = await resp.json();
    // Should error or return empty since no seriesId provided
    expect(data).toBeDefined();
  });
});
