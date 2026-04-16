/**
 * In-memory session store for ACP stdio mode.
 *
 * Each session holds its own agent instance and conversation history.
 * Sessions are ephemeral (in-memory only) — the client manages
 * conversation persistence via load/resume if needed.
 */
import { randomUUID } from "crypto";
import { createAgent } from "../agent.js";
import type { Agent } from "@mariozechner/pi-agent-core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionState {
  sessionId: string;
  cwd: string;
  agent: Agent;
  createdAt: string;
  abortController: AbortController;
}

export interface SessionInfo {
  sessionId: string;
  cwd: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const sessions = new Map<string, SessionState>();

/** Create a new session with its own agent instance */
export function createSession(cwd: string): SessionState {
  const sessionId = randomUUID();
  const agent = createAgent();
  const state: SessionState = {
    sessionId,
    cwd,
    agent,
    createdAt: new Date().toISOString(),
    abortController: new AbortController(),
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
    createdAt: s.createdAt,
  }));
}

/** Clear all sessions (for testing) */
export function clearSessions(): void {
  sessions.clear();
}
