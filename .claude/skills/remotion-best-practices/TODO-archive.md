# Novel Video Generation — TODO Archive

> Completed tasks from Phase 24–30. For reference only.
> Active tasks: `TODO.md`

---

## Known Issues (addressed by Phase 24)

| Issue | Phase | Status |
|-------|-------|--------|
| Jaccard similarity computed but never gates duplicate episodes | 24-A | **Fixed** |
| No algorithm-only cross-links (only AI) | 24-A | **Fixed** |
| No dramatic structure analysis | 24-B | **Fixed** |
| No foreshadowing tracking | 24-C | **Fixed** (types + check + prompt) |
| Character arc score = variation, not growth | 24-D | **Fixed** |
| No per-scene pacing analysis | 24-E | **Fixed** (v0.12.0) |
| No thematic coherence tracking | 24-F | **Fixed** (v0.13.0) |

## Phase 24 Gaps (discovered during implementation)

| Gap | Severity | Fix |
|-----|----------|-----|
| graphify-merge.ts doesn't create foreshadow nodes/edges | Medium | **Fixed** |
| No pipeline integration for plot arc / foreshadowing subagents | Medium | graphify-pipeline.ts needs steps to invoke subagents (or wait for Phase 26 --mode ai) |
| Step 3b subagent prompt doesn't reference new gate subsections | Low | **Fixed** |

---

## P0 — Fix next (Phase 24 gaps) — ALL COMPLETE

- [x] **Foreshadow merge step** — `graphify-merge.ts` reads `foreshadow-output.json`
- [x] **Step 3b subagent prompt update** — episode-creation.md Step 3b references all 4 new gate subsections

---

## Phase 24-A: Active Duplicate Content Gate — COMPLETE

- [x] **24-A1: checkDuplicateContent()** — FAIL when Jaccard > 0.7, WARN > 0.5
- [x] **24-A2: Algorithm-only cross-links from Jaccard** — `generated_by: "algorithm"` cross-links
- [x] **24-A3: Update episode-creation.md gate template** — 重複內容檢查 subsection

## Phase 24-B: Plot Arc Detector — COMPLETE

- [x] **24-B1: PlotBeat type** — inciting_incident / rising_action / climax / falling_action / resolution
- [x] **24-B2: computePlotArcScore()** — Expected curve match, 0-100 score
- [x] **24-B3: buildPlotArcPrompt()** — File-based I/O subagent prompt
- [x] **24-B4: checkPlotArc()** — FAIL: no climax, WARN: flat middle / inverted
- [x] **24-B5: Update episode-creation.md gate template** — 劇情弧分析 subsection

## Phase 24-C: Foreshadowing Tracker — COMPLETE

- [x] **24-C1: Foreshadow type + foreshadows link edge**
- [x] **24-C2: buildForeshadowPrompt()** — File-based subagent
- [x] **24-C3: checkForeshadowing()** — WARN if unpaid after 2 eps
- [x] **24-C4: Update episode-creation.md gate template** — 伏筆追蹤 subsection

## Phase 24-D: Character Growth Trajectory — COMPLETE

- [x] **24-D1: Upgrade computeCharacterArcScore()** — Direction-aware scoring
- [x] **24-D2: checkCharacterGrowth()** — WARN: flat arc across 3+ eps
- [x] **24-D3: Update episode-creation.md gate template** — 角色成長軌跡 subsection

## Phase 24-E: Pacing Curve — COMPLETE

- [x] **24-E0: dialog_line_count in scene nodes**
- [x] **24-E1: computePacingCurve() + checkPacing()** — Weighted: dialog 40% + chars 30% + effects 30%

## Phase 24-F: Thematic Coherence — COMPLETE

- [x] **24-F1: computeThemeCoherence() + checkThematicCoherence()** — WARN if < 0.3

---

## Phase 26 — Dual-Mode Pipeline with pi-agent — COMPLETE

- [x] **26-A1: ai-client.ts** — pi-ai SDK wrapper with provider/model selection
- [x] **26-A2: Add @mariozechner/pi-ai dep** — storygraph package.json
- [x] **26-B1: Episode NL extraction (--mode ai)**
- [x] **26-B2: Cross-link discovery (--mode ai)**
- [x] **26-B3: Check enrichment (--mode ai)**
- [x] **26-C1: Pipeline --mode ai passthrough**

---

## Phase 27 — Hybrid Mode + Comparison Framework — COMPLETE

- [x] **27-A1: --mode hybrid in ai-client.ts**
- [x] **27-A2: Hybrid extraction in graphify-episode.ts** — Regex first, AI adds exclusives
- [x] **27-A3: Pipeline hybrid passthrough**
- [x] **27-A4: graphify-compare.ts** — 3-mode comparison tool
- [x] **27-A5: Generation manifest** — All outputs include mode/model/timestamp

