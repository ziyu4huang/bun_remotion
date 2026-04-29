import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync, rmSync, utimesSync } from "node:fs";
import { isUpToDate } from "../scripts/incremental";

const TMP = resolve("/tmp", `sg-incr-test-${Date.now()}`);

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe("isUpToDate()", () => {
  test("returns false when narration.ts doesn't exist", () => {
    const epDir = resolve(TMP, "ep-no-narration");
    mkdirSync(epDir, { recursive: true });
    // graph.json exists but no narration.ts
    mkdirSync(resolve(epDir, "storygraph_out"), { recursive: true });
    writeFileSync(resolve(epDir, "storygraph_out", "graph.json"), "{}");
    expect(isUpToDate(epDir)).toBe(false);
  });

  test("returns false when graph.json doesn't exist", () => {
    const epDir = resolve(TMP, "ep-no-graph");
    mkdirSync(resolve(epDir, "scripts"), { recursive: true });
    writeFileSync(resolve(epDir, "scripts", "narration.ts"), "export const narration = []");
    expect(isUpToDate(epDir)).toBe(false);
  });

  test("returns false when narration.ts is newer than graph.json", () => {
    const epDir = resolve(TMP, "ep-stale");
    mkdirSync(resolve(epDir, "scripts"), { recursive: true });
    mkdirSync(resolve(epDir, "storygraph_out"), { recursive: true });
    writeFileSync(resolve(epDir, "scripts", "narration.ts"), "export const narration = []");
    writeFileSync(resolve(epDir, "storygraph_out", "graph.json"), "{}");
    // graph.json 1 hour old, narration.ts fresh
    const now = Date.now();
    utimesSync(resolve(epDir, "storygraph_out", "graph.json"), new Date(now - 3600_000), new Date(now - 3600_000));
    expect(isUpToDate(epDir)).toBe(false);
  });

  test("returns true when graph.json is newer than narration.ts", () => {
    const epDir = resolve(TMP, "ep-fresh");
    mkdirSync(resolve(epDir, "scripts"), { recursive: true });
    mkdirSync(resolve(epDir, "storygraph_out"), { recursive: true });
    writeFileSync(resolve(epDir, "scripts", "narration.ts"), "export const narration = []");
    // narration.ts 1 hour old
    const now = Date.now();
    utimesSync(resolve(epDir, "scripts", "narration.ts"), new Date(now - 3600_000), new Date(now - 3600_000));
    writeFileSync(resolve(epDir, "storygraph_out", "graph.json"), "{}");
    expect(isUpToDate(epDir)).toBe(true);
  });

  test("returns true when timestamps are equal", () => {
    const epDir = resolve(TMP, "ep-equal");
    mkdirSync(resolve(epDir, "scripts"), { recursive: true });
    mkdirSync(resolve(epDir, "storygraph_out"), { recursive: true });
    const ts = new Date();
    writeFileSync(resolve(epDir, "scripts", "narration.ts"), "x");
    utimesSync(resolve(epDir, "scripts", "narration.ts"), ts, ts);
    writeFileSync(resolve(epDir, "storygraph_out", "graph.json"), "{}");
    utimesSync(resolve(epDir, "storygraph_out", "graph.json"), ts, ts);
    expect(isUpToDate(epDir)).toBe(true);
  });
});
