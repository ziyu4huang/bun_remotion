# remotion_studio — Code TODO

> **Cross-linked docs:**
> - Code PLAN: `bun_app/remotion_studio/PLAN.md`
> - Code TODO: `bun_app/remotion_studio/TODO.md` — **(this file)**

> **Status:** v0.13.0 — DeepSeek support, multi-turn chat, model switcher. Focus: AI agent integration + E2E UX.

## Known Issues

### Architecture Gaps (remaining)
- No batch cancellation UI (can cancel from Dashboard)
- [x] ~~Old workflow jobs with missing task trees cause 404 console errors on Dashboard load~~ — Fixed: tree endpoint returns `{ok:true, data:null}` instead of 404

## P0 — Current Focus: AI Agent Integration & E2E UX

### 0-A: AI Agent Integration Improvement

- [x] **Dashboard agent buttons fixed** — Changed prompts from production-status (job queue, bottlenecks) to story-health questions that `studio-advisor` can actually answer with its tools (sg_health, sg_suggest, rm_analyze, rm_suggest). Dashboard now loads series list to provide real context in prompts. Added bridge-down indicator badge.
- [x] **useAgentTask hook fixed** — Replaced stale closure over `bridgeDown` with refs. Added periodic bridge re-check every 30s when down. Exposed `checkBridge` for consumers.
- [x] **Server MIME types fixed** — Static JS/CSS files now served with correct Content-Type headers to avoid browser module loading errors.
- [x] **Agent streaming reliability** — Verified all SSE event types (text, tool_start, tool_end, result, error). Added 3-minute client-side timeout via Promise.race. Verified via Playwright: analyzing indicator, stop/abort, no console errors during 55s+ connection.
- [ ] **Agent task status in WebUI** — When an agent triggers a pipeline job (scaffold, pipeline, render), show the job status inline in chat, not just in Dashboard.
- [ ] **Agent file attachment** — Allow uploading/selecting files in chat (e.g., pick a narration.ts to analyze).
- [x] **Multi-turn context** — Client now passes full conversation history via new `history` param. Server passes it as `initialMessages` to Agent. Verified via curl: SSE streams with prior context.
- [x] **Agent error recovery** — Bridge-unavailable page now shows numbered recovery steps (check API keys, verify deps, check logs, restart server). Added "Retry" button to re-check bridge.

### 0-B: WebUI Interactive E2E Tests

- [ ] **Critical user flow E2E** — Test complete pipeline flow in browser: create series → scaffold episode → run KG pipeline → check quality → generate TTS → render. Not just page rendering — real interactions.
- [ ] **Agent chat E2E** — Test actual SSE streaming with mock agent responses. Verify tool call cards, thinking indicators, error states.
- [ ] **Workflow DAG E2E** — Test trigger full-pipeline workflow, verify task tree updates in real-time, test cancel mid-workflow.
- [ ] **Error scenario coverage** — Test what happens when: server unreachable, job fails mid-pipeline, TTS engine fails, render times out. Verify error messages are helpful.
- [ ] **Mobile responsive E2E** — Test sidebar collapse, page layout, and form interactions at mobile viewport widths.

## Pending (deferred)

- **Video preview before full render** (low-res) — Requires Remotion still rendering, significant new infrastructure. Defer.
- **Export to platform formats** (YouTube, Bilibili, TikTok) — Requires FFmpeg pipeline per platform, captions, thumbnails. Defer.

## P0 — Fix now (breaks user experience)

- [x] **JobStore persistence**: Create `services/job-store.ts` mirroring TaskStore pattern, persist to `data/jobs.json`, load on startup
- [x] **Switch routes to DAG**: Change `routes/workflows.ts` to call `runWorkflowDAG()` for templates with `TEMPLATE_DEPS` entries
- [x] **Restart recovery**: On server start, mark any "running" persisted jobs as "interrupted", allow retry
- [x] **E2E test**: Vite starts, all 13 pages render, API health responds
- [x] Rename `CreateProject` → `ScaffoldEpisode` in `pages/Projects.tsx`

