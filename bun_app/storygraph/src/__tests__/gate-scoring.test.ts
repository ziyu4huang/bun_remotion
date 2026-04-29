import { describe, test, expect } from "bun:test";
import { computeGateScore } from "../scripts/gate-scoring";
import type { CheckInput, QualityBreakdown } from "../scripts/gate-scoring";

const check = (name: string, status: CheckInput["status"]): CheckInput => ({ check: name, status });

describe("computeGateScore — layer 1 (group checks)", () => {
  test("all PASS → 100", () => {
    const result = computeGateScore([
      check("Plot Arc", "PASS"),
      check("Pacing: ch1ep1", "PASS"),
      check("Pacing: ch1ep2", "PASS"),
      check("Trait Coverage: ch1ep1_char_x", "PASS"),
    ]);
    expect(result.score).toBe(100);
    expect(result.decision).toBe("PASS");
  });

  test("all WARN → 90 (2 groups × -5)", () => {
    const result = computeGateScore([
      check("Trait Coverage: ch1ep1", "WARN"),
      check("Trait Coverage: ch1ep2", "WARN"),
      check("Interaction Density: ch1ep1", "WARN"),
    ]);
    expect(result.score).toBe(90);
    expect(result.decision).toBe("PASS");
  });

  test("one FAIL → -25 + FAIL cap at 80", () => {
    const result = computeGateScore([
      check("Plot Arc", "FAIL"),
      check("Trait Coverage: ch1ep1", "PASS"),
      check("Pacing: ch1ep1", "PASS"),
    ]);
    // Base: 100 - 25 + 5 + 5 = 85, but FAIL cap → 80
    expect(result.score).toBe(80);
    expect(result.decision).toBe("PASS");
    expect(result.ceiling_applied).toContain("FAIL check cap");
  });

  test("mixed PASS/WARN group with ≥50% pass → neutral", () => {
    const result = computeGateScore([
      check("Pacing: ch1ep1", "PASS"),
      check("Pacing: ch1ep2", "PASS"),
      check("Pacing: ch1ep3", "WARN"),
    ]);
    expect(result.score).toBe(100);
    expect(result.group_scores).toHaveLength(1);
    expect(result.group_scores[0].pass_rate).toBeCloseTo(0.667, 2);
    expect(result.group_scores[0].score_impact).toBe(0);
  });

  test("SKIP checks are ignored", () => {
    const result = computeGateScore([
      check("Gag Evolution", "SKIP"),
      check("Plot Arc", "PASS"),
    ]);
    expect(result.score).toBe(100);
  });

  test("many WARN checks in one group count as -5 (not N×-5)", () => {
    const manyChecks: CheckInput[] = [];
    for (let i = 0; i < 25; i++) {
      manyChecks.push(check(`Trait Coverage: ch1ep${i + 1}_char_x`, "WARN"));
    }
    const result = computeGateScore(manyChecks);
    expect(result.score).toBe(95);
  });

  test("episode scaling: 5 eps vs 25 eps same quality → same score", () => {
    const checks5: CheckInput[] = [];
    const checks25: CheckInput[] = [];
    for (let i = 0; i < 5; i++) {
      checks5.push(check(`Pacing: ch1ep${i + 1}`, "PASS"));
      checks5.push(check(`Trait Coverage: ch1ep${i + 1}`, "WARN"));
    }
    for (let i = 0; i < 25; i++) {
      checks25.push(check(`Pacing: ch1ep${i + 1}`, "PASS"));
      checks25.push(check(`Trait Coverage: ch1ep${i + 1}`, "WARN"));
    }
    const result5 = computeGateScore(checks5);
    const result25 = computeGateScore(checks25);
    expect(result5.score).toBe(result25.score);
  });

  test("decision thresholds: 70+ PASS, 40-69 WARN, <40 FAIL", () => {
    const failing = computeGateScore([
      check("Plot Arc", "FAIL"),
      check("Character Growth", "FAIL"),
      check("Pacing", "FAIL"),
      check("Gag Evolution", "FAIL"),
      check("Trait Coverage", "FAIL"),
      check("Interaction Density", "FAIL"),
      check("Community Cohesion", "FAIL"),
    ]);
    expect(failing.score).toBe(0);
    expect(failing.decision).toBe("FAIL");
  });
});

