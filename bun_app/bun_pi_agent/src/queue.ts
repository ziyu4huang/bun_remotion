import { getRun, saveRun } from "./store.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Async function executed by the background queue. Should NOT set run status. */
export type TaskFn = (signal: AbortSignal) => Promise<void>;

/** Terminal run statuses. */
export type TerminalStatus = "completed" | "failed" | "cancelled";

/** Callback fired when a run reaches a terminal state. */
export type CompletionCallback = (runId: string, status: TerminalStatus) => void;

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

interface PendingTask {
  runId: string;
  fn: TaskFn;
  controller: AbortController;
}

interface ActiveEntry {
  controller: AbortController;
  timer: ReturnType<typeof setTimeout>;
  promise: Promise<void>;
}

// ---------------------------------------------------------------------------
// BackgroundQueue
// ---------------------------------------------------------------------------

/**
 * Background task queue with concurrency control.
 *
 * Manages scheduling, execution, cancellation, and timeout for async tasks.
 * Integrates with the file-backed run store for status persistence.
 *
 * State machine: created → in-progress → completed | failed | cancelled
 */
export class BackgroundQueue {
  private pending: PendingTask[] = [];
  private active = new Map<string, ActiveEntry>();
  private maxConcurrent: number;
  private timeoutMs: number;
  private callbacks = new Map<string, Set<CompletionCallback>>();

  constructor(opts?: { maxConcurrent?: number; timeoutMs?: number }) {
    this.maxConcurrent = opts?.maxConcurrent ?? 4;
    this.timeoutMs = opts?.timeoutMs ?? 300_000;
  }

  /** Enqueue a task. Returns 1-based queue position (0 = dispatching immediately). */
  enqueue(runId: string, fn: TaskFn): number {
    const controller = new AbortController();
    this.pending.push({ runId, fn, controller });
    const wasDispatched = this.pending.length <= this.maxConcurrent - this.active.size;
    this.tryDispatch();
    return wasDispatched ? 0 : this.pending.length;
  }

  /** Get run status. Checks queue-internal state then run store. */
  getStatus(runId: string): string | undefined {
    if (this.pending.some((t) => t.runId === runId)) return "pending";
    return getRun(runId)?.run.status;
  }

  /** Cancel a queued or running task. Returns false if not found. */
  cancel(runId: string): boolean {
    const idx = this.pending.findIndex((t) => t.runId === runId);
    if (idx >= 0) {
      this.pending.splice(idx, 1);
      this.finalize(runId, "cancelled");
      return true;
    }

    if (this.active.has(runId)) {
      this.finalize(runId, "cancelled");
      this.active.get(runId)!.controller.abort();
      return true;
    }

    return false;
  }

  /** Register a completion callback. Returns unsubscribe function. */
  onComplete(runId: string, cb: CompletionCallback): () => void {
    let cbs = this.callbacks.get(runId);
    if (!cbs) {
      cbs = new Set();
      this.callbacks.set(runId, cbs);
    }
    cbs.add(cb);
    return () => {
      cbs!.delete(cb);
      if (cbs!.size === 0) this.callbacks.delete(runId);
    };
  }

  get pendingCount(): number {
    return this.pending.length;
  }

  get activeCount(): number {
    return this.active.size;
  }

  /** Cancel all pending, abort all active, wait for active to settle. */
  async shutdown(): Promise<void> {
    while (this.pending.length > 0) {
      const task = this.pending.shift()!;
      this.finalize(task.runId, "cancelled");
    }

    for (const [, entry] of this.active) {
      entry.controller.abort();
    }

    const promises = Array.from(this.active.values()).map((e) =>
      e.promise.catch(() => {}),
    );
    if (promises.length > 0) await Promise.all(promises);
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  private tryDispatch(): void {
    while (this.active.size < this.maxConcurrent && this.pending.length > 0) {
      const task = this.pending.shift()!;
      this.startTask(task);
    }
  }

  private startTask(task: PendingTask): void {
    const { runId, fn, controller } = task;
    let settled = false;

    // Mark in-progress
    const state = getRun(runId);
    if (state) {
      state.run.status = "in-progress";
      state.events.push({ type: "run.in-progress", run: state.run });
      saveRun(runId);
    }

    const timer = setTimeout(() => {
      if (!settled) controller.abort();
    }, this.timeoutMs);

    const promise = (async () => {
      try {
        await fn(controller.signal);
        if (!settled) {
          settled = true;
          this.finalize(runId, "completed");
        }
      } catch {
        if (!settled) {
          settled = true;
          this.finalize(
            runId,
            controller.signal.aborted ? "cancelled" : "failed",
          );
        }
      } finally {
        clearTimeout(timer);
        this.active.delete(runId);
        this.tryDispatch();
      }
    })();

    this.active.set(runId, { controller, timer, promise });
  }

  /** Set terminal status, persist, fire callbacks. Idempotent. */
  private finalize(runId: string, status: TerminalStatus): void {
    const state = getRun(runId);
    if (state) {
      if (["completed", "failed", "cancelled"].includes(state.run.status)) {
        this.fireCallbacks(runId, state.run.status as TerminalStatus);
        return;
      }

      state.run.status = status;
      state.run.finished_at = new Date().toISOString();

      if (status === "failed" && !state.run.error) {
        state.run.error = { code: 500, message: "Task failed" };
      }

      state.events.push({ type: `run.${status}`, run: state.run });
      saveRun(runId);
    }
    this.fireCallbacks(runId, status);
  }

  private fireCallbacks(runId: string, status: TerminalStatus): void {
    const cbs = this.callbacks.get(runId);
    if (!cbs) return;
    for (const cb of cbs) {
      try {
        cb(runId, status);
      } catch {
        // swallow callback errors
      }
    }
    this.callbacks.delete(runId);
  }
}