### Comparison results (my-core-is-boss, 5 eps)

| Metric | regex | ai | hybrid |
|--------|-------|----|--------|
| Total nodes | 109 | 98 | 199 |
| Node types | 5 | 8 | 8 |
| Score | 54 | 32 | **97** |

---

## Phase 28 — Model Benchmark — COMPLETE

- [x] **28-A1: z.ai model connection test** — 8 tests, all pass in ~9.5s
- [x] **28-A2: 6-model graphify benchmark**
- [x] **28-A3: Decision: glm-5 wins (score 634)**
- [x] **28-A4: callAI timeout protection** — 60s AbortController

### Benchmark results (my-core-is-boss, 5 eps, hybrid mode)

| Metric | glm-4.5-air | glm-4.7 | glm-4.7-flash | **glm-5** | glm-5-turbo | glm-5.1 |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| Nodes | 124 | 164 | 196 | **258** | 178 | 109 |
| Edges | 231 | 271 | 307 | **440** | 291 | 215 |
| **Score** | 391 | 461 | 498 | **634** | 484 | 333 |

---

## Phase 29 — Story Quality Pipeline Completion — COMPLETE

- [x] **29-A: Thematic Coherence (24-F)** — theme node + illustrates edge
- [x] **29-B: Aggregate Quality Score** — computeAggregateScore() (0-100)
- [x] **29-C: Gate Enforcement** — gate.json with AI fix suggestions
- [x] **29-D: Enhanced Pacing** — 3-signal weighted tension
- [x] **29-E: Per-Episode HTML** — Step 1.5 in pipeline
- [x] **29-F: Phase 25 Overlay Components** — PlotBeatOverlay, TensionMeter, CharacterStateOverlay + story-graph.ts

### Files Modified (Phase 29)

| File | Changes |
|------|---------|
| `subagent-prompt.ts` | +theme node type + illustrates edge |
| `story-algorithms.ts` | +computeThemeCoherence(), enhanced PacingPoint |
| `graphify-check.ts` | +checkThematicCoherence(), aggregate score, gate.json, enhanced pacing, fix suggestions |
| `graphify-episode.ts` | +character_count, +effect_count in scene nodes |
| `graphify-pipeline.ts` | +Step 1.5 per-episode HTML |
| `PlotBeatOverlay.tsx` | NEW |
| `TensionMeter.tsx` | NEW |
| `CharacterStateOverlay.tsx` | NEW |
| `story-graph.ts` | NEW — graph data utilities |

---

## Phase 30 — Genre-Aware KG Pipeline — COMPLETE

### 30-A: Genre-Aware Scoring Formula

- [x] **30-A1: Genre enum + scoring profiles** — StoryGenre type, ScoringProfile per genre
- [x] **30-A2: Genre-weighted scoring in graphify-compare.ts**

### 30-B: Comedy-Specific Extraction Patterns

- [x] **30-B1: Comedy arc analysis** — checkComedyArc() (setup→escalation→punchline→callback)
- [x] **30-B2: Gag diversity score** — computeGagDiversity()
- [x] **30-B3: Comedy subagent prompt** — buildComedyAnalysisPrompt()

### 30-C: Regex Generalization

- [x] **30-C1: Effect pattern per genre** — SeriesConfig.effectPattern
- [x] **30-C2: Title pattern per genre** — SeriesConfig.titlePattern

---

## Pipeline Run History

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| 2026-04-18 | Design | Complete | PLAN.md + TODO.md created |
| 2026-04-18 | Phase 24-A–D | Complete | All 4 check suites + gate templates |
| 2026-04-18 | Phase 26-A/B | Complete | ai-client.ts, pi-ai dep, episode extraction |
| 2026-04-18 | Phase 26-B3/C1 | Complete | Check enrichment, pipeline aiFlags passthrough |
| 2026-04-18 | Phase 26-C3 | Complete | AI vs regex comparison |
| 2026-04-18 | Phase 27 | Complete | --mode hybrid + graphify-compare.ts (hybrid 97 vs regex 54 vs ai 32) |
| 2026-04-18 | Phase 24-E | Complete | computePacingCurve + checkPacing |
| 2026-04-19 | Phase 29 | Complete | v0.13.0 — thematic coherence, aggregate score, gate.json, enhanced pacing, overlays |
| 2026-04-19 | Phase 30 | Complete | v0.15.0 — Genre-aware KG pipeline |

---

## Done

- [x] Phase 24-A–F complete (6 quality checks)
- [x] Phase 26 complete (pi-agent AI integration)
- [x] Phase 27 complete (hybrid mode + comparison)
- [x] Phase 28 complete (model benchmark, glm-5 default)
- [x] Phase 29 complete (quality pipeline completion + overlays)
- [x] Phase 30 complete (genre-aware KG pipeline)
- [x] PLAN.md + TODO.md created
- [x] Gate integration spec
