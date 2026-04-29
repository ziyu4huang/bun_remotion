# storygraph — Code TODO

> Cross-linked with skill docs:
> - Skill PLAN: `.claude/skills/storygraph/PLAN.md`
> - Skill TODO: `.claude/skills/storygraph/TODO.md`
> - Skill usage: `.claude/skills/storygraph/SKILL.md`

## Code-level Tasks

These are implementation tasks in `bun_app/storygraph/src/`. For architecture and pipeline-level tasks, see `.claude/skills/storygraph/TODO.md`.

### Phase 26 — Dual-Mode Pipeline with pi-agent AI Integration

> See `.claude/skills/storygraph/PLAN.md` Phase 26 for architecture.

#### P0 — Core infrastructure ✅

- [x] **26-A1: src/ai-client.ts** (~120 lines)
  - `callAI(prompt, overrides?)` → `string | null`
  - `parseArgsForAI(args)` → `{ mode, provider, model }`
  - Default: zai/glm-4.7-flash
  - JSON mode: strip markdown fences, validate with JSON.parse, retry once
  - Error handling: rate limit → 2s wait → retry; auth → immediate null

- [x] **26-A2: package.json** — Added `@mariozechner/pi-ai@0.67.68`

#### P1 — AI touchpoint automation

- [x] **26-B1: subagent-prompt.ts — buildEpisodeExtractionPrompt()** (~120 lines added)
  - Input: EpisodeExtractionInput (episode_id, narration_text, charNames, techPatterns)
  - 8 node types, 8 edge relation types (regex-compatible + triggers, uses, relates_to)
  - Narration truncated to ~3000 chars for context budget

- [x] **26-B2: graphify-episode.ts — --mode ai branch** (~60 lines added)
  - Title extraction hoisted before AI branch (shared by both paths)
  - AI branch: buildEpisodeExtractionPrompt() → callAI() → validate → fill defaults
  - Validates: node IDs start with EP_ID prefix, edge source/target exist
  - Falls back to regex Steps 2-7 on any failure
  - Regex mode verified working against weapon-forger ch1-ep1

- [x] **26-B3: ai-crosslink-generator.ts — --mode ai branch**
  - Parse `--mode ai` from args
  - When ai mode: after building prompt (existing code), call `callAI(prompt)` instead of writing crosslink-input.json
  - Parse response using existing `validateCrossLinks()` logic
  - Patch merged-graph.json as before
  - If API call fails: fall through to existing file-based pattern (backward compat)

- [x] **26-B4: graphify-check.ts — --mode ai branch**
  - Parse `--mode ai` from args
  - When ai mode: after writing check-enrichment-input.json, call `callAI(prompt)`
  - Write check-enrichment-output.md from response
  - If API call fails: skip enrichment (report still generated, just without LLM analysis)

#### P2 — Pipeline integration

- [x] **26-C1: graphify-pipeline.ts — --mode ai passthrough**
  - Parse `--mode`, `--provider`, `--model` from top-level args
  - Pass through to all `Bun.spawnSync` calls for episode, crosslink, check
  - Log mode at pipeline start: `Running in AI mode (zai/glm-4.7-flash)`

### Phase 27 — Hybrid Mode + Comparison Framework ✅

- [x] **27-A1: ai-client.ts — hybrid mode type**
  - `parseArgsForAI()` returns `"hybrid"` as valid mode
  - Default changed from `"regex"` to `"hybrid"`

- [x] **27-A2: graphify-episode.ts — hybrid extraction**
  - Regex runs first (steps 2-7), always
  - AI supplement (step 7.5): calls callAI(), merges exclusive nodes/edges
  - Dedup: regex wins on same node ID; AI edges only added if both endpoints exist
  - Logs exclusive node counts by type

- [x] **27-A3: graphify-pipeline.ts — hybrid passthrough**
  - `--mode hybrid` passed to all subprocesses
  - Console log shows HYBRID mode with provider/model

- [x] **27-A4: graphify-compare.ts — mode comparison tool**
  - Runs pipeline 3 times (regex, ai, hybrid)
  - Compares: node counts by type, edge counts by relation, quality metrics
  - Scores each mode and recommends best default
  - Restores best mode's output to storygraph_out/

