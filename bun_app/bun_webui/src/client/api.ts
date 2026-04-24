import type { ApiResponse, Job, JobProgress, Project, AssetSummary, SeriesAssets, TTSStatus, RenderStatus, WorkflowTemplate, WorkflowResult, MonitoringOverview, SeriesHealth, SeriesQualitySnapshot, RegressionAlert, ScoreHistoryPoint, ImageStatus, ImageGenerateRequest, CharacterProfile } from "../shared/types";

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

  // Jobs
  listJobs: () => request<Job[]>("/jobs"),
  getJob: (id: string) => request<Job>(`/jobs/${id}`),
  createDemoJob: () => request<Job>("/jobs/demo", { method: "POST" }),

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

  // Pipeline
  getPipelineStatus: (seriesId: string) => request<Record<string, unknown>>(`/pipeline/status/${seriesId}`),
  runPipeline: (seriesId: string, mode?: string) =>
    request<Job>("/pipeline/run", { method: "POST", body: JSON.stringify({ seriesId, mode }) }),
  runCheck: (seriesId: string, mode?: string) =>
    request<Job>("/pipeline/check", { method: "POST", body: JSON.stringify({ seriesId, mode }) }),
  runScore: (seriesId: string, mode?: string) =>
    request<Job>("/pipeline/score", { method: "POST", body: JSON.stringify({ seriesId, mode }) }),

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
  getTtsStatus: (episodeId: string) => request<TTSStatus>(`/tts/status?episodeId=${encodeURIComponent(episodeId)}`),
  generateTTS: (episodeId: string, opts?: { scene?: string; skipExisting?: boolean; engine?: string }) =>
    request<Job>("/tts/generate", { method: "POST", body: JSON.stringify({ episodeId, ...opts }) }),

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
  }) => request<Job<WorkflowResult>>("/workflows/trigger", { method: "POST", body: JSON.stringify(body) }),
  getWorkflowJob: (id: string) => request<Job<WorkflowResult>>(`/workflows/${id}`),

  // Monitoring
  getMonitoringOverview: () => request<MonitoringOverview>("/monitoring/overview"),
  getSeriesHealth: (seriesId: string) => request<SeriesHealth>(`/monitoring/series/${seriesId}`),
};
