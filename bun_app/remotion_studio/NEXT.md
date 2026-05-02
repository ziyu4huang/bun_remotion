# remotion_studio — NEXT Iteration

> **Cross-linked docs:**
> - Code PLAN: `bun_app/remotion_studio/PLAN.md`
> - Code TODO: `bun_app/remotion_studio/TODO.md`
> - Code NEXT: `bun_app/remotion_studio/NEXT.md` — **(this file)**

> **Version:** v0.49.0 TARGET
> **Date:** 2026-05-02
> **Theme:** Process Hygiene + Plan Doc Accuracy

---

## Reflection from v0.48.0

| What | Assessment |
|------|-----------|
| E2E Modernization (Goal 1) | Clean — locale forced to "en", 5 specs updated, 2 new specs (29 total) |
| Server-Side Config (Goal 2) | Clean — ConfigStore + route + Settings "Save to Server" + bridge fallback |
| useJobStream Tests (Goal 3) | Clean — 7 tests covering fetch, cancel, delete, refresh, error |
| Build + tests | Stable — 523 pass, 437KB bundle |

**Key lesson:** Forcing locale in the shared `gotoWithRetry` helper is the right fix for E2E/i18n conflicts — one-line change fixes all 27+ specs. ConfigStore shallow-copy bug taught that `{ ...DEFAULT_CONFIG }` shares nested objects — always initialize with fresh objects.

---

## Root Cause Analysis (2026-05-02)

### Issue: Stale background server + CWD corruption

When starting the server for testing, the command `cd bun_app/remotion_studio && PORT=3210 bun run src/server/index.ts &` was used. This caused two cascading failures:

1. **CWD persistence** — Bash tool's CWD shifted from repo root to `bun_app/remotion_studio/`. All subsequent path-relative commands (`find`, `ls`, `git status`) operated from the wrong directory, making `playwright.config.ts` appear missing when it was actually there.

2. **Stale process** — The server process ran for 3+ hours with no auto-shutdown. The `SIGTERM`/`SIGINT` handlers only fire on explicit signals. When Claude Code sessions end, background servers keep running.

3. **PLAN.md port error** — PLAN.md documents `PORT` default as `3210` but code defaults to `5173`. E2E config uses `5173`. This mismatch causes confusion about which port to use.

### Prevention

| Pattern | Fix |
|---------|-----|
| Never `cd` into subdirectories | Use `PORT=5173 bun run --cwd bun_app/remotion_studio src/server/index.ts` instead |
| Stale server processes | Kill existing server on port before starting: `kill $(lsof -ti :5173) 2>/dev/null; ...` |
| PLAN.md drift | Audit PLAN.md Configuration table against actual code defaults |

---

## v0.49.0 Goals

### Goal 1: Fix PLAN.md + Server Startup (P0)

**Current state:** PLAN.md says PORT=3210, code defaults to 5173. Server startup uses `cd` which corrupts CWD.
**Target state:** PLAN.md matches code. Skill documents correct server startup pattern. No CWD corruption possible.
**Estimated effort:** 3 files (PLAN.md, CLAUDE.md, skill/develop.md)

### Goal 2: Server Process Management (P1)

**Current state:** Servers run indefinitely. No cleanup mechanism. Multiple stale processes can accumulate.
**Target state:** Before starting server, kill any existing process on the port. Document this in skill. Optional: PID file.
**Estimated effort:** 2 files (skill/develop.md, memory)

### Goal 3: Commit Hygiene (P1)

**Current state:** 48 modified files + 41 untracked files from v0.33.0–v0.48.0 work uncommitted.
**Target state:** All changes properly committed with accurate version history.
**Estimated effort:** 1 commit (or 2–3 logical commits)

---

## Task Dependency Graph

```
Goal 1 (PLAN.md fix) ──┐
Goal 2 (process mgmt) ──┤──► v0.49.0 release
Goal 3 (commit hygiene) ┘
```

---

## Success Criteria for v0.49.0

- [ ] PLAN.md Configuration table matches actual code defaults (PORT=5173)
- [ ] Skill develop.md documents correct server startup pattern (no `cd`)
- [ ] Memory file created for CWD + server process lesson
- [ ] All uncommitted changes committed
- [ ] Unit tests: 523+ pass, 0 fail
- [ ] Build: 437KB, 31 chunks
- [ ] Server starts cleanly on port 5173 without CWD shift

---

## Deferred to v0.50.0+

| Item | Why deferred |
|------|-------------|
| Story Arc Tracker (P1) | New feature — visual timeline of arcs across chapters. Requires design decisions. |
| Scene Reorder (P1) | New feature — drag-and-drop scene ordering. Requires UI library choice. |
| Style Guide per Series (P1) | New feature — define art style once, apply to all image generation. |
| React component snapshot tests | Lower value than render + interaction tests |
| App.tsx refactor (447 lines) | Not urgent — well-structured, just large due to navigation config |
| Benchmark.ts refactor (452 lines) | Largest server route file — could extract baselines logic |
