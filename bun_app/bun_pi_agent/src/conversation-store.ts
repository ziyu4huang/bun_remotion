/**
 * Conversation store — persists agent message history to disk.
 *
 * Storage: `data/conversations/{sessionId}.json`
 * Each file holds the serialized AgentMessage[] transcript + metadata.
 * Mirrors the pattern used by store.ts (runs) and session-store.ts.
 */
import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import type { AgentMessage } from "@mariozechner/pi-agent-core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationRecord {
  sessionId: string;
  agentName: string;
  cwd: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface PersistedConversation {
  sessionId: string;
  agentName: string;
  cwd: string;
  createdAt: string;
  updatedAt: string;
  messages: AgentMessage[];
}

export interface ConversationStoreOptions {
  maxAge: number;    // seconds
  maxCount: number;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let storeDir: string | null = null;
let storeOpts: ConversationStoreOptions | null = null;

/** Initialize store with persistence directory and cleanup options */
export function initConversationStore(dir: string, opts?: ConversationStoreOptions): void {
  storeDir = dir;
  storeOpts = opts ?? null;
  mkdirSync(dir, { recursive: true });
  if (storeOpts) cleanupConversations();
}

/** Persist conversation messages for a session */
export function saveConversation(
  sessionId: string,
  messages: AgentMessage[],
  meta?: { agentName?: string; cwd?: string },
): void {
  if (!storeDir) return;
  mkdirSync(storeDir, { recursive: true });

  const existing = loadPersisted(sessionId);
  const now = new Date().toISOString();

  const record: PersistedConversation = {
    sessionId,
    agentName: meta?.agentName ?? existing?.agentName ?? "default",
    cwd: meta?.cwd ?? existing?.cwd ?? process.cwd(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    messages,
  };

  writeFileSync(
    join(storeDir, `${sessionId}.json`),
    JSON.stringify(record),
  );
}

/** Load conversation messages for a session. Returns undefined if not found. */
export function loadConversation(sessionId: string): AgentMessage[] | undefined {
  const record = loadPersisted(sessionId);
  return record?.messages;
}

/** List all persisted conversations (metadata only, no messages) */
export function listConversations(): ConversationRecord[] {
  if (!storeDir) return [];
  const results: ConversationRecord[] = [];
  try {
    const files = readdirSync(storeDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const raw = readFileSync(join(storeDir, file), "utf-8");
        const record: PersistedConversation = JSON.parse(raw);
        results.push({
          sessionId: record.sessionId,
          agentName: record.agentName,
          cwd: record.cwd,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          messageCount: record.messages?.length ?? 0,
        });
      } catch {
        // Skip corrupt files
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return results.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

/** Delete a conversation. Returns true if found and deleted. */
export function deleteConversation(sessionId: string): boolean {
  if (!storeDir) return false;
  try {
    unlinkSync(join(storeDir, `${sessionId}.json`));
    return true;
  } catch {
    return false;
  }
}

/** Remove conversations older than maxAge and/or exceeding maxCount */
export function cleanupConversations(): { removed: number } {
  if (!storeDir || !storeOpts) return { removed: 0 };
  const { maxAge, maxCount } = storeOpts;
  let removed = 0;
  const now = Date.now();

  const all = listConversations();

  // Age-based cleanup
  if (maxAge >= 0) {
    for (const conv of all) {
      const age = (now - new Date(conv.updatedAt).getTime()) / 1000;
      if (age >= maxAge) {
        if (deleteConversation(conv.sessionId)) removed++;
      }
    }
  }

  // Count-based cleanup (remove oldest first)
  if (maxCount > 0) {
    const remaining = listConversations(); // re-read after age cleanup
    if (remaining.length > maxCount) {
      // listConversations sorts by updatedAt desc, so last entries are oldest
      const toRemove = remaining.slice(maxCount);
      for (const conv of toRemove) {
        if (deleteConversation(conv.sessionId)) removed++;
      }
    }
  }

  return { removed };
}

/** Get the store directory (for testing) */
export function getStoreDir(): string | null {
  return storeDir;
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function loadPersisted(sessionId: string): PersistedConversation | undefined {
  if (!storeDir) return undefined;
  try {
    const raw = readFileSync(join(storeDir, `${sessionId}.json`), "utf-8");
    return JSON.parse(raw) as PersistedConversation;
  } catch {
    return undefined;
  }
}
