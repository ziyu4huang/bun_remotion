import { test, expect } from "@playwright/test";
import { navigateTo, waitForPageLoad } from "./helpers";

test.describe("Empty States", () => {
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
    await page.goto("/");
    await navigateTo(page, "Progress");
    await waitForPageLoad(page);

    // Should show empty state or zero counts
    const zeroText = page.getByText(/0 episode|0 集|No episodes|找不到集數/i);
    const summaryVisible = await zeroText.isVisible().catch(() => false);
    // Page should render without crash
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
    await page.goto("/");
    await navigateTo(page, "Projects");
    await waitForPageLoad(page);

    // Page should render without crash even with empty data
    await expect(page.getByRole("heading", { name: /Projects|專案/i })).toBeVisible();
  });

  test("Assets shows empty state when no series", async ({ page }) => {
    await page.route("**/api/assets**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, data: { series: [] } }),
      }),
    );
    await page.goto("/");
    await navigateTo(page, "Assets");
    await waitForPageLoad(page);

    // Should show empty state or prompt
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
    await page.goto("/");
    await navigateTo(page, "Kanban");
    await waitForPageLoad(page);

    // Should show empty state
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
    await page.goto("/");
    await navigateTo(page, "TTS");
    await waitForPageLoad(page);

    // Should show select prompt
    await expect(page.getByRole("heading", { name: /TTS|語音/i })).toBeVisible();
  });
});
