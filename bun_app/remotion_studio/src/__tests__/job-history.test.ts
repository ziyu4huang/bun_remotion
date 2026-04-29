import { describe, test, expect, afterEach } from "bun:test";
import { JobStore } from "../server/services/job-store";
import { app } from "../server/index";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Job } from "../shared/types";

let tempDirs: string[] = [];

afterEach(() => {
  for (const d of tempDirs) {
    try { rmSync(d, { recursive: true }); } catch { /* ok */ }
  }
  tempDirs = [];
});

function tempStore(ttlMs: number): JobStore {
  const dir = mkdtempSync(join(tmpdir(), "job-test-"));
  tempDirs.push(dir);
  return new JobStore(join(dir, "jobs.json"), ttlMs);
}

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: `job_test_${Date.now()}_${Math.random()}`,
    type: "test",
    status: "completed",
    progress: 100,
    createdAt: Date.now() - 48 * 60 * 60 * 1000,
    updatedAt: Date.now() - 48 * 60 * 60 * 1000,
    ...overrides,
  };
}

describe("JobStore listHistory", () => {
  test("returns terminal jobs older than threshold", () => {
    const store = tempStore(30 * 24 * 60 * 60 * 1000);
    store.set(makeJob({ id: "old_1", status: "completed", updatedAt: Date.now() - 48 * 60 * 60 * 1000 }));
    store.set(makeJob({ id: "recent_1", status: "completed", updatedAt: Date.now() - 1000 }));
    store.set(makeJob({ id: "old_2", status: "failed", updatedAt: Date.now() - 72 * 60 * 60 * 1000 }));
    store.set(makeJob({ id: "running_1", status: "running", updatedAt: Date.now() - 48 * 60 * 60 * 1000, progress: 50 }));

    const history = store.listHistory(24 * 60 * 60 * 1000);
    expect(history.length).toBe(2);
    expect(history.map((j) => j.id).sort()).toEqual(["old_1", "old_2"]);
  });

  test("excludes running/pending jobs regardless of age", () => {
    const store = tempStore(30 * 24 * 60 * 60 * 1000);
    store.set(makeJob({ id: "running", status: "running", updatedAt: Date.now() - 72 * 60 * 60 * 1000 }));
    store.set(makeJob({ id: "pending", status: "pending", updatedAt: Date.now() - 72 * 60 * 60 * 1000, progress: 0 }));
    store.set(makeJob({ id: "completed", status: "completed", updatedAt: Date.now() - 72 * 60 * 60 * 1000 }));

    const history = store.listHistory(24 * 60 * 60 * 1000);
    expect(history.length).toBe(1);
    expect(history[0].id).toBe("completed");
  });

  test("returns empty when no old terminal jobs", () => {
    const store = tempStore(30 * 24 * 60 * 60 * 1000);
    store.set(makeJob({ id: "recent", status: "completed", updatedAt: Date.now() - 1000 }));
    const history = store.listHistory(24 * 60 * 60 * 1000);
    expect(history.length).toBe(0);
  });
});

describe("GET /api/jobs/history", () => {
  test("returns ok with array", async () => {
    const res = await app.fetch(new Request("http://localhost/api/jobs/history"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("accepts olderThan query param in hours", async () => {
    const res = await app.fetch(new Request("http://localhost/api/jobs/history?olderThan=48h"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("accepts olderThan query param in days", async () => {
    const res = await app.fetch(new Request("http://localhost/api/jobs/history?olderThan=3d"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});
