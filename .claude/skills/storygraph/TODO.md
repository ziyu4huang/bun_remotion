# storygraph TODO

> **Cross-linked docs:**
> - Skill PLAN: `.claude/skills/storygraph/PLAN.md` — Architecture, node types, edge relations
> - Skill TODO: `.claude/skills/storygraph/TODO.md` — **(this file)** Pipeline-level tasks, run history
> - Skill SKILL: `.claude/skills/storygraph/SKILL.md` — Operational playbook
> - Code PLAN: `bun_app/storygraph/PLAN.md` — Code-level plan + reuse reference
> - Code TODO: `bun_app/storygraph/TODO.md` — Code-level tasks (file/line specific)
>
> **Rule:** Pipeline/architecture tasks → this file. Code implementation tasks → `bun_app/storygraph/TODO.md`.

> **Status:** v0.40.0 — All P0 tasks complete. 483 tests passing. Tooling gap suppression, gag fatigue detection, dimension evidence checks. Pipeline mature.

**Note:** `pipeline-api.ts` (runPipeline, runCheck, runScore, getPipelineStatus) is consumed by `remotion_studio` workflow engine (Phase 39-A1). Breaking changes to these exports require webui route/tests update.

---

## Known Issues

**Hybrid mode (all series):**
- **Crosslink generator requires Claude for full execution** — `--mode ai` uses GLM, but complex cross-link discovery still benefits from Claude. GLM-5 may work for this simpler task (untested).

**weapon-forger (8 episodes):**
- **`soul` character has no cross-episode links** — Only appears in 1 episode. Expected for single-episode characters; not a bug.
- **3 Trait Coverage WARNs** — elder, luyang, mengjingzhou have narrow dialog in some episodes. Patterns intentionally kept narrow (over-broadening caused regressions).

**my-core-is-boss (12 episodes):**
- **60 WARN, 0 FAIL** — Trait Coverage 20, Interaction Density 16, Isolated Nodes 14, Community Cohesion 5, Pacing 4, Duplicate Content 1. Improved from 66 WARN with broadened patterns + feedback loop.

---

## P0 — Current Focus

### 0-A: KG Quality Verification & Improvement ✅

