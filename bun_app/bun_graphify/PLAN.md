# bun_graphify — Code Plan

> **Cross-linked docs:**
>
> This file | Skill folder
> ---|---
> `bun_app/bun_graphify/PLAN.md` | `.claude/skills/bun_graphify/PLAN.md` — Full architecture, node types, edge relations
> `bun_app/bun_graphify/TODO.md` | `.claude/skills/bun_graphify/TODO.md` — Pipeline-level tasks, run history, known issues
> — | `.claude/skills/bun_graphify/SKILL.md` — Operational playbook, commands, knowledge capture
>
> **Rule:** Architecture decisions → skill PLAN.md. Code-level tasks → this TODO.md.

## Current State (v0.6.0)

See `.claude/skills/bun_graphify/PLAN.md` for full architecture.

**Working:**
- Regex pipeline: per-episode extraction from narration.ts (series-config-driven)
- Series config system: auto-detect series, load character/tech/gag patterns
- Simplified merge: concatenate sub-graphs + cross-episode link edges (no synthetic nodes)
- Episode-based coloring in merged HTML visualization
- Consistency checking via link edge traversal
- Auto-detect series pattern (generic `-chN-epM`)
- Absolute path validation in episode + merge scripts
- HTML escape in gen-story-html.ts
- SKILL.md as operational playbook with knowledge capture

**Phase 23 foundation (partial):**
- StoryCrossLink type + CrossLinkType union in types.ts
- story-algorithms.ts: PageRank, Jaccard similarity, character arc score, gag evolution score
- subagent-prompt.ts: buildCrossLinkPrompt() with graph summary + metrics
- graphology-pagerank dependency

**Code-level tasks:** See `TODO.md` (same directory)

## Existing Files to Reuse

| File | What to Reuse |
|------|--------------|
| `src/extract/narrative.ts` | `parseNarration()`, `extractSeriesNarrative()`, `narrativeToCorpus()`, `detectEpisodes()` |
| `src/scripts/series-config.ts` | `SeriesConfig`, `detectSeries()`, `getSeriesConfigOrThrow()`, series configs |
| `src/scripts/story-algorithms.ts` | `computePageRank()`, `computeJaccardSimilarity()`, `computeCharacterArcScore()`, `computeGagEvolutionScore()` |
| `src/scripts/subagent-prompt.ts` | `buildCrossLinkPrompt()` — generates cross-link discovery prompt |
| `src/cli.ts` | `cmdFull()`, `cmdExtract()` — AST extraction pipeline |
| `src/build.ts` | `buildFromExtraction()` — graph building |
| `src/cluster.ts` | `cluster()`, `splitOversized()` — community detection |
| `src/export/` | `writeGraphJSON()`, `writeGraphHTML()` — export |
| `src/report.ts` | `writeReport()` — report generation |
| `src/types.ts` | `GraphNode`, `GraphEdge`, `ExtractionResult`, `StoryCrossLink`, `CrossLinkType` — shared types |

## Phase 23 — AI Cross-Link Discovery (partial)

See `.claude/skills/bun_graphify/PLAN.md` Phase 23 for architecture.

### Done Files

| File | Purpose |
|------|---------|
| `src/scripts/story-algorithms.ts` | ✅ PageRank, Jaccard similarity, character arc score, gag evolution score |
| `src/scripts/subagent-prompt.ts` | ✅ Cross-link discovery prompt builder with graph summary + metrics |
| `src/types.ts` | ✅ StoryCrossLink interface, CrossLinkType union |

### Remaining New Files

| File | Purpose |
|------|---------|
| `src/scripts/ai-crosslink-generator.ts` | 🔲 Claude subagent call, JSON parsing, cross-link edge creation |

### Remaining Files to Modify

| File | Change |
|------|--------|
| `src/scripts/graphify-pipeline.ts` | 🔲 Add step 4: run story-algorithms + ai-crosslink-generator |
| `src/scripts/gen-story-html.ts` | 🔲 Render AI cross-links (dotted lines, colors, PageRank glow) |
| `src/scripts/graphify-merge.ts` | 🔲 Include cross_links in merged output schema |

### Dependencies

- `graphology` + `graphology-pagerank` — ✅ installed
- Claude subagent — reuse existing SKILL.md subagent pattern
