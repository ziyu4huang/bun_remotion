import type { AgentSession, AgentChatMessage } from "../../shared/types";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const MAX_SESSIONS_PER_AGENT = 50;
const MAX_MESSAGES = 200;

let seq = 0;

export class SessionStore {
  private sessions = new Map<string, AgentSession & { _seq: number }>();
  private filePath: string;
  private loaded = false;
  private dirty = false;
  private writeTimer: ReturnType<typeof setTimeout> | null = null;
  private flushPromise: Promise<void> | null = null;

  constructor(filePath?: string) {
    this.filePath = filePath ?? resolve(import.meta.dir, "../../../data/agent-sessions.json");
  }

  private key(agentName: string, sessionId: string): string {
    return `${agentName}::${sessionId}`;
  }

  /**
   * Load sessions from disk into the in-memory Map.
   * Must be called (or awaited) before using other methods if you need
   * data from a previous process. The first call to any method that
   * reads from the Map will trigger an automatic lazy load.
   */
  async loadFromDisk(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const raw = await readFile(this.filePath, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data.sessions)) {
        for (const s of data.sessions) {
          if (s.agentName && s.sessionId) {
            this.sessions.set(this.key(s.agentName, s.sessionId), s);
          }
        }
      }
    } catch {
      // File doesn't exist or is corrupted — start fresh
    }
  }

  /** Ensure the in-memory Map is populated (lazy load on first access). */
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      await this.loadFromDisk();
    }
  }

  private scheduleWrite(): void {
    if (this.writeTimer) clearTimeout(this.writeTimer);
    this.writeTimer = setTimeout(() => {
      this.flushToDisk().catch(() => { /* swallow — disk errors are non-fatal */ });
    }, 500);
  }

  private async flushToDisk(): Promise<void> {
    if (!this.dirty) return;
    this.dirty = false;
    this.writeTimer = null;

    // Serialize: strip internal _seq field
    const sessions = [...this.sessions.values()].map(({ _seq, ...rest }) => rest);

    // Guard against concurrent flushes
    if (this.flushPromise) {
      await this.flushPromise;
    }

    this.flushPromise = (async () => {
      try {
        const dir = resolve(this.filePath, "..");
        await mkdir(dir, { recursive: true });
        await writeFile(this.filePath, JSON.stringify({ sessions }, null, 2));
      } finally {
        this.flushPromise = null;
      }
    })();

    await this.flushPromise;
  }

  private evictIfNeeded(agentName: string): void {
    const agentSessions = [...this.sessions.entries()]
      .filter(([k]) => k.startsWith(`${agentName}::`))
      .sort(([, a], [, b]) => a.updatedAt - b.updatedAt);

    while (agentSessions.length > MAX_SESSIONS_PER_AGENT) {
      const [k] = agentSessions.shift()!;
      this.sessions.delete(k);
    }
  }

  async save(agentName: string, sessionId: string, messages: AgentChatMessage[], modelOverride?: string): Promise<AgentSession> {
    await this.ensureLoaded();
    const k = this.key(agentName, sessionId);
    const existing = this.sessions.get(k);
    const now = Date.now();
    const session = {
      agentName,
      sessionId,
      messages: messages.slice(-MAX_MESSAGES),
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
      modelOverride,
      _seq: ++seq,
    };
    this.sessions.set(k, session);
    this.evictIfNeeded(agentName);

    // Mark dirty and schedule debounced disk write
    this.dirty = true;
    this.scheduleWrite();

    const { _seq, ...rest } = session;
    return rest;
  }

  async load(agentName: string, sessionId: string): Promise<AgentSession | undefined> {
    await this.ensureLoaded();
    const s = this.sessions.get(this.key(agentName, sessionId));
    if (!s) return undefined;
    const { _seq, ...rest } = s;
    return rest;
  }

  async listSessions(agentName: string): Promise<Array<{ sessionId: string; updatedAt: number; messageCount: number }>> {
    await this.ensureLoaded();
    const results: Array<{ sessionId: string; updatedAt: number; messageCount: number; _seq: number }> = [];
    for (const [k, s] of this.sessions) {
      if (k.startsWith(`${agentName}::`)) {
        results.push({ sessionId: s.sessionId, updatedAt: s.updatedAt, messageCount: s.messages.length, _seq: s._seq });
      }
    }
    results.sort((a, b) => b.updatedAt - a.updatedAt || b._seq - a._seq);
    return results.map(({ _seq, ...rest }) => rest);
  }

  async deleteSession(agentName: string, sessionId: string): Promise<boolean> {
    await this.ensureLoaded();
    const deleted = this.sessions.delete(this.key(agentName, sessionId));
    if (deleted) {
      this.dirty = true;
      this.scheduleWrite();
    }
    return deleted;
  }

  /**
   * Force-flush pending writes to disk. Call this before process exit
   * to ensure data is persisted.
   */
  async flush(): Promise<void> {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    await this.flushToDisk();
  }
}
