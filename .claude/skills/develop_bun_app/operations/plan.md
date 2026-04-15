# op: plan `<name>`

Create, update, or review PLAN.md and TODO.md for a bun_app.

## Before Starting

- [ ] Read all source files in `bun_app/<name>/src/` — understand current implementation
- [ ] Run tests: `bun run --cwd bun_app/<name> test` — get current metrics

## When to Use

- User asks to "reflect", "plan", "retrospective", "review architecture"
- After completing a significant feature or fix
- When an existing app lacks PLAN.md or TODO.md
- Before starting new development work

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

## Success Criteria

- PLAN.md exists with: Current State, Architecture diagram, Module Reference table, Dependencies, Configuration
- TODO.md exists with: Status header, Known Issues, P0/P1/P2 tasks, Development History with baseline entry
- Module Reference table matches actual source files (no missing or phantom entries)
