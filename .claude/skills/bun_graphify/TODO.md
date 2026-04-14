# bun_graphify TODO

> **Cross-linked docs:**
> - Skill PLAN: `.claude/skills/bun_graphify/PLAN.md` — Architecture, node types, edge relations
> - Skill TODO: `.claude/skills/bun_graphify/TODO.md` — **(this file)** Pipeline-level tasks, run history
> - Skill SKILL: `.claude/skills/bun_graphify/SKILL.md` — Operational playbook
> - Code PLAN: `bun_app/bun_graphify/PLAN.md` — Code-level plan + reuse reference
> - Code TODO: `bun_app/bun_graphify/TODO.md` — Code-level tasks (file/line specific)
>
> **Rule:** Pipeline/architecture tasks → this file. Code implementation tasks → `bun_app/bun_graphify/TODO.md`.

> **Status:** v0.6.0 — Series config system, my-core-is-boss support, Phase 23 types, HTML escape

## Known Issues (from 2026-04-14 v0.5.0 pipeline run)

- **`soul` has no same_character links** — Only 1 episode instance → no cross-episode link possible. Expected for single-episode characters.
- **8 WARN all from regex trait limitations** — Predefined trait patterns miss traits when dialog doesn't match regex. `萬物皆可修`, `毒舌警告` etc. are core traits per PLAN.md but regex misses them in some episodes. **Root cause:** regex pipeline uses pattern matching; subagent would catch these.
- **ch3ep1 has only 3 tech terms** — Below the diversity threshold but only a WARN, not a FAIL.
- **No artifact nodes** — Zhou Mo's creations (飛劍, 丹爐, 自動評價系統, 雷射筆) are the series premise but not tracked in KG. Requires NL extraction or PLAN.md artifacts table parsing.
- **No plot_event nodes** — Key story beats ("sword steals bag", "books attack", "self-destruct") absent. Requires NL extraction or narrator summary parsing.

## P0 — Fix next

- [ ] **Subagent JSON extraction is fragile** — 2/7 episodes had broken JSON in prior runs. Need robust extraction: try JSON.parse → fix trailing commas → fix single quotes → `jsonrepair` npm package → re-run subagent.
- [x] **Absolute path requirement not enforced in scripts** — graphify-episode.ts and graphify-merge.ts now validate absolute paths at entry.

## P1 — Feature completeness

- [x] **Subagent prompt template** — Extracted into `bun_app/bun_graphify/src/scripts/subagent-prompt.ts` as `buildCrossLinkPrompt()`.
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

## Phase 23 — AI Cross-Link Discovery 🔲

### P0 — Data model
- [x] **Define StoryCrossLink type** — Added to `src/types.ts`: link_type union, confidence, evidence, generated_by, rationale
- [ ] **Extend merged-graph.json schema** — Add `cross_links` array alongside `nodes`, `edges`, `link_edges`

### P1 — Graph algorithms
- [x] **PageRank for characters** — `story-algorithms.ts`: `computePageRank()` via graphology-pagerank
- [x] **Jaccard similarity for episodes** — `story-algorithms.ts`: `computeJaccardSimilarity()` comparing node types + edge patterns
- [x] **Character arc score** — `story-algorithms.ts`: `computeCharacterArcScore()` measures trait drift along same_character chains
- [x] **Gag evolution depth score** — `story-algorithms.ts`: `computeGagEvolutionScore()` measures word-level variation

### P2 — AI generation
- [x] **Subagent prompt template for cross-links** — `subagent-prompt.ts`: `buildCrossLinkPrompt()` with graph summary + metrics
- [ ] **ai-crosslink-generator.ts** — Orchestrate: read merged graph → call subagent → parse JSON → write cross_links
- [ ] **Pipeline integration** — graphify-pipeline.ts step 4: run algorithms → run AI generator → write results

### P3 — Visualization
- [ ] **vis.js AI cross-link rendering** — Dotted lines, distinct colors per link_type, confidence opacity
- [ ] **PageRank glow effect** — High-rank nodes get highlighted border
- [ ] **Cross-link legend + toggle** — Separate from deterministic link edges

---

## Pipeline Run History

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

**Result:** Clean rerun after removing bun_graphify_out. Stats match expected v0.5.0 output for this episode.

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
