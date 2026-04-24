# Historical Session Reflections

> On-demand reference only. NOT loaded every session.
> Active status: `NEXT.md`

## Phase 42 — my-core-is-boss ch2-ep3 (2026-04-24)

**What:** Created and rendered my-core-is-boss ch2-ep3 (技能點分配). Episode was already scaffolded with narration written. Main work was rewriting 5 template scene files to production code.

**Pipeline validation:** Cross-series E2E pipeline works. No new images needed — all character emotions (linyi 7, zhaoxiaoqi 5, xiaoelder 5) and backgrounds (sect-plaza, sect-training) already existed.

**Bugs found:**
1. Scaffolded Root.tsx had wrong audio path: `../public/audio/durations.json` instead of `../audio/durations.json`
2. Scaffolded ContentScene files used old DialogBox API (character/text/lineIndex props) instead of current API (lines/sceneFrame/sceneDuration)
3. Scaffolded ContentScene files had wrong segment-durations path: `../../public/audio/` instead of `../../audio/`
4. Used `type="achievement"` on SystemNotification — only `mission|warning|success|info` are valid

**Assessment:** Pipeline is mature enough for cross-series episodes. No fundamental blockers. The main friction is scaffold template quality — episodeforge generates old-API code that needs manual rewriting. A scaffold update to use current DialogBox/component APIs would save ~30 min per episode.
---

## Phase 43: Review Agent CLI (2026-04-24)

- **Built standalone GLM5-turbo review agent** in `bun_app/bun_pi_agent/src/review-agent/` (6 files).
- **No cross-app dependency** — reimplemented stripMarkdownFence/repairTruncatedJSON (~30 lines) rather than importing from storygraph.
- **Narration extraction via regex** — reads narration.ts as text, extracts `text:` fields. Avoids dynamic TS import issues.
- **6 review dimensions**: semantic_correctness, creative_quality, genre_fit, pacing, character_consistency, regression_vs_previous.
- **Smoke tested on both series**: weapon-forger → BLOCK 2.5/10 (gate score 0, 50 warnings), my-core-is-boss → APPROVE_WITH_FIXES 6.3/10 (gate 100, reasonable).
- **198 tests pass** (18 new). All existing bun_pi_agent tests still green.
- **Bugs found**: repairTruncatedJSON can't fix unterminated strings without a comma to cut back to — expected limitation.
- **Deferred**: storygraph CLI integration and WebUI route (43-E). Standalone CLI works, integration can wait.

---

## Phase 41-C: Roadmap Refactor (2026-04-24)

- **Always-loaded content reduced 83%** — SKILL.md + NEXT.md: 775 → 132 lines. NEXT.md 708→65, TODO.md 388→56, PLAN.md 795→126.
- **REFLECTIONS.md created** — 344 lines of historical session logs extracted from NEXT.md. On-demand only.
- **PLAN-archive.md expanded** — Phase 31-39 specs (+261 lines). Covers three-tier quality pipeline, Web UI foundation, category system.
- **TODO-archive.md expanded** — Phase 33-D through 40-G completed items (+175 lines).
- **SKILL.md updated** — Reflections now go to REFLECTIONS.md, not NEXT.md. Strategic Roadmap table updated.
- **Post-run operation updated** — develop_bun_app/operations/post-run.md documents REFLECTIONS.md pattern for skill docs.
- **Honest assessment:** PLAN.md at 126 lines exceeds the 100-line target because Phase 43's architecture section (ReviewResult schema, CLI design, key decisions) is inherently verbose. Could trim by removing code blocks but that would reduce the spec's usefulness. The real win is the always-loaded metric: 775→132 lines means ~640 fewer tokens consumed per session. The REFLECTIONS.md pattern should scale — as more work happens, only NEXT.md grows (by ~2 lines per completed phase in the table), not the reflections.

## Goal Reflection: Storygraph Progress

### What's DONE (strong):
- **Core extraction pipeline:** Regex + AI + Hybrid modes, genre-aware (xianxia_comedy, galgame_meme, novel_system)
- **Quality gate:** Tier 0 (programmatic 13+ checks) + Tier 1 (GLM scoring) + Tier 2 (Claude review)
- **Visualization:** vis.js HTML with community detection, PageRank, cross-links
- **CLI:** `storygraph` CLI with CI mode, score, write-gate, parse-plan, validate-plan
- **Category system:** 7 video categories, scene templates, category-aware scaffolding (episodeforge)
- **Episode pipeline:** Workspace-first enforcement, PLAN/TODO lifecycle, graphify quality gate
- **KG feedback loop:** Context injection (Phase 32-A) + enrichment + calibration (Phase 32-B) — structurally closed
- **Evaluation framework:** Regression runner, tier comparison, cost matrix, model benchmark (Phase 33-G/28-B/31-B)
- **Documentation:** CI guide (33-C3), deploy mode + hybrid mode workflow (33-H), category guide (34-D)