## P1 — Job Queue & Pipeline

- [x] **Add image step to full-pipeline**: Update `TEMPLATE_DEPS["full-pipeline"]` with parallel image generation after scaffold
- [x] **Cancel workflow**: Cancel running DAG workflow (AbortController + signal in dag-executor + job-queue)
- [x] API namespace cleanup: `pipeline.*` namespace, consistent `TTS` casing
- [x] **Job history panel**: Show completed jobs beyond TTL (configurable retention)
  - [x] Backend: `listHistory()` on JobStore, `GET /api/jobs/history?olderThan=24h`
  - [x] Config: `JOB_TTL_DAYS` env var (default 7, was 1), max jobs 200→500
  - [x] Frontend: Collapsible "Job History" section in Dashboard with delete per-job
- [x] **Batch operations**: "TTS all episodes in chapter 3", "Render all pending"
  - [x] Backend: `POST /api/batch` — batch TTS/render with episode filter
  - [x] Frontend: PipelineProgress checkboxes + batch action buttons
- [x] **Pipeline progress table**: Dashboard shows per-episode pipeline status (which step each episode is at)
  - [x] Backend: `GET /api/episode-progress` — aggregates episode status across all series
  - [x] Frontend: `PipelineProgress.tsx` — table with 7-step columns, series grouping, filter tabs
  - [x] Added to Overview nav section as "Progress" page (14th page)
- [x] **Episode Kanban board**: Visual pipeline-stage columns (Scaffold→KG→Check→Score→Image→TTS→Render)
  - Series filter, per-column waiting count, progress micro-bar on cards
- [x] **Asset library search**: Substring search with highlight on Assets page
  - Search input, match count, `HighlightText` component

## P2 — Author Experience (Chinese Novel Studio)

- [x] Chinese (zh_TW) localization for all page labels, tooltips, empty states
- [x] Guided pipeline wizard: step-by-step "what to do next" for new users
- [x] Script/outline editor with per-scene structure (replace raw markdown textarea)
- [x] Episode Kanban board: Writing → Scaffolded → KG'd → TTS'd → Rendered
- [x] Character design brief → auto-generate image prompt
- [x] Asset library search/filter
- [ ] Video preview before full render (low-res)
- [x] Dialog preview (test line with assigned voice)
- [x] Revision history for story plans
- [ ] Export to platform formats (YouTube, Bilibili, TikTok)
- [x] Quality inline hints (Story Editor missing sections/character warnings)
- [x] Review checklist (per-series episode readiness in Projects detail)

## Development History

### 2026-04-29 — DeepSeek support + multi-turn + model switcher (v0.13.0)

| Metric | Value |
|--------|-------|
| Tests | 289 pass, 0 fail, 3015 expect() (remotion_studio); 479 pass, 4 fail (bun_pi_agent, 4 pre-existing live API) |

**Changes applied:**
- bun_pi_agent: Added DeepSeek provider support (`src/models/deepseek.ts`) — custom model definitions for deepseek-v4-pro and deepseek-v4-flash (1M context, 384K max output, thinking mode). Factory routes "deepseek" provider to custom model builder using DEEPSEEK_API_KEY env var.
- Factory: `createAgentFromDef` now accepts optional `modelOverride` param for runtime model switching.
- Agent bridge: `runAgentTask` accepts `history` (for multi-turn) and `model` (for runtime override) params.
- Server routes: Both `/chat` (SSE) and `/tasks` (polling) accept `history` and `model` in request body.
- AgentChat UI: Added model selector dropdown (Default/GLM/DeepSeek) with localStorage persistence. Model override sent with each chat request.
- AgentChat UI: Error recovery page shows numbered steps + Retry button.
- API: `streamChat` accepts optional `history` and `model` params. Added 3-min total timeout with Promise.race.
- Verified via Playwright: 0 console errors, model dropdown renders all options, SSE streaming works.

