import type { Job, JobProgress, JobStatus } from "../../shared/types";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const MAX_JOBS = 500;
const DEFAULT_TTL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

type JobFn<T = unknown> = (progress: (p: number, msg?: string) => void, signal?: AbortSignal) => Promise<T>;

export class JobService {
  private jobs = new Map<string, Job>();
  private filePath: string;
  private loaded = false;
  private ttlMs: number;
  private counter = 0;

  private subscribers = new Map<string, Set<(progress: JobProgress) => void>>();
  private abortControllers = new Map<string, AbortController>();

  constructor(filePath?: string, ttlMs?: number) {
    this.filePath = filePath ?? resolve(import.meta.dir, "../../../data/jobs.json");
    this.ttlMs = ttlMs ?? this.defaultTtlMs();
  }

  // ── Lifecycle ──

  create<T = unknown>(type: string, fn: JobFn<T>): Job<T> {
    this.ensureLoaded();
    const job: Job<T> = {
      id: this.nextId(),
      type,
      status: "pending",
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.put(job);

    const controller = new AbortController();
    this.abortControllers.set(job.id, controller);

    Promise.resolve().then(async () => {
      this.updateJob(job, "running", 0);
      try {
        const result = await fn((p, msg) => {
          this.updateJob(job, "running", Math.min(100, Math.max(0, p)));
        }, controller.signal);
        job.result = result;
        this.updateJob(job, "completed", 100);
      } catch (err) {
        job.error = err instanceof Error ? err.message : String(err);
        this.updateJob(job, "failed", job.progress);
      } finally {
        this.finalize(job.id);
      }
    });

    return job;
  }

  cancel(jobId: string): Job | null {
    const job = this.get(jobId);
    if (!job || (job.status !== "running" && job.status !== "pending")) return null;

    const controller = this.abortControllers.get(jobId);
    if (controller) controller.abort();

    job.error = "Cancelled by user";
    this.updateJob(job, "failed", job.progress);
    this.finalize(job.id);
    return job;
  }

  delete(jobId: string): boolean {
    this.subscribers.delete(jobId);
    return this.remove(jobId);
  }

  clearByStatus(statuses: JobStatus[]): number {
    this.ensureLoaded();
    const toDelete: string[] = [];
    for (const [id, job] of this.jobs) {
      if (statuses.includes(job.status)) toDelete.push(id);
    }
    for (const id of toDelete) {
      this.subscribers.delete(id);
      this.jobs.delete(id);
    }
    if (toDelete.length > 0) this.saveToDisk();
    return toDelete.length;
  }

  markInterrupted(): number {
    this.ensureLoaded();
    let count = 0;
    for (const [, job] of this.jobs) {
      if (job.status === "running" || job.status === "pending") {
        job.status = "failed";
        job.error = "Server restarted — workflow interrupted";
        job.updatedAt = Date.now();
        count++;
      }
    }
    if (count > 0) this.saveToDisk();
    return count;
  }

  // ── Queries ──

  get<T = unknown>(jobId: string): Job<T> | undefined {
    return this.ensureAndGet(jobId) as Job<T> | undefined;
  }

  list(status?: string): Job[] {
    this.ensureLoaded();
    this.evictExpired();
    const all = [...this.jobs.values()];
    if (!status) return all;
    return all.filter((j) => j.status === status);
  }

  listHistory(olderThanMs: number = DAY_MS): Job[] {
    this.ensureLoaded();
    const cutoff = Date.now() - olderThanMs;
    return [...this.jobs.values()].filter(
      (j) => this.isTerminal(j.status) && j.updatedAt < cutoff,
    );
  }

  // ── SSE ──

  stream(jobId: string): Response {
    const self = this;
    const encoder = new TextEncoder();
    const job = this.get(jobId);

    if (!job) {
      return new Response(JSON.stringify({ ok: false, error: "Job not found" }), { status: 404 });
    }

    let unsub: (() => void) | undefined;

    const readable = new ReadableStream({
      start(controller) {
        const send = (data: object | null) => {
          if (data === null) {
            try { controller.close(); } catch { /* already closed */ }
            return;
          }
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch {
            // Controller may be closed already
          }
        };

        send({ jobId, status: job.status, progress: job.progress });
        unsub = self.subscribe(jobId, (evt) => send(evt));
      },
      cancel() {
        unsub?.();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // ── Subscriptions ──

  private subscribe(jobId: string, cb: (progress: JobProgress | null) => void): () => void {
    if (!this.subscribers.has(jobId)) this.subscribers.set(jobId, new Set());
    const set = this.subscribers.get(jobId)!;
    set.add(cb as (p: JobProgress) => void);
    return () => set.delete(cb as (p: JobProgress) => void);
  }

  // ── Internal ──

  private updateJob(job: Job, status: JobStatus, progress?: number): void {
    job.status = status;
    if (progress !== undefined) job.progress = progress;
    job.updatedAt = Date.now();
    this.put(job);

    const sub = this.subscribers.get(job.id);
    if (sub) {
      const evt: JobProgress = { jobId: job.id, progress: job.progress };
      for (const cb of sub) cb(evt);
    }
  }

  private finalize(jobId: string): void {
    const sub = this.subscribers.get(jobId);
    if (sub) {
      for (const cb of sub) cb(null as never);
      this.subscribers.delete(jobId);
    }
    this.abortControllers.delete(jobId);
  }

  // ── Persistence (inlined from JobStore) ──

  private put(job: Job): void {
    this.ensureLoaded();
    this.jobs.set(job.id, job);
    this.evictIfNeeded();
    this.saveToDisk();
  }

  private ensureAndGet(id: string): Job | undefined {
    this.ensureLoaded();
    return this.jobs.get(id);
  }

  private remove(id: string): boolean {
    this.ensureLoaded();
    const deleted = this.jobs.delete(id);
    if (deleted) this.saveToDisk();
    return deleted;
  }

  private nextId(): string {
    return `job_${Date.now()}_${++this.counter}`;
  }

  private ensureLoaded(): void {
    if (this.loaded) return;
    this.loaded = true;
    if (existsSync(this.filePath)) {
      try {
        const data = JSON.parse(readFileSync(this.filePath, "utf-8"));
        if (data.jobs && Array.isArray(data.jobs)) {
          for (const job of data.jobs) {
            if (job.id) this.jobs.set(job.id, job);
          }
        }
        if (typeof data.counter === "number") this.counter = data.counter;
      } catch {
        // Corrupted — start fresh
      }
    }
  }

  private saveToDisk(): void {
    const dir = resolve(this.filePath, "..");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const jobs = [...this.jobs.values()];
    writeFileSync(this.filePath, JSON.stringify({ jobs, counter: this.counter }, null, 2));
  }

  private evictExpired(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    for (const [id, job] of this.jobs) {
      if (this.isTerminal(job.status) && now - job.updatedAt > this.ttlMs) {
        toDelete.push(id);
      }
    }
    for (const id of toDelete) this.jobs.delete(id);
  }

  private evictIfNeeded(): void {
    if (this.jobs.size <= MAX_JOBS) return;
    const terminal = [...this.jobs.entries()]
      .filter(([, j]) => this.isTerminal(j.status))
      .sort(([, a], [, b]) => a.updatedAt - b.updatedAt);

    while (this.jobs.size > MAX_JOBS && terminal.length > 0) {
      const [id] = terminal.shift()!;
      this.jobs.delete(id);
    }
  }

  private isTerminal(status: JobStatus): boolean {
    return status === "completed" || status === "failed";
  }

  private defaultTtlMs(): number {
    const env = process.env.JOB_TTL_DAYS;
    if (env) {
      const days = parseInt(env, 10);
      if (days > 0) return days * DAY_MS;
    }
    return DEFAULT_TTL_DAYS * DAY_MS;
  }
}

export const jobService = new JobService();