- [x] **27-A5: Generation manifest**
  - graph.json: `{ manifest: { generator, version, mode, ai_model, timestamp } }`
  - merged-graph.json: `{ manifest: { generator, version, timestamp, episode_count, ... } }`
  - consistency-report.md: Generator, mode, AI model, source manifest
  - graph.html: `<meta name="generator">` + visible footer bar

### P0 — Fixes ✅

- [x] **All scripts: enforce absolute path for dir args**
  - All 9 scripts now validate: graphify-episode.ts, graphify-merge.ts, graphify-pipeline.ts, gen-story-html.ts, graphify-check.ts, ai-crosslink-generator.ts, graphify-gen-prompt.ts, extract-plan.ts, extract-corpus.ts
  - Pattern: `if (!dir.startsWith("/")) { console.error(...); process.exit(1); }`

- [x] **Hybrid mode fuzzy dedup** — Normalize labels (lowercase, strip underscores/spaces/hyphens/parens) and check containment before adding AI nodes. Prevents ~10% node inflation from regex/AI label mismatches.
  - File: `src/scripts/dedup.ts` (new), `src/scripts/graphify-episode.ts` step 7.5
  - Tests: `src/__tests__/dedup.test.ts` (9 tests, 15 expect())

### P1 — Code quality (done)

- [x] **gen-story-html.ts: escape HTML in node labels**
- [x] **graphify-check.ts: reduce false positive WARN**
- [x] **ai-crosslink-generator.ts: file-based subagent orchestration**
- [x] **gen-story-html.ts: AI cross-link visualization**
- [x] **graphify-pipeline.ts: step 3.5 AI cross-link discovery**

### P1 — Code quality (done)

- [x] **graphify-pipeline.ts: per-episode HTML generation**
  - Step 1.5: run gen-story-html.ts on each episode dir after extraction
  - File: `src/scripts/graphify-pipeline.ts`

### P2 — Architecture

- [x] **Unified node ID convention**
  - 8 canonical ID builders in `dedup.ts`: `plotNodeId`, `sceneNodeId`, `charNodeId`, `techTermNodeId`, `plotEventNodeId`, `artifactNodeId`, `traitNodeId`, `gagNodeId`
  - `graphify-episode.ts`: all regex-path ID construction uses shared functions
  - `graphify-merge.ts`: plot node references use `plotNodeId()`
  - Tests: 8 new tests in dedup.test.ts (372 total)

### Phase 3 — bun_pi_agent Integration (done)

> Completed as Phases 44-46: 9 storygraph tools (sg_pipeline, sg_check, sg_score, sg_status, sg_regression, sg_baseline_update, sg_baseline_list, sg_suggest, sg_health) + benchmark skill + CI integration.
> See bun_app/bun_pi_agent/TODO.md for full history.

- [x] **3-A1: storygraph-tools.ts** — 9 agent tools wrapping pipeline-api.ts (superseded plan of 4 tools)
- [x] **3-A2: storygraph-benchmark skill** — sg-benchmark-runner agent + autonomous workflow

### Phase 30 — Genre-Aware KG Pipeline (DONE at skill level)

> See `.claude/skills/remotion-best-practices/PLAN.md` Phase 30 for architecture.
> Many of these were implemented during Phases 33-A/33-E/34-E as part of gate.json v2 and genre-aware checks.
> Status synced from skill-level docs.

- [x] **30-A1: Genre enum + scoring profiles in SeriesConfig** — `series-config.ts` (genre field added per series)
- [x] **30-A2: Genre-weighted scoring** — `graphify-check.ts` (quality_breakdown with genre-inapplicable null)
- [x] **30-B1: Comedy arc analysis** — `graphify-check.ts` (comedy_arc check for galgame_meme)
- [x] **30-B2: Gag diversity score** — `story-algorithms.ts` (computeGagEvolutionScore)
- [x] **30-B3: Genre subagent prompt** — `subagent-prompt.ts` (genre-aware prompts)
- [x] **30-C1: Effect pattern per genre** — `series-config.ts` (genre-specific patterns)
- [x] **30-C2: Title pattern per genre** — `series-config.ts` (genre in config)

