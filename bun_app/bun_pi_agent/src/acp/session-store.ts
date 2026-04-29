/**
 * Session store for ACP stdio mode.
 *
 * Each session holds its own agent instance and conversation history.
 * Sessions can optionally resume from a previously persisted conversation.
 */
import { randomUUID } from "crypto";
import { createAgent } from "../agent.js";
import type { Agent } from "@mariozechner/pi-agent-core";
import {
  initConversationStore,
  loadConversation,
  saveConversation,
  getStoreDir,
} from "../conversation-store.js";
import { type TokenUsage, EMPTY_USAGE, accumulateUsage } from "../store.js";
import type { McpConnection } from "../mcp/client.js";
import type { AgentSideConnection } from "@agentclientprotocol/sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionState {
  sessionId: string;
  cwd: string;
  agent: Agent;
  agentName: string;
  createdAt: string;
  abortController: AbortController;
  cancelled: boolean;
  usage: TokenUsage;
  mcpConnections: McpConnection[];
  acpConnection?: AgentSideConnection;
}

export interface SessionInfo {
  sessionId: string;
  cwd: string;
  agentName: string;
  createdAt: string;
  resumed: boolean;
  messageCount: number;
}

export interface CreateSessionOptions {
  /** Resume a previous conversation by loading its message history */
  resumeFromId?: string;
  /** Agent definition name (for conversation metadata) */
  agentName?: string;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const sessions = new Map<string, SessionState>();

let conversationDir: string | null = null;

/** Initialize session store with conversation persistence directory */
export function initSessionStore(convDir: string, opts?: { maxAge: number; maxCount: number }): void {
  conversationDir = convDir;
  initConversationStore(convDir, opts);
}

/** Get the conversation persistence directory */
export function getConversationDir(): string | null {
  return conversationDir;
}

/** Create a new session with its own agent instance */
export function createSession(cwd: string, options?: CreateSessionOptions): SessionState {
  // Determine sessionId: resume from existing, or generate new
  let sessionId: string;
  let resumed = false;
  let initialMessages: any[] | undefined;

  if (options?.resumeFromId) {
    const loaded = loadConversation(options.resumeFromId);
    if (loaded && loaded.length > 0) {
      sessionId = options.resumeFromId;
      initialMessages = loaded;
      resumed = true;
    } else {
      // Resume ID not found — create fresh with that ID
      sessionId = options.resumeFromId;
    }
  } else {
    sessionId = randomUUID();
  }

  const agent = createAgent({ initialMessages });
  const agentName = options?.agentName ?? "default";
  const state: SessionState = {
    sessionId,
    cwd,
    agent,
    agentName,
    createdAt: new Date().toISOString(),
    abortController: new AbortController(),
    cancelled: false,
    usage: { ...EMPTY_USAGE },
    mcpConnections: [],
  };
  sessions.set(sessionId, state);
  return state;
}

/** Get a session by ID */
export function getSession(sessionId: string): SessionState | undefined {
  return sessions.get(sessionId);
}

/** Delete a session, returns true if found */
export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}

/** List all sessions */
export function listSessions(): SessionInfo[] {
  return Array.from(sessions.values()).map((s) => ({
    sessionId: s.sessionId,
    cwd: s.cwd,
    agentName: s.agentName,
    createdAt: s.createdAt,
    resumed: false,
    messageCount: s.agent.state.messages?.length ?? 0,
  }));
}

/** Save a session's conversation history to disk */
export function saveSessionConversation(sessionId: string): void {
  const state = sessions.get(sessionId);
  if (!state) return;
  saveConversation(sessionId, state.agent.state.messages, {
    agentName: state.agentName,
    cwd: state.cwd,
  });
}

/** Accumulate token usage for a session from an agent event */
export function accumulateSessionUsage(sessionId: string, event: any): void {
  const state = sessions.get(sessionId);
  if (!state) return;
  state.usage = accumulateUsage(state.usage, event);
}

/** Clear all sessions (for testing) */
export function clearSessions(): void {
  sessions.clear();
}
