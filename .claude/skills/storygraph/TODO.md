# storygraph TODO

> **Cross-linked docs:**
> - Skill PLAN: `.claude/skills/storygraph/PLAN.md` — Architecture, node types, edge relations
> - Skill TODO: `.claude/skills/storygraph/TODO.md` — **(this file)** Pipeline-level tasks, run history
> - Skill SKILL: `.claude/skills/storygraph/SKILL.md` — Operational playbook
> - Code PLAN: `bun_app/storygraph/PLAN.md` — Code-level plan + reuse reference
> - Code TODO: `bun_app/storygraph/TODO.md` — Code-level tasks (file/line specific)
>
> **Rule:** Pipeline/architecture tasks → this file. Code implementation tasks → `bun_app/storygraph/TODO.md`.

> **Status:** v0.12.0 — Phase 23 complete, Phase 26 complete, Phase 27 (hybrid mode + comparison) complete, Phase 24-E (pacing) complete

## Known Issues (from 2026-04-15 v0.6.0 pipeline run)

**my-core-is-boss (2 episodes):**
- ~~**4 WARN all character consistency**~~ — Fixed in v0.7.1: raised core-trait threshold from 50% to 75%, added trait comparison table + LLM enrichment. Now 7 PASS, 0 WARN.
- **No gag_evolves links** — Only 2 episodes in the same chapter share identical gag manifestations from `plot-lines.md`. `gag_evolves` requires ≥2 distinct manifestations per gag type, which needs episodes across multiple chapters.
- **No artifact / plot_event nodes** — Game items (跳過按鈕, 寶箱, 系統面板) and story beats are not tracked. Requires NL extraction or subagent analysis.

**weapon-forger (7 episodes, last run v0.5.0):**
- **`soul` has no same_character links** — Only 1 episode instance → no cross-episode link possible. Expected for single-episode characters.
- **8 WARN all from regex trait limitations** — Predefined trait patterns miss traits when dialog doesn't match regex. `萬物皆可修`, `毒舌警告` etc. are core traits per PLAN.md but regex misses them in some episodes. **Root cause:** regex pipeline uses pattern matching; subagent would catch these.
- **ch3ep1 has only 3 tech terms** — Below the diversity threshold but only a WARN, not a FAIL.
- **No artifact nodes** — Zhou Mo's creations (飛劍, 丹爐, 自動評價系統, 雷射筆) are the series premise but not tracked in KG. Requires NL extraction or PLAN.md artifacts table parsing.
- **No plot_event nodes** — Key story beats ("sword steals bag", "books attack", "self-destruct") absent. Requires NL extraction or narrator summary parsing.

**Cross-cutting:**
- **Subagent JSON extraction is fragile** — 2/7 weapon-forger episodes had broken JSON in prior runs. Need robust extraction: try JSON.parse → fix trailing commas → fix single quotes → `jsonrepair` npm package.
- **AI cross-link invocation is manual** — Pipeline writes `crosslink-input.json` but doesn't call Claude directly. Requires manual subagent step (read input → send to Claude → write output → re-run generator). **Phase 26 adds `--mode ai`** to replace file-based handoff with direct pi-agent API calls.
- **No algorithm-only cross-links** — `generated_by: "algorithm"` type is defined but never generated. PageRank/Jaccard/arc scores are only used as prompt context, not as cross-link outputs.
- **PageRank bias toward high-degree nodes** — Raw PageRank scores favor plot nodes and scenes (highest degree). Character-specific filtering or normalized PageRank would be more meaningful for "influential character" use case.
- **crosslink-input.json size** — 66KB for 5 episodes (109 nodes). Larger series (weapon-forger: 7 eps, 156 nodes) may produce input exceeding LLM context limits. Need summarization strategy.

## P0 — Fix next

- [ ] **Subagent JSON extraction is fragile** — 2/7 episodes had broken JSON in prior runs. Need robust extraction: try JSON.parse → fix trailing commas → fix single quotes → `jsonrepair` npm package → re-run subagent.
- [x] **Absolute path requirement not enforced in scripts** — graphify-episode.ts and graphify-merge.ts now validate absolute paths at entry.

