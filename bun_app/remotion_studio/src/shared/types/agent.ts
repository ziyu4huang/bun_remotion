import type { JobStatus } from "./common.js";

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
  | { type: "job_id"; jobId: string }
  | { type: "job_update"; jobId: string; progress: number; status: JobStatus }
  | { type: "done"; turnCount: number; toolCallCount: number; jobId?: string }
  | { type: "error"; message: string };

export interface AgentTaskResult {
  agentName: string;
  response: string;
  turnCount: number;
  toolCallCount: number;
  toolCalls: Array<{ name: string; args: unknown; result: unknown; isError: boolean }>;
  durationMs: number;
  jobId?: string;
}

export interface AgentSession {
  agentName: string;
  sessionId: string;
  messages: AgentChatMessage[];
  updatedAt: number;
  createdAt: number;
  modelOverride?: string;
}

// ── Batch Operations ──

export interface BatchRequest {
  operation: "tts" | "render";
  episodeIds?: string[];
  seriesId?: string;
  chapter?: number;
  skipExisting?: boolean;
  engine?: "mlx" | "gemini";
}

export interface BatchEpisodeResult {
  episodeId: string;
  status: "completed" | "failed" | "skipped";
  error?: string;
}

export interface BatchResult {
  operation: string;
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  episodes: BatchEpisodeResult[];
  durationMs: number;
}
