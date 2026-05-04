import { describe, test, expect, afterEach } from "bun:test";
import { join } from "path";
import { WorkerPool } from "../worker-pool.js";

const TEST_WORKER = join(import.meta.dir, "..", "workers", "test-worker.ts");

// ---------------------------------------------------------------------------
// Submit + execute
// ---------------------------------------------------------------------------

describe("WorkerPool — submit and execute", () => {
  let pool: WorkerPool;

  afterEach(async () => {
    await pool?.shutdown();
  });

  test("executes task and resolves", async () => {
    pool = new WorkerPool({ workerPath: TEST_WORKER, maxWorkers: 2 });
    await pool.submit({ id: "t1", data: {} });
  });

  test("receives events from worker", async () => {
    pool = new WorkerPool({ workerPath: TEST_WORKER, maxWorkers: 2 });

    const events: unknown[] = [];
    await pool.submit(
      { id: "t1", data: { events: ["a", "b"] } },
      (_id, evt) => events.push(evt),
    );

    expect(events).toEqual(["a", "b"]);
  });

  test("rejects on task failure", async () => {
    pool = new WorkerPool({ workerPath: TEST_WORKER, maxWorkers: 2 });

    await expect(
      pool.submit({ id: "t1", data: { fail: true } }),
    ).rejects.toThrow("Task failed");
  });
});

// ---------------------------------------------------------------------------
// Concurrency
// ---------------------------------------------------------------------------

describe("WorkerPool — concurrency", () => {
  let pool: WorkerPool;

  afterEach(async () => {
    await pool?.shutdown();
  });

  test("limits workers to maxWorkers", async () => {
    pool = new WorkerPool({ workerPath: TEST_WORKER, maxWorkers: 2 });

    const p1 = pool.submit({ id: "t1", data: { delay: 200 } });
    const p2 = pool.submit({ id: "t2", data: { delay: 200 } });
    const p3 = pool.submit({ id: "t3", data: {} });

    // t1 and t2 occupy both slots; t3 should be queued
    await new Promise((r) => setTimeout(r, 50));
    expect(pool.activeCount).toBe(2);
    expect(pool.pendingCount).toBe(1);

    await Promise.allSettled([p1, p2, p3]);
  });

  test("dispatches pending when worker frees", async () => {
    pool = new WorkerPool({ workerPath: TEST_WORKER, maxWorkers: 1 });

    const p1 = pool.submit({ id: "t1", data: { delay: 100 } });
    const p2 = pool.submit({ id: "t2", data: {} });

    await new Promise((r) => setTimeout(r, 30));
    expect(pool.pendingCount).toBe(1);

    await Promise.allSettled([p1, p2]);
    expect(pool.pendingCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Recycling
// ---------------------------------------------------------------------------

describe("WorkerPool — recycling", () => {
  let pool: WorkerPool;

  afterEach(async () => {
    await pool?.shutdown();
  });

  test("reuses the same worker for sequential tasks", async () => {
    pool = new WorkerPool({ workerPath: TEST_WORKER, maxWorkers: 1 });

    await pool.submit({ id: "t1", data: {} });
    await pool.submit({ id: "t2", data: {} });

    expect(pool.workerCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Abort
// ---------------------------------------------------------------------------

describe("WorkerPool — abort", () => {
  let pool: WorkerPool;

  afterEach(async () => {
    await pool?.shutdown();
  });

  test("aborts a running task", async () => {
    pool = new WorkerPool({ workerPath: TEST_WORKER, maxWorkers: 1 });

    const p = pool.submit({ id: "t1", data: { delay: 5000 } });

    await new Promise((r) => setTimeout(r, 30));
    expect(pool.activeCount).toBe(1);

    const result = pool.abort("t1");
    expect(result).toBe(true);

    await expect(p).rejects.toThrow("Aborted");
  });

  test("aborts a pending task", async () => {
    pool = new WorkerPool({ workerPath: TEST_WORKER, maxWorkers: 1 });

    const p1 = pool.submit({ id: "t1", data: { delay: 5000 } });
    const p2 = pool.submit({ id: "t2", data: {} });

    await new Promise((r) => setTimeout(r, 30));
    expect(pool.pendingCount).toBe(1);

    pool.abort("t2");
    await expect(p2).rejects.toThrow("Aborted");

    // Clean up t1
    pool.abort("t1");
    await expect(p1).rejects.toThrow();
  });

  test("returns false for unknown task", () => {
    pool = new WorkerPool({ workerPath: TEST_WORKER, maxWorkers: 1 });
    expect(pool.abort("nonexistent")).toBe(false);
  });

  test("worker is recycled after abort", async () => {
    pool = new WorkerPool({ workerPath: TEST_WORKER, maxWorkers: 1 });

    const p1 = pool.submit({ id: "t1", data: { delay: 5000 } });
    await new Promise((r) => setTimeout(r, 30));

    pool.abort("t1");
    await expect(p1).rejects.toThrow();

    // Wait for worker to be recycled
    await new Promise((r) => setTimeout(r, 30));

    // Should reuse the worker
    await pool.submit({ id: "t2", data: {} });
    expect(pool.workerCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Shutdown
// ---------------------------------------------------------------------------

describe("WorkerPool — shutdown", () => {
  test("rejects pending tasks on shutdown", async () => {
    const pool = new WorkerPool({ workerPath: TEST_WORKER, maxWorkers: 1 });

    const p1 = pool.submit({ id: "t1", data: { delay: 5000 } });
    const p2 = pool.submit({ id: "t2", data: {} });

    await new Promise((r) => setTimeout(r, 30));
    await pool.shutdown();

    await expect(p1).rejects.toThrow();
    await expect(p2).rejects.toThrow();
  });

  test("rejects new submissions after shutdown", async () => {
    const pool = new WorkerPool({ workerPath: TEST_WORKER, maxWorkers: 1 });
    await pool.shutdown();

    await expect(
      pool.submit({ id: "t1", data: {} }),
    ).rejects.toThrow("Pool is shut down");
  });
});
