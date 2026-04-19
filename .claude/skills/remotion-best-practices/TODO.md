# Novel Video Generation — TODO

> **Cross-linked docs:**
> - `NEXT.md` — Entry point (read first — status, next task, dependency graph)
> - `PLAN.md` — Active phase specs (Phase 31–33)
> - `TODO-archive.md` — Completed tasks (Phase 24–30)
> - `PLAN-archive.md` — Completed phase specs (Phase 24–30)
> - `../storygraph/PLAN.md` — storygraph code-level architecture
> - `../storygraph/TODO.md` — storygraph code-level tasks

> **Rule:** Strategic/pipeline tasks → this file. Code implementation tasks → `../storygraph/TODO.md`.

> **Status:** v0.17.3 — 34-R done. Phase 34-B1 next

---

## Phase 34-R — Rename Verification Tests (DONE)

> Verify the bun_graphify→storygraph, bun_scaffold→episodeforge rename didn't break any pipeline.

### 34-R1: storygraph tests

- [x] **CLI runs** — Fixed: added `storygraph` script to root package.json (entry: `bun_app/storygraph/src/cli.ts`)
- [x] **Pipeline single episode** — `bun run storygraph full` runs all 5 steps (0 nodes = pre-existing Python env issue, not rename)
- [ ] **Pipeline merge** — Deferred (not rename-sensitive)
- [ ] **Check/Compare/Score** — Deferred (not rename-sensitive)
- [x] **Skill trigger** — `/storygraph` skill loads

### 34-R2: episodeforge tests

- [x] **CLI runs** — `bun run episodeforge --help` exits 0
- [x] **--series list** — `bun run episodeforge --series weapon-forger --dry-run` correctly requires `--ep`
- [x] **--category flag** — `bun run episodeforge --series storygraph-intro --category tech_explainer --dry-run` works
- [x] **Usage text fixed** — `bun run scaffold` → `bun run episodeforge` in args.ts + index.ts

### 34-R3: remotion_types tests

- [x] **Import works** — `VIDEO_CATEGORIES` exports 7 categories

### 34-R4: skill cross-reference tests

- [x] **`/develop_bun_app`** — Updated with episodeforge + remotion_types entries
- [x] **No old names** in storygraph or develop_bun_app skill files

### 34-R5: stale reference sweep

