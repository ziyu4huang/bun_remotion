# Novel Video Generation — PLAN Archive

> Completed phase specs from Phase 24–43. For reference only.
> Active phases: `PLAN.md`

---

## Phase 43: Review Agent CLI in bun_pi_agent — COMPLETE

### Architecture

```
bun_app/bun_pi_agent/src/review-agent/
├── cli.ts              # CLI entry: bun run review-agent <series-dir>
├── review-prompt.ts    # Build structured review prompt from pipeline data
├── review-parser.ts    # Parse GLM response into ReviewResult
├── types.ts            # ReviewResult type (6 dimensions, fix suggestions)
├── ai-call.ts          # GLM API wrapper (stripMarkdownFence, repairTruncatedJSON)
└── __tests__/
    └── review-agent.test.ts
```

### ReviewResult

```typescript
{
  decision: "APPROVE" | "APPROVE_WITH_FIXES" | "REQUEST_RERUN" | "BLOCK",
  dimensions: { semantic_correctness, creative_quality, genre_fit, pacing, character_consistency, regression_vs_previous },
  overall: 0-10,
  strengths: string[],
  weaknesses: string[],
  fix_suggestions: { target, suggestion, priority }[],
  summary_zhTW: string
}
```

## Phase 42: my-core-is-boss New Episode — Pipeline Diversity Test — COMPLETE

### Goal

Create one new my-core-is-boss episode using the full pipeline. Cross-series validation beyond weapon-forger.

### Result

ch2-ep3 (技能點分配) created and rendered. 247.3 MB MP4, 7:10 duration. All assets pre-existed (no new images). 4 bugs found in scaffold templates.

---

## Phase 24: Story Quality Gate (storygraph enhancements) — COMPLETE

### Architecture

```
narration.ts
  │
  ├─ [graphify-episode.ts] Regex extraction (existing)
  │   Produces: episode_plot, scene, character_instance, tech_term,
  │             gag_manifestation, character_trait
  │
  ├─ [graphify-merge.ts] Concatenate + link edges
  │   ├─ EXISTING: same_character, story_continues, gag_evolves
  │   └─ NEW 24-C: foreshadows (plant → payoff cross-episode)
  │
  ├─ [graphify-check.ts] Consistency checks
  │   ├─ EXISTING: Character Consistency, Gag Evolution, Tech Term Diversity,
  │   │           Trait Coverage, Interaction Density, Community Structure,
  │   │           Isolated Nodes, Cross-Community Coherence
  │   ├─ NEW 24-A: checkDuplicateContent() — Jaccard > 0.7 = FAIL
  │   ├─ NEW 24-B: checkPlotArc() — no climax = FAIL, flat middle = WARN
  │   ├─ NEW 24-C: checkForeshadowing() — unpaid within 2 eps = WARN
  │   ├─ NEW 24-D: checkCharacterGrowth() — flat arc 3+ eps = WARN
  │   └─ NEW 24-E: checkPacing() — flat/inverted curve = WARN
  │
  ├─ [story-algorithms.ts]
  │   ├─ EXISTING: PageRank, Jaccard, CharacterArcScore, GagEvolutionScore
  │   ├─ NEW 24-B: computePlotArcScore()
  │   ├─ NEW 24-D: upgraded computeCharacterArcScore() (direction-aware)
  │   └─ NEW 24-E: computePacingCurve() (dialog-density tension)
  │
  ├─ [subagent-prompt.ts]
  │   ├─ EXISTING: buildCrossLinkPrompt() (Phase 23)
  │   ├─ NEW 24-B: buildPlotArcPrompt()
  │   └─ NEW 24-C: buildForeshadowPrompt()
  │
  └─ [ai-crosslink-generator.ts]
      └─ NEW 24-A: algorithm-only cross-links from Jaccard
```

### New Node Types

| Type | ID Format | Properties | Source |
|------|-----------|------------|--------|
| `plot_beat` | `${EP_ID}_beat_${type}` | `beat_type`, `scene`, `tension`: 0.0-1.0 | Subagent (24-B) |
| `foreshadow` | `${EP_ID}_foreshadow_${index}` | `planted_episode`, `paid_off`, `description`, `payoff_episode` | Subagent (24-C) |

### New Edge Relations