### What's NOT done:
1. **Phase 33-F3 — Deploy automation story draft (0%):** GLM creative writing for zh_TW dialog. Experimental — quality uncertain.
2. **Phase 33-D — Feedback loop calibration:** Track suggestion→score correlations. Needs more episode data.

### What's partially done:
- **Phase 32-B calibration:** Structurally complete but needs more episodes across series to produce actionable correlations. weapon-forger shows 4/8 sections never populated.

---

## Batch Character Generation (2026-04-24)

- **13 character images generated** via CDP bridge → Chrome → z.ai. All 13 succeeded, 0 failed, ~8 minutes total.
- **zhoumo** 4 emotions: angry, nervous, shocked, smirk (177-248KB each)
- **luyang** 4 emotions: angry, nervous, shocked, smirk (177-214KB each)
- **mengjingzhou** 4 emotions: angry, nervous, shocked, smirk (188-234KB each)
- **soul** base image created — 滄溟子 remnant soul (236KB, ghostly purple ethereal appearance). New manifest JSON created.
- **CDP bridge improved** — Added `ensureLoggedIn()` that auto-detects OAuth authorize pages and either auto-clicks authorize or fails fast with `NOT_LOGGED_IN` error. Previously the bridge silently hung forever on auth redirects.
- **Login-check feedback saved** to `.agent/memory/feedback/cdp-login-check.md`
- **Honest assessment:** The emotion images (177-248KB) are smaller than the original base images (820KB-1.6MB) — likely different resolution or source quality. The z.ai generated images are consistent within each character set. The soul.png is ethereal/ghostly which matches the narration description but may not work well for DialogBox display (too translucent). The CDP bridge is robust now — login detection + auto-authorize means future batch runs won't silently hang.

## WF-CH3-EP2: weapon-forger ch3-ep2 智商測試 (2026-04-24)

- **Story draft** — Continues ch3-ep1 cliffhanger (self-destruct countdown). Characters: zhoumo, luyang, mengjingzhou. Running gags: 忘加按鈕 (IQ test question is "you forgot the stop button"), 現代科技用語 (CT scan, MVP, iteration, product philosophy), 法寶反噬 (laser pen becomes test content).
- **narration.ts** — 4 scenes, 33 segments. VOICE_MAP with uncle_fu for all characters.
- **Scene files rewritten** — TitleScene (subtitle "智商測試"), ContentScene1 (secret-realm bg, countdown timer, hidden subsystem discovery), ContentScene2 (cave bg, crystal ball IQ test, green flash on correct answer, escape), OutroScene (credits + teaser for ch3-ep3).
- **WeaponForgerCh3Ep2.tsx fixed** — Replaced `staticFile()` audio with `require()`, added `name` props to all Sequences, fixed `wipe()` props (removed width/height).
- **remotion.config.ts created** — `Config.setPublicDir("../assets")` for shared image serving.
- **TTS generated** — Qwen3-TTS via mlx_tts, 4 WAV files (13.3MB total). durations.json: [951, 2667, 3435, 1369] frames.
- **Rendered** — 154MB MP4, 8377 frames, ~280s (4min 39sec). Output: `out/weapon-forger-ch3-ep2.mp4`.
- **Honest assessment:** The episode uses all existing assets (no new images needed). The dialog mixes narrator descriptions with character interactions well. The countdown timer, crystal ball glow, and green flash for correct answer add visual variety. Main limitation: all characters use the same `uncle_fu` voice — indistinguishable in multi-character scenes. The narrator dialog lines in ContentScene1/2 were mapped to "zhoumo" for DialogBox display since narrator isn't in CHARACTERS config — this is a minor visual inconsistency (zhoumo avatar shows during narrator text).

## Phase 41-A: Character Profile System (2026-04-22)

