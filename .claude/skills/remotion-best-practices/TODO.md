# Novel Video Generation — TODO

> **Cross-linked docs:**
> - `PLAN.md` — Strategic roadmap (phases, architecture, gate integration)
> - `../bun_graphify/PLAN.md` — bun_graphify code-level architecture, node types, edge relations
> - `../bun_graphify/TODO.md` — bun_graphify code-level tasks (file/line specific)
>
> **Rule:** Strategic/pipeline tasks → this file. Code implementation tasks → `../bun_graphify/TODO.md`.

> **Status:** v0.14.0 — Phase 24/29 complete, Phase 30–32 planned (genre-aware KG, subagent scoring, KG-driven prompts)

---

## Known Issues (addressed by Phase 24)

| Issue | Phase | Status |
|-------|-------|--------|
| Jaccard similarity computed but never gates duplicate episodes | 24-A | **Fixed** |
| No algorithm-only cross-links (only AI) | 24-A | **Fixed** |
| No dramatic structure analysis | 24-B | **Fixed** |
| No foreshadowing tracking | 24-C | **Fixed** (types + check + prompt) |
| Character arc score = variation, not growth | 24-D | **Fixed** |
| No per-scene pacing analysis | 24-E | **Fixed** (v0.12.0) — computePacingCurve() + checkPacing() |
| No thematic coherence tracking | 24-F | **Fixed** (v0.13.0) — computeThemeCoherence() + checkThematicCoherence() + AI theme extraction |

## Phase 24 Gaps (discovered during implementation)

| Gap | Severity | Fix |
|-----|----------|-----|
| graphify-merge.ts doesn't create foreshadow nodes/edges from subagent output | Medium | ~~Add merge step: read foreshadow-output.json → create nodes + foreshadows link edges~~ **Fixed** |
| No pipeline integration for plot arc / foreshadowing subagents | Medium | graphify-pipeline.ts needs steps to invoke subagents (or wait for Phase 26 --mode ai) |
| Step 3b subagent prompt doesn't reference new gate subsections | Low | ~~Update episode-creation.md Step 3b to mention 伏筆追蹤 + 角色成長軌跡~~ **Fixed** |

---

## P0 — Fix next (Phase 24 gaps)

- [x] **Foreshadow merge step** — `graphify-merge.ts` reads `foreshadow-output.json` and creates `foreshadow` nodes + `foreshadows` link edges in merged-graph.json
  - File: `bun_app/bun_graphify/src/scripts/graphify-merge.ts`
  - Pattern: same as ai-crosslink-generator.ts (read JSON → validate → patch merged graph)

- [x] **Step 3b subagent prompt update** — episode-creation.md Step 3b must reference all 4 new gate subsections (重複內容檢查, 劇情弧分析, 伏筆追蹤, 角色成長軌跡)
  - File: `.claude/skills/remotion-best-practices/topics/episode-setup/episode-creation.md`
  - Scope: Step 3b instructions (subagent input list + gate section generation)

---

## P1 — Feature completeness (Phase 24-A/B/C/D — all complete)

### 24-A: Active Duplicate Content Gate

- [x] **24-A1: checkDuplicateContent()** — New consistency check in graphify-check.ts
  - Reads Jaccard similarity matrix from merged graph
  - FAIL when any episode pair has Jaccard > 0.7 (structurally near-duplicate)
  - WARN when any episode pair has Jaccard > 0.5 (significant overlap)
  - Reports per-pair similarity table with status
  - File: `bun_app/bun_graphify/src/scripts/graphify-check.ts`
  - Depends on: existing `computeJaccardSimilarity()` in `story-algorithms.ts:79-124`
  - Gate section: 重複內容檢查

- [x] **24-A2: Algorithm-only cross-links from Jaccard** — Generate `generated_by: "algorithm"` cross-links
  - When Jaccard > 0.5 between episode pairs → auto-generate `story_anti_pattern` cross-link
  - Elevates existing bun_graphify P1 item to P0
  - File: `bun_app/bun_graphify/src/scripts/ai-crosslink-generator.ts`
  - Gate section: 檢查結果 (story_anti_pattern entries)

