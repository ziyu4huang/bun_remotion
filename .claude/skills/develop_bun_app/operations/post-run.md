# op: post-run `<name>`

Knowledge capture after completing an operation on a bun_app. Run this after scaffold, develop, or any significant change.

## When to Use

- After completing a feature or bug fix (develop op)
- After scaffold, once the user describes what the app should do
- After fixing test failures (test op)
- After any session where the app changed in non-trivial ways

## Steps

1. **What changed?** — List files created, modified, or deleted
2. **What was learned?** — Non-obvious findings, gotchas, dependency quirks
3. **Update TODO.md**:
   - Move completed tasks from P0/P1/P2 → Done
   - Add new discoveries to Known Issues (if any)
   - Add Development History entry with metrics table
4. **Update PLAN.md** (if architecture changed):
   - Module Reference table (new files, changed exports)
   - Architecture diagram (new module relationships)
   - Dependencies table (added/removed packages)
   - Configuration table (new env vars)
5. **Write feedback memory** (if reusable lesson):
   - Path: `.agent/memory/feedback/<topic>.md`
   - Content: rule, **Why:** context, **How to apply:** scope

## Reflections Pattern (for skill-level docs only)

When updating **skill** roadmap docs (e.g., remotion-best-practices), write reflections to a separate `REFLECTIONS.md` file, NOT in `NEXT.md`. Skill docs are loaded every session — reflections waste context tokens. bun_app TODO.md dev history sections are already on-demand (loaded only when developing that app), so they don't need a separate reflections file.

## Development History Entry Format

```markdown
### YYYY-MM-DD — <Short description>

| Metric | Before | After |
|--------|--------|-------|
| Tests | N pass | N pass |
| Modules | N files | N files |
| Dependencies | N | N |

**Changes applied:**
- <bullet list of what changed>

**Lessons learned:**
- <non-obvious findings, if any>
```

## Feedback Memory Format

Only write if the lesson is reusable across sessions or apps:

```markdown
---
name: <topic>
description: <one-line summary>
type: feedback
---

<Rule or pattern>

**Why:** <what happened that made this lesson valuable>

**How to apply:** <when/where this guidance kicks in>
```

## Quick Check

Run after post-run to verify everything is clean:

```bash
bun run --cwd bun_app/<name> test
```

## Success Criteria

- TODO.md Development History has a new entry for this session
- Completed tasks moved to Done section
- PLAN.md module table matches actual source files
- No orphaned TODO items (tasks for code that doesn't exist)