- **character-profiles.ts service** — Reads 3 data sources per series (manifest JSONs for prompts/variants, characters.md for appearance, characters.ts for metadata). Merges into `CharacterProfile[]` with graceful degradation.
- **GET /api/image/characters** — New endpoint returning character profiles for a series.
- **POST /api/image/generate enhanced** — Accepts `enhanceWithCharacter: { facing }` to wrap prompts through `buildCharacterPrompt()` (was imported but never called).
- **ImageGen.tsx updated** — Character selector dropdown, facing toggle (LEFT/RIGHT), variant gallery with thumbnails, auto-populate prompt from basePrompt/appearance, auto-prefix filename.
- **Image.z.ai CDP generation verified** — Connected to Chrome via CDP, filled prompt, clicked 开始生成, downloaded result (1280x1280, 286KB). Key: must use `textarea.fill()` not `evaluate`, detect completion by `img[alt="Generated"]` not download button.
- **Honest assessment:** The character profiles service works for weapon-forger (7 chars, 20 manifest JSONs) and my-core-is-boss (4 chars, 22 manifests). galgame-meme-theater has no manifest JSONs so only gets names/appearance from characters.md. The `buildCharacterPrompt()` enhancement adds facing direction + magenta background + anime style on the server side. The variant gallery relies on `/api/assets/file/` endpoint which serves images from the filesystem.

## Phase 40-A/B/C/D/E/F/G: WebUI E2E Verification (2026-04-22)

- **40-A:** WebUI dev server (Hono :5173 + Vite :3000) started. All 11 pages load. Fixed Workflows.tsx JSX bug (orphan `</div>`).
- **40-B:** Scaffold ch3-ep2 via API — 11 files created. Bug found: dry-run mode creates real files.
- **40-C:** Pipeline run — weapon-forger 8 eps, 300 nodes, gate 0/100 (empty ch3-ep2 dragged score down).
- **40-D:** Image gen via CDP bridge. Bun WebSocket incompatible → Node.js subprocess bridge. test-warrior.png 197KB 1280x1280.
- **40-E:** TTS — MLX engine, 4 scenes, 4 WAV files (7.5MB), durations.json.
- **40-F:** Render — 86MB MP4, 304s video.
- **40-G:** Full workflow — image (z.ai CDP) + TTS (MLX) + render (152.6MB MP4, 8146 frames).
- **Honest assessment:** The CDP approach works but requires user to manually start Chrome with debugging flag. The persistent mode fallback exists but Google's automation detection makes it unreliable. The full pipeline is verified end-to-end through the WebUI.

## Workflow Image Step Integration (2026-04-22)

- **workflow-engine.ts** — Added `case "image"` to `runStep()`: resolves seriesDir, calls `generateImageBatch()` with progress callbacks and skip-existing. Extended `WorkflowTriggerOptions` with `images[]`, `imageOutputDir`, `skipExistingImages`. New template `image-tts-render`.
- **15 workflow tests pass**.

## bun_app/bun_image/ (2026-04-22)

- **image-engine.ts** — `ZaiImageEngine` class wrapping Playwright browser automation for image.z.ai. CDP mode + persistent mode.
- **image-pipeline.ts** — `generateImage()` + `generateImageBatch()` with skip-existing, progress callbacks, metadata companion files.
- **url-utils.ts** — `extractImageUrl()`, `sanitizeFilename()`, `buildCharacterPrompt()`, `buildBackgroundPrompt()`.
- **WebUI route + page** — image.ts routes + ImageGen.tsx page with series selector, asset type toggle, prompt textarea, aspect ratio picker.
- **29 new tests** (15 url-utils + 8 pipeline + 6 API). **709 total tests pass**.

## Phase 37-B+: Quality Dashboard Enhancements (2026-04-21)

- **quality-comparison.ts service** — Cross-series comparison, regression alerts, score history.
- **Quality.tsx page redesigned** — Two-view layout: Cross-Series + Per-Series with regression alerts, AI dimensions, score history.
- **15 new tests**, 185 webui total.

## Phase 36-B: Story Editor (2026-04-21)

- **plan-editor.ts service** — Reads/writes PLAN.md from series directories. 6 functions.
- **plans.ts routes** — 6 endpoints for plan CRUD.
- **StoryEditor.tsx page** — Series selector, 3 view modes (Sections/Edit/Preview), auto-save 1.5s debounce.
- **13 new tests**, 168 webui total.

## Phase 39-A5: Export/Import (2026-04-21)

- **export-import-service.ts** — Export captures series metadata, PLAN.md, episodes, quality data, automation rules. Import validates + creates with skip-on-exist safety.
- **4 API endpoints** (list/export/download/import). **22 new tests**, 652 total.