describe("computeGateScore — layer 2 (dimension ceilings)", () => {
  test("no breakdown → no ceiling", () => {
    const result = computeGateScore([check("Plot Arc", "PASS")]);
    expect(result.score).toBe(100);
    expect(result.ceiling_applied).toBeUndefined();
  });

  test("all dimensions healthy → no ceiling", () => {
    const result = computeGateScore(
      [check("Plot Arc", "PASS")],
      { consistency: 0.8, thematic_coherence: 0.7 },
    );
    expect(result.score).toBe(100);
    expect(result.ceiling_applied).toBeUndefined();
  });

  test("dimension < 50% → cap at 80 (caught by < 60% single tier)", () => {
    const result = computeGateScore(
      [check("Plot Arc", "PASS")],
      { consistency: 0.8, character_growth: 0.45 },
    );
    expect(result.score).toBe(80);
    expect(result.ceiling_applied).toContain("character_growth=45%");
  });

  test("2+ dimensions < 50% → cap at 70 (caught by < 60% tier first)", () => {
    const result = computeGateScore(
      [check("Plot Arc", "PASS")],
      { consistency: 0.4, character_growth: 0.45, pacing: 0.8 },
    );
    // 2 dims < 60% (0.4, 0.45) → cap at 70 (stricter than 75 for < 50%)
    expect(result.score).toBe(70);
    expect(result.ceiling_applied).toContain("2+ dimensions < 60%");
  });

  test("dimension < 30% → cap at 60", () => {
    const result = computeGateScore(
      [check("Plot Arc", "PASS")],
      { character_growth: 0.28 },
    );
    expect(result.score).toBe(60);
    expect(result.ceiling_applied).toContain("character_growth=28%");
  });

  test("dimension < 20% → cap at 50", () => {
    const result = computeGateScore(
      [check("Plot Arc", "PASS")],
      { thematic_coherence: 0.11 },
    );
    expect(result.score).toBe(50);
    expect(result.ceiling_applied).toContain("thematic_coherence=11%");
  });

  test("FAIL cap and dimension ceiling both apply — lower wins", () => {
    const result = computeGateScore(
      [check("Plot Arc", "FAIL"), check("Pacing", "PASS")],
      { character_growth: 0.28 },
    );
    // FAIL cap → 80, dimension < 30% cap → 60 → min(80, 60) = 60
    expect(result.score).toBe(60);
    expect(result.ceiling_applied).toContain("character_growth=28%");
  });

  test("null dimensions are ignored", () => {
    const result = computeGateScore(
      [check("Plot Arc", "PASS")],
      { consistency: null, thematic_coherence: 0.9, character_growth: null },
    );
    expect(result.score).toBe(100);
    expect(result.ceiling_applied).toBeUndefined();
  });

  test("2+ dimensions < 60% → cap at 70", () => {
    const result = computeGateScore(
      [check("Plot Arc", "PASS")],
      { consistency: 0.56, character_growth: 0.52, thematic_coherence: 0.4 },
    );
    expect(result.score).toBe(70);
    expect(result.ceiling_applied).toContain("2+ dimensions < 60%");
  });

  test("single dimension < 60% → cap at 80", () => {
    const result = computeGateScore(
      [check("Plot Arc", "PASS")],
      { consistency: 0.58, character_growth: 0.7 },
    );
    expect(result.score).toBe(80);
    expect(result.ceiling_applied).toContain("consistency=58%");
  });

  test("weapon-forger scenario: 3 dims below 60% + PASS checks", () => {
    const result = computeGateScore(
      [
        check("Character Consistency: ch1ep1", "PASS"),
        check("Trait Coverage: ch1ep1", "WARN"),
        check("Gag Evolution: g1", "PASS"),
        check("Tech Term Diversity: ch1ep1", "PASS"),
        check("Pacing: ch1ep1", "PASS"),
      ],
      { consistency: 0.56, character_growth: 0.52, thematic_coherence: 0.4, gag_evolution: 0.88 },
    );
    // Base: 100 + 5(Gag) + 5(Tech) + 0(Trait) + 5(Pacing) + 0(CharCon) = 120 → 100
    // 3 dims < 60%: cap at 70
    expect(result.score).toBe(70);
    expect(result.ceiling_applied).toContain("2+ dimensions < 60%");
  });
});

describe("computeGateScore — tooling gap suppression", () => {
  test("_tooling_gap WARNs do not affect score", () => {
    const withGap = computeGateScore([
      { check: "Trait Coverage: ch1ep1", status: "WARN", _tooling_gap: true },
      { check: "Trait Coverage: ch1ep2", status: "WARN", _tooling_gap: true },
      { check: "Plot Arc", status: "PASS" },
    ]);
    // Trait Coverage group has only nonscoring_warn → neutral (impact 0)
    // Plot Arc group → +5
    expect(withGap.score).toBe(100);
  });

  test("_tooling_gap mixed with real WARNs", () => {
    const result = computeGateScore([
      { check: "Trait Coverage: ch1ep1", status: "WARN", _tooling_gap: true },
      { check: "Trait Coverage: ch1ep2", status: "WARN" },
      { check: "Plot Arc", status: "PASS" },
    ]);
    // Trait Coverage: 0 pass, 1 real warn, 0 fail → passRate 0/1 = 0 → -5
    // Plot Arc: PASS → +5
    expect(result.score).toBe(100);
  });
});