- [x] **24-A3: Update episode-creation.md gate template** — Add 重複內容檢查 subsection
  - Insert after 故事 Arc 連續性, before 閘門判定
  - File: `.claude/skills/remotion-best-practices/topics/episode-setup/episode-creation.md`

### 24-B: Plot Arc Detector

- [x] **24-B1: PlotBeat type** — New interface in types.ts
  - `beat_type`: inciting_incident / rising_action / climax / falling_action / resolution
  - `scene`: source scene node ID
  - `tension`: 0.0-1.0 (dramatic tension level)
  - File: `bun_app/bun_graphify/src/types.ts`

- [x] **24-B2: computePlotArcScore()** — New algorithm in story-algorithms.ts
  - Input: array of plot_beat nodes with tension values
  - Expected curve: low → rise → peak → fall → low
  - Score: 0-100 based on tension distribution match
  - Returns: score + diagnosis (complete / no_climax / flat_middle / inverted)
  - File: `bun_app/bun_graphify/src/scripts/story-algorithms.ts`

- [x] **24-B3: buildPlotArcPrompt()** — New subagent prompt for scene classification
  - Sends scene sequence + dialog summary to AI
  - AI classifies each scene as a plot beat with tension score
  - File-based I/O pattern: write `plotarc-input.json` → read `plotarc-output.json`
  - File: `bun_app/bun_graphify/src/scripts/subagent-prompt.ts`

- [x] **24-B4: checkPlotArc()** — New consistency check in graphify-check.ts
  - FAIL: No climax beat detected (tension never peaks)
  - WARN: Flat middle (tension variance < 0.1 between inciting and climax)
  - WARN: Inverted arc (climax tension < rising_action tension)
  - Reports per-scene beat table with tension values
  - File: `bun_app/bun_graphify/src/scripts/graphify-check.ts`
  - Gate section: 劇情弧分析

- [x] **24-B5: Update episode-creation.md gate template** — Add 劇情弧分析 subsection
  - Insert after 重複內容檢查, before 伏筆追蹤
  - File: `.claude/skills/remotion-best-practices/topics/episode-setup/episode-creation.md`

---

## P1 — Feature completeness (Phase 24-C: Foreshadowing + Phase 24-D: Character Growth)

### 24-C: Foreshadowing Tracker

- [x] **24-C1: Foreshadow type + foreshadows link edge** — New interfaces in types.ts
  - `Foreshadow`: planted_episode, paid_off (bool), description, payoff_episode
  - `foreshadows` link edge type for cross-episode connection
  - File: `bun_app/bun_graphify/src/types.ts`

- [x] **24-C2: buildForeshadowPrompt()** — New subagent prompt for foreshadowing extraction
  - Analyzes dialog/narration for setups (promises, unanswered questions, mysterious objects)
  - Identifies payoffs in later episodes
  - File-based I/O: `foreshadow-input.json` → `foreshadow-output.json`
  - File: `bun_app/bun_graphify/src/scripts/subagent-prompt.ts`

- [x] **24-C3: checkForeshadowing()** — New consistency check in graphify-check.ts
  - WARN: Foreshadowing unpaid after 2 episodes
  - INFO: New foreshadowing planted (tracking only)
  - Reports: planted count, paid-off count, overdue count
  - File: `bun_app/bun_graphify/src/scripts/graphify-check.ts`
  - Gate section: 伏筆追蹤

- [x] **24-C4: Update episode-creation.md gate template** — Add 伏筆追蹤 subsection
  - File: `.claude/skills/remotion-best-practices/topics/episode-setup/episode-creation.md`

### 24-D: Character Growth Trajectory

- [x] **24-D1: Upgrade computeCharacterArcScore()** — Direction-aware scoring
  - Classify each trait change: positive_growth, negative_decline, neutral_shift, reintroduction
  - Compute trajectory vector: `(positive - negative) / total_changes`
  - Classify arc: positive (score > 0.3), negative (< -0.3), flat (|score| < 0.1), cyclical
  - Returns: score + classification + per-episode trait trajectory
  - File: `bun_app/bun_graphify/src/scripts/story-algorithms.ts:134-179` (replace existing)

- [x] **24-D2: checkCharacterGrowth()** — New consistency check in graphify-check.ts
  - WARN: Main character has flat arc across 3+ episodes
  - INFO: Arc classification and score for all characters
  - Reports: per-character growth table with direction + score
  - File: `bun_app/bun_graphify/src/scripts/graphify-check.ts`
  - Gate section: 角色成長軌跡

