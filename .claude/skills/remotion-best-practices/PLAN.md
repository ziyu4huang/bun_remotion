# Novel Video Generation — Strategic Roadmap

> **Cross-linked docs:**
>
> This file (strategic) | Code-level
> ---|---
> `PLAN.md` — Phases, architecture, gate integration | `../bun_graphify/PLAN.md` — bun_graphify code architecture, node types, edge relations
> `TODO.md` — Actionable tasks, run history | `../bun_graphify/TODO.md` — bun_graphify code tasks (file/line specific)
> — | `../bun_graphify/SKILL.md` — bun_graphify operational playbook

> **Status:** v0.14.0 — Phase 24/29 complete, Phase 30–32 planned (genre-aware KG, subagent scoring, KG-driven prompts)

---

## Phase 24: Story Quality Gate (bun_graphify enhancements)

Story KG pipeline v0.8.0 detects character drift and gag stagnation. Phase 24 adds **novel-writing quality checks**: duplicate content gating, plot arc analysis, foreshadowing tracking, character growth trajectory, pacing curves, and thematic coherence.

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
| `plot_beat` | `${EP_ID}_beat_${type}` | `beat_type`: inciting_incident / rising_action / climax / falling_action / resolution, `scene`: source scene, `tension`: 0.0-1.0 | Subagent (24-B) |
| `foreshadow` | `${EP_ID}_foreshadow_${index}` | `planted_episode`, `paid_off` (bool), `description`, `payoff_episode` | Subagent (24-C) |

### New Edge Relations

| Relation | Source → Target | Phase | Pipeline |
|----------|----------------|-------|----------|
| `part_of` (extended) | plot_beat → scene | 24-B | Subagent |
| `sequenced_after` | plot_beat → plot_beat | 24-B | Subagent |
| `foreshadows` | foreshadow → foreshadow (cross-ep) | 24-C | Subagent + merge |
| `illustrates` (extended) | foreshadow → theme | 24-C | Subagent |

### 24-A: Active Duplicate Content Gate (P0)

Elevate existing Jaccard similarity from passive metric to active gate.

**Algorithm:** `computeJaccardSimilarity()` already exists in `story-algorithms.ts:79-124`. New `checkDuplicateContent()` reads the similarity matrix.

**Thresholds:**
- Jaccard > 0.7 → FAIL (episodes are structurally near-duplicate)
- Jaccard > 0.5 → WARN (episodes share significant structure)

**Check output:** Per-episode-pair similarity table with status.

**Files:** `graphify-check.ts` (+checkDuplicateContent), `ai-crosslink-generator.ts` (+algorithm cross-links)

### 24-B: Plot Arc Detector (P0)

Classify each scene's dramatic function and verify overall episode has proper structure.

**Subagent extraction:** `buildPlotArcPrompt()` sends scene sequence to AI, which classifies each scene as a plot beat. Follows Phase 23's proven file-based pattern.

**Algorithm:** `computePlotArcScore()` measures tension distribution:
- Expected curve: low → rise → peak → fall → low
- Score based on how closely actual tension matches expected
- Per-scene tension from: conflict edge count, dialog intensity, tech term density

