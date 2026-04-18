---
name: plan-todo-sync-enforcement
description: Lesson: episode PLAN.md files and PLAN.md sections can drift for legacy series — need proactive sync check
type: feedback
---

Episode PLAN.md files and workspace PLAN.md sections (Story Arcs, Running Gags) can be missing for legacy series created before the lifecycle spec. The rules existed but had no enforcement trigger for existing series.

**Why:** Weapon-forger had 7 complete episodes with zero PLAN.md files, and workspace PLAN.md was missing Story Arcs + Running Gags sections. Discovered only when user prompted for a pipeline fix.

**How to apply:** Added "Sync Invariant Check" as the first section in episode-setup `_topic.md` — runs before any episode-setup work. Added step 5 (verify episode PLAN.md existence) and "Legacy series backfill" section to `plan-todo-lifecycle.md`. For legacy series, use "Backfill:" prefix in TODO.md and status=`scaffolded` for retroactive episode PLAN.md.
