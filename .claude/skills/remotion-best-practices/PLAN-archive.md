# Novel Video Generation — PLAN Archive

> Completed phase specs from Phase 24–30. For reference only.
> Active phases: `PLAN.md`

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
