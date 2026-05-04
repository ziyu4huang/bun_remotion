import type { JobStatus } from "./common.js";

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
  /** ID of the TaskTree in TaskStore (DAG-based workflows). */
  taskTreeId?: string;
}

// ── Task Tree ──

export type TaskStatus = "pending" | "queued" | "running" | "completed" | "failed" | "skipped";

export interface TaskNode {
  id: string;
  parentId: string | null;
  label: string;
  kind: string;
  status: TaskStatus;
  progress: number;
  deps: string[];
  children: string[];
  error?: string;
  result?: unknown;
  startedAt?: number;
  finishedAt?: number;
  metadata?: Record<string, unknown>;
}

export interface TaskTree {
  rootId: string;
  nodes: Record<string, TaskNode>;
  createdAt: number;
  updatedAt: number;
}
