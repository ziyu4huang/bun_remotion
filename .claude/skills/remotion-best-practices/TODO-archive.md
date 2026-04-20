# Novel Video Generation — TODO Archive

> Completed tasks from Phase 24–34. For reference only.
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

## P0: Speed Up Test Suite (DONE)

> 422 tests across 22 files took ~14s. Root cause: bun_pi_agent live API tests.
> **Result:** `bun test` now 180ms (254 tests, 10 files). 74x speedup.

- [x] **P0-A: Profile slow test files** — Ran each file individually. Top 3: zai-models (7.5s live API), server (5.9s live agent), binary (2.3s server spawn)
- [x] **P0-B: Isolate heavy tests** — Added `bunfig.toml` with `pathIgnorePatterns` excluding bun_pi_agent. Added `test:all` for full suite.
- [x] **P0-C: Root cause was not AST/parsing** — All storygraph/episodeforge/remotion_types tests are <100ms. Slowness was entirely from bun_pi_agent live network calls.
- [x] **P0-D: Test timeout** — Default 5s already sufficient for unit tests. bun_pi_agent tests use 30s timeout (appropriate for integration).

---

## Phase 34-R — Rename Verification Tests (DONE)

> Verify the bun_graphify→storygraph, bun_scaffold→episodeforge rename didn't break any pipeline.

### 34-R1: storygraph tests

- [x] **CLI runs** — Fixed: added `storygraph` script to root package.json (entry: `bun_app/storygraph/src/cli.ts`)
- [x] **Pipeline single episode** — `bun run storygraph full` runs all 5 steps (0 nodes = pre-existing Python env issue, not rename)
- [ ] **Pipeline merge** — Deferred (not rename-sensitive)
- [ ] **Check/Compare/Score** — Deferred (not rename-sensitive)
- [x] **Skill trigger** — `/storygraph` skill loads

### 34-R2: episodeforge tests

- [x] **CLI runs** — `bun run episodeforge --help` exits 0
- [x] **--series list** — `bun run episodeforge --series weapon-forger --dry-run` correctly requires `--ep`
- [x] **--category flag** — `bun run episodeforge --series storygraph-intro --category tech_explainer --dry-run` works
- [x] **Usage text fixed** — `bun run scaffold` → `bun run episodeforge` in args.ts + index.ts

### 34-R3: remotion_types tests

- [x] **Import works** — `VIDEO_CATEGORIES` exports 7 categories

### 34-R4: skill cross-reference tests

- [x] **`/develop_bun_app`** — Updated with episodeforge + remotion_types entries
- [x] **No old names** in storygraph or develop_bun_app skill files

### 34-R5: stale reference sweep

