# storygraph — NEXT Iteration

> **Cross-linked docs:**
> - Code PLAN: `bun_app/storygraph/PLAN.md`
> - Code TODO: `bun_app/storygraph/TODO.md`
> - Code NEXT: `bun_app/storygraph/NEXT.md` — **(this file)**

> **Version:** v0.40.0 COMPLETE → v0.41.0 target
> **Date:** 2026-05-01
> **Theme:** Integration API Stability + Pipeline API Hardening

---

## Reflection from v0.40.0

| What | Assessment |
|------|-----------|
| Reviewer feedback fixes (v0.40.0) | Clean — tooling gap suppression, gag fatigue, dimension evidence |
| Calibrated scoring (v0.37–v0.39) | Score converged with GLM reviewers (5-point gap, was 23-33) |
| Content-aware enrichment (v0.34.0) | 10.6% WARN reduction on my-core-is-boss |
| Pipeline API (pipeline-api.ts) | Stable — 5 exported functions consumed by remotion_studio. No integration tests |
| Test coverage | 483 tests, 28 files. No integration tests verifying cross-app consumer contracts |

**Key lesson:** Score calibration required 3 iterations (v0.37→v0.38→v0.39) to converge pipeline score with reviewer scores. Genre-aware checks are essential — comedy series need different arc models than drama.

---

## v0.41.0 Goals

### Goal 1: Pipeline API Contract Tests (P0)

**Current state:** `pipeline-api.ts` exports 5 functions (`getPipelineStatus`, `runPipeline`, `runCheck`, `runScore`, `runSuggest`, `runHealth`) consumed by `remotion_studio`. No tests verify the return type contracts match what consumers expect.

**Target state:** Contract tests in `src/__tests__/pipeline-contract.test.ts` that verify:
- `PipelineStatusResult` shape for series with/without outputs
- `CheckResult` shape — success/failure paths, gate.json parsing
- `ScoreResult` shape — blended score formula, programmatic/AI components
- `SuggestResult` shape — suggestion categories, severity ordering
- `HealthResult` shape — dimensions, debt items, genre-specific fields
- Edge cases: missing gate.json, corrupt JSON, empty series dir

**Estimated effort:** 1 new test file (~250 lines)

### Goal 2: Pipeline API Hardening (P1)

**Current state:** `pipeline-api.ts` has several `catch { /* ignore */ }` blocks that silently swallow parse errors. `runPipeline` uses `Bun.spawnSync` for subprocess calls but doesn't capture stderr for error reporting.

**Target state:**
- Replace `catch { /* ignore */ }` with error counting in `getPipelineStatus`
- Capture stderr from subprocess calls in `runPipeline` step results
- Add timeout protection for `runCheck` and `runPipeline` subprocess calls
- Validate `gate.json` schema before consuming (catch corrupt files early)

**Estimated effort:** ~50 lines changed in pipeline-api.ts, 10+ new tests

---

## Task Dependency Graph

```
Goal 1 (Contract Tests) ────────► v0.41.0
Goal 2 (API Hardening) ─────►│
```

Goal 2 depends on Goal 1 (tests define the contracts that hardening must preserve).

---

## Success Criteria for v0.41.0

- [ ] Contract tests: 20+ tests covering all 6 pipeline-api.ts exported functions
- [ ] Contract tests: verify return shapes match TypeScript interfaces exactly
- [ ] API hardening: no more `catch { /* ignore */ }` in getPipelineStatus
- [ ] API hardening: stderr captured in runPipeline step results
- [ ] Unit tests: 503+ pass (483 existing + 20 new), 0 fail
- [ ] remotion_studio integration tests pass against hardened API

---

## Deferred to v0.42.0+

| Item | Why deferred |
|------|-------------|
| Phase 24-E/F: Dialog line count + theme nodes | Blocked by narration.ts parser needing dialog_line_count extraction |
| Pipeline API v2: streaming progress | Requires refactoring Bun.spawnSync → async streaming |
| Cross-series comparison API | Currently only in CLI (graphify-tier-compare.ts), not exposed as importable function |
| KG data freshness indicator | No mtime-based staleness detection for graph.json vs narration.ts |

---

## v0.39.0 — Calibrated Scoring + Structural Separation

**Score converged with GLM reviewers. 472 tests.**

| Feature | Details |
|---------|---------|
| Dimension ceiling calibration | <60% tier: single→cap 80, 2+→cap 70 |
| Structural check separation | Community/Isolated/Cross-community tagged `_structural`, excluded from scoring |
| Episode coverage check | New `checkEpisodeCoverage()`, WARN at <80% coverage |

| Metric | Value |
|--------|-------|
| Unit tests | 472 pass, 0 fail |
| weapon-forger score | 70 (reviewer: 65, gap: 5) |
| Actionable WARNs | 25 (was 34, 9 structural moved to notes) |

## v0.40.0 — Reviewer Feedback Fixes

**Tooling gap suppression, gag fatigue, dimension evidence. 483 tests.**

| Feature | Details |
|---------|---------|
| Tooling gap suppression | `_tooling_gap` Trait Coverage WARNs excluded from gate scoring |
| Gag fatigue detection | `checkGagFatigue()` — cross-episode pattern repetition |
| Dimension check evidence | Per-character and per-theme entries in checks list |

| Metric | Value |
|--------|-------|
| Unit tests | 483 pass, 0 fail |
| New tests | 11 (gate-scoring 2, reviewer-feedback 9) |