- [x] **24-D3: Update episode-creation.md gate template** — Add 角色成長軌跡 subsection
  - File: `.claude/skills/remotion-best-practices/topics/episode-setup/episode-creation.md`

---

## P2 — Architecture (Phase 24 complete)

- [x] **24-E0: dialog_line_count in scene nodes** — Add scene.line_count property to regex extraction
  - **DONE** — `graphify-episode.ts` Step 2.5 now includes `dialog_line_count` in scene node properties

- [x] **24-E1: Pacing curve analyzer** — DONE (v0.13.0 — enhanced with weighted signals)
  - `computePacingCurve()` in story-algorithms.ts — weighted: 0.4*dialog + 0.3*character + 0.3*effect
  - `checkPacing()` in graphify-check.ts — WARN if flat or inverted
  - Scene nodes now have `character_count` and `effect_count` properties
  - Files: `story-algorithms.ts`, `graphify-check.ts`, `graphify-episode.ts`

- [x] **24-F1: Thematic coherence score** — DONE (v0.13.0)
  - `computeThemeCoherence()` in story-algorithms.ts — shared themes / total unique themes
  - `checkThematicCoherence()` in graphify-check.ts: WARN if < 0.3
  - `theme` node type added to AI extraction prompt
  - Files: `story-algorithms.ts`, `graphify-check.ts`, `subagent-prompt.ts`

---

## P1 — Remotion Framework (Phase 25 — sketched)

> Detailed spec after Phase 24 validates the story quality approach.

- [ ] **25-A1: DialogScene template** — Multi-character dialog with reactions, proportional timing
- [ ] **25-A2: ActionScene template** — Dynamic battle/action with ComicEffects, ScreenShake
- [ ] **25-B1: PlotBeatOverlay** — Visual arc position indicator (reads plot_beat nodes)
- [ ] **25-C1: CharacterStateOverlay** — Current emotional state (reads growth trajectory)

---

## Phase 26 — Dual-Mode Pipeline with pi-agent (orthogonal)

> Replaces manual file-based subagent handoff with direct pi-agent API calls.
> Benefits ALL phases (23, 24, 25+) that use subagent calls.
> Full spec: `.claude/skills/bun_graphify/PLAN.md` Phase 26, tasks: `.claude/skills/bun_graphify/TODO.md`

- [x] **26-A1: ai-client.ts** — pi-ai SDK wrapper (`callAI()` with provider/model selection)
- [x] **26-A2: Add @mariozechner/pi-ai dep** — bun_graphify package.json
- [x] **26-B1: Episode NL extraction (--mode ai)** — Replace Claude Code subagent with pi-agent
- [x] **26-B2: Cross-link discovery (--mode ai)** — Replace file handoff with direct API call
- [x] **26-B3: Check enrichment (--mode ai)** — Replace file handoff with direct API call
- [x] **26-C1: Pipeline --mode ai passthrough** — graphify-pipeline.ts passes flags to subprocesses

---

## Phase 27 — Hybrid Mode + Comparison Framework (complete)

> Runs regex first, then AI supplements exclusive types (plot_event, artifact, gag_manifestation).
> Comparison tool validates all 3 modes and recommends best default.

- [x] **27-A1: --mode hybrid in ai-client.ts** — Add "hybrid" to mode union type
- [x] **27-A2: Hybrid extraction in graphify-episode.ts** — Regex first, then AI adds exclusive nodes/edges
- [x] **27-A3: Pipeline hybrid passthrough** — graphify-pipeline.ts passes --mode hybrid to subprocesses
- [x] **27-A4: graphify-compare.ts** — Run pipeline 3 modes, compare, recommend best default
- [x] **27-A5: Generation manifest** — graph.json, merged-graph.json, consistency-report.md, graph.html all include generator metadata (mode, model, timestamp, version)

### Comparison results (my-core-is-boss, 5 eps)

| Metric | regex | ai | hybrid |
|--------|-------|----|--------|
| Total nodes | 109 | 98 | 199 |
| Node types | 5 | 8 | 8 |
| Exclusive types | 0 | 0 | 0 |
| Score | 54 | 32 | **97** |