### 2026-04-29 — Dashboard agent fix + streaming reliability (v0.12.1)

| Metric | Value |
|--------|-------|
| Tests | 289 pass, 0 fail, 3005 expect() |

**Changes applied:**
- Dashboard: Changed agent buttons from production-status prompts to story-health prompts that `studio-advisor` can answer (Health Check, Content Gaps, Quality Audit). Added series data as prompt context. Added bridge-down "Agent offline" badge.
- useAgentTask hook: Replaced stale closure over `bridgeDown` with refs. Added periodic bridge re-check every 30s when down. Exported `checkBridge` for manual re-check.
- Server MIME types: Static JS/CSS/HTML files now get correct Content-Type headers.
- Stale tree 404s: `GET /api/workflows/:id/tree` returns `{ok:true, data:null}` instead of 404.
- Agent streaming: Added 3-minute client-side timeout via Promise.race. JSON parse errors in SSE handler now caught silently.
- E2E tests: Updated dashboard.spec.ts to match card-based layout (was expecting table).
- i18n: Added 5 new keys (agentAdvisor, agentOffline, healthCheck, contentGaps, qualityAudit) in en.ts and zh_TW.ts.
- Verified via Playwright: 0 console errors, Dashboard renders, agent chat SSE streams, abort works.

### 2026-04-27 — AI integration + E2E coverage (v0.12.0)

| Metric | Value |
|--------|-------|
| Tests | 279 pass, 0 fail, 2916 expect() |
| E2E specs | 23 files (was 17) |
| New E2E files | `kanban.spec.ts`, `pipeline-progress.spec.ts`, `i18n.spec.ts`, `section-editor.spec.ts`, `batch-operations.spec.ts`, `empty-states.spec.ts` |
| Modified pages | `AgentChat.tsx`, `StoryEditor.tsx`, `Workflows.tsx`, `ImageGen.tsx`, `TTS.tsx` |
| i18n keys added | 30+ (agent capabilities, conversation starters, advisor panels for 4 pages) |

**Changes applied:**
- AgentChat: Added `AgentCapabilityCard` (description, tools/skills badges, model info) + conversation starters (per-agent prompts)
- Advisor panels added to 4 pages: StoryEditor (sg-story-advisor), Workflows (studio-coordinator), ImageGen (studio-image), TTS (studio-tts)
- 6 new E2E spec files: Kanban, PipelineProgress, i18n toggle, SectionEditor, BatchOperations, EmptyStates
- Enhanced agent-chat.spec.ts with mock SSE, capability card, and conversation starters tests
- Enhanced error-scenarios.spec.ts (7 more pages) and loading-states.spec.ts (5 more pages)
- Updated NAV_LABELS to include Progress and Kanban

### 2026-04-27 — zh_TW localization (v0.11.0)

| Metric | Value |
|--------|-------|
| Tests | 279 pass, 0 fail, 2872 expect() |
| New files | `i18n/context.tsx`, `i18n/en.ts`, `i18n/zh_TW.ts`, `i18n/index.ts`, `__tests__/i18n.test.ts` (5 tests) |
| Modified | `App.tsx`, `index.tsx`, all 15 page files, `ErrorBoundary.tsx` |

**Changes applied:**
- Created i18n system: `LocaleProvider` context + `useI18n()` hook, locale persisted in localStorage
- English (`en.ts`) + Chinese Traditional (`zh_TW.ts`) translations with 150+ keys
- Type-safe nested translation objects with parameterized functions (plurals, counts)
- Added language toggle button ("中"/"En") to sidebar next to theme toggle
- Updated all 15 pages + App.tsx + ErrorBoundary to use i18n
- 5 unit tests: key parity, spot-check translations, function output, section coverage

### 2026-04-27 — Structured section editor (v0.10.0)

