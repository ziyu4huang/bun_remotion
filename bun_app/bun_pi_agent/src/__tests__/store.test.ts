import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  initStore,
  getRun,
  setRun,
  listRuns,
  saveRun,
  deleteRun,
  cleanupRuns,
  EMPTY_USAGE,
  accumulateUsage,
  type RunState,
  type TokenUsage,
} from "../store.js";
import type { Run } from "acp-sdk";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRun(overrides?: Partial<Run>): Run {
  return {
    run_id: "test-run-id",
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

// ---------------------------------------------------------------------------
// Token usage accumulation
// ---------------------------------------------------------------------------

describe("accumulateUsage", () => {
  test("returns unchanged for non-turn_end events", () => {
    const usage = accumulateUsage(EMPTY_USAGE, { type: "message_update" } as any);
    expect(usage).toEqual(EMPTY_USAGE);
  });

  test("returns unchanged for turn_end without usage", () => {
    const event = { type: "turn_end", message: { role: "assistant" } };
    const usage = accumulateUsage(EMPTY_USAGE, event as any);
    expect(usage).toEqual(EMPTY_USAGE);
  });

  test("accumulates tokens from turn_end event", () => {
    const event = {
      type: "turn_end",
      message: {
        role: "assistant",
        usage: {
          input: 100,
          output: 50,
          cacheRead: 10,
          cacheWrite: 5,
          totalTokens: 165,
          cost: { input: 0.001, output: 0.002, cacheRead: 0.0001, cacheWrite: 0.0005, total: 0.0036 },
        },
      },
    };

    const result = accumulateUsage(EMPTY_USAGE, event as any);
    expect(result.inputTokens).toBe(100);
    expect(result.outputTokens).toBe(50);
    expect(result.cacheReadTokens).toBe(10);
    expect(result.cacheWriteTokens).toBe(5);
    expect(result.totalTokens).toBe(165);
    expect(result.estimatedCost).toBe(0.0036);
  });

  test("accumulates across multiple events", () => {
    const event1 = {
      type: "turn_end",
      message: {
        role: "assistant",
        usage: {
          input: 100, output: 50, cacheRead: 0, cacheWrite: 0,
          totalTokens: 150, cost: { total: 0.001 },
        },
      },
    };
    const event2 = {
      type: "turn_end",
      message: {
        role: "assistant",
        usage: {
          input: 80, output: 40, cacheRead: 5, cacheWrite: 0,
          totalTokens: 125, cost: { total: 0.0008 },
        },
      },
    };

    let usage = accumulateUsage(EMPTY_USAGE, event1 as any);
    usage = accumulateUsage(usage, event2 as any);

    expect(usage.inputTokens).toBe(180);
    expect(usage.outputTokens).toBe(90);
    expect(usage.totalTokens).toBe(275);
    expect(usage.estimatedCost).toBeCloseTo(0.0018);
  });
});

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

describe("store in-memory operations", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "pi-agent-test-"));
    initStore(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("set and get a run", () => {
    const state = makeState();
    setRun("run-1", state);

    const got = getRun("run-1");
    expect(got).toBeDefined();
    expect(got!.run.run_id).toBe("test-run-id");
  });

  test("get returns undefined for unknown run", () => {
    expect(getRun("nonexistent")).toBeUndefined();
  });

  test("listRuns returns all runs", () => {
    setRun("run-1", makeState({ run: makeRun({ run_id: "run-1" }) }));
    setRun("run-2", makeState({ run: makeRun({ run_id: "run-2" }) }));

    const runs = listRuns();
    expect(runs).toHaveLength(2);
    expect(runs.map((r) => r.run_id).sort()).toEqual(["run-1", "run-2"]);
  });

  test("deleteRun removes from memory", () => {
    setRun("run-1", makeState());
    expect(getRun("run-1")).toBeDefined();

    const deleted = deleteRun("run-1");
    expect(deleted).toBe(true);
    expect(getRun("run-1")).toBeUndefined();
  });

  test("deleteRun returns false for nonexistent run", () => {
    expect(deleteRun("nonexistent")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// File persistence
// ---------------------------------------------------------------------------

describe("store persistence", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "pi-agent-test-"));
    initStore(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("saveRun writes JSON file", () => {
    const state = makeState({
      run: makeRun({ run_id: "persist-1" }),
      usage: {
        inputTokens: 100,
        outputTokens: 50,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        totalTokens: 150,
        estimatedCost: 0.001,
      },
    });
    setRun("persist-1", state);
    saveRun("persist-1");

    const filePath = join(tmpDir, "persist-1.json");
    expect(existsSync(filePath)).toBe(true);

    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    expect(data.run.run_id).toBe("persist-1");
    expect(data.usage.inputTokens).toBe(100);
    expect(data.events).toEqual([]);
    // agent and abortController are NOT persisted
    expect(data.agent).toBeUndefined();
    expect(data.abortController).toBeUndefined();
  });

  test("saveRun is a no-op for nonexistent run", () => {
    // Should not throw
    saveRun("nonexistent");
    expect(existsSync(join(tmpDir, "nonexistent.json"))).toBe(false);
  });

  test("runs are reloaded from disk on initStore", () => {
    // Write a run file manually
    const persisted = {
      run: makeRun({ run_id: "reload-1", status: "completed" }),
      events: [{ type: "run.completed" }],
      usage: { inputTokens: 200, outputTokens: 100, cacheReadTokens: 0, cacheWriteTokens: 0, totalTokens: 300, estimatedCost: 0.002 },
    };
    const filePath = join(tmpDir, "reload-1.json");
    require("fs").writeFileSync(filePath, JSON.stringify(persisted));

    // Re-init store to trigger loadFromDisk
    initStore(tmpDir);

    const got = getRun("reload-1");
    expect(got).toBeDefined();
    expect(got!.run.run_id).toBe("reload-1");
    expect(got!.run.status).toBe("completed");
    expect(got!.usage.inputTokens).toBe(200);
    expect(got!.agent).toBeNull();
    expect(got!.abortController).toBeDefined();
  });

  test("corrupt files are skipped on load", () => {
    const filePath = join(tmpDir, "bad-run.json");
    require("fs").writeFileSync(filePath, "not valid json {{{");

    // Should not throw
    initStore(tmpDir);
    expect(getRun("bad-run")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Config integration
// ---------------------------------------------------------------------------

describe("config runsDir", () => {
  test("getConfig includes runsDir default", () => {
    delete process.env.PI_AGENT_RUNS_DIR;
    delete process.env.PI_AGENT_WORKDIR;

    // Import fresh to test defaults
    const { getConfig } = require("../config.js");
    const config = getConfig();

    expect(config.runsDir).toMatch(/\.pi-agent\/runs$/);
  });

  test("getConfig uses PI_AGENT_RUNS_DIR when set", () => {
    process.env.PI_AGENT_RUNS_DIR = "/tmp/custom-runs";
    const { getConfig } = require("../config.js");
    const config = getConfig();
    expect(config.runsDir).toBe("/tmp/custom-runs");
    delete process.env.PI_AGENT_RUNS_DIR;
  });

  test("getConfig includes cleanup defaults", () => {
    delete process.env.PI_AGENT_MAX_RUN_AGE;
    delete process.env.PI_AGENT_MAX_RUN_COUNT;

    const { getConfig } = require("../config.js");
    const config = getConfig();

    expect(config.maxRunAge).toBe(604800);
    expect(config.maxRunCount).toBe(100);
  });

  test("getConfig uses custom cleanup env vars", () => {
    process.env.PI_AGENT_MAX_RUN_AGE = "3600";
    process.env.PI_AGENT_MAX_RUN_COUNT = "50";
    const { getConfig } = require("../config.js");
    const config = getConfig();
    expect(config.maxRunAge).toBe(3600);
    expect(config.maxRunCount).toBe(50);
    delete process.env.PI_AGENT_MAX_RUN_AGE;
    delete process.env.PI_AGENT_MAX_RUN_COUNT;
  });
});

// ---------------------------------------------------------------------------
// Run cleanup policy
// ---------------------------------------------------------------------------

describe("run cleanup policy", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "pi-agent-cleanup-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    // Reset module-level state by re-initing without cleanup opts
    const fresh = mkdtempSync(join(tmpdir(), "pi-agent-reset-"));
    initStore(fresh);
    rmSync(fresh, { recursive: true, force: true });
  });

  test("cleanupRuns removes old runs based on maxAge", () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const recentDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

    initStore(tmpDir, { maxAge: 7 * 24 * 60 * 60, maxCount: 0 }); // 7 days age, no count limit

    setRun("old-run", makeState({ run: makeRun({ run_id: "old-run", created_at: oldDate.toISOString() }) }));
    setRun("recent-run", makeState({ run: makeRun({ run_id: "recent-run", created_at: recentDate.toISOString() }) }));
    saveRun("old-run");
    saveRun("recent-run");

    const { removed } = cleanupRuns();
    expect(removed).toBe(1);
    expect(getRun("old-run")).toBeUndefined();
    expect(getRun("recent-run")).toBeDefined();
    expect(existsSync(join(tmpDir, "old-run.json"))).toBe(false);
    expect(existsSync(join(tmpDir, "recent-run.json"))).toBe(true);
  });

  test("cleanupRuns removes oldest runs when exceeding maxCount", () => {
    initStore(tmpDir, { maxAge: 0, maxCount: 2 }); // no age limit, max 2 runs

    const base = Date.now();
    for (let i = 0; i < 4; i++) {
      const date = new Date(base - (4 - i) * 60 * 1000); // spaced 1 min apart
      const id = `run-${i}`;
      setRun(id, makeState({ run: makeRun({ run_id: id, created_at: date.toISOString() }) }));
      saveRun(id);
    }

    const { removed } = cleanupRuns();
    expect(removed).toBe(2);
    expect(getRun("run-0")).toBeUndefined(); // oldest
    expect(getRun("run-1")).toBeUndefined(); // second oldest
    expect(getRun("run-2")).toBeDefined();
    expect(getRun("run-3")).toBeDefined();
  });

  test("cleanupRuns applies both age and count limits", () => {
    const now = Date.now();
    const oldDate = new Date(now - 10 * 24 * 60 * 60 * 1000);

    initStore(tmpDir, { maxAge: 7 * 24 * 60 * 60, maxCount: 3 });

    // 2 old runs
    setRun("old-1", makeState({ run: makeRun({ run_id: "old-1", created_at: oldDate.toISOString() }) }));
    setRun("old-2", makeState({ run: makeRun({ run_id: "old-2", created_at: oldDate.toISOString() }) }));

    // 3 recent runs
    for (let i = 0; i < 3; i++) {
      const id = `recent-${i}`;
      setRun(id, makeState({ run: makeRun({ run_id: id, created_at: new Date().toISOString() }) }));
    }

    const { removed } = cleanupRuns();
    expect(removed).toBe(2); // 2 old runs removed by age
    expect(getRun("old-1")).toBeUndefined();
    expect(getRun("old-2")).toBeUndefined();
    expect(getRun("recent-0")).toBeDefined();
    expect(getRun("recent-1")).toBeDefined();
    expect(getRun("recent-2")).toBeDefined();
  });

  test("cleanupRuns returns 0 when no cleanup needed", () => {
    initStore(tmpDir, { maxAge: 999999, maxCount: 100 });
    setRun("run-1", makeState());

    const { removed } = cleanupRuns();
    expect(removed).toBe(0);
    expect(getRun("run-1")).toBeDefined();
  });

  test("cleanupRuns is a no-op without cleanup opts", () => {
    initStore(tmpDir); // no opts
    setRun("run-1", makeState());

    const { removed } = cleanupRuns();
    expect(removed).toBe(0);
  });

  test("initStore triggers cleanup automatically", () => {
    // Pre-populate files with old timestamps
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const persisted = {
      run: makeRun({ run_id: "stale-run", created_at: oldDate.toISOString() }),
      events: [],
      usage: { ...EMPTY_USAGE },
    };
    require("fs").writeFileSync(join(tmpDir, "stale-run.json"), JSON.stringify(persisted));

    // initStore should load then cleanup
    initStore(tmpDir, { maxAge: 7 * 24 * 60 * 60, maxCount: 100 });

    expect(getRun("stale-run")).toBeUndefined();
    expect(existsSync(join(tmpDir, "stale-run.json"))).toBe(false);
  });
});
