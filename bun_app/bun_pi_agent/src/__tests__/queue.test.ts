import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { BackgroundQueue, type TaskFn, type TerminalStatus } from "../queue.js";
import {
  initStore,
  getRun,
  setRun,
  saveRun,
  EMPTY_USAGE,
  type RunState,
} from "../store.js";
import type { Run } from "acp-sdk";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRun(overrides?: Partial<Run>): Run {
  return {
    run_id: "test-run",
    agent_name: "bun_pi_agent",
    session_id: "test-session",
    status: "created",
    output: [],
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeState(overrides?: Partial<RunState>): RunState {
  return {
    run: makeRun(),
    events: [],
    usage: { ...EMPTY_USAGE },
    agent: null,
    abortController: new AbortController(),
    ...overrides,
  };
}

function createTask() {
  let started!: () => void;
  const startedPromise = new Promise<void>((r) => {
    started = r;
  });

  let _resolve!: () => void;
  let _reject!: (err: Error) => void;
  const done = new Promise<void>((res, rej) => {
    _resolve = res;
    _reject = rej;
  });

  const fn: TaskFn = async (signal) => {
    started();
    const onAbort = () => {
      signal.removeEventListener("abort", onAbort);
      _reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort);
    try {
      await done;
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
  };

  return {
    fn,
    started: startedPromise,
    resolve: () => _resolve(),
    reject: (err?: Error) => _reject(err ?? new Error("Task failed")),
  };
}

/** Instant task that resolves immediately. */
const instantTask: TaskFn = async () => {};

/** Failing task that throws immediately. */
const failingTask: TaskFn = async () => {
  throw new Error("Task failed");
};

// ---------------------------------------------------------------------------
// Enqueue + basic execution
// ---------------------------------------------------------------------------

describe("BackgroundQueue — enqueue and execute", () => {
  let tmpDir: string;
  let queue: BackgroundQueue;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "pi-queue-test-"));
    initStore(tmpDir);
    queue = new BackgroundQueue({ maxConcurrent: 2, timeoutMs: 5000 });
  });

  afterEach(async () => {
    await queue.shutdown();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("enqueue dispatches immediately when slot available", async () => {
    const task = createTask();
    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));

    queue.enqueue("run-1", task.fn);
    await task.started;

    expect(queue.activeCount).toBe(1);
    expect(queue.pendingCount).toBe(0);
    expect(getRun("run-1")!.run.status).toBe("in-progress");

    task.resolve();
    // Wait for queue to process completion
    await new Promise((r) => setTimeout(r, 10));

    expect(getRun("run-1")!.run.status).toBe("completed");
  });

  test("enqueue queues when slots full", async () => {
    const task1 = createTask();
    const task2 = createTask();
    const task3 = createTask();

    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));
    setRun("run-2", makeState({ run: makeRun({ run_id: "run-2" }) }));
    setRun("run-3", makeState({ run: makeRun({ run_id: "run-3" }) }));

    queue.enqueue("run-1", task1.fn);
    queue.enqueue("run-2", task2.fn);
    queue.enqueue("run-3", task3.fn);

    await Promise.all([task1.started, task2.started]);

    expect(queue.activeCount).toBe(2);
    expect(queue.pendingCount).toBe(1);
    expect(getRun("run-3")!.run.status).toBe("created");
  });

  test("completed task persists to store", async () => {
    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));
    queue.enqueue("run-1", instantTask);

    await new Promise((r) => setTimeout(r, 20));

    const state = getRun("run-1");
    expect(state!.run.status).toBe("completed");
    expect(state!.run.finished_at).toBeDefined();
    expect(state!.events.some((e) => e.type === "run.completed")).toBe(true);
  });

  test("failed task persists error to store", async () => {
    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));
    queue.enqueue("run-1", failingTask);

    await new Promise((r) => setTimeout(r, 20));

    const state = getRun("run-1");
    expect(state!.run.status).toBe("failed");
    expect(state!.run.error).toBeDefined();
    expect(state!.events.some((e) => e.type === "run.failed")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Concurrency
// ---------------------------------------------------------------------------

describe("BackgroundQueue — concurrency", () => {
  let tmpDir: string;
  let queue: BackgroundQueue;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "pi-queue-test-"));
    initStore(tmpDir);
    queue = new BackgroundQueue({ maxConcurrent: 2, timeoutMs: 5000 });
  });

  afterEach(async () => {
    await queue.shutdown();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("respects maxConcurrent limit", async () => {
    const tasks = [createTask(), createTask(), createTask()];

    for (let i = 0; i < 3; i++) {
      const id = `run-${i}`;
      setRun(id, makeState({ run: makeRun({ run_id: id }) }));
      queue.enqueue(id, tasks[i].fn);
    }

    await Promise.all([tasks[0].started, tasks[1].started]);

    expect(queue.activeCount).toBe(2);
    expect(queue.pendingCount).toBe(1);
  });

  test("pending task dispatches when slot opens", async () => {
    const tasks = [createTask(), createTask(), createTask()];

    for (let i = 0; i < 3; i++) {
      const id = `run-${i}`;
      setRun(id, makeState({ run: makeRun({ run_id: id }) }));
      queue.enqueue(id, tasks[i].fn);
    }

    await Promise.all([tasks[0].started, tasks[1].started]);
    expect(queue.pendingCount).toBe(1);

    // Complete first task → third task should dispatch
    tasks[0].resolve();
    await tasks[2].started;

    expect(queue.activeCount).toBe(2);
    expect(queue.pendingCount).toBe(0);

    tasks[1].resolve();
    tasks[2].resolve();
  });
});

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------

