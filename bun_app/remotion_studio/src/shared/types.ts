import type { VideoCategoryId } from "remotion_types";

// ── API wrapper ──

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ── Project / Episode ──

export interface Project {
  id: string;
  name: string;
  seriesId: string;
  category: VideoCategoryId;
  path: string;
  episodes: Episode[];
  gateScore?: number;
  blendedScore?: number;
  hasPlan?: boolean;
  episodeCount: number;
  scaffoldedCount: number;
}

export interface Episode {
  id: string;
  chapter?: number;
  episode: number;
  path: string;
  hasScaffold: boolean;
  hasTTS: boolean;
  hasRender: boolean;
  gateScore?: number;
  blendedScore?: number;
}

// ── Job queue ──

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface Job<T = unknown> {
  id: string;
  type: string;
  status: JobStatus;
  progress: number;
  result?: T;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface JobProgress {
  jobId: string;
  progress: number;
  message?: string;
}

// ── Quality / Gate ──

export interface GateResult {
  score: number;
  decision: "PASS" | "WARN" | "FAIL";
  checks: GateCheck[];
  blendedScore?: number;
}

export interface GateCheck {
  name: string;
  status: "PASS" | "WARN" | "FAIL" | "SKIP";
  scoreImpact: number;
  fixSuggestionZhTW?: string;
}

// ── Pipeline ──

export interface PipelineRequest {
  seriesId: string;
  episodeIds?: string[];
  mode?: "regex" | "ai" | "hybrid";
}

export interface PipelineResult {
  nodes: number;
  edges: number;
  communities: number;
  gateScore: number;
  blendedScore?: number;
  durationMs: number;
}

// ── Assets ──

export type AssetType = "character" | "background" | "audio";
export type AssetFormat = "png" | "jpg" | "jpeg" | "wav" | "mp3";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  format: AssetFormat;
  seriesId: string;
  episodeId?: string;
  path: string;
  size: number;
}

export interface SeriesAssets {
  seriesId: string;
  characters: Asset[];
  backgrounds: Asset[];
  audio: Asset[];
}

export interface AssetSummary {
  seriesId: string;
  seriesName: string;
  characters: number;
  backgrounds: number;
  audio: number;
}

// ── TTS ──

export interface TTSStatus {
  episodeId: string;
  hasNarration: boolean;
  hasAudio: boolean;
  audioFiles: string[];
  voiceMap?: Record<string, string>;
}

// ── Render ──

export interface RenderStatus {
  episodeId: string;
  hasRender: boolean;
  outputPath?: string;
  fileSize?: number;
  modifiedAt?: string;
}

// ── Workflow ──

export type WorkflowStepKind = "scaffold" | "pipeline" | "check" | "score" | "tts" | "render" | "image";

export interface WorkflowStepDef {
  kind: WorkflowStepKind;
  label: string;
}

export interface WorkflowTemplate {
  id: string;
  label: string;
  description: string;
  steps: WorkflowStepDef[];
}

export interface WorkflowStepStatus {
  kind: WorkflowStepKind;
  label: string;
  status: JobStatus;
  progress: number;
  error?: string;
  result?: unknown;
  agentReport?: string;
}

export interface WorkflowResult {
  templateId: string;
  startedAt: number;
  finishedAt?: number;
  currentStep: number;
  steps: WorkflowStepStatus[];
  /** Original trigger options — stored for retry. JSON-serializable. */
  options?: Record<string, unknown>;
}

// ── Task Tree (Phase 57+) ──

export type TaskStatus = "pending" | "queued" | "running" | "completed" | "failed" | "skipped";

export interface TaskNode {
  id: string;
  parentId: string | null;
  label: string;
  kind: string; // WorkflowStepKind | "workflow" | "group"
  status: TaskStatus;
  progress: number; // 0-100
  deps: string[]; // IDs of tasks that must complete before this one
  children: string[]; // IDs of child tasks
  error?: string;
  result?: unknown;
  startedAt?: number;
  finishedAt?: number;
  metadata?: Record<string, unknown>;
}

export interface TaskTree {
  rootId: string;
  nodes: Record<string, TaskNode>; // flattened, indexed by ID (JSON-safe)
  createdAt: number;
  updatedAt: number;
}

// ── Monitoring ──

export interface SeriesHealth {
  seriesId: string;
  name: string;
  category: string;
  episodeCount: number;
  scaffoldedCount: number;
  ttsCount: number;
  renderedCount: number;
  completionRate: number;
  gateScore: number | null;
  blendedScore: number | null;
  qualityDecision: string | null;
  nodeCount: number;
  edgeCount: number;
  communityCount: number;
  trend: "improving" | "stable" | "declining" | "new";
}