**Checks:**
- FAIL: No climax beat detected (tension never peaks)
- WARN: Flat middle (tension doesn't rise between inciting incident and climax)
- WARN: Inverted arc (climax before rising action)

**Files:** `types.ts` (+PlotBeat), `story-algorithms.ts` (+computePlotArcScore), `subagent-prompt.ts` (+buildPlotArcPrompt), `graphify-check.ts` (+checkPlotArc)

### 24-C: Foreshadowing Tracker (P1) — COMPLETE

Track narrative elements planted in earlier episodes and verify they get paid off.

**Subagent extraction:** `buildForeshadowPrompt()` analyzes dialog/narration text for setups (promises, unanswered questions, mysterious objects) and payoffs.

**Cross-episode linking:** New `foreshadows` link edge in merge script connects plant → payoff across episodes.

**Checks:**
- WARN: Foreshadowing unpaid after 2 episodes (viewer will forget)
- INFO: New foreshadowing planted (no action needed, just tracking)

**Files:** `types.ts` (+Foreshadow), `subagent-prompt.ts` (+buildForeshadowPrompt), `graphify-merge.ts` (+foreshadows links), `graphify-check.ts` (+checkForeshadowing)

**Gap:** ~~`graphify-merge.ts` doesn't yet wire `foreshadows` link edges~~ **Fixed in v0.9.1** — Step 4e reads `foreshadow-output.json` and creates foreshadow nodes + foreshadows link edges.

### 24-D: Character Growth Trajectory (P1) — COMPLETE

Upgrade existing character arc score from "variation" to "direction-aware growth".

**Current:** `computeCharacterArcScore()` returns `1 - (shared traits / total traits)` — measures variation, not direction.

**New:** Direction-aware scoring:
- Classify each trait change as: positive_growth, negative_decline, neutral_shift, reintroduction
- Compute trajectory vector across episodes: `(positive_count - negative_count) / total_changes`
- Classify arc: positive (score > 0.3), negative (score < -0.3), flat (|score| < 0.1), cyclical (reintroduction dominant)

**Checks:**
- WARN: Main character has flat arc across 3+ episodes (no development)
- INFO: Arc classification and score (for gate report)

**Files:** `story-algorithms.ts` (upgrade computeCharacterArcScore), `graphify-check.ts` (+checkCharacterGrowth)

**Note:** `graphify-check.ts` reimplements the growth algorithm inline (raw JSON) rather than calling `computeCharacterArcScore()` (graphology Graph). This is intentional — graphify-check reads merged-graph.json directly without constructing a graphology instance. The two implementations produce equivalent results.

### 24-E: Pacing Curve Analyzer (P2) — COMPLETE

Per-scene tension scoring from dialog density.

**Algorithm:** `computePacingCurve()` normalizes `dialog_line_count` to 0-1 tension per episode. This is a simplified version of the original plan — the original design called for 4 signals (conflict edges, dialog, ComicEffects, tech terms) but only `dialog_line_count` was available per-scene in the graph schema. Conflict edges and tech terms are episode-level, not scene-level. ComicEffects count isn't tracked in the graph at all.

**Actual implementation:**
- Tension = `dialog_line_count / max(scene dialog counts)` per episode
- Flat detection: variance < 0.01
- Inverted detection: OutroScene tension > avg ContentScene tension

**Check:** WARN if tension curve is flat (variance < 0.01) or inverted (OutroScene tension > ContentScene tension).

**Limitation:** Dialog line count is a proxy for scene activity, not dramatic tension. A quiet but intense confrontation scene may score low. Future enhancement: add `effect_count` and `character_count` to scene node properties during regex extraction to get a richer tension signal.

**Files:** `story-algorithms.ts` (+computePacingCurve), `graphify-check.ts` (+checkPacing)

### 24-F: Thematic Coherence Score (P2) — BLOCKED

Track theme consistency across episodes.

**Algorithm:** `computeThemeCoherence()` measures:
- Theme node presence per episode (from subagent extraction)
- Theme consistency ratio: shared themes / total unique themes
- Theme drift: new themes introduced without prior setup

**Check:** WARN if theme consistency drops below 0.3 (series themes fragmenting).

**Blocker:** No `theme` node type exists in the graph schema. The regex pipeline doesn't extract themes. Options: (a) add a `buildThemeExtractionPrompt()` subagent (like 24-B/24-C pattern), or (b) derive themes from character_trait and tech_term co-occurrence patterns. Recommend (a) — themes are inherently NL concepts. Could share a prompt with foreshadowing extraction to reduce subagent calls.

**Files:** `story-algorithms.ts` (+computeThemeCoherence), `graphify-check.ts` (+checkThematicCoherence)

---

## Gate Integration Spec

Each new check appears as a subsection in the Graphify 品質閘門 section of episode PLAN.md. Language convention: zh_TW descriptions, English for professional terminology (PASS/WARN/FAIL, nodes, edges, Jaccard, Pipeline).

### Existing gate sections (episode-creation.md)

1. Pipeline 執行紀錄
2. 檢查結果 (PASS/WARN/FAIL table)
3. 角色一致性
4. 招牌梗演進
5. 故事 Arc 連續性
6. 閘門判定

### New gate sections (Phase 24)

**After 故事 Arc 連續性, before 閘門判定:**

#### 重複內容檢查 (24-A)

```markdown
### 重複內容檢查

| 集數對比 | Jaccard 相似度 | 狀態 |
|---------|---------------|------|
| ch1ep1 ↔ ch1ep2 | 0.35 | 正常 |
| ch1ep1 ↔ ch2ep1 | 0.72 | ❌ 結構重複 |

- **判定：** 通過 / 重複警告 / 結構重複
- **建議：** [zh_TW — 針對重複內容的具體修改建議]
```

#### 劇情弧分析 (24-B)

```markdown
### 劇情弧分析

| 場景 | 劇情節拍 | 緊張度 |
|------|---------|-------|
| TitleScene | — | 0.2 |
| ContentScene1 | inciting_incident | 0.4 |
| ContentScene2 | rising_action | 0.6 |
| ContentScene3 | climax | 0.9 |
| OutroScene | resolution | 0.3 |

- **弧線評分：** [0-100]
- **判定：** 結構完整 / 缺乏高潮 / 中段平淡 / 高潮過早
- **建議：** [zh_TW — 針對結構問題的具體修改建議]
```

#### 伏筆追蹤 (24-C)

```markdown
### 伏筆追蹤

| 伏筆 | 種植集數 | 回收集數 | 狀態 |
|------|---------|---------|------|
| [描述] | ch1ep1 | ch1ep3 | ✅ 已回收 |
| [描述] | ch2ep1 | — | ⚠️ 待回收（已過 2 集） |

- **種植數：** [N]
- **已回收數：** [N]
- **逾期未回收：** [N]
```

#### 角色成長軌跡 (24-D)

```markdown
### 角色成長軌跡

| 角色 | 成長方向 | 弧線評分 | 狀態 |
|------|---------|---------|------|
| [charId] | 正向成長 / 負向轉變 / 平坦 / 循環 | 0.72 | 正常 |
| [charId] | 平坦 | 0.12 | ⚠️ 連續 3+ 集無變化 |

- **整體評估：** [zh_TW — 角色發展是否合理]
```

### Updated gate section order

1. Pipeline 執行紀錄
2. 檢查結果 (PASS/WARN/FAIL — now includes new checks)
3. 角色一致性
4. 招牌梗演進
5. 故事 Arc 連續性
6. **重複內容檢查** (NEW 24-A)
7. **劇情弧分析** (NEW 24-B)
8. **伏筆追蹤** (NEW 24-C)
9. **角色成長軌跡** (NEW 24-D)
10. **節奏分析** (NEW 24-E)
11. 閘門判定

---

## Phase 25: Remotion Novel Video Generation Framework (P1)

### 25-A: Narrative Scene Templates

Pre-built scene components for common novel structures:
- `DialogScene` — multi-character dialog with reactions, timing from segment-durations.json
- `ActionScene` — dynamic battle/action with ComicEffects, ScreenShake, energy beams
- `MontageScene` — time-lapse montage with music, cross-dissolve transitions
- `TransitionScene` — chapter/episode transitions with title cards

### 25-B: Story Beat Visualization

Visual indicators for plot structure within video:
- `PlotBeatOverlay` — shows current position in dramatic arc (subtle progress bar)
- `TensionMeter` — visual bar reflecting story tension level
- `ChapterTitleCard` — chapter/arc context card at episode start

### 25-C: Character Arc Visual Indicators

Show character development visually within video:
- `CharacterStateOverlay` — current emotional state indicator
- `RelationshipGraph` — overlay showing character relationships
- `TraitEvolutionVisual` — visual representation of character trait changes

### Integration with bun_graphify

Phase 25 components consume Phase 24 analysis output:
- `PlotBeatOverlay` reads `plot_beat` nodes from merged-graph.json
- `TensionMeter` reads per-scene tension scores from pacing analysis
- `CharacterStateOverlay` reads character growth trajectory data

**Status:** Sketched only. Detailed spec after Phase 24 validates the approach.

---

## Key Design Decisions

1. **Duplicate gate reuses existing Jaccard** — `computeJaccardSimilarity()` at `story-algorithms.ts:79-124` already computes episode-pair similarity. New `checkDuplicateContent()` reads the matrix. Zero new algorithms.

2. **Plot arc via subagent, not regex** — Dramatic structure classification needs NL understanding. Follow Phase 23's proven file-based pattern: write input → AI classifies → read output → validate. **Phase 26 upgrades this to direct API calls via pi-agent.**

3. **Foreshadowing needs cross-episode link edges** — New `foreshadows` edge type in merge script. Subagent identifies planted elements from dialog/narration text. **Merge step fixed in v0.9.1** — `graphify-merge.ts` reads `foreshadow-output.json` and creates nodes + link edges.

4. **Character growth upgrades existing function** — `computeCharacterArcScore()` at `story-algorithms.ts` now returns `CharacterArcResult` (direction-aware) instead of a plain number. **Note:** `graphify-check.ts` reimplements inline because it works with raw JSON, not graphology. Both produce equivalent results.

5. **Gate template in episode-creation.md** — Each new check gets a dedicated zh_TW subsection. The subagent that generates the gate section must include all new subsections.

6. **Phase 25 is sketched only** — Remotion framework items are placeholders. Detailed spec comes after Phase 24 validates the story quality approach.

7. **Phase 26 is orthogonal** — pi-agent AI integration benefits Phase 23 + Phase 24 + future phases by replacing manual file-based subagent handoff with direct API calls. **Phase 26 now complete** (A/B1/B2/B3/C1).

8. **24-E pacing uses dialog-only signal** — Original plan called for 4 signals (conflict edges, dialog, ComicEffects, tech terms) but only `dialog_line_count` is available per-scene. The other signals are episode-level, not scene-level, in the current graph schema. The simplified approach is still useful — dialog density is a reasonable proxy for scene activity. Future enhancement: add `effect_count` and `character_count` to scene nodes for richer tension scoring.

## Phase 24 Implementation Reflections

### What worked well

- **File-based subagent pattern is consistent** — `buildPlotArcPrompt()` and `buildForeshadowPrompt()` follow the same `buildXxxPrompt()` → JSON input/output pattern as `buildCrossLinkPrompt()`. Easy to extend.
- **check functions are composable** — Each check returns `{ results: CheckResult[], ...data }` and the report generation aggregates all. Adding new checks is low-risk.
- **Gate template updates are mechanical** — Once the check produces structured data, the template subsection is just formatting.

### Gaps and technical debt

1. ~~**graphify-merge.ts doesn't create foreshadow nodes/edges**~~ — **Fixed in v0.9.1.** `graphify-merge.ts` Step 4e reads `foreshadow-output.json`, creates `foreshadow` nodes + `foreshadows` link edges, and patches node attributes for payoffs.

2. **Thematic coherence (24-F) remains blocked** — Needs `theme` node type. Options: (a) add `buildThemeExtractionPrompt()` subagent, or (b) derive themes from character_trait + tech_term co-occurrence. Low priority — 5 of 6 Phase 24 checks are complete.

3. ~~**No pipeline integration for plot arc + foreshadowing subagents**~~ — Phase 24-B/C subagent steps remain manual, but Phase 26 `--mode ai` now provides an automated path via direct API calls. The comparison (26-C3) showed AI mode produces plot_event/gag/artifact nodes and triggers/relates_to edges that regex cannot, but regex produces denser traits (31 vs 18) and tech terms (29 vs 21). **Recommendation:** hybrid approach — run regex first for density, then AI for exclusive types, merge both.

4. ~~**Gate subagent prompt doesn't reference new sections**~~ — **Fixed in v0.9.1.** Step 3b now has 9 explicit subagent tasks including duplicate content check, plot arc analysis, foreshadowing tracking, and character growth trajectory.

5. **24-E pacing signal is limited** — Only `dialog_line_count` is used as tension proxy. Conflict edges, ComicEffects, and tech terms are episode-level, not scene-level. A quiet but intense scene may score low. Future: add `effect_count` and `character_count` to scene node properties.

### Recommended next steps

1. ~~**Fix the merge gap**~~ — Done (v0.9.1)
2. ~~**Update Step 3b subagent prompt**~~ — Done (v0.9.1)
3. ~~**Unblock 24-E**~~ — Done (v0.12.0). `dialog_line_count` in scene nodes + `computePacingCurve()` + `checkPacing()`.
4. ~~**Phase 26 before 24-E/F**~~ — Done (v0.10.0). pi-agent AI integration complete (A/B1/B2/B3/C1).
5. **Phase 25 spec** — Phase 24 approach validated (5/6 checks complete); ready to spec Remotion narrative scene templates
6. ~~**Hybrid extraction**~~ — Done (Phase 27). `--mode hybrid` (default) runs regex first then AI supplements exclusives. Comparison on my-core-is-boss: hybrid 97 vs regex 54 vs ai 32.
7. **Phase 28-B** — Improved model benchmark with quality-weighted scoring and accuracy sampling. Deferred to next term.
8. **Enhance 24-E pacing signal** — Add `effect_count` and `character_count` to scene node properties in regex extraction for richer tension scoring.

## Phase 27 Implementation Reflections

### What worked well

- **Hybrid dedup is trivial** — "regex wins on same ID, AI adds the rest" avoids complex merging logic. Just `Set.has()` checks.
- **Comparison tool validates empirically** — `graphify-compare.ts` runs all 3 modes on the same data and produces objective scores. No guesswork about which mode is best.
- **Default mode change is safe** — hybrid degrades gracefully to regex if AI fails. No behavior change for users without API keys (they can still use `--mode regex` explicitly).

### Gaps

1. **More WARN/FAIL in hybrid** — 15W/9F vs regex 6W/10F. More nodes trigger more consistency checks. Some AI-generated nodes may need post-validation (e.g., artifact names matching series canon).
2. **Per-episode stats derived from merged graph** — comparison report groups by `episode` attribute on nodes, not from per-episode graph.json. Adequate for comparison but misses per-episode nuances.
3. **No AI call batching** — hybrid makes 1 API call per episode sequentially. For large series (weapon-forger 12 eps), this could be parallelized.

### Recommended next steps

1. ~~**Hybrid extraction**~~ — Done (Phase 27)
2. ~~**Unblock 24-E**~~ — Done (v0.12.0). `dialog_line_count` in scene nodes + pacing analyzer.
3. **Phase 25 spec** — Story quality approach validated; ready to spec Remotion narrative scene templates
4. **Parallel AI calls** — For hybrid mode with many episodes, batch AI calls with Promise.all()

---

## Phase 28: Model Benchmark for Graphify Hybrid Mode (P1)

Empirically compare all z.ai models on the graphify hybrid pipeline to find the best default.

### Context

Phase 27 established `--mode hybrid` as the best extraction mode (score 97 vs regex 54 vs ai 32). But the default model (`glm-4.7-flash`) was never benchmarked against newer models. Preliminary 3-model run on my-core-is-boss showed `glm-5` far outperforms `glm-4.7-flash` (score 634 vs 498, 258 nodes vs 196).

### pi-ai SDK Model Registry

All z.ai models use `openai-completions` API via `https://api.z.ai/api/coding/paas/v4`. No node_modules patching needed — `@mariozechner/pi-ai@0.67.68` already registers these models under the `zai` provider:

| Model ID | Notes |
|----------|-------|
| `glm-4.5` / `glm-4.5-air` / `glm-4.5-flash` | Older generation, text only |
| `glm-4.6` / `glm-4.6v` | Tool streaming support |
| `glm-4.7` / `glm-4.7-flash` / `glm-4.7-flashx` | Current default (`glm-4.7-flash`) |
| `glm-5` | Reasoning model, highest node count in initial test |
| `glm-5-turbo` | Faster variant |
| `glm-5.1` | Latest generation |
| `glm-5v-turbo` | Vision variant |

### Benchmark Plan

Run `graphify-pipeline --mode hybrid` for each candidate model on my-core-is-boss (5 episodes):

1. **Candidates:** `glm-4.7-flash` (current default), `glm-4.7`, `glm-5`, `glm-5-turbo`, `glm-5.1`
2. **Metrics:** total nodes, total edges, node type breakdown, PASS/WARN/FAIL, composite score
3. **Score formula (from graphify-compare.ts):** `nodeTypeCount × 10 + nodeCount × 1 + edgeCount × 0.5 + linkEdgeCount × 2 − failCount × 3 + passCount × 1`
4. **Decision criteria:**
   - Primary: highest composite score
   - Secondary: fewest FAIL (quality over quantity)
   - Tertiary: cost (models with cost 0 are free-tier; prefer free if scores are close)

### Preliminary Results (3 models)

| Metric | glm-4.7-flash | glm-4.7 | **glm-5** |
|--------|:---:|:---:|:---:|
| Nodes | 196 | 180 | **258** |
| Edges | 307 | 292 | **440** |
| PASS | 19 | **20** | 18 |
| WARN | 10 | **5** | 9 |
| FAIL | 10 | 10 | 10 |
| **Score** | 498 | 476 | **634** |

### Final Results (6 models, my-core-is-boss, 5 eps, hybrid mode)

| Metric | glm-4.5-air | glm-4.7 | glm-4.7-flash | **glm-5** | glm-5-turbo | glm-5.1 |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| Nodes | 124 | 164 | 196 | **258** | 178 | 109 |
| Edges | 231 | 271 | 307 | **440** | 291 | 215 |
| PASS/WARN/FAIL | 10/8/6 | 20/9/6 | 19/10/10 | 18/9/10 | 19/11/6 | 17/6/10 |
| **Score** | 391 | 461 | 498 | **634** | 484 | 333 |

**Decision: glm-5 set as default.** Pending improved benchmark in next term (see Phase 28-B).

### Scoring Bias Analysis

The composite score formula has known biases that may favor quantity over quality:

| Bias | Impact | Example |
|------|--------|---------|
| **Quantity bias** | `+1 per node` rewards extraction volume regardless of accuracy | Model with 258 noisy nodes beats 164 clean ones |
| **Weak FAIL penalty** | `−3 per FAIL` is easily offset by a few extra nodes | 100 extra nodes = +100, which absorbs 33 FAILs |
| **Type diversity overweight** | `+10 per node type` rewards generating rare types even with 1 instance | 1 artifact node = +10, same as 10 character_trait nodes |
| **No accuracy signal** | No metric for extraction correctness (canon matching, dedup quality) | Hallucinated entities count the same as real ones |
| **Reliability confound** | Model scoring low may just have API issues during the run | glm-5.1 scored 333 because AI calls returned empty, not because it's worse |

### Phase 28-B: Improved Model Benchmark (next term)

Re-run benchmark with a fairer scoring system:

1. **Accuracy sampling** — Manual review of 10-20 nodes per model: count hallucinated entities (names not in narration.ts), count correct ones. Compute precision = correct / total.
2. **Quality-weighted score** — Replace raw node count with: `precision × nodeCount × 1` so accurate models score higher.
3. **FAIL weighting** — Increase FAIL penalty from −3 to −5 or −10 to better penalize noisy extraction.
4. **Reliability test** — Run each model 3 times; discard runs where AI calls fail (score = 0 if any episode gets 0 AI nodes). Report mean ± stddev.
5. **Per-episode fairness** — Ensure each model processes the same episodes with same regex baseline. Only the AI supplement varies.
6. **Graphify-compare.ts extension** — Add `--models` flag so the comparison tool can benchmark models, not just modes.

**Files:** `graphify-compare.ts` (+--models flag), `story-algorithms.ts` (+quality-weighted score)

### Deliverables

- [x] 6-model comparison table
- [x] Decision: glm-5 set as default in `ai-client.ts`
- [x] callAI timeout protection (60s AbortController)
- [x] bun_pi_agent model connection test
- [ ] Improved scoring formula (Phase 28-B, next term)
- [ ] Accuracy sampling for precision measurement (Phase 28-B, next term)
- [ ] `graphify-compare.ts --models` flag (Phase 28-B, next term)

---

## Phase 30: Genre-Aware KG Pipeline (P0 — generalize beyond my-core-is-boss)

### Problem

Current KG pipeline overfits to the novel workspace `my-core-is-boss`:

| Hard-coded Pattern | Location | Issue |
|---|---|---|
| `tech_term` scoring bonus | `graphify-compare.ts:171` | Comedy series has `techPatterns: []` — always scores 0 |
| `character_trait` scoring bonus | `graphify-compare.ts:174` | Trait extraction depends on per-character regex that may not apply |
| Xianxia effect patterns | `graphify-episode.ts:229` | `闪电\|爆炸\|轰\|砰` — battle-only, no comedy SFX |
| Novel title pattern | `graphify-episode.ts:138` | `第X章第X集` — only novel format |
| Freytag pyramid arc check | `graphify-check.ts` | `checkPlotArc()` expects inciting→climax→resolution; comedy uses setup→punchline→callback |

### Architecture

```
SeriesConfig
  ├── genre: "xianxia_comedy" | "galgame_meme" | "novel_system" | "generic"
  ├── scoringProfile: {
  │     bonusNodeTypes: string[],      // which node types get bonus weight
  │     penaltyWeights: {...},          // WARN/FAIL severity multipliers
  │     arcShape: "freytag" | "joke_cycle" | "montage"
  │   }
  ├── effectPattern: RegExp            // per-genre SFX detection
  └── titlePattern: RegExp             // per-genre title extraction

graphify-check.ts
  ├── genre === "xianxia_comedy" || "novel_system"
  │     → checkPlotArc() (Freytag: inciting→rising→climax→falling→resolution)
  │     → checkForeshadowing()
  ├── genre === "galgame_meme"
  │     → checkComedyArc() (setup→escalation→punchline→callback)
  │     → checkGagDiversity()
  └── genre === "generic"
        → basic consistency checks only

graphify-compare.ts
  └── score += (nodesByType[profile.bonusNodeTypes[i]] ?? 0) * profile.bonusWeight[i]
```

### Comedy Genre Specifics (galgame-meme-theater)

| Aspect | Novel (my-core-is-boss) | Comedy (galgame-meme-theater) |
|--------|------------------------|-------------------------------|
| Arc shape | Freytag pyramid (5 beats) | Joke cycle (setup→buildup→punchline→callback) |
| Key nodes | `tech_term`, `character_trait` | `gag_manifestation`, `character_trait` |
| Pacing signal | Dialog density + conflict | Punchline frequency + gag variation |
| Cross-episode link | Foreshadowing (plant→payoff) | Callback (previous gag → new twist) |
| Quality check | Plot completeness | Gag evolution + diversity |

---

## Phase 31: Subagent-Based KG Quality Scoring (P1 — replace programmatic-only)

### Problem

Programmatic scoring has known biases:

| Bias | Impact |
|------|--------|
| Quantity over quality | More nodes = higher score, regardless of accuracy |
| No accuracy signal | Hallucinated entities count same as real ones |
| Fixed type weights | `tech_term` bonus hurts comedy series |
| No semantic understanding | Can't detect nonsensical relationships |

### Architecture

```
graphify-score.ts (NEW)
  │
  ├── 1. Run pipeline (existing)
  │
  ├── 2. Build scoring prompt
  │     Input: merged-graph.json summary + narration.ts excerpts
  │     Rubric:
  │       - Entity accuracy (0-10): labels match source?
  │       - Relationship correctness (0-10): edges semantically valid?
  │       - Completeness (0-10): major story elements captured?
  │       - Cross-episode coherence (0-10): cross-links make sense?
  │       - Actionability (0-10): can Remotion pipeline use this?
  │
  ├── 3. Call subagent (callAI)
  │     Returns: { dimensions: {...}, overall: 0-10, justification: "..." }
  │
  ├── 4. Compute blended score
  │     blended = 0.3 * programmatic + 0.7 * subagent_overall
  │
  └── 5. Write kg-quality-score.json

graphify-compare.ts (enhanced)
  └── Add "Subagent Score" column + per-dimension breakdown to comparison report

graphify-regression.ts (NEW)
  ├── Test corpus: my-core-is-boss + galgame-meme-theater + weapon-forger
  ├── Baseline: kg-quality-baseline.json
  └── Report: per-series delta, regression detection (>10% drop from baseline)
```

### Why subagent, not programmatic

- **Accuracy requires reading comprehension** — "Does node '周墨: 科技工程術語' match the narration text?" needs NL understanding
- **Edge validity is semantic** — "Is `uses_tech_term` edge between `zhoumo` and `模組化設計` correct?" needs context
- **Actionability is subjective** — "Can a Remotion scene be built from this data?" needs design judgment
- **Comedy arc structure is fuzzy** — "Is this gag escalation or just repetition?" needs humor understanding

---

## Phase 32: KG-Driven LLM Prompt Enhancement (P2 — feedback loop)

### Architecture

```
merged-graph.json
  │
  ├── buildRemotionPrompt()
  │     ├── Previous episode summary (key events, character states)
  │     ├── Active foreshadowing (planted, not yet paid off)
  │     ├── Character growth trajectory (direction + recent traits)
  │     ├── Gag evolution history (last 2 episodes)
  │     ├── Pacing profile of previous episode
  │     └── Thematic coherence data
  │
  ├── Episode-creation Step 3b
  │     └── Uses enriched prompt → better PLAN.md → better video
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
| `story-graph.ts` enhancements | `loadPreviousEpisodeSummary()`, `loadActiveForeshadowing()`, `loadGagEvolution()`, `loadCharacterArcContext()` |
| `graphify-enrich.ts` (NEW) | Post-render KG enrichment (actual durations → predictions) |
| `prompt-calibration.ts` (NEW) | Track which KG features correlate with quality scores |

---

## Files Modified (Phase 24)

| File | Changes |
|------|---------|
| `bun_app/bun_graphify/src/types.ts` | +PlotBeat, +Foreshadow interfaces |
| `bun_app/bun_graphify/src/scripts/graphify-check.ts` | +checkDuplicateContent(), +checkPlotArc(), +checkForeshadowing(), +checkCharacterGrowth(), +checkPacing() |
| `bun_app/bun_graphify/src/scripts/story-algorithms.ts` | +computePlotArcScore(), upgrade computeCharacterArcScore(), +computePacingCurve() |
| `bun_app/bun_graphify/src/scripts/subagent-prompt.ts` | +buildPlotArcPrompt(), +buildForeshadowPrompt() |
| `bun_app/bun_graphify/src/scripts/ai-crosslink-generator.ts` | algorithm-only cross-links from Jaccard |
| `bun_app/bun_graphify/src/scripts/graphify-pipeline.ts` | new pipeline steps for plot arc + foreshadowing |
| `topics/episode-setup/episode-creation.md` | gate template: +5 new subsections (incl. 節奏分析) |

## Files Modified (Phase 27)

| File | Changes |
|------|---------|
| `bun_app/bun_graphify/src/ai-client.ts` | hybrid mode type, default changed to `"hybrid"` |
| `bun_app/bun_graphify/src/scripts/graphify-episode.ts` | Step 7.5: hybrid AI supplement merge |
| `bun_app/bun_graphify/src/scripts/graphify-pipeline.ts` | `--mode hybrid` passthrough |
| `bun_app/bun_graphify/src/scripts/graphify-compare.ts` | NEW — mode comparison tool |
| `bun_app/bun_graphify/src/scripts/graphify-merge.ts` | manifest in merged-graph.json |
| `bun_app/bun_graphify/src/scripts/graphify-check.ts` | manifest in consistency report |
| `bun_app/bun_graphify/src/scripts/gen-story-html.ts` | manifest in HTML meta + footer |
| `topics/episode-setup/episode-creation.md` | gate template: +4 new subsections |