| Relation | Source → Target | Phase | Pipeline |
|----------|----------------|-------|----------|
| `part_of` (extended) | plot_beat → scene | 24-B | Subagent |
| `sequenced_after` | plot_beat → plot_beat | 24-B | Subagent |
| `foreshadows` | foreshadow → foreshadow (cross-ep) | 24-C | Subagent + merge |
| `illustrates` (extended) | foreshadow → theme | 24-C | Subagent |

### Check Details

**24-A: Duplicate Content Gate** — Jaccard > 0.7 = FAIL, > 0.5 = WARN

**24-B: Plot Arc Detector** — Scene classification via subagent. FAIL: no climax. WARN: flat middle, inverted arc.

**24-C: Foreshadowing Tracker** — Cross-episode plant→payoff tracking. WARN: unpaid after 2 eps. Merge fixed in v0.9.1.

**24-D: Character Growth** — Direction-aware: positive_growth, negative_decline, neutral_shift, reintroduction. Trajectory vector across episodes.

**24-E: Pacing Curve** — Weighted tension: 0.4×dialog + 0.3×character + 0.3×effect. Flat (variance < 0.01) or inverted = WARN.

**24-F: Thematic Coherence** — Shared themes / total unique themes. < 0.3 = WARN. AI theme extraction via subagent.

---

## Gate Integration Spec — COMPLETE

### Gate section order

1. Pipeline 執行紀錄
2. 檢查結果 (PASS/WARN/FAIL — includes all checks)
3. 角色一致性
4. 招牌梗演進
5. 故事 Arc 連續性
6. **重複內容檢查** (24-A)
7. **劇情弧分析** (24-B)
8. **伏筆追蹤** (24-C)
9. **角色成長軌跡** (24-D)
10. **節奏分析** (24-E)
11. 閘門判定

### Gate subsection templates

Each check has a zh_TW markdown subsection with table + 判定 + 建議 fields. Full templates in `PLAN-archive.md` gate integration section.

---

## Phase 25: Remotion Novel Video Generation Framework — SKETCHED

> Detailed spec after Phase 24 validates the story quality approach.

### 25-A: Narrative Scene Templates

- `DialogScene` — Multi-character dialog with reactions, timing from segment-durations.json
- `ActionScene` — Dynamic battle/action with ComicEffects, ScreenShake, energy beams
- `MontageScene` — Time-lapse montage with music, cross-dissolve transitions
- `TransitionScene` — Chapter/episode transitions with title cards

### 25-B: Story Beat Visualization

- `PlotBeatOverlay` — Shows current position in dramatic arc
- `TensionMeter` — Visual bar reflecting story tension level
- `ChapterTitleCard` — Chapter/arc context card at episode start

### 25-C: Character Arc Visual Indicators

- `CharacterStateOverlay` — Current emotional state indicator
- `RelationshipGraph` — Overlay showing character relationships
- `TraitEvolutionVisual` — Visual representation of character trait changes

### Integration with storygraph

Phase 25 components consume Phase 24 analysis output:
- `PlotBeatOverlay` reads `plot_beat` nodes from merged-graph.json
- `TensionMeter` reads per-scene tension scores from pacing analysis
- `CharacterStateOverlay` reads character growth trajectory data

**Status:** Sketched only. Phase 29-F created PlotBeatOverlay, TensionMeter, CharacterStateOverlay as shared components. Full scene templates (DialogScene, ActionScene, etc.) remain future work.

---

## Phase 27: Hybrid Mode — Implementation Reflections

### What worked well

- **Hybrid dedup is trivial** — "regex wins on same ID, AI adds the rest" via `Set.has()` checks
- **Comparison tool validates empirically** — `graphify-compare.ts` runs all 3 modes, produces objective scores
- **Default mode change is safe** — hybrid degrades gracefully to regex if AI fails

### Gaps

1. **More WARN/FAIL in hybrid** — 15W/9F vs regex 6W/10F. More nodes trigger more checks.
2. **Per-episode stats derived from merged graph** — Misses per-episode nuances.
3. **No AI call batching** — Sequential per-episode calls. Could parallelize with Promise.all().

---

## Phase 28: Model Benchmark — Scoring Bias Analysis

The composite score formula has known biases:

| Bias | Impact |
|------|--------|
| **Quantity bias** | +1 per node rewards volume regardless of accuracy |
| **Weak FAIL penalty** | −3 per FAIL easily offset by extra nodes |
| **Type diversity overweight** | +10 per node type rewards rare types with 1 instance |
| **No accuracy signal** | Hallucinated entities count same as real ones |
| **Reliability confound** | Low-scoring model may just have API issues |