| Metric | Value |
|--------|-------|
| Tests | 274 pass, 0 fail, 2111 expect() |
| New files | `components/SectionEditor.tsx` (220 lines), `utils/markdown-table.ts` (70 lines), `__tests__/markdown-table.test.ts` (16 tests) |
| Modified | `pages/StoryEditor.tsx`, `components/index.ts` |

**Changes applied:**
- Created `utils/markdown-table.ts`: `parseMarkdownTable()`, `serializeMarkdownTable()`, `replaceSectionInMarkdown()`, `isMarkdownTable()`
- Created `components/SectionEditor.tsx`: Table-based editing for markdown tables (Characters, Episode Guide, Running Gags) with add/edit/delete rows; text editing for prose sections (Story Arcs, Chapter Rules)
- StoryEditor: Added "Structure" tab (4th view mode), renamed "Edit" to "Raw"
- Section changes auto-save via existing debounced mechanism
- 16 unit tests: table parse/serialize roundtrips, section replacement, type detection

### 2026-04-27 — Plan revision history (v0.9.0)

| Metric | Value |
|--------|-------|
| Tests | 258 pass, 0 fail, 2082 expect() |
| New files | `__tests__/plan-revisions.test.ts` (3 tests) |
| Modified | `services/plan-editor.ts`, `routes/plans.ts`, `pages/StoryEditor.tsx` |

**Changes applied:**
- plan-editor.ts: Added `saveRevision()` — snapshots plan content before each write to `data/plan-revisions/{seriesId}/`
- Added `listRevisions()` and `readRevision()` functions, max 50 revisions per series with pruning
- Plans route: Added `GET /api/plans/:seriesId/revisions` and `GET /api/plans/:seriesId/revisions/:revId`
- Story Editor: Added "History" button, collapsible revision panel with per-revision view, "Restore" button

### 2026-04-27 — Dialog preview (v0.8.0)

| Metric | Value |
|--------|-------|
| Tests | 255 pass, 0 fail |
| Modified | `pages/TTS.tsx` |

**Changes applied:**
- TTS page: Added "Scene Preview" panel — input scene name, click "Preview Scene" to generate TTS for just that scene
- Uses existing `generateTTS(scene: "sceneName")` parameter, no new backend needed
- Separate job tracker so preview doesn't interfere with full TTS generation

### 2026-04-27 — Design brief, quality hints, review checklist (v0.7.0)

| Metric | Value |
|--------|-------|
| Tests | 255 pass, 0 fail |
| Modified | `pages/ImageGen.tsx`, `pages/StoryEditor.tsx`, `pages/Projects.tsx` |

**Changes applied:**
- ImageGen: Added collapsible "Design Brief" panel with 10 structured fields (name, art style, gender, hair, eyes, outfit, accessories, expression, extras). "Apply to Prompt" auto-generates prompt string and filename.
- StoryEditor: Added "Quality Hints" panel above SectionsView — detects missing characters, missing voices/colors, no episode guide, no story arcs, no chapters. Warn/info severity levels.
- Projects: Added collapsible "Review Checklist" after episode table — shows scaffold/TTS/render/gate readiness per series with pass/fail indicators.

### 2026-04-27 — Help text, legend, What's Next (v0.6.0)

| Metric | Value |
|--------|-------|
| Tests | 255 pass, 0 fail |
| Modified | `Dashboard.tsx`, `Monitoring.tsx`, `AgentChat.tsx`, `TTS.tsx`, `Render.tsx`, `ImageGen.tsx` |

**Changes applied:**
- Dashboard: Added "What's Next" panel — reads episode progress, shows most common next pipeline step with episode counts
- Monitoring: Added trend legend (Improving/Stable/Declining/New) above series health table
- AgentChat: Improved description from "Chat with AI agents" to full description with use cases
- TTS: Added info panel explaining engines (MLX vs Gemini) and voice mapping
- Render: Added info panel with output specs (1920x1080, 30fps, file size estimate)
- ImageGen: Added description + prompt writing tips panel with example

