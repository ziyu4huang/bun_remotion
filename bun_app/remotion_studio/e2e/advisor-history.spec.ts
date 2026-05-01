import { test, expect } from "./fixtures";
import { navigateTo, waitForPageLoad, isAgentBridgeAvailable, gotoWithRetry } from "./helpers";

test.describe("Advisor panel conversation history", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll();
  });

  test.beforeEach(async ({ page }) => {
    await gotoWithRetry(page);
    // Navigate to Story Editor (has advisor panel with sg-story-advisor)
    await navigateTo(page, "Story Editor");
    await waitForPageLoad(page);
  });

  test("advisor panel is visible on Story Editor", async ({ page }) => {
    const bridgeOk = await isAgentBridgeAvailable(page);
    if (!bridgeOk) test.skip();

    // Open the advisor panel (hidden by default)
    const toggleBtn = page.getByRole("button", { name: /Ask Advisor|詢問顧問/i });
    if (await toggleBtn.isVisible().catch(() => false)) {
      await toggleBtn.click();
      await page.waitForTimeout(300);
    }

    // Advisor panel should show heading
    const heading = page.getByRole("heading", { level: 3, name: /Story Advisor|Pipeline Advisor|故事顧問/i });
    const fallback = page.getByText(/Agent bridge unavailable|No advisor/i);
    const h = await heading.isVisible().catch(() => false);
    const f = await fallback.isVisible().catch(() => false);
    expect(h || f).toBe(true);
  });

  test("sending two messages passes history on second call", async ({ page }) => {
    const bridgeOk = await isAgentBridgeAvailable(page);
    if (!bridgeOk) test.skip();

    // Open the advisor panel
    const toggleBtn = page.getByRole("button", { name: /Ask Advisor|詢問顧問/i });
    if (await toggleBtn.isVisible().catch(() => false)) {
      await toggleBtn.click();
      await page.waitForTimeout(300);
    }

    // Intercept SSE to capture request bodies
    const requests: Array<{ history?: unknown }> = [];
    await page.route("**/api/agent/chat", async (route) => {
      const body = route.request().postDataJSON();
      requests.push({ history: body?.history });

      // Simulate SSE stream with result
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body: [
          'data: {"type":"job_id","jobId":"test-job"}',
          'data: {"type":"text","delta":"Response","toolCallId":"","toolName":""}',
          'data: {"type":"result","result":{"response":"Test response","turnCount":1,"toolCallCount":0,"toolCalls":[],"durationMs":100}}',
        ].join("\n\n"),
      });
    });

    // Find the advisor panel input (right side panel)
    const advisorInput = page.locator("div").filter({ hasText: /Ask|提問/ }).locator("input").last();
    const askButton = page.getByRole("button", { name: /^Ask$|^提問$/ });

    // First message
    if (await advisorInput.isVisible().catch(() => false)) {
      await advisorInput.fill("First question");
      await askButton.click();
      await page.waitForTimeout(500);

      // Second message
      await advisorInput.fill("Second question");
      await askButton.click();
      await page.waitForTimeout(500);

      // Verify second request has history
      expect(requests.length).toBeGreaterThanOrEqual(2);
      const secondReq = requests[1];
      expect(secondReq.history).toBeDefined();
      const history = secondReq.history as Array<{ role: string; content: string }>;
      expect(history.length).toBeGreaterThan(0);
      // History should contain the first user message and assistant response
      const userMsgs = history.filter(m => m.role === "user");
      expect(userMsgs.length).toBeGreaterThanOrEqual(1);
    } else {
      test.skip();
    }
  });
});
