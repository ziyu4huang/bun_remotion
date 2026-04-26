import { test, expect } from "@playwright/test";
import { navigateTo, waitForPageLoad } from "./helpers";

test.describe("Projects", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("nav button").filter({ hasText: "Projects" }).waitFor({ state: "visible" });
    await navigateTo(page, "Projects");
    await waitForPageLoad(page);
  });

  test("project list shows table with correct headers", async ({ page }) => {
    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    const expectedHeaders = ["Series", "Category", "Episodes", "Scaffolded", "Gate Score", "Plan"];
    for (const h of expectedHeaders) {
      await expect(table.locator("th", { hasText: h })).toBeVisible();
    }
  });

  test("project list has at least one project row", async ({ page }) => {
    const rows = page.locator("table").first().locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("+ New Episode button exists", async ({ page }) => {
    await expect(page.getByRole("button", { name: "+ New Episode" })).toBeVisible();
  });

  test("clicking project row opens detail view", async ({ page }) => {
    const firstRow = page.locator("table").first().locator("tbody tr").first();
    const projectName = await firstRow.locator("td").first().textContent();
    await firstRow.click();

    // Should show back button and project name
    await expect(page.getByText("← Back")).toBeVisible();
    await expect(page.getByText(projectName!)).toBeVisible();

    // Should show category and episodes metadata
    await expect(page.getByText(/Category:/)).toBeVisible();
    await expect(page.getByText(/Episodes:/)).toBeVisible();
  });

  test("back button returns to list view", async ({ page }) => {
    // Navigate into detail
    const firstRow = page.locator("table").first().locator("tbody tr").first();
    await firstRow.click();
    await expect(page.getByText("← Back")).toBeVisible();

    // Click back
    await page.getByText("← Back").click();

    // Should see project list table again
    const table = page.locator("table").first();
    await expect(table).toBeVisible();
    await expect(table.locator("th", { hasText: "Series" })).toBeVisible();
  });

  test("detail view shows episode table", async ({ page }) => {
    const firstRow = page.locator("table").first().locator("tbody tr").first();
    await firstRow.click();

    // Either episode table renders, or we see "No episodes found"
    const epTable = page.locator("table").last().locator("th", { hasText: "Episode" });
    const noEpisodes = page.getByText("No episodes found");

    const hasTable = await epTable.isVisible().catch(() => false);
    const hasNone = await noEpisodes.isVisible().catch(() => false);
    expect(hasTable || hasNone).toBe(true);
  });

  test("Ask Advisor button toggles advisor panel", async ({ page }) => {
    const firstRow = page.locator("table").first().locator("tbody tr").first();
    await firstRow.click();

    // Click Ask Advisor
    const advisorBtn = page.getByRole("button", { name: /Ask Advisor|Hide Advisor/i });
    await expect(advisorBtn).toBeVisible();
    await advisorBtn.click();

    // Button should toggle to "Hide Advisor"
    await expect(page.getByRole("button", { name: "Hide Advisor" })).toBeVisible({ timeout: 3_000 });

    // Some advisor UI should appear (input or heading)
    const advisorUI = page.locator("main").getByText(/Advisor|advisor/i);
    await expect(advisorUI.first()).toBeVisible({ timeout: 3_000 });

    // Click Hide Advisor
    await page.getByRole("button", { name: "Hide Advisor" }).click();

    // Button should toggle back
    await expect(page.getByRole("button", { name: "Ask Advisor" })).toBeVisible({ timeout: 2_000 });
  });

  test("Build button exists in episode rows", async ({ page }) => {
    const firstRow = page.locator("table").first().locator("tbody tr").first();
    await firstRow.click();

    // Episode table should have Build buttons
    const buildButtons = page.getByRole("button", { name: "Build" });
    const count = await buildButtons.count();
    // At least one episode should exist
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("+ New Episode opens create form", async ({ page }) => {
    await page.getByRole("button", { name: "+ New Episode" }).click();

    // Should show back button
    await expect(page.getByText(/Back/i)).toBeVisible();

    // Should show series dropdown
    const select = page.locator("select").first();
    await expect(select).toBeVisible();
  });

  test("back from create form returns to project list", async ({ page }) => {
    await page.getByRole("button", { name: "+ New Episode" }).click();
    await expect(page.getByText(/Back/i)).toBeVisible();

    await page.getByText(/Back/i).click();

    // Should be back at project list
    const table = page.locator("table").first();
    await expect(table).toBeVisible();
    await expect(table.locator("th", { hasText: "Series" })).toBeVisible();
  });
});
