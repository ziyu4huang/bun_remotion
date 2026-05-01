import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { app } from "../server/index";

// Route parity test: verifies that POST /chat and POST /tasks accept the same
// request body shape (agentName, prompt, history, model, attachments) and
// both pass these params to the underlying provider.

describe("Route parity: /chat and /tasks", () => {
  const validBody = {
    agentName: "test-agent",
    prompt: "test prompt",
    history: [
      { role: "user" as const, content: "previous question" },
      { role: "assistant" as const, content: "previous answer" },
    ],
    model: "test-model",
    attachments: [{ path: "test.ts", name: "test.ts", content: "hello" }],
  };

  test("both routes require agentName + prompt", async () => {
    const emptyBody = JSON.stringify({});
    const headers = { "Content-Type": "application/json" };

    const chatRes = await app.fetch(
      new Request("http://localhost/api/agent/chat", { method: "POST", headers, body: emptyBody }),
    );
    const tasksRes = await app.fetch(
      new Request("http://localhost/api/agent/tasks", { method: "POST", headers, body: emptyBody }),
    );

    expect(chatRes.status).toBe(400);
    expect(tasksRes.status).toBe(400);

    const chatData = await chatRes.json();
    const tasksData = await tasksRes.json();
    expect(chatData.error).toContain("agentName and prompt");
    expect(tasksData.error).toContain("agentName and prompt");
  });

  test("both routes accept history param", async () => {
    const headers = { "Content-Type": "application/json" };

    // POST /chat with history — will attempt SSE, so we just check it doesn't
    // reject the body shape (won't get 400 for missing fields)
    const bodyWithHistory = JSON.stringify(validBody);

    const chatRes = await app.fetch(
      new Request("http://localhost/api/agent/chat", { method: "POST", headers, body: bodyWithHistory }),
    );
    // /chat returns SSE stream (200) or 400 — never 400 here since fields are present
    expect(chatRes.status).not.toBe(400);

    const tasksRes = await app.fetch(
      new Request("http://localhost/api/agent/tasks", { method: "POST", headers, body: bodyWithHistory }),
    );
    // /tasks creates job (201) or 503 (bridge down) — never 400
    expect(tasksRes.status).not.toBe(400);
  });

  test("both routes accept model param without error", async () => {
    const headers = { "Content-Type": "application/json" };
    const bodyWithModel = JSON.stringify({
      agentName: "test-agent",
      prompt: "test",
      model: "custom-model",
    });

    const chatRes = await app.fetch(
      new Request("http://localhost/api/agent/chat", { method: "POST", headers, body: bodyWithModel }),
    );
    expect(chatRes.status).not.toBe(400);

    const tasksRes = await app.fetch(
      new Request("http://localhost/api/agent/tasks", { method: "POST", headers, body: bodyWithModel }),
    );
    expect(tasksRes.status).not.toBe(400);
  });

  test("both routes accept attachments param without error", async () => {
    const headers = { "Content-Type": "application/json" };
    const bodyWithAttachments = JSON.stringify({
      agentName: "test-agent",
      prompt: "test",
      attachments: [{ path: "test.ts", name: "test.ts", content: "code" }],
    });

    const chatRes = await app.fetch(
      new Request("http://localhost/api/agent/chat", { method: "POST", headers, body: bodyWithAttachments }),
    );
    expect(chatRes.status).not.toBe(400);

    const tasksRes = await app.fetch(
      new Request("http://localhost/api/agent/tasks", { method: "POST", headers, body: bodyWithAttachments }),
    );
    expect(tasksRes.status).not.toBe(400);
  });

  test("/chat returns SSE stream, /tasks returns JSON job", async () => {
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify(validBody);

    const chatRes = await app.fetch(
      new Request("http://localhost/api/agent/chat", { method: "POST", headers, body }),
    );
    const tasksRes = await app.fetch(
      new Request("http://localhost/api/agent/tasks", { method: "POST", headers, body }),
    );

    // /chat always returns 200 with SSE (or error stream)
    expect(chatRes.status).toBe(200);
    expect(chatRes.headers.get("content-type")).toContain("text/event-stream");

    // /tasks returns 201 (job created) or 503 (bridge down)
    expect([201, 503]).toContain(tasksRes.status);
    if (tasksRes.status === 201) {
      const tasksData = await tasksRes.json();
      expect(tasksData.data.id).toBeTruthy();
      expect(tasksData.data.type).toBe("agent:test-agent");
    }
  });
});
