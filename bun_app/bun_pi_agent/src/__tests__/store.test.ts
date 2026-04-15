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
});