**Verdict: hybrid is the best default** — regex density + AI exclusives = highest score.

---

## Phase 28 — Model Benchmark for Graphify Hybrid Mode (complete)

> Empirically compare z.ai models on the hybrid pipeline to find the best default model.
> All models use `openai-completions` API via `https://api.z.ai/api/coding/paas/v4` (already in pi-ai SDK, no patching needed).

- [x] **28-A1: Add z.ai model connection test to bun_pi_agent** — Test script that verifies z.ai models can connect and respond correctly via pi-ai SDK
  - File: `bun_app/bun_pi_agent/src/__tests__/zai-models.test.ts`
  - Models tested: glm-4.5-air, glm-4.7, glm-5-turbo, glm-5.1
  - 8 tests (4 registry + 4 live), all pass in ~9.5s

- [x] **28-A2: Run 6-model graphify benchmark** — Pipeline comparison for candidate models
  - Models: glm-4.5-air, glm-4.7, glm-4.7-flash (old default), glm-5, glm-5-turbo, glm-5.1
  - Series: my-core-is-boss (5 episodes)

- [x] **28-A3: Compute comparison table and decide best default**
  - Decision: **glm-5** wins by score (634), updated `ai-client.ts` default

- [x] **28-A4: Add callAI timeout protection** — AbortController with 60s timeout
  - Prevents infinite hangs on API calls
  - File: `bun_app/bun_graphify/src/ai-client.ts`

### Benchmark results (my-core-is-boss, 5 eps, hybrid mode)

| Metric | glm-4.5-air | glm-4.7 | glm-4.7-flash | **glm-5** | glm-5-turbo | glm-5.1 |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| Nodes | 124 | 164 | 196 | **258** | 178 | 109 |
| Edges | 231 | 271 | 307 | **440** | 291 | 215 |
| PASS/WARN/FAIL | 10/8/6 | 20/9/6 | 19/10/10 | 18/9/10 | 19/11/6 | 17/6/10 |
| **Score** | 391 | 461 | 498 | **634** | 484 | 333 |

- **glm-5** best by score (634) — richest entity extraction, most diverse node types
- **glm-4.7** and **glm-5-turbo** tie for fewest FAIL (6) — higher consistency
- **glm-5.1** underperformed — AI calls returned empty (0 artifact/gag/plot_event), likely API issue

---

## Phase 28-B — Improved Model Benchmark (next term)

> Current scoring has quantity bias (more nodes = higher score regardless of accuracy).
> Re-benchmark with quality-weighted scoring and accuracy sampling.

- [ ] **28-B1: Accuracy sampling** — Manual review of 10-20 AI-generated nodes per model
  - Sample: artifact, gag_manifestation, plot_event nodes (types only AI produces)
  - Check: does entity name/description match narration.ts content?
  - Compute: precision = correct / total per model
  - Models to re-test: glm-4.7, glm-5, glm-5-turbo, glm-5.1

- [ ] **28-B2: Quality-weighted score formula** — Reduce quantity bias
  - Current: `nodeTypeCount × 10 + nodeCount × 1 + edgeCount × 0.5 + linkEdgeCount × 2 − failCount × 3 + passCount × 1`
  - Proposed: `nodeTypeCount × 5 + precision × nodeCount × 2 + edgeCount × 0.3 + linkEdgeCount × 2 − failCount × 8 + passCount × 1`
  - Key changes: precision multiplier, stronger FAIL penalty, reduced type diversity weight
  - File: `bun_app/bun_graphify/src/scripts/graphify-compare.ts`

- [ ] **28-B3: Reliability testing** — Run each model 3 times, report mean ± stddev
  - Discard runs where AI supplement fails (>50% episodes get 0 AI nodes)
  - File: `bun_app/bun_graphify/src/scripts/graphify-compare.ts` (+--runs flag)

- [ ] **28-B4: graphify-compare.ts --models flag** — Benchmark across models within same mode
  - `--models glm-4.7,glm-5,glm-5-turbo,glm-5.1` runs pipeline for each
  - Saves per-model output to temp dirs, computes comparison table
  - File: `bun_app/bun_graphify/src/scripts/graphify-compare.ts`

---

