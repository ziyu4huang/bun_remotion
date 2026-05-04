# op: plan `<name>`

Create, update, or review PLAN.md and TODO.md for a bun_app.

## Before Starting

- [ ] Read all source files in `bun_app/<name>/src/` — understand current implementation
- [ ] Run tests: `bun run --cwd bun_app/<name> test` — get current metrics

## When to Use

- User asks to "reflect", "plan", "retrospective", "review architecture", "next", "NEXT"
- After completing a significant feature or fix
- When an existing app lacks PLAN.md, TODO.md, or NEXT.md
- Before starting new development work
- After reaching a version milestone

### Cross-skill handoff during planning

If the plan reveals a large feature (new page, multi-module addition), suggest:
1. `/to-prd` — to formalize the spec as a GitHub issue before coding
2. `/to-issues` — to break the PRD into vertical-slice issues for incremental work
3. Then use `/develop_bun_app develop` to implement each slice

For closing completed issues after a version bump, suggest `/triage`.

## The PLAN/TODO/NEXT Triad

| File | Purpose | When to Update |
|------|---------|---------------|
| `PLAN.md` | Architecture & current state | Module changes, dependency changes, architecture decisions |
| `TODO.md` | Tasks & history | Task completion, new issues, development history |
| `NEXT.md` | Forward-looking iteration plan | Version milestones, retrospectives, planning next work |

All three files cross-link each other. Keep them in sync — when you complete a TODO task that's listed in NEXT.md, update both.

## Creating PLAN.md for an existing app

1. **Read all source files** — understand module structure, exports, dependencies
2. **Run tests** — `bun run --cwd bun_app/<name> test` to get current status
3. **Write PLAN.md** with these sections:
   - **Current State** — version, what works, what's partial
   - **Architecture** — ASCII diagram showing module relationships
   - **Module Reference** — table: file → exports → lines → status
   - **Dependencies** — table: package → purpose
   - **Configuration** — table: env var → default → purpose
   - **Cross-links** — reference TODO.md and skill docs

4. **Write TODO.md** with these sections:
   - **Status header** — version + test pass count
   - **Known Issues** — from real usage, grouped by area
   - **P0 / P1 / P2** — priority-based task checkboxes
   - **Phase sections** — future work organized by theme
   - **Development History** — initial entry with baseline metrics
   - **Done** — checked items

## Updating after changes

### After a bug fix
- Add entry to Development History with: date, what was fixed, test result
- Move checkbox from P0 to Done
- If root cause was non-obvious, add to Known Issues (for pattern reference)

### After a new feature
- Update PLAN.md module reference table (new file or changed exports)
- Update PLAN.md architecture diagram if module relationships changed
- Add entry to Development History with metrics
- Move checkbox from P1/P2 to Done
- Check if Known Issues section needs updates

### After refactoring
- Update PLAN.md architecture diagram
- Update module reference table
- Add entry to Development History
- Verify tests still pass

## PLAN.md Template

```markdown
# <name> — Code Plan

> **Cross-linked docs:**
> Code folder (this) | Skill folder
> ---|---
> `bun_app/<name>/PLAN.md` — **(this file)** | `.claude/skills/develop_bun_app/SKILL.md`
> `bun_app/<name>/TODO.md` — Tasks + history | `.claude/skills/develop_bun_app/operations/`

## Current State (v0.1.0)

**Working:**
- (list what works)

**Test Coverage:**
| Module | Tests | Coverage |
|--------|-------|----------|
| ... | ... | ... |

## Architecture

```
(ASCII diagram)
```

## Module Reference

| File | Exports | Lines | Status |
|------|---------|-------|--------|
| ... | ... | ... | ... |

## Dependencies
| Package | Purpose |
|---------|---------|
| ... | ... |

## Configuration
| Var | Default | Purpose |
|-----|---------|---------|
| ... | ... | ... |
```

## TODO.md Template

```markdown
# <name> — Code TODO

> **Cross-linked docs:**
> - Code PLAN: `bun_app/<name>/PLAN.md`
> - Code TODO: `bun_app/<name>/TODO.md` — **(this file)**

> **Status:** v0.1.0 — baseline

## Known Issues

(group by area)

## P0 — Fix next

- [ ] ...

## P1 — Feature completeness

- [ ] ...

## P2 — Architecture improvements

- [ ] ...

## Development History

### YYYY-MM-DD — Description

| Metric | Value |
|--------|-------|
| Tests | N pass, 0 fail |
| ... | ... |

**Changes applied:**
- ...

## Done

- [x] ...
```

## Creating NEXT.md

NEXT.md is the forward-looking iteration plan. Create/update it after retrospectives, version milestones, or when the user asks "what's next?".

### NEXT.md Template

```markdown
# <name> — NEXT Iteration

> **Cross-linked docs:**
> - Code PLAN: `bun_app/<name>/PLAN.md`
> - Code TODO: `bun_app/<name>/TODO.md`
> - Code NEXT: `bun_app/<name>/NEXT.md` — **(this file)**

> **Version:** v0.X.0 → v0.Y.0 target
> **Date:** YYYY-MM-DD
> **Theme:** <one-line theme>

---

## Reflection from v0.X.0

| What | Assessment |
|------|-----------|
| <feature> | Clean / Needs work / Blocked |
| ... | ... |

**Key lesson:** <single most important takeaway>

---

## v0.Y.0 Goals

### Goal 1: <title> (P0)

**Current state:** <what exists now>
**Target state:** <what we want>
**Estimated effort:** N files (<list>)

### Goal 2: <title> (P1)

...

---

## Task Dependency Graph

```
Goal 1 ──┐
         ├──► v0.Y.0 release
Goal 2 ──┘
```

---

## Success Criteria for v0.Y.0

- [ ] <criterion 1>
- [ ] Smoke tests: N/N pass, 0 console errors
- [ ] Unit tests: N+ pass, 0 fail
```

### NEXT.md Content Rules

1. **Reflection first** — what went well, what went wrong, key lesson
2. **Goals are scoped** — each goal has current state, target state, estimated effort
3. **Dependencies are explicit** — what blocks what
4. **Success criteria are testable** — each criterion is a checkbox
5. **Version targets are realistic** — one P0 goal per iteration is plenty

## Success Criteria

- PLAN.md exists with: Current State, Architecture diagram, Module Reference table, Dependencies, Configuration
- TODO.md exists with: Status header, Known Issues, P0/P1/P2 tasks, Development History with baseline entry
- NEXT.md exists with: Version target, reflection, prioritized goals with effort estimates, dependency graph, success criteria
- Module Reference table matches actual source files (no missing or phantom entries)
