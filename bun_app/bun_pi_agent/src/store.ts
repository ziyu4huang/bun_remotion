import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import type { Run } from "acp-sdk";
import type { AgentEvent } from "@mariozechner/pi-agent-core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface RunState {
  run: Run;
  events: Array<Record<string, unknown>>;
  usage: TokenUsage;
  // Runtime-only (not persisted)
  agent: ReturnType<typeof import("./agent.js").createAgent> | null;
  abortController: AbortController;
}

export interface PersistedRun {
  run: Run;
  events: Array<Record<string, unknown>>;
  usage: TokenUsage;
}

// ---------------------------------------------------------------------------
// In-memory + file-backed store
// ---------------------------------------------------------------------------

const runs = new Map<string, RunState>();

let runsDir: string | null = null;
let cleanupOpts: { maxAge: number; maxCount: number } | null = null;

/** Initialize store with persistence directory */
export function initStore(dir: string, opts?: { maxAge: number; maxCount: number }): void {
  runsDir = dir;
  cleanupOpts = opts ?? null;
  runs.clear();
  mkdirSync(dir, { recursive: true });
  loadFromDisk();
  if (cleanupOpts) cleanupRuns();
}

/** Get a run state by ID */
export function getRun(runId: string): RunState | undefined {
  return runs.get(runId);
}

/** Set a run state in memory */
export function setRun(runId: string, state: RunState): void {
  runs.set(runId, state);
}

/** List all runs (summary only) */
export function listRuns(): Run[] {
  return Array.from(runs.values()).map((s) => s.run);
}

/** Persist a single run to disk */
export function saveRun(runId: string): void {
  if (!runsDir) return;
  const state = runs.get(runId);
  if (!state) return;

  mkdirSync(runsDir, { recursive: true });

  const persisted: PersistedRun = {
    run: state.run,
    events: state.events,
    usage: state.usage,
  };

  const filePath = join(runsDir, `${runId}.json`);
  writeFileSync(filePath, JSON.stringify(persisted, null, 2));
}

/** Delete a run from memory and disk */
export function deleteRun(runId: string): boolean {
  const existed = runs.delete(runId);
  if (runsDir && existed) {
    try {
      const filePath = join(runsDir, `${runId}.json`);
      unlinkSync(filePath);
    } catch {
      // Ignore file deletion errors
    }
  }
  return existed;
}

/** Remove runs older than maxAge and/or exceeding maxCount */
export function cleanupRuns(): { removed: number } {
  if (!cleanupOpts) return { removed: 0 };
  const { maxAge, maxCount } = cleanupOpts;
  let removed = 0;
  const now = Date.now();

  // Age-based cleanup
  if (maxAge > 0) {
    for (const [id, state] of runs) {
      const createdAt = new Date(state.run.created_at).getTime();
      if (now - createdAt > maxAge * 1000) {
        deleteRun(id);
        removed++;
      }
    }
  }

  // Count-based cleanup (remove oldest first)
  if (maxCount > 0 && runs.size > maxCount) {
    const sorted = Array.from(runs.entries())
      .sort(([, a], [, b]) => new Date(a.run.created_at).getTime() - new Date(b.run.created_at).getTime());
    const excess = sorted.length - maxCount;
    for (let i = 0; i < excess; i++) {
      deleteRun(sorted[i][0]);
      removed++;
    }
  }

  return { removed };
}

/** Load all persisted runs from disk into memory */
function loadFromDisk(): void {
  if (!runsDir) return;
  try {
    const files = readdirSync(runsDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const filePath = join(runsDir, file);
        const raw = readFileSync(filePath, "utf-8");
        const persisted: PersistedRun = JSON.parse(raw);

        const runId = persisted.run.run_id;
        if (!runId) continue;

        runs.set(runId, {
          ...persisted,
          agent: null,
          abortController: new AbortController(),
        });
      } catch {
        // Skip corrupt files
      }
    }
  } catch {
    // Directory doesn't exist yet — that's fine
  }
}

// ---------------------------------------------------------------------------
// Token usage accumulation
// ---------------------------------------------------------------------------

export const EMPTY_USAGE: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  totalTokens: 0,
  estimatedCost: 0,
};

/** Accumulate token usage from an agent event */
export function accumulateUsage(
  current: TokenUsage,
  event: AgentEvent,
): TokenUsage {
  if (event.type !== "turn_end") return current;

  const message = (event as any).message;
  if (!message?.usage) return current;

  const u = message.usage;
  return {
    inputTokens: current.inputTokens + (u.input || 0),
    outputTokens: current.outputTokens + (u.output || 0),
    cacheReadTokens: current.cacheReadTokens + (u.cacheRead || 0),
    cacheWriteTokens: current.cacheWriteTokens + (u.cacheWrite || 0),
    totalTokens: current.totalTokens + (u.totalTokens || 0),
    estimatedCost: current.estimatedCost + (u.cost?.total || 0),
  };
}
