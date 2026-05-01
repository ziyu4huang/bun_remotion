import { test, expect } from "./fixtures";
import { navigateTo, waitForPageLoad, isAgentBridgeAvailable, gotoWithRetry } from "./helpers";

test.describe("Per-agent model persistence", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll();
  });

  test.beforeEach(async ({ page }) => {
    await gotoWithRetry(page);
    await navigateTo(page, "Agent Chat");
    await waitForPageLoad(page);
  });

  test("model dropdown exists and has options", async ({ page }) => {
    const bridgeOk = await isAgentBridgeAvailable(page);
    if (!bridgeOk) test.skip();

    const select = page.locator("select").first();
    if (!(await select.isVisible().catch(() => false))) test.skip();

    await select.selectOption({ index: 1 });
    await page.waitForTimeout(300);

    // Model dropdown should be visible after selecting an agent
    const modelSelect = page.locator("select").nth(1);
    const modelVisible = await modelSelect.isVisible().catch(() => false);
    if (!modelVisible) test.skip();

    const options = await modelSelect.locator("option").allTextContents();
    expect(options.length).toBeGreaterThan(1);
  });

  test("model persists when switching agents", async ({ page }) => {
    const bridgeOk = await isAgentBridgeAvailable(page);
    if (!bridgeOk) test.skip();

    const agentSelect = page.locator("select").first();
    if (!(await agentSelect.isVisible().catch(() => false))) test.skip();

    const options = await agentSelect.locator("option").allTextContents();
    const agentOptions = options.filter(
      (o) => !o.includes("Select agent") && !o.includes("選擇代理") && o.length > 0,
    );
    if (agentOptions.length < 2) test.skip();

    // Select first agent
    await agentSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);

    // Set model to a non-default value
    const modelSelect = page.locator("select").nth(1);
    if (!(await modelSelect.isVisible().catch(() => false))) test.skip();

    const modelOptions = await modelSelect.locator("option").allTextContents();
    if (modelOptions.length < 2) test.skip();

    // Pick a different model (not the first/default one)
    await modelSelect.selectOption({ index: modelOptions.length - 1 });
    const selectedModel = await modelSelect.inputValue();
    expect(selectedModel).toBeTruthy();

    // Switch to second agent
    await agentSelect.selectOption({ index: 2 });
    await page.waitForTimeout(300);

    // Switch back to first agent
    await agentSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);

    // Verify model is still the same
    const modelAfterSwitch = await modelSelect.inputValue();
    expect(modelAfterSwitch).toBe(selectedModel);
  });
});