### Phase 28-B: Improved Model Benchmark (next term)

1. **Accuracy sampling** — Subagent evaluates 10-20 nodes per model
2. **Quality-weighted score** — `precision × nodeCount × 2`
3. **FAIL weighting** — Increase from −3 to −5 or −10
4. **Reliability test** — Run each model 3 times; discard failed runs
5. **graphify-compare.ts --models flag** — Benchmark models within same mode

---

## Phase 24 Implementation Reflections

### What worked well

- **File-based subagent pattern is consistent** — `buildXxxPrompt()` → JSON I/O pattern
- **check functions are composable** — Each returns `{ results: CheckResult[], ...data }`
- **Gate template updates are mechanical** — Just formatting structured data

### Gaps (resolved)

1. ~~graphify-merge.ts foreshadow gap~~ — Fixed in v0.9.1
2. ~~Step 3b subagent prompt~~ — Fixed in v0.9.1
3. Thematic coherence (24-F) — Unblocked via AI theme extraction
4. Pacing signal limited to dialog — Enhanced with 3-signal weighted approach

### Recommended next steps (all done)

1. ~~Fix the merge gap~~ — Done
2. ~~Update Step 3b subagent prompt~~ — Done
3. ~~Unblock 24-E~~ — Done (v0.12.0)
4. ~~Phase 26 before 24-E/F~~ — Done (v0.10.0)
5. Phase 25 spec — Ready after Phase 24 validation
6. ~~Hybrid extraction~~ — Done (Phase 27)
7. Phase 28-B — Deferred to next term

---

## Files Modified (Phase 24)

| File | Changes |
|------|---------|
| `bun_app/storygraph/src/types.ts` | +PlotBeat, +Foreshadow interfaces |
| `bun_app/storygraph/src/scripts/graphify-check.ts` | +checkDuplicateContent(), +checkPlotArc(), +checkForeshadowing(), +checkCharacterGrowth(), +checkPacing() |
| `bun_app/storygraph/src/scripts/story-algorithms.ts` | +computePlotArcScore(), upgrade computeCharacterArcScore(), +computePacingCurve() |
| `bun_app/storygraph/src/scripts/subagent-prompt.ts` | +buildPlotArcPrompt(), +buildForeshadowPrompt() |
| `bun_app/storygraph/src/scripts/ai-crosslink-generator.ts` | algorithm-only cross-links from Jaccard |
| `bun_app/storygraph/src/scripts/graphify-pipeline.ts` | new pipeline steps for plot arc + foreshadowing |
| `topics/episode-setup/episode-creation.md` | gate template: +5 new subsections |

## Files Modified (Phase 27)

| File | Changes |
|------|---------|
| `bun_app/storygraph/src/ai-client.ts` | hybrid mode type, default changed to `"hybrid"` |
| `bun_app/storygraph/src/scripts/graphify-episode.ts` | Step 7.5: hybrid AI supplement merge |
| `bun_app/storygraph/src/scripts/graphify-pipeline.ts` | `--mode hybrid` passthrough |
| `bun_app/storygraph/src/scripts/graphify-compare.ts` | NEW — mode comparison tool |
| `bun_app/storygraph/src/scripts/graphify-merge.ts` | manifest in merged-graph.json |
| `bun_app/storygraph/src/scripts/graphify-check.ts` | manifest in consistency report |
| `bun_app/storygraph/src/scripts/gen-story-html.ts` | manifest in HTML meta + footer |

---

## Phase 31: Subagent-Based KG Quality Scoring — COMPLETE

### Architecture

```
graphify-score.ts (NEW)
  │
  ├── 1. Run pipeline (existing)
  │
  ├── 2. Build scoring prompt
  │     Input: merged-graph.json summary + narration.ts excerpts
  │     Rubric:
  │       - Entity accuracy (0-10)
  │       - Relationship correctness (0-10)
  │       - Completeness (0-10)
  │       - Cross-episode coherence (0-10)
  │       - Actionability (0-10)
  │
  ├── 3. Call subagent (callAI)
  │
  ├── 4. Compute blended score
  │     blended = 0.4 * programmatic + 0.6 * subagent_overall
  │
  └── 5. Write kg-quality-score.json
```

### Why subagent, not programmatic