## Phase 29 — Story Quality Pipeline Completion (complete)

> Completes all 6 quality gates (24-F), adds aggregate score, gate enforcement, enhanced pacing, per-episode HTML, and Phase 25 Remotion overlay components.

- [x] **29-A: Thematic Coherence (24-F)** — `theme` node type in AI extraction, `computeThemeCoherence()`, `checkThematicCoherence()`, report section
- [x] **29-B: Aggregate Quality Score** — `computeAggregateScore()` (PASS+=5, WARN-=5, FAIL-=15, 0-100), 品質評分 in report header
- [x] **29-C: Gate Enforcement** — `gate.json` with per-check fix suggestions from AI enrichment
- [x] **29-D: Enhanced Pacing** — `character_count` + `effect_count` in scene nodes, weighted tension (40/30/30)
- [x] **29-E: Per-Episode HTML** — Step 1.5 in pipeline generates per-episode graph.html
- [x] **29-F: Phase 25 Overlay Components** — PlotBeatOverlay, TensionMeter, CharacterStateOverlay, story-graph.ts

### Files Modified

| File | Changes |
|------|---------|
| `bun_app/bun_graphify/src/scripts/subagent-prompt.ts` | +theme node type + illustrates edge |
| `bun_app/bun_graphify/src/scripts/story-algorithms.ts` | +computeThemeCoherence(), enhanced PacingPoint |
| `bun_app/bun_graphify/src/scripts/graphify-check.ts` | +checkThematicCoherence(), aggregate score, gate.json, enhanced pacing, fix suggestions |
| `bun_app/bun_graphify/src/scripts/graphify-episode.ts` | +character_count, +effect_count in scene nodes |
| `bun_app/bun_graphify/src/scripts/graphify-pipeline.ts` | +Step 1.5 per-episode HTML |
| `bun_remotion_proj/shared/src/components/PlotBeatOverlay.tsx` | NEW |
| `bun_remotion_proj/shared/src/components/TensionMeter.tsx` | NEW |
| `bun_remotion_proj/shared/src/components/CharacterStateOverlay.tsx` | NEW |
| `bun_remotion_proj/shared/src/story-graph.ts` | NEW — graph data utilities |
| `bun_remotion_proj/shared/src/components/index.ts` | +3 exports |
| `bun_remotion_proj/shared/src/index.ts` | +3 component exports + story-graph exports |

---

## Phase 30 — Genre-Aware KG Pipeline (Generalize Regex + Scoring)

> **Problem:** Current KG build logic hard-codes scoring bonuses for `tech_term` and `character_trait` (novel-specific). Comedy series (galgame-meme-theater) have `techPatterns: []` and different narrative structures (gag → escalation → punchline instead of inciting → climax → resolution). The scoring formula in `graphify-compare.ts` overfits to `my-core-is-boss` patterns.

### 30-A: Genre-Aware Scoring Formula

- [ ] **30-A1: Genre enum + scoring profiles** — Add `genre` field to `SeriesConfig` (values: `xianxia_comedy`, `galgame_meme`, `novel_system`, `generic`). Each genre defines:
  - Which node types get bonus weight (novel: `tech_term`, `character_trait`; comedy: `gag_manifestation`, `character_trait`)
  - Which checks are relevant (novel: plot arc, foreshadowing; comedy: gag evolution, gag diversity)
  - Expected arc shape (novel: Freytag pyramid; comedy: joke cycle setup→buildup→punchline)
  - File: `bun_app/bun_graphify/src/scripts/series-config.ts`

- [ ] **30-A2: Genre-weighted scoring in graphify-compare.ts** — Replace hardcoded `tech_term`/`character_trait` bonuses with genre-aware weights from scoring profile
  - Current: `score += (s.nodesByType["tech_term"] ?? 0)` (hardcoded)
  - New: `score += (s.nodesByType[genre.bonusType] ?? 0) * genre.bonusWeight`
  - File: `bun_app/bun_graphify/src/scripts/graphify-compare.ts`

### 30-B: Comedy-Specific Extraction Patterns

