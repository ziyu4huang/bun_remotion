import { describe, test, expect } from "bun:test";
import { resolve } from "node:path";
import {
  getPipelineStatus,
  runSuggest,
  runHealth,
  type PipelineStatusResult,
  type SuggestResult,
  type HealthResult,
  type SuggestionCategory,
} from "storygraph/pipeline-api";

const REPO_ROOT = resolve(import.meta.dir, "../../../..");
const WEAPON_FORGER = resolve(REPO_ROOT, "bun_remotion_proj/weapon-forger");
const NONEXISTENT = resolve(REPO_ROOT, "bun_remotion_proj/nonexistent-xyz-123");

// ─── getPipelineStatus ───

describe("storygraph integration: getPipelineStatus", () => {
  test("reads weapon-forger status with all outputs present", () => {
    const status = getPipelineStatus(WEAPON_FORGER);
    expect(status.hasEpisodeData).toBe(true);
    expect(status.hasMergedGraph).toBe(true);
    expect(status.hasGate).toBe(true);
    expect(status.hasQualityScore).toBe(true);
    expect(status.hasHTML).toBe(true);
  });

  test("reads gate score and decision from real data", () => {
    const status = getPipelineStatus(WEAPON_FORGER);
    expect(typeof status.gateScore).toBe("number");
    expect(status.gateScore).toBeGreaterThanOrEqual(0);
    expect(status.gateScore).toBeLessThanOrEqual(100);
    expect(status.gateDecision).toBeTruthy();
  });

  test("reads blended score from quality score file", () => {
    const status = getPipelineStatus(WEAPON_FORGER);
    expect(typeof status.blendedScore).toBe("number");
    expect(status.blendedScore).toBeGreaterThanOrEqual(0);
    expect(status.blendedScore).toBeLessThanOrEqual(1);
    expect(status.blendedDecision).toBeTruthy();
  });

  test("reads graph counts from merged-graph.json", () => {
    const status = getPipelineStatus(WEAPON_FORGER);
    expect(typeof status.episodeCount).toBe("number");
    expect(status.episodeCount).toBeGreaterThan(0);
    expect(typeof status.nodeCount).toBe("number");
    expect(status.nodeCount).toBeGreaterThan(0);
    expect(typeof status.edgeCount).toBe("number");
    expect(status.edgeCount).toBeGreaterThan(0);
  });

  test("returns all-false for nonexistent series", () => {
    const status = getPipelineStatus(NONEXISTENT);
    expect(status.hasEpisodeData).toBe(false);
    expect(status.hasMergedGraph).toBe(false);
    expect(status.hasGate).toBe(false);
    expect(status.hasQualityScore).toBe(false);
    expect(status.hasHTML).toBe(false);
    expect(status.gateScore).toBeUndefined();
    expect(status.nodeCount).toBeUndefined();
  });
});

// ─── runSuggest ───

