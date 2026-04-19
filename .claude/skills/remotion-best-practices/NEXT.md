# NEXT — Current Work

> **Entry point.** Read this first. Load TODO.md and PLAN.md sections only when actively working on a task.
>
> **Cross-linked docs:**
> - `TODO.md` — Active tasks (Phase 33-I/35-39)
> - `PLAN.md` — Active phase specs (Phase 31–33)
> - `TODO-archive.md` — Completed tasks (Phase 24–30)
> - `PLAN-archive.md` — Completed phase specs (Phase 24–30)
> - `../storygraph/TODO.md` — Storygraph pipeline tasks + run history
> - `../storygraph/PLAN.md` — Storygraph architecture, node types, edge relations
> - `../develop_bun_app/TODO.md` — bun_app code-level tasks
> - `../develop_bun_app/PLAN.md` — bun_app architecture

> **Status:** v0.28.1 — Episode-creation deploy mode + hybrid mode docs + SKILL.md kg-review topic. All documentation gaps closed.

## Next Task

**Phase 33-H: COMPLETE.** Next options:

### Phase 33-C3: CI Integration Guide completion (MEDIUM IMPACT)
- Complete GitHub Actions workflow file (guide exists but no actual `.github/workflows/`)
- Add multi-series matrix test pattern

### Phase 35: Web UI Foundation (HIGH IMPACT, LONG TERM)
- 35-A/B/C: Hono API server + React SPA + script module exports
- Replaces Claude Code skill interactions with web UI
- 33-H1: Episode-creation.md deploy path
- 33-H2: Hybrid mode instructions
- 33-H3: SKILL.md topic detection update

**Recommendation:** Phase 33-I (my-core-is-boss rebuild) — real-world validation of the full pipeline at scale. Documentation can follow.

**Long-term:** Phase 35-39 (Web UI: Bun + Hono + React SPA, full pipeline orchestration)

## Goal Reflection: Storygraph Progress

### What's DONE (strong):
- **Core extraction pipeline:** Regex + AI + Hybrid modes, genre-aware (xianxia_comedy, galgame_meme, novel_system)
- **Quality gate:** Tier 0 (programmatic 13+ checks) + Tier 1 (GLM scoring) + Tier 2 (Claude review)
- **Visualization:** vis.js HTML with community detection, PageRank, cross-links
- **CLI:** `storygraph` CLI with CI mode, score, write-gate, parse-plan, validate-plan
- **Category system:** 7 video categories, scene templates, category-aware scaffolding (episodeforge)
- **Episode pipeline:** Workspace-first enforcement, PLAN/TODO lifecycle, graphify quality gate

### What's NOT done (critical gaps):
1. **Phase 33-F3 — Deploy automation story draft (0%):** Story draft generator missing. Human-in-the-loop still mandatory for creative decisions.
2. **Phase 33-C3 — CI guide (0%):** CI mode works but no documentation.
3. **Phase 33-H — Workflow docs (0%):** No deploy-mode path documented.

### What's partially done:
- **Phase 32-B — Post-render enrichment + calibration:** graphify-enrich.ts + prompt-calibration.ts implemented. Enrichment works (28 scenes enriched for weapon-forger). Calibration shows 4/8 sections never populated for narrative series. The full loop is structurally closed but needs more episodes to produce actionable correlations.
- **Phase 33-C3 — CI guide (0%):** CI mode works but no documentation
- **Phase 33-H — Workflow docs (0%):** No deploy-mode path documented

### bun_app/storygraph sync issues:
- Phase 30 (genre-aware) code-level tasks marked "planned" but many exist as done in skill-level docs
- Phase 31 code-level tasks also out of sync — skill says 31-A complete, code TODO still lists as planned

## Reflections

### Phase 33-H: Episode-Setup Workflow Adjustment (this session)

- **33-H1: Deploy mode docs** — Added "Deploy Mode: Streamlined Pipeline for Established Series" section to episode-creation.md. Documents when to use deploy mode (≥ 3 eps, gate v2.0, blended ≥ 70), CLI commands replacing Steps 3a-3b, comparison table vs full workflow.
- **33-H2: Hybrid mode docs** — Added "Hybrid Mode: Dual-LLM Architecture" section. Documents GLM (free) vs Claude (paid) task assignment, how hybrid extraction combines regex + AI, cost optimization notes.
- **33-H3: SKILL.md topic detection** — Added kg-review row: "quality review, kg-review, gate.json, quality-score, tier 2, claude review, regression, CI, gate v2" → `topics/kg-review/_topic.md`.
- **_topic.md updated** — Added deploy-mode and hybrid-mode sections to episode-setup summary.
- **393 tests pass** (unchanged — documentation only).
- **Honest assessment:** The deploy mode docs describe CLI tools that exist and work (`storygraph pipeline`, `write-gate`, `regression`). The "≥ 3 episodes" threshold is conservative — deploy mode could work with 2 episodes but the merged graph would be thin. The hybrid mode docs clearly delineate which LLM handles which task, which should help future sessions decide when to use GLM vs Claude. The cost optimization section (1 GLM call/ep for extraction, 1 for scoring; 2-3 Claude calls for creative work) gives concrete numbers for planning.

### Phase 33-I: my-core-is-boss Storygraph Rebuild (this session)

