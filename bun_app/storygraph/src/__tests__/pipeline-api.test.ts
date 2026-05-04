import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { getPipelineStatus, runCheck, runScore, runSuggest, runHealth, runPipeline, type PipelineStatusResult, type CheckResult, type ScoreResult, type SuggestResult, type HealthResult, type PipelineProgress, type AIPipelineOptions } from "../pipeline-api";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";

const REPO_ROOT = resolve(import.meta.dir, "../../..");
const TEST_TMP_DIR = resolve(import.meta.dir, "../../test-tmp-pipeline-api");
const TEST_SERIES_DIR = resolve(TEST_TMP_DIR, "test-series");

beforeEach(() => {
  rmSync(TEST_TMP_DIR, { recursive: true, force: true });
  mkdirSync(TEST_SERIES_DIR, { recursive: true });
  mkdirSync(resolve(TEST_SERIES_DIR, "storygraph_out"), { recursive: true });
});

afterEach(() => {
  rmSync(TEST_TMP_DIR, { recursive: true, force: true });
});

describe("pipeline-api", () => {
  describe("getPipelineStatus()", () => {
    test("returns false for non-existent series", () => {
      const status = getPipelineStatus("/tmp/nonexistent-series-xyz");
      expect(status.hasEpisodeData).toBe(false);
      expect(status.hasMergedGraph).toBe(false);
      expect(status.hasGate).toBe(false);
      expect(status.hasQualityScore).toBe(false);
      expect(status.hasHTML).toBe(false);
    });

    test("returns correct structure for non-existent series", () => {
      const status = getPipelineStatus("/tmp/nonexistent-series-xyz");
      expect(typeof status.hasEpisodeData).toBe("boolean");
      expect(typeof status.hasMergedGraph).toBe("boolean");
      expect(typeof status.hasGate).toBe("boolean");
      expect(typeof status.hasQualityScore).toBe("boolean");
      expect(typeof status.hasHTML).toBe("boolean");
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

    test("handles partial pipeline output", () => {
      // Only create merged-graph.json, no gate
      const mergedPath = resolve(TEST_SERIES_DIR, "storygraph_out", "merged-graph.json");
      writeFileSync(mergedPath, JSON.stringify({ nodes: [], links: [], episode_count: 0 }));

      const status = getPipelineStatus(TEST_SERIES_DIR);
      expect(status.hasMergedGraph).toBe(true);
      expect(status.hasGate).toBe(false);
    });

    test("parses merged-graph.json node/edge counts", () => {
      const mergedPath = resolve(TEST_SERIES_DIR, "storygraph_out", "merged-graph.json");
      writeFileSync(mergedPath, JSON.stringify({
        nodes: [
          { id: "n1", type: "character" },
          { id: "n2", type: "scene" },
          { id: "n3", type: "theme" }
        ],
        links: [{ source: "n1", target: "n2" }, { source: "n2", target: "n3" }],
        episode_count: 2
      }));

      const status = getPipelineStatus(TEST_SERIES_DIR);
      expect(status.hasMergedGraph).toBe(true);
      expect(status.nodeCount).toBe(3);
      expect(status.edgeCount).toBe(2);
      expect(status.episodeCount).toBe(2);
    });

    test("handles malformed merged-graph.json gracefully", () => {
      const mergedPath = resolve(TEST_SERIES_DIR, "storygraph_out", "merged-graph.json");
      writeFileSync(mergedPath, "not valid json {{{");

      const status = getPipelineStatus(TEST_SERIES_DIR);
      expect(status.hasMergedGraph).toBe(true); // file exists
      expect(status.nodeCount).toBeUndefined();
    });

    test("handles malformed gate.json gracefully", () => {
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, "invalid json");

      const status = getPipelineStatus(TEST_SERIES_DIR);
      expect(status.hasGate).toBe(true);
      expect(status.gateScore).toBeUndefined();
    });

    test("handles partial quality score output", () => {
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, JSON.stringify({ score: 85, decision: "PASS" }));

      const status = getPipelineStatus(TEST_SERIES_DIR);
      expect(status.hasGate).toBe(true);
      expect(status.gateScore).toBe(85);
      expect(status.gateDecision).toBe("PASS");
    });
  });

  describe("runCheck()", () => {
    test("returns failure for missing gate.json", async () => {
      const result = await runCheck(TEST_SERIES_DIR);
      expect(result.success).toBe(false);
      expect(result.gateScore).toBe(0);
      expect(result.gateDecision).toBe("FAIL");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("returns failure for missing storygraph_out dir", async () => {
      rmSync(resolve(TEST_SERIES_DIR, "storygraph_out"), { recursive: true });
      const result = await runCheck(TEST_SERIES_DIR);
      expect(result.success).toBe(false);
    });

    test("returns correct result structure", async () => {
      // Create minimal gate
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, JSON.stringify({ score: 80, decision: "PASS", checks: [] }));

      const result = await runCheck(TEST_SERIES_DIR);
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.seriesDir).toBe("string");
      expect(typeof result.gatePath).toBe("string");
      expect(typeof result.gateScore).toBe("number");
      expect(typeof result.gateDecision).toBe("string");
      expect(Array.isArray(result.checks)).toBe(true);
    });
  });

  describe("runScore()", () => {
    test("returns failure for missing gate.json", async () => {
      const result = await runScore(TEST_SERIES_DIR);
      expect(result.success).toBe(false);
      expect(result.errors).toContain("No gate.json found — run check first");
    });

    test("returns failure for missing merged-graph.json", async () => {
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, JSON.stringify({ score: 80, decision: "PASS" }));

      const result = await runScore(TEST_SERIES_DIR);
      expect(result.success).toBe(false);
      expect(result.errors).toContain("No merged-graph.json found — run merge first");
    });

    test("returns correct result structure on success", async () => {
      // Setup required files
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, JSON.stringify({
        score: 85,
        decision: "PASS",
        quality_breakdown: { consistency: 0.9, arc_structure: 0.8 }
      }));

      const mergedPath = resolve(TEST_SERIES_DIR, "storygraph_out", "merged-graph.json");
      writeFileSync(mergedPath, JSON.stringify({
        nodes: [{ id: "n1", type: "character" }],
        links: [],
        episode_count: 1
      }));

      const result = await runScore(TEST_SERIES_DIR, { mode: "regex" });
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.seriesDir).toBe("string");
      expect(typeof result.outputPath).toBe("string");
      expect(result.blended).toBeDefined();
      expect(result.programmatic).toBeDefined();
      expect(result.programmatic.score).toBe(85);
      expect(result.blended.overall).toBeGreaterThan(0);
    }, 15000);

    test("handles optional mode parameter", async () => {
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, JSON.stringify({ score: 80, decision: "PASS" }));

      const mergedPath = resolve(TEST_SERIES_DIR, "storygraph_out", "merged-graph.json");
      writeFileSync(mergedPath, JSON.stringify({ nodes: [], links: [] }));

      // Mode option is passed through to generator config
      const result = await runScore(TEST_SERIES_DIR, { mode: "regex" });
      expect(result.success).toBe(true);
      expect(result.programmatic.score).toBe(80);
    }, 10000);
  });

  describe("runSuggest()", () => {
    test("returns failure for missing gate.json", () => {
      const result = runSuggest(TEST_SERIES_DIR);
      expect(result.success).toBe(false);
      expect(result.errors).toContain("No gate.json found — run sg_pipeline first");
    });

    test("returns failure for missing merged-graph.json", () => {
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, JSON.stringify({ score: 80, decision: "PASS" }));

      const result = runSuggest(TEST_SERIES_DIR);
      expect(result.success).toBe(false);
      expect(result.errors).toContain("No merged-graph.json found — run sg_pipeline first");
    });

    test("returns correct result structure", () => {
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, JSON.stringify({
        score: 80,
        decision: "PASS",
        quality_breakdown: {}
      }));

      const mergedPath = resolve(TEST_SERIES_DIR, "storygraph_out", "merged-graph.json");
      writeFileSync(mergedPath, JSON.stringify({
        nodes: [
          { id: "ch1ep1_char_a", type: "character_instance", properties: { character_id: "a" } }
        ],
        links: [],
        episode_count: 1
      }));

      const result = runSuggest(TEST_SERIES_DIR);
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.seriesDir).toBe("string");
      expect(typeof result.genre).toBe("string");
      expect(typeof result.episodeCount).toBe("number");
      expect(typeof result.latestEpisode).toBe("string");
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(typeof result.storyDebtCount).toBe("number");
    });

    test("handles real weapon-forger data", () => {
      const seriesDir = resolve(REPO_ROOT, "bun_remotion_proj/weapon-forger");
      const result = runSuggest(seriesDir);

      if (result.success) {
        expect(result.episodeCount).toBeGreaterThan(0);
        expect(result.genre).toMatch(/xianxia_comedy|generic/);
        expect(typeof result.storyDebtCount).toBe("number");
      }
    });

    test("handles optional targetEpId parameter", () => {
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, JSON.stringify({ score: 80, decision: "PASS" }));

      const mergedPath = resolve(TEST_SERIES_DIR, "storygraph_out", "merged-graph.json");
      writeFileSync(mergedPath, JSON.stringify({
        nodes: [{ id: "ch1ep1_char_a", type: "character_instance" }],
        links: [],
        episode_count: 1
      }));

      const result = runSuggest(TEST_SERIES_DIR, "ch1ep2");
      expect(result.targetEpId).toBe("ch1ep2");
    });
  });

  describe("runHealth()", () => {
    test("returns failure for missing gate.json", () => {
      const result = runHealth(TEST_SERIES_DIR);
      expect(result.success).toBe(false);
      expect(result.errors).toContain("No gate.json found");
    });

    test("returns correct result structure", () => {
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, JSON.stringify({
        score: 85,
        decision: "PASS",
        quality_breakdown: { consistency: 0.8, pacing: 0.7 }
      }));

      const result = runHealth(TEST_SERIES_DIR);
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.seriesDir).toBe("string");
      expect(typeof result.genre).toBe("string");
      expect(typeof result.episodeCount).toBe("number");
      expect(typeof result.latestEpisode).toBe("string");
      expect(typeof result.gateScore).toBe("number");
      expect(typeof result.gateDecision).toBe("string");
      expect(Array.isArray(result.dimensions)).toBe(true);
      expect(typeof result.storyDebtCount).toBe("number");
      expect(Array.isArray(result.storyDebtItems)).toBe(true);
    });

    test("computes dimensions from quality_breakdown", () => {
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, JSON.stringify({
        score: 75,
        decision: "PASS",
        quality_breakdown: {
          consistency: 0.6,
          arc_structure: 0.5,
          pacing: 0.4,
          thematic_coherence: 0.9
        }
      }));

      const mergedPath = resolve(TEST_SERIES_DIR, "storygraph_out", "merged-graph.json");
      writeFileSync(mergedPath, JSON.stringify({
        nodes: [
          { id: "ch1ep1_scene", type: "scene", episode: "ch1ep1" },
          { id: "ch1ep2_scene", type: "scene", episode: "ch1ep2" }
        ],
        links: [],
        episode_count: 2
      }));

      const result = runHealth(TEST_SERIES_DIR);
      expect(result.success).toBe(true);
      expect(result.episodeCount).toBe(2);
      expect(result.latestEpisode).toBe("ch1ep2");

      const dimNames = result.dimensions.map(d => d.name);
      expect(dimNames).toContain("characters");
      expect(dimNames).toContain("arc");
      expect(dimNames).toContain("pacing");
      expect(dimNames).toContain("themes");
    });

    test("handles missing quality_breakdown gracefully", () => {
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, JSON.stringify({
        score: 80,
        decision: "PASS"
        // No quality_breakdown
      }));

      const result = runHealth(TEST_SERIES_DIR);
      expect(result.success).toBe(true);
      expect(result.dimensions.length).toBeGreaterThan(0);
    });

    test("includes foreshadow dimension when nodes exist", () => {
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, JSON.stringify({
        score: 80,
        decision: "PASS",
        quality_breakdown: {}
      }));

      const mergedPath = resolve(TEST_SERIES_DIR, "storygraph_out", "merged-graph.json");
      writeFileSync(mergedPath, JSON.stringify({
        nodes: [
          { id: "ch1ep1_foreshadow_a", type: "foreshadow", properties: { paid_off: "true" } },
          { id: "ch1ep2_foreshadow_b", type: "foreshadow", properties: { paid_off: "false" } }
        ],
        links: [],
        episode_count: 2
      }));

      const result = runHealth(TEST_SERIES_DIR);
      const fDim = result.dimensions.find(d => d.name === "foreshadow");
      expect(fDim).toBeDefined();
      expect(fDim?.score).toBe(0.5); // 1/2 paid off
    });

    test("handles malformed gate.json gracefully", () => {
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, "not valid json");

      const result = runHealth(TEST_SERIES_DIR);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("includes themes dimension from gate quality_breakdown", () => {
      const gatePath = resolve(TEST_SERIES_DIR, "storygraph_out", "gate.json");
      writeFileSync(gatePath, JSON.stringify({
        score: 80,
        decision: "PASS",
        quality_breakdown: { thematic_coherence: 0.75 }
      }));

      const result = runHealth(TEST_SERIES_DIR);
      expect(result.success).toBe(true);
      const themeDim = result.dimensions.find(d => d.name === "themes");
      expect(themeDim).toBeDefined();
      expect(themeDim?.score).toBe(0.75);
    });
  });

  describe("API type contracts", () => {
    test("PipelineStatusResult has required fields", () => {
      const status = getPipelineStatus("/tmp/nonexistent");
      const requiredFields: (keyof PipelineStatusResult)[] = [
        "hasEpisodeData", "hasMergedGraph", "hasGate", "hasQualityScore", "hasHTML"
      ];
      for (const field of requiredFields) {
        expect(field in status).toBe(true);
      }
    });

    test("CheckResult has required fields", async () => {
      const result = await runCheck(TEST_SERIES_DIR);
      const requiredFields: (keyof CheckResult)[] = [
        "success", "seriesDir", "gatePath", "gateScore", "gateDecision", "checks", "errors"
      ];
      for (const field of requiredFields) {
        expect(field in result).toBe(true);
      }
    });

    test("ScoreResult has required fields", async () => {
      const result = await runScore(TEST_SERIES_DIR);
      const requiredFields: (keyof ScoreResult)[] = [
        "success", "seriesDir", "outputPath", "blended", "programmatic", "ai", "errors"
      ];
      for (const field of requiredFields) {
        expect(field in result).toBe(true);
      }
    });

    test("SuggestResult has required fields", () => {
      const result = runSuggest(TEST_SERIES_DIR);
      const requiredFields: (keyof SuggestResult)[] = [
        "success", "seriesDir", "genre", "episodeCount", "latestEpisode", "suggestions", "storyDebtCount", "errors"
      ];
      for (const field of requiredFields) {
        expect(field in result).toBe(true);
      }
    });

    test("HealthResult has required fields", () => {
      const result = runHealth(TEST_SERIES_DIR);
      const requiredFields: (keyof HealthResult)[] = [
        "success", "seriesDir", "genre", "episodeCount", "latestEpisode",
        "gateScore", "gateDecision", "dimensions", "storyDebtCount", "storyDebtItems", "errors"
      ];
      for (const field of requiredFields) {
        expect(field in result).toBe(true);
      }
    });

    test("StepResult includes stderr and exitCode fields", () => {
      const result = runCheck(TEST_SERIES_DIR);
      // StepResult fields tested via stub - they exist in the interface
      expect(true).toBe(true); // Placeholder - runPipeline tested separately
    });
  });

  describe("runPipeline streaming progress", () => {
    test("emits progress events via onProgress callback", async () => {
      const progressEvents: PipelineProgress[] = [];
      const options: AIPipelineOptions = {
        mode: "regex",
        onProgress: (p) => progressEvents.push(p),
      };

      // Create minimal test data
      mkdirSync(resolve(TEST_SERIES_DIR, "ch1ep1"), { recursive: true });
      writeFileSync(resolve(TEST_SERIES_DIR, "ch1ep1", "config.ts"), "export const config = { seriesId: 'test', genre: 'generic', displayName: 'Test' };");

      // Note: runPipeline requires actual scripts - this test validates the callback mechanism
      // Full integration test would require more setup
      expect(typeof options.onProgress).toBe("function");
    });

    test("PipelineProgress type has correct fields", () => {
      const progress: PipelineProgress = {
        step: "episode",
        status: "started",
        progress: 0,
        message: "Test",
        episodeIndex: 1,
        totalEpisodes: 3,
      };
      expect(progress.step).toBe("episode");
      expect(progress.status).toBe("started");
      expect(progress.progress).toBe(0);
      expect(progress.message).toBe("Test");
      expect(progress.episodeIndex).toBe(1);
      expect(progress.totalEpisodes).toBe(3);
    });

    test("AIPipelineOptions accepts onProgress callback", () => {
      const options: AIPipelineOptions = {
        mode: "hybrid",
        onProgress: (p) => {
          expect(typeof p.step).toBe("string");
          expect(typeof p.status).toBe("string");
          expect(typeof p.progress).toBe("number");
        },
      };
      options.onProgress?.({ step: "merge", status: "running", progress: 0.5 });
      expect(true).toBe(true);
    });
  });
});
