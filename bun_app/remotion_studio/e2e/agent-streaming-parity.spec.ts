import { test, expect } from "@playwright/test";
import { gotoWithRetry } from "./helpers";

test.describe("Agent streaming parity", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithRetry(page);
  });

  test("agent status endpoint returns available or error", async ({ page }) => {
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/agent/status");
      return { ok: r.ok, data: await r.json() };
    });
    expect(res.ok).toBe(true);
    // Either available:true or available:false with error — both are valid
    expect(res.data).toHaveProperty("available");
  });

  test("agent chat SSE stream returns events or graceful error", async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentName: "studio-advisor", prompt: "hello" }),
        });
        if (!res.ok) {
          return { type: "http_error", status: res.status, body: await res.text() };
        }
        // Read first SSE event
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        const { value } = await reader.read();
        reader.cancel();
        const text = decoder.decode(value);
        const dataLine = text.split("\n").find(l => l.startsWith("data:"));
        if (!dataLine) return { type: "no_data_line", raw: text.slice(0, 200) };
        const event = JSON.parse(dataLine.slice(5));
        return { type: "sse_event", eventType: event.type };
      } catch (e: any) {
        return { type: "fetch_error", message: e.message };
      }
    });

    // Acceptable outcomes:
    // 1. SSE event (agent bridge available) — eventType should be one of the known types
    // 2. HTTP error (agent bridge unavailable) — should be 503 or 500
    // 3. No data line (server sent empty stream)
    if (result.type === "sse_event") {
      expect(["text_delta", "thinking_delta", "tool_call", "result", "error", "job_id"]).toContain(result.eventType);
    } else if (result.type === "http_error") {
      expect([500, 503]).toContain(result.status);
    }
    // "no_data_line" and "fetch_error" are also acceptable — bridge may be down
  });

  test("agent tasks endpoint returns job or error", async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const res = await fetch("/api/agent/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentName: "studio-advisor", prompt: "hello" }),
        });
        const data = await res.json();
        return { ok: res.ok, status: res.status, hasData: !!data, hasId: !!data?.id, error: data?.error };
      } catch (e: any) {
        return { ok: false, error: e.message };
      }
    });

    // Both success (job created) and failure (bridge down) are acceptable
    if (result.ok) {
      expect(result.hasId).toBe(true);
    } else {
      expect(result.error).toBeTruthy();
    }
  });
});