- [ ] **30-B1: Comedy arc analysis** — For comedy genre, replace `checkPlotArc()` (Freytag pyramid) with `checkComedyArc()`:
  - Track gag setup → escalation → punchline → callback pattern
  - WARN: No punchline in episode (all setup, no payoff)
  - WARN: Callback without prior setup (orphan callback)
  - WARN: Same gag pattern 3+ episodes without variation (stagnation)
  - File: `bun_app/bun_graphify/src/scripts/graphify-check.ts`

- [ ] **30-B2: Gag diversity score** — New algorithm: count unique `gag_type` values / total gag manifestations per episode
  - Score < 0.3 → WARN (same gag repeated, low variety)
  - Track gag_type evolution across episodes (does each gag transform?)
  - File: `bun_app/bun_graphify/src/scripts/story-algorithms.ts`

- [ ] **30-B3: Comedy subagent prompt** — `buildComedyAnalysisPrompt()` for AI extraction of joke structure, punchline timing, callback detection
  - File: `bun_app/bun_graphify/src/scripts/subagent-prompt.ts`

### 30-C: Regex Generalization

- [ ] **30-C1: Effect pattern per genre** — Current `effectPattern` in graphify-episode.ts line 229 hardcodes xianxia battle effects (`闪电|爆炸|轰|砰|...`). Move to SeriesConfig:
  - xianxia: `闪电|爆炸|轰|砰|咻|嗙|轟|叮|咚`
  - comedy: `哈哈|噗|XD|（笑|笑死|無言|白眼|翻桌|...`
  - generic: empty (skip effect counting)
  - File: `bun_app/bun_graphify/src/scripts/series-config.ts`, `bun_app/bun_graphify/src/scripts/graphify-episode.ts`

- [ ] **30-C2: Title pattern per genre** — Current title extraction (line 138) hardcodes `第X章第X集`. Galgame-meme-theater uses flat `epN` numbering. Move to SeriesConfig:
  - xianxia: `第[一二三四五六七八九十]+章\s*第[一二三四五六七八九十]+集[：:]\s*(.+)`
  - comedy: `第[一二三四五六七八九十\d]+集[：:]\s*(.+)`
  - File: `bun_app/bun_graphify/src/scripts/series-config.ts`

---

## Phase 31 — Subagent-Based KG Quality Scoring (Replace Programmatic-Only)

> **Problem:** Current KG regression uses programmatic scoring formulas (node counts, type diversity, PASS/WARN/FAIL tallies). These have known biases (quantity over quality, no accuracy signal, no semantic understanding). We need an LLM subagent to evaluate KG quality holistically — reading the generated graph data and scoring it against narrative content.

### 31-A: Subagent Scoring Infrastructure

- [ ] **31-A1: buildKGScorePrompt()** — New subagent prompt that sends:
  - Merged graph summary (node count by type, edge count by relation, top communities)
  - Per-episode graph highlights (main characters, key events, gag manifestations)
  - Scoring rubric (structured, not open-ended):
    1. Entity accuracy (0-10): Do node labels match narration.ts content?
    2. Relationship correctness (0-10): Are edges semantically valid?
    3. Completeness (0-10): Are major story elements captured?
    4. Cross-episode coherence (0-10): Do cross-links make sense?
    5. Actionability (0-10): Can a Remotion pipeline use this KG to build scenes?
  - Returns: JSON with per-dimension scores + overall + justification
  - File: `bun_app/bun_graphify/src/scripts/subagent-prompt.ts`

- [ ] **31-A2: scoreKG() orchestrator** — New script that:
  1. Runs pipeline (existing)
  2. Calls buildKGScorePrompt() → callAI()
  3. Parses subagent response
  4. Computes blended score: `0.4 * programmatic + 0.6 * subagent`
  5. Writes `kg-quality-score.json`
  - File: `bun_app/bun_graphify/src/scripts/graphify-score.ts` (NEW)

- [ ] **31-A3: graphify-compare.ts integration** — Add subagent scores to comparison report
  - New column: "Subagent Score" in summary table
  - New section: "AI Quality Assessment" with per-dimension breakdown
  - Best mode recommendation uses blended score
  - File: `bun_app/bun_graphify/src/scripts/graphify-compare.ts`

### 31-B: Regression Test Suite

