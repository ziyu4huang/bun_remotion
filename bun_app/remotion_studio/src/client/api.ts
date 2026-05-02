import type { ApiResponse, Job, JobProgress, Project, AssetSummary, SeriesAssets, TTSStatus, VoiceInfo, RenderStatus, WorkflowTemplate, WorkflowResult, MonitoringOverview, SeriesHealth, SeriesQualitySnapshot, RegressionAlert, ScoreHistoryPoint, ImageStatus, ImageGenerateRequest, CharacterProfile, BenchmarkResult, BaselineInfo, AgentInfo, AgentStreamEvent, AgentTaskResult, AgentSession, TaskTree, TaskNode, EpisodeProgress, EpisodeProgressSummary, BatchRequest, BatchResult } from "../shared/types";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  return res.json();
}

export const api = {
  health: () => request<{ status: string; timestamp: string }>("/health"),
  getVersion: () => request<{ version: string }>("/version"),

  // Jobs
  listJobs: (status?: string) => request<Job[]>(`/jobs${status ? `?status=${status}` : ""}`),
  getJob: (id: string) => request<Job>(`/jobs/${id}`),
  createDemoJob: () => request<Job>("/jobs/demo", { method: "POST" }),
  cancelJob: (id: string) => request<Job>(`/jobs/${id}/cancel`, { method: "POST" }),
  deleteJob: (id: string) => request<{ deleted: boolean }>(`/jobs/${id}`, { method: "DELETE" }),
  listJobHistory: (olderThan?: string) => request<Job[]>(`/jobs/history${olderThan ? `?olderThan=${olderThan}` : ""}`),

  /** Subscribe to job progress via SSE. Returns unsubscribe function. */
  streamJob(jobId: string, onProgress: (p: JobProgress) => void): () => void {
    const es = new EventSource(`${BASE}/jobs/${jobId}/stream`);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data === null) {
        es.close();
        return;
      }
      onProgress(data);
    };
    es.onerror = () => es.close();
    return () => es.close();
  },

  // Projects
  listProjects: () => request<Project[]>("/projects"),
  getProject: (id: string) => request<Project>(`/projects/${id}`),

  // Scaffold
  scaffold: (body: {
    series: string;
    category?: string;
    chapter?: number;
    episode?: number;
    scenes?: number;
    dryRun?: boolean;
  }) => request<Job>("/scaffold", { method: "POST", body: JSON.stringify(body) }),

  // Pipeline (namespaced)
  pipeline: {
    getStatus: (seriesId: string) => request<Record<string, unknown>>(`/pipeline/status/${seriesId}`),
    run: (seriesId: string, mode?: string) =>
      request<Job>("/pipeline/run", { method: "POST", body: JSON.stringify({ seriesId, mode }) }),
    check: (seriesId: string, mode?: string) =>
      request<Job>("/pipeline/check", { method: "POST", body: JSON.stringify({ seriesId, mode }) }),
    score: (seriesId: string, mode?: string) =>
      request<Job>("/pipeline/score", { method: "POST", body: JSON.stringify({ seriesId, mode }) }),
  },

  // Quality
  getQuality: (seriesId: string) => request<Record<string, unknown>>(`/quality/${seriesId}`),
  getQualityComparison: () => request<SeriesQualitySnapshot[]>("/quality/compare"),
  getRegressionAlerts: (threshold?: number) =>
    request<RegressionAlert[]>(`/quality/regression${threshold ? `?threshold=${threshold}` : ""}`),
  getScoreHistory: (seriesId: string) => request<ScoreHistoryPoint[]>(`/quality/history/${seriesId}`),

  // Assets
  listAssets: () => request<AssetSummary[]>("/assets"),
  getAssets: (seriesId: string) => request<SeriesAssets>(`/assets/${seriesId}`),
  assetFileUrl: (relPath: string) => `${BASE}/assets/file/${relPath}`,

  // TTS
  getTTSStatus: (episodeId: string) => request<TTSStatus>(`/tts/status?episodeId=${encodeURIComponent(episodeId)}`),
  getVoices: (engine?: "mlx" | "gemini") => request<VoiceInfo[]>(`/tts/voices${engine ? `?engine=${engine}` : ""}`),
  generateTTS: (episodeId: string, opts?: { scene?: string; skipExisting?: boolean; engine?: string }) =>
    request<Job>("/tts/generate", { method: "POST", body: JSON.stringify({ episodeId, ...opts }) }),
  getVoiceCharacters: (seriesId: string) => request<CharacterProfile[]>(`/tts/characters?seriesId=${encodeURIComponent(seriesId)}`),
  updateCharacterVoice: (seriesId: string, characterId: string, voice: string) =>
    request<CharacterProfile>(`/tts/characters/${encodeURIComponent(seriesId)}/voice`, {
      method: "PUT",
      body: JSON.stringify({ characterId, voice }),
    }),
  previewVoice: (voice: string, engine: "mlx" | "gemini", text?: string) =>
    request<{ url: string }>("/tts/preview-voice", {
      method: "POST",
      body: JSON.stringify({ voice, engine, text }),
    }),

  // Render
  getRenderStatus: (episodeId: string) => request<RenderStatus>(`/render/status?episodeId=${encodeURIComponent(episodeId)}`),
  triggerRender: (episodeId: string) =>
    request<Job>("/render/trigger", { method: "POST", body: JSON.stringify({ episodeId }) }),
  renderPreviewUrl: (episodeId: string) => `${BASE}/render/preview?episodeId=${encodeURIComponent(episodeId)}`,

  // Image
  getImageStatus: (seriesId: string) => request<ImageStatus>(`/image/status?seriesId=${encodeURIComponent(seriesId)}`),
  getCharacterProfiles: (seriesId: string) =>
    request<CharacterProfile[]>(`/image/characters?seriesId=${encodeURIComponent(seriesId)}`),
  generateImages: (body: ImageGenerateRequest & { enhanceWithCharacter?: { facing: "LEFT" | "RIGHT" } }) =>
    request<Job>("/image/generate", { method: "POST", body: JSON.stringify(body) }),

  // Workflows
  listWorkflowTemplates: () => request<WorkflowTemplate[]>("/workflows"),
  triggerWorkflow: (body: {
    templateId: string;
    seriesId?: string;
    chapter?: number;
    episode?: number;
    category?: string;
    scenes?: number;
    mode?: string;
    ttsEngine?: string;
    episodePath?: string;
    images?: Array<{ filename: string; prompt: string; aspectRatio?: string; metadata?: Record<string, unknown> }>;
    imageOutputDir?: string;
    imageAssetType?: "characters" | "backgrounds";
    skipExistingImages?: boolean;
    agent?: boolean;
  }) => request<Job<WorkflowResult>>("/workflows/trigger", { method: "POST", body: JSON.stringify(body) }),
  getWorkflowJob: (id: string) => request<Job<WorkflowResult>>(`/workflows/${id}`),
  retryWorkflow: (jobId: string, fromStep?: number) =>
    request<Job<WorkflowResult>>(`/workflows/${jobId}/retry`, {
      method: "POST",
      body: JSON.stringify(fromStep !== undefined ? { fromStep } : {}),
    }),

  // Task tree
  getWorkflowTree: (jobId: string) => request<TaskTree>(`/workflows/${jobId}/tree`),
  getWorkflowTreeNode: (jobId: string, taskId: string) => request<TaskNode>(`/workflows/${jobId}/tree/${taskId}`),
  retryTreeNode: (jobId: string, taskId: string) =>
    request<Job<WorkflowResult>>(`/workflows/${jobId}/tree/${taskId}/retry`, { method: "POST" }),
  triggerEpisodeBuild: (seriesId: string, episodeId: string, agentEnabled = true) => {
    const parsed = parseEpisodeId(episodeId);
    return api.triggerWorkflow({
      templateId: "full-pipeline",
      seriesId,
      chapter: parsed.chapter,
      episode: parsed.episode,
      mode: "hybrid",
      agent: agentEnabled,
    });
  },

  // Monitoring
  getMonitoringOverview: () => request<MonitoringOverview>("/monitoring/overview"),
  getSeriesHealth: (seriesId: string) => request<SeriesHealth>(`/monitoring/series/${seriesId}`),

  // Episode progress
  getEpisodeProgress: () => request<{ episodes: EpisodeProgress[]; summary: EpisodeProgressSummary }>("/episode-progress"),

  // Batch
  batch: {
    trigger: (body: BatchRequest) => request<Job<BatchResult>>("/batch", { method: "POST", body: JSON.stringify(body) }),
  },

  // Benchmark
  benchmark: {
    listBaselines: () => request<BaselineInfo[]>("/benchmark/baselines"),
    run: (seriesId: string, mode?: string, threshold?: number, agent?: boolean) =>
      request<Job>("/benchmark/run", { method: "POST", body: JSON.stringify({ seriesId, mode, threshold, agent }) }),
    check: (seriesId: string, mode?: string) =>
      request<Job>("/benchmark/check", { method: "POST", body: JSON.stringify({ seriesId, mode }) }),
    regression: (seriesId: string, threshold?: number) =>
      request<BenchmarkResult>("/benchmark/regression", { method: "POST", body: JSON.stringify({ seriesId, threshold }) }),
    updateBaseline: (seriesId: string) =>
      request<BaselineInfo>(`/benchmark/baseline/${seriesId}`, { method: "POST" }),
    regressionStatus: (threshold?: number) =>
      request<RegressionSeriesStatus[]>(`/benchmark/regression-status${threshold ? `?threshold=${threshold}` : ""}`),
  },

  // Agent bridge
  agent: {
    /** Check if agent bridge is available */
    getStatus: () => request<{ available: boolean; error?: string }>("/agent/status"),
    /** List available sub-agents */
    listAgents: () => request<AgentInfo[]>("/agent/agents"),
    /** Start an agent task (returns job ID for polling) */
    startTask: (agentName: string, prompt: string, model?: string, apiKey?: string, envKey?: string) =>
      request<Job<AgentTaskResult>>("/agent/tasks", { method: "POST", body: JSON.stringify({ agentName, prompt, model, apiKey, envKey }) }),
    /** List project files available for agent context */
    listFiles: (seriesId?: string) =>
      request<{ series?: Array<{ id: string; path: string }>; seriesId?: string; files?: Array<{ path: string; name: string; size: number; episode?: string }> }>(
        `/agent/files${seriesId ? `?seriesId=${encodeURIComponent(seriesId)}` : ""}`
      ),
    /** Read a file's content for attachment */
    readFile: (path: string) =>
      request<{ path: string; name: string; size: number; content: string }>(
        `/agent/files/content?path=${encodeURIComponent(path)}`
      ),
    /** List sessions for an agent */
    listSessions: (agentName: string) =>
      request<Array<{ sessionId: string; updatedAt: number; messageCount: number }>>(
        `/agent/sessions/${encodeURIComponent(agentName)}`
      ),
    /** Load a session */
    getSession: (agentName: string, sessionId: string) =>
      request<AgentSession>(`/agent/sessions/${encodeURIComponent(agentName)}/${encodeURIComponent(sessionId)}`),
    /** Save or migrate a session */
    saveSession: (agentName: string, sessionId: string, messages: Array<{ role: "user" | "assistant"; content: string }>, modelOverride?: string) =>
      request<{ sessionId: string }>(`/agent/sessions/${encodeURIComponent(agentName)}/${encodeURIComponent(sessionId)}`, {
        method: "PUT",
        body: JSON.stringify({ messages, modelOverride }),
      }),
    /** Delete a session */
    deleteSession: (agentName: string, sessionId: string) =>
      request<{ deleted: boolean }>(`/agent/sessions/${encodeURIComponent(agentName)}/${encodeURIComponent(sessionId)}`, { method: "DELETE" }),
    /** Stream agent chat via POST-based SSE. Returns abort function. */
    streamChat(
      agentName: string,
      prompt: string,
      onEvent: (event: AgentStreamEvent | { type: "result"; result: AgentTaskResult }) => void,
      history?: Array<{ role: "user" | "assistant"; content: string }>,
      model?: string,
      attachments?: Array<{ path: string; name: string; content: string }>,
      apiKey?: string,
      envKey?: string,
    ): () => void {
      const STREAM_TIMEOUT_MS = 3 * 60 * 1000; // 3 min total
      const controller = new AbortController();
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      (async () => {
        try {
          // Total timeout races against the fetch
          const fetchPromise = fetch(`${BASE}/agent/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agentName, prompt, history, model, apiKey, envKey, attachments }),
            signal: controller.signal,
          });
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              controller.abort();
              reject(new Error("Agent request timed out after 3 minutes."));
            }, STREAM_TIMEOUT_MS);
          });
          const res = await Promise.race([fetchPromise, timeoutPromise]);

          if (!res.ok) {
            const body = await res.text();
            onEvent({ type: "error", message: `HTTP ${res.status}: ${body}` });
            return;
          }
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop()!;
            for (const line of lines) {
              if (line.startsWith("data:")) {
                try {
                  onEvent(JSON.parse(line.slice(5).trim()));
                } catch {
                  // skip malformed SSE lines
                }
              }
            }
          }
          // flush remaining
          if (buf.startsWith("data:")) {
            try {
              onEvent(JSON.parse(buf.slice(5).trim()));
            } catch { /* skip malformed */ }
          }
        } catch (e: any) {
          if (e.name !== "AbortError") {
            onEvent({ type: "error", message: e.message });
          }
        } finally {
          clearTimeout(timeoutId);
        }
      })();
      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    },
  },

  /** Server-side config (masked API keys, default model). */
  getConfig: () =>
    request("/api/config"),

  saveApiKeysToServer: (keys: { glm?: string; deepseek?: string; google?: string }) =>
    request("/api/config/api-keys", { method: "POST", body: JSON.stringify(keys) }),

  saveDefaultModelToServer: (model: string) =>
    request("/api/config/default-model", { method: "POST", body: JSON.stringify({ model }) }),
};

/** Parse episode ID like "weapon-forger-ch1-ep3" into components. */
export function parseEpisodeId(id: string): { seriesId: string; chapter?: number; episode?: number } {
  const chMatch = id.match(/-ch(\d+)-ep(\d+)$/);
  if (chMatch) {
    const suffix = `-ch${chMatch[1]}-ep${chMatch[2]}`;
    return { seriesId: id.slice(0, id.length - suffix.length), chapter: +chMatch[1], episode: +chMatch[2] };
  }
  const epMatch = id.match(/-ep(\d+)$/);
  if (epMatch) {
    return { seriesId: id.slice(0, id.length - `-ep${epMatch[1]}`.length), episode: +epMatch[1] };
  }
  return { seriesId: id };
}
