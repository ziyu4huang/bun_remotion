# Post-Run Protocol

Read this file AFTER completing any operation to perform knowledge capture and review.

## Knowledge Capture Protocol

After EVERY operation, Claude MUST:

1. **Inspect output** — Read JSON stats, check node/edge counts
2. **Record to appropriate TODO:**
   - **Pipeline/architecture issues** → skill TODO (`.claude/skills/bun_graphify/TODO.md`) — add to Known Issues or P0/P1/P2
   - **Code implementation bugs** → code TODO (`bun_app/bun_graphify/TODO.md`) — add file/line references
   - **Series-specific tasks** → series TODO (e.g., `bun_remotion_proj/weapon-forger/TODO.md`) — episode work, assets
3. **Capture lessons** — If a new lesson was learned (script bug, format mismatch, etc.):
   - Write to `.agent/memory/feedback/` with type `feedback`
   - Follow existing memory file format (YAML frontmatter + structured content)
4. **Update SKILL.md or operation files** — If a command or behavior changed, update the relevant file
5. **Record run to skill TODO** — Add a dated entry under "Pipeline Run History" with metrics table

## Self-Reflection Checklist

After completing a full pipeline run, Claude MUST review:

1. **Output quality:**
   - Per-episode graphs: 20-50 nodes each?
   - Merged graph: link edges present for all expected types?
   - Consistency report: any FAIL items that need attention?
   - HTML: opens without errors, visualization is readable?

2. **Cross-episode links:**
   - `same_character`: Are all recurring characters linked across episodes?
   - `story_continues`: Is the plot chain complete and in order?
   - `gag_evolves`: Do gag chains match PLAN.md gag table?

3. **Comparison with previous run** (if applicable):
   - Node counts changed? Why?
   - Previously failing checks now pass?
   - Any new warnings?

4. **Record findings** to skill TODO run history and feedback memory.