- [ ] **31-B1: Test corpus** — Curate regression test episodes:
  - my-core-is-boss: ch1ep1–ch2ep1 (novel, system meme)
  - galgame-meme-theater: ep1–ep3 (comedy, gag evolution)
  - weapon-forger: ch1ep1–ch1ep3 (xianxia, battle FX)
  - Store references in `bun_app/bun_graphify/test-corpus/`

- [ ] **31-B2: Regression runner** — Script that runs pipeline + scoring on test corpus
  - Detects regressions: score delta > 10% from baseline
  - Baseline stored in `kg-quality-baseline.json`
  - Report: per-series delta + overall trend
  - File: `bun_app/bun_graphify/src/scripts/graphify-regression.ts` (NEW)

---

## Phase 32 — KG-Driven LLM Prompt Enhancement for Remotion

> **Problem:** Current Remotion episode generation (episode-creation.md Step 3b) uses static prompt templates. The KG contains rich cross-episode data (character arcs, gag evolution, pacing curves) that should inform prompt construction to improve video quality and consistency.

### 32-A: KG Context Injection

- [ ] **32-A1: buildRemotionPrompt()** — New prompt builder that injects KG context:
  - Previous episode summary from merged-graph.json (key events, character states)
  - Active foreshadowing (planted but not yet paid off)
  - Character growth trajectory (direction + recent trait changes)
  - Gag evolution history (what happened in last 2 episodes)
  - Pacing profile of previous episode (scene tension curve)
  - Thematic coherence data (shared themes, theme drift)
  - File: `bun_app/bun_graphify/src/scripts/subagent-prompt.ts`

- [ ] **32-A2: story-graph.ts enhancement** — Add data loading functions for prompt context:
  - `loadPreviousEpisodeSummary()` — extracts key nodes/edges from previous ep's graph
  - `loadActiveForeshadowing()` — unpaid foreshadows from merged graph
  - `loadGagEvolution()` — gag type → manifestation history
  - `loadCharacterArcContext()` — per-character growth direction + traits
  - File: `bun_remotion_proj/shared/src/story-graph.ts`

### 32-B: Remotion Scene Quality Feedback Loop

- [ ] **32-B1: Post-render KG enrichment** — After episode renders, extract scene timing data and update KG:
  - Actual scene durations → compare with pacing predictions
  - Effect usage → compare with effect_count predictions
  - This creates a feedback loop for future prompt calibration
  - File: `bun_app/bun_graphify/src/scripts/graphify-enrich.ts` (NEW)

- [ ] **32-B2: Prompt calibration data** — Store prompt → quality correlation data
  - Track: which KG context items were included → resulting subagent quality score
  - Over time, identify which KG features most improve output
  - File: `bun_app/bun_graphify/src/scripts/prompt-calibration.ts` (NEW)

---

## Phase 28-B — Improved Model Benchmark (next term, re-planned)

> Moved from Phase 28. Re-benchmark with quality-weighted scoring and accuracy sampling.

- [ ] **28-B1: Accuracy sampling via subagent** — Use subagent scoring (Phase 31-A1) instead of manual review
  - No longer "manual" — subagent evaluates 10-20 nodes per model
  - Sample: artifact, gag_manifestation, plot_event nodes
  - Compute: precision = correct / total per model
  - Models: glm-4.7, glm-5, glm-5-turbo, glm-5.1

- [ ] **28-B2: Quality-weighted score formula** — Reduce quantity bias
  - Current: `nodeTypeCount × 10 + nodeCount × 1 + edgeCount × 0.5 + linkEdgeCount × 2 − failCount × 3 + passCount × 1`
  - Proposed: blend programmatic (30%) + subagent score (70%)
  - File: `bun_app/bun_graphify/src/scripts/graphify-compare.ts`

- [ ] **28-B3: Reliability testing** — Run each model 3 times, report mean ± stddev
  - File: `bun_app/bun_graphify/src/scripts/graphify-compare.ts` (+--runs flag)

- [ ] **28-B4: graphify-compare.ts --models flag** — Benchmark across models within same mode
  - `--models glm-4.7,glm-5,glm-5-turbo,glm-5.1` runs pipeline for each
  - File: `bun_app/bun_graphify/src/scripts/graphify-compare.ts`

---

## Pipeline Run History

> Populated after each Phase 24 implementation run.