describe("BackgroundQueue — cancel", () => {
  let tmpDir: string;
  let queue: BackgroundQueue;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "pi-queue-test-"));
    initStore(tmpDir);
    queue = new BackgroundQueue({ maxConcurrent: 1, timeoutMs: 5000 });
  });

  afterEach(async () => {
    await queue.shutdown();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("cancel pending task removes from queue", () => {
    const task1 = createTask();
    const task2 = createTask();

    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));
    setRun("run-2", makeState({ run: makeRun({ run_id: "run-2" }) }));

    queue.enqueue("run-1", task1.fn);
    queue.enqueue("run-2", task2.fn);

    expect(queue.pendingCount).toBe(1);

    const result = queue.cancel("run-2");
    expect(result).toBe(true);
    expect(queue.pendingCount).toBe(0);

    const state = getRun("run-2");
    expect(state!.run.status).toBe("cancelled");

    task1.resolve();
  });

  test("cancel running task aborts execution", async () => {
    const task = createTask();
    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));

    queue.enqueue("run-1", task.fn);
    await task.started;

    expect(queue.activeCount).toBe(1);

    queue.cancel("run-1");

    // Wait for abort to propagate
    await new Promise((r) => setTimeout(r, 20));

    expect(getRun("run-1")!.run.status).toBe("cancelled");
    expect(queue.activeCount).toBe(0);
  });

  test("cancel returns false for unknown run", () => {
    expect(queue.cancel("nonexistent")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Callbacks
// ---------------------------------------------------------------------------

describe("BackgroundQueue — onComplete callbacks", () => {
  let tmpDir: string;
  let queue: BackgroundQueue;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "pi-queue-test-"));
    initStore(tmpDir);
    queue = new BackgroundQueue({ maxConcurrent: 2, timeoutMs: 5000 });
  });

  afterEach(async () => {
    await queue.shutdown();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("fires callback on completion", async () => {
    const statuses: TerminalStatus[] = [];
    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));

    queue.onComplete("run-1", (_id, status) => statuses.push(status));
    queue.enqueue("run-1", instantTask);

    await new Promise((r) => setTimeout(r, 20));

    expect(statuses).toEqual(["completed"]);
  });

  test("fires callback on failure", async () => {
    const statuses: TerminalStatus[] = [];
    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));

    queue.onComplete("run-1", (_id, status) => statuses.push(status));
    queue.enqueue("run-1", failingTask);

    await new Promise((r) => setTimeout(r, 20));

    expect(statuses).toEqual(["failed"]);
  });

  test("fires callback on cancellation", async () => {
    const task = createTask();
    const statuses: TerminalStatus[] = [];
    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));

    queue.onComplete("run-1", (_id, status) => statuses.push(status));
    queue.enqueue("run-1", task.fn);
    await task.started;
    queue.cancel("run-1");

    await new Promise((r) => setTimeout(r, 20));

    expect(statuses).toEqual(["cancelled"]);
  });

  test("unsubscribe removes callback", async () => {
    const statuses: TerminalStatus[] = [];
    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));

    const unsub = queue.onComplete("run-1", (_id, status) =>
      statuses.push(status),
    );
    unsub();
    queue.enqueue("run-1", instantTask);

    await new Promise((r) => setTimeout(r, 20));

    expect(statuses).toEqual([]);
  });

  test("multiple callbacks for same run", async () => {
    const s1: TerminalStatus[] = [];
    const s2: TerminalStatus[] = [];
    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));

    queue.onComplete("run-1", (_id, status) => s1.push(status));
    queue.onComplete("run-1", (_id, status) => s2.push(status));
    queue.enqueue("run-1", instantTask);

    await new Promise((r) => setTimeout(r, 20));

    expect(s1).toEqual(["completed"]);
    expect(s2).toEqual(["completed"]);
  });
});

