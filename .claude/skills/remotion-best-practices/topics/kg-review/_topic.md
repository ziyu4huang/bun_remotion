# KG Quality Review (Tier 2 — Claude Code)

> **Tier 2 review** runs inside a Claude Code session when Tier 0 or Tier 1 escalates.
> Reads `gate.json` v2 + `kg-quality-score.json` + raw narration files.

## When to Review

Triggered when `gate.json.requires_claude_review === true`:
- `gate.json.score < 70` (programmatic threshold)
- Any FAIL check detected
- `gate.json.score_delta < -10` (regression from previous run)

## How to Review

1. **Read inputs:** `gate.json`, `kg-quality-score.json`, `consistency-report.md`, narration excerpts
2. **Evaluate** each dimension below using the rubric
3. **Write** `quality-review.json` to `storygraph_out/`
4. **Suggest fixes** with specific file/line references where possible

## Tier 2 Evaluation Rubric

### Core Dimensions (all genres)

| Dimension | What to Evaluate | Score Range |
|-----------|-----------------|-------------|
| **semantic_correctness** | Beyond entity labels — do relationships capture the *meaning* of story events? | 0-10 |
| **creative_quality** | Humor, engagement, originality of extracted content | 0-10 |
| **genre_assessment** | Genre-specific structural quality (see extensions below) | 0-10 |
| **regression_analysis** | Compare with previous run — is quality improving or degrading? | 0-10 |
| **fix_specificity** | Quality of fix suggestions from Tier 0/1 — are they actionable? | 0-10 |

### Genre Extensions

#### xianxia_comedy (weapon-forger, xianxia-system-meme)
- **Battle FX mapping**: Do tech_term nodes map to viable Remotion effects?
- **Power escalation arc**: Is there a detectable progression across episodes?
- **Cultivation terminology consistency**: Are system/technique terms used consistently?

#### galgame_meme (galgame-meme-theater)
- **Comedy timing**: Do scene nodes capture comedic rhythm?
- **Gag variety**: Is there sufficient diversity in gag_manifestation types?
- **Callback tracking**: Are callbacks properly linked to their original setup?

#### novel_system (my-core-is-boss)
- **System mechanic coherence**: Are game/system mechanics internally consistent?
- **NPC behavior logic**: Do character behaviors align with their "NPC" or "player" status?
- **Bug/feature narrative arc**: Is the bug-as-feature pattern tracked across episodes?

## quality-review.json Schema

```json
{
  "version": "1.0",
  "timestamp": "2026-04-19T...",
  "reviewer": "claude-code",
  "tier0_summary": {
    "score": 75,
    "decision": "PASS",
    "previous_score": 72,
    "score_delta": 3
  },
  "tier1_summary": {
    "overall": 6.2,
    "blended": 0.372,
    "decision": "REJECT"
  },
  "tier2_evaluation": {
    "semantic_correctness": 7,
    "creative_quality": 6,
    "genre_assessment": 8,
    "regression_analysis": 9,
    "fix_specificity": 5,
    "overall": 7.0,
    "justification": "..."
  },
  "fixes": [
    {
      "dimension": "fix_specificity",
      "issue": "Tier 1 suggested pacing improvements but didn't specify which scenes",
      "suggestion": "Add per-scene pacing targets to ch2ep2 scenes 2-4",
      "file": "scripts/narration.ts",
      "priority": "medium"
    }
  ],
  "regression_notes": "Score improved from 72 to 75 (+3). No regressions detected.",
  "decision": "APPROVE_WITH_FIXES"
}
```

### Decision Values
- `APPROVE` — No changes needed
- `APPROVE_WITH_FIXES` — Minor issues, apply suggested fixes
- `REQUEST_RERUN` — Significant issues, re-run pipeline with adjusted params
- `BLOCK` — Critical issues, manual intervention required

## Integration with Episode Setup

After episode-creation Step 3b (quality gate):
1. Check if `gate.json.requires_claude_review` is true
2. If true, perform Tier 2 review before proceeding
3. Write `quality-review.json`
4. If decision is `APPROVE` or `APPROVE_WITH_FIXES`, continue to Step 4
5. If `REQUEST_RERUN` or `BLOCK`, stop and report to user