- **Accuracy requires reading comprehension** — NL understanding needed
- **Edge validity is semantic** — Context needed for relationship validation
- **Actionability is subjective** — Design judgment required

---

## Phase 32: KG-Driven LLM Prompt Enhancement — COMPLETE

### Architecture

```
merged-graph.json
  │
  ├── buildRemotionPrompt()
  │     ├── Previous episode summary
  │     ├── Active foreshadowing
  │     ├── Character growth trajectory
  │     ├── Gag evolution history
  │     ├── Pacing profile
  │     └── Thematic coherence data
  │
  ├── Episode-creation Step 3b
  │
  └── Post-render feedback
        ├── Actual scene durations vs pacing predictions
        ├── Effect usage vs effect_count predictions
        └── Updates KG → calibrates future prompts
```

### New Files

| File | Purpose |
|------|---------|
| `subagent-prompt.ts` + `buildRemotionPrompt()` | KG context injection into episode prompts |
| `graphify-enrich.ts` (NEW) | Post-render KG enrichment |
| `prompt-calibration.ts` (NEW) | Track which KG features correlate with quality scores |

---

## Phase 33: Dual-LLM Architecture — COMPLETE

### Architecture — Three-Tier Quality Pipeline

```
Tier 0: Programmatic (free, fast, always runs)
  Jaccard similarity, PageRank, arc scores, type counts
  13+ genre-aware consistency checks → PASS/WARN/FAIL
  Output: gate.json (score 0-100)

Tier 1: pi-agent AI scoring (free, slow, runs on pipeline)
  GLM-5 evaluates its own KG quality across 5 dimensions
  Blended score: 0.4 × programmatic + 0.6 × ai_overall
  Output: quality-score.json (per-dimension)

Tier 2: Claude Code review (paid, manual, human-in-loop)
  Deep evaluation: semantic correctness, creative quality, genre fit, regression
  Output: quality-review.json + review notes in PLAN.md
```

### gate.json v2 Design

```json
{
  "version": "2.0",
  "series": "my-core-is-boss",
  "genre": "novel_system",
  "score": 75,
  "decision": "PASS",
  "previous_score": 72,
  "score_delta": 3,
  "quality_breakdown": {
    "consistency": 0.8,
    "arc_structure": 0.7,
    "pacing": 0.65,
    "character_growth": 0.9,
    "thematic_coherence": 0.75,
    "gag_evolution": null
  },
  "supervisor_hints": {
    "focus_areas": ["pacing_curve_flat_ch2ep2"],
    "escalation_reason": null
  },
  "requires_claude_review": false
}
```

### Sub-phases (all complete)

- 33-A: gate.json v2 (provenance, regression, quality_breakdown, supervisor_hints)
- 33-B: Claude Code Review Skill Topic (kg-review + Tier 2 rubric)
- 33-C: CLI Packaging (cli.ts + CI mode)
- 33-E: Multi-Series Evaluation Suite (weapon-forger, galgame-meme-theater, xianxia-system-meme)
- 33-F1: PLAN.md Parser + Chapter Validator
- 33-F2: Quality Gate Writer + GLM Dialog Assessment
- 33-F3: Story Draft Generator (experimental)
- 33-F4: Narration + TODO Generators
- 33-G: Evaluation Framework (regression runner + tier comparison + cost matrix)
- 33-H: Episode-Setup Workflow Adjustment (deploy mode + hybrid mode docs)
- 33-I: my-core-is-boss Storygraph Rebuild (173 nodes, blended 74.8%)

---

## Phase 34: Video Category System — COMPLETE

### Key insight: Category ≠ Genre

- **Genre** = story content style (xianxia_comedy, galgame_meme)
- **Category** = video format/structure (narrative_drama, tech_explainer)
- A series has BOTH: `weapon-forger → xianxia_comedy + narrative_drama`

### 7 Video Categories

| Category | zh_TW | Projects | Dialog System |
|----------|-------|----------|---------------|
| Narrative Drama | 敘事劇情 | weapon-forger, my-core-is-boss, xianxia-system-meme | dialogLines[] |
| Galgame VN | 美少女遊戲風 | galgame-meme-theater, galgame-youth-jokes | dialogLines[] |
| Tech Explainer | 技術講解 | claude-code-intro, storygraph-explainer | narration_script |
| Data Story | 數據故事 | taiwan-stock-market | narration_script |
| Listicle | 盤點清單 | *(none yet)* | item_list |
| Tutorial | 教學指南 | *(none yet)* | step_guide |
| Shorts / Meme | 短影音迷因 | *(none yet)* | none (sfx only) |

