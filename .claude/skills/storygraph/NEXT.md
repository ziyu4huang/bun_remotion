# NEXT — Current Work

> **Entry point.** Read this first. Load TODO.md and PLAN.md sections only when actively working on a task.
>
> **Cross-linked docs:**
> - `TODO.md` — Active tasks, run history, known issues
> - `PLAN.md` — Architecture, node types, edge relations, phase specs
> - `../../bun_app/storygraph/TODO.md` — Code-level tasks (file/line specific)
> - `../../bun_app/storygraph/PLAN.md` — Code-level plan + reuse reference
> - `../develop_bun_app/REFLECTION.md` — Cross-app development plan (R1-R4)

> **Status:** v0.34.0 — Feedback loop + quality audit complete. 401 tests. Pipeline mature.

## Active Focus

### Phase R1: Regression Test Suite (P0)

**Goal:** Fill the biggest test gap — `graphify-regression.ts` has 10 exported functions and 0 unit tests.

**Files to create:**
- `src/__tests__/regression.test.ts` — `computeDelta`, `compareGate`, `compareQuality`, `generateReport`, `discoverBaselineSeries`, `loadLatestBaseline`
- `src/__tests__/baseline-trend.test.ts` — `computeTrend`, `saveBaseline`/`loadLatestBaseline` cycle, edge cases (empty dir, single snapshot, corrupt JSON)

**Estimated:** 20-25 tests, ~500 lines.

**Why:** Regression infrastructure protects all existing pipeline work. Without tests, refactors could silently break baseline comparison. This is the foundation for R2 (pi-agent regression tool) and R4 (CI gate).

### Cross-App Plan (see `.claude/skills/develop_bun_app/REFLECTION.md`)

Four phases: R1 (regression tests) → R2 (pi-agent tools) → R3 (studio dashboard) → R4 (CI gate).

## Completed (2026-04-29)

### KG Quality Verification & Improvement
- 5-series quality audit: all 100/100
- Systematic WARNs identified: Trait Coverage (29), Community Cohesion (14), Isolated Nodes (15)
- Series configs improved: my-core-is-boss Trait Coverage 25→20 (-20%)
- AI accuracy spot-check: 30 nodes, no hallucinations
- Regression baselines: gate-20260429.json for all series

### Content-Aware Enrichment Loop
- `buildEnrichmentFeedbackPrompt()` in subagent-prompt.ts
- `--feedback` flag in graphify-episode.ts + graphify-pipeline.ts
- A/B result: my-core-is-boss 66→59 WARN (-10.6%)

## Pending (not active)

- **Cross-series KG merge** — Federated merge across all series. Depends on closing quality gaps first.

## Completed Phases

| Phase | What | Key Result |
|-------|------|-----------|
| 23 | AI Cross-Link Discovery | StoryCrossLink type, PageRank, vis.js cross-links |
| 24 | Story Quality Gates | 6 checks, plot arc, foreshadowing, character growth |
| 26 | pi-agent AI Integration | callAI(), --mode ai, direct API calls |
| 27 | Hybrid Mode + Comparison | regex+AI blend, 97 vs 54 vs 32 on my-core-is-boss |
| 28-B | Model Benchmark | Accuracy sampling, reliability runs, cost comparison |
| 29 | Quality Pipeline Completion | gate.json, consistency checks |
| 30 | Genre-Aware Pipeline | 3 genres, comedy arc, gag diversity |
| 31 | Subagent KG Scoring | Tier 1 GLM evaluation, blended scores |
| 32 | KG Feedback Loop | Context injection, enrichment, calibration |
| 33 | Dual-LLM Architecture | Three-tier quality, gate v2, CLI, CI mode |
| 34 | Video Category System | 7 categories, scene templates, episodeforge |
| 46 | Proactive Story Tools | sg_suggest (8 analyzers), sg_health (6 dimensions) |
| — | Content-Aware Scoring | kg-loaders → graphify-check, Episode Continuity, variant suppression |
| — | Quality Audit + Feedback Loop | 5-series audit, Trait Coverage/Community Cohesion systemic, --feedback flag, 10.6% WARN reduction |
