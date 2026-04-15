# op: status `<name>`

Audit an existing bun_app — tests, dependencies, file tree, code stats.

## Before Starting

- [ ] Read `bun_app/<name>/PLAN.md` — compare documented state against what you find
- [ ] Read `bun_app/<name>/TODO.md` — check what tasks are tracked vs. reality

## Checklist

1. **File tree** — `find bun_app/<name>/src -name '*.ts' | sort`
2. **Package info** — read `bun_app/<name>/package.json` for name, version, scripts, deps
3. **PLAN.md** — check if exists and is up to date (compare module table against actual files)
4. **TODO.md** — check if exists, report P0/P1/P2 task counts and latest history entry
5. **Test results** — `bun run --cwd bun_app/<name> test`
6. **Test count** — number of test files and individual tests
7. **Dependencies** — list from package.json, check for outdated
8. **TypeScript errors** — `bun run --cwd bun_app/<name> tsc --noEmit` (if tsconfig allows)
9. **Build status** — try build if build script exists

## Report Format

```
## bun_app/<name> Status

- Package: <name>@<version>
- Files: <N> TypeScript source files
- Tests: <N> test files, <N> tests (<pass/fail>)
- Dependencies: <list>
- Build: ✅ passes / ❌ fails / ⚠️ no build script
- PLAN.md: ✅ exists / ❌ missing
- TODO.md: ✅ exists (P0: N, P1: N, P2: N) / ❌ missing
- Last dev history: YYYY-MM-DD — <description>
```

## Quick Commands

```bash
# File count
find bun_app/<name>/src -name '*.ts' | wc -l

# Test summary
bun run --cwd bun_app/<name> test

# Check for TODO/FIXME
grep -rn 'TODO\|FIXME' bun_app/<name>/src/
```

## Success Criteria

- Report generated covering all 9 checklist items
- PLAN.md and TODO.md staleness flagged (if source files changed since last PLAN update)
- Any discrepancies between documented and actual state are noted