## P1 — Feature completeness

- [x] **Subagent prompt template** — Extracted into `bun_app/storygraph/src/scripts/subagent-prompt.ts` as `buildCrossLinkPrompt()`.
- [ ] **Direct AI invocation for cross-links** — ~~Add `--api` flag to ai-crosslink-generator.ts that calls Claude API directly~~ **Superseded by Phase 26** — `--mode ai` uses pi-agent for all AI touchpoints (cross-links, check enrichment, episode extraction)
- [ ] **Algorithm-only cross-links** — Generate `generated_by: "algorithm"` cross-links from PageRank/Jaccard/arc scores without AI. E.g., high-Jaccard episode pairs → `story_anti_pattern` cross-links.
- [ ] **Batch per-episode HTML** — Pipeline only generates merged HTML. Add per-episode HTML generation step: `for each episode: gen-story-html.ts <ep-dir>`.
- [ ] **gag_evolves ID normalization** — Regex creates `${EP_ID}_gag_${gagName.replace(/\s+/g, "_")}`, subagent creates `${EP_ID}_gag_${type}`. Different naming conventions. Merge script needs fuzzy ID matching or both pipelines should use same convention.
- [ ] **Trait coverage: PLAN.md character baseline** — Read PLAN.md character personality descriptions and compare against detected traits. This would distinguish "regex missed it" (false positive WARN) from "character actually changed" (real drift).
- [ ] **Artifact extraction** — Parse PLAN.md "標志性原創法寶" table or scan zhoumo dialog for creation patterns (飛劍, 丹爐, 系統, 陣法). Create artifact nodes with `creates` edges.
- [ ] **Plot event extraction** — Extract key story beats from narrator's TitleScene/OutroScene summaries. Create plot_event nodes.

## P2 — Architecture improvements

- [ ] **Incremental updates** — Check `narration.ts` mtime vs `graph.json` mtime. Only re-process changed episodes.
- [ ] **Dual pipeline merge** — Support mixing regex pipeline output (fast, shallow) with subagent output (slow, rich) for the same episode. Merge by node ID prefix matching.
- [ ] **Confidence scoring** — Regex edges: confidence based on pattern match count. Subagent edges: confidence based on explicit vs inferred. Currently all confidence=1.0.
- [ ] **Cross-series support** — Auto-detect series type (weapon-forger, galgame-meme-theater) and adapt node types/edge relations. ✅ Series config system added — `series-config.ts` with `detectSeries()`
- [ ] **PageRank normalization** — Raw PageRank favors high-degree nodes. Add character-specific filtering or normalized scores for "influential character" use case.
- [ ] **Input size management** — crosslink-input.json is 66KB for 5 episodes. Need summarization or chunking strategy for larger series (7+ episodes).
- [ ] **Pipeline step renumbering** — Step 3.5 is awkward. Renumber to: 1=episode, 2=merge, 3=html, 4=check, 5=crosslink, 6=html-re-render.

## Phase 26 — Dual-Mode Pipeline with pi-agent AI Integration

> Replaces manual file-based subagent handoff with direct pi-agent API calls.
> Orthogonal to Phase 24 (story quality) — benefits all phases that use subagent calls.

### P0 — Core infrastructure

- [ ] **26-A1: ai-client.ts** — pi-ai SDK wrapper
  - `callAI(prompt, options)` with provider/model selection, JSON mode, retry
  - Default: `zai` / `glm-4.5-flash`, fallback: graceful degradation to regex
  - `parseArgsForAI(args)` to extract `--mode`, `--provider`, `--model` from CLI args
  - File: `bun_app/storygraph/src/ai-client.ts`
  - Depends on: `@mariozechner/pi-ai` in package.json

- [ ] **26-A2: Add pi-ai dependency** — storygraph package.json
  - `bun add --cwd bun_app/storygraph @mariozechner/pi-ai`
  - Optional peer dep: graphify still works without API key (regex mode)