### Phase 31 — Subagent-Based KG Quality Scoring ✅

> Uses LLM subagent to evaluate KG quality instead of programmatic-only scoring.

- [x] **31-A1: buildKGScorePrompt()** — `subagent-prompt.ts`
- [x] **31-A2: scoreKG() orchestrator** — `graphify-score.ts`
- [x] **31-A3: Subagent scores in comparison report** — `graphify-compare.ts`
- [x] **31-B1: Test corpus** — `test-corpus/baselines/` (4 series: weapon-forger, storygraph-explainer, galgame-meme-theater, xianxia-system-meme)
- [x] **31-B2: Regression runner** — `graphify-regression.ts` (merged into 33-G5)

### Phase 32 — KG→Remotion Feedback Loop ✅

> The "so what" loop — KG context injection into episode writing prompts.

- [x] **32-A1: buildRemotionPrompt()** — 8-section zh_TW constraint prompt from KG data
  - File: `subagent-prompt.ts`
  - Sections: 前集摘要, 活躍伏筆, 角色特質約束, 招牌梗演進, 互動模式, 節奏參考, 主題一致性, 科技術語

- [x] **32-A2: kg-loaders.ts + story-graph.ts** — Server-side + browser-side loaders
  - `bun_app/storygraph/src/scripts/kg-loaders.ts` — 8 server-side loaders
  - `bun_remotion_proj/shared/src/story-graph.ts` — browser-side loaders

- [x] **32-B1: Post-render KG enrichment** — graphify-enrich.ts reads actual scene metrics
  - File: `bun_app/storygraph/src/scripts/graphify-enrich.ts`

- [x] **32-B2: Prompt calibration data** — prompt-calibration.ts tracks feature→score correlation
  - File: `bun_app/storygraph/src/scripts/prompt-calibration.ts`

## Scripts Reference

| Script | Lines | Status |
|--------|-------|--------|
| `src/cli.ts` | ~250 | Stable — Full CLI with score, write-gate, parse-plan, validate-plan, --ci |
| `src/ai-client.ts` | ~120 | Stable — pi-ai SDK wrapper, truncation repair, maxTokens |
| `src/scripts/series-config.ts` | ~130 | Stable — SeriesConfig + detectSeries() + genre support |
| `src/scripts/graphify-episode.ts` | ~550 | Stable — Hybrid extraction, config-driven |
| `src/scripts/graphify-merge.ts` | ~470 | Stable — Config-driven, plot-lines.md gag chains |
| `src/scripts/graphify-check.ts` | ~450 | Stable — gate.json v2, genre-aware SKIP, quality_breakdown |
| `src/scripts/graphify-pipeline.ts` | ~150 | Stable — Parallel extraction (spawnAsync + Promise.all) |
| `src/scripts/gen-story-html.ts` | ~340 | Stable — Overflow fix, expand-neighbors |
| `src/scripts/story-algorithms.ts` | ~170 | Stable — PageRank, Jaccard, arc/evolution scores |
| `src/scripts/subagent-prompt.ts` | ~500+ | Stable — 8 prompt builders (crosslink, extraction, scoring, dialog, etc.) |
| `src/scripts/ai-crosslink-generator.ts` | ~240 | Stable — --mode ai direct call |
| `src/scripts/kg-loaders.ts` | ~420 | **New (Phase 32)** — 8 server-side KG data loaders |
| `src/scripts/plan-parser.ts` | ~630 | **New (Phase 33)** — PLAN.md parser with hybrid regex+AI |
| `src/scripts/chapter-validator.ts` | ~390 | **New (Phase 33)** — 8 structural validation rules |
| `src/scripts/graphify-write-gate.ts` | ~410 | **New (Phase 33)** — Template-based zh_TW gate report |
| `src/scripts/graphify-enrich.ts` | ~380 | **New (Phase 32)** — Post-render KG enrichment |
| `src/scripts/prompt-calibration.ts` | ~420 | **New (Phase 32)** — Feature→score correlation tracking |
| `src/scripts/graphify-regression.ts` | ~370 | **New (Phase 33)** — Baseline comparison + --ci mode |
| `src/scripts/graphify-tier-compare.ts` | ~260 | **New (Phase 33)** — Cross-series comparison tables |
| `src/scripts/graphify-cost-matrix.ts` | ~290 | **New (Phase 33)** — Pipeline step timing |
| `src/scripts/graphify-model-bench.ts` | ~490 | **New (Phase 28)** — Multi-model benchmarking |
| `src/scripts/gen-narration.ts` | ~295 | **New (Phase 33)** — Template-based narration.ts generator |
| `src/scripts/gen-episode-todo.ts` | ~260 | **New (Phase 33)** — Episode TODO.md generator |
| `src/scripts/gate-scoring.ts` | ~60 | **New (v0.32)** — Group-based gate scoring (episode-normalized) |
| `src/scripts/dedup.ts` | ~50 | **Updated (v0.32)** — 8 canonical node ID builders + fuzzy dedup |
| `src/scripts/graphify-check.ts` | ~1900 | **Updated (v0.33)** — Content-aware scoring, Episode Continuity check, enrichment-based variant suppression |

