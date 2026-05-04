// ── API wrapper ──

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
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
