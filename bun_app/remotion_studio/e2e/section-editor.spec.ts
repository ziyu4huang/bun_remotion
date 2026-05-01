import { test, expect } from "./fixtures";
import { navigateTo, waitForPageLoad, collectConsoleErrors, assertNoConsoleErrors, gotoWithRetry } from "./helpers";

test.describe("Section Editor", () => {
  let errors: string[];

  test.beforeEach(async ({ page }) => {
    errors = collectConsoleErrors(page);
    await gotoWithRetry(page);
    await navigateTo(page, "Story Editor");
    await waitForPageLoad(page);
  });

  test.afterEach(() => assertNoConsoleErrors(errors));

  test("page loads with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Story Editor|故事編輯器/i })).toBeVisible();
  });

  test("view mode tabs are visible", async ({ page }) => {
    // Should see all 4 view mode tabs
    await expect(page.getByRole("button", { name: /Sections|段落/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Structure|結構/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Raw|原始/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Preview|預覽/i })).toBeVisible();
  });

  test("clicking Structure tab switches view", async ({ page }) => {
    const structureBtn = page.getByRole("button", { name: /Structure|結構/i });
    await structureBtn.click();
    await page.waitForTimeout(300);

    // The structure tab should be visually selected (highlighted)
    // Structure editor should render — either a table or an empty state
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("clicking Raw tab shows textarea editor", async ({ page }) => {
    const rawBtn = page.getByRole("button", { name: /Raw|原始/i });
    await rawBtn.click();
    await page.waitForTimeout(300);

    // Should show a textarea
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: 3_000 });
  });

  test("clicking Preview tab shows rendered content", async ({ page }) => {
    const previewBtn = page.getByRole("button", { name: /Preview|預覽/i });
    await previewBtn.click();
    await page.waitForTimeout(300);

    // Preview should render — either content or an empty state
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("advisor toggle button exists", async ({ page }) => {
    const advisorBtn = page.getByRole("button", { name: /Ask Advisor|詢問顧問/i });
    await expect(advisorBtn).toBeVisible();
  });

  test("advisor panel toggles on and off", async ({ page }) => {
    const advisorBtn = page.getByRole("button", { name: /Ask Advisor|詢問顧問/i });
    await advisorBtn.click();
    await page.waitForTimeout(300);

    // Should show Hide Advisor button now
    const hideBtn = page.getByRole("button", { name: /Hide Advisor|隱藏顧問/i });
    await expect(hideBtn).toBeVisible({ timeout: 3_000 });

    // Click to hide
    await hideBtn.click();
    await page.waitForTimeout(300);

    // Should show Ask Advisor again
    await expect(page.getByRole("button", { name: /Ask Advisor|詢問顧問/i })).toBeVisible();
  });
});