### P1 — AI touchpoint automation (3 touchpoints)

- [ ] **26-B1: Episode NL extraction (--mode ai)** — Replace Claude Code subagent with direct API call
  - New `buildEpisodeExtractionPrompt()` in subagent-prompt.ts
  - graphify-episode.ts: when `--mode ai`, call pi-agent instead of regex Steps 2-7
  - Parse JSON response into GraphNode[] + GraphEdge[] (same format as regex output)
  - Validate node IDs against series config, fall back to regex on failure
  - File: `graphify-episode.ts`, `subagent-prompt.ts`

- [ ] **26-B2: Cross-link discovery (--mode ai)** — Replace file handoff with direct API call
  - ai-crosslink-generator.ts: when `--mode ai`, call `callAI(prompt)` instead of write-then-stop
  - Reuse existing `buildCrossLinkPrompt()` + `validateCrossLinks()` logic
  - Parse response, patch merged-graph.json, continue pipeline
  - File: `ai-crosslink-generator.ts`

- [x] **26-B3: Check enrichment (--mode ai)** — Replace file handoff with direct API call
  - graphify-check.ts: when `--mode ai`, call `callAI(prompt)` after writing enrichment input
  - Write `check-enrichment-output.md` from API response
  - File: `graphify-check.ts`

### P2 — Pipeline integration

- [x] **26-C1: Pipeline --mode ai passthrough** — graphify-pipeline.ts passes `--mode ai` to all subprocess calls
  - Each `Bun.spawnSync` call appends `--mode ai --provider X --model Y` if specified
  - Pipeline runs end-to-end without human intervention in ai mode
  - File: `graphify-pipeline.ts`

- [ ] **26-C2: SKILL.md operation update** — Document `--mode ai` in episode.md and pipeline.md operations
  - Add CLI examples for both modes
  - Note: Claude Code subagent still works in regex mode for richer analysis
  - Files: `.claude/skills/storygraph/operations/episode.md`, `operations/pipeline.md`

- [x] **26-C3: Compare AI mode vs regex extraction quality** — Benchmark complete (my-core-is-boss, 5 episodes)
  - **Result:** AI mode produces 3 exclusive node types (plot_event, gag_manifestation, artifact) and 3 exclusive edge relations (triggers, relates_to, uses) that regex cannot detect. Regex produces more traits (31 vs 18) and tech terms (29 vs 21) due to exhaustive pattern matching. AI fixes ch2ep2 trait gap (1→3 chars w/ trait). AI mode triggers more WARN/FAIL (15/6 vs regex 6/2) due to sparse trait edges. Trade-off: AI = richer types but sparser; Regex = denser but fewer types.
  - See run history for full comparison table.

---

## Phase 23 — AI Cross-Link Discovery ✅

### P0 — Data model
- [x] **Define StoryCrossLink type** — Added to `src/types.ts`: link_type union, confidence, evidence, generated_by, rationale
- [x] **Extend merged-graph.json schema** — Added optional `cross_links` array alongside `nodes`, `edges`, `link_edges`

### P1 — Graph algorithms
- [x] **PageRank for characters** — `story-algorithms.ts`: `computePageRank()` via graphology-pagerank
- [x] **Jaccard similarity for episodes** — `story-algorithms.ts`: `computeJaccardSimilarity()` comparing node types + edge patterns
- [x] **Character arc score** — `story-algorithms.ts`: `computeCharacterArcScore()` measures trait drift along same_character chains
- [x] **Gag evolution depth score** — `story-algorithms.ts`: `computeGagEvolutionScore()` measures word-level variation

### P2 — AI generation
- [x] **Subagent prompt template for cross-links** — `subagent-prompt.ts`: `buildCrossLinkPrompt()` with graph summary + metrics
- [x] **ai-crosslink-generator.ts** — File-based subagent orchestration: read merged graph → compute metrics → build prompt → write input → read output → validate → patch
- [x] **Pipeline integration** — graphify-pipeline.ts step 3.5: run generator, re-render HTML if cross_links added

