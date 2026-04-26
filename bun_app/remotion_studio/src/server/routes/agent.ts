import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { listAvailableAgents, runAgentTask, isBridgeAvailable } from "../agent-bridge.js";
import { createJob, getJob } from "../middleware/job-queue.js";
import type { ApiResponse, AgentInfo, AgentTaskResult } from "../../shared/types.js";

const agentRoutes = new Hono();

// ── GET /agents — list available sub-agents ──

agentRoutes.get("/agents", async (c) => {
  const bridge = await isBridgeAvailable();
  if (!bridge.ok) {
    return c.json<ApiResponse>(
      { ok: false, error: `Agent bridge unavailable: ${bridge.error}` },
      503,
    );
  }

  const agents = await listAvailableAgents();
  return c.json<ApiResponse<AgentInfo[]>>({ ok: true, data: agents });
});

// ── GET /status — check if agent bridge is operational ──

agentRoutes.get("/status", async (c) => {
  const bridge = await isBridgeAvailable();
  return c.json<ApiResponse<{ available: boolean; error?: string }>>({
    ok: true,
    data: { available: bridge.ok, error: bridge.error },
  });
});

// ── POST /chat — send prompt to agent, stream response via SSE ──

agentRoutes.post("/chat", async (c) => {
  const body = await c.req.json<{ agentName?: string; prompt?: string }>();
  if (!body.agentName || !body.prompt) {
    return c.json<ApiResponse>(
      { ok: false, error: "agentName and prompt are required" },
      400,
    );
  }

  return streamSSE(c, async (stream) => {
    try {
      const result = await runAgentTask(body.agentName!, body.prompt!, {
        onEvent(event) {
          stream.writeSSE({ data: JSON.stringify(event) });
        },
      });
      // Send final result as a special event
      stream.writeSSE({
        data: JSON.stringify({
          type: "result",
          result,
        }),
      });
    } catch (e: any) {
      stream.writeSSE({
        data: JSON.stringify({ type: "error", message: e.message }),
      });
    }
  });
});

// ── POST /tasks — start a named agent task (returns job ID) ──

agentRoutes.post("/tasks", async (c) => {
  const body = await c.req.json<{
    agentName?: string;
    prompt?: string;
  }>();
  if (!body.agentName || !body.prompt) {
    return c.json<ApiResponse>(
      { ok: false, error: "agentName and prompt are required" },
      400,
    );
  }

  const bridge = await isBridgeAvailable();
  if (!bridge.ok) {
    return c.json<ApiResponse>(
      { ok: false, error: `Agent bridge unavailable: ${bridge.error}` },
      503,
    );
  }

  const job = createJob<AgentTaskResult>(`agent:${body.agentName}`, async (progress) => {
    let lastPct = 0;
    const result = await runAgentTask(body.agentName!, body.prompt!, {
      onEvent(event) {
        if (event.type === "turn_end") {
          lastPct = Math.min(90, lastPct + 20);
          progress(lastPct, `Turn complete`);
        } else if (event.type === "tool_start") {
          progress(lastPct, `Running tool: ${event.toolName}`);
        } else if (event.type === "done") {
          progress(100, "Complete");
        }
      },
    });
    return result;
  });

  return c.json<ApiResponse<typeof job>>({ ok: true, data: job }, 201);
});

export { agentRoutes };