### Phase 0-B — Content-Aware Enrichment Loop ✅

- [x] **0-B1: buildEnrichmentFeedbackPrompt()** — `subagent-prompt.ts`
  - Reads gate.json + consistency-report.md from previous run
  - Generates zh_TW feedback: episode-specific WARNs + series-wide check types
  - Filters report lines for current episode ID

- [x] **0-B2: Wire into graphify-episode.ts hybrid step** — Step 7.5
  - `--feedback` flag enables feedback prepending to AI prompt
  - Only active in hybrid mode when previous gate.json exists

- [x] **0-B3: Add --feedback to graphify-pipeline.ts** — Passthrough to episode subprocesses

- [x] **0-B4: A/B comparison** — my-core-is-boss 66→59 WARN (-10.6%)
  - Interaction Density: 18→11 (-7, biggest win)
  - Trait Coverage: 25→24 (-1)
  - Duplicate Content: 0→2 (+2, minor tradeoff)

### Bugfix — Broken symlink crash

- [x] **series-config.ts discoverEpisodes()** — Wrapped statSync in try/catch to handle dangling symlinks. Previously crashed on xianxia-system-meme.

### Quality Audit (5 series, v0.33.0)

All series score 100/100. Top systemic WARNs:
- Trait Coverage: 29 WARNs across 3/5 series (regex limitation)
- Community Cohesion: 14 WARNs across 3/5 series (structural)
- Isolated Nodes: 15 WARNs across 2/5 series (structural)

