import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { bridge } from "../agent-bridge.js";
import type { AgentProvider } from "../agent-interface.js";
import { createJob, getJob, cancelJob } from "../middleware/job-queue.js";
import { SessionStore } from "../services/session-store.js";
import type { ApiResponse, AgentInfo, AgentTaskResult, AgentChatMessage, JobStatus } from "../../shared/types.js";
import type { AgentAttachment } from "../agent-interface.js";
import { resolve, relative, basename } from "node:path";
import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";

const provider: AgentProvider = bridge;

const REPO_ROOT = resolve(import.meta.dir, "../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

const SAFE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".md", ".json", ".txt", ".css",
]);

const EXCLUDE_DIRS = new Set([
  "node_modules", ".git", "out", "storygraph_out", "assets", "public",
  "fixture", "scripts", "dist", ".claude",
]);

function isSafePath(requestedPath: string): { safe: boolean; resolved: string } {
  const resolved = resolve(PROJ_DIR, requestedPath);
  if (!resolved.startsWith(PROJ_DIR)) return { safe: false, resolved };
  return { safe: true, resolved };
}

type ChatRequestBody = {
  agentName?: string;
  prompt?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  model?: string;
  attachments?: Array<{ path: string; name: string; content: string }>;
};

const agentRoutes = new Hono();
const sessionStore = new SessionStore();

// ── GET /sessions/:agentName — list sessions for an agent ──

agentRoutes.get("/sessions/:agentName", async (c) => {
  const { agentName } = c.req.param();
  const sessions = await sessionStore.listSessions(agentName);
  return c.json<ApiResponse>({ ok: true, data: sessions });
});

// ── GET /sessions/:agentName/:sessionId — load a session ──

agentRoutes.get("/sessions/:agentName/:sessionId", async (c) => {
  const { agentName, sessionId } = c.req.param();
  const session = await sessionStore.load(agentName, sessionId);
  if (!session) {
    return c.json<ApiResponse>({ ok: false, error: "Session not found" }, 404);
  }
  return c.json<ApiResponse>({ ok: true, data: session });
});

// ── PUT /sessions/:agentName/:sessionId — save or migrate a session ──

agentRoutes.put("/sessions/:agentName/:sessionId", async (c) => {
  const { agentName, sessionId } = c.req.param();
  const body = await c.req.json<{ messages: AgentChatMessage[]; modelOverride?: string }>();
  if (!body.messages || !Array.isArray(body.messages)) {
    return c.json<ApiResponse>({ ok: false, error: "messages array required" }, 400);
  }
  const session = await sessionStore.save(agentName, sessionId, body.messages, body.modelOverride);
  return c.json<ApiResponse<{ sessionId: string }>>({ ok: true, data: { sessionId: session.sessionId } });
});

// ── DELETE /sessions/:agentName/:sessionId — delete a session ──

agentRoutes.delete("/sessions/:agentName/:sessionId", async (c) => {
  const { agentName, sessionId } = c.req.param();
  const deleted = await sessionStore.deleteSession(agentName, sessionId);
  return c.json<ApiResponse<{ deleted: boolean }>>({ ok: true, data: { deleted } });
});

// ── GET /agents — list available sub-agents ──

agentRoutes.get("/agents", async (c) => {
  const status = await provider.isAvailable();
  if (!status.ok) {
    return c.json<ApiResponse>(
      { ok: false, error: `Agent bridge unavailable: ${status.error}` },
      503,
    );
  }

  const agents = await provider.listAgents();
  return c.json<ApiResponse<AgentInfo[]>>({ ok: true, data: agents });
});

// ── GET /status — check if agent bridge is operational ──

agentRoutes.get("/status", async (c) => {
  const status = await provider.isAvailable();
  return c.json<ApiResponse<{ available: boolean; error?: string }>>({
    ok: true,
    data: { available: status.ok, error: status.error },
  });
});

// ── POST /chat — send prompt to agent, stream response via SSE (with job tracking) ──

agentRoutes.post("/chat", async (c) => {
  const body = await c.req.json<ChatRequestBody>();
  if (!body.agentName || !body.prompt) {
    return c.json<ApiResponse>(
      { ok: false, error: "agentName and prompt are required" },
      400,
    );
  }

  const attachments: AgentAttachment[] | undefined = body.attachments?.map((a) => ({
    ...a,
    type: "file" as const,
  }));

  // Create a tracking job so pipeline tool results are visible in Dashboard
  const job = createJob<AgentTaskResult>(`agent-chat:${body.agentName}`, async (_progress) => {
    return { agentName: body.agentName!, response: "", turnCount: 0, toolCallCount: 0, toolCalls: [], durationMs: 0 };
  });

  return streamSSE(c, async (stream) => {
    let aborted = false;
    stream.onAbort(() => {
      aborted = true;
      cancelJob(job.id);
    });

    // Emit job_id so the client can track progress
    if (!aborted) {
      stream.writeSSE({ data: JSON.stringify({ type: "job_id", jobId: job.id }) });
    }

    try {
      let progress = 0;
      const bumpProgress = (pct: number, status: JobStatus = "running") => {
        progress = pct;
        if (!aborted) {
          stream.writeSSE({
            data: JSON.stringify({ type: "job_update", jobId: job.id, progress, status }),
          });
        }
      };

      const result = await provider.runTask(body.agentName!, body.prompt, {
        history: body.history,
        model: body.model,
        attachments,
        onEvent(event) {
          if (aborted) return;
          stream.writeSSE({ data: JSON.stringify(event) });
          if (event.type === "tool_start") {
            bumpProgress(Math.min(80, progress + 5));
          } else if (event.type === "tool_end") {
            bumpProgress(Math.min(90, progress + 10));
          }
        },
      });

      job.result = result;
      job.progress = 100;
      job.status = "completed";
      job.updatedAt = Date.now();

      if (!aborted) {
        bumpProgress(100, "completed");
        stream.writeSSE({
          data: JSON.stringify({
            type: "result",
            result: { ...result, jobId: job.id },
          }),
        });
      }
    } catch (e: any) {
      job.error = e.message;
      job.status = "failed";
      job.updatedAt = Date.now();

      if (!aborted) {
        stream.writeSSE({
          data: JSON.stringify({
            type: "job_update",
            jobId: job.id,
            progress: job.progress,
            status: "failed",
          }),
        });
        stream.writeSSE({
          data: JSON.stringify({ type: "error", message: e.message }),
        });
      }
    }
  });
});