### P3 — Visualization
- [x] **vis.js AI cross-link rendering** — Dotted lines, distinct colors per link_type (pink/gold/teal/red-pink), confidence in tooltip
- [x] **PageRank glow effect** — Top 10% nodes get borderWidth:4 + shadow effect
- [x] **Cross-link legend + toggle** — Checkbox toggle, dotted-line legend items, separate from deterministic link edges

---

## Pipeline Run History

### 2026-04-18 v0.10.0 — Phase 26-B3/C1 completion

| Task | Status | Details |
|------|--------|---------|
| 26-B3: Check enrichment --mode ai | **Complete** | `graphify-check.ts` adds `buildEnrichmentPrompt()` + `callAI()` for direct LLM analysis |
| 26-C1: Pipeline --mode ai passthrough | **Complete** | `graphify-pipeline.ts` builds `aiFlags[]` and passes to episode/check/crosslink spawns |

**Changes:**
- `graphify-check.ts`: `parseArgsForAI(args)`, `--mode ai` branch calls `callAI()` directly, writes `check-enrichment-output.md`, falls back gracefully
- `graphify-pipeline.ts`: `aiFlags[]` array propagated to all 3 `Bun.spawnSync` calls (episode, check, crosslink)
- Pipeline now supports end-to-end `--mode ai` without manual subagent file handoff

### 2026-04-18 v0.10.0 — Phase 26-C3: AI vs Regex extraction comparison (my-core-is-boss, 5 episodes)

**Per-Episode Node & Link Counts:**

| Episode | Regex N | AI N | Δ | Regex L | AI L | Δ |
|---------|---------|------|---|---------|------|---|
| ch1-ep1 | 33 | 24 | -9 | 42 | 28 | -14 |
| ch1-ep2 | 21 | 23 | +2 | 24 | 20 | -4 |
| ch1-ep3 | 23 | 24 | +1 | 28 | 26 | -2 |
| ch2-ep1 | 19 | 20 | +1 | 26 | 21 | -5 |
| ch2-ep2 | 13 | 24 | +11 | 19 | 27 | +8 |
| **TOTAL** | **109** | **115** | **+6** | **139** | **122** | **-17** |

**Node Type Coverage:**

| Node Type | Regex | AI | Regex-only | AI-only |
|-----------|-------|-----|-----------|---------|
| artifact | 0 | 6 | | ✓ |
| character_instance | 19 | 19 | | |
| character_trait | 31 | 18 | | |
| episode_plot | 5 | 5 | | |
| gag_manifestation | 0 | 11 | | ✓ |
| plot_event | 0 | 16 | | ✓ |
| scene | 25 | 19 | | |
| tech_term | 29 | 21 | | |

**Edge Relation Diversity:**

| Relation | Regex | AI | AI-only |
|----------|-------|-----|---------|
| appears_in | 19 | 25 | |
| character_speaks_like | 31 | 18 | |
| interacts_with | 26 | 7 | |
| part_of | 25 | 19 | |
| relates_to | 0 | 12 | ✓ |
| triggers | 0 | 13 | ✓ |
| uses | 0 | 5 | ✓ |
| uses_tech_term | 38 | 23 | |

**Character Trait Coverage (chars with ≥1 trait):**

| Episode | Regex | AI |
|---------|-------|-----|
| ch1-ep1 | 3/4 | 3/4 |
| ch1-ep2 | 2/3 | 2/3 |
| ch1-ep3 | 3/4 | 2/4 |
| ch2-ep1 | 3/4 | 1/4 |
| ch2-ep2 | 1/4 | 3/4 |

**Consistency Check:** AI mode: 10 PASS, 15 WARN, 6 FAIL (vs regex: typically 14 PASS, 6 WARN).