- [x] **Run quality audit on all series** — All 5 series: 100/100. WARN counts: weapon-forger 11, my-core-is-boss 66, storygraph-explainer 6, galgame-meme-theater 3, xianxia-system-meme 3.
- [x] **Identify systematic WARN patterns** — Trait Coverage (3/5 series, 29 WARNs), Community Cohesion (3/5, 14), Isolated Nodes (2/5, 15).
- [x] **Improve series configs** — Broadened my-core-is-boss patterns: linyi (遊戲化世界觀 + game terms, 速通玩家 + efficiency), zhaoxiaoqi (過度解讀 + misinterpretation verbs, 主動腦補 + 師兄是指), xiaoelder (嚴肅長老表面 + 老夫, 老資格自居 + 上古神通), chenmo (程式師思維 + code terms). Result: Trait Coverage 25→20 (-20%). weapon-forger patterns kept narrow (too-broad patterns cause regressions).
- [x] **AI extraction accuracy spot-check** — 30 nodes sampled across 3 series (10 each). All have valid episode prefixes and reference real story content. No hallucinations found in plot_event, artifact, gag_manifestation, plot_beat, or theme types.
- [x] **Regression baseline** — test-corpus/baselines/*/gate-20260429.json for all 5 series.

### 0-B: Content-Aware Enrichment Loop ✅

- [x] **buildEnrichmentFeedbackPrompt()** — `subagent-prompt.ts`. Reads gate.json + consistency-report.md, generates zh_TW feedback with episode-specific and series-wide WARN context.
- [x] **Wire into graphify-episode.ts hybrid step** — `--feedback` flag prepends context to AI call in step 7.5. Only active in hybrid mode when previous gate.json exists.
- [x] **Add `--feedback` flag to graphify-pipeline.ts** — Passthrough to episode subprocesses. Off by default.
- [x] **A/B comparison** — my-core-is-boss: 66→59 WARN (-10.6%). Interaction Density 18→11 (-7). Trait Coverage 25→24 (-1). Duplicate Content 0→2 (+2).

## Pending (deferred)

- **Cross-series KG merge** — Federated merge across all series. Depends on closing quality gaps first (need 3+ high-quality series graphs).

---

## P0 — Fix next (all complete)

- [x] **Duplicate node dedup in hybrid mode** — Fuzzy dedup via `normalizeForDedup()` in `dedup.ts`. Hybrid step 7.5 builds regex label index, skips AI nodes with matching normalized labels. ~10% inflation reduced.
- [x] **Absolute path enforcement** — All 9 scripts validate absolute paths at entry.
- [x] **Subagent JSON extraction** — Fixed with truncation repair + maxTokens=4096 in Phase 2C. Robust parsing: markdown fence stripping, array extraction, per-item validation.

---

## P1 — Feature completeness

- [x] **Subagent prompt template** — `bun_app/storygraph/src/scripts/subagent-prompt.ts` with `buildCrossLinkPrompt()` and `buildEpisodeExtractionPrompt()`.
- [x] **Direct AI invocation for cross-links** — Phase 26 `--mode ai` uses pi-agent for all AI touchpoints (cross-links, check enrichment, episode extraction). No manual file handoff.
- [x] **Algorithm-only cross-links** — `generateAlgorithmCrossLinks()` in `story-algorithms.ts`: 4 types (story_anti_pattern from Jaccard, character_theme_affinity from PageRank, gag_character_synergy from co-occurrence, narrative_cluster from scene character overlap). Wired into `ai-crosslink-generator.ts` step 3b.
- [x] **Batch per-episode HTML** — Pipeline step 3 runs `gen-story-html.ts` on each episode dir after extraction.
- [x] **gag_evolves ID normalization** — Shared `gagNodeId()` in `dedup.ts`, used by graphify-episode.ts (3 regex paths), graphify-merge.ts (chain edges). Merge also discovers AI-generated gag chains from graph nodes. Hybrid step normalizes AI gag IDs.
- [x] **Trait coverage: PLAN.md character baseline** — `getBaselineTraits()` in graphify-check.ts extracts trait labels from SeriesConfig.traitPatterns. Trait Coverage WARN now distinguishes "regex missed (baseline has N traits)" from "no baseline defined".
- [x] **Artifact extraction** — Step 7.7 in graphify-episode.ts. `artifactPatterns` in SeriesConfig, scans dialog for creation patterns. weapon-forger: 4 artifacts, my-core-is-boss: 3 artifact types.
- [x] **Plot event extraction** — Step 7.6 in graphify-episode.ts. Narrator TitleScene/OutroScene sentences as plot_event nodes. weapon-forger ch1-ep1: 10 plot events.

---

## P2 — Architecture improvements

- [x] **Incremental updates** — `--incremental` flag in graphify-pipeline.ts. `isUpToDate()` in incremental.ts checks narration.ts vs graph.json mtime. Skips extraction + per-ep HTML for up-to-date episodes.
- [x] **Dual pipeline merge** — Hybrid mode (regex + AI) implemented in Phase 27. Regex runs first, AI supplements exclusive nodes/edges, dedup by node ID.
- [x] **Confidence scoring** — Regex edges scored by match count: traits 0.6+0.2/match, tech terms 0.5+0.1/occurrence, interactions 0.4+0.2/scene. AI edges 0.8.
- [x] **Cross-series support** — Series config system with `detectSeries()`, weapon-forger + my-core-is-boss configs.
- [x] **PageRank normalization** — `normalizePageRankByType()` min-max scales per node type. Crosslink generator uses normalized scores for character_theme_affinity.
- [x] **Input size management** — crosslink-input.json truncates raw nodes (>200) and edges (>400) for large series. Prompt gets full data.
- [x] **Pipeline step renumbering** — Steps now 1-7 (clean, episode, per-ep HTML, merge, merged HTML, check, crosslink).
- [x] **Unified node ID convention** — 8 canonical ID builders in `dedup.ts` (plotNodeId, sceneNodeId, charNodeId, techTermNodeId, plotEventNodeId, artifactNodeId, traitNodeId, gagNodeId). All construction in graphify-episode.ts + graphify-merge.ts uses shared functions.
- [x] **Gate scoring normalization** — Group-based scoring in `gate-scoring.ts`. Groups checks by type prefix, scores each group once based on pass rate. Episode-count-independent: 5-ep and 25-ep series get same score for same quality. gate.json v2.1 with `group_scores` and `scoring_method`.
- [x] **Parallel episode extraction** — Steps 2+3 in `graphify-pipeline.ts` use `Promise.all` with `spawnAsync` helper. Timing log shows parallel speedup. Sequential result logging for clean output.

---

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
| — | Parallel Extraction | spawnAsync + Promise.all for steps 2+3, timing log |
| — | Visualization Improvements | Confidence-based edge opacity, PageRank toggle, community highlight |
| — | Content-Aware Scoring | kg-loaders wired into graphify-check, Episode Continuity check, enrichment-based variant suppression |
| — | Quality Audit + Feedback Loop | 5-series audit, Trait Coverage/Community Cohesion systemic, --feedback flag, 10.6% WARN reduction |

---

## Pipeline Run History

### 2026-04-20 v0.20.0 — my-core-is-boss rebuild (hybrid mode)

| Metric | Value |
|--------|-------|
| Episodes | 5 (ch1-ep1 through ch2-ep2) |
| Merged nodes | 173 |
| Gate score | 100/100 |
| Communities | 8 |

Full pipeline rebuild after Phase 33 dual-LLM architecture changes. Gate v2 scoring passes all checks. Hybrid mode (regex + AI) produces richest graph.

### 2026-04-19 v0.15.0 — storygraph-explainer rebuild

| Metric | Value |
|--------|-------|
| Nodes | 131 |
| Communities | 8 |
| Quality score | 100 |

First tech-explainer series pipeline run. Validates genre-aware pipeline (Phase 30) with tech_explainer category.

### 2026-04-18 v0.10.0 — Phase 26 completion (AI mode)

Pipeline now supports end-to-end `--mode ai` without manual subagent file handoff. All 3 AI touchpoints (episode extraction, cross-links, check enrichment) use direct pi-agent API calls.

### 2026-04-18 v0.10.0 — AI vs Regex comparison (my-core-is-boss, 5 episodes)

| Mode | Nodes | Edges |
|------|-------|-------|
| Regex | 109 | 139 |
| AI | 115 | 122 |
| Hybrid | 97 (deduped) | 54 (exclusive) |

AI produces 3 exclusive node types (plot_event, gag_manifestation, artifact) and 3 exclusive edge relations (triggers, relates_to, uses). Regex produces denser traits and tech terms. Hybrid mode combines both. Recommendation: hybrid as default.

---

## Done

- [x] Series config system — `series-config.ts` with `detectSeries()`, weapon-forger + my-core-is-boss configs
- [x] Phase 23: AI Cross-Link Discovery — StoryCrossLink type, PageRank, Jaccard, arc/evolution scores, vis.js dotted cross-links, toggle legend
- [x] Phase 26: pi-agent AI Integration — callAI(), --mode ai, all 3 touchpoints automated, pipeline passthrough
- [x] Phase 27: Hybrid Mode — regex+AI blend, graphify-compare.ts comparison tool, hybrid as default mode
- [x] Phase 28-B: Model Benchmark — Accuracy sampling, reliability runs, cost comparison across models
- [x] Phase 29: Quality Pipeline — gate.json, consistency checks, enrichment pipeline
- [x] Phase 30: Genre-Aware Pipeline — 3 genres (xianxia_comedy, galgame_comedy, tech_explainer), comedy arc detection, gag diversity
- [x] Phase 31: Subagent KG Scoring — Tier 1 GLM evaluation, blended scores
- [x] Phase 32: KG Feedback Loop — Context injection, enrichment, calibration
- [x] Phase 33: Dual-LLM Architecture — Three-tier quality, gate v2, CLI, CI mode
- [x] Phase 34: Video Category System — 7 categories, scene templates, episodeforge CLI
- [x] Phase 46: Proactive Story Tools — sg_suggest (8 analyzers), sg_health (6 dimensions)
- [x] Hybrid fuzzy dedup — normalizeForDedup() in dedup.ts, ~10% node inflation reduced
- [x] Artifact extraction — Step 7.7, artifactPatterns in SeriesConfig
- [x] Plot event extraction — Step 7.6, narrator summaries as plot_event nodes
- [x] Batch per-episode HTML — Pipeline step 3, gen-story-html.ts per episode
- [x] Incremental pipeline — --incremental flag, mtime-based skip
- [x] Leiden-inspired community system — Louvain + splitOversized + connectivity refinement, community-based visualization
- [x] Absolute path validation — All 9 scripts reject relative paths
- [x] Federated merge with link edges (same_character, story_continues, gag_evolves)
- [x] vis.js HTML visualization — Episode/Type/Community color modes, info panel, cross-link legend
- [x] Consistency checking — Character drift, gag stagnation, trait coverage, tech term diversity, interaction density
- [x] SKILL.md rewritten as operational playbook with knowledge capture protocol
