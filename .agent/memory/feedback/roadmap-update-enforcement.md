---
name: roadmap-update-enforcement
description: ALWAYS update NEXT.md + TODO.md after completing any development step. Mandatory post-development protocol.
type: feedback
---

**Rule:** After completing ANY development step (feature, bugfix, batch job, refactor), you MUST update the roadmap before reporting done:
1. **NEXT.md** — Update status line, next task, add reflection entry, update Completed Phases table
2. **TODO.md** — Mark task `[x]`, add brief result note (files, counts, what was tested)
3. **PLAN.md** — Update only if architecture/spec changed (rare)

A task is NOT complete until the roadmap reflects it. Never skip this.

**Why:** Without updating, the next session starts with stale context and loses work. The roadmap IS the memory between sessions. Skipping it wastes the next session's first 10 minutes re-discovering what happened.

**How to apply:**
1. After finishing code changes, immediately update NEXT.md status line and add reflection
2. Mark TODO items complete with result notes
3. Add new phase entries to PLAN.md for planned-but-not-started work
4. Update the SKILL.md post-development protocol reminder if needed
5. This applies to ALL work: batch jobs, bug fixes, new features, refactors — anything that changes state