**Key Findings:**
1. AI produces 3 exclusive node types (plot_event, gag_manifestation, artifact) — structurally richer
2. AI produces 3 exclusive edge relations (triggers, relates_to, uses) — causality + thematic connections
3. Regex produces more traits (31 vs 18) and tech terms (29 vs 21) — exhaustive pattern matching
4. AI fixes ch2ep2 trait gap (1→3 chars w/ trait) — metaphor-format traits that regex misses
5. AI sparser on interacts_with (7 vs 26) — misses implicit interactions
6. AI triggers more WARN/FAIL due to sparser trait edges reducing trait coverage scores

**Recommendation:** Hybrid approach — run regex first for dense extraction, then AI for plot_event/gag/artifact/triggers/relates_to types. Merge both into a richer graph.

### 2026-04-18 v0.8.0 — Phase 23 implementation (my-core-is-boss, 5 episodes)

| Metric | Before (v0.7.1) | After (v0.8.0) |
|--------|-----------------|----------------|
| Pipeline steps | 3 (episode → merge → check) | **4 (episode → merge → html → check → crosslink)** |
| Phase 23 code | Types + algorithms + prompt only | **Full: generator + pipeline + visualization** |
| crosslink-input.json | — | **66KB (prompt + graph + metrics)** |
| HTML features | Episode/Type/Community coloring, link edges | **+ AI cross-links (dotted), PageRank glow, toggle** |

**Changes applied:**
- `ai-crosslink-generator.ts`: file-based subagent orchestration (metrics → prompt → validate → patch)
- `gen-story-html.ts`: AI cross-link dotted edges, PageRank glow (top 10%), cross-link legend + toggle, PageRank in tooltips
- `graphify-pipeline.ts`: step 3.5 (crosslink generator + HTML re-render if cross_links added)
- `subagent-prompt.ts`: exported NodeSummary, EdgeSummary interfaces
- Robust JSON parsing: markdown fence stripping, array extraction, per-item node ID validation

**Bun 1.3.11 parser issue:** `?.` optional chaining inside multi-line arrow function callbacks within `.map()` causes "Unexpected }" error. Workaround: use ternary `(x ? x.prop : false)` instead.

### 2026-04-18 — my-core-is-boss (5 episodes, ch2-ep2 added)

| Metric | Before (4 eps) | After (5 eps) |
|--------|----------------|----------------|
| Per-episode nodes | 19-33 | **13-33** (ch2ep2: 13) |
| Per-episode edges | 24-42 | **19-42** (ch2ep2: 19) |
| Merged nodes | 95 | **109** |
| Merged edges | 164 | **215** |
| Link edges | 24 | **40** |
| Communities | 8 | **7** |
| Consistency | 16 PASS, 2 WARN | **14 PASS, 6 WARN** |

**New WARNs from ch2ep2:**
- Trait Coverage: ch2ep2 linyi has 0 detected traits (regex missed "遊戲化世界觀")
- Trait Coverage: ch2ep2 zhaoxiaoqi has 0 detected traits (regex missed "選擇性聽力")
- Character Consistency: ch2ep2 xiaoelder missing core trait "三觀崩塌中"
- All 3 are regex extraction gaps, not story-level issues. Human review confirms traits are present in dialog.

**Root cause:** ch2ep2 uses metaphor-format brain-補 lines ("刷新率=天道輪迴") that don't match regex patterns designed for direct trait descriptors ("遊戲化世界觀", "選擇性聽力"). Suggests need for LLM-assisted trait extraction as P1.

**Key lesson:** Episode pipeline must run `/storygraph` BEFORE subagent analysis. Previously skipped 3a → subagent fabricated node counts (claimed 22/30, real was 13/19). Updated `episode-creation.md` with verification gate to prevent this.

### 2026-04-15 v0.7.1 — my-core-is-boss (2 episodes, check improvements)

| Metric | Before (v0.6.0) | After (v0.7.1) |
|--------|-----------------|----------------|
| Consistency | 5 PASS, 4 WARN | **7 PASS, 0 WARN** |
| Core-trait threshold | 50% (false positives) | **75% (shared-only)** |
| Trait comparison table | — | **Per-character, stable/variant** |
| LLM enrichment | — | **Subagent-generated zh_TW analysis** |
| Enrichment files | — | **check-enrichment-input.json + output.md** |

