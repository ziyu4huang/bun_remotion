import type { AgentInfo, AgentTaskResult, AgentStreamEvent } from "../shared/types.js";

/** Structured file attachment for agent context */
export interface AgentAttachment {
  path: string;
  name: string;
  content: string;
  type: "file" | "image" | "context";
}

/** Options for running an agent task */
export interface RunTaskOptions {
  workDir?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  model?: string;
  attachments?: AgentAttachment[];
  onEvent?: (event: AgentStreamEvent) => void;
}

/**
 * Agent provider interface — decouples remotion_studio routes
 * from the specific agent execution engine (bun_pi_agent).
 *
 * The default implementation uses the in-process bridge (agent-bridge.ts).
 * Future implementations could use HTTP, subprocess, or remote agents.
 */
export interface AgentProvider {
  /** Check if the provider is functional */
  isAvailable(): Promise<{ ok: boolean; error?: string }>;

  /** List available agent definitions */
  listAgents(workDir?: string): Promise<AgentInfo[]>;

  /** Run an agent task, collecting events into a structured result */
  runTask(agentName: string, prompt: string, options?: RunTaskOptions): Promise<AgentTaskResult>;
}