## Phase 39-A4: CI/CD Integration (2026-04-21)

- **webhook-service.ts** — HMAC-SHA256 auth, delivery log. **scheduler-service.ts** — Interval cron, tick loop, persistent schedules.
- **15 endpoints total** (5 webhook + 10 schedule). **39 new tests**, 627 total.

## Phase 39-A3: Monitoring Dashboard (2026-04-21)

- **monitoring.ts service** — Series health aggregator (gate/blended/completion/trend/activity).
- **Monitoring.tsx page** — Summary cards, series health table, activity log.
- **8 new tests**.

## Phase 39-A2: Automation Rules (2026-04-21)

- **automation-rules.ts** — Rule engine with CRUD, 3 trigger types (`plan_changed`, `quality_passed`, `scaffold_complete`), cooldown enforcement.
- **file-watcher.ts** — Bun FileSystemWatcher watching PLAN.md with 30s debounce.
- **24 new tests**, 583 total.

## Phase 39-A1: Workflow Templates (2026-04-21)

- **workflow-engine.ts** — 4 templates: `full-pipeline`, `scaffold-and-pipeline`, `quality-gate`, `tts-and-render`.
- **Workflows.tsx page** — Template selector + per-step progress with SSE streaming.
- **13 new tests**, 559 total.

## Phase 38-A/B: Asset Management + TTS/Render (2026-04-21)

- **asset-scanner.ts** — Scans characters, backgrounds, audio per series.
- **Assets.tsx** — Image grid with modal, audio player grouped by episode.
- **TTS + Render API + pages** — tts.ts route, render.ts route, TTS.tsx, Render.tsx pages.
- **20 + 16 new tests**, 546 total.

## Phase 37-A: Pipeline + Quality UI (2026-04-21)

- **Pipeline routes** — GET status, POST run/check/score with job queue.
- **Quality routes** — GET gate + quality score combined.
- **Pipeline.tsx + Quality.tsx pages** — Series selector, job progress, score cards, check table.
- **9 new tests**, 510 total.

## Phase 36-A: Project CRUD (2026-04-20)

- **project-scanner.ts** — Scans 5 series, auto-detects categories, reads gate scores.
- **Projects.tsx** — List/detail/create views with scaffold wizard.
- **12 new tests**, 500 total.

## P0: CLAUDE.md Token Efficiency Refactor (2026-04-21)

- **CLAUDE.md reduced from 237 → 107 lines (55% reduction).** Moved 3 sections to on-demand memory files:
  - `project/project-structure.md` — Full file tree + bun_app/ section
  - `project/remotion-api-reference.md` — Remotion API table + package.json notes
  - `feedback/_index.md` — 39 feedback entries organized by topic
- **What stays in CLAUDE.md:** Quick Reference, Commands, Video Categories, Post-clone setup, CRITICAL cd rules, Memory convention.

## Phase 35-C1/C2: Script Module Exports (2026-04-20)

- **35-C1: episodeforge scaffold module** — Extracted `scaffold()` from CLI-only into importable module. 6 tests.
- **35-C2: storygraph pipeline API** — `pipeline-api.ts` with 4 exportable functions (getPipelineStatus, runScore, runPipeline, runCheck). 3 tests.
- **409 tests pass** across 22 files.

## Phase 35-B: React SPA + Dashboard (2026-04-20)

- **Vite + React setup** — App.tsx with 7-page sidebar nav, proxy to Hono.
- **Dashboard page** — Server health badge, job queue table, SSE progress bar.
- **147KB JS bundle** (47KB gzipped).

## Phase 35-A: Hono API Server (2026-04-20)