**Changes applied:**
- Core-trait threshold raised from 50% to 75%: with 2 episodes, only shared traits are "core"
- CharTraitComparison interface + comparison data extraction from checkCharacterConsistency()
- Trait comparison table in report: per-character, episode columns, stable/variant status
- Subagent enrichment pipeline: writes enrichment-input.json, reads enrichment-output.md
- Narrator skipped in comparison table (no traits)
- Character label cleaned (stripped episode suffix)

**LLM enrichment observations:**
- linyi's 5 ep1-only traits are natural first-episode character establishment
- zhaoxiaoqi's variant traits (過度解讀/主動腦補) are the same behavioral pattern described differently
- Series health: excellent, no modifications needed

### 2026-04-15 v0.7.0 — weapon-forger (7 episodes, Leiden community system)

| Metric | Before (v0.5.0) | After (v0.7.0) |
|--------|-----------------|----------------|
| Per-episode nodes | 24-28 | 22-25 |
| Per-episode edges | 25-39 | 27-39 |
| Merged nodes | 177 | 156 |
| Merged edges | 371 | 332 |
| Link edges | 85 | 67 |
| Communities | 8 | 8 |
| Consistency | 13 PASS, 8 WARN | **19 PASS, 11 WARN** |
| Community checks | — | **3 new: structure, isolated, cross-community** |
| Community analysis | — | **modularity=0.59, 0 isolated, 35 bridges** |
| Surprising connections | — | **50 cross-community edges** |
| HTML color modes | 2 (episode, type) | **3 (+ community)** |

**Changes applied:**
- Leiden-inspired community detection: Louvain + oversized split + connectivity refinement
- Community analysis: cohesion, modularity contribution, labels, bridge/god/isolated node detection
- 3 new consistency checks: Community Structure, Isolated Nodes, Cross-Community Coherence
- Community-based color mode in vis.js HTML with cohesion-coded legend
- Enhanced MERGED_REPORT.md: Community Health, Surprising Connections, Bridge Nodes sections
- Community info in node detail panel (cohesion, bridge/god/isolated flags)

### 2026-04-15 v0.6.0 — my-core-is-boss (2 episodes, series config + regex pipeline)

| Metric | Before (v0.5.0) | After (v0.6.0) |
|--------|-----------------|----------------|
| Per-episode nodes | 10 | 21–32 |
| Per-episode edges | 11–15 | 24–41 |
| Merged nodes | 20 | **53** |
| Merged edges | 33 | **72** |
| Link edges | 4 | 4 |
| Communities | 4 | 5 |
| Consistency | 2 PASS, 6 WARN | **5 PASS, 4 WARN** |
| Tech terms | 1 | **17** |
| Character traits | 0 | **17** |
| Node types | ep_plot(2), scene(10), char(7), tech(1) | ep_plot(2), scene(10), char(7), **tech(17)**, **trait(17)** |

**Changes applied:**
- Series config system (`series-config.ts`) with weapon-forger + my-core-is-boss configs
- my-core-is-boss patterns: 4 characters (linyi, zhaoxiaoqi, xiaoelder, chenmo), game-UI tech terms, plot-lines.md gag source
- Absolute path validation in episode + merge scripts
- HTML escape in gen-story-html.ts
- Phase 23 foundation: StoryCrossLink type, story-algorithms.ts (PageRank, Jaccard, arc/evolution scores), subagent-prompt.ts
- graphology-pagerank dependency added
- Generic episode detection in narrative.ts

**Observations:**
- No gag nodes from plot-lines.md — table parsed but gag_evolves links require ≥2 manifestations per gag type, which needs episodes across multiple chapters
- 4 WARN all character consistency — legitimate trait differences between episode instances (dialog varies per scene)
- ch1ep1 has 32 nodes (rich dialog with xiaoelder), ch1ep2 has 21 nodes (fewer characters)