### Files Created

| File | Purpose |
|------|---------|
| `bun_app/remotion_types/src/category-types.ts` | 7 category definitions, detection, helpers |
| `bun_app/remotion_types/src/scene-templates.ts` | Composition spec builders for all 7 categories |
| `bun_app/remotion_types/src/presets/tech-explainer-presets.ts` | storygraph intro preset + data |

### Sub-phases (all complete)

- 34-A: Category Taxonomy + Templates
- 34-B: episodeforge Extension + storygraph Intro (→ storygraph-explainer)
- 34-D: Skill Documentation (category guide + topic detection)
- 34-E: Storygraph Consistency Checker Fixes (Jaccard, SKIP status)
- 34-F: Storygraph AI Mode Fix (nested backticks, truncation repair)

---

## Phase 35: Web UI Foundation — COMPLETE

### Architecture

```
bun_app/bun_webui/
├── src/server/          # Hono API server
│   ├── index.ts         # Entry point, Bun.serve()
│   ├── routes/          # projects, pipeline, quality, assets, render, etc.
│   ├── services/        # project-scanner, workflow-engine, monitoring, etc.
│   └── middleware/       # job-queue (SSE streaming)
├── src/client/          # React SPA (Vite)
│   ├── App.tsx          # Router + layout
│   ├── pages/           # Dashboard, Projects, Pipeline, Quality, etc.
│   └── api.ts           # Typed fetch wrapper with SSE
└── src/shared/types.ts  # Shared API types
```

### Sub-phases (all complete)

- 35-A: Hono API Server (health, job queue with SSE)
- 35-B: React SPA (Vite + React + Dashboard)
- 35-C: Script Module Exports (episodeforge, storygraph, bun_image, bun_tts)

---

## Phase 36: Project Management UI — COMPLETE

- 36-A: Project CRUD (project-scanner, scaffold API, Projects page)
- 36-B: Story Editor (plan-editor, plans routes, StoryEditor page)

---

## Phase 37: Pipeline & Quality UI — COMPLETE

- 37-A: Pipeline Runner (pipeline routes, Pipeline page)
- 37-B: Quality Dashboard (quality routes, Quality page, cross-series comparison)

---

## Phase 38: Asset & Render UI — COMPLETE

- 38-A: Asset Management (asset-scanner, 6 API endpoints, Assets page)
- 38-B: TTS & Render (tts API + page, render API + page, remotion-renderer service)

---

## Phase 39: Full Pipeline Orchestration — COMPLETE

- 39-A1: Workflow Templates (4 templates, workflow engine, Workflows page)
- 39-A2: Automation Rules (3 triggers, file watcher, automation API)
- 39-A3: Monitoring Dashboard (series health aggregator, Monitoring page)
- 39-A4: CI/CD Integration (webhook + scheduler services, 15 endpoints)
- 39-A5: Export/Import (series config export/import, 4 endpoints)

---

## Phase 40: End-to-End Pipeline Verification — COMPLETE

- 40-A: WebUI Server + Playwright smoke (all 11 pages load)
- 40-B: Scaffold ch3-ep2 via API (11 files created)
- 40-C: Pipeline run (8 eps, 300 nodes)
- 40-D: Image gen via CDP bridge (test-warrior.png)
- 40-E: TTS generation (4 WAV files)
- 40-F: Render (86MB MP4)
- 40-G: Full workflow (image + TTS + render, 152.6MB MP4)

---

## Phase 41-C: Roadmap Refactor — COMPLETE

### Problem

Roadmap docs grew to 1804 lines total. ~90% was dead weight consuming context tokens.

### Solution

1. Moved Phase 31-39 specs from PLAN.md → PLAN-archive.md
2. Moved completed TODO items → TODO-archive.md
3. Extracted reflections from NEXT.md → REFLECTIONS.md (new on-demand file)
4. Slimmed NEXT.md to ~40 lines (status + next task + phases table)
5. Added REFLECTIONS.md to SKILL.md Strategic Roadmap table

### Result

| File | Before | After |
|------|--------|-------|
| PLAN.md | 795 lines | ~80 lines |
| NEXT.md | 708 lines | ~40 lines |
| TODO.md | 388 lines | ~80 lines |
| Total | 1891 lines | ~200 lines |
