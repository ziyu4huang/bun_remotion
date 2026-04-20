# storygraph TODO

> **Cross-linked docs:**
> - Skill PLAN: `.claude/skills/storygraph/PLAN.md` — Architecture, node types, edge relations
> - Skill TODO: `.claude/skills/storygraph/TODO.md` — **(this file)** Pipeline-level tasks, run history
> - Skill SKILL: `.claude/skills/storygraph/SKILL.md` — Operational playbook
> - Code PLAN: `bun_app/storygraph/PLAN.md` — Code-level plan + reuse reference
> - Code TODO: `bun_app/storygraph/TODO.md` — Code-level tasks (file/line specific)
>
> **Rule:** Pipeline/architecture tasks → this file. Code implementation tasks → `bun_app/storygraph/TODO.md`.

> **Status:** v0.29.0 — All core phases complete. Pipeline mature. Remaining: per-episode HTML, incremental updates, dual pipeline merge.

---

## Known Issues

**Hybrid mode (all series):**
- **Duplicate nodes in hybrid mode** — Regex and AI produce different labels for the same concept (regex: `TitleScene`, AI: `title`; regex: `社群偵測`, AI: `community_detection`). Tech terms also duplicate. Estimated ~10% node count inflation. Needs label normalization before merge.
- **Crosslink generator requires Claude for full execution** — `--mode ai` uses GLM, but complex cross-link discovery still benefits from Claude. GLM-5 may work for this simpler task (untested).

**weapon-forger (7 episodes):**
- **`soul` character has no cross-episode links** — Only appears in 1 episode. Expected for single-episode characters; not a bug.
- **8 WARN from regex trait limitations** — Predefined trait patterns miss traits when dialog doesn't match regex. Core traits like `萬物皆可修`, `毒舌警告` are present per PLAN.md but regex misses them in some episodes.

---

## P0 — Fix next

- [ ] **Duplicate node dedup in hybrid mode** — Normalize labels before merging (regex `TitleScene` vs AI `title`, regex `社群偵測` vs AI `community_detection`). Requires label mapping or fuzzy matching in graphify-episode.ts merge step.
- [x] **Absolute path enforcement** — All 9 scripts validate absolute paths at entry.
- [x] **Subagent JSON extraction** — Fixed with truncation repair + maxTokens=4096 in Phase 2C. Robust parsing: markdown fence stripping, array extraction, per-item validation.

---

## P1 — Feature completeness

- [x] **Subagent prompt template** — `bun_app/storygraph/src/scripts/subagent-prompt.ts` with `buildCrossLinkPrompt()` and `buildEpisodeExtractionPrompt()`.
- [x] **Direct AI invocation for cross-links** — Phase 26 `--mode ai` uses pi-agent for all AI touchpoints (cross-links, check enrichment, episode extraction). No manual file handoff.
- [ ] **Algorithm-only cross-links** — Generate `generated_by: "algorithm"` cross-links from PageRank/Jaccard/arc scores without AI. E.g., high-Jaccard episode pairs → `story_anti_pattern` cross-links.
- [ ] **Batch per-episode HTML** — Pipeline generates merged HTML only. Add per-episode HTML generation step: `for each episode: gen-story-html.ts <ep-dir>`.
- [ ] **gag_evolves ID normalization** — Regex creates `${EP_ID}_gag_${gagName.replace(/\s+/g, "_")}`, AI creates `${EP_ID}_gag_${type}`. Different naming conventions. Merge script needs fuzzy ID matching or both pipelines should use same convention.
- [ ] **Trait coverage: PLAN.md character baseline** — Read PLAN.md character personality descriptions and compare against detected traits. Distinguish "regex missed it" (false positive WARN) from "character actually changed" (real drift).
- [ ] **Artifact extraction** — Parse PLAN.md creation tables or scan dialog for creation patterns (飛劍, 丹爐, 系統, 陣法). Create artifact nodes with `creates` edges.
- [ ] **Plot event extraction** — Extract key story beats from narrator TitleScene/OutroScene summaries. Create plot_event nodes.

---

## P2 — Architecture improvements

- [ ] **Incremental updates** — Check `narration.ts` mtime vs `graph.json` mtime. Only re-process changed episodes.
- [x] **Dual pipeline merge** — Hybrid mode (regex + AI) implemented in Phase 27. Regex runs first, AI supplements exclusive nodes/edges, dedup by node ID.
- [ ] **Confidence scoring** — Regex edges: confidence based on pattern match count. AI edges: confidence based on explicit vs inferred. Currently all confidence=1.0.
- [x] **Cross-series support** — Series config system with `detectSeries()`, weapon-forger + my-core-is-boss configs.
- [ ] **PageRank normalization** — Raw scores favor high-degree nodes. Add character-specific filtering or normalized scores for "influential character" use case.
- [ ] **Input size management** — crosslink-input.json grows with series size. Need summarization or chunking strategy for 7+ episode series.
- [ ] **Pipeline step renumbering** — Step 3.5 is awkward. Renumber to: 1=episode, 2=merge, 3=html, 4=check, 5=crosslink, 6=html-re-render.

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
- [x] Leiden-inspired community system — Louvain + splitOversized + connectivity refinement, community-based visualization
- [x] Absolute path validation — All 9 scripts reject relative paths
- [x] Federated merge with link edges (same_character, story_continues, gag_evolves)
- [x] vis.js HTML visualization — Episode/Type/Community color modes, info panel, cross-link legend
- [x] Consistency checking — Character drift, gag stagnation, trait coverage, tech term diversity, interaction density
- [x] SKILL.md rewritten as operational playbook with knowledge capture protocol
