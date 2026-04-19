# NEXT — Current Work

> **Entry point.** Read this first. Load TODO.md and PLAN.md sections only when actively working on a task.

> **Status:** v0.17.3 — 34-R done. Phase 34-B1 (scaffold + scenes) next

## Next Task

**34-B1: Scaffold storygraph-intro workspace** — `bun run episodeforge --series storygraph-intro --category tech_explainer`
- Run the scaffold command to create `bun_remotion_proj/storygraph-intro/`
- Then: generate TTS → implement 9 scenes → render
- Read: `PLAN.md §Phase 34-B`, `TODO.md §34-B1-B9`

**After 34-B1-B9:** 34-D (skill docs) or 33-F1 (PLAN.md parser) — both unblocked.
**Long-term:** Phase 35-39 (Web UI: Bun + Hono + React SPA, full pipeline orchestration)

## Reflections

### 34-R + Bun Workspace Migration (this session)

- **Rename verification caught real bugs:** Missing `storygraph` script in root package.json, wrong entry point (index.ts vs cli.ts), stale `bun run scaffold` usage text. Grep for old names isn't enough — must smoke-test every CLI command.
- **Bun 1.3.11 workspace resolution:** Bun registers workspace packages in bun.lock but does NOT create hoisted symlinks in root node_modules/. Bare specifiers like `from "remotion_types"` resolve from within workspace packages but NOT from repo root. Root scripts must use file paths (`bun run bun_app/episodeforge/src/index.ts`).
- **Dead re-export stubs removed:** storygraph had 3 re-export stubs in src/scripts/ that proxied to remotion_types — nobody imported them. Deleted. storygraph's `remotion_types` dependency was also unused and removed.
- **episodeforge imports migrated:** All `../../remotion_types/src/index.ts` relative paths → bare `from "remotion_types"`. Works when running from within episodeforge (tests, local dev).
- **Regression tests added:** remotion_types (category detection, scene templates), episodeforge (naming, series config, smoke), storygraph (detect, build), workspace smoke (CLI + imports).

### Rename bun_graphify → storygraph, bun_scaffold → episodeforge (this session)

- **Purpose-driven naming:** Old `bun_` prefix was tech (Bun runtime), not goal. New names reflect what they DO: storygraph = story knowledge graph engine, episodeforge = forges Remotion episodes from plans.
- **Scope:** 3 dirs (bun_app/bun_graphify → storygraph, bun_app/bun_scaffold → episodeforge, .claude/skills/bun_graphify → storygraph), 23 output dirs (bun_graphify_out → storygraph_out), 4 memory files renamed, 140+ references updated across 30+ files.
- **Zero stale refs:** Final grep confirms no remaining `bun_graphify` or `bun_scaffold` outside node_modules.
- **CLI commands changed:** `bun run scaffold` → `bun run episodeforge`, `bun run storygraph` for the graph CLI.
- **bun-graphify-intro → storygraph-intro:** Series ID for the planned tech explainer video also renamed.
- **bun install passes:** Workspace resolution works with new package names.
- **Lesson: test the pipeline after bun_app renames.** Bulk sed + `bun install` passing is necessary but NOT sufficient. Must also verify: (1) skill triggers work (`/remotion-best-practices`, `/storygraph`), (2) CLI commands run (`bun run episodeforge --help`, `bun run storygraph --help`), (3) skill SKILL.md cross-references resolve (paths like `../storygraph/PLAN.md`), (4) develop_bun_app skill references updated. A rename checklist should grep for ALL old name variants (snake_case, kebab-case, camelCase like `bunGraphify`) before declaring done.

### Phase 34-B0: Scaffold Extension + remotion_types (this session)

- **remotion_types package created:** Extracted category-types.ts, scene-templates.ts, tech-explainer-presets.ts from storygraph into shared `bun_app/remotion_types/` package
- **Bun workspace resolution caveat:** Bun 1.3.11 doesn't create hoisted symlinks for `bun_app/` workspace packages. Must use relative path imports with `.ts` extension: `"../../remotion_types/src/index.ts"` instead of `"remotion_types"`
- **episodeforge extended:** `--category` flag, standalone naming (no ch/ep), tech_explainer templates (9 named scenes), series registry with `standalone: true` preset
- **Cleaned root workspaces:** Removed 6 stale entries (claude-code-intro, taiwan-stock-market, etc. — all deleted projects)

### Phase 34-A: Category Taxonomy (this session)

- **Category ≠ Genre design validated:** weapon-forger = xianxia_comedy + narrative_drama. Content (genre) and format (category) are independent axes.
- **7 categories defined:** narrative_drama, galgame_vn, tech_explainer, data_story, listicle, tutorial, shorts_meme
- **3 new files created:**
  - `category-types.ts` — taxonomy + detection (detectCategoryFromDirname correctly maps all 11 existing projects)
  - `scene-templates.ts` — 7 builders, input data → CompositionSpec with auto duration allocation
  - `tech-explainer-presets.ts` — storygraph intro data
- **Per-feature duration capping:** Max 10s per FeatureScene prevents one scene type from eating all time
- **CLAUDE.md updated** with Video Categories section

### Web UI Vision (this session)

- **Architecture chosen:** Bun + Hono + React SPA (single Bun runtime)
- **Scope:** Full pipeline orchestration — replace all Claude Code skill interactions
- **Phases 35-39 planned:** Foundation → Project CRUD → Pipeline/Quality → Assets/Render → Orchestration
- **Key design:** Scripts become importable modules (not child_process) for API server

