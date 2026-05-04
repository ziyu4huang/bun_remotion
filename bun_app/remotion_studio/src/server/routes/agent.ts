import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { bridge } from "../agent-bridge.js";
import type { AgentProvider } from "../agent-interface.js";
import { jobService } from "../middleware/job-service.js";
import { SessionStore } from "../services/session-store.js";
import { listSeries, scanSeriesFiles, readFileContent } from "../services/agent-files.js";
import type { ApiResponse, AgentInfo, AgentTaskResult, AgentChatMessage, JobStatus } from "../../shared/types.js";
import type { AgentAttachment } from "../agent-interface.js";

const provider: AgentProvider = bridge;

type ChatRequestBody = {
  agentName?: string;
  prompt?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  model?: string;
  apiKey?: string;
  envKey?: string;
  attachments?: Array<{ path: string; name: string; content: string }>;
};

const agentRoutes = new Hono();
const sessionStore = new SessionStore();

// ── Sessions ──

agentRoutes.get("/sessions/:agentName", async (c) => {
  const { agentName } = c.req.param();
  const sessions = await sessionStore.listSessions(agentName);
  return c.json<ApiResponse>({ ok: true, data: sessions });
});

agentRoutes.get("/sessions/:agentName/:sessionId", async (c) => {
  const { agentName, sessionId } = c.req.param();
  const session = await sessionStore.load(agentName, sessionId);
  if (!session) return c.json<ApiResponse>({ ok: false, error: "Session not found" }, 404);
  return c.json<ApiResponse>({ ok: true, data: session });
});

agentRoutes.put("/sessions/:agentName/:sessionId", async (c) => {
  const { agentName, sessionId } = c.req.param();
  const body = await c.req.json<{ messages: AgentChatMessage[]; modelOverride?: string }>();
  if (!body.messages || !Array.isArray(body.messages)) {
    return c.json<ApiResponse>({ ok: false, error: "messages array required" }, 400);
  }
  const session = await sessionStore.save(agentName, sessionId, body.messages, body.modelOverride);
  return c.json<ApiResponse<{ sessionId: string }>>({ ok: true, data: { sessionId: session.sessionId } });
});

agentRoutes.delete("/sessions/:agentName/:sessionId", async (c) => {
  const { agentName, sessionId } = c.req.param();
  const deleted = await sessionStore.deleteSession(agentName, sessionId);
  return c.json<ApiResponse<{ deleted: boolean }>>({ ok: true, data: { deleted } });
});

// ── Agent status + listing ──

agentRoutes.get("/agents", async (c) => {
  const status = await provider.isAvailable();
  if (!status.ok) return c.json<ApiResponse>({ ok: false, error: `Agent bridge unavailable: ${status.error}` }, 503);
  const agents = await provider.listAgents();
  return c.json<ApiResponse<AgentInfo[]>>({ ok: true, data: agents });
});

agentRoutes.get("/status", async (c) => {
  const status = await provider.isAvailable();
  return c.json<ApiResponse<{ available: boolean; error?: string }>>({ ok: true, data: { available: status.ok, error: status.error } });
});

// ── POST /chat — SSE streaming with job tracking ──