Regression baselines recorded: test-corpus/baselines/*/gate-20260429.json

---

## Development History

### 2026-04-29 — Reviewer feedback fixes: tooling gap suppression, gag fatigue, dimension evidence (v0.40.0)

**Goal:** Address three remaining reviewer feedback items.

**Tooling gap suppression from gate.json:**
- `_tooling_gap` Trait Coverage WARNs now excluded from `checks` array in gate.json
- Moved to separate `tooling_notes` array in gate.json (still visible but clearly separated)
- Report has new "Tooling Notes" section with 🔧 icon
- Summary counts now exclude tooling gaps from WARN count
- weapon-forger: 11 tooling notes removed from checks list

**Gag fatigue detection:**
- New `checkGagFatigue()` function detects cross-episode pattern repetition
- Groups gag manifestations by type, computes pairwise similarity across ALL episodes
- WARN when >60% of pairs are near-identical (similarity > 0.7) across 3+ episodes
- Covers audience fatigue risk that gag_evolves chain stagnation misses
- Wired into `allChecks` after `checkGagEvolution()`, included in `gag_evolution` dimension

**Dimension check evidence:**
- `character_growth`: per-character check entries for ALL characters (not just flat-arc WARNs)
  - PASS entries show classification, score, top trait changes
  - WARN entries unchanged (flat arc across 3+ episodes)
- `thematic_coherence`: per-theme check entries showing shared vs isolated themes
  - PASS for themes shared across 2+ episodes, WARN for single-episode themes
- Both dimensions now have traceable evidence in the checks list

**Tests:** 483 pass (11 new: gate-scoring tooling gap 2, reviewer-feedback 9)

### 2026-04-29 — Phase R2+B: Dual-agent review + dimension-aware scoring (v0.37.0)

**Goal:** Switch dual review from anthropic to GLM models, fix scoring formula, add genre-aware checks.

**Dual review changes:**
- `subagent-prompt.ts`: Renamed `claude_score` → `reviewer_score`, `claude_dimensions` → `reviewer_dimensions`. Provider-agnostic.
- `bun_pi_agent/src/tools/storygraph-tools.ts`: `sg_dual_review` runs **two GLM reviewers in parallel** (glm-5 + glm-5.1 via zai). Results merged: intersected verdicts, averaged scores, union of findings.
- Removed all anthropic/claude dependencies from dual review.

**Dimension-aware scoring (gate-scoring.ts v2):**
- Layer 1: Group-based check scoring (FAIL → -25, was -20). Tooling-gap WARNs excluded from group totals.
- Layer 2: Quality dimension ceilings:
  - Any dim < 20% → cap at 50
  - Any dim < 30% → cap at 60
  - 2+ dims < 50% → cap at 75
  - Any dim < 50% → cap at 85
- Hard cap: any FAIL check → max score 80.
- `graphify-check.ts`: Moved `computeGateScore()` after `qualityBreakdown` is computed (was informational only).
- `ceiling_applied` field in gate.json explains which ceiling triggered.

**Genre-aware check improvements (v0.38.0):**
- **Plot Arc → Comedy Arc for xianxia_comedy**: gag-driven arc (setup/escalation/punchline/callback) instead of Freytag pyramid. Eliminates false FAIL for comedy series.
- **Thematic Coherence boost for comedy**: recurring gag types count as thematic throughline. Each gag type adds 0.15 coherence (max 0.4). thematic_coherence: 0% → 40% for weapon-forger.
- **Trait Coverage tooling gap flag**: regex-missed traits tagged `_tooling_gap: true`, excluded from gate scoring impact. Writers see the WARN but it doesn't penalize the score.
- **Gag Diversity for xianxia_comedy**: previously only ran for galgame_meme. Now runs for both comedy genres.

**Validation across iterations (weapon-forger, glm-5.1 ground truth):**

| Iteration | Pipeline Score | Reviewer Scores | Score Gap | Verdict |
|-----------|---------------|-----------------|-----------|---------|
| v0.36 (old scoring) | 95/100 | 62-72 | 23-33 | DISAGREE |
| v0.37 (dim ceilings) | 50/100 | 55-58 | 7-8 | PARTIAL_AGREE |
| v0.38 (genre-aware) | 85/100 | 72-78 | 7-13 | PARTIAL_AGREE |

The v0.37 score was too punitive (ceiling at 50 for thematic_coherence 11%). v0.38 with comedy-aware coherence (40%) produces a more calibrated 85, close to reviewers' 72-78.

**Tests:** 472 pass (9 gate-scoring tests for dimension ceilings + coverage check).

### 2026-04-29 — Phase R2+C: Calibrated scoring + structural separation (v0.39.0)

**Goal:** Address remaining dual-review feedback — 3 dims below 60% masked by 85 score, structural noise inflates WARN count.

**Dimension ceiling calibration:**
- Added `< 60%` tier: single dim < 60% → cap at 80, 2+ dims < 60% → cap at 70.
- weapon-forger: consistency=50%, character_growth=40%, thematic_coherence=40% → 3 dims below 60% → score capped at 70 (was 85).

**Structural check separation:**
- Community Cohesion, Isolated Nodes, Cross-Community Coherence, Surprising Connection tagged `_structural: true`.
- Excluded from gate scoring (don't penalize or inflate score).
- Report: new "Structural Notes" section with 🏗️ icon, separate from quality WARNs.
- WARN count: 34 → 25 actionable (9 structural moved to notes section).

**Episode coverage check:**
- New `checkEpisodeCoverage()` compares processed vs expected episodes.
- WARN when < 80% coverage.

**Tooling-gap WARN handling:**
- Trait Coverage regex-miss WARNs tagged `_tooling_gap: true`.
- Excluded from group scoring totals.

**Validation across all iterations (weapon-forger, glm-5.1 ground truth):**

| Iteration | Score | Reviewer | Gap | Key Change |
|-----------|-------|----------|-----|-----------|
| v0.36 (original) | 95 | 62-72 | 23-33 | Baseline — broken formula |
| v0.37 (dim ceilings) | 50 | 55-58 | 7-8 | Too punitive |
| v0.38 (genre-aware) | 85 | 72-78 | 7-13 | Ceiling not aggressive enough |
| **v0.39 (calibrated)** | **70** | **65** | **5** | Converged |

Both GLM reviewers converge at 65, pipeline at 70. 5-point gap is within acceptable tolerance for subjective quality assessment.
- `.agent/agents/sg-dual-reviewer.md`: New agent definition for independent quality reviewer.
- Tests: `dual-review.test.ts` (17 tests), bun_pi_agent tool count tests updated.
- Version bump: 0.35.0 → 0.36.0

### 2026-04-29 — Phase R1: Regression test suite (v0.35.0)

**Goal:** Fill biggest test gap — `graphify-regression.ts` had 10 exports, 0 tests.

**Changes:**
- `src/__tests__/regression.test.ts` — 31 tests covering computeDelta (7), compareGate (5), compareQuality (4), generateReport (4), discoverBaselineSeries (3), loadLatestBaseline (5), saveBaseline (3)
- `src/__tests__/baseline-trend.test.ts` — 12 tests covering computeTrend: empty/missing dirs, single snapshot, improving/stable/declining trends, blended_score loading, node_count reading, corrupt JSON skip, non-matching file skip, date sorting
- Version bump: 0.34.0 → 0.35.0
- Total: 444 tests across 26 files

### 2026-04-29 — Enrichment feedback loop + quality audit (v0.34.0)

**Goal:** P0-0B content-aware enrichment loop + P0-0A quality audit.

**Changes:**
- `subagent-prompt.ts`: Added `buildEnrichmentFeedbackPrompt()` — reads gate.json + consistency-report.md, generates zh_TW feedback
- `graphify-episode.ts`: `--feedback` flag prepends feedback context to hybrid AI prompt in step 7.5
- `graphify-pipeline.ts`: `--feedback` flag passthrough to episode subprocesses
- `series-config.ts`: Fixed `discoverEpisodes()` crash on broken symlinks (try/catch around statSync)
- Regression baselines: gate-20260429.json for all 5 series
- New tests: `feedback-prompt.test.ts` (5 tests)
- Version bump: 0.33.0 → 0.34.0

**A/B Results (my-core-is-boss):** 66→59 WARN (-10.6%), Interaction Density 18→11, Trait Coverage 25→24

**Series Config Improvements:**
- Broadened my-core-is-boss trait patterns: linyi (+game terms), zhaoxiaoqi (+misinterpretation verbs), xiaoelder (+elder references), chenmo (+code terms)
- Trait Coverage: 25→20 WARN (-20%) on my-core-is-boss
- weapon-forger patterns kept narrow: too-broad patterns (老夫, 不過) caused 11→44 WARN regression
- AI accuracy spot-check: 30 nodes across 3 series, all valid, no hallucinations

### 2026-04-29 — Content-aware scoring (v0.33.0)

**Goal:** Wire `kg-loaders.ts` data into `graphify-check.ts` for content-aware scoring.

**Changes:**
- `graphify-check.ts`: Added imports from `kg-loaders.ts` for `loadCharacterConstraints`, `loadGagEvolution`, `loadInteractionPatterns`, `loadThematicCoherence`, `loadPreviousEpisodeSummary`
- Content-aware data loading at script start: char constraints, gag chains, interaction patterns, theme clusters, per-episode previous summaries
- Character Consistency: enrichment-based core traits (stable_traits override statistical 75% threshold), expected variant suppression (WARN skipped for documented variant traits)
- Episode Continuity (new Check 14): character carryover analysis, WARN when <30% carryover from previous episode
- Gag Evolution: depth info from kg-loaders (unique manifestations tracked)
- Interaction Density: first-interaction pair detection in PASS details
- Thematic Coherence: theme cluster enrichment data in WARN/PASS details
- Episode Continuity table in consistency-report.md
- 13 new tests in `content-aware-check.test.ts`
- Version bump: 0.32.0 → 0.33.0

**Results (weapon-forger):** 29 PASS, 50 WARN, 0 FAIL — Score: 100/100. No regression.
**Results (my-core-is-boss):** 33 PASS, 66 WARN, 0 FAIL — Score: 100/100. No regression.

### 2026-04-28 — gag_evolves ID normalization + trait coverage baseline

**gag_evolves ID normalization:**
- Added `gagNodeId()` to `dedup.ts` — shared canonical gag node ID builder
- Updated graphify-episode.ts: all 3 regex gag paths use `gagNodeId()`
- Updated graphify-merge.ts: gag_evolves edges use `gagNodeId()`
- Added AI gag chain discovery in merge step 4d: scans graph nodes for gag_manifestation instances not in regex chains, builds additional gag_evolves edges
- Hybrid step 7.5: normalizes AI gag node IDs to canonical format via `gagNodeId()`
- Tests: 4 new tests in dedup.test.ts

**Trait coverage baseline:**
- `getBaselineTraits()` in graphify-check.ts extracts expected trait labels from `SeriesConfig.traitPatterns`
- Trait Coverage WARN now distinguishes "regex missed (baseline has N: ...)" from "no baseline defined"
- Helps writers distinguish tooling limitations from actual character consistency issues

### 2026-04-28 — P2 architecture improvements

**Pipeline renumbering:** graphify-pipeline.ts steps 0/1/1.5/2/2.5/3/3.5 → clean 1-7

**Confidence scoring:**
- Trait edges: 0.6 base + 0.2/match (was 1.0 flat)
- Tech term edges: 0.5 + 0.1/occurrence
- Interaction edges: 0.4 + 0.2/shared scene
- AI edges: 0.8 (unchanged)

**PageRank normalization:**
- `normalizePageRankByType()` min-max scales per node type
- Crosslink generator uses normalized scores for character_theme_affinity

**Input size management:**
- crosslink-input.json truncates nodes (>200) and edges (>400) for large series

### 2026-04-28 — Algorithm-only cross-links (all 4 types)

**Problem:** Only `story_anti_pattern` was generated algorithmically (Jaccard > 0.5). The other 3 cross-link types (`character_theme_affinity`, `gag_character_synergy`, `narrative_cluster`) required AI, making the cross-link system dependent on API calls.

**Fix:** Added `generateAlgorithmCrossLinks()` to `story-algorithms.ts` — a pure-function that generates all 4 types from graph metrics:
- `story_anti_pattern`: Jaccard > 0.5 between episode pairs (existing)
- `character_theme_affinity`: high-PageRank characters (70th percentile) appearing across episodes
- `gag_character_synergy`: gag types co-occurring with specific characters in 2+ episodes
- `narrative_cluster`: cross-episode scenes sharing >50% character overlap

Wired into `ai-crosslink-generator.ts` step 3b, replacing inline Jaccard-only code.

**New/modified files:**
- `src/scripts/story-algorithms.ts` — `generateAlgorithmCrossLinks()` (~150 lines)
- `src/scripts/ai-crosslink-generator.ts` — step 3b refactored to call new function
- `src/__tests__/algorithm-crosslinks.test.ts` — 10 tests (21 expect())

### 2026-04-28 — Hybrid mode fuzzy dedup

**Problem:** Regex and AI pipelines produce different labels for the same concept (e.g., "TitleScene" vs "title"), causing ~10% node count inflation in hybrid mode.

**Fix:** Added `normalizeForDedup()` — normalizes labels by lowercasing, stripping underscores/spaces/hyphens/parens. Hybrid step 7.5 now builds a fuzzy index of regex node labels by type, and skips AI nodes whose normalized label is contained in (or contains) an existing regex label.

**New files:**
- `src/scripts/dedup.ts` — exported `normalizeForDedup()`
- `src/__tests__/dedup.test.ts` — 9 tests (15 expect())

### 2026-04-27 — Incremental Pipeline

**Changes:**
- New `src/scripts/incremental.ts`: exported `isUpToDate(episodeDir)` — mtime check narration.ts vs graph.json
- `graphify-pipeline.ts`: `--incremental` flag, skips extraction + per-episode HTML for up-to-date episodes
- `src/__tests__/pipeline-incremental.test.ts`: 5 tests covering all isUpToDate edge cases
- Merge/check/crosslink always run (downstream of all episodes)

### Phase 26-A/B1/B2 — AI Pipeline Foundation (2026-04-18)

| Task | Status | Lines | Notes |
|------|--------|-------|-------|
| P0: Absolute path validation (9 scripts) | ✅ | ~3 each | extract-plan.ts, extract-corpus.ts added beyond original scope |
| 26-A1: ai-client.ts | ✅ | ~120 | pi-ai SDK wrapper, callAI() + parseArgsForAI() |
| 26-A2: @mariozechner/pi-ai dependency | ✅ | — | v0.67.68 installed |
| 26-B1: buildEpisodeExtractionPrompt() | ✅ | ~120 | 8 node types, 8 edge relations, ~3000 char context |
| 26-B2: graphify-episode.ts --mode ai | ✅ | ~60 | AI branch with regex fallback, verified against weapon-forger ch1-ep1 |

**Decisions:**
- Default model: `glm-4.7-flash` (not planned `glm-4.5-flash` — 4.7-flash is current and available)
- Node types reduced from 12 to 8: removed `running_gag`, `relationship`, `theme` (overlap with existing types)
- Title extraction hoisted before AI branch (shared by regex + AI paths)
- Narration truncated to ~3000 chars to stay within context budget

---

## Done

- [x] **Artifact extraction** -- Parse dialog for creation patterns via artifactPatterns in SeriesConfig. Step 7.7 in graphify-episode.ts. weapon-forger: 4 artifacts, my-core-is-boss: 3 artifact types.
- [x] **Plot event extraction** -- Narrator TitleScene/OutroScene sentences as plot_event nodes. Step 7.6. weapon-forger ch1-ep1: 10 plot events.
- [x] **Hybrid mode fuzzy dedup in graphify-episode.ts** -- normalizeForDedup + regex label index in step 7.5
- [x] **Incremental pipeline** — `--incremental` flag in graphify-pipeline.ts, mtime-based skip, 5 tests
- [x] **Phase 26-A complete** — ai-client.ts + @mariozechner/pi-ai dependency
- [x] **Phase 26-B1 complete** — buildEpisodeExtractionPrompt() in subagent-prompt.ts
- [x] **Phase 26-B2 complete** — graphify-episode.ts --mode ai with regex fallback
- [x] **Absolute path validation** — All 9 scripts enforce absolute paths
- [x] **Series config system** — `series-config.ts`: SeriesConfig type, weapon-forger + my-core-is-boss configs, `detectSeries()` auto-detection
- [x] **graphify-episode.ts: series config refactoring** — Replaced hardcoded CHAR_NAMES, TECH_PATTERNS, TRAIT_PATTERNS with config-based lookup; added plot-lines.md gag parsing branch
- [x] **graphify-merge.ts: series config refactoring** — Replaced hardcoded charNames, added plot-lines.md gag chain parsing
- [x] **narrative.ts: generic episode detection** — Replaced weapon-forger-specific EPISODE_DIR_PATTERN with generic pattern; `detectEpisodes()` accepts optional pattern
- [x] **gen-story-html.ts: HTML escape** — Added `escapeHtml()`, applied to node labels, properties, neighbors, titles
- [x] **Phase 23: StoryCrossLink type** — Added to types.ts with link_type union, confidence, evidence, generated_by, rationale
- [x] **Phase 23: story-algorithms.ts** — PageRank (graphology-pagerank), Jaccard similarity, character arc score, gag evolution score
- [x] **Phase 23: subagent-prompt.ts** — `buildCrossLinkPrompt()` with graph summary + algorithm metrics
- [x] graphify-episode.ts: text-mention character fallback — `CHAR_NAMES` mapping detects characters in narration text (e.g., 滄溟子 in ch2ep3)
- [x] graphify-episode.ts: gag detection without PLAN.md column — fallback checks `colEpId === EP_ID` + truthy manifestation
