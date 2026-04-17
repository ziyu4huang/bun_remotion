---
name: pipeline-step-skipping
description: Never skip pipeline steps — graphify gate is mandatory, not optional
type: feedback
---

Never skip any step in the episode-creation pipeline. Each step is a gate, not a suggestion.

**Why:** When writing ch2ep1, I skipped Step 3 (Graphify Quality Gate) entirely — jumped from story confirm (Step 2) straight to discussing polish details with the user. This meant the WARN issues (zhaoxiaoqi no traits, linyi no interactions) were caught only after the user flagged them as real problems, not "parser false positives". If I had run the gate first, these would have been caught and fixed before user review.

**How to apply:**
1. After user confirms story (Step 2), ALWAYS run Step 2.5 (write narration.ts + episode PLAN.md) immediately
2. Then ALWAYS run Step 3 (graphify extract → merge → check → subagent gate analysis)
3. Then ALWAYS present the gate results (Step 3c) for user PROCEED/NEEDS-FIX decision
4. Only after PROCEED → move to Step 4 (TODO.md + scaffold)
5. If any step reveals issues → fix narration → re-run pipeline from that step
6. NEVER treat WARN items as "parser false positives" without user confirmation — surface them honestly and let the user decide
7. Track pipeline progress explicitly with TaskCreate so no steps get lost