agentRoutes.post("/chat", async (c) => {
  const body = await c.req.json<ChatRequestBody>();
  if (!body.agentName || !body.prompt) {
    return c.json<ApiResponse>({ ok: false, error: "agentName and prompt are required" }, 400);
  }

  const attachments: AgentAttachment[] | undefined = body.attachments?.map((a) => ({ ...a, type: "file" as const }));

  const job = jobService.create<AgentTaskResult>(`agent-chat:${body.agentName}`, async () => {
    return { agentName: body.agentName!, response: "", turnCount: 0, toolCallCount: 0, toolCalls: [], durationMs: 0 };
  });

  return streamSSE(c, async (stream) => {
    let aborted = false;
    stream.onAbort(() => { aborted = true; jobService.cancel(job.id); });

    if (!aborted) stream.writeSSE({ data: JSON.stringify({ type: "job_id", jobId: job.id }) });

    try {
      let progress = 0;
      const bumpProgress = (pct: number, status: JobStatus = "running") => {
        progress = pct;
        if (!aborted) stream.writeSSE({ data: JSON.stringify({ type: "job_update", jobId: job.id, progress, status }) });
      };

      const result = await provider.runTask(body.agentName!, body.prompt, {
        history: body.history,
        model: body.model,
        apiKey: body.apiKey,
        envKey: body.envKey,
        attachments,
        onEvent(event) {
          if (aborted) return;
          stream.writeSSE({ data: JSON.stringify(event) });
          if (event.type === "tool_start") bumpProgress(Math.min(80, progress + 5));
          else if (event.type === "tool_end") bumpProgress(Math.min(90, progress + 10));
        },
      });

      job.result = result;
      job.progress = 100;
      job.status = "completed";
      job.updatedAt = Date.now();

      if (!aborted) {
        bumpProgress(100, "completed");
        stream.writeSSE({ data: JSON.stringify({ type: "result", result: { ...result, jobId: job.id } }) });
      }
    } catch (e: any) {
      job.error = e.message;
      job.status = "failed";
      job.updatedAt = Date.now();
      if (!aborted) {
        stream.writeSSE({ data: JSON.stringify({ type: "job_update", jobId: job.id, progress: job.progress, status: "failed" }) });
        stream.writeSSE({ data: JSON.stringify({ type: "error", message: e.message }) });
      }
    }
  });
});

// ── POST /tasks — start agent task, returns job ──

agentRoutes.post("/tasks", async (c) => {
  const body = await c.req.json<ChatRequestBody>();
  if (!body.agentName || !body.prompt) {
    return c.json<ApiResponse>({ ok: false, error: "agentName and prompt are required" }, 400);
  }

  const status = await provider.isAvailable();
  if (!status.ok) return c.json<ApiResponse>({ ok: false, error: `Agent bridge unavailable: ${status.error}` }, 503);

  const attachments: AgentAttachment[] | undefined = body.attachments?.map((a) => ({ ...a, type: "file" as const }));

  const job = jobService.create<AgentTaskResult>(`agent:${body.agentName}`, async (progress) => {
    let lastPct = 0;
    const result = await provider.runTask(body.agentName!, body.prompt, {
      history: body.history,
      model: body.model,
      apiKey: body.apiKey,
      envKey: body.envKey,
      attachments,
      onEvent(event) {
        if (event.type === "turn_end") { lastPct = Math.min(90, lastPct + 20); progress(lastPct, "Turn complete"); }
        else if (event.type === "tool_start") progress(lastPct, `Running tool: ${event.toolName}`);
        else if (event.type === "done") progress(100, "Complete");
      },
    });
    return result;
  });

  return c.json<ApiResponse<typeof job>>({ ok: true, data: job }, 201);
});

// ── File browsing for agent context ──

agentRoutes.get("/files", async (c) => {
  const seriesId = c.req.query("seriesId");
  if (!seriesId) {
    try {
      const series = listSeries();
      return c.json<ApiResponse>({ ok: true, data: { series } });
    } catch (e: any) {
      return c.json<ApiResponse>({ ok: false, error: e.message }, 500);
    }
  }

  const result = scanSeriesFiles(seriesId);
  if ("error" in result) return c.json<ApiResponse>({ ok: false, error: result.error }, 404);
  return c.json<ApiResponse>({ ok: true, data: { seriesId, files: result } });
});

agentRoutes.get("/files/content", async (c) => {
  const filePath = c.req.query("path");
  if (!filePath) return c.json<ApiResponse>({ ok: false, error: "path query param required" }, 400);

  const result = readFileContent(filePath);
  if (!result.ok) return c.json<ApiResponse>({ ok: false, error: result.error }, result.status ?? 500);
  return c.json<ApiResponse>({ ok: true, data: result.data });
});

export { agentRoutes };
