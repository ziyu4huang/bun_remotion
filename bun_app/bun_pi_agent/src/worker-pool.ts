// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TaskEntry {
  id: string;
  resolve: () => void;
  reject: (err: unknown) => void;
  onEvent?: (id: string, event: unknown) => void;
}

interface PendingEntry {
  task: { id: string; data: unknown };
  resolve: () => void;
  reject: (err: unknown) => void;
  onEvent?: (id: string, event: unknown) => void;
}

// ---------------------------------------------------------------------------
// WorkerPool
// ---------------------------------------------------------------------------

/**
 * Generic worker pool backed by Bun Workers.
 *
 * Lazy-creates workers up to `maxWorkers`. Workers are recycled between tasks.
 * Handles worker crashes by failing the active task and spawning a replacement.
 *
 * Protocol (Main ↔ Worker):
 *   Main → Worker: { type: "execute", id, data }
 *   Main → Worker: { type: "abort", id }
 *   Worker → Main: { type: "event", id, data }
 *   Worker → Main: { type: "done", id, status: "completed"|"failed"|"aborted", error? }
 */
export class WorkerPool {
  private workers = new Set<Worker>();
  private available = new Set<Worker>();
  private tasks = new Map<string, TaskEntry>();
  private taskToWorker = new Map<string, Worker>();
  private pending: PendingEntry[] = [];
  private workerPath: string;
  private maxWorkers: number;
  private closed = false;

  constructor(opts: { workerPath: string; maxWorkers?: number }) {
    this.workerPath = opts.workerPath;
    this.maxWorkers = opts.maxWorkers ?? 4;
  }

  /** Submit a task. Resolves on completion, rejects on failure/abort. */
  submit(
    task: { id: string; data: unknown },
    onEvent?: (id: string, event: unknown) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.closed) {
        reject(new Error("Pool is shut down"));
        return;
      }

      const entry: PendingEntry = { task, resolve, reject, onEvent };

      if (this.available.size > 0) {
        const worker = this.takeAvailable();
        this.dispatch(worker, entry);
      } else if (this.workers.size < this.maxWorkers) {
        try {
          const worker = this.createWorker();
          this.dispatch(worker, entry);
        } catch (err) {
          reject(err);
        }
      } else {
        this.pending.push(entry);
      }
    });
  }

  /** Abort a pending or running task. Returns false if not found. */
  abort(id: string): boolean {
    const idx = this.pending.findIndex((e) => e.task.id === id);
    if (idx >= 0) {
      const [entry] = this.pending.splice(idx, 1);
      entry.reject(new Error("Aborted"));
      return true;
    }

    const worker = this.taskToWorker.get(id);
    if (!worker) return false;

    const entry = this.tasks.get(id);
    this.tasks.delete(id);
    this.taskToWorker.delete(id);
    worker.postMessage({ type: "abort", id });
    entry?.reject(new Error("Aborted"));
    // Worker will send "done" and be recycled via handleMessage
    return true;
  }

  /** Terminate all workers, reject all pending tasks. */
  async shutdown(): Promise<void> {
    this.closed = true;

    for (const entry of this.pending) {
      entry.reject(new Error("Shutdown"));
    }
    this.pending = [];

    for (const [, entry] of this.tasks) {
      entry.reject(new Error("Shutdown"));
    }
    this.tasks.clear();

    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers.clear();
    this.available.clear();
    this.taskToWorker.clear();
  }

  get pendingCount(): number {
    return this.pending.length;
  }

  get activeCount(): number {
    return this.taskToWorker.size;
  }

  get workerCount(): number {
    return this.workers.size;
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  private takeAvailable(): Worker {
    const worker = this.available.values().next().value!;
    this.available.delete(worker);
    return worker;
  }

  private createWorker(): Worker {
    const worker = new Worker(this.workerPath);

    const handleMessage = (event: MessageEvent) => {
      if (this.closed) return;
      const msg = event.data;
      if (!msg?.type || !msg?.id) return;

      if (msg.type === "event") {
        const entry = this.tasks.get(msg.id);
        entry?.onEvent?.(msg.id, msg.data);
      } else if (msg.type === "done") {
        const entry = this.tasks.get(msg.id);
        this.tasks.delete(msg.id);
        this.taskToWorker.delete(msg.id);

        if (entry) {
          if (msg.status === "completed") {
            entry.resolve();
          } else {
            entry.reject(new Error(msg.error ?? `Task ${msg.status}`));
          }
        }

        if (this.workers.has(worker)) {
          this.available.add(worker);
          this.tryDispatch();
        }
      }
    };

    const handleError = () => {
      for (const [id, w] of [...this.taskToWorker]) {
        if (w === worker) {
          const entry = this.tasks.get(id);
          this.tasks.delete(id);
          this.taskToWorker.delete(id);
          entry?.reject(new Error("Worker crashed"));
        }
      }
      this.workers.delete(worker);
      this.available.delete(worker);
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);

    this.workers.add(worker);
    return worker;
  }

  private dispatch(worker: Worker, entry: PendingEntry): void {
    const { id } = entry.task;
    this.tasks.set(id, {
      id,
      resolve: entry.resolve,
      reject: entry.reject,
      onEvent: entry.onEvent,
    });
    this.taskToWorker.set(id, worker);
    worker.postMessage({ type: "execute", id, data: entry.task.data });
  }

  private tryDispatch(): void {
    while (this.available.size > 0 && this.pending.length > 0) {
      const worker = this.takeAvailable();
      const entry = this.pending.shift()!;
      this.dispatch(worker, entry);
    }
  }
}
