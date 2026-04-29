import type { Job, JobStatus } from "../../shared/types";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const MAX_JOBS = 500;
const DEFAULT_TTL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

let counter = 0;

function getTtlMs(): number {
  const env = process.env.JOB_TTL_DAYS;
  if (env) {
    const days = parseInt(env, 10);
    if (days > 0) return days * DAY_MS;
  }
  return DEFAULT_TTL_DAYS * DAY_MS;
}

export class JobStore {
  private jobs = new Map<string, Job>();
  private filePath: string;
  private loaded = false;
  private ttlMs: number;

  constructor(filePath?: string, ttlMs?: number) {
    this.filePath = filePath ?? resolve(import.meta.dir, "../../../data/jobs.json");
    this.ttlMs = ttlMs ?? getTtlMs();
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
        if (typeof data.counter === "number") counter = data.counter;
      } catch {
        // Corrupted — start fresh
      }
    }
  }

  private saveToDisk(): void {
    const dir = resolve(this.filePath, "..");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const jobs = [...this.jobs.values()];
    writeFileSync(this.filePath, JSON.stringify({ jobs, counter }, null, 2));
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

  set(job: Job): void {
    this.ensureLoaded();
    this.jobs.set(job.id, job);
    this.evictIfNeeded();
    this.saveToDisk();
  }

  get(id: string): Job | undefined {
    this.ensureLoaded();
    return this.jobs.get(id);
  }

  list(status?: string): Job[] {
    this.ensureLoaded();
    this.evictExpired();
    const all = [...this.jobs.values()];
    if (!status) return all;
    return all.filter((j) => j.status === status);
  }

  /** Return terminal jobs older than `olderThanMs` (default 24h). */
  listHistory(olderThanMs: number = DAY_MS): Job[] {
    this.ensureLoaded();
    const cutoff = Date.now() - olderThanMs;
    return [...this.jobs.values()].filter(
      (j) => this.isTerminal(j.status) && j.updatedAt < cutoff,
    );
  }

  delete(id: string): boolean {
    this.ensureLoaded();
    const deleted = this.jobs.delete(id);
    if (deleted) this.saveToDisk();
    return deleted;
  }

  /** Mark running/pending jobs as failed after server restart. */
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

  nextId(): string {
    return `job_${Date.now()}_${++counter}`;
  }
}