### Phase 24 — Design

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| 2026-04-18 | Design | Complete | PLAN.md + TODO.md created, Phase 24-A/B/C/D/E/F defined, Phase 25 sketched |
| 2026-04-18 | Phase 26 | Designed | Dual-mode pipeline (regex/ai) with pi-agent integration, 3 AI touchpoints, 7 tasks |
| 2026-04-18 | Phase 24-A | Complete | 24-A1 checkDuplicateContent(), 24-A2 algorithm cross-links from Jaccard, 24-A3 gate template |
| 2026-04-18 | Phase 24-B | Complete | 24-B1 PlotBeat type, 24-B2 computePlotArcScore(), 24-B3 buildPlotArcPrompt(), 24-B4 checkPlotArc(), 24-B5 gate template |
| 2026-04-18 | Phase 24-C | Complete | 24-C1 Foreshadow type, 24-C2 buildForeshadowPrompt(), 24-C3 checkForeshadowing(), 24-C4 gate template |
| 2026-04-18 | Phase 24-D | Complete | 24-D1 direction-aware computeCharacterArcScore(), 24-D2 checkCharacterGrowth(), 24-D3 gate template |
| 2026-04-18 | Phase 26-A/B | Complete | 26-A1 ai-client.ts, 26-A2 pi-ai dep, 26-B1 buildEpisodeExtractionPrompt(), 26-B2 graphify-episode --mode ai |
| 2026-04-18 | P0 paths | Complete | Absolute path validation in all 9 scripts |
| 2026-04-18 | Phase 26-B3/C1 | Complete | 26-B3 check enrichment --mode ai (callAI + buildEnrichmentPrompt), 26-C1 pipeline aiFlags passthrough |
| 2026-04-18 | Phase 26-C3 | Complete | AI vs regex comparison (my-core-is-boss 5 eps): AI = 3 exclusive node types + 3 exclusive relations; regex = denser traits/tech terms. Hybrid approach recommended. |
| 2026-04-18 | Phase 27 | Complete | --mode hybrid (regex first, AI supplements exclusive types) + graphify-compare.ts comparison tool. Hybrid scores 97 vs regex 54 vs ai 32 on my-core-is-boss. Generation manifest added to all outputs. |
| 2026-04-18 | Phase 24-E | Complete | 24-E0 dialog_line_count in scene nodes (pre-existing), 24-E1 computePacingCurve() + checkPacing() + pacing table in report. Dialog-only tension signal (limitation documented). v0.12.0. |
| 2026-04-19 | Phase 29 | Complete | v0.13.0 — 24-F thematic coherence (theme node + illustrates edge + computeThemeCoherence + check), aggregate quality score (0-100), gate.json with AI fix suggestions, enhanced pacing (3-signal weighted: dialog 40% + chars 30% + effects 30%), per-episode HTML (Step 1.5), Phase 25 overlay components (PlotBeatOverlay, TensionMeter, CharacterStateOverlay) + story-graph.ts utilities |

---

## Done

- [x] **Phase 24-A complete** — checkDuplicateContent(), algorithm cross-links from Jaccard, gate template
- [x] **Phase 24-B complete** — PlotBeat type, computePlotArcScore(), buildPlotArcPrompt(), checkPlotArc(), gate template
- [x] **Phase 24-C complete** — Foreshadow type, buildForeshadowPrompt(), checkForeshadowing(), gate template
- [x] **Phase 24-D complete** — Direction-aware computeCharacterArcScore(), checkCharacterGrowth(), gate template
- [x] **Phase 24-E1 complete** — computePacingCurve() + checkPacing() with flat/inverted detection
- [x] **Phase 24-F complete** — computeThemeCoherence() + checkThematicCoherence() + theme node type in AI extraction
- [x] **Phase 29 complete** — Aggregate quality score, gate.json, fix suggestions, enhanced pacing (3-signal), per-episode HTML, Phase 25 overlay components
- [x] **PLAN.md created** — Strategic roadmap with Phase 24 architecture + Phase 25 sketch + implementation reflections
- [x] **TODO.md created** — 17 actionable tasks across P0/P1/P2, gap analysis
- [x] **Gate integration spec** — 4 new zh_TW subsections for 品質閘門
- [x] **Cross-reference pattern** — Matches bun_graphify PLAN/TODO cross-linking style
