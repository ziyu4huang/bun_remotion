---
name: always-update-roadmap
description: After completing ANY development step, MUST update NEXT.md (status + reflection) and TODO.md (mark done). No exceptions.
type: feedback
---

After completing any development task (bug fix, feature, optimization, refactor), always update the skill roadmap files:

1. **NEXT.md** — Update status line, next task, add a reflection entry (what built, bugs found, honest assessment), update Completed Phases table if applicable
2. **TODO.md** — Mark task `[x]`, add brief result note (files changed, test counts, what was tested)
3. **PLAN.md** — Only if the task changed architecture or spec (rare)

**Why:** Without this discipline, the roadmap drifts from reality. NEXT.md becomes stale, TODO.md loses track of what's done, and the next session starts with wrong context. The skill's SKILL.md already has a "Post-Development Protocol" section but it was being skipped.

**How to apply:** After marking a task done, immediately update NEXT.md and TODO.md. Treat it as part of the definition of done — a task is not complete until the roadmap reflects it. This applies to EVERY development step, not just major phases.
