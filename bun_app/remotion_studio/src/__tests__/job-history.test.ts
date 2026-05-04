import { describe, test, expect, afterEach } from "bun:test";
import { JobService } from "../server/middleware/job-service";
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

function tempService(ttlMs: number): JobService {
  const dir = mkdtempSync(join(tmpdir(), "job-test-"));
  tempDirs.push(dir);
  return new JobService(join(dir, "jobs.json"), ttlMs);
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

describe("JobService listHistory", () => {
  test("returns terminal jobs older than threshold", () => {
    const service = tempService(30 * 24 * 60 * 60 * 1000);
    // Access internal put via any for testing
    const store = service as any;
    store["jobs"].set("old_1", makeJob({ id: "old_1", status: "completed", updatedAt: Date.now() - 48 * 60 * 60 * 1000 }));
    store["jobs"].set("recent_1", makeJob({ id: "recent_1", status: "completed", updatedAt: Date.now() - 1000 }));
    store["jobs"].set("old_2", makeJob({ id: "old_2", status: "failed", updatedAt: Date.now() - 72 * 60 * 60 * 1000 }));
    store["jobs"].set("running_1", makeJob({ id: "running_1", status: "running", updatedAt: Date.now() - 48 * 60 * 60 * 1000, progress: 50 }));
    store["loaded"] = true;

    const history = service.listHistory(24 * 60 * 60 * 1000);
    expect(history.length).toBe(2);
    expect(history.map((j) => j.id).sort()).toEqual(["old_1", "old_2"]);
  });

  test("excludes running/pending jobs regardless of age", () => {
    const service = tempService(30 * 24 * 60 * 60 * 1000);
    const store = service as any;
    store["jobs"].set("running", makeJob({ id: "running", status: "running", updatedAt: Date.now() - 72 * 60 * 60 * 1000 }));
    store["jobs"].set("pending", makeJob({ id: "pending", status: "pending", updatedAt: Date.now() - 72 * 60 * 60 * 1000, progress: 0 }));
    store["jobs"].set("completed", makeJob({ id: "completed", status: "completed", updatedAt: Date.now() - 72 * 60 * 60 * 1000 }));
    store["loaded"] = true;

    const history = service.listHistory(24 * 60 * 60 * 1000);
    expect(history.length).toBe(1);
    expect(history[0].id).toBe("completed");
  });

  test("returns empty when no old terminal jobs", () => {
    const service = tempService(30 * 24 * 60 * 60 * 1000);
    const store = service as any;
    store["jobs"].set("recent", makeJob({ id: "recent", status: "completed", updatedAt: Date.now() - 1000 }));
    store["loaded"] = true;

    const history = service.listHistory(24 * 60 * 60 * 1000);
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

describe("JobService clearByStatus", () => {
  test("clears only completed jobs", () => {
    const service = tempService(30 * 24 * 60 * 60 * 1000);
    const store = service as any;
    store["jobs"].set("c1", makeJob({ id: "c1", status: "completed" }));
    store["jobs"].set("f1", makeJob({ id: "f1", status: "failed" }));
    store["jobs"].set("r1", makeJob({ id: "r1", status: "running", progress: 50 }));
    store["loaded"] = true;

    const deleted = service.clearByStatus(["completed"]);
    expect(deleted).toBe(1);
    expect(store["jobs"].has("c1")).toBe(false);
    expect(store["jobs"].has("f1")).toBe(true);
    expect(store["jobs"].has("r1")).toBe(true);
  });

  test("clears only failed jobs", () => {
    const service = tempService(30 * 24 * 60 * 60 * 1000);
    const store = service as any;
    store["jobs"].set("c1", makeJob({ id: "c1", status: "completed" }));
    store["jobs"].set("f1", makeJob({ id: "f1", status: "failed" }));
    store["loaded"] = true;

    const deleted = service.clearByStatus(["failed"]);
    expect(deleted).toBe(1);
    expect(store["jobs"].has("c1")).toBe(true);
    expect(store["jobs"].has("f1")).toBe(false);
  });

  test("clears all terminal jobs (completed + failed)", () => {
    const service = tempService(30 * 24 * 60 * 60 * 1000);
    const store = service as any;
    store["jobs"].set("c1", makeJob({ id: "c1", status: "completed" }));
    store["jobs"].set("c2", makeJob({ id: "c2", status: "completed" }));
    store["jobs"].set("f1", makeJob({ id: "f1", status: "failed" }));
    store["jobs"].set("r1", makeJob({ id: "r1", status: "running", progress: 30 }));
    store["loaded"] = true;

    const deleted = service.clearByStatus(["completed", "failed"]);
    expect(deleted).toBe(3);
    expect(store["jobs"].size).toBe(1);
    expect(store["jobs"].has("r1")).toBe(true);
  });

  test("returns 0 when no matching jobs", () => {
    const service = tempService(30 * 24 * 60 * 60 * 1000);
    const store = service as any;
    store["jobs"].set("r1", makeJob({ id: "r1", status: "running", progress: 10 }));
    store["loaded"] = true;

    const deleted = service.clearByStatus(["completed"]);
    expect(deleted).toBe(0);
    expect(store["jobs"].size).toBe(1);
  });
});

describe("DELETE /api/jobs/clear", () => {
  test("returns 400 when status param missing", async () => {
    const res = await app.fetch(new Request("http://localhost/api/jobs/clear", { method: "DELETE" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
  });

  test("returns ok with deleted count", async () => {
    const res = await app.fetch(new Request("http://localhost/api/jobs/clear?status=completed", { method: "DELETE" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(typeof data.data.deleted).toBe("number");
  });

  test("accepts comma-separated statuses", async () => {
    const res = await app.fetch(new Request("http://localhost/api/jobs/clear?status=completed,failed", { method: "DELETE" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});