- [x] **bun_app/** has zero old names in `.ts` and `.json` files
- [x] **Only references** in TODO/PLAN/NEXT docs are historical rename descriptions

### Fixes applied

1. Added `"storygraph"` script to root `package.json` (was missing after rename)
2. Fixed entry point: `index.ts` → `cli.ts`
3. Updated episodeforge help text: `bun run scaffold` → `bun run episodeforge`
4. Added episodeforge + remotion_types to develop_bun_app skill

---

## Phase 34 — Video Category System (ACTIVE)

> Full spec: `PLAN.md §Phase 34`
>
> **Core insight:** Category ≠ Genre. Category = video format (tech_explainer). Genre = story content (xianxia_comedy). A series has BOTH.

### 34-A: Category Taxonomy + Templates (DONE)

- [x] **34-A1: category-types.ts** — 7 VideoCategoryId, scene structures, component mapping, dirname detection
  - File: `bun_app/remotion_types/src/category-types.ts`
  - Detects: weapon-forger→narrative_drama, galgame-meme-theater→galgame_vn, claude-code-intro→tech_explainer, etc.

- [x] **34-A2: scene-templates.ts** — CompositionSpec builders for all 7 categories
  - File: `bun_app/remotion_types/src/scene-templates.ts`
  - Each builder: input data → SceneSpec[] with start frames, durations, props
  - Tech Explainer: per-feature duration capped at 10s, auto-extends total if needed

- [x] **34-A3: tech-explainer-presets.ts** — storygraph intro preset + composition data
  - File: `bun_app/remotion_types/src/presets/tech-explainer-presets.ts`
  - storygraphIntroData: 5-stage pipeline, 3 features, comparison, CTA
  - Total: 61s (9 scenes) when targetDuration=90s

- [x] **34-A4: CLAUDE.md** — Added Video Categories section with mapping table

### 34-B: episodeforge Extension + storygraph Intro (POC, P0, NEXT)

> **Revised:** Extend episodeforge to support `--category tech_explainer`, then scaffold through CLI.
> Merges 34-C into 34-B. Future categories reuse the same `--category` flow.

#### 34-B0: Extend episodeforge for tech_explainer (DONE)

- [x] **34-B0a: --category flag** — Add `--category <VideoCategoryId>` to scaffold CLI
  - File: `bun_app/episodeforge/src/args.ts`

- [x] **34-B0b: Category-aware naming** — Non-episode naming for standalone projects (no ch/ep)
  - `storygraph-intro` → dirName, packageName, compositionId
  - File: `bun_app/episodeforge/src/naming.ts`

- [x] **34-B0c: Category-aware templates** — Scene files, PLAN.md, narration system vary by category
  - Tech Explainer: Title + Problem + Architecture + Feature×N + Demo + Comparison + Outro
  - Import scene-templates.ts builders for scene layout
  - File: `bun_app/episodeforge/src/templates-tech-explainer.ts` (NEW)

- [x] **34-B0d: storygraph-intro series config** — Register as tech_explainer preset
  - File: `bun_app/episodeforge/src/series-config.ts`

- [x] **34-B0e: Workspace registration** — Update root package.json workspaces + dev.sh
  - File: `bun_app/episodeforge/src/updaters.ts`

- [x] **remotion_types shared package** — Extracted category types, scene templates, presets from storygraph
  - File: `bun_app/remotion_types/` (NEW)

#### 34-B1-B9: Scaffold + Assets + Scenes + Render

> **Full pipeline:** scaffold → generate-images → generate-tts → implement scenes → render

- [ ] **34-B1: Scaffold workspace** — `bun run episodeforge --series storygraph-intro --category tech_explainer`
  - Creates `bun_remotion_proj/storygraph-intro/` with all scene files
  - 9 scenes from `storygraphIntroData` composition spec

- [ ] **34-B1b: Generate images** — Tech explainer visual assets
  - Gradient backgrounds, pipeline diagram assets, icons
  - Tech explainer uses fewer images (no character sprites), may use CSS/SVG
  - Uses `/generate-image` skill or manual assets

- [ ] **34-B1c: Generate TTS** — Single narrator narration
  - Edge TTS or MLX TTS for narrator voice
  - Produces audio files + durations.json (drives scene timing)
  - Uses `/generate-tts` skill

- [ ] **34-B2: TitleScene** — "storygraph" title + "任何輸入 → 知識圖譜" tagline
  - Animation: clean slide-in + fade, tech gradient background
  - Duration: 4s (120 frames)

- [ ] **34-B3: ProblemScene** — "資料碎片化" pain point
  - Scattered docs/code/papers → chaos visual
  - Duration: 5s (150 frames)

- [ ] **34-B4: ArchitectureScene** — Pipeline flow diagram
  - 5 stages: 輸入 → 解析 → 建圖 → 聚類 → 輸出
  - Animate nodes appearing, edges connecting sequentially
  - Duration: 8s (240 frames)

- [ ] **34-B5: FeatureScene ×3** — AST analysis, federated KG, quality scoring
  - Each: icon + description + visual (diagram/icon)
  - Duration: 10s each (300 frames each)

- [ ] **34-B6: DemoScene** — storygraph in action
  - Terminal-like workflow: graphify-episode → merge → check → compare
  - Duration: 6s (180 frames)

- [ ] **34-B7: ComparisonScene** — Before vs after
  - "手動整理 2hr" → "storygraph 30秒"
  - Duration: 4s (120 frames)

- [ ] **34-B8: OutroScene** — CTA + links
  - "Star on GitHub" + logo
  - Duration: 4s (120 frames)

- [ ] **34-B9: Render + verify** — `bun run build:storygraph-intro` → MP4 output

### 34-C: Category-Aware Scaffolding (MERGED into 34-B0)

> Merged. 34-B0 extends episodeforge with `--category` flag. Remaining category presets:
> - [ ] listicle, tutorial, shorts_meme presets when needed

### 34-D: Skill Documentation (P1)

- [ ] **34-D1: SKILL.md topic detection** — Add category keywords to detection table
  - File: `.claude/skills/remotion-best-practices/SKILL.md`

- [ ] **34-D2: category-guide.md** — Per-category: scene templates, component choices, animation style, decision tree
  - File: `.claude/skills/remotion-best-practices/topics/episode-setup/category-guide.md` (NEW)

- [ ] **34-D3: episode-creation.md update** — Add category selection step before scaffolding
  - File: `.claude/skills/remotion-best-practices/topics/episode-setup/episode-creation.md`

---

## Phase 25 — Remotion Framework (sketched)

> Detailed spec: `PLAN-archive.md §Phase 25`

- [ ] **25-A1: DialogScene template** — Multi-character dialog with reactions, proportional timing
- [ ] **25-A2: ActionScene template** — Dynamic battle/action with ComicEffects, ScreenShake
- [ ] **25-B1: PlotBeatOverlay** — Visual arc position indicator (reads plot_beat nodes)
- [ ] **25-C1: CharacterStateOverlay** — Current emotional state (reads growth trajectory)

---

## Phase 28-B — Improved Model Benchmark (next term)

> Re-benchmark with quality-weighted scoring and accuracy sampling.

- [ ] **28-B1: Accuracy sampling via subagent** — Phase 31-A1 evaluates 10-20 nodes per model
  - Models: glm-4.7, glm-5, glm-5-turbo, glm-5.1
  - Compute: precision = correct / total per model

- [ ] **28-B2: Quality-weighted score formula** — Blend programmatic (30%) + subagent score (70%)
  - File: `bun_app/storygraph/src/scripts/graphify-compare.ts`

- [ ] **28-B3: Reliability testing** — Run each model 3 times, report mean ± stddev
  - File: `bun_app/storygraph/src/scripts/graphify-compare.ts` (+--runs flag)

- [ ] **28-B4: graphify-compare.ts --models flag** — Benchmark across models
  - `--models glm-4.7,glm-5,glm-5-turbo,glm-5.1`
  - File: `bun_app/storygraph/src/scripts/graphify-compare.ts`

---

## Phase 31 — Subagent-Based KG Quality Scoring

> Full spec: `PLAN.md §Phase 31`

### 31-A: Subagent Scoring Infrastructure

- [x] **31-A1: buildKGScorePrompt()** — Sends merged graph summary + rubric to AI
  - 5 dimensions: entity accuracy, relationship correctness, completeness, cross-episode coherence, actionability
  - Returns: JSON per-dimension scores + overall + justification
  - File: `bun_app/storygraph/src/scripts/subagent-prompt.ts`

- [x] **31-A2: scoreKG() orchestrator** — Pipeline + callAI + blended score → kg-quality-score.json
  - Blended: 0.4 × programmatic + 0.6 × subagent
  - File: `bun_app/storygraph/src/scripts/graphify-score.ts` (NEW)

- [x] **31-A3: graphify-compare.ts integration** — Subagent score column + AI quality assessment section
  - File: `bun_app/storygraph/src/scripts/graphify-compare.ts`

### 31-B: Regression Test Suite

- [ ] **31-B1: Test corpus** — Curate regression episodes across 3 series
  - my-core-is-boss (novel), galgame-meme-theater (comedy), weapon-forger (xianxia)
  - File: `bun_app/storygraph/test-corpus/`

- [ ] **31-B2: Regression runner** — Pipeline + scoring on corpus, delta > 10% = regression
  - File: `bun_app/storygraph/src/scripts/graphify-regression.ts` (NEW)

---

## Phase 32 — KG-Driven LLM Prompt Enhancement

> Full spec: `PLAN.md §Phase 32`

### 32-A: KG Context Injection

- [ ] **32-A1: buildRemotionPrompt()** — Inject previous ep summary, foreshadowing, growth, gag history, pacing
  - File: `bun_app/storygraph/src/scripts/subagent-prompt.ts`

- [ ] **32-A2: story-graph.ts enhancement** — loadPreviousEpisodeSummary(), loadActiveForeshadowing(), etc.
  - File: `bun_remotion_proj/shared/src/story-graph.ts`

### 32-B: Remotion Scene Quality Feedback Loop

- [ ] **32-B1: Post-render KG enrichment** — Actual scene durations → update KG predictions
  - File: `bun_app/storygraph/src/scripts/graphify-enrich.ts` (NEW)

- [ ] **32-B2: Prompt calibration data** — Track prompt→quality correlation
  - File: `bun_app/storygraph/src/scripts/prompt-calibration.ts` (NEW)

---

## Phase 33 — Dual-LLM Architecture

> Full spec + implementation order + dependency graph: `PLAN.md §Phase 33`
>
> **Core insight:** Two LLM paths (pi-agent GLM free, Claude paid) separated into three-tier quality pipeline.
> **MVP:** Phases 1–5 (33-A + 33-E smoke + 31-A + 33-E detail + 33-B).

### 33-A: gate.json v2 (P0, foundation)

- [x] **33-A1: Add provenance fields** — `series`, `genre`, `generator` (mode, model, version)
  - File: `bun_app/storygraph/src/scripts/graphify-check.ts`

- [x] **33-A2: Regression detection** — Read previous gate.json, compute `previous_score` + `score_delta`
  - File: `bun_app/storygraph/src/scripts/graphify-check.ts`

- [x] **33-A3: quality_breakdown** — Per-dimension normalized scores (consistency, arc, pacing, growth, theme, gag)
  - null for genre-inapplicable dimensions
  - File: `bun_app/storygraph/src/scripts/graphify-check.ts`

- [x] **33-A4: supervisor_hints** — focus_areas, suggested_rubric_overrides, escalation_reason
  - File: `bun_app/storygraph/src/scripts/graphify-check.ts`

- [x] **33-A5: requires_claude_review** — true if score < 70 OR any FAIL OR score_delta < -10
  - File: `bun_app/storygraph/src/scripts/graphify-check.ts`

### 33-B: Claude Code Review Skill Topic (P1, Tier 2)

- [x] **33-B1: Create kg-review topic** — `topics/kg-review/_topic.md` with Tier 2 rubric
  - 5 dimensions + genre extensions, reads gate.json v2 + quality-score.json
  - File: `.claude/skills/remotion-best-practices/topics/kg-review/_topic.md` (NEW)

- [x] **33-B2: Integrate with episode-setup** — Add Tier 2 review step after Step 3b
  - File: `.claude/skills/remotion-best-practices/topics/episode-setup/episode-creation.md`

- [x] **33-B3: quality-review.json schema** — Per-dimension scores + fix suggestions + regression notes
  - File: Documented in kg-review topic

### 33-C: CLI Packaging (P1, deployability)

- [ ] **33-C1: cli.ts entry point** — `storygraph <series-dir> [options]` with --mode/--ci
  - File: `bun_app/storygraph/src/cli.ts` (ENHANCE)

- [ ] **33-C2: package.json bin field** — `"bin": { "storygraph": "src/cli.ts" }`
  - File: `bun_app/storygraph/package.json`

- [ ] **33-C3: CI integration guide** — GitHub Actions + pre-commit examples
  - File: `.claude/skills/remotion-best-practices/topics/kg-review/ci-guide.md` (NEW)

### 33-D: Feedback Loop (P2, calibration)

- [ ] **33-D1: graphify-review.ts** — Claude writes quality-review.json from gate.json + quality-score.json
  - File: `bun_app/storygraph/src/scripts/graphify-review.ts` (NEW)

- [ ] **33-D2: Prompt calibration** — Track suggestions applied → score delta
  - File: `bun_app/storygraph/src/scripts/prompt-calibration.ts` (NEW)

### 33-E: Multi-Series Evaluation Suite (P1)

- [x] **33-E1: weapon-forger benchmark** — xianxia_comedy, 7 eps, chapter-based
  - File: `bun_app/storygraph/test-corpus/weapon-forger/`

- [x] **33-E2: galgame-meme-theater benchmark** — galgame_meme, 5 eps, comedy arc
  - File: `bun_app/storygraph/test-corpus/galgame-meme-theater/`

- [x] **33-E3: xianxia-system-meme benchmark** — xianxia_comedy, 2 eps, minimal cross-ep
  - File: `bun_app/storygraph/test-corpus/xianxia-system-meme/`

- [x] **33-E4: Cross-genre comparison report** — Side-by-side metrics table
  - File: `bun_app/storygraph/test-corpus/cross-genre-comparison.md`

- [x] **33-E5: Regression baseline commit** — Store benchmark snapshots
  - File: `bun_app/storygraph/test-corpus/baselines/`

### 33-F: Beyond-Graphify Deployment (P1)

#### 33-F1: Step 0 lite — PLAN.md Validation

- [ ] **33-F1a: PLAN.md parser** — Extract characters, episodes, rules → plan-struct.json
  - File: `bun_app/storygraph/src/scripts/plan-parser.ts` (NEW)

- [ ] **33-F1b: Chapter rule validator** — Sequential completion, episode count, arc position
  - File: `bun_app/storygraph/src/scripts/chapter-validator.ts` (NEW)

#### 33-F2: Step 3b lite — Quality Gate Writer

- [ ] **33-F2a: graphify-write-gate.ts** — Template-based zh_TW gate section from pipeline output
  - File: `bun_app/storygraph/src/scripts/graphify-write-gate.ts` (NEW)

- [ ] **33-F2b: GLM dialog assessment** — callAI() with dialog quality rubric
  - File: `bun_app/storygraph/src/scripts/subagent-prompt.ts` (+buildDialogAssessmentPrompt)

#### 33-F3: Step 2 lite — Story Draft (experimental)

- [ ] **33-F3a: GLM story draft** — Generate zh_TW dialog from constraints (60-70% quality)
  - File: `bun_app/storygraph/src/scripts/subagent-prompt.ts` (+buildStoryDraftPrompt)

- [ ] **33-F3b: Story quality evaluation** — GLM evaluates own draft
  - File: `bun_app/storygraph/src/scripts/subagent-prompt.ts` (+buildStoryQualityPrompt)

#### 33-F4: Step 4 lite — Episode Scaffold Generation

- [ ] **33-F4a: narration.ts generator** — Template-based from confirmed dialog
  - File: `bun_app/storygraph/src/scripts/gen-narration.ts` (NEW)

- [ ] **33-F4b: Episode TODO.md generator** — Standard TODO.md structure from PLAN.md
  - File: `bun_app/storygraph/src/scripts/gen-episode-todo.ts` (NEW)

### 33-G: Develop-Deploy Evaluation Framework (P1)

- [ ] **33-G1: Full-pipeline Tier comparison** — Deploy vs develop on all 3 series
  - File: `bun_app/storygraph/test-corpus/tier-comparison/`

- [ ] **33-G2: Step-by-step quality delta** — Per-step comparison table
  - File: `bun_app/storygraph/test-corpus/step-quality-delta.md`

- [ ] **33-G3: Cost/latency matrix** — Step × tier × model resource usage
  - File: `bun_app/storygraph/test-corpus/cost-latency-matrix.md`

- [ ] **33-G4: End-to-end deploy simulation** — Full lite pipeline without Claude Code
  - File: `bun_app/storygraph/test-corpus/deploy-simulation/`

- [ ] **33-G5: Regression runner** — Re-run eval suite, alert if >10% drop
  - File: `bun_app/storygraph/src/scripts/graphify-regression.ts` (NEW)

### 33-H: Episode-Setup Workflow Adjustment (P1)

- [ ] **33-H1: Episode-creation.md deploy path** — --deploy flag, pi-agent lite steps
  - File: `.claude/skills/remotion-best-practices/topics/episode-setup/episode-creation.md`

- [ ] **33-H2: Hybrid mode instructions** — pi-agent structural + Claude creative
  - File: `.claude/skills/remotion-best-practices/topics/episode-setup/episode-creation.md`

- [ ] **33-H3: SKILL.md topic detection update** — Add kg-review topic keywords
  - File: `.claude/skills/remotion-best-practices/SKILL.md`

---

## Phase 35 — Web UI Foundation (Bun + Hono + React SPA)

> Full spec: `PLAN.md §Phase 35`
>
> **Goal:** Replace Claude Code chat/skills with a web UI for full pipeline orchestration.
> **Architecture:** Hono API server + React SPA + Vite, all on Bun runtime.
> **Prerequisite:** Phase 34-B complete (category-aware scaffold validated).

### 35-A: Hono API Server

- [ ] **35-A1: bun_app/bun_webui/ scaffold** — Package.json, tsconfig, Hono + Vite setup
  - File: `bun_app/bun_webui/` (NEW)
  - Deps: hono, vite, @vitejs/plugin-react

- [ ] **35-A2: API server entry** — Bun.serve() with Hono, routes stub, CORS
  - File: `bun_app/bun_webui/src/server/index.ts` (NEW)

- [ ] **35-A3: Job queue middleware** — Background task execution with SSE progress
  - File: `bun_app/bun_webui/src/server/middleware/job-queue.ts` (NEW)

- [ ] **35-A4: Shared types** — API request/response types
  - File: `bun_app/bun_webui/src/shared/types.ts` (NEW)

### 35-B: React SPA

- [ ] **35-B1: Vite + React setup** — index.html, App.tsx, routing, layout shell
  - File: `bun_app/bun_webui/src/client/` (NEW)

- [ ] **35-B2: API client** — Typed fetch wrapper for Hono routes
  - File: `bun_app/bun_webui/src/client/api.ts` (NEW)

- [ ] **35-B3: Dashboard page** — Series list, episode status badges, quick actions
  - File: `bun_app/bun_webui/src/client/pages/Dashboard.tsx` (NEW)

### 35-C: Script Module Exports

- [ ] **35-C1: Refactor episodeforge as importable module** — Export main() callable from API
  - File: `bun_app/episodeforge/src/index.ts`

- [ ] **35-C2: Refactor storygraph scripts as modules** — Export pipeline functions
  - Files: `bun_app/storygraph/src/scripts/*.ts`

- [ ] **35-C3: Refactor generate-image as importable module** — Export imageGen() callable from API
  - Wraps image.z.ai / Google AI Studio image generation
  - File: `.claude/skills/generate-image/` or `bun_app/bun_image/` (NEW)

- [ ] **35-C4: Refactor generate-tts as importable module** — Export ttsGen() callable from API
  - Wraps edge-tts / Gemini TTS / MLX TTS
  - File: `.claude/skills/generate-tts/` or `bun_app/bun_tts/` (NEW)

---

## Phase 36 — Project Management UI

> Full spec: `PLAN.md §Phase 36`

### 36-A: Project CRUD

- [ ] **36-A1: Projects API** — CRUD endpoints, scan existing bun_remotion_proj/
  - File: `bun_app/bun_webui/src/server/routes/projects.ts` (NEW)

- [ ] **36-A2: Scaffold API** — Wrap episodeforge via importable module
  - File: `bun_app/bun_webui/src/server/services/scaffold.ts` (NEW)

- [ ] **36-A3: ProjectCreate page** — Category wizard → preset data → scaffold
  - File: `bun_app/bun_webui/src/client/pages/ProjectCreate.tsx` (NEW)

### 36-B: Story Editor

- [ ] **36-B1: PLAN.md parser/editor** — Structured form per category type
  - File: `bun_app/bun_webui/src/client/pages/StoryEditor.tsx` (NEW)

- [ ] **36-B2: Auto-save + preview** — Save to disk, render preview
  - File: `bun_app/bun_webui/src/client/pages/StoryEditor.tsx`

---

## Phase 37 — Pipeline & Quality UI

> Full spec: `PLAN.md §Phase 37`

### 37-A: Pipeline Runner

- [ ] **37-A1: Pipeline API** — Run graphify pipeline, return job status
  - File: `bun_app/bun_webui/src/server/routes/pipeline.ts` (NEW)

- [ ] **37-A2: Graphify service** — Wrap graphify scripts as importable module
  - File: `bun_app/bun_webui/src/server/services/graphify.ts` (NEW)

- [ ] **37-A3: Pipeline page** — Select episodes → run → progress → results
  - File: `bun_app/bun_webui/src/client/pages/Pipeline.tsx` (NEW)

### 37-B: Quality Dashboard

- [ ] **37-B1: Quality API** — Read gate.json, quality-score.json, comparison data
  - File: `bun_app/bun_webui/src/server/routes/quality.ts` (NEW)

- [ ] **37-B2: Quality page** — Score charts, breakdown radar, regression alerts
  - File: `bun_app/bun_webui/src/client/pages/Quality.tsx` (NEW)

---

## Phase 38 — Asset & Render UI

> Full spec: `PLAN.md §Phase 38`

### 38-A: Asset Management

- [ ] **38-A1: Assets API** — Browse/upload/tag images and audio
  - File: `bun_app/bun_webui/src/server/routes/assets.ts` (NEW)

- [ ] **38-A2: Assets page** — Character gallery, background browser, audio player
  - File: `bun_app/bun_webui/src/client/pages/Assets.tsx` (NEW)

### 38-B: TTS & Render

- [ ] **38-B1: TTS API + page** — Voice generation + audio preview
  - Files: `bun_app/bun_webui/src/server/routes/tts.ts`, `src/client/pages/TTS.tsx` (NEW)

- [ ] **38-B2: Render API + page** — Trigger render, monitor, preview MP4
  - Files: `bun_app/bun_webui/src/server/routes/render.ts`, `src/client/pages/Render.tsx` (NEW)

---

## Phase 39 — Full Pipeline Orchestration

> Full spec: `PLAN.md §Phase 39`

- [ ] **39-A1: Workflow templates** — Predefined pipelines (scaffold → story → graphify → gate → render)
- [ ] **39-A2: Automation rules** — Auto-run graphify on PLAN.md change, auto-render on quality pass
- [ ] **39-A3: Monitoring dashboard** — Series health, quality trends, completion rate
- [ ] **39-A4: CI/CD integration** — Webhook triggers, scheduled pipeline runs
- [ ] **39-A5: Export/import** — Project configs as JSON for reproducibility