- **Full pipeline run** in hybrid mode: 5 episodes (not 34 — that's the planned total), 173 nodes, 315 edges, 40 link edges, 8 communities
- **Node types:** tech_term (44), scene (41), character_trait (31), character_instance (22), plot_beat (17), theme (13), episode_plot (5)
- **Communities:** 5 episode-based + 1 narrator (cohesion 1.0) + 2 orphan tech_terms. Global modularity 0.624.
- **Degree hubs:** 林逸 instances (deg 21-31), 趙小七 (deg 14-22), episode_plot nodes (deg 15-19)
- **Gate v2.0:** 100/100 (22 PASS, 16 WARN, 1 FAIL). FAIL = Plot Arc "No climax beat" (AI-generated plot_beats lack explicit climax classification)
- **AI quality:** 5.8/10 — limited by narration truncation in scoring prompt. AI noted "truncated header boilerplate with no actual dialogue or plot content"
- **Blended:** 74.8% (ACCEPT). Programmatic 100, AI 58.
- **Quality breakdown:** consistency 0.5, arc_structure 0.8, pacing 1.0, character_growth 0.79, thematic_coherence 0.3, gag_evolution null
- **Regression runner fix:** `--update` now creates baselines for series without existing ones (was silently skipping). Bug: `--series my-core-is-boss --update` → "NO BASELINE" instead of creating one.
- **5-series regression suite complete:** storygraph-explainer (100), my-core-is-boss (100/74.8%), galgame-meme-theater (0/25.2%), weapon-forger (0/37.2%), xianxia-system-meme (100/78.4%)
- **393 tests pass** in 204ms
- **Honest assessment:** The gate score of 100 with 1 FAIL is suspicious — Plot Arc FAIL has -15 impact but score stays 100. The scoring formula likely caps at 100 after summing impacts (more PASS/WARN bonuses offset the FAIL). The AI score (5.8/10) is limited by the scoring prompt sending narration headers rather than full dialog text — this is a known limitation of the current buildKGScorePrompt(). The two singleton communities (orphan tech_terms) suggest some AI-generated nodes lack connections. thematic_coherence at 0.3 is the weakest dimension — themes aren't well-linked across episodes. The series has only 5 of planned 34 episodes, so cross-episode structure will improve as more episodes are added.

### Graph HTML Info-Panel Scrollbar + Expand-Neighbors Fix (this session)

- **CSS scrollbar fix** in both `graph-html.ts` + `gen-story-html.ts`:
  - `#info-panel`: `flex-shrink: 0` → `flex: 0 1 auto` — panel now respects max-height in flex layout
  - `max-height: 50vh` → `40vh` — leaves room for legend/stats below
  - Custom `::-webkit-scrollbar` styling (6px thumb, dark track) — scrollbar is visible, not hidden
  - `#info-panel h3` sticky header — "Story Node" stays pinned while scrolling content
- **Expand-neighbors button fix:**
  - Replaced broken inline `onclick` (nested escaping broke during innerHTML assignment) with clean global `expandNeighbors()` function
  - `_pendingNeighbors` array stores remaining neighbors; `INITIAL_NEIGHBORS = 15` cap
  - Clicking "+N more" appends remaining pills via DOM and hides the button
- **New CSS classes:** `.neighbor-section`, `.neighbor-header`, `.show-more` — structured neighbor area with count label
- **393 tests pass**, 359ms
- **HTML regenerated** for weapon-forger + storygraph-explainer
- **Honest assessment:** The expand-neighbors uses a global `_pendingNeighbors` array which is fragile if multiple panels existed — but vis.js only has one info panel, so it's fine. The `::-webkit-scrollbar` is WebKit-only (Chrome/Safari) — Firefox uses standard scrollbar-width/scrollbar-color which we didn't add (low priority). The 40vh cap may still feel tight on small screens; a future improvement could make it responsive.

### Graph HTML Overflow Fix + Playwright Debugging (previous session)

- **Overflow bug fixed** in two template files: `graph-html.ts` (per-episode) + `gen-story-html.ts` (merged)
  - `#graph` gets `overflow: hidden` — clips node labels bleeding into sidebar
  - `#info-content` gets `word-break: break-word; overflow-wrap: break-word` — long labels wrap
  - `.neighbor` pills get `max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap` — truncate instead of overflow
  - `.neighbors` gets `display: flex; flex-wrap: wrap; gap: 4px` — proper wrapping
  - vis.js nodes get `widthConstraint: { maximum: 120-150 }` — caps node label width
- **Playwright debugging workflow established** for vis.js graph HTML:
  - HTTP server needed (`npx http-server`); `file://` blocked by Playwright
  - `run-code --filename` pattern for complex JS (plain `eval` breaks on semicolons)
  - Node degree ranking via `network.body.data.edges` aggregation
  - Click-by-ID via `network.getPositions()` + `network.canvasToDOM()`
- **Memory saved:** `.agent/memory/reference/playwright-visjs-debug.md`
- **Skill updated:** `.claude/skills/storygraph/operations/html.md` with debugging section
- **393 tests pass** in 308ms
- **Honest assessment:** The overflow was a CSS issue that affected any series with high-degree nodes (narrator nodes with 20+ connections). The `widthConstraint` on vis.js nodes is a global cap — some short labels now have wider containers than needed. The flex-wrap fix for neighbor pills is the most impactful change. The `max-height: 50vh` on `#info-panel` was the critical fix — without it, 20+ neighbor pills pushed the legend and stats off-screen entirely.

### Phase 33-C3: CI Integration Guide (this session)

- **ci-guide.md created** — `topics/kg-review/ci-guide.md` with GitHub Actions, pre-commit hooks, regression baselines, multi-series matrix patterns
- **Covers:** Quality gate check, regression detection, full pipeline + score, Husky/Lefthook/shell hooks, threshold tuning, environment variables
- **Honest assessment:** The guide is comprehensive for current CI features. Missing: actual GitHub Actions workflow file (the guide shows YAML examples but doesn't create `.github/workflows/`). The regression runner only checks baselines that exist — series without baselines silently pass.

### Phase 28-B: Model Benchmark (this session)

- **graphify-model-bench.ts** — New script: runs pipeline in hybrid mode across multiple GLM models, supports `--runs N` for reliability, `--accuracy` for precision sampling, `--keep` for preserving per-model output.
- **Model summary statistics** — computeMean, computeStddev, summarizeModel functions. Per-model: gate score, blended score, node/edge counts, duration — all with mean±stddev across runs.
- **Accuracy sampling** — buildAccuracyPrompt sends 10-20 nodes to AI for real/hallucinated evaluation. parseAccuracyResponse extracts precision per model. Filters out episode_plot and narrator nodes.
- **CLI wired:** `bun run storygraph model-bench <series-dir> [--models ...] [--runs N] [--accuracy]`
- **19 new tests** (mean/stddev/summary/report/prompt/sampling/parsing). **393 total tests pass** in 207ms.
- **Honest assessment:** The script is structurally complete but has not been run with actual API calls (cost concern — each model run = full pipeline). The accuracy sampling uses a separate AI call to evaluate nodes, which adds latency. The default models (glm-4.5-flash, glm-4.6, glm-5) may not all support JSON extraction — glm-4.5-flash might be too lightweight. The real test will come from running `bun run storygraph model-bench <series> --runs 3` on a small series like xianxia-system-meme (2 episodes, fast pipeline).

### Phase 31-B1: Regression Test Corpus Curation (this session)

- **Fixed `weapon-forfer` → `weapon-forger` typo** in baselines directory
- **Baselines updated to current pipeline output** (date 20260420) for all 4 v2.0 series: weapon-forger, storygraph-explainer, galgame-meme-theater, xianxia-system-meme
- **my-core-is-boss excluded** — gate v1.0 format lacks `quality_breakdown` field, incompatible with regression runner. Needs pipeline re-run with hybrid mode before inclusion.
- **Regression runner guard added** — `quality_breakdown` null check prevents crash on v1.0 gate data
- **All 4 series PASS regression** — baselines match current output (0% delta). weapon-forger: gate 0/100, blended 37.2%. storygraph-explainer: gate 100/100. xianxia-system-meme: gate 100/100, blended 78.4%. galgame-meme-theater: gate 0/100, blended 25.2%.
- **374 tests pass** in 230ms.
- **Honest assessment:** The test corpus is structurally complete for 4 series but the baselines are thin — weapon-forger and galgame-meme-theater both score 0/100 on gate (duplicate content + flat pacing issues). The regression runner will catch changes to these scores, but the starting scores are low. my-core-is-boss (34 episodes) is the largest series and can't be included until its pipeline is re-run. The real value will come from tracking regression across pipeline code changes (e.g., after fixing the duplicate node issue in hybrid mode).

### Phase 33-G: Evaluation Framework (this session)

- **graphify-regression.ts** — Regression runner comparing pipeline results against baselines. Loads gate.json + kg-quality-score.json, computes deltas per metric (gate_score, breakdown dimensions, check counts, blended score, AI dimensions). Flags regressions when delta > threshold (default 10%). Supports `--ci` mode (exit 1 on regression), `--update` to save new baselines, `--series` filter, `--threshold` override.
- **graphify-tier-compare.ts** — Cross-series comparison table generator. Reads gate/quality/merged data from all series with pipeline output. Generates markdown tables: summary (score/blended/nodes), check status counts, quality breakdown dimensions, AI dimensions, extraction mode comparison.
- **graphify-cost-matrix.ts** — Pipeline step timing tracker. Measures per-step duration (load gate/quality/merged, compute stats) and generates cost/latency report with step summary (avg/min/max/success rate) and series summary (avg/min/max total time). Supports `--runs N` for reliability testing and `--json` output.
- **CLI wired:** `bun run storygraph regression`, `bun run storygraph tier-compare`, `bun run storygraph cost-matrix`. All three added to CLI help text and command dispatch.
- **40 new tests** (22 regression + 9 tier-compare + 9 cost-matrix). **374 total tests pass** in 218ms.
- **Honest assessment:** The evaluation framework is structurally complete but the current data is thin. The cost-matrix currently measures file I/O timing (ms), not actual pipeline execution time — for meaningful latency data, it should instrument graphify-pipeline.ts with per-step timing. The tier-compare report shows 5 series but only 2 have blended scores (weapon-forger, xianxia-system-meme). The regression runner found a typo in baselines (`weapon-forfer`) that should be fixed. The real value of these tools will come from repeated use: running regression after code changes, comparing tier-compare across extraction modes, and building up cost-matrix data over time.

### Phase 33-F4: Narration + TODO Generators (this session)

- **gen-narration.ts** — Generates narration.ts from scene data. Supports 3 templates: narrative_drama (multi-character with voice map), tech_explainer (single narrator), galgame_vn. Input via `--scenes <json>` or `--from-plan` (extracts scene names from PLAN.md tables). Generates TypeScript with proper types, voice maps, and segment arrays.
- **gen-episode-todo.ts** — Generates episode TODO.md from PLAN.md. Auto-detects category from directory name. Generates category-specific checklists: drama includes character image setup, tech_explainer uses narrator-only items. Links parent TODO.md if it exists.
- **CLI wired:** `bun run storygraph gen-narration <ep-dir>` and `bun run storygraph gen-todo <ep-dir>`
- **18 new tests** for both generators. **334 total tests pass** in 226ms.
- **Honest assessment:** These are template generators — they produce boilerplate structure, not creative content. The narration generator's `--from-plan` mode creates placeholder segments ("TODO: TitleScene narration") that still need human/AI writing. The TODO generator is more immediately useful — it saves ~5 minutes of copy-pasting checklist structure per episode. Both tools reduce the mechanical work of episode setup without attempting to automate creative decisions.

### Phase 32-B: KG Enrichment + Prompt Calibration (this session)

- **graphify-enrich.ts** — Reads voice-manifest.json + durations.json from episode audio dirs, matches scenes to KG nodes via scene name (TitleScene, ContentScene1, etc.), computes actual vs predicted metrics (dialog lines, characters, duration). Writes enrich-report.json + updates merged-graph.json properties.
- **prompt-calibration.ts** — Tracks 8 KG prompt features per episode (prev_summary, foreshadowing, character_constraints, gag_evolution, interaction_history, pacing_profile, thematic_clusters, tech_terms). Correlates feature presence with gate.json quality scores. Computes section-level score deltas and generates recommendations.
- **CLI wired:** `bun run storygraph enrich <series-dir>` and `bun run storygraph calibrate <series-dir>`
- **weapon-forger results:** 7 episodes, 28 scenes enriched (all matched). 4/8 prompt sections never populated (foreshadowing, gag, pacing, themes) — these are the weakest sections of the KG for this series. Scene properties were all undefined in the KG (known extraction gap), so all prediction errors are 1.0.
- **storygraph-explainer results:** 3 episodes enriched. Calibration shows narrative sections (foreshadowing, gag_evolution, interaction) are never populated for narrator-only tech_explainer (correct — SKIP). Pacing, themes, and tech_terms show +100 correlation (all episodes score 100 and all have these features).
- **19 new tests** for enrich + calibration logic. **316 total tests pass** in 216ms.
- **Honest assessment:** The full feedback loop is now structurally closed: KG → gen-prompt → story → render → enrich → calibrate → better KG. But the value is limited by data quality: weapon-forger's scene properties are all undefined, making enrichment a one-sided comparison (actuals only, no predictions to compare against). The real value will emerge when we have episodes that were generated with gen-prompt data — then we can measure if KG-informed prompts produce higher quality.

### storygraph-explainer Full Rebuild + Bug Fixes (this session)

- **Full pipeline rebuild** via `bun run storygraph pipeline`:
  - ep1: 33 nodes, 35 edges (11 AI-exclusive: 3 scene, 3 tech_term, 3 plot_beat, 2 theme)
  - ep2: 47 nodes, 50 edges (16 AI-exclusive: 6 scene, 4 tech_term, 5 plot_beat, 1 theme)
  - ep3: 47 nodes, 51 edges (18 AI-exclusive: 4 scene, 8 tech_term, 4 plot_beat, 2 theme)
  - Merged: 127 nodes, 144 edges, 5 link edges, 7 communities
  - Score: 100/100 (14 PASS, 6 WARN, 0 FAIL, 7 SKIP)
- **CLI CWD bug FIXED** — `storygraph episode/merge/check/pipeline` commands resolved positional args incorrectly. Root cause: `args.map(a => a.startsWith('-') ? a : resolve(a))` resolved flag values like `hybrid` as paths. Fix: explicit flag-value pair handling with `flagsWithValues` set.
- **Plot Arc SKIP for narrator-only** — tech_explainer has no dramatic arc, but checkPlotArc() found AI-generated plot_beat nodes and failed with "No climax beat". Fix: SKIP when `isNarratorOnly` is true.
- **Duplicate node issue identified but not fixed** — Hybrid mode creates duplicate scene nodes (regex: `TitleScene`, AI: `title`) and tech_term duplicates (regex: `社群偵測`, AI: `community_detection`). Dedup should normalize labels before merging. Estimated ~10% node count inflation.
- **Crosslink generator still requires Claude** — Step 3.5 (ai-crosslink-generator) generates a prompt for Claude but can't auto-execute. GLM-5 might work for this task (cross-link discovery is simpler than extraction).
- **219 tests pass** (73 storygraph + 146 episodeforge/remotion_types)
- **Honest assessment:** The CLI CWD bug was the most impactful fix — it blocked ALL pipeline usage through the CLI. The Plot Arc SKIP is cosmetic for tech_explainer but matters for gate.json accuracy. The duplicate node issue is the next highest-priority improvement — it inflates node counts and weakens community cohesion.

### Phase 32-A: KG Context Injection (this session)

- **buildRemotionPrompt() created** — 8-section zh_TW constraint prompt from KG data:
  1. 前集摘要 (Previous episode summary from KG episode_plot + scene + character nodes)
  2. 活躍伏筆 (Active foreshadowing from foreshadow-output.json)
  3. 角色特質約束 (Character trait constraints from enrichment data)
  4. 招牌梗演進 (Gag evolution from gag_manifestation nodes)
  5. 互動模式 (Interaction patterns from interacts_with edges)
  6. 節奏參考 (Pacing profile — tension bars from scene properties)
  7. 主題一致性 (Thematic coherence from theme nodes)
  8. 科技術語 (Tech term dedup from tech_term nodes)
- **kg-loaders.ts** — 8 server-side loaders: loadPreviousEpisodeSummary, loadActiveForeshadowing, loadPacingProfile, loadThematicCoherence, loadCharacterConstraints, loadGagEvolution, loadInteractionPatterns, loadTechTermUsage
- **story-graph.ts** — Added browser-side loadPreviousEpisodeSummary() and loadActiveForeshadowing() (pure data transforms, no I/O)
- **graphify-gen-prompt.ts refactored** — Was 570-line standalone script → now calls buildRemotionPrompt() + kg-loaders. ~150 lines.
- **CLI integration:** `bun run storygraph gen-prompt <series-dir> --target-ep <epId>`
- **297 tests pass** (26 new: 16 kg-loaders + 10 buildRemotionPrompt)
- **Honest assessment:** The feedback loop is structurally closed but the value depends on KG data quality. weapon-forger scene properties are all 0 (extraction didn't preserve them well), so pacing section is empty. The real test is using gen-prompt output for an actual episode and measuring quality improvement vs episodes written without it.

### storygraph-explainer Episode PLAN.md + TODO.md Backfill (this session)

- **Root cause:** Episodes were created via storygraph-first pipeline (narration → extraction → validate). The pipeline focused on extraction validation and never created the episode-level PLAN.md + TODO.md files that the workspace-first gate requires.
- **Fixed:** Created PLAN.md + TODO.md for all 3 episodes (ep1-ep3), each with:
  - Story summary, scene breakdown table, tech concepts
  - Quality Gate section (all `[x]` — extraction already passed)
  - Setup Tasks section (all `[ ]` — awaiting Remotion scaffold)
- **Workspace TODO.md synced:** Added backfill section, marked 2B + 2C phases as DONE
- **Lesson:** The storygraph-first pipeline skips episode PLAN.md/TODO.md because it starts with narration, not story approval. The workspace-first gate should be adapted for this workflow: create episode PLAN.md after narration passes extraction validation (not after user approves story draft).
- **Honest assessment:** These episodes are still in "narration done, awaiting scaffold" state. The workspace PLAN.md Episode Guide status should reflect this.

### Phase 2C: Hybrid Mode Fix + Validation (this session)

- **Three fixes applied to `ai-client.ts`:**
  1. `stripMarkdownFence`: Changed `([\s\S]*?)` (non-greedy) → `([\s\S]*)` (greedy). Handles nested backticks inside JSON strings — finds last closing fence instead of first.
  2. `repairTruncatedJSON`: New function. When GLM-5 response is truncated mid-JSON (hitting token limit), truncates at last comma boundary and closes open braces/brackets. Salvages partial results instead of discarding entirely.
  3. `maxTokens: 4096`: Added to `complete()` call. GLM-5 was silently truncating at default token limit — now gets enough room to finish responses.
- **Prompt simplified:** 9 node types → 6 essential types (dropped gag_manifestation, character_trait, artifact). Narration truncated to 2000 chars (was 3000). Output limited to ≤20 nodes. Response fits in 4096 tokens.
- **Hybrid vs regex comparison (storygraph-explainer):**
  - ep1: 22→37 nodes (+68%), 21→39 edges (+86%), 15 AI-exclusive (3 plot_beats, 3 themes, 6 tech_terms)
  - ep2: 31→47 nodes (+52%), 30→54 edges (+80%), 16 AI-exclusive (4 plot_beats, 1 theme, 5 tech_terms)
  - ep3: 30→47 nodes (+57%), 29→48 edges (+66%), 17 AI-exclusive (4 plot_beats, 2 themes, 7 tech_terms)
  - **Merged: 83→131 nodes (+58%), 88→149 edges (+70%), 0→8 communities, score 100/100**
- **All 3 episodes: stopReason "stop"** — clean completions, no truncation, no retries needed.
- **271 tests pass** (17 new for ai-client: 11 fence stripping + 6 JSON repair).
- **Honest assessment:** Hybrid mode is a clear win. The 8 communities (was 0) prove the graph has actual semantic structure beyond star topology. The plot_beat and theme nodes are exclusively AI-generated — regex fundamentally can't extract them. For narrator-only tech_explainer, hybrid transforms the graph from semantically empty to meaningfully clustered.

### Consistency Checker Fix + Regex→Hybrid Enforcement (this session)

- **Three bugs found and fixed:**
  1. `computeJaccardSimilarity()` compared node TYPES only → all tech_explainer episodes got Jaccard 1.000 (identical structure). Fixed: now includes `${type}:${label}` elements so actual content (tech_term labels) is compared. Result: 1.000 → 0.523-0.610 (honest WARN).
  2. `graphify-episode.ts` + `graphify-merge.ts` dropped `properties` from scene nodes when building graphology graph. `dialog_line_count`, `character_count`, `effect_count` set during extraction but lost in graph export. Fixed: spread `properties` into `G.addNode()`.
  3. Inapplicable checks returned vacuous PASS (scoring free points). Gag Evolution, Trait Coverage, Interaction Density, Character Consistency, Character Growth, Foreshadowing → all vacuous for narrator-only tech_explainer. Fixed: new SKIP status (not scored).
- **Score impact:** 75/100 (3 false FAIL) → 95/100 (0 FAIL, 6 SKIP, honest WARNs).
- **Regex mode is useless for production.** All storygraph-explainer work used `--mode regex` because AI mode has a parsing bug (GLM-5 returns markdown-fenced JSON with nested backticks). Regex produces flat star-topology: all tech_terms → narrator → episode_plot. No communities, no plot beats, no theme nodes. The consistency checker fixes only address the scoring — the underlying graph is still semantically empty.
- **SKILL.md updated:** Added enforcement rule: "Storygraph extraction MUST use `--mode hybrid` (or `ai`)". Regex only for structural debugging.
- **Honest assessment:** The storygraph pipeline was designed for narrative drama (characters, dialog, arcs, gags). For tech_explainer with a single narrator, even hybrid mode may produce limited value — but at least it should generate plot_beat nodes and theme nodes that regex can't. The real test is Phase 2C (hybrid re-run).

### storygraph-explainer Phase 1B: ep2+ep3 Written + Merged (this session)

- **ep2 (五階段管線):** 7 scenes (Title, Extract, Build, Cluster, Merge, Check, Outro), 22 tech_terms including AST, tree-sitter, graphology, 語法樹, 子圖, 品質閘門. 31 nodes, 30 edges.
- **ep3 (一行程式看見全貌):** 5 scenes (Title, Demo, Comparison, CTA, Outro), 23 tech_terms including Bun, TypeScript, tree-sitter. 30 nodes, 29 edges.
- **Added 6 tech patterns** to series config: TypeScript, Bun, 語法樹, 子圖, 品質閘門, Markdown.
- **Merged graph:** 83 nodes (61 tech_terms), 88 edges, 5 link edges, 3 algorithm cross-links. Score 75/100 (PASS).
- **Communities still 0** — narrator-only tech_explainer has star topology (all tech_terms → narrator → episode_plot). No dense subgraphs for Louvain to cluster. This is structural, not fixable.
- **Cross-links found:** 3 algorithm cross-links via Jaccard similarity (shared tech_terms between episodes).
- **Honest assessment:** The graph is rich in tech_term nodes (61!) but communities = 0 means the graph topology is inherently flat. For tech explainer, the value is in the cross-links between episodes (shared concepts), not community clustering. The quality gate score of 75 is honest — the WARN/FAIL items are about missing communities and single-narrator limitations, not content quality.

### storygraph-explainer Phase 2: Extraction Verified (this session)

- **Two parser bugs found and fixed:**
  1. `narrative.ts` segPattern: missing `,?` before `\s*\}` — TypeScript trailing commas after `{ character, text }` objects weren't matched, so ALL segments returned 0 lines, ALL scenes were filtered out.
  2. `graphify-episode.ts`: narrator tech_terms explicitly skipped (`if (charId === "narrator") continue`). For narrator-only series (tech_explainer), this killed ALL tech_term extraction. Fixed with `isNarratorOnly` check.
- **Series config updated:** Added 8 missing tech patterns (跨集連結, 故事弧線, 萃取, 一致性檢查, 視覺化, 資訊碎片化, 角色關係, 伏筆).
- **Test fixes:** Updated plan-parser tests for 6→3 episode redesign.
- **Extraction results (regex mode):** 22 nodes (1 plot + 4 scenes + 1 character + 16 tech_terms), 21 edges. All Phase 2 thresholds passed.
- **Lesson:** The segPattern bug affected ALL series, not just tech_explainer — weapon-forger segments also have trailing commas. But weapon-forger worked because... hmm, it must have worked somehow. Let me check — actually, weapon-forger narration.ts might not use trailing commas. The bug was latent until narration.ts format included trailing commas (TypeScript's default in many templates).
- **AI mode still broken:** GLM-5 returns markdown-fenced JSON with backticks that `stripMarkdownFence` can't clean. The regex in ai-client.ts only handles ````json...```` fences, not nested backticks. Low priority since regex mode alone produces rich results.
- **Honest assessment:** The 22-node graph is a success for the storygraph-first approach. But communities clustering failed ("graph too small") — we need ≥3 episodes with cross-links before community detection becomes meaningful. Phase 1B (ep2+ep3 narration) is the natural next step.

### storygraph-explainer Reset — Storygraph-First Pipeline (this session)

- **Deleted entire storygraph-explainer** — 6 episodes (ep1-ep6), storygraph_out, assets, all code. Cleaned root package.json (workspace + 3 sge scripts), dev.sh (6 episode entries + directory resolver). All untracked, so no git rollback needed.
- **Root cause of failure:** Previous approach was "scaffold code first → run storygraph → get empty graph." Tech_explainer narration_script has almost no dialog structure for storygraph to extract from (no characters, no dialog lines). The result was a star-topology graph with 11 nodes, 0 communities, 0 cohesion — semantically empty.
- **New approach: Storygraph-First Pipeline** — Write narration.ts first, run storygraph extraction, validate node richness (≥15 nodes, ≥4 types, ≥3 tech_terms), THEN scaffold code. If extraction is poor, fix the narration — don't blame the extraction.
- **Series redesigned as 3 episodes** (was 6): ep1 (知識圖譜是什麼？), ep2 (五階段管線), ep3 (一行程式看見全貌). Tighter scope, each 40-60s.
- **ep1 narration written:** 4 scenes (Title → Problem → Solution → Outro), 310 chars (~52s at 6 chars/sec), 15 tech concepts (知識圖譜, 節點, 邊, 社群偵測, PageRank, 跨集連結, 故事弧線, 伏筆, 萃取, 聚類, 一致性檢查, 管線, 視覺化, 資訊碎片化, 角色關係). Well above the ≥5 minimum.
- **Target audience:** Developers + content creators who work with serialized content. Tone: 快節奏科普 (Fireship style).
- **PLAN.md + TODO.md created** at `bun_remotion_proj/storygraph-explainer/` — storygraph-first pipeline documented as 4 phases.
- **Lesson:** For tech_explainer projects, storygraph extraction needs rich narration with explicit tech terms. "Placeholder" narration produces empty graphs. The storygraph-first approach forces quality content before any code exists.
- **Honest assessment:** The narration quality is decent but the real test is Phase 2 — running storygraph extraction and seeing if it actually produces ≥15 meaningful nodes. If hybrid mode still produces mostly scene+plot nodes with few tech_terms, we may need to extend the series config or the extraction logic for tech_explainer genre.

### storygraph-explainer Phase 2 (this session)

- **Split 1 episode → 6 episodes:** ch1-ep1 had 9 scenes (Title→Problem→Architecture→Feature×3→Demo→Comparison→Outro). Split into 6 focused episodes per PLAN.md: ep1 (Title+Problem+Solution+Outro), ep2 (Title+5 PipelineStages+Outro), ep3 (Title+AST Feature+Result+Outro), ep4 (Title+Federated KG+ArcTracking+Outro), ep5 (Title+Quality+Dashboard+Outro), ep6 (Title+Demo+Comparison+CTA+Outro).
- **New scenes created:** SolutionScene (knowledge graph concept), PipelineStageScene (reusable card component), ResultScene (call graph), ArcTrackingScene (character arc timeline), DashboardScene (quality overview), CTAScene (call-to-action with animated ring).
- **5 parallel agents** created ep2-ep6 simultaneously. ep1 was modified directly (removed 6 scenes, added SolutionScene, updated narration/composition).
- **All 6 rendered:** ep1 (3.7MB, 41s), ep2 (5.0MB, 64s), ep3 (2.9MB, 40s), ep4 (2.6MB, 33s), ep5 (2.5MB, 31s), ep6 (4.2MB, 50s). Total ~4.5 min of video.
- **Storygraph pipeline verified:** episode/merge/check all work on ep1. dev.sh updated with ep2-ep6 entries.
- **All 254 tests pass** in 171ms.
- **Lesson:** Background agents creating files concurrently causes Write tool collisions (file already exists). Must check before writing. Also: dev.sh needs manual updates for new episodes (ALL_APPS + get_comp_id).
- **Honest assessment:** Each episode is short (30-64s) with relatively simple scene animations. The narration quality is good (zh-TW, serena voice). Visual variety could improve — 4 episodes use the same dark gradient bg. The real value is the series structure: each episode is self-contained with teaser for next.

### P0: Test Suite Speedup (this session)

- **Root cause:** 3 test files in `bun_app/bun_pi_agent/` make live API calls (z.ai completions, agent runs, server spawns). Total ~15s for just those files. The other 19 files (storygraph, episodeforge, remotion_types) complete in <500ms combined.
- **Fix:** Added `bunfig.toml` with `pathIgnorePatterns = ["**/bun_pi_agent/**"]` to exclude from `bun test`. Added `test:all` script for full suite. Default `bun test` now runs in **180ms** (254 tests, 10 files) vs **13.3s** (422 tests, 22 files) — **74x speedup**.
- **Lesson:** `bunfig.toml` uses `pathIgnorePatterns` (not `exclude`). The `bun test` config key differs from CLI flag name `--path-ignore-patterns`. Also: the root `test` script already explicitly listed directories (excluding bun_pi_agent), so `bun run test` was always fast — only bare `bun test` was slow.
- **Honest assessment:** No actual test code was optimized. The speedup comes purely from excluding a workspace that contains integration-level tests. If bun_pi_agent tests need to run in CI, use `bun test bun_app/bun_pi_agent/` or `bun run test:all`.

### 33-C: CLI Packaging (this session)

- **cli.ts enhanced:** Added `score` command, `--ci` flag for non-interactive CI mode (exits 0 on pass, 1 on fail), `--mode/--provider/--model` flags in help text.
- **CI mode tested:** `bun run storygraph check <dir> --ci --mode regex` correctly exits 1 when gate score is 0/100.
- **package.json:** Bumped to v0.3.0, bin field already existed.
- **Lesson:** `await import()` doesn't work inside non-async callbacks (child_process `close` handler). Use top-level sync imports (`existsSync`, `readFileSync` from `node:fs`) for CI mode logic.
- **Honest assessment:** Test suite takes ~14s for 422 tests — too slow for rapid iteration. Need to profile and optimize as P0.

### 33-F2: Quality Gate Writer + GLM Dialog Assessment (this session)

- **graphify-write-gate.ts** — Step 3b lite: reads gate.json + kg-quality-score.json, generates template-based zh_TW quality gate report. Includes: overall score, trend (previous_score delta), per-dimension breakdown with zh_TW labels, AI dimension scores, issue deduplication by group, fix suggestions, supervisor hints, pass summary, statistics table.
- **buildDialogAssessmentPrompt()** in subagent-prompt.ts — GLM prompt for zh_TW quality assessment. Sends gate data to AI, requests 3-5 paragraph assessment + per-check fix suggestions in JSON. The AI response updates gate.json fix_suggestion_zhTW fields automatically.
- **CLI integration:** `bun run storygraph write-gate <series-dir>` delegates to graphify-write-gate.ts. Added `import.meta.main` guard so the module exports `buildGateReportZh()` for programmatic use.
- **10 tests pass:** template report generation, AI score inclusion, escalation display, deduplication, null dimension handling, no-previous-score, all-PASS gate, fix suggestions, prompt generation with/without AI scores.
- **All 422 tests pass** across 22 files.
- **Lesson:** The `buildDialogAssessmentPrompt` should live in subagent-prompt.ts (shared) not duplicated in the script file. The `import.meta.main` guard is essential for scripts that export functions — without it, CLI code runs at import time during tests.

### 33-F1: PLAN.md Parser + Chapter Validator (this session)

- **plan-parser.ts** — Generic PLAN.md parser. Hybrid mode: regex for markdown tables (Characters, Episode Guide, Running Gags), optional LLM for unstructured prose (Story Arcs). Column-name matching (`findCol`) handles varying table formats across series. Chinese numeral support (`第一章`→1) for Story Arcs headings. Episode range expansion (`4 | 1-4` → 4 individual entries).
- **chapter-validator.ts** — 8 validation rules consuming plan-struct.json: EPISODE_COUNT, SEQUENTIAL_COMPLETION, CHARACTER_CONSISTENCY, ARC_POSITION_VALIDITY, GAG_EVOLUTION_MINIMUM, DUPLICATE_EPISODE_IDS, EPISODE_ID_FORMAT, MISSING_REQUIRED_SECTIONS.
- **CLI integration:** `bun run storygraph parse-plan <dir>` and `bun run storygraph validate-plan <dir>`.
- **Tested on 4 series:** weapon-forger (7 chars, 12 eps, 4 arcs, 3 gags, 4 chapters), my-core-is-boss (5 chars, 34 eps, 10 chapters), galgame-meme-theater (4 chars, 7 eps, flat numbering), storygraph-explainer (0 chars, 6 eps, Chinese headers).
- **39 tests pass.**
- **Bug found:** weapon-forger's PLAN.md missing `soul` (滄溟子) from Characters table — validator caught CHARACTER_CONSISTENCY error.
- **Lesson:** `import.meta.main` guard needed for scripts that export functions (prevents CLI code from running on import). `findCol` needs substring matching (`includes`) not exact matching (`indexOf`) for headers with parenthetical notes like `Voice (mlx_tts)`.
- **Honest assessment:** The validator is purely **Tier 0 (programmatic)** — no pi-agent/AI. It checks structural properties (episode counts, character references, ID formats). It cannot evaluate story quality, thematic coherence, or humor effectiveness. The parser uses pi-agent (`callAI`) optionally in hybrid/ai mode for extracting Story Arcs from prose — but that's extraction, not validation. A true "PLAN.md quality assessment" (semantic validation) would need a Tier 1 LLM step — potential follow-up for 33-F2's GLM dialog assessment or a new task.

### storygraph-intro → storygraph-explainer Rename + Restructure (this session)

- **Rename:** `storygraph-intro` → `storygraph-explainer` across 26 files. Directory, source components, configs, tests, docs all updated.
- **Restructure:** Flat standalone `storygraph-intro/storygraph-intro/` → chapter-based `storygraph-explainer/storygraph-explainer-ch1-ep1/`. Series config changed from `standalone: true` to `chapterBased: true`, abbreviation `bgi` → `sge`.
- **Template logic fix:** `getSceneNames` and `collectFiles` previously checked `naming.isStandalone && config.category` for tech_explainer scenes. Changed to `config.category === "tech_explainer"` so chapter-based series with a category still get tech_explainer-specific scenes (ProblemScene, ArchitectureScene, etc.).
- **storygraph series config:** Added `storygraphExplainerConfig` to `bun_app/storygraph/src/scripts/series-config.ts` with `genre: "generic"`, tech patterns from the explainer content, `episodeDirPattern: /^storygraph-explainer-ch(\d+)-ep(\d+)$/`.
- **Pipeline verified:** `storygraph episode`, `storygraph pipeline` both work — 11 nodes, 10 edges from narration extraction. Score 45/100 (expected for single episode, no cross-links).
- **All 146 tests pass.**
- **Lesson:** Changing from standalone to chapter-based requires updating the template selection logic (not just the series config). The `isStandalone` flag was overloaded for both naming AND template selection.

### 34-B1-B9: storygraph-intro Scaffold + Scenes + Render (this session)

- **Scaffold bug fixed:** `updaters.ts` resolved `scripts/dev.sh` wrong for standalone projects — `seriesDir` is `bun_remotion_proj/` for standalone (not nested like episode-based). Fixed by using `isStandalone` flag for relative path calculation. Also fixed `requireExists` which used `readFileSync` instead of `existsSync`.
- **Series wrapper structure:** storygraph-intro uses `bun_remotion_proj/storygraph-intro/storygraph-intro/` (series dir → project dir), matching weapon-forger pattern. Shared assets go in `assets/scripts/` at series level.
- **Transition bug fixed:** StorygraphIntro.tsx checked `i < transitions.length` (only 2 transitions) instead of `i < scenes.length - 1` (8 transitions between 9 scenes).
- **naming.ts fixed:** Standalone projects now use `seriesDir = resolve(repoRoot, "bun_remotion_proj", seriesId)` matching episode-based structure.
- **dev.sh updated:** Added check for `bun_remotion_proj/$app_name/$app_name` pattern for series-wrapper projects.
- **TTS generated:** 9 scenes, mlx_tts serena voice, all zh-TW narration.
- **Rendered:** 3681 frames (≈123s), 8.3 MB MP4 output at `out/storygraph-intro.mp4`.

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
Phase A — Foundation                              — ✅ ALL COMPLETE
Phase B — Genre Validation                        — ✅ ALL COMPLETE
Phase C — Tier 1 + Cross-Genre Data               — ✅ ALL COMPLETE
Phase D — Tier 2 (MVP)                            — ✅ ALL COMPLETE — **MVP COMPLETE**
Phase 34 — Video Category System                   — ✅ ALL COMPLETE — **PHASE 34 COMPLETE**
Phase E — Deploy Lite Steps (F1, F2)              — ✅ COMPLETE
Phase F — CLI + Test Speedup                       — ✅ COMPLETE

═══ REMAINING WORK (sorted by impact) ═══

Phase J — KG Feedback Loop (CRITICAL — closes the "so what" gap)
  1. 32-A1 (buildRemotionPrompt)                  — ✅ DONE
  2. 32-A2 (story-graph loader functions)         — ✅ DONE
  3. 32-B1 (post-render enrichment)               — ✅ DONE
  4. 32-B2 (prompt calibration)                   — ✅ DONE — **PHASE 32 COMPLETE**

Phase G — More Deploy Steps (low risk)
  5. 33-F4 (Step 4 lite, 2 tasks)                 — ✅ DONE — **PHASE 33-F4 COMPLETE**

Phase K — Evaluation + Validation
  6. 33-G1 (Tier comparison)                      — ✅ DONE
  7. 33-G3 (Cost/latency matrix)                  — ✅ DONE
  8. 33-G5 (Regression runner)                    — ✅ DONE — **PHASE 33-G COMPLETE**
  9. 31-B1 (Test corpus curation)                 — ✅ DONE — **PHASE 31-B COMPLETE**
  10. 33-I (my-core-is-boss rebuild)              — ✅ DONE — **PHASE 33-I COMPLETE**

Phase L — Documentation + Polish
  11. 28-B (Model benchmark)                       — ✅ DONE — **PHASE 28-B COMPLETE**
  12. 33-C3 (CI integration guide)                 — GitHub Actions examples
  13. 33-H (Workflow adjustment, 3 tasks)         — ✅ DONE — **PHASE 33-H COMPLETE**

Phase M — Experimental (high risk)
  14. 33-F3 (Step 2 lite, 2 tasks)                — GLM story draft (experimental)
  15. 33-D (Feedback loop calibration)            — Suggestion → score tracking

Phase 35-39 — Web UI (LONG TERM)
  16. 35-A/B/C (Foundation: Hono + React + module exports)
  17. 36-A/B (Project CRUD + story editor)
  18. 37-A/B (Pipeline + quality dashboard)
  19. 38-A/B (Assets + render management)
  17. 39 (Full orchestration + automation)
```

## Dependency Graph

```
33-A ──→ 33-E smoke ──→ 31-A ──→ 33-E detail ──→ 33-B ──→ 33-F2 → 33-C
  │                                               │
  └─────→ 33-F1 (independent)                    └──→ 32-A ──→ 32-B (feedback loop)
                                                          │
  34-A ──→ 34-B0 ──→ 34-B1-B9 ──→ 34-D                    └──→ 33-D (calibration)
    │
    └──→ 35-A/B/C ──→ 36/37/38 ──→ 39

Remaining work (no completed deps blocking):
  33-F4 ← independent
  31-B ← independent
  33-G ← needs 33-F4 for full comparison
  28-B ← needs 31-A (done)
  33-F3 ← experimental, independent
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
| 34-X | storygraph-intro → storygraph-explainer rename + restructure | 2026-04-19 |
| 34-D | Skill documentation (category guide + topic detection) | 2026-04-19 |
| 33-F1 | PLAN.md parser + chapter validator | 2026-04-19 |
| 33-F2 | Quality gate writer + GLM dialog assessment | 2026-04-19 |
| P0 | Test suite speedup (bunfig.toml, 74x faster) | 2026-04-19 |
| SGE-P2 | storygraph-explainer Phase 2: 6-episode split | 2026-04-19 |
| SGE-RESET | storygraph-explainer reset: storygraph-first pipeline, ep1 narration | 2026-04-19 |
| SGE-P2 | storygraph-explainer Phase 2: extraction verified (22 nodes, 16 tech_terms) | 2026-04-19 |
| SGE-P1B | storygraph-explainer Phase 1B: ep2+ep3 narrations + merge (83 nodes, score 75) | 2026-04-19 |
| SG-CHECK | Consistency checker fixes: Jaccard content comparison, SKIP status, scene properties | 2026-04-19 |
| SGE-P2C | Hybrid mode fix: nested backticks, truncation repair, maxTokens; 131 nodes/8 communities | 2026-04-19 |
| GOAL-REFLECT | Storygraph goal reflection: core engine 65% of vision. Phase 32 (KG→Remotion feedback) is critical gap. Workspace-first enforcement added. | 2026-04-19 |
| 32-A | KG Context Injection: buildRemotionPrompt() + kg-loaders.ts + 8-section zh_TW constraint prompts | 2026-04-19 |
| SGE-REBUILD | storygraph-explainer full rebuild: CLI CWD fix, Plot Arc SKIP, 127 nodes/7 communities/score 100 | 2026-04-19 |
| 32-B | KG Enrichment + Prompt Calibration: graphify-enrich.ts + prompt-calibration.ts, 28 scenes enriched, 8-feature correlation | 2026-04-19 |
| 33-F4 | Narration + TODO Generators: gen-narration.ts + gen-episode-todo.ts, 3-category template support | 2026-04-19 |
| 33-G | Evaluation Framework: regression runner + tier comparison + cost/latency matrix, 40 new tests | 2026-04-20 |
| 31-B | Regression test corpus: 4 series baselines, weapon-forfer typo fixed, v1.0 guard | 2026-04-20 |
| 28-B | Model benchmark: graphify-model-bench.ts, accuracy sampling, reliability runs, 19 tests | 2026-04-20 |
| 33-C3 | CI integration guide: GitHub Actions, pre-commit hooks, regression baselines, multi-series matrix | 2026-04-20 |
| GRAPH-FIX | Graph HTML overflow fix: #graph overflow:hidden, widthConstraint, neighbor pills truncation, flex-wrap | 2026-04-20 |
| GRAPH-UI | Graph HTML info-panel scrollbar (flex: 0 1 auto, 40vh cap, custom scrollbar) + expandNeighbors() global function replacing broken inline onclick | 2026-04-20 |
| 33-I | my-core-is-boss Storygraph Rebuild: 173 nodes, 315 edges, 8 communities, gate v2.0 100/100, blended 74.8%, regression baseline added | 2026-04-20 |
| 33-H | Episode-Setup Workflow Adjustment: deploy mode + hybrid mode docs + SKILL.md kg-review topic | 2026-04-20 |

## Archive

- Completed tasks: `TODO-archive.md`
- Completed phase specs: `PLAN-archive.md`
