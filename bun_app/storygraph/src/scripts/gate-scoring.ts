/**
 * Group-based gate scoring — episode-count-independent quality scoring.
 *
 * Two layers:
 * 1. Per-group check scoring (PASS/WARN/FAIL counts)
 * 2. Quality dimension ceilings (thematic_coherence, character_growth, etc.)
 *
 * A FAIL check caps score at 80. Dimensions below thresholds apply
 * progressive ceilings so structural problems can't be buried by
 * individual check passes.
 */

export interface CheckInput {
  check: string;
  status: "PASS" | "WARN" | "FAIL" | "SKIP";
  /** True if WARN is a known tooling gap (regex miss, not a writing quality issue) */
  _tooling_gap?: boolean;
  /** True if check reflects graph topology, not writing quality */
  _structural?: boolean;
}

export interface QualityBreakdown {
  consistency?: number | null;
  arc_structure?: number | null;
  pacing?: number | null;
  character_growth?: number | null;
  thematic_coherence?: number | null;
  gag_evolution?: number | null;
}

export interface GroupScore {
  group: string;
  pass_rate: number;
  score_impact: number;
}

export interface GateResult {
  score: number;
  decision: "PASS" | "WARN" | "FAIL";
  group_scores: GroupScore[];
  ceiling_applied?: string;
}

/**
 * Compute gate score from checks and optional quality breakdown.
 *
 * Layer 1 — Per group (check type prefix):
 *   - Any FAIL → -25
 *   - 100% PASS → +5
 *   - ≥50% PASS → 0 (neutral)
 *   - <50% PASS → -5
 *
 * Layer 2 — Dimension ceilings (quality_breakdown):
 *   - Any dim < 20% → cap at 50
 *   - Any dim < 30% → cap at 60
 *   - 2+ dims < 50% → cap at 75
 *   - Any dim < 50% → cap at 85
 *
 * Hard cap: any FAIL check → max score 80
 *
 * Score clamped to [0, 100]. Decision: ≥70 PASS, ≥40 WARN, else FAIL.
 */
export function computeGateScore(
  checks: CheckInput[],
  qualityBreakdown?: QualityBreakdown,
): GateResult {
  const scored = checks.filter(c => c.status !== "SKIP");
  const groups = new Map<string, { pass: number; warn: number; fail: number; nonscoring_warn: number }>();

  for (const c of scored) {
    const group = c.check.split(":")[0].trim();
    const entry = groups.get(group) ?? { pass: 0, warn: 0, fail: 0, nonscoring_warn: 0 };
    if (c.status === "PASS" && c._structural) { /* structural PASS doesn't inflate score */ }
    else if (c.status === "PASS") entry.pass++;
    else if (c.status === "WARN" && (c._tooling_gap || c._structural)) entry.nonscoring_warn++;
    else if (c.status === "WARN") entry.warn++;
    else if (c.status === "FAIL" && c._structural) { /* structural FAIL doesn't penalize */ }
    else entry.fail++;
    groups.set(group, entry);
  }

  let score = 100;
  const groupScores: GroupScore[] = [];

  // Layer 1: group-based scoring
  for (const [group, counts] of groups) {
    const total = counts.pass + counts.warn + counts.fail;
    if (total === 0 && counts.nonscoring_warn > 0) {
      // Only nonscoring (tooling/structural) warnings — neutral, no impact
      groupScores.push({ group, pass_rate: 1, score_impact: 0 });
      continue;
    }
    if (total === 0) continue;
    let impact: number;
    if (counts.fail > 0) {
      impact = -25;
    } else {
      const passRate = counts.pass / total;
      if (passRate >= 1.0) impact = 5;
      else if (passRate >= 0.5) impact = 0;
      else impact = -5;
    }
    score += impact;
    groupScores.push({ group, pass_rate: counts.pass / total, score_impact: impact });
  }

  // Layer 2: dimension ceilings
  let ceilingApplied: string | undefined;
  if (qualityBreakdown) {
    const dims = Object.entries(qualityBreakdown)
      .filter(([, v]) => v !== null && v !== undefined) as [string, number][];

    const lowDims = dims.filter(([, v]) => v < 0.5).map(([k]) => k);
    const midDims = dims.filter(([, v]) => v < 0.6).map(([k, v]) => `${k}=${(v * 100).toFixed(0)}%`);
    const criticalDims = dims.filter(([, v]) => v < 0.3).map(([k, v]) => `${k}=${(v * 100).toFixed(0)}%`);
    const severeDims = dims.filter(([, v]) => v < 0.2).map(([k, v]) => `${k}=${(v * 100).toFixed(0)}%`);

    if (severeDims.length > 0) {
      score = Math.min(score, 50);
      ceilingApplied = `dimension < 20%: ${severeDims.join(", ")}`;
    } else if (criticalDims.length > 0) {
      score = Math.min(score, 60);
      ceilingApplied = `dimension < 30%: ${criticalDims.join(", ")}`;
    } else if (midDims.length >= 2) {
      score = Math.min(score, 70);
      ceilingApplied = `2+ dimensions < 60%: ${midDims.join(", ")}`;
    } else if (lowDims.length >= 2) {
      score = Math.min(score, 75);
      ceilingApplied = `2+ dimensions < 50%: ${lowDims.join(", ")}`;
    } else if (midDims.length >= 1) {
      score = Math.min(score, 80);
      ceilingApplied = `dimension < 60%: ${midDims.join(", ")}`;
    } else if (lowDims.length >= 1) {
      score = Math.min(score, 85);
      ceilingApplied = `dimension < 50%: ${lowDims.join(", ")}`;
    }
  }

  // Hard cap: any non-structural FAIL check → max 80
  const hasFail = scored.some(c => c.status === "FAIL" && !c._structural);
  if (hasFail) {
    if (score > 80) {
      ceilingApplied = ceilingApplied
        ? `${ceilingApplied}; FAIL check cap`
        : "FAIL check cap at 80";
    }
    score = Math.min(score, 80);
  }

  score = Math.max(0, Math.min(100, score));
  const decision: GateResult["decision"] = score >= 70 ? "PASS" : score >= 40 ? "WARN" : "FAIL";

  return { score, decision, group_scores: groupScores, ceiling_applied: ceilingApplied };
}
