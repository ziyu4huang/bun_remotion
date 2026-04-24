import type { Job, JobProgress, JobStatus } from "../../shared/types";

type JobFn<T = unknown> = (progress: (p: number, msg?: string) => void) => Promise<T>;

const jobs = new Map<string, Job>();
const subscribers = new Map<string, Set<(progress: JobProgress) => void>>();

let counter = 0;

function nextId(): string {
  return `job_${Date.now()}_${++counter}`;
}

function updateJob(job: Job, status: JobStatus, progress?: number): void {
  job.status = status;
  if (progress !== undefined) job.progress = progress;
  job.updatedAt = Date.now();

  const sub = subscribers.get(job.id);
  if (sub) {
    const evt: JobProgress = { jobId: job.id, progress: job.progress };
    for (const cb of sub) cb(evt);
  }
}

export function createJob<T = unknown>(type: string, fn: JobFn<T>): Job<T> {
  const job: Job<T> = {
    id: nextId(),
    type,
    status: "pending",
    progress: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  jobs.set(job.id, job);

  // run async
  Promise.resolve().then(async () => {
    updateJob(job, "running", 0);
    try {
      const result = await fn((p, msg) => {
        updateJob(job, "running", Math.min(100, Math.max(0, p)));
      });
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
    }
  });

  return job;
}

export function getJob<T = unknown>(jobId: string): Job<T> | undefined {
  return jobs.get(jobId) as Job<T> | undefined;
}

export function listJobs(): Job[] {
  return [...jobs.values()];
}

export function subscribe(jobId: string, cb: (progress: JobProgress | null) => void): () => void {
  if (!subscribers.has(jobId)) subscribers.set(jobId, new Set());
  const set = subscribers.get(jobId)!;
  set.add(cb as (p: JobProgress) => void);
  return () => set.delete(cb as (p: JobProgress) => void);
}

/** Build an SSE Response that streams progress events for a job until completion/failure. */
export function sseStream(jobId: string): Response {
  const encoder = new TextEncoder();
  const job = jobs.get(jobId);

  if (!job) {
    return new Response(JSON.stringify({ ok: false, error: "Job not found" }), { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object | null) => {
        if (data === null) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // send initial state
      send({ jobId, status: job.status, progress: job.progress });

      const unsub = subscribe(jobId, (evt) => send(evt));

      // cleanup on abort
      // (Bun doesn't expose abort signal on ReadableStream easily;
      //  the null sentinel from createJob closes the stream)
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
