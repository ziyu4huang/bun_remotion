import { test, expect } from "./fixtures";
import { navigateTo, waitForPageLoad, gotoWithRetry } from "./helpers";

test.describe("Empty States", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll();
  });

  test("PipelineProgress shows empty state when no episodes", async ({ page }) => {
    await page.route("**/api/episode-progress**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            episodes: [],
            summary: { totalEpisodes: 0, completedEpisodes: 0, avgCompletion: 0, byStep: {} },
          },
        }),
      }),
    );
    await gotoWithRetry(page);
    await navigateTo(page, "Progress");
    await waitForPageLoad(page);

    await expect(page.getByRole("heading", { name: /Progress|進度/i })).toBeVisible();
  });

  test("Projects shows empty state when no projects", async ({ page }) => {
    await page.route("**/api/projects**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, data: [] }),
      }),
    );
    await gotoWithRetry(page);
    await navigateTo(page, "Projects");
    await waitForPageLoad(page);

    await expect(page.getByRole("heading", { name: /Projects|專案/i })).toBeVisible();
  });

  test("Assets shows empty state when no series", async ({ page }) => {
    await page.route("**/api/assets**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, data: [] }),
      }),
    );
    await gotoWithRetry(page);
    await navigateTo(page, "Assets");
    await waitForPageLoad(page);

    await expect(page.getByRole("heading", { name: /Assets|素材/i })).toBeVisible();
  });

  test("Kanban shows empty state when no episodes", async ({ page }) => {
    await page.route("**/api/episode-progress**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            episodes: [],
            summary: { totalEpisodes: 0, completedEpisodes: 0, avgCompletion: 0, byStep: {} },
          },
        }),
      }),
    );
    await gotoWithRetry(page);
    await navigateTo(page, "Kanban");
    await waitForPageLoad(page);

    await expect(page.getByRole("heading", { name: /Kanban|看板/i })).toBeVisible();
  });

  test("TTS shows empty state when no episodes scaffolded", async ({ page }) => {
    await page.route("**/api/projects**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, data: [{ seriesId: "test", name: "Test", category: "tech_explainer", episodes: [] }] }),
      }),
    );
    await gotoWithRetry(page);
    await navigateTo(page, "TTS");
    await waitForPageLoad(page);

    await expect(page.getByRole("heading", { name: /TTS|語音/i })).toBeVisible();
  });
});
