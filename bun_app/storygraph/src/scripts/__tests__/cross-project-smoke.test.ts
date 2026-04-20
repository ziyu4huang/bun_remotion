/**
 * Cross-project smoke tests — Phase 33-D4a.
 *
 * Validates that storygraph pipeline output exists and parses correctly
 * for ALL series in bun_remotion_proj/. No AI calls — pure file checks.
 */

import { describe, test, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..", "..", "..", "..", "..");
const PROJ_DIR = join(REPO_ROOT, "bun_remotion_proj");

const SERIES = [
  "weapon-forger",
  "my-core-is-boss",
  "galgame-meme-theater",
  "xianxia-system-meme",
  "storygraph-explainer",
];

const VALID_DECISIONS = new Set(["PASS", "WARN", "FAIL"]);
const VALID_STATUSES = new Set(["PASS", "WARN", "FAIL", "SKIP"]);

describe("cross-project smoke", () => {
  for (const series of SERIES) {
    describe(series, () => {
      const outDir = join(PROJ_DIR, series, "storygraph_out");

      test("storygraph_out exists", () => {
        expect(existsSync(outDir)).toBe(true);
      });

      test("gate.json parses with valid structure", () => {
        const p = join(outDir, "gate.json");
        expect(existsSync(p)).toBe(true);
        const gate = JSON.parse(readFileSync(p, "utf-8"));
        expect(gate.version).toBe("2.0");
        expect(typeof gate.score).toBe("number");
        expect(gate.score).toBeGreaterThanOrEqual(0);
        expect(gate.score).toBeLessThanOrEqual(100);
        expect(VALID_DECISIONS.has(gate.decision)).toBe(true);
        expect(Array.isArray(gate.checks)).toBe(true);
      });

      test("gate checks have valid statuses", () => {
        const gate = JSON.parse(readFileSync(join(outDir, "gate.json"), "utf-8"));
        for (const c of gate.checks) {
          expect(VALID_STATUSES.has(c.status)).toBe(true);
          expect(c.name).toBeTruthy();
        }
      });

      test("merged-graph.json parses with nodes and links", () => {
        const p = join(outDir, "merged-graph.json");
        expect(existsSync(p)).toBe(true);
        const mg = JSON.parse(readFileSync(p, "utf-8"));
        expect(Array.isArray(mg.nodes)).toBe(true);
        expect(mg.nodes.length).toBeGreaterThan(0);
        expect(Array.isArray(mg.links)).toBe(true);
      });

      test("link-edges.json parses", () => {
        const p = join(outDir, "link-edges.json");
        expect(existsSync(p)).toBe(true);
        const le = JSON.parse(readFileSync(p, "utf-8"));
        expect(Array.isArray(le)).toBe(true);
      });

      test("graph.html exists", () => {
        expect(existsSync(join(outDir, "graph.html"))).toBe(true);
      });
    });
  }

  describe("series-specific", () => {
    test("weapon-forger has plan-struct.json", () => {
      const p = join(PROJ_DIR, "weapon-forger", "storygraph_out", "plan-struct.json");
      expect(existsSync(p)).toBe(true);
    });

    test("my-core-is-boss has kg-quality-score.json", () => {
      const p = join(PROJ_DIR, "my-core-is-boss", "storygraph_out", "kg-quality-score.json");
      expect(existsSync(p)).toBe(true);
    });

    test("all hybrid-mode series have quality_breakdown", () => {
      const hybridSeries = ["my-core-is-boss", "xianxia-system-meme", "storygraph-explainer"];
      for (const series of hybridSeries) {
        const gate = JSON.parse(
          readFileSync(join(PROJ_DIR, series, "storygraph_out", "gate.json"), "utf-8")
        );
        expect(gate.quality_breakdown).toBeDefined();
        expect(typeof gate.quality_breakdown).toBe("object");
      }
    });

    test("all series have ≥1 node type besides episode_plot", () => {
      for (const series of SERIES) {
        const mg = JSON.parse(
          readFileSync(join(PROJ_DIR, series, "storygraph_out", "merged-graph.json"), "utf-8")
        );
        const types = new Set(mg.nodes.map((n: any) => n.type));
        expect(types.size).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