// ---------------------------------------------------------------------------
// Timeout
// ---------------------------------------------------------------------------

describe("BackgroundQueue — timeout", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "pi-queue-test-"));
    initStore(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("task cancelled after timeout", async () => {
    const queue = new BackgroundQueue({ maxConcurrent: 1, timeoutMs: 50 });
    const task = createTask();
    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));

    queue.enqueue("run-1", task.fn);
    await task.started;

    // Wait for timeout
    await new Promise((r) => setTimeout(r, 100));

    expect(getRun("run-1")!.run.status).toBe("cancelled");
    expect(queue.activeCount).toBe(0);

    await queue.shutdown();
  });
});

// ---------------------------------------------------------------------------
// Shutdown
// ---------------------------------------------------------------------------

describe("BackgroundQueue — shutdown", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "pi-queue-test-"));
    initStore(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("cancels pending tasks", async () => {
    const queue = new BackgroundQueue({ maxConcurrent: 1, timeoutMs: 5000 });
    const task1 = createTask();
    const task2 = createTask();

    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));
    setRun("run-2", makeState({ run: makeRun({ run_id: "run-2" }) }));

    queue.enqueue("run-1", task1.fn);
    queue.enqueue("run-2", task2.fn);

    await task1.started;

    await queue.shutdown();

    expect(getRun("run-2")!.run.status).toBe("cancelled");
  });

  test("waits for active tasks to settle", async () => {
    const queue = new BackgroundQueue({ maxConcurrent: 1, timeoutMs: 5000 });
    const task = createTask();
    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));

    queue.enqueue("run-1", task.fn);
    await task.started;

    // Shutdown aborts the active task
    await queue.shutdown();

    expect(getRun("run-1")!.run.status).toBe("cancelled");
    expect(queue.activeCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getStatus
// ---------------------------------------------------------------------------

describe("BackgroundQueue — getStatus", () => {
  let tmpDir: string;
  let queue: BackgroundQueue;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "pi-queue-test-"));
    initStore(tmpDir);
    queue = new BackgroundQueue({ maxConcurrent: 1, timeoutMs: 5000 });
  });

  afterEach(async () => {
    await queue.shutdown();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("returns 'pending' for queued task", async () => {
    const task1 = createTask();
    const task2 = createTask();

    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));
    setRun("run-2", makeState({ run: makeRun({ run_id: "run-2" }) }));

    queue.enqueue("run-1", task1.fn);
    queue.enqueue("run-2", task2.fn);

    expect(queue.getStatus("run-2")).toBe("pending");

    task1.resolve();
    task2.resolve();
  });

  test("returns store status for active task", async () => {
    const task = createTask();
    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));

    queue.enqueue("run-1", task.fn);
    await task.started;

    expect(queue.getStatus("run-1")).toBe("in-progress");

    task.resolve();
  });

  test("returns undefined for unknown run", () => {
    expect(queue.getStatus("nonexistent")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Config integration
// ---------------------------------------------------------------------------

describe("config queue vars", () => {
  test("default values", () => {
    delete process.env.PI_AGENT_MAX_CONCURRENT_RUNS;
    delete process.env.PI_AGENT_QUEUE_TIMEOUT_MS;

    const { getConfig } = require("../config.js");
    const config = getConfig();

    expect(config.maxConcurrentRuns).toBe(4);
    expect(config.queueTimeoutMs).toBe(300_000);
  });

  test("custom env vars", () => {
    process.env.PI_AGENT_MAX_CONCURRENT_RUNS = "8";
    process.env.PI_AGENT_QUEUE_TIMEOUT_MS = "60000";

    const { getConfig } = require("../config.js");
    const config = getConfig();

    expect(config.maxConcurrentRuns).toBe(8);
    expect(config.queueTimeoutMs).toBe(60_000);

    delete process.env.PI_AGENT_MAX_CONCURRENT_RUNS;
    delete process.env.PI_AGENT_QUEUE_TIMEOUT_MS;
  });
});