export interface MonitoringOverview {
  totalSeries: number;
  totalEpisodes: number;
  totalScaffolded: number;
  totalRendered: number;
  overallCompletionRate: number;
  avgGateScore: number | null;
  avgBlendedScore: number | null;
  seriesHealth: SeriesHealth[];
  recentActivity: ActivityEntry[];
}

export interface ActivityEntry {
  timestamp: string;
  seriesId: string;
  type: "pipeline" | "render" | "scaffold";
  detail: string;
}

// ── Quality Comparison ──

export interface SeriesQualitySnapshot {
  seriesId: string;
  gateScore: number | null;
  blendedScore: number | null;
  decision: string | null;
  previousScore: number | null;
  scoreDelta: number | null;
  trend: "improving" | "stable" | "declining" | "new";
  nodeCount: number;
  edgeCount: number;
  communityCount: number;
  aiDimensions: Record<string, number> | null;
  aiOverall: number | null;
  breakdown: Record<string, number | null> | null;
  generatorMode: string | null;
  genre: string | null;
}

export interface RegressionAlert {
  seriesId: string;
  metric: string;
  baseline: number;
  current: number;
  delta: number;
  deltaPercent: number;
  isRegression: boolean;
}

export interface ScoreHistoryPoint {
  date: string;
  gateScore: number;
  blendedScore: number | null;
  aiOverall: number | null;
}

// ── Image Generation ──

export interface ImageStatus {
  seriesId: string;
  characterDir: string;
  backgroundDir: string;
  characters: number;
  backgrounds: number;
}

export interface CharacterImageVariant {
  file: string;
  type: string;
  character: string;
  facing: string;
  prompt: string;
  emotion?: string;
  description?: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  position: string;
  voice: string;
  appearance: string | null;
  basePrompt: string | null;
  variants: CharacterImageVariant[];
  emotions: string[];
}

export interface ImageGenerateRequest {
  seriesId: string;
  images: Array<{
    filename: string;
    prompt: string;
    aspectRatio?: string;
    resolution?: string;
    metadata?: Record<string, unknown>;
  }>;
  skipExisting?: boolean;
}

// ── Benchmark ──

export interface BenchmarkResult {
  seriesId: string;
  pipelineOk: boolean;
  gateScore: number;
  gateDecision: string;
  blendedScore: number | null;
  blendedDecision: string | null;
  regressionStatus: "OK" | "REGRESSION" | "NO_BASELINE" | "NO_GATE";
  baselineScore: number | null;
  scoreDelta: number | null;
  checkDeltas?: string[];
  agentReport?: string;
}

export interface BaselineInfo {
  seriesId: string;
  hasBaseline: boolean;
  baselineScore: number | null;
  baselineDate: string | null;
  currentScore: number | null;
  delta: number | null;
}

// ── Export / Import ──

export interface ProjectExport {
  version: 1;
  exportedAt: string;
  series: {
    id: string;
    name: string;
    category: VideoCategoryId;
    genre?: string;
    path: string;
  };
  planMd?: string;
  todoMd?: string;
  episodes: EpisodeExport[];
  quality?: {
    gateScore?: number;
    blendedScore?: number;
    decision?: string;
  };
  automationRules: AutomationRuleExport[];
}

export interface EpisodeExport {
  id: string;
  chapter?: number;
  episode?: number;
  planMd?: string;
  hasScaffold: boolean;
  hasTTS: boolean;
  hasRender: boolean;
}

export interface AutomationRuleExport {
  name: string;
  trigger: string;
  templateId: string;
  enabled: boolean;
  cooldownMs: number;
}

// ── Agent Bridge ──

export interface AgentInfo {
  name: string;
  description: string;
  tools?: string[];
  model?: string;
  skills?: string[];
}

export interface AgentChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type AgentStreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool_start"; toolName: string; toolCallId: string; args: unknown }
  | { type: "tool_end"; toolName: string; toolCallId: string; result: unknown; isError: boolean }
  | { type: "turn_end" }
  | { type: "done"; turnCount: number; toolCallCount: number }
  | { type: "error"; message: string };

export interface AgentTaskResult {
  agentName: string;
  response: string;
  turnCount: number;
  toolCallCount: number;
  toolCalls: Array<{ name: string; args: unknown; result: unknown; isError: boolean }>;
  durationMs: number;
}