### 2026-04-14 — weapon-forger-ch1-ep1 single episode rerun

| Metric | Value |
|--------|-------|
| Nodes | 24 |
| Links | 25 |
| Communities | 3 |
| Node types | episode_plot(1), scene(4), character_instance(3), tech_term(8), gag_manifestation(3), character_trait(5) |
| Output files | graph.json, graph.html, .narrative_extract.json, plan.json |

**Result:** Clean rerun after removing storygraph_out. Stats match expected v0.5.0 output for this episode.

### 2026-04-15 v0.5.0 — my-core-is-boss (2 episodes, regex pipeline)

| Metric | Value |
|--------|-------|
| Per-episode nodes | 10 per ep |
| Per-episode edges | 11 (ch1ep2) — 15 (ch1ep1) |
| Merged nodes | 20 |
| Merged edges | 33 |
| Link edges | 4 (3 same_character + 1 story_continues) |
| Communities | 4 |
| Consistency | 2 PASS, 6 WARN, 0 FAIL |
| Node types | episode_plot(2), scene(10), character_instance(7), tech_term(1) |

**Observations:**
- No gag nodes — PLAN.md uses `assets/story/plot-lines.md` for gag tracking, not PLAN.md gag table
- No character_trait nodes — regex trait patterns are weapon-forger-specific, no patterns for linyi/zhaoxiaoqi/xiaoelder
- Only 1 tech_term across both episodes — regex misses game-UI terms (跳過, UI, bug, Lv, etc.)
- ch1ep1 has 3 character instances (linyi, zhaoxiaoqi, xiaoelder) + narrator; ch1ep2 has 2 + narrator

### 2026-04-14 v0.5.0 — weapon-forger (7 episodes, regex pipeline + improvements)

| Metric | Value |
|--------|-------|
| Per-episode nodes | 24-28 (was 20-26, +4 scene nodes) |
| Per-episode edges | 25-39 |
| Merged nodes | 177 (was 150, +28 scene nodes) |
| Merged edges | 371 (was 268, +28 part_of + all-pairs same_character) |
| Link edges | 85 (was 43, +42 all-pairs same_character) |
| Communities | 8 |
| Consistency | 13 PASS, 8 WARN, 0 FAIL |
| Gag coverage | 21/21 (was 18/21, fixed ch2ep3) |
| Scene nodes | 28 (4 per episode, new) |
| Node types | episode_plot(7), scene(28), character_instance(29), tech_term(36), gag_manifestation(21), character_trait(56) |

**Fixes applied:**
- ch2ep3 gag nodes fixed (PLAN.md table was missing Ch2-Ep3 column)
- same_character now all-pairs (not just sequential)
- Narrator excluded from uses_tech_term edges, marked as structural role
- Scene nodes added (TitleScene, ContentScene1, ContentScene2, OutroScene per ep)
- Stale codebase-mode artifacts cleaned (GRAPH_REPORT.md, series graph.json)
- Pipeline Step 0 auto-cleans stale artifacts

### 2026-04-14 v0.4.0 — weapon-forger (7 episodes, regex pipeline)

| Metric | Value |
|--------|-------|
| Per-episode nodes | 20 (ch1ep3) — 26 (ch2ep2) |
| Per-episode edges | 23 (ch1ep3) — 37 (ch2ep2) |
| Merged nodes | 150 |
| Merged edges | 268 |
| Link edges | 43 (22 same_character, 6 story_continues, 15 gag_evolves) |
| Communities | 11 |
| Consistency | 13 PASS, 8 WARN, 0 FAIL |
| Known gaps | ch2ep3 missing 3 gag nodes, soul character only 1 ep |

### Previous (v0.3.0) — weapon-forger (7 episodes, mixed regex+subagent)

| Metric | Value |
|--------|-------|
| Merged nodes | 285 (included canonical/arc/gag_type nodes) |
| Merged edges | 451 |
| Link edges | 45 |
| Consistency | 8 PASS, 38 WARN, 0 FAIL |