### 33-A + 33-E smoke
- **Symlink fix needed:** `discoverEpisodes()` didn't follow symlinks — fixed by checking `isSymbolicLink() + statSync().isDirectory()`
- **xianxia-system-meme series config added:** 2-ep minimal series, uses same xianxia_comedy genre as weapon-forger
- **gate.json v2 validates across all genres:** xianxia_comedy, galgame_meme both produce correct `quality_breakdown` (gag_evolution null for non-comedy)

### 31-A Subagent Scoring
- **AI quality scoring works:** GLM-5 produces per-dimension scores with detailed justifications
- **Blended formula validated:** 0.4 × programmatic + 0.6 × AI produces meaningful scores
- **compare.ts now shows AI score column** when kg-quality-score.json exists

### 33-B Tier 2 Review
- **kg-review topic created** with 5-dimension rubric + genre extensions (xianxia_comedy, galgame_meme, novel_system)
- **episode-creation.md updated** — Step 3d added between user approval and scaffolding
- **quality-review.json schema defined** — APPROVE / APPROVE_WITH_FIXES / REQUEST_RERUN / BLOCK decisions

## Implementation Order

```
Phase A — Foundation
  1. 33-A (gate.json v2, 5 tasks)          — ✅ COMPLETE

Phase B — Genre Validation
  2. 33-E smoke (E1-3, 3 tasks)            — ✅ COMPLETE

Phase C — Tier 1 + Cross-Genre Data
  3. 31-A (subagent scoring, 3 tasks)      — ✅ COMPLETE
  4. 33-E detail (E4-5, 2 tasks)           — ✅ COMPLETE

Phase D — Tier 2 (MVP complete after this)
  5. 33-B (Claude review skill, 3 tasks)   — ✅ COMPLETE — **MVP COMPLETE**

Phase 34 — Video Category System (ACTIVE)
  6. 34-A (taxonomy + templates)            — ✅ COMPLETE
  7. 34-B0 (extend episodeforge)            — ✅ COMPLETE
  7b. 34-R (rename verification tests)      — ✅ COMPLETE
  8. 34-B1-B9 (scaffold + scenes + render)  — ⬅️ NEXT
  9. 34-D (skill documentation)             — Unblocked

Phase E — Deploy Lite Steps (low risk)
  10. 33-F1 (Step 0 lite, 2 tasks)          — PLAN.md parser + chapter validator
  11. 33-F2 (Step 3b lite, 2 tasks)         — Gate writer + GLM dialog assessment

Phase F — CLI (wraps graphify + gate writer)
  12. 33-C (CLI packaging, 3 tasks)          — storygraph CLI + CI mode

Phase G — More Deploy Steps (low risk)
  13. 33-F4 (Step 4 lite, 2 tasks)          — narration.ts + TODO.md generators

Phase H — Evaluation (needs lite steps)
  14. 33-G (Evaluation framework, 5 tasks)  — Tier comparison + cost matrix + deploy sim

Phase I — Documentation + Experimental
  15. 33-H (Workflow adjustment, 3 tasks)   — Update episode-creation.md + SKILL.md
  16. 33-F3 (Step 2 lite, 2 tasks)          — Story draft (experimental, high risk)
  17. 33-D (Feedback loop, 2 tasks)         — Calibration

Phase 35-39 — Web UI (LONG TERM)
  18. 35-A/B/C (Foundation: Hono + React + module exports)
  19. 36-A/B (Project CRUD + story editor)
  20. 37-A/B (Pipeline + quality dashboard)
  21. 38-A/B (Assets + render management)
  22. 39 (Full orchestration + automation)
```

## Dependency Graph

```
33-A ──→ 33-E smoke ──→ 31-A ──→ 33-E detail ──→ 33-B
  │                                               │
  └─────→ 33-F1 (independent)                    └──→ 33-F2 → 33-C → 33-F4 → 33-G → 33-H
                                                                            ↓        ↓
                                                                        33-F3      33-D

34-A ──→ 34-B0 (scaffold ext) ──→ 34-B1-B9 (scenes)
  │
  └─────→ 34-D (docs, independent)

34-B ──→ 35-A/B/C (Web UI foundation)
           │
           ├──→ 36-A/B (Project CRUD)
           ├──→ 37-A/B (Pipeline + Quality)
           ├──→ 38-A/B (Assets + Render)
           └──→ 39 (Orchestration)
```

## Completed Phases

| Phase | What | Date |
|-------|------|------|
| 24 | Story Quality Gate (6 checks) | 2026-04-18 |
| 26 | pi-agent AI integration | 2026-04-18 |
| 27 | Hybrid mode + comparison | 2026-04-18 |
| 28 | Model benchmark (glm-5 default) | 2026-04-18 |
| 29 | Quality pipeline completion | 2026-04-19 |
| 30 | Genre-aware KG pipeline | 2026-04-19 |
| 33-A | gate.json v2 | 2026-04-19 |
| 33-E | Multi-series evaluation | 2026-04-19 |
| 31-A | Subagent KG scoring | 2026-04-19 |
| 33-B | Tier 2 Claude review | 2026-04-19 |
| 34-A | Video category taxonomy + templates | 2026-04-19 |
| 34-B0 | episodeforge extension + remotion_types | 2026-04-19 |
| 34-R | Rename verification tests | 2026-04-19 |

## Archive

- Completed tasks: `TODO-archive.md`
- Completed phase specs: `PLAN-archive.md`
