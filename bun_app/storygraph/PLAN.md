# storygraph — Code Plan

> **Cross-linked docs:**
>
> This file | Skill folder
> ---|---
> `bun_app/storygraph/PLAN.md` | `.claude/skills/storygraph/PLAN.md` — Full architecture, node types, edge relations
> `bun_app/storygraph/TODO.md` | `.claude/skills/storygraph/TODO.md` — Pipeline-level tasks, run history, known issues
> — | `.claude/skills/storygraph/SKILL.md` — Operational playbook, commands, knowledge capture
>
> **Rule:** Architecture decisions → skill PLAN.md. Code-level tasks → this TODO.md.

## Current State (v0.20.0)

See `.claude/skills/storygraph/PLAN.md` for full architecture.

**Working:**
- Regex pipeline: per-episode extraction from narration.ts (series-config-driven)
- AI pipeline: NL extraction via pi-agent (8 node types)
- **Hybrid pipeline (DEFAULT)**: Regex first, AI supplements exclusive types (plot_event, artifact, gag_manifestation)
- Series config system: auto-detect series, load character/tech/gag patterns
- Simplified merge: concatenate sub-graphs + cross-episode link edges (no synthetic nodes)
- Episode-based coloring in merged HTML visualization
- Consistency checking via link edge traversal
- Auto-detect series pattern (generic `-chN-epM`)
- Absolute path validation in all 9 scripts
- HTML escape in gen-story-html.ts
- SKILL.md as operational playbook with knowledge capture
- Leiden-inspired community system with analysis
- Generation manifest in all output files (mode, model, timestamp, version)
- Comparison tool: graphify-compare.ts runs all 3 modes side-by-side
- **Tier 0 programmatic quality gate:** gate.json v2 with 13+ genre-aware checks, quality_breakdown, supervisor_hints, requires_claude_review
- **Tier 1 GLM quality scoring:** Blended 0.4×programmatic + 0.6×AI, kg-quality-score.json
- **Tier 2 Claude review:** Structured rubric, quality-review.json
- **CLI:** `storygraph` CLI with score, write-gate, parse-plan, validate-plan, --ci mode
- **PLAN.md parser + chapter validator:** plan-parser.ts, chapter-validator.ts
- **Quality gate writer:** graphify-write-gate.ts with GLM dialog assessment

**Phase 23 — AI Cross-Link Discovery (complete):**
- StoryCrossLink type + CrossLinkType union in types.ts
- story-algorithms.ts: PageRank, Jaccard similarity, character arc score, gag evolution score
- subagent-prompt.ts: buildCrossLinkPrompt() with graph summary + metrics (exports NodeSummary, EdgeSummary)
- ai-crosslink-generator.ts: full orchestration (metrics → prompt → validate → patch)
- graphify-pipeline.ts: step 3.5 integration
- gen-story-html.ts: AI cross-link dotted edges + PageRank glow + legend + toggle

**Phase 24 — Story Quality Gates (A/B/C/D complete, E/F blocked):**
- 24-A: Duplicate content gate (Jaccard similarity gating + algorithm cross-links)
- 24-B: Plot arc detector (PlotBeat type, tension curve analysis)
- 24-C: Foreshadowing tracker (cross-episode setup/payoff)
- 24-D: Character growth trajectory (direction-aware scoring)
- 24-E/F: Blocked (need dialog_line_count + theme node type)

**Phase 26 — Dual-Mode Pipeline (complete):**
- ai-client.ts: pi-ai SDK wrapper (callAI, parseArgsForAI, zai/glm-4.7-flash default)
- buildEpisodeExtractionPrompt(): 8 node types, 8 edge relations, ~3000 char context
- graphify-episode.ts --mode ai: AI extraction with regex fallback
- graphify-check.ts --mode ai: check enrichment via pi-agent
- graphify-pipeline.ts: --mode ai passthrough to all subprocesses
- @mariozechner/pi-ai@0.67.68 installed

