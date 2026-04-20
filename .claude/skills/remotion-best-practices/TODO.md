# Novel Video Generation — TODO

> **Cross-linked docs:**
> - `NEXT.md` — Entry point (read first — status, next task, dependency graph)
> - `PLAN.md` — Active phase specs (Phase 31–33)
> - `TODO-archive.md` — Completed tasks (Phase 24–34)
> - `PLAN-archive.md` — Completed phase specs (Phase 24–30)
> - `../storygraph/PLAN.md` — storygraph code-level architecture
> - `../storygraph/TODO.md` — storygraph code-level tasks

> **Rule:** Strategic/pipeline tasks → this file. Code implementation tasks → `../storygraph/TODO.md`.

> **Status:** v0.30.0 — Phase 33-D complete. Remaining: 33-F3 (experimental), Phase 35-39 (Web UI).

---

## Phase 33-D: Feedback Loop (P2, calibration) — COMPLETE

- [x] **33-D1: graphify-review.ts** — Tier 2 review tool → quality-review.json. Template + AI modes. 10 tests.
  - File: `bun_app/storygraph/src/scripts/graphify-review.ts`

- [x] **33-D2: suggestion-log.ts** — Fix suggestion tracking with delta computation. 13 tests.
  - File: `bun_app/storygraph/src/scripts/suggestion-log.ts`

- [x] **33-D3: Enhanced prompt-calibration** — Suggestion delta display in calibrate CLI.
  - File: `bun_app/storygraph/src/scripts/prompt-calibration.ts` (EDIT)

- [x] **33-D4a: Cross-project smoke tests** — 34 tests validating all 5 series pipeline output.
  - File: `bun_app/storygraph/src/scripts/__tests__/cross-project-smoke.test.ts`

- [x] **33-D4b: Regression score trending** — --trend flag for regression runner.
  - File: `bun_app/storygraph/src/scripts/graphify-regression.ts` (EDIT)

- [x] **33-D4c: Quality examples reporter** — Per-series AI extraction summary.
  - File: `bun_app/storygraph/src/scripts/graphify-quality-examples.ts`

- [x] **CLI integration** — review + quality-examples commands in cli.ts.

---

## Phase 33-F3: Step 2 lite — Story Draft (experimental)

- [ ] **33-F3a: GLM story draft** — Generate zh_TW dialog from constraints (60-70% quality)
  - File: `bun_app/storygraph/src/scripts/subagent-prompt.ts` (+buildStoryDraftPrompt)

- [ ] **33-F3b: Story quality evaluation** — GLM evaluates own draft
  - File: `bun_app/storygraph/src/scripts/subagent-prompt.ts` (+buildStoryQualityPrompt)

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

---

## Done

- [x] Phase 24-A–F (6 quality checks)
- [x] Phase 25 (sketched, archived)
- [x] Phase 26 (pi-agent AI integration)
- [x] Phase 27 (hybrid mode + comparison)
- [x] Phase 28 + 28-B (model benchmark, glm-5 default)
- [x] Phase 29 (quality pipeline + overlays)
- [x] Phase 30 (genre-aware KG pipeline)
- [x] Phase 31 (subagent KG quality scoring)
- [x] Phase 32 (KG-driven LLM prompt enhancement)
- [x] Phase 33-A–C, E, F1, F2, F4, G, H, I (dual-LLM architecture)
- [x] Phase 33-D (feedback loop calibration + cross-project regression)
- [x] Phase 34-A–F (video category system)
- [x] P0: Speed Up Test Suite (74x speedup)