**Improvement:** 150 nodes (no bloat) vs 285, 8 WARN vs 38 WARN, 0 FAIL maintained.

## Done

- [x] **v0.6.0: Series config system** — `series-config.ts` with `detectSeries()`, weapon-forger + my-core-is-boss configs
- [x] **v0.6.0: plot-lines.md gag parsing** — graphify-episode.ts + graphify-merge.ts support chapter-column gag tables from `assets/story/plot-lines.md`
- [x] **v0.7.0: Leiden-inspired community system** — Louvain + splitOversized + connectivity refinement in cluster.ts (leidenCluster, refineCommunities, analyzeCommunities)
- [x] **v0.7.0: Community analysis types** — CommunityReport, CommunityAnalysis, NodeCommunityInfo, SurprisingConnection in types.ts
- [x] **v0.7.0: Community-based consistency checks** — Community Structure (modularity), Isolated Nodes (no intra-community edges), Cross-Community Coherence (cross-edge ratio)
- [x] **v0.7.0: Community visualization** — "By Community" color mode, cohesion-coded legend, bridge/god/isolated flags in node info panel
- [x] **v0.7.0: Enhanced merge report** — Community Health (modularity, avg cohesion, splits), Surprising Connections, Bridge Nodes sections
- [x] **v0.6.0: my-core-is-boss KG** — 53 nodes, 72 edges, 17 tech terms, 17 character traits (was 20/33/1/0)
- [x] **v0.6.0: Phase 23 foundation** — StoryCrossLink type, story-algorithms.ts (PageRank, Jaccard, arc/evolution), subagent-prompt.ts
- [x] **v0.8.0: Phase 23 completion** — ai-crosslink-generator.ts (file-based subagent orchestration), pipeline step 3.5, AI cross-link dotted edges, PageRank glow, cross-link legend + toggle
- [x] **v0.6.0: Absolute path validation** — graphify-episode.ts + graphify-merge.ts reject relative paths
- [x] **v0.6.0: HTML escape** — gen-story-html.ts escapeHtml() on all dynamic content
- [x] **v0.6.0: Generic episode detection** — narrative.ts uses generic pattern, no series-specific hardcoded regex
- [x] Simplified merge — no canonical/arc/gag_type nodes, pure concatenation + link edges
- [x] Episode-based coloring for merged graph HTML (default: By Episode, toggle: By Type)
- [x] Link edges rendered dashed with distinct colors per type
- [x] Auto-detect series pattern (generic `-chN-epM`, not hardcoded `weapon-forger`)
- [x] SKILL.md rewritten as operational playbook with knowledge capture protocol
- [x] graphify-check.ts aligned with both regex and subagent edge relations
- [x] Pipeline step 2.5: merged HTML generation
- [x] Per-episode story KG from narration.ts (regex + subagent)
- [x] Federated merge with link edges (same_character, story_continues, gag_evolves)
- [x] Consistency checking (character drift, gag stagnation, trait coverage, tech term diversity, interaction density)
- [x] vis.js HTML visualization
- [x] Memory/feedback capture for lessons learned
- [x] Character detection: text-mention fallback — CHAR_NAMES mapping in graphify-episode.ts detects characters mentioned in narration text (not just `character:` fields)
- [x] Gag detection without PLAN.md column — fallback logic checks `colEpId === EP_ID` + truthy manifestation, works even without explicit column
- [x] ch2ep3 gag fix — PLAN.md gag table was missing Ch2-Ep3 column; added with correct manifestations
- [x] same_character all-pairs — graphify-merge.ts now links all episode pairs sharing a character (not just sequential)
- [x] Narrator role — marked as structural; excluded from uses_tech_term edge generation
- [x] Scene nodes — 4 per episode (TitleScene, ContentScene1, ContentScene2, OutroScene) with part_of edges
- [x] Stale artifact cleanup — Pipeline Step 0 removes GRAPH_REPORT.md and stale codebase-mode graph.json