describe("storygraph integration: runSuggest", () => {
  test("produces suggestions from weapon-forger data", () => {
    const result = runSuggest(WEAPON_FORGER);
    expect(result.success).toBe(true);
    expect(result.seriesDir).toBe(WEAPON_FORGER);
    expect(result.episodeCount).toBeGreaterThan(0);
    expect(result.latestEpisode).toBeTruthy();
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  test("suggestions have valid structure", () => {
    const result = runSuggest(WEAPON_FORGER);
    if (result.suggestions.length === 0) return; // no suggestions is valid

    for (const s of result.suggestions) {
      expect(["high", "medium", "low"]).toContain(s.severity);
      expect(s.description_zhTW).toBeTruthy();
      expect(Array.isArray(s.affectedCharacters)).toBe(true);
      expect(Array.isArray(s.affectedEpisodes)).toBe(true);
    }
  });

  test("suggestions are sorted by severity (high first)", () => {
    const result = runSuggest(WEAPON_FORGER);
    if (result.suggestions.length < 2) return;

    const order = { high: 0, medium: 1, low: 2 };
    for (let i = 1; i < result.suggestions.length; i++) {
      const prev = order[result.suggestions[i - 1].severity];
      const curr = order[result.suggestions[i].severity];
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });

  test("storyDebtCount matches high+medium suggestions", () => {
    const result = runSuggest(WEAPON_FORGER);
    const expected = result.suggestions.filter(
      (s) => s.severity === "high" || s.severity === "medium",
    ).length;
    expect(result.storyDebtCount).toBe(expected);
  });

  test("returns error for nonexistent series", () => {
    const result = runSuggest(NONEXISTENT);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.suggestions).toHaveLength(0);
  });
});

// ─── runHealth ───

describe("storygraph integration: runHealth", () => {
  test("produces health result from weapon-forger data", () => {
    const result = runHealth(WEAPON_FORGER);
    expect(result.success).toBe(true);
    expect(result.seriesDir).toBe(WEAPON_FORGER);
    expect(result.episodeCount).toBeGreaterThan(0);
    expect(result.latestEpisode).toBeTruthy();
    expect(typeof result.gateScore).toBe("number");
    expect(result.gateDecision).toBeTruthy();
  });

  test("has standard health dimensions", () => {
    const result = runHealth(WEAPON_FORGER);
    expect(result.dimensions.length).toBeGreaterThanOrEqual(4);

    const names = result.dimensions.map((d) => d.name);
    expect(names).toContain("characters");
    expect(names).toContain("arc");
    expect(names).toContain("pacing");
    expect(names).toContain("themes");
    expect(names).toContain("foreshadow");
  });

  test("each dimension has valid status", () => {
    const result = runHealth(WEAPON_FORGER);
    for (const d of result.dimensions) {
      expect(["good", "warn", "alert"]).toContain(d.status);
      expect(d.summary_zhTW).toBeTruthy();
    }
  });

  test("storyDebtCount matches debtItems length", () => {
    const result = runHealth(WEAPON_FORGER);
    expect(result.storyDebtCount).toBe(result.storyDebtItems.length);
  });

  test("returns error for nonexistent series", () => {
    const result = runHealth(NONEXISTENT);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.dimensions).toHaveLength(0);
  });
});

// ─── Cross-app type contracts ───

describe("storygraph integration: type contracts", () => {
  test("PipelineStatusResult fields match remotion_studio expectations", () => {
    const status = getPipelineStatus(WEAPON_FORGER);

    // These fields are consumed by remotion_studio Storygraph page + Quality page
    const requiredBooleanFields: (keyof PipelineStatusResult)[] = [
      "hasEpisodeData",
      "hasMergedGraph",
      "hasGate",
      "hasQualityScore",
      "hasHTML",
    ];
    for (const f of requiredBooleanFields) {
      expect(typeof status[f]).toBe("boolean");
    }
  });

  test("SuggestResult suggestion categories are valid", () => {
    const validCategories: SuggestionCategory[] = [
      "foreshadow_debt", "flat_arc", "gag_stagnation", "missing_interaction",
      "thematic_gap", "pacing_issue", "trait_gap", "duplicate_risk",
    ];
    const result = runSuggest(WEAPON_FORGER);
    for (const s of result.suggestions) {
      expect(validCategories).toContain(s.category);
    }
  });

  test("HealthResult genre field is a string", () => {
    const result = runHealth(WEAPON_FORGER);
    expect(typeof result.genre).toBe("string");
    expect(result.genre).toBeTruthy();
  });
});

// ─── Plan parser integration ───

describe("storygraph integration: plan parser", () => {
  test("plan-editor reads weapon-forger plan using storygraph parsePlan", async () => {
    const { readPlan } = await import("../server/services/plan-editor");
    const result = await readPlan("weapon-forger");
    expect(result).not.toBeNull();
    expect(result!.parsed.characters).not.toBeNull();
    expect(result!.parsed.characters!.length).toBeGreaterThan(0);
  });

  test("plan-editor sections include Characters and Episode Guide", async () => {
    const { readPlan } = await import("../server/services/plan-editor");
    const result = await readPlan("weapon-forger");
    const sectionNames = result!.sections.map((s: any) => s.title);
    expect(sectionNames.some((n: string) => /character/i.test(n))).toBe(true);
    expect(sectionNames.some((n: string) => /episode/i.test(n))).toBe(true);
  });
});