**Phase 27 — Hybrid Mode + Comparison (complete):**
- --mode hybrid: regex first, AI supplements exclusive nodes/edges
- graphify-compare.ts: runs all 3 modes, compares, recommends best default
- Hybrid scores 97 vs regex 54 vs ai 32 on my-core-is-boss (5 eps)
- Default mode changed from regex to hybrid
- Generation manifest in graph.json, merged-graph.json, consistency-report.md, graph.html

## Existing Files to Reuse

| File | What to Reuse |
|------|--------------|
| `src/extract/narrative.ts` | `parseNarration()`, `extractSeriesNarrative()`, `narrativeToCorpus()`, `detectEpisodes()` |
| `src/scripts/series-config.ts` | `SeriesConfig`, `detectSeries()`, `getSeriesConfigOrThrow()`, series configs |
| `src/scripts/story-algorithms.ts` | `computePageRank()`, `computeJaccardSimilarity()`, `computeCharacterArcScore()`, `computeGagEvolutionScore()` |
| `src/scripts/subagent-prompt.ts` | `buildCrossLinkPrompt()`, `buildPlotArcPrompt()`, `buildForeshadowPrompt()`, `buildEpisodeExtractionPrompt()` |
| `src/scripts/ai-crosslink-generator.ts` | Cross-link orchestration: read merged → compute metrics → write input → read output → validate → patch |
| `src/ai-client.ts` | pi-ai SDK wrapper: `callAI()`, `parseArgsForAI()` |
| `src/cli.ts` | `cmdFull()`, `cmdExtract()` — AST extraction pipeline |
| `src/build.ts` | `buildFromExtraction()` — graph building |
| `src/cluster.ts` | `cluster()`, `splitOversized()` — community detection |
| `src/export/` | `writeGraphJSON()`, `writeGraphHTML()` — export |
| `src/report.ts` | `writeReport()` — report generation |
| `src/types.ts` | `GraphNode`, `GraphEdge`, `ExtractionResult`, `StoryCrossLink`, `CrossLinkType`, `PlotBeat`, `Foreshadow` — shared types |

## Phase 23 — AI Cross-Link Discovery ✅

See `.claude/skills/storygraph/PLAN.md` Phase 23 for architecture.

### All Files

| File | Purpose | Status |
|------|---------|--------|
| `src/scripts/story-algorithms.ts` | PageRank, Jaccard similarity, character arc score, gag evolution score | ✅ |
| `src/scripts/subagent-prompt.ts` | Cross-link discovery prompt builder (exports NodeSummary, EdgeSummary) | ✅ |
| `src/types.ts` | StoryCrossLink interface, CrossLinkType union | ✅ |
| `src/scripts/ai-crosslink-generator.ts` | Orchestration: metrics → prompt → validate → patch merged-graph.json | ✅ |
| `src/scripts/graphify-pipeline.ts` | Step 3.5: crosslink generator + HTML re-render | ✅ |
| `src/scripts/gen-story-html.ts` | AI cross-link dotted edges + PageRank glow + legend + toggle | ✅ |

### Dependencies

- `graphology` + `graphology-pagerank` — ✅ installed
- File-based subagent pattern — ✅ matches graphify-check.ts enrichment

## Phase 26 — Dual-Mode Pipeline (complete)

### All Files

| File | Purpose | Status |
|------|---------|--------|
| `src/ai-client.ts` | pi-ai SDK wrapper: callAI(), parseArgsForAI() | ✅ |
| `src/scripts/subagent-prompt.ts` | Added buildEpisodeExtractionPrompt() | ✅ |
| `src/scripts/graphify-episode.ts` | Added --mode ai branch with regex fallback | ✅ |
| `src/scripts/ai-crosslink-generator.ts` | --mode ai branch for direct API call | ✅ |
| `src/scripts/graphify-check.ts` | --mode ai branch for enrichment | ✅ |
| `src/scripts/graphify-pipeline.ts` | --mode ai passthrough to all subprocess calls | ✅ |

### Dependencies

- `@mariozechner/pi-ai@0.67.68` — ✅ installed
- `ZAI_API_KEY` env var — already configured