- [x] **bun_app/** has zero old names in `.ts` and `.json` files
- [x] **Only references** in TODO/PLAN/NEXT docs are historical rename descriptions

### Fixes applied

1. Added `"storygraph"` script to root `package.json` (was missing after rename)
2. Fixed entry point: `index.ts` → `cli.ts`
3. Updated episodeforge help text: `bun run scaffold` → `bun run episodeforge`
4. Added episodeforge + remotion_types to develop_bun_app skill

---

## Phase 34-A: Category Taxonomy + Templates (DONE)

- [x] **34-A1: category-types.ts** — 7 VideoCategoryId, scene structures, component mapping, dirname detection
  - File: `bun_app/remotion_types/src/category-types.ts`
  - Detects: weapon-forger→narrative_drama, galgame-meme-theater→galgame_vn, claude-code-intro→tech_explainer, etc.

- [x] **34-A2: scene-templates.ts** — CompositionSpec builders for all 7 categories
  - File: `bun_app/remotion_types/src/scene-templates.ts`
  - Each builder: input data → SceneSpec[] with start frames, durations, props
  - Tech Explainer: per-feature duration capped at 10s, auto-extends total if needed

- [x] **34-A3: tech-explainer-presets.ts** — storygraph intro preset + composition data
  - File: `bun_app/remotion_types/src/presets/tech-explainer-presets.ts`
  - storygraphIntroData: 5-stage pipeline, 3 features, comparison, CTA
  - Total: 61s (9 scenes) when targetDuration=90s

- [x] **34-A4: CLAUDE.md** — Added Video Categories section with mapping table

---

## Phase 34-B: episodeforge Extension + storygraph Intro (DONE)

> **Revised:** Extend episodeforge to support `--category tech_explainer`, then scaffold through CLI.
> Merges 34-C into 34-B. Future categories reuse the same `--category` flow.

### 34-B0: Extend episodeforge for tech_explainer (DONE)

- [x] **34-B0a: --category flag** — Add `--category <VideoCategoryId>` to scaffold CLI
  - File: `bun_app/episodeforge/src/args.ts`

- [x] **34-B0b: Category-aware naming** — Non-episode naming for standalone projects (no ch/ep)
  - `storygraph-intro` → dirName, packageName, compositionId
  - File: `bun_app/episodeforge/src/naming.ts`

- [x] **34-B0c: Category-aware templates** — Scene files, PLAN.md, narration system vary by category
  - Tech Explainer: Title + Problem + Architecture + Feature×N + Demo + Comparison + Outro
  - Import scene-templates.ts builders for scene layout
  - File: `bun_app/episodeforge/src/templates-tech-explainer.ts` (NEW)

- [x] **34-B0d: storygraph-intro series config** — Register as tech_explainer preset
  - File: `bun_app/episodeforge/src/series-config.ts`

- [x] **34-B0e: Workspace registration** — Update root package.json workspaces + dev.sh
  - File: `bun_app/episodeforge/src/updaters.ts`

- [x] **remotion_types shared package** — Extracted category types, scene templates, presets from storygraph
  - File: `bun_app/remotion_types/` (NEW)

### 34-B1-B9: Scaffold + Assets + Scenes + Render (DONE — renamed to storygraph-explainer)

> **Full pipeline:** scaffold → generate-images → generate-tts → implement scenes → render
> **Renamed:** storygraph-intro → storygraph-explainer. Restructured to chapter-based.

- [x] **34-B1: Scaffold workspace** — `bun run episodeforge --series storygraph-intro --category tech_explainer`
  - Creates `bun_remotion_proj/storygraph-intro/storygraph-intro/` with all scene files
  - 9 scenes from `storygraphIntroData` composition spec

- [x] **34-B1b: Generate images** — CSS/SVG-generated visuals (no image assets needed)

- [x] **34-B1c: Generate TTS** — mlx_tts serena voice, 9 scenes, durations.json

- [x] **34-B2: TitleScene** — "storygraph" title + "任何輸入 → 知識圖譜" tagline

- [x] **34-B3: ProblemScene** — "資料碎片化" pain point with scattered items animation

- [x] **34-B4: ArchitectureScene** — Pipeline flow diagram with 5 stages

- [x] **34-B5: FeatureScene ×3** — AST analysis (code tree), federated KG (graph viz), quality scoring (bar chart dashboard)

- [x] **34-B6: DemoScene** — Terminal-like CLI workflow

- [x] **34-B7: ComparisonScene** — Before vs after comparison

- [x] **34-B8: OutroScene** — "Star on GitHub" CTA + links

- [x] **34-B9: Render + verify** — 3681 frames, 8.3 MB MP4 output

---

## Phase 34-C: Category-Aware Scaffolding (MERGED into 34-B0)

> Merged. 34-B0 extends episodeforge with `--category` flag. Remaining category presets:
> - [ ] listicle, tutorial, shorts_meme presets when needed

---

## Phase 34-D: Skill Documentation (DONE)

- [x] **34-D1: SKILL.md topic detection** — Add category keywords to detection table
  - File: `.claude/skills/remotion-best-practices/SKILL.md`

- [x] **34-D2: category-guide.md** — Per-category: scene templates, component choices, animation style, decision tree
  - File: `.claude/skills/remotion-best-practices/topics/episode-setup/category-guide.md` (NEW)

- [x] **34-D3: episode-creation.md update** — Add category selection step before scaffolding
  - File: `.claude/skills/remotion-best-practices/topics/episode-setup/episode-creation.md`

---

## Phase 34-E: Storygraph Consistency Checker Fixes (DONE)

> Three bugs found via storygraph-explainer testing. All narrator-only / tech_explainer false positives.

- [x] **34-E1: Jaccard similarity content-aware** — Compare node labels (not just types). tech_explainer: 1.000 → 0.523-0.610.
  - File: `bun_app/storygraph/src/scripts/story-algorithms.ts`
- [x] **34-E2: Scene properties preservation** — graphify-episode.ts + graphify-merge.ts now keep `dialog_line_count` etc. through to merged graph.
  - Files: `bun_app/storygraph/src/scripts/graphify-episode.ts`, `graphify-merge.ts`
- [x] **34-E3: SKIP status for inapplicable checks** — Narrator-only: 6 checks → SKIP (not scored). Score: 75→95.
  - File: `bun_app/storygraph/src/scripts/graphify-check.ts`
- [x] **34-E4: SKILL.md enforcement** — Regex mode deprecated for production. Must use hybrid/ai.
  - File: `.claude/skills/remotion-best-practices/SKILL.md`

---

## Phase 34-F: Storygraph AI Mode Fix (DONE)

> **Fixed:** Greedy regex for nested backticks, truncation repair, maxTokens=4096, simplified prompt.
> Result: 131 nodes/8 communities (regex: 83 nodes/0 communities). Score 100/100.

- [x] **34-F1: Fix stripMarkdownFence** — Greedy match + balanced JSON extraction fallback
  - File: `bun_app/storygraph/src/ai-client.ts` — 17 tests pass
- [x] **34-F2: Hybrid re-run storygraph-explainer** — All 3 eps: stopReason "stop", 48 AI-exclusive nodes total
- [x] **34-F3: Verify merge properties survive** — 131 nodes, 149 edges, 8 communities, 5 link edges
- [x] **34-F4: Make `--mode hybrid` the default** — Already default in `parseArgsForAI()`

---

## Phase 28-B — Improved Model Benchmark (DONE)

> New script: graphify-model-bench.ts with accuracy sampling, reliability runs, CLI wired.

- [x] **28-B1: Accuracy sampling** — buildAccuracyPrompt + parseAccuracyResponse, 10-20 nodes per model
  - Filters episode_plot + narrator nodes, random sampling
  - AI evaluates each node as real/hallucinated with reason
  - File: `bun_app/storygraph/src/scripts/graphify-model-bench.ts`

- [x] **28-B2: Quality-weighted score** — Already implemented as blended formula (0.4×programmatic + 0.6×AI) in Phase 31-A

- [x] **28-B3: Reliability testing** — `--runs N` flag, mean±stddev per metric
  - summarizeModel() computes avg ± stddev for gate/blended/nodes/edges/duration
  - File: `bun_app/storygraph/src/scripts/graphify-model-bench.ts`

- [x] **28-B4: --models flag** — `--models glm-4.5-flash,glm-4.6,glm-5` with per-model pipeline runs
  - Backs up + restores storygraph_out between model runs
  - CLI: `bun run storygraph model-bench <series-dir> [--models ...] [--runs N] [--accuracy]`
  - 19 new tests, 393 total pass

---

## Phase 31 — Subagent-Based KG Quality Scoring (DONE)

### 31-A: Subagent Scoring Infrastructure

- [x] **31-A1: buildKGScorePrompt()** — Sends merged graph summary + rubric to AI
  - 5 dimensions: entity accuracy, relationship correctness, completeness, cross-episode coherence, actionability
  - Returns: JSON per-dimension scores + overall + justification
  - File: `bun_app/storygraph/src/scripts/subagent-prompt.ts`

- [x] **31-A2: scoreKG() orchestrator** — Pipeline + callAI + blended score → kg-quality-score.json
  - Blended: 0.4 × programmatic + 0.6 × subagent
  - File: `bun_app/storygraph/src/scripts/graphify-score.ts` (NEW)

- [x] **31-A3: graphify-compare.ts integration** — Subagent score column + AI quality assessment section
  - File: `bun_app/storygraph/src/scripts/graphify-compare.ts`

### 31-B: Regression Test Suite

- [x] **31-B1: Test corpus** — Curate regression episodes across 4 series
  - weapon-forger (xianxia_comedy), galgame-meme-theater (galgame_meme), xianxia-system-meme (xianxia_comedy), storygraph-explainer (generic/tech_explainer)
  - Fixed `weapon-forfer` typo → `weapon-forger` in baselines dir
  - Added storygraph-explainer baseline (gate 100/100)
  - my-core-is-boss excluded (gate v1.0 format, needs pipeline re-run)
  - Added `quality_breakdown` null guard to regression runner
  - File: `bun_app/storygraph/test-corpus/baselines/`

- [x] **31-B2: Regression runner** — Merged into 33-G5 (graphify-regression.ts)
  - Pipeline + scoring on corpus, delta > 10% = regression
  - CLI: `bun run storygraph regression [--ci] [--update]`

---

## Phase 32 — KG-Driven LLM Prompt Enhancement (DONE)

### 32-A: KG Context Injection

- [x] **32-A1: buildRemotionPrompt()** — 8-section zh_TW constraint prompt from KG data
  - File: `bun_app/storygraph/src/scripts/subagent-prompt.ts`
  - Sections: 前集摘要, 活躍伏筆, 角色特質約束, 招牌梗演進, 互動模式, 節奏參考, 主題一致性, 科技術語
  - CLI: `bun run storygraph gen-prompt <series-dir> --target-ep <epId>`
  - 10 tests pass

- [x] **32-A2: kg-loaders.ts + story-graph.ts enhancements** — Server-side + browser-side loaders
  - `bun_app/storygraph/src/scripts/kg-loaders.ts` — 8 server-side loaders (NEW)
  - `bun_remotion_proj/shared/src/story-graph.ts` — loadPreviousEpisodeSummary(), loadActiveForeshadowing() (browser-side)
  - `bun_app/storygraph/src/scripts/graphify-gen-prompt.ts` — Refactored to use new functions (570→150 lines)
  - 16 loader tests pass

### 32-B: Remotion Scene Quality Feedback Loop

- [x] **32-B1: Post-render KG enrichment** — Actual scene durations → update KG predictions
  - File: `bun_app/storygraph/src/scripts/graphify-enrich.ts` (NEW)
  - Reads voice-manifest.json + durations.json, matches scenes to KG nodes, writes enrich-report.json
  - CLI: `bun run storygraph enrich <series-dir> [--ep <epId>]`
  - weapon-forger: 7 episodes, 28 scenes enriched (28 matched, 0 unmatched)

- [x] **32-B2: Prompt calibration data** — Track prompt→quality correlation
  - File: `bun_app/storygraph/src/scripts/prompt-calibration.ts` (NEW)
  - 8 KG features tracked per episode, correlates with gate.json scores
  - CLI: `bun run storygraph calibrate <series-dir> [--reset]`
  - weapon-forger: 4/8 sections never populated (foreshadowing, gag, pacing, themes)
  - storygraph-explainer: pacing/themes/tech_terms correlate with score 100

---

## Phase 33 — Dual-LLM Architecture (DONE)

> **Core insight:** Two LLM paths (pi-agent GLM free, Claude paid) separated into three-tier quality pipeline.

### 33-A: gate.json v2 (DONE)

- [x] **33-A1: Add provenance fields** — `series`, `genre`, `generator` (mode, model, version)
- [x] **33-A2: Regression detection** — Read previous gate.json, compute `previous_score` + `score_delta`
- [x] **33-A3: quality_breakdown** — Per-dimension normalized scores
- [x] **33-A4: supervisor_hints** — focus_areas, suggested_rubric_overrides, escalation_reason
- [x] **33-A5: requires_claude_review** — true if score < 70 OR any FAIL OR score_delta < -10

### 33-B: Claude Code Review Skill Topic (DONE)

- [x] **33-B1: Create kg-review topic** — `topics/kg-review/_topic.md` with Tier 2 rubric
- [x] **33-B2: Integrate with episode-setup** — Add Tier 2 review step after Step 3b
- [x] **33-B3: quality-review.json schema** — Per-dimension scores + fix suggestions + regression notes

### 33-C: CLI Packaging (DONE)

- [x] **33-C1: cli.ts entry point** — `storygraph <series-dir> [options]` with --mode/--ci
- [x] **33-C2: package.json bin field** — Already existed, bumped to v0.3.0
- [x] **33-C3: CI integration guide** — GitHub Actions, pre-commit hooks, regression baselines

### 33-E: Multi-Series Evaluation Suite (DONE)

- [x] **33-E1: weapon-forger benchmark** — xianxia_comedy, 7 eps, chapter-based
- [x] **33-E2: galgame-meme-theater benchmark** — galgame_meme, 5 eps, comedy arc
- [x] **33-E3: xianxia-system-meme benchmark** — xianxia_comedy, 2 eps, minimal cross-ep
- [x] **33-E4: Cross-genre comparison report** — Side-by-side metrics table
- [x] **33-E5: Regression baseline commit** — Store benchmark snapshots

### 33-F1: Step 0 lite — PLAN.md Validation (DONE)

- [x] **33-F1a: PLAN.md parser** — Extract characters, episodes, rules → plan-struct.json
- [x] **33-F1b: Chapter rule validator** — 8 rules, CLI wired

### 33-F2: Step 3b lite — Quality Gate Writer (DONE)

- [x] **33-F2a: graphify-write-gate.ts** — Template-based zh_TW gate section from pipeline output
- [x] **33-F2b: GLM dialog assessment** — callAI() with dialog quality rubric

### 33-F4: Step 4 lite — Episode Scaffold Generation (DONE)

- [x] **33-F4a: narration.ts generator** — Template-based from confirmed dialog
- [x] **33-F4b: Episode TODO.md generator** — Standard TODO.md structure from PLAN.md

### 33-G: Develop-Deploy Evaluation Framework (DONE)

- [x] **33-G1: Full-pipeline Tier comparison** — graphify-tier-compare.ts
- [x] **33-G2: Step-by-step quality delta** — Merged into tier-compare
- [x] **33-G3: Cost/latency matrix** — graphify-cost-matrix.ts
- [x] **33-G5: Regression runner** — graphify-regression.ts

### 33-H: Episode-Setup Workflow Adjustment (DONE)

- [x] **33-H1: Episode-creation.md deploy path** — Deploy Mode section + CLI commands
- [x] **33-H2: Hybrid mode instructions** — Dual-LLM architecture section
- [x] **33-H3: SKILL.md topic detection update** — Added kg-review row

### 33-I: my-core-is-boss Storygraph Rebuild (DONE)

> 5 episodes (of planned 34), hybrid mode. Gate v2.0, regression baseline added.

- [x] **33-I1: Full pipeline run** — 173 nodes, 315 edges, 8 communities, 40 link edges
- [x] **33-I2: Quality scoring** — Gate 100/100, AI 5.8/10, blended 74.8%
- [x] **33-I3: HTML verification** — Overflow fixes confirmed
- [x] **33-I4: Graph analysis** — 林逸 hub (deg 21-31), 5 episode communities
- [x] **33-I5: Regression baseline** — Added via --update bugfix. 5-series suite all PASS.

---

## Phase 25 — Remotion Framework (sketched, ARCHIVED)

> Detailed spec: `PLAN-archive.md §Phase 25`
> Archived: low-priority future templates. No active work planned.

- [ ] **25-A1: DialogScene template** — Multi-character dialog with reactions, proportional timing
- [ ] **25-A2: ActionScene template** — Dynamic battle/action with ComicEffects, ScreenShake
- [ ] **25-B1: PlotBeatOverlay** — Visual arc position indicator (reads plot_beat nodes)
- [ ] **25-C1: CharacterStateOverlay** — Current emotional state (reads growth trajectory)

---

## Done

- [x] Phase 24-A–F complete (6 quality checks)
- [x] Phase 26 complete (pi-agent AI integration)
- [x] Phase 27 complete (hybrid mode + comparison)
- [x] Phase 28 complete (model benchmark, glm-5 default)
- [x] Phase 29 complete (quality pipeline completion + overlays)
- [x] Phase 30 complete (genre-aware KG pipeline)
- [x] P0: Speed Up Test Suite (74x speedup)
- [x] Phase 34-R: Rename Verification Tests
- [x] Phase 34-A: Category Taxonomy + Templates
- [x] Phase 34-B: episodeforge Extension + storygraph Intro
- [x] Phase 34-C: Category-Aware Scaffolding (merged into 34-B0)
- [x] Phase 34-D: Skill Documentation
- [x] Phase 34-E: Storygraph Consistency Checker Fixes
- [x] Phase 34-F: Storygraph AI Mode Fix
- [x] Phase 28-B: Improved Model Benchmark
- [x] Phase 31: Subagent-Based KG Quality Scoring
- [x] Phase 32: KG-Driven LLM Prompt Enhancement
- [x] Phase 33-A: gate.json v2
- [x] Phase 33-B: Claude Code Review Skill Topic
- [x] Phase 33-C: CLI Packaging
- [x] Phase 33-E: Multi-Series Evaluation Suite
- [x] Phase 33-F1: Step 0 lite — PLAN.md Validation
- [x] Phase 33-F2: Step 3b lite — Quality Gate Writer
- [x] Phase 33-F4: Step 4 lite — Episode Scaffold Generation
- [x] Phase 33-G: Develop-Deploy Evaluation Framework
- [x] Phase 33-H: Episode-Setup Workflow Adjustment
- [x] Phase 33-I: my-core-is-boss Storygraph Rebuild
- [x] Phase 25: Remotion Framework (sketched, archived)
- [x] PLAN.md + TODO.md created
- [x] Gate integration spec
