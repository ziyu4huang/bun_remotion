import type { Job, JobProgress, JobStatus } from "../../shared/types";
import { JobStore } from "../services/job-store";

type JobFn<T = unknown> = (progress: (p: number, msg?: string) => void, signal?: AbortSignal) => Promise<T>;

const store = new JobStore();
const subscribers = new Map<string, Set<(progress: JobProgress) => void>>();
const abortControllers = new Map<string, AbortController>();

function updateJob(job: Job, status: JobStatus, progress?: number): void {
  job.status = status;
  if (progress !== undefined) job.progress = progress;
  job.updatedAt = Date.now();
  store.set(job);

  const sub = subscribers.get(job.id);
  if (sub) {
    const evt: JobProgress = { jobId: job.id, progress: job.progress };
    for (const cb of sub) cb(evt);
  }
}

export function createJob<T = unknown>(type: string, fn: JobFn<T>): Job<T> {
  const job: Job<T> = {
    id: store.nextId(),
    type,
    status: "pending",
    progress: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  store.set(job);

  const controller = new AbortController();
  abortControllers.set(job.id, controller);

  // run async
  Promise.resolve().then(async () => {
    updateJob(job, "running", 0);
    try {
      const result = await fn((p, msg) => {
        updateJob(job, "running", Math.min(100, Math.max(0, p)));
      }, controller.signal);
      job.result = result;
      updateJob(job, "completed", 100);
    } catch (err) {
      job.error = err instanceof Error ? err.message : String(err);
      updateJob(job, "failed", job.progress);
    } finally {
      const sub = subscribers.get(job.id);
      if (sub) {
        for (const cb of sub) cb(null as never);
        subscribers.delete(job.id);
      }
      abortControllers.delete(job.id);
    }
  });

  return job;
}

export function cancelJob(jobId: string): Job | null {
  const job = store.get(jobId);
  if (!job || (job.status !== "running" && job.status !== "pending")) return null;

  // Abort the running workflow
  const controller = abortControllers.get(jobId);
  if (controller) controller.abort();

  job.error = "Cancelled by user";
  updateJob(job, "failed", job.progress);
  const sub = subscribers.get(job.id);
  if (sub) {
    for (const cb of sub) cb(null as never);
    subscribers.delete(job.id);
  }
  return job;
}

export function deleteJob(jobId: string): boolean {
  subscribers.delete(jobId);
  return store.delete(jobId);
}

export function getJob<T = unknown>(jobId: string): Job<T> | undefined {
  return store.get(jobId) as Job<T> | undefined;
}

export function listJobs(status?: string): Job[] {
  return store.list(status);
}

export function listJobHistory(olderThanMs?: number): Job[] {
  return store.listHistory(olderThanMs);
}

export function subscribe(jobId: string, cb: (progress: JobProgress | null) => void): () => void {
  if (!subscribers.has(jobId)) subscribers.set(jobId, new Set());
  const set = subscribers.get(jobId)!;
  set.add(cb as (p: JobProgress) => void);
  return () => set.delete(cb as (p: JobProgress) => void);
}

export function markInterruptedJobs(): number {
  return store.markInterrupted();
}

/** Build an SSE Response that streams progress events for a job until completion/failure. */
export function sseStream(jobId: string): Response {
  const encoder = new TextEncoder();
  const job = store.get(jobId);

  if (!job) {
    return new Response(JSON.stringify({ ok: false, error: "Job not found" }), { status: 404 });
  }

  let unsub: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object | null) => {
        if (data === null) {
          try { controller.close(); } catch { /* already closed */ }
          return;
        }
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller may be closed already (client disconnected)
        }
      };

      // send initial state
      send({ jobId, status: job.status, progress: job.progress });

      unsub = subscribe(jobId, (evt) => send(evt));
    },
    cancel() {
      unsub?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