### 2026-04-27 — Kanban board + asset search (v0.5.0)

| Metric | Value |
|--------|-------|
| Tests | 255 pass, 0 fail, 2076 expect() |
| New files | `pages/EpisodeKanban.tsx` (170 lines) |
| Modified | `App.tsx`, `pages/Assets.tsx` |
| Pages | 15 (new: EpisodeKanban) |

**Changes applied:**
- Created EpisodeKanban page: 7 pipeline-stage columns, episode cards with micro progress bar, series filter tabs
- Each card shows episode label, series name, score badge, 7-segment progress indicator
- Episodes placed at their first incomplete stage (fully complete ones in last column)
- Added "Kanban" to Overview nav section (15th page)
- Assets page: added search input, `HighlightText` component for match highlighting, match count display
- Assets search filters by name (case-insensitive substring) across all asset types

### 2026-04-27 — Batch operations (v0.4.0)

| Metric | Value |
|--------|-------|
| Tests | 255 pass, 0 fail, 2076 expect() |
| New files | `routes/batch.ts` (95 lines), `__tests__/batch.test.ts` (7 tests) |
| Modified | `server/index.ts`, `shared/types.ts`, `client/api.ts`, `pages/PipelineProgress.tsx` |

**Changes applied:**
- Created `POST /api/batch` route: accepts operation (tts/render), filter (episodeIds or seriesId+chapter), options (skipExisting, engine)
- Runs episodes sequentially in a single job, tracks per-episode progress, supports AbortSignal cancellation
- Added `BatchRequest`, `BatchResult`, `BatchEpisodeResult` types to shared/types.ts
- Added `api.batch.trigger()` client method
- PipelineProgress page now has checkboxes per episode, series-level select-all, batch TTS/Render buttons
- Select All / Deselect All button in filter bar, "Selected" summary card, toast notifications on batch start/complete

### 2026-04-27 — Job history panel (v0.3.2)

| Metric | Value |
|--------|-------|
| Tests | 248 pass, 0 fail, 2048 expect() |
| New files | `__tests__/job-history.test.ts` (6 tests) |
| Modified | `job-store.ts`, `job-queue.ts`, `server/index.ts`, `api.ts`, `Dashboard.tsx` |

**Changes applied:**
- Increased default TTL from 24h to 7 days, max jobs from 200 to 500
- Added `JOB_TTL_DAYS` env var for configurable retention
- Added `JobStore.listHistory(olderThanMs)` returning terminal jobs older than threshold
- Added `GET /api/jobs/history?olderThan=24h` endpoint (before `:id` routes to avoid path conflict)
- Added `api.listJobHistory()` client method
- Added collapsible "Job History" section to Dashboard with per-job delete buttons

### 2026-04-27 — Pipeline progress table (v0.3.1)

| Metric | Value |
|--------|-------|
| Tests | 242 pass, 0 fail, 2035 expect() |
| New files | `routes/episode-progress.ts`, `pages/PipelineProgress.tsx`, `__tests__/episode-progress.test.ts` |
| Pages | 14 (new: PipelineProgress) |

**Changes applied:**
- Created `routes/episode-progress.ts`: scans all projects, computes per-episode 7-step pipeline status from filesystem
- Added `EpisodeProgress`, `EpisodeStepProgress`, `EpisodeProgressSummary` types to shared/types.ts
- Added `api.getEpisodeProgress()` client method
- Created `PipelineProgress.tsx`: summary cards, filter tabs, per-series collapsible tables with step cells, step completion overview
- Added "Progress" to Overview nav section (14th page)
- 6 unit tests: API response shape, summary counts, step keys, byStep structure, avgCompletion range, sort order

### 2026-04-27 — P1 features: image step, cancel workflow, API cleanup

