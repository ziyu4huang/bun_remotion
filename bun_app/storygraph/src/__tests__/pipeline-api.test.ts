import { describe, test, expect } from "bun:test";
import { getPipelineStatus } from "../pipeline-api";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "../../..");

describe("pipeline-api", () => {
  describe("getPipelineStatus()", () => {
    test("returns false for non-existent series", () => {
      const status = getPipelineStatus("/tmp/nonexistent-series-xyz");
      expect(status.hasEpisodeData).toBe(false);
      expect(status.hasMergedGraph).toBe(false);
      expect(status.hasGate).toBe(false);
      expect(status.hasQualityScore).toBe(false);
    });

    test("reads weapon-forger pipeline output", () => {
      const seriesDir = resolve(REPO_ROOT, "bun_remotion_proj/weapon-forger");
      const status = getPipelineStatus(seriesDir);

      // weapon-forger should have some pipeline output
      if (status.hasGate) {
        expect(typeof status.gateScore).toBe("number");
        expect(typeof status.gateDecision).toBe("string");
      }
      if (status.hasMergedGraph) {
        expect(typeof status.nodeCount).toBe("number");
        expect(status.nodeCount).toBeGreaterThan(0);
      }
    });

    test("reads xianxia-system-meme pipeline output", () => {
      const seriesDir = resolve(REPO_ROOT, "bun_remotion_proj/xianxia-system-meme");
      const status = getPipelineStatus(seriesDir);

      if (status.hasGate) {
        expect(typeof status.gateScore).toBe("number");
        expect(status.gateDecision).toMatch(/PASS|WARN|FAIL/);
      }
      if (status.hasQualityScore) {
        expect(typeof status.blendedScore).toBe("number");
        expect(status.blendedDecision).toMatch(/ACCEPT|REVIEW|REJECT/);
      }
    });
  });
});
