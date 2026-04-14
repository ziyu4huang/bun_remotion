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

## Current State (v0.4.0)

See `.claude/skills/bun_graphify/PLAN.md` for full architecture.

**Working:**
- Regex pipeline: per-episode extraction from narration.ts
- Simplified merge: concatenate sub-graphs + cross-episode link edges (no synthetic nodes)
- Episode-based coloring in merged HTML visualization
- Consistency checking via link edge traversal
- Auto-detect series pattern (generic `-chN-epM`)
- SKILL.md as operational playbook with knowledge capture

**Code-level tasks:** See `TODO.md` (same directory)

## Existing Files to Reuse

| File | What to Reuse |
|------|--------------|
| `src/extract/narrative.ts` | `parseNarration()`, `extractSeriesNarrative()`, `narrativeToCorpus()` |
| `src/cli.ts` | `cmdFull()`, `cmdExtract()` — AST extraction pipeline |
| `src/build.ts` | `buildFromExtraction()` — graph building |
| `src/cluster.ts` | `cluster()`, `splitOversized()` — community detection |
| `src/export/` | `writeGraphJSON()`, `writeGraphHTML()` — export |
| `src/report.ts` | `writeReport()` — report generation |
| `src/types.ts` | `GraphNode`, `GraphEdge`, `ExtractionResult` — shared types |
