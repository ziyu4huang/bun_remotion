import { describe, test, expect } from "bun:test";
import { computeCheckDeltas, readJsonSafe } from "../server/services/benchmark";

describe("benchmark service", () => {
  describe("computeCheckDeltas", () => {
    test("returns undefined when no checks differ", () => {
      const baseline = { checks: [{ name: "plot", score_impact: 5 }, { name: "chars", score_impact: 3 }] };
      const current = { checks: [{ name: "plot", score_impact: 5 }, { name: "chars", score_impact: 3 }] };
      expect(computeCheckDeltas(baseline, current)).toBeUndefined();
    });

    test("returns deltas for changed checks", () => {
      const baseline = { checks: [{ name: "plot", score_impact: 5 }, { name: "chars", score_impact: 3 }] };
      const current = { checks: [{ name: "plot", score_impact: 8 }, { name: "chars", score_impact: 1 }] };
      const result = computeCheckDeltas(baseline, current);
      expect(result).toHaveLength(2);
      expect(result![0]).toContain("plot");
      expect(result![0]).toContain("+3");
      expect(result![1]).toContain("chars");
      expect(result![1]).toContain("-2");
    });

    test("ignores checks only in current (no baseline match)", () => {
      const baseline = { checks: [{ name: "plot", score_impact: 5 }] };
      const current = { checks: [{ name: "plot", score_impact: 5 }, { name: "new_check", score_impact: 10 }] };
      expect(computeCheckDeltas(baseline, current)).toBeUndefined();
    });

    test("handles null baseline", () => {
      const current = { checks: [{ name: "plot", score_impact: 5 }] };
      expect(computeCheckDeltas(null, current)).toBeUndefined();
    });

    test("handles empty checks arrays", () => {
      expect(computeCheckDeltas({ checks: [] }, { checks: [] })).toBeUndefined();
    });

    test("handles missing checks field", () => {
      expect(computeCheckDeltas({}, {})).toBeUndefined();
    });

    test("formats negative deltas correctly", () => {
      const baseline = { checks: [{ name: "consistency", score_impact: 10 }] };
      const current = { checks: [{ name: "consistency", score_impact: 4 }] };
      const result = computeCheckDeltas(baseline, current);
      expect(result).toHaveLength(1);
      expect(result![0]).toBe("consistency: 10 → 4 (-6)");
    });

    test("formats positive deltas correctly", () => {
      const baseline = { checks: [{ name: "depth", score_impact: 2 }] };
      const current = { checks: [{ name: "depth", score_impact: 9 }] };
      const result = computeCheckDeltas(baseline, current);
      expect(result).toHaveLength(1);
      expect(result![0]).toBe("depth: 2 → 9 (+7)");
    });
  });

  describe("readJsonSafe", () => {
    test("returns null for non-existent file", () => {
      expect(readJsonSafe("/nonexistent/path.json")).toBeNull();
    });

    test("returns null for invalid JSON", () => {
      const tmpPath = `/tmp/benchmark-test-invalid-${Date.now()}.json`;
      const { writeFileSync, unlinkSync } = require("node:fs");
      writeFileSync(tmpPath, "not json");
      expect(readJsonSafe(tmpPath)).toBeNull();
      unlinkSync(tmpPath);
    });

    test("parses valid JSON", () => {
      const tmpPath = `/tmp/benchmark-test-valid-${Date.now()}.json`;
      const { writeFileSync, unlinkSync } = require("node:fs");
      writeFileSync(tmpPath, JSON.stringify({ score: 42, name: "test" }));
      const result = readJsonSafe<{ score: number; name: string }>(tmpPath);
      expect(result).toEqual({ score: 42, name: "test" });
      unlinkSync(tmpPath);
    });
  });
});
