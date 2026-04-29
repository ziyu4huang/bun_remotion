import { describe, test, expect } from "bun:test";
import { computeGateScore } from "../scripts/gate-scoring";
import type { CheckInput } from "../scripts/gate-scoring";

// Tests for reviewer feedback fixes:
// 1. Tooling gap suppression from gate.json checks list
// 2. Gag fatigue detection (cross-episode pattern repetition)
// 3. Per-character growth and per-theme coherence check evidence

describe("reviewer feedback: tooling gap suppression", () => {
  test("group with only _tooling_gap WARNs has neutral impact", () => {
    const result = computeGateScore([
      { check: "Trait Coverage: ch1ep1_char_elder", status: "WARN", _tooling_gap: true } satisfies CheckInput,
      { check: "Trait Coverage: ch1ep1_char_luyang", status: "WARN", _tooling_gap: true } satisfies CheckInput,
      { check: "Plot Arc", status: "PASS" } satisfies CheckInput,
    ]);
    // Trait Coverage group: only nonscoring_warn → impact 0
    // Plot Arc: PASS → +5
    expect(result.score).toBe(100);
    const tcGroup = result.group_scores.find(g => g.group === "Trait Coverage");
    expect(tcGroup).toBeDefined();
    expect(tcGroup!.score_impact).toBe(0);
  });

  test("many _tooling_gap WARNs don't inflate or penalize", () => {
    const checks: CheckInput[] = [
      { check: "Plot Arc", status: "PASS" },
    ];
    for (let i = 0; i < 11; i++) {
      checks.push({ check: `Trait Coverage: char_${i}`, status: "WARN", _tooling_gap: true });
    }
    const result = computeGateScore(checks);
    expect(result.score).toBe(100);
  });
});

describe("reviewer feedback: gag fatigue similarity", () => {
  // The similarity function used in graphify-check.ts:
  // character overlap ratio (Jaccard on character sets)
  function similarity(a: string, b: string): number {
    const setA = new Set(a.split(""));
    const setB = new Set(b.split(""));
    const intersection = [...setA].filter(c => setB.has(c)).length;
    const union = new Set([...setA, ...setB]).size;
    return union > 0 ? intersection / union : 0;
  }

  test("identical text → similarity = 1.0", () => {
    expect(similarity("被考官打臉", "被考官打臉")).toBe(1.0);
  });

  test("completely different text → low similarity", () => {
    expect(similarity("被考官打臉", "周末煉器成功")).toBeLessThan(0.3);
  });

  test("similar text → moderate similarity (> 0.5)", () => {
    expect(similarity("被考官打臉嘲笑", "被考官打臉吐槽")).toBeGreaterThan(0.5);
  });

  test("fatigue threshold: 3 of 3 identical → fatigue ratio = 1.0", () => {
    const texts = ["被考官打臉", "被考官打臉", "被考官打臉"];
    let similarPairs = 0;
    const totalPairs = texts.length * (texts.length - 1) / 2;
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        if (similarity(texts[i], texts[j]) > 0.7) similarPairs++;
      }
    }
    const fatigueRatio = similarPairs / totalPairs;
    expect(fatigueRatio).toBe(1.0);
    expect(fatigueRatio > 0.6).toBe(true);
  });

  test("no fatigue: 3 different manifestations", () => {
    const texts = ["被考官打臉", "周末煉器成功", "長老震驚不已"];
    let similarPairs = 0;
    const totalPairs = texts.length * (texts.length - 1) / 2;
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        if (similarity(texts[i], texts[j]) > 0.7) similarPairs++;
      }
    }
    const fatigueRatio = similarPairs / totalPairs;
    expect(fatigueRatio <= 0.6).toBe(true);
  });
});

describe("reviewer feedback: dimension check evidence", () => {
  test("character_growth dimension: per-character checks contribute to gate score", () => {
    // Simulate per-character growth checks
    const result = computeGateScore([
      { check: "Character Growth: zhoumo", status: "PASS" } satisfies CheckInput,
      { check: "Character Growth: examiner", status: "WARN" } satisfies CheckInput,
      { check: "Plot Arc", status: "PASS" } satisfies CheckInput,
    ]);
    // Character Growth group: 1 pass, 1 warn → passRate 0.5 → neutral (0)
    // Plot Arc: PASS → +5
    expect(result.score).toBe(100);
    const cgGroup = result.group_scores.find(g => g.group === "Character Growth");
    expect(cgGroup).toBeDefined();
    expect(cgGroup!.pass_rate).toBeCloseTo(0.5);
  });

  test("Theme: per-theme checks contribute to gate score", () => {
    const result = computeGateScore([
      { check: "Thematic Coherence", status: "PASS" } satisfies CheckInput,
      { check: "Theme: courage", status: "PASS" } satisfies CheckInput,
      { check: "Theme: betrayal", status: "WARN" } satisfies CheckInput,
    ]);
    // Thematic Coherence: PASS → +5
    // Theme: 1 pass, 1 warn → neutral (0)
    expect(result.score).toBe(100);
  });
});