| Metric | Value |
|--------|-------|
| Tests | 236 pass, 0 fail, 1605 expect() |
| New files | `services/job-store.ts` (108 lines) |
| Modified | `dag-executor.ts`, `job-queue.ts`, `workflows.ts`, `workflow-engine.ts`, `api.ts`, `smoke.spec.ts`, `Storygraph.tsx`, `TTS.tsx`, `Projects.tsx` |

**Changes applied:**
- Added `image` step to full-pipeline (parallel with pipeline after scaffold, tts waits for image+check+score)
- Updated TEMPLATE_DEPS: `full-pipeline` now has 7 steps with image running in parallel
- Cancel workflow: AbortController in job-queue → signal through workflow-engine → dag-executor abort check
- API namespace: `getPipelineStatus/runPipeline/runCheck/runScore` → `pipeline.getStatus/run/check/score`
- API namespace: `getTtsStatus` → `getTTSStatus`
- Updated Storygraph.tsx and TTS.tsx imports for new API names
- Added 2 API health tests to smoke.spec.ts
- Updated 3 test files for 7-step full-pipeline expectations

### 2026-04-27 — P0 fixes: Job persistence, DAG routing, restart recovery

| Metric | Value |
|--------|-------|
| Tests | 236 pass, 0 fail |
| New files | `services/job-store.ts` (108 lines) |
| Modified | `middleware/job-queue.ts`, `routes/workflows.ts`, `services/workflow-engine.ts`, `server/index.ts`, `pages/Projects.tsx` |

**Changes applied:**
- Created `JobStore` service: persist jobs to `data/jobs.json` (24h TTL, 200 max, lazy load)
- Refactored `job-queue.ts` to delegate storage to JobStore (SSE + subscriber logic unchanged)
- Workflow routes now auto-select DAG (`runWorkflowDAG`) vs linear (`runWorkflow`) based on `TEMPLATE_DEPS`
- Exported `TEMPLATE_DEPS` from workflow-engine.ts
- Server startup marks interrupted jobs as "failed" with descriptive error
- Renamed `CreateProject` → `ScaffoldEpisode`, `goToCreate` → `goToScaffold` in Projects.tsx

### 2026-04-27 — Full audit + bug fixes

| Metric | Value |
|--------|-------|
| Pages | 13 (all verified via Playwright) |
| Console errors | 0 |
| Bugs found | 2 (both fixed) |
| Persistence gaps | Jobs in-memory only |
| DAG executor | Exists but unused in routes |

**Changes applied:**
- Fixed `theme/context.ts` → `context.tsx` (JSX in .ts file)
- Fixed Dashboard emoji `\u{1F4CB}` raw escape in JSX attribute
- Created PLAN.md with full function inventory + dependency tree
- Updated PLAN.md with persistence architecture analysis
- Updated TODO.md with prioritized tasks from audit
- Audited all 13 pages via Playwright E2E (0 errors)
- Discovered: routes use `runWorkflow()` not `runWorkflowDAG()`
- Discovered: Job persistence gap (in-memory only)

## Done

- [x] Job history panel (listHistory + GET /api/jobs/history + Dashboard section)
- [x] Pipeline progress table (GET /api/episode-progress + PipelineProgress.tsx page)
- [x] Fix theme/context.ts JSX error
- [x] Fix Dashboard emoji raw escape rendering
- [x] Write PLAN.md with full function inventory
- [x] Write TODO.md with prioritized tasks
- [x] Playwright E2E audit of all 13 pages
- [x] JobStore persistence (services/job-store.ts → data/jobs.json)
- [x] Switch workflow routes to DAG executor (TEMPLATE_DEPS check)
- [x] Restart recovery (mark interrupted jobs as failed)
- [x] Rename CreateProject → ScaffoldEpisode
- [x] Add image step to full-pipeline TEMPLATE_DEPS
- [x] Cancel workflow (AbortController + dag-executor signal)
- [x] API namespace cleanup (pipeline.* + TTS casing)
- [x] E2E smoke test (API health checks)