// ── POST /tasks — start a named agent task (returns job ID) ──

agentRoutes.post("/tasks", async (c) => {
  const body = await c.req.json<ChatRequestBody>();
  if (!body.agentName || !body.prompt) {
    return c.json<ApiResponse>(
      { ok: false, error: "agentName and prompt are required" },
      400,
    );
  }

  const status = await provider.isAvailable();
  if (!status.ok) {
    return c.json<ApiResponse>(
      { ok: false, error: `Agent bridge unavailable: ${status.error}` },
      503,
    );
  }

  const attachments: AgentAttachment[] | undefined = body.attachments?.map((a) => ({
    ...a,
    type: "file" as const,
  }));

  const job = createJob<AgentTaskResult>(`agent:${body.agentName}`, async (progress) => {
    let lastPct = 0;
    const result = await provider.runTask(body.agentName!, body.prompt, {
      history: body.history,
      model: body.model,
      attachments,
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

// ── GET /files — list project files available for agent context ──

agentRoutes.get("/files", async (c) => {
  const seriesId = c.req.query("seriesId");
  if (!seriesId) {
    try {
      const entries = readdirSync(PROJ_DIR, { withFileTypes: true });
      const series: Array<{ id: string; path: string }> = [];
      for (const e of entries) {
        if (!e.isDirectory() || e.name.startsWith(".")) continue;
        const seriesPath = resolve(PROJ_DIR, e.name);
        if (existsSync(resolve(seriesPath, "src"))) {
          series.push({ id: e.name, path: seriesPath });
        }
      }
      return c.json<ApiResponse>({ ok: true, data: { series } });
    } catch (e: any) {
      return c.json<ApiResponse>({ ok: false, error: e.message }, 500);
    }
  }

  const seriesPath = resolve(PROJ_DIR, seriesId);
  if (!existsSync(seriesPath)) {
    return c.json<ApiResponse>({ ok: false, error: `Series not found: ${seriesId}` }, 404);
  }

  const files: Array<{ path: string; name: string; size: number; episode?: string }> = [];

  function scanDir(dir: string, episodeName?: string, depth = 0) {
    if (depth > 4) return;
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith(".") || EXCLUDE_DIRS.has(entry.name)) continue;
        const fullPath = resolve(dir, entry.name);
        if (entry.isDirectory()) {
          const isEpisode = existsSync(resolve(fullPath, "src", "Root.tsx"));
          scanDir(fullPath, isEpisode ? entry.name : episodeName, depth + 1);
        } else if (entry.isFile()) {
          const ext = entry.name.slice(entry.name.lastIndexOf("."));
          if (!SAFE_EXTENSIONS.has(ext)) continue;
          const stat = statSync(fullPath);
          const relPath = relative(PROJ_DIR, fullPath);
          files.push({
            path: relPath,
            name: episodeName ? `${episodeName}/${entry.name}` : entry.name,
            size: stat.size,
            episode: episodeName,
          });
        }
      }
    } catch (e) { /* permission errors, skip */ }
  }

  scanDir(seriesPath, undefined);
  files.sort((a, b) => a.name.localeCompare(b.name));

  return c.json<ApiResponse>({ ok: true, data: { seriesId, files } });
});

// ── GET /files/content — read a file's content for attachment ──

agentRoutes.get("/files/content", async (c) => {
  const filePath = c.req.query("path");
  if (!filePath) {
    return c.json<ApiResponse>({ ok: false, error: "path query param required" }, 400);
  }

  const { safe, resolved } = isSafePath(filePath);
  if (!safe) {
    return c.json<ApiResponse>({ ok: false, error: "Invalid path" }, 403);
  }
  if (!existsSync(resolved)) {
    return c.json<ApiResponse>({ ok: false, error: "File not found" }, 404);
  }

  const ext = filePath.slice(filePath.lastIndexOf("."));
  if (!SAFE_EXTENSIONS.has(ext)) {
    return c.json<ApiResponse>({ ok: false, error: `File type not allowed: ${ext}` }, 403);
  }

  try {
    const stat = statSync(resolved);
    if (stat.size > 200_000) {
      return c.json<ApiResponse>({ ok: false, error: "File too large (max 200KB)" }, 413);
    }
    const content = readFileSync(resolved, "utf-8");
    return c.json<ApiResponse>({
      ok: true,
      data: { path: filePath, name: basename(filePath), size: stat.size, content },
    });
  } catch (e: any) {
    return c.json<ApiResponse>({ ok: false, error: e.message }, 500);
  }
});

export { agentRoutes };