- **bun_app/bun_webui/** scaffold — Hono app with CORS, health endpoint, job CRUD with SSE streaming.
- **Job queue middleware** — In-memory JobQueue with progress callbacks.
- **Shared types** — Project, Episode, Job, GateResult, Pipeline types.

## Phase 33-F3: Story Draft Generator (2026-04-20)

- **buildStoryDraftPrompt()** — Generates zh_TW dialog from KG constraints. Genre-specific style guides.
- **buildStoryQualityPrompt()** — Self-evaluation across 8 dimensions with anti-inflation instruction.
- **graphify-story-draft.ts orchestrator** — Loads KG context → generates draft → evaluates.
- **30 new tests**, 480 total.
- **Honest assessment:** Untested with actual AI calls. Key risks: GLM-5 malformed JSON, generic dialog, self-evaluation not correlating with human judgment.

## Phase 33-D: Feedback Loop Calibration (2026-04-20)

- **graphify-review.ts** — Tier 2 quality review tool (template + AI modes).
- **suggestion-log.ts** — Fix suggestion tracking with status and delta computation.
- **Cross-project smoke tests** — 34 tests validating all 5 series pipeline output.
- **Regression score trending** — --trend flag for regression runner.
- **Quality examples reporter** — Per-series AI extraction summary.
- **57 new tests**, 450 total.

## Phase 33-I: my-core-is-boss Storygraph Rebuild (2026-04-20)

- **Full pipeline run** in hybrid mode: 5 episodes, 173 nodes, 315 edges, 40 link edges, 8 communities.
- **Gate v2.0:** 100/100 (22 PASS, 16 WARN, 1 FAIL). Blended: 74.8% (ACCEPT).
- **5-series regression suite complete**.

## Graph HTML Info-Panel Scrollbar + Expand-Neighbors Fix (2026-04-20)

- **CSS scrollbar fix** — `#info-panel` flex layout fix, 40vh cap, custom scrollbar styling.
- **Expand-neighbors button fix** — Replaced broken inline onclick with clean global `expandNeighbors()` function.

## Graph HTML Overflow Fix + Playwright Debugging (2026-04-20)

- **Overflow bug fixed** — `#graph` overflow hidden, word-break on info content, neighbor pill truncation, widthConstraint on nodes.
- **Playwright debugging workflow** established for vis.js graph HTML.

## Phase 33-C3: CI Integration Guide (2026-04-20)

- **ci-guide.md created** — GitHub Actions, pre-commit hooks, regression baselines, multi-series matrix patterns.

## Phase 28-B: Model Benchmark (2026-04-20)

- **graphify-model-bench.ts** — Multi-model benchmark with accuracy sampling, reliability runs.
- **19 new tests**, 393 total.

## Phase 31-B1: Regression Test Corpus Curation (2026-04-20)

- **4 series baselines** (weapon-forger, storygraph-explainer, galgame-meme-theater, xianxia-system-meme).
- **All 4 series PASS regression** — 0% delta.

## Phase 33-G: Evaluation Framework (2026-04-20)

- **graphify-regression.ts** — Regression runner with CI mode, baseline updates, threshold override.
- **graphify-tier-compare.ts** — Cross-series comparison table generator.
- **graphify-cost-matrix.ts** — Pipeline step timing tracker.
- **40 new tests**, 374 total.

## Phase 33-F4: Narration + TODO Generators (2026-04-20)

- **gen-narration.ts** — Generates narration.ts from scene data. 3 templates (narrative_drama, tech_explainer, galgame_vn).
- **gen-episode-todo.ts** — Generates episode TODO.md from PLAN.md. Category-specific checklists.
- **18 new tests**, 334 total.

## Phase 32-B: KG Enrichment + Prompt Calibration (2026-04-20)

- **graphify-enrich.ts** — Post-render KG enrichment (actual durations vs predictions).
- **prompt-calibration.ts** — Track 8 KG prompt features, correlate with quality scores.
- **weapon-forger:** 7 episodes, 28 scenes enriched. 4/8 sections never populated.
- **19 new tests**, 316 total.

## storygraph-explainer Full Rebuild + Bug Fixes (2026-04-19)

- **Full pipeline rebuild** — 127 nodes, 144 edges, 5 link edges, 7 communities, score 100/100.
- **CLI CWD bug FIXED** — Flag values resolved as paths. Fix: explicit flag-value pair handling.
- **Plot Arc SKIP for narrator-only** — tech_explainer has no dramatic arc.
- **Duplicate node issue identified** — Hybrid mode creates duplicate scene/tech_term nodes (~10% inflation).

## Phase 32-A: KG Context Injection (2026-04-19)

- **buildRemotionPrompt()** — 8-section zh_TW constraint prompt from KG data.
- **kg-loaders.ts** — 8 server-side loaders for KG data.
- **297 tests pass** (26 new).

## storygraph-explainer Phase 2: Hybrid Mode Fix (2026-04-19)

- **Three fixes to ai-client.ts:** Greedy fence stripping, truncated JSON repair, maxTokens=4096.
- **Hybrid vs regex:** 83→131 nodes (+58%), 88→149 edges (+70%), 0→8 communities. Score 100/100.

## storygraph-explainer Reset — Storygraph-First Pipeline (2026-04-19)

- **Deleted entire storygraph-explainer**, redesigned as 3 episodes.
- **New approach:** Write narration.ts first, run storygraph extraction, validate node richness, THEN scaffold code.

## storygraph-explainer Phase 1B: ep2+ep3 Written + Merged (2026-04-19)

- **ep2 (五階段管線):** 31 nodes, 30 edges. **ep3 (一行程式看見全貌):** 30 nodes, 29 edges.
- **Merged graph:** 83 nodes, 88 edges, 5 link edges, 3 algorithm cross-links. Score 75/100.

## P0: Test Suite Speedup (2026-04-19)

- **bunfig.toml** with pathIgnorePatterns excluding bun_pi_agent. `bun test` 180ms (74x speedup).

## Phase 33-F2: Quality Gate Writer (2026-04-19)

- **graphify-write-gate.ts** — Template-based zh_TW quality gate report.
- **buildDialogAssessmentPrompt()** — GLM prompt for zh_TW quality assessment.
- **10 tests pass**, 422 total.

## Phase 33-F1: PLAN.md Parser + Chapter Validator (2026-04-19)

- **plan-parser.ts** — Generic PLAN.md parser with Chinese numeral support.
- **chapter-validator.ts** — 8 validation rules.
- **39 tests pass** across 4 series.

## storygraph-intro → storygraph-explainer Rename (2026-04-19)

- **Rename** across 26 files. Flat standalone → chapter-based series.

## 34-B1-B9: storygraph-intro Scaffold + Scenes + Render (2026-04-19)

- **9 scenes**, all rendered. 3681 frames, 8.3 MB MP4.

## 34-R + Bun Workspace Migration (2026-04-19)

- **Rename verification** caught real bugs (missing script, wrong entry point).
- **Bun 1.3.11 workspace** — no hoisted symlinks for workspace packages.

## Rename bun_graphify → storygraph, bun_scaffold → episodeforge (2026-04-19)

- **140+ references updated** across 30+ files. Zero stale refs.

## Phase 34-B0: Scaffold Extension + remotion_types (2026-04-19)

- **remotion_types package** — Extracted category types, scene templates, presets from storygraph.
- **episodeforge extended** — `--category` flag, standalone naming, tech_explainer templates.

## Phase 34-A: Category Taxonomy (2026-04-19)

- **7 categories defined.** Category ≠ Genre design validated.
- **3 new files:** category-types.ts, scene-templates.ts, tech-explainer-presets.ts.

## Web UI Vision (2026-04-19)

- **Architecture chosen:** Bun + Hono + React SPA.
- **Phases 35-39 planned** — Foundation → Project CRUD → Pipeline/Quality → Assets/Render → Orchestration.

## Consistency Checker Fix + Regex→Hybrid Enforcement (2026-04-19)

- **Three bugs fixed:** Jaccard content comparison, scene properties preservation, SKIP status for inapplicable checks.
- **Score impact:** 75/100 (3 false FAIL) → 95/100 (0 FAIL, 6 SKIP).
- **Regex mode deprecated** for production. Must use hybrid/ai.

## storygraph-explainer Phase 2: Extraction Verified (2026-04-19)

- **Two parser bugs fixed:** segPattern trailing commas, narrator tech_term skip for narrator-only series.
- **22 nodes, 21 edges** from regex extraction. All Phase 2 thresholds passed.

## Phase 33-H: Episode-Setup Workflow Adjustment (2026-04-19)

- **Deploy mode docs** — When to use deploy mode (≥ 3 eps, gate v2.0, blended ≥ 70).
- **Hybrid mode docs** — GLM (free) vs Claude (paid) task assignment.

## Phase 33-A + 33-E: gate.json v2 + Multi-Series Evaluation (2026-04-19)

- **gate.json v2** with provenance, regression detection, quality_breakdown, supervisor_hints.
- **3 genres validated** (xianxia_comedy, galgame_meme, novel_system).

## Phase 31-A: Subagent Scoring (2026-04-19)

- **AI quality scoring works:** GLM-5 produces per-dimension scores with detailed justifications.
- **Blended formula validated:** 0.4 × programmatic + 0.6 × AI produces meaningful scores.

## Phase 33-B: Tier 2 Review (2026-04-19)

- **kg-review topic** with 5-dimension rubric + genre extensions.
- **episode-creation.md updated** — Step 3d added.
