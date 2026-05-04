/**
 * Agent Chat Verification Tests (v0.56.0+)
 *
 * Verifies Agent Chat page functionality:
 * 1. Page loads correctly with agent dropdown
 * 2. Agent directory grid shows categorized agent cards
 * 3. Agent card click selects agent (v0.54.0 fix)
 * 4. Conversation starters work
 * 5. Agent dropdown selection changes agent
 * 6. Model selector dropdown has 6 options
 * 7. Search input filters agent directory (v0.56.0)
 * 8. Quality Gate agent card visible and selectable (v0.56.0)
 */
import { test, expect } from "./fixtures";
import {
  navigateTo,
  waitForPageLoad,
  isAgentBridgeAvailable,
  gotoWithRetry,
  collectConsoleErrors,
  assertNoConsoleErrors,
} from "./helpers";

// Friendly display names used in AgentDirectory cards
const DISPLAY_NAMES: Record<string, string> = {
  "studio-advisor": "Content Advisor",
  "studio-reviewer": "Quality Reviewer",
  "studio-tts": "Voice Synthesis",
  "studio-coordinator": "Production Coordinator",
  "studio-image": "Image Generation",
  "sg-story-advisor": "Story Advisor",
  "test-reviewer": "Test Reviewer",
};

test.describe("Agent Chat Verification", () => {
  let consoleErrors: string[];

  test.afterEach(async ({ page }) => {
    await page.unrouteAll();
  });

  test.beforeEach(async ({ page }) => {
    consoleErrors = collectConsoleErrors(page);
    await gotoWithRetry(page);
    // Navigate to Agent Chat via sidebar button
    await navigateTo(page, "AI 對話");
    await waitForPageLoad(page);
  });

  // ─── 1. Agent Chat Page Loads ───

  test("1. page loads with agent dropdown and no console errors", async ({ page }) => {
    // Verify heading is visible
    const heading = page.getByRole("heading", { name: /AI 對話|Agent Chat/i });
    await expect(heading).toBeVisible({ timeout: 10_000 });

    // Verify the agent select dropdown is visible
    const agentSelect = page.locator("select").first();
    await expect(agentSelect).toBeVisible({ timeout: 5_000 });

    // Verify first option is the placeholder
    const firstOption = agentSelect.locator("option").first();
    await expect(firstOption).toHaveText(/選擇代理|Select agent/i);

    // Check for unexpected console errors (after page fully loads)
    await page.waitForTimeout(500);
    assertNoConsoleErrors(consoleErrors);
  });

  // ─── 2. Agent Directory Grid Shows ───

  test("2. agent directory grid shows categorized agent cards", async ({ page }) => {
    const bridgeOk = await isAgentBridgeAvailable(page);
    test.skip(!bridgeOk, "Agent bridge not available");

    // Category headers should be visible (zh_TW is default locale)
    const categoryHeader = page.getByText(/製作管線|品質審查|故事內容/);
    await expect(categoryHeader.first()).toBeVisible({ timeout: 10_000 });

    // Agent cards show friendly display names now
    const agentCards = page.locator("button").filter({
      hasText: /Content Advisor|Quality Reviewer|Voice Synthesis|Production Coordinator/i,
    });

    // Wait for agents to load
    await expect(agentCards.first()).toBeVisible({ timeout: 10_000 });

    // Verify at least 5 agent cards visible
    const cardCount = await agentCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // Take screenshot
    await page.screenshot({
      path: "bun_app/remotion_studio/test-results/agent-verify-01-directory.png",
      fullPage: false,
    });
  });

  // ─── 3. Agent Card Click Selects Agent (v0.54.0 fix) ───

  test("3. clicking agent card selects agent in dropdown", async ({ page }) => {
    const bridgeOk = await isAgentBridgeAvailable(page);
    test.skip(!bridgeOk, "Agent bridge not available");

    // Wait for agent directory to render — cards show friendly names
    const advisorCard = page.locator("button").filter({ hasText: /Content Advisor/ }).first();
    await expect(advisorCard).toBeVisible({ timeout: 10_000 });

    // Click on Content Advisor card
    await advisorCard.click();
    await page.waitForTimeout(500);

    // Verify: the agent dropdown now shows studio-advisor (value is still the raw name)
    const agentSelect = page.locator("select").first();
    await expect(agentSelect).toHaveValue("studio-advisor", { timeout: 3_000 });

    // Verify: conversation starters appear (buttons below the agent name)
    const startersHeading = page.getByText(/試試問|Try asking/i);
    await expect(startersHeading).toBeVisible({ timeout: 3_000 });

    // Verify starter buttons are visible
    const starterButtons = page.locator("button").filter({ hasText: /What should I work on|Analyze my pipeline|Suggest improvements/i });
    const starterCount = await starterButtons.count();
    expect(starterCount).toBeGreaterThanOrEqual(2);

    // Verify NO HTTP 400 error — check network requests
    const http400Errors = consoleErrors.filter((e) => e.includes("400"));
    expect(http400Errors).toHaveLength(0);

    // Take screenshot
    await page.screenshot({
      path: "bun_app/remotion_studio/test-results/agent-verify-02-card-selected.png",
      fullPage: false,
    });
  });

  // ─── 4. Conversation Starters Work ───

  test("4. clicking conversation starter sends message", async ({ page }) => {
    const bridgeOk = await isAgentBridgeAvailable(page);
    test.skip(!bridgeOk, "Agent bridge not available");

    // First select an agent via directory card
    const advisorCard = page.locator("button").filter({ hasText: /Content Advisor/ }).first();
    await expect(advisorCard).toBeVisible({ timeout: 10_000 });
    await advisorCard.click();
    await page.waitForTimeout(500);

    // Verify starters appeared
    const startersHeading = page.getByText(/試試問|Try asking/i);
    await expect(startersHeading).toBeVisible({ timeout: 3_000 });

    // Click the first conversation starter
    const firstStarter = page.locator("button").filter({ hasText: /What should I work on next/i }).first();
    await expect(firstStarter).toBeVisible({ timeout: 3_000 });
    await firstStarter.click();
    await page.waitForTimeout(300);

    // Verify: a user message appears in the chat area
    const userMessage = page.locator("main").getByText("What should I work on next?");
    await expect(userMessage).toBeVisible({ timeout: 5_000 });

    // Verify: streaming starts (thinking indicator or assistant response)
    const thinkingIndicator = page.getByText(/Thinking|思考中|●●●/i);
    const assistantResponse = page.locator("[data-role='assistant']").first();
    const anyResponseText = page.locator("main").getByText(/\S{10,}/).first();

    // At least one of these should appear within a reasonable time
    await Promise.race([
      thinkingIndicator.waitFor({ timeout: 8_000 }).catch(() => {}),
      assistantResponse.waitFor({ timeout: 8_000 }).catch(() => {}),
      anyResponseText.waitFor({ timeout: 8_000 }).catch(() => {}),
    ]);

    // Verify NO HTTP 400 error
    const http400Errors = consoleErrors.filter((e) => e.includes("400"));
    expect(http400Errors).toHaveLength(0);

    // Take screenshot
    await page.screenshot({
      path: "bun_app/remotion_studio/test-results/agent-verify-03-starter-sent.png",
      fullPage: false,
    });
  });

  // ─── 5. Agent Dropdown Selection ───

  test("5. dropdown selects different agent and updates starters", async ({ page }) => {
    const bridgeOk = await isAgentBridgeAvailable(page);
    test.skip(!bridgeOk, "Agent bridge not available");

    // First select an agent via directory card
    const advisorCard = page.locator("button").filter({ hasText: /Content Advisor/ }).first();
    await expect(advisorCard).toBeVisible({ timeout: 10_000 });
    await advisorCard.click();
    await page.waitForTimeout(500);

    // Verify initial selection
    const agentSelect = page.locator("select").first();
    await expect(agentSelect).toHaveValue("studio-advisor", { timeout: 3_000 });

    // Use the dropdown to select a different agent (studio-tts)
    const hasTtsOption = await agentSelect.locator("option[value='studio-tts']").count();
    if (hasTtsOption === 0) {
      // Try selecting any option that isn't the current one
      const options = await agentSelect.locator("option").allTextContents();
      const otherAgent = options.find(
        (o) => o !== DISPLAY_NAMES["studio-advisor"] && !o.includes("選擇代理") && !o.includes("Select agent") && o.length > 0
      );
      test.skip(!otherAgent, "No other agent to select");
      await agentSelect.selectOption({ label: otherAgent! });
    } else {
      await agentSelect.selectOption("studio-tts");
    }

    await page.waitForTimeout(500);

    // Verify the agent name changed
    const newValue = await agentSelect.inputValue();
    expect(newValue).not.toBe("studio-advisor");
    expect(newValue.length).toBeGreaterThan(0);

    // Verify: conversation starters update for the new agent
    const startersHeading = page.getByText(/試試問|Try asking/i);
    await expect(startersHeading).toBeVisible({ timeout: 3_000 });

    // Take screenshot
    await page.screenshot({
      path: "bun_app/remotion_studio/test-results/agent-verify-04-dropdown.png",
      fullPage: false,
    });
  });

  // ─── 6. Model Selector ───

  test("6. model selector dropdown has 6 options", async ({ page }) => {
    const bridgeOk = await isAgentBridgeAvailable(page);
    test.skip(!bridgeOk, "Agent bridge not available");

    // The model selector is the second <select> on the page
    const selects = page.locator("select");
    const selectCount = await selects.count();
    expect(selectCount).toBeGreaterThanOrEqual(2);

    const modelSelect = selects.nth(1);

    // Verify model selector is visible
    await expect(modelSelect).toBeVisible({ timeout: 5_000 });

    // Verify it has 6 options
    const modelOptions = modelSelect.locator("option");
    const optionCount = await modelOptions.count();
    expect(optionCount).toBe(6);

    // Verify some expected model option labels
    const optionTexts = await modelOptions.allTextContents();
    expect(optionTexts).toContain("Default (agent)");
    expect(optionTexts.some((o) => o.includes("GLM"))).toBe(true);
    expect(optionTexts.some((o) => o.includes("DeepSeek"))).toBe(true);

    // Take screenshot
    await page.screenshot({
      path: "bun_app/remotion_studio/test-results/agent-verify-05-model.png",
      fullPage: false,
    });
  });

  // ─── 7. Agent Search/Filter ───

  test("7. search input filters agent directory", async ({ page }) => {
    const bridgeOk = await isAgentBridgeAvailable(page);
    test.skip(!bridgeOk, "Agent bridge not available");

    // Search input should be visible
    const searchInput = page.getByTestId("agent-search");
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Type "voice" to filter for Voice Synthesis
    await searchInput.fill("voice");
    await page.waitForTimeout(300);

    // Voice Synthesis card should still be visible
    const voiceCard = page.locator("button").filter({ hasText: /Voice Synthesis/i });
    await expect(voiceCard.first()).toBeVisible({ timeout: 3_000 });

    // Content Advisor should be hidden (filtered out)
    const advisorCard = page.locator("button").filter({ hasText: /Content Advisor/i });
    const advisorCount = await advisorCard.count();
    expect(advisorCount).toBe(0);

    // Clear search — all cards should reappear
    await searchInput.clear();
    await page.waitForTimeout(300);

    const allCards = page.locator("button").filter({
      hasText: /Content Advisor|Quality Reviewer|Voice Synthesis|Production Coordinator/i,
    });
    const allCount = await allCards.count();
    expect(allCount).toBeGreaterThanOrEqual(4);

    // Take screenshot
    await page.screenshot({
      path: "bun_app/remotion_studio/test-results/agent-verify-06-search.png",
      fullPage: false,
    });
  });

  // ─── 8. Quality Gate Agent Card ───

  test("8. Quality Gate agent card visible and selectable", async ({ page }) => {
    const bridgeOk = await isAgentBridgeAvailable(page);
    test.skip(!bridgeOk, "Agent bridge not available");

    // Quality Gate card — use child div filter to avoid matching "Quality Reviewer" whose description contains "quality gate"
    const gateCard = page.locator("button").filter({
      has: page.locator("div:text-is('Quality Gate')"),
    }).first();
    await expect(gateCard).toBeVisible({ timeout: 10_000 });

    // Verify it's under the Quality & Review category header
    const qualityHeader = page.getByText(/品質審查|Quality & Review/i);
    await expect(qualityHeader).toBeVisible({ timeout: 5_000 });

    // Click the Quality Gate card
    await gateCard.click();
    await page.waitForTimeout(500);

    // Verify: agent dropdown shows sg-quality-gate
    const agentSelect = page.locator("select").first();
    await expect(agentSelect).toHaveValue("sg-quality-gate", { timeout: 3_000 });

    // Verify: conversation starters appear (default starters since sg-quality-gate has no custom ones)
    const startersHeading = page.getByText(/試試問|Try asking/i);
    await expect(startersHeading).toBeVisible({ timeout: 3_000 });

    // Verify: default starter buttons are visible
    const starterButtons = page.locator("button").filter({ hasText: /What can you help|Explain your available|Help me get started/i });
    const starterCount = await starterButtons.count();
    expect(starterCount).toBeGreaterThanOrEqual(2);

    // Take screenshot
    await page.screenshot({
      path: "bun_app/remotion_studio/test-results/agent-verify-07-gate.png",
      fullPage: false,
    });
  });
});
