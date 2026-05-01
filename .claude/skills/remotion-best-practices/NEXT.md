# NEXT — Current Work

> **Entry point.** Read this first. Load TODO.md and PLAN.md sections only when actively working on a task.
>
> **Cross-linked docs:**
> - `TODO.md` — Active tasks (Phase 60)
> - `PLAN.md` — Active phase specs (Phase 44–63)
> - `REFLECTIONS.md` — Historical session logs (on-demand)
> - `TODO-archive.md` — Completed tasks (Phase 24–43)
> - `PLAN-archive.md` — Completed phase specs (Phase 24–43)
> - `../storygraph/TODO.md` — Storygraph pipeline tasks + run history
> - `../storygraph/PLAN.md` — Storygraph architecture
> - `../develop_bun_app/TODO.md` — bun_app code-level tasks
> - `../develop_bun_app/PLAN.md` — bun_app architecture
> - `../../bun_app/bun_pi_agent/TODO.md` — bun_pi_agent Phase 3 tasks
> - `../../bun_app/bun_pi_agent/PLAN.md` — bun_pi_agent architecture

> **Status:** v1.7.2 — remotion_studio v0.12.1 (299 tests, test-reviewer integration). storygraph v0.36.0 (461 tests). bun_pi_agent v0.13.0 (483 tests, 33 tools, CI gate). episodeforge v0.3.0 (87 tests, P1 complete). R1-R4 + agent-first + episodeforge P1 complete. 1430 total tests.

## Next Task

**R1-R4 roadmap: COMPLETE**
**Agent-first WebUI: COMPLETE** (Quality, Benchmark, Monitoring, Dashboard)
**episodeforge P1: COMPLETE** (--list-series, --force, reorderScripts, PLAN.md rows, asset validation)

**Next priorities:**
1. **Ch4-Ep1: 組隊系統** — Next episode in my-core-is-boss series
2. **episodeforge P2** — Custom template overrides per series

**Just completed:** Ch3-Ep3 秘境 BOSS (仇恨繞柱) — rendered 153M, 6:52. Chapter 3 complete.

## Implementation Order

```
═══ DONE ═══

44-A: storygraph-tools.ts (5 agent tools wrapping pipeline-api.ts) ✓
44-B: storygraph-benchmark skill (autonomous workflow) ✓
44-C: Baseline management + multi-series regression ✓
44-D: CI integration (--ci exit codes + structured JSON) ✓
45: Web UI Benchmark page (routes + API + page) ✓
Ch3-Ep1: 速通記錄 (noclip穿牆, rendered 152M, 6:01) ✓
Ch3-Ep2: 隱藏關卡 (查看代碼, rendered 161M, 6:43) ✓
46: Proactive storygraph tools (sg_suggest + sg_health) ✓

═══ DONE ═══

47-A: Agent definition parser (.agent/agents/*.md frontmatter) ✓
47-B: Agent factory (tool scoping + prompt composition) ✓
47-C: CLI --agent <name> flag + --list-agents ✓
47-D: Predefined agents (story-advisor, quality-gate, benchmark-runner, developer) ✓

═══ DONE ═══

48-A: spawn_task tool (createSpawnTaskTool) ✓
48-B: Subagent result extraction (event subscription + turn limiting) ✓
49-A: Agent rename with domain prefixes (sg-* + pi-*) ✓

═══ DONE ═══

50-A: Remotion content tools (rm_analyze, rm_suggest, rm_lint) ✓
50-B: rm-content-analyst agent + updated existing agents ✓

═══ DONE ═══

51-A: Rename bun_webui → remotion_studio (directory + package.json) ✓
51-B: Update root scripts + CLAUDE.md references ✓
51-C: Verify all tests pass, no broken references ✓
52-A: agent-bridge.ts (same-process import + lazy loading + event mapping) ✓
52-B: Agent API routes (GET /agents, GET /status, POST /chat SSE, POST /tasks) ✓
52-D: Agent-backed workflow steps (Benchmark agent toggle + Quality gate button) ✓

═══ NEXT ═══

Streaming verification: serializeEvent (8 tests) + SSE parse (7 tests) + message_end fix ✓

53-A: Agent-backed workflow engine (steps delegate to sub-agents) ✓
53-B: ~~LLM config API + Settings page~~ SKIPPED (env vars sufficient)
53-C: "Build Episode" autonomous flow (scaffold→pipeline→quality→TTS→render) ✓
53-D: Agent Chat improvements (history, retry, export) ✓
53-E: Story advisor on-demand panel (sidebar in ProjectDetail) ✓
remotion_studio runs autonomously. Only needs LLM endpoint.

═══ PLANNED — Agent Library (Phase 54) ═══
Complete sub-agent library covering full video production pipeline.

54-A: studio-scaffold agent (episode scaffolding + PLAN.md generation) ✓
54-B: studio-tts agent (voice synthesis + voice map management) ✓
54-C: studio-render agent (episode rendering + queue management) ✓
54-D: studio-image agent (character/background image generation) ✓
54-E: studio-coordinator agent (master orchestrator using spawn_task) ✓

═══ PLANNED — Agent Chat UX (Phase 55) ═══
Visual differentiation for tool calls, thinking, and chat messages.

55-A: Shared ChatMessage types + ToolCallCard component ✓
55-B: AgentChat visual differentiation (tool cards inline, response bubble) ✓
55-C: AdvisorPanel tool call tracking (currently ignores tool events) ✓
55-D: AdvisorPanel persist state (hide/show destroys history — BUG) ✓
55-E: Thinking indicator + turn separators ✓
55-F: Markdown rendering in assistant messages ✓

═══ DONE — E2E Testing + Storygraph Rename (Phase 56) ═══

56-A: Playwright setup + smoke tests (15 tests, all 13 pages) ✓
56-B: Dashboard + Projects E2E tests (6+8 tests) ✓
56-C: AgentChat + Benchmark E2E tests (4+6 tests) ✓
56-D: Pipeline → Storygraph rename + help tooltips + mode descriptions ✓
56-E: Storygraph AI advisor panel (AdvisorPanelBase shared component) ✓
56-F: Navigation + Quality + Monitoring + Story Editor + Assets/TTS/Render + Workflows/Image E2E tests ✓

═══ FUTURE ═══

Ch3-Ep3: 秘境 BOSS (仇恨繞柱) ✓ (rendered 153M, 6:52)

═══ FUTURE ═══

Ch4-Ep1: 組隊系統

═══ PLANNED — Task Tree Workflow Engine (Phases 57–63) ═══
Replace flat linear workflow with DAG task tree. Parallel execution + resume.

57-A: TaskNode/TaskTree types in types.ts ✓
57-B: TaskStore class (in-memory, createTree/addNode/updateNode/getReadyTasks) ✓
57-C: Unit tests for TaskStore (10 tests) ✓
58-A: JSON persistence (data/task-trees.json, load/save, eviction) ✓
58-B: Eviction policy (cap 50, oldest completed first) ✓
58-C: Corruption recovery (try/catch, start fresh) ✓
59-A: buildTaskTree() — template → task tree with parallel deps ✓
59-B: Dependency graph tests (check+score parallel, image+tts parallel) ✓
60-A: dag-executor.ts (topological sort, Promise.allSettled, failure skipping) ✓
60-B: Parallel timing + resume tests ✓
61-A: Wire DAG into runWorkflow (replace for-loop) ✓
61-B: retryWorkflow = load tree + reset failed + resume ✓
62-A: Tree API routes (GET /tree, POST /tree/:taskId/retry) ✓
62-B: TaskTreeNode component (shared collapsible tree node) ✓
62-C: Dashboard tree view rewrite ✓
63-A: Workflows page tree upgrade (parallel branches visible) ✓
63-B: Live tree polling (2s interval, cleanup on unmount) ✓
63-C: E2E tests for workflows tree view (7 tests) ✓

═══ DONE — WebUI Polish (Phases 64-66) ═══

64-A: ErrorBoundary component (class component, fallback UI, reload button) ✓
64-B: ToastContainer (module-level emitter, success/error/info, auto-dismiss) ✓
64-C: Replace all 4 alert() calls with toast() ✓
64-D: Add toast to silent failures (Dashboard, Projects, Workflows, TTS, Render) ✓
65-A: Skeleton component (SkeletonRow shimmer + SkeletonCard) ✓
65-B: 6 pages use skeletons (Dashboard, Projects, Workflows, Storygraph, Assets, Monitoring) ✓
66-A: E2E helpers (forceApiError, delayApiRoute, waitForToast) ✓
66-B: 4 new E2E test files (toast, loading, error, form interactions) ✓

═══ DONE — Theme + Responsive + Dashboard (Phases 67-70) ═══

67-A: Theme tokens (lightTheme + darkTheme with colors/spacing/radii/shadows/fonts) ✓
67-B: Theme context (ThemeProvider, useTheme, useThemeMode) ✓
67-C: Wire ThemeProvider into index.tsx ✓
67-D: Migrate 13 shared components to theme tokens ✓
67-E: Migrate App.tsx sidebar + theme toggle button ✓
68-A: useMediaQuery hook ✓
68-B: useSidebarState hook ✓
68-C: Responsive App.tsx (hamburger, overlay sidebar, backdrop, touch targets) ✓
69-A: Enhanced Dashboard job cards (timestamps, duration, errors, progress bars) ✓
69-B: Job filter tabs (All/Running/Completed/Failed with counts) ✓
69-C: Server-side cancel/delete jobs ✓
69-D: Job API routes (POST cancel, DELETE, ?status= filter) ✓
69-E: Collapsible task trees on Dashboard ✓
70-A: All 13 pages migrated to theme tokens ✓
70-B: E2E helper update (data-toast-type attribute) ✓

═══ DONE — remotion_studio v0.3.0 (2026-04-27) ═══

P0: JobStore persistence (data/jobs.json, 24h TTL, restart recovery) ✓
P0: Switch routes to DAG (runWorkflowDAG auto-selected via TEMPLATE_DEPS) ✓
P0: Restart recovery (mark interrupted jobs as failed) ✓
P0: Rename CreateProject → ScaffoldEpisode ✓
P0: E2E smoke test (API health + all 13 pages) ✓
P1: Image step in full-pipeline (7-step DAG, parallel with pipeline) ✓
P1: Cancel workflow (AbortController + dag-executor signal) ✓
P1: API namespace cleanup (pipeline.* + TTS casing) ✓

═══ DONE — remotion_studio v0.3.1 (2026-04-27) ═══

P1: Pipeline progress table (GET /api/episode-progress + PipelineProgress.tsx page, 6 tests) ✓
P1: Job history panel (listHistory + GET /api/jobs/history + Dashboard section, 6 tests) ✓

═══ DONE — remotion_studio v0.4.0–v0.10.0 (2026-04-27) ═══

v0.4.0: Batch operations (POST /api/batch, multi-episode TTS/render, 7 tests) ✓
v0.5.0: Kanban board (EpisodeKanban.tsx) + asset search (HighlightText) ✓
v0.6.0: Help text (Dashboard What's Next, Monitoring legend, info panels on 6 pages) ✓
v0.7.0: Design brief (ImageGen), quality hints (StoryEditor), review checklist (Projects) ✓
v0.8.0: Dialog preview (TTS scene-level preview, no new backend) ✓
v0.9.0: Plan revision history (saveRevision, listRevisions, restore panel) ✓
v0.10.0: Structured section editor (markdown-table utils, SectionEditor component, Structure tab) ✓
v0.11.0: zh_TW localization (i18n system, 150+ strings, language toggle, 5 tests) ✓
Bug fix: Stale server caused Progress/Kanban to return HTML — fixed by server restart ✓

═══ PLANNED — bun_pi_agent Benchmark Improvements (Phases 71-75) ═══

Fix benchmark that shows no model differentiation (all score 6.8/10).

71-A: Tool call budget (beforeToolCall hook, max 15 calls, afterToolCall terminate) ✓
71-B: Continuous efficiency scoring (decay: ≤2=3, ≤4=2, ≤6=1.5, ≤10=1, ≤15=0.5, >15=0) ✓
71-C: Report turn counts + budget exceeded indicators ✓
71-D: Tests (9 efficiency + 3 calibration + 3 report) ✓
72-A: Expand task1 keywords (dialog→dialogue/conversation/speech, scene→segment/sequence, character→speaker/role) ✓
72-B: Fix task2 response scoring (keyword quality instead of text length) ✓
72-C: Tests (6 scoring calibration) ✓
73-A: Structured bench system prompt (scoring dimensions + efficiency guidance) ✓
74-A: AI-only mode for Suite A (was hybrid, regex dominated) ✓
74-B: 5 new tasks (file write plan, error diagnosis, cross-file comparison, code gen, regression) ✓
74-C: Update report for 10 tasks ✓
74-D: Tests ✓
75-A: Config fields (benchMaxToolCalls, benchMaxTurns, benchMode env vars) ✓
75-B: Report recommendation section (best quality/efficiency/speed/value) ✓
75-C: Tests ✓

═══ PLANNED — Cross-App Regression Plan (Phases R1-R4) ═══

R1: ~~storygraph regression test suite~~ ✓ (43 tests for graphify-regression.ts)
R2: ~~pi-agent dual review~~ ✓ (sg_dual_review tool + sg-dual-reviewer agent + 17 tests)
R3: ~~remotion_studio regression dashboard~~ ✓ (agent-first quality page, "Ask agent" CTA, 10 tests)
R4: ~~CI gate~~ ✓ (`bun run ci:kg` / `ci:kg-all`, 6 tests)
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
| 31 | Subagent KG quality scoring | 2026-04-19 |
| 32 | KG-driven LLM prompt enhancement | 2026-04-19 |
| 33 | Dual-LLM architecture (A–I) | 2026-04-19 |
| 34 | Video category system (A–F) | 2026-04-19 |
| 35 | Web UI Foundation (Hono + React SPA) | 2026-04-20 |
| 36 | Project Management UI | 2026-04-20 |
| 37 | Pipeline + Quality UI | 2026-04-21 |
| 38 | Asset + Render UI | 2026-04-21 |
| 39 | Full Pipeline Orchestration | 2026-04-21 |
| 40 | E2E Pipeline Verification | 2026-04-22 |
| 41-A | Character Profile System | 2026-04-22 |
| 41-B | Batch Character Generation (13/13) | 2026-04-24 |
| 41-C | Roadmap Refactor | 2026-04-24 |
| 43 | Review Agent CLI (GLM5-turbo) | 2026-04-24 |
| 42 | my-core-is-boss ch2-ep3 (技能點分配) | 2026-04-24 |
| 44-A | storygraph-tools.ts (5 agent tools) | 2026-04-25 |
| 44-B | storygraph-benchmark skill | 2026-04-25 |
| 44-C | Baseline management (sg_baseline_update, sg_baseline_list) | 2026-04-25 |
| 44-D | CI integration (ci.ts, structured JSON, exit codes) | 2026-04-25 |
| 45 | Web UI Benchmark page (5 endpoints + React page) | 2026-04-25 |
| 42 | Ch3-Ep1 速通記錄 (rendered 152M, 6:01) | 2026-04-25 |
| 46 | Proactive storygraph tools (sg_suggest + sg_health) | 2026-04-25 |
| 47 | Multi-Agent Definition System (4 agents) | 2026-04-25 |
| 48 | Subagent Invocation (spawn_task tool) | 2026-04-25 |
| 49-A | Agent rename with domain prefixes | 2026-04-25 |
| 50-A | Remotion content tools (rm_analyze, rm_suggest, rm_lint) | 2026-04-25 |
| 50-B | rm-content-analyst agent + updated 3 existing agents | 2026-04-25 |
| 51 | Rename bun_webui → remotion_studio | 2026-04-25 |
| 52-A/B/C/D | Agent bridge + routes + chat page + workflow steps | 2026-04-25 |
| 52-E | Studio sub-agents (scaffold, reviewer, advisor) | 2026-04-25 |
| 53-A | Agent-backed workflow engine (7 step→agent mappings) | 2026-04-25 |
| 53-B | ~~LLM config API~~ SKIPPED (env vars sufficient) | 2026-04-25 |
| 53-C | "Build Episode" autonomous flow + retry-from-step | 2026-04-25 |
| 53-D | Agent Chat improvements (history, retry, export) | 2026-04-25 |
| 53-E | Story advisor on-demand panel | 2026-04-25 |
| 54-A | studio-scaffold agent + scaffold tools (sc_scaffold, sc_series_list, sc_episode_list) | 2026-04-26 |
| 54-B | studio-tts agent + TTS tools (tts_generate, tts_voices, tts_status) | 2026-04-26 |
| 54-C | studio-render agent + render tools (render_episode, render_status, render_list) | 2026-04-26 |
| — | Agent bridge fix (import paths + REPO_ROOT for .agent/agents/ discovery) | 2026-04-26 |
| 55 | Agent Chat UX (shared components, visual differentiation, AdvisorPanel fixes) | 2026-04-26 |
| 56 | Playwright E2E tests (65 tests, all 13 pages) + Pipeline→Storygraph rename + AI advisor | 2026-04-26 |
| 54-D | studio-image agent + image tools (image_generate, image_status, image_characters) | 2026-04-26 |
| 54-E | studio-coordinator agent (master orchestrator, 4 production pipelines) | 2026-04-26 |
| — | Bug fixes: skillPaths crash, error serialization, scaffold prompt | 2026-04-26 |
| 57 | TaskNode types + TaskStore (10 tests, foundation for DAG engine) | 2026-04-26 |
| 58 | JSON persistence for TaskStore (load/save, eviction, corruption recovery) | 2026-04-26 |
| 59 | buildTaskTree — template → DAG (10 tests, 3 parallel templates + fallback) | 2026-04-26 |
| 60 | DAG executor — parallel dispatch, failure skipping, resume (4 tests) | 2026-04-26 |
| 61 | Wire DAG into runWorkflow + retryWorkflow (backward compat, 229 tests pass) | 2026-04-26 |
| 62 | Task Tree API + Dashboard tree view (3 routes, TaskTreeNode component, tree-based dashboard) | 2026-04-26 |
| 63 | Workflows page tree upgrade (TaskTreeView + live polling + E2E tests) | 2026-04-26 |
| — | E2E pipeline: headless→headed feedback loop, 72 tests, SKILL enforced, server crash found | 2026-04-26 |
| — | Server stability fixes: 9 fixes (process handlers, job eviction, SSE cleanup, DAG guard, agent abort, timeout middleware) | 2026-04-26 |
| — | UI polish: 4 shared components + sidebar grouping + all 13 pages updated + export-import test fix | 2026-04-26 |
| Ch3-Ep2 | 隱藏關卡 (查看代碼, 161M, 6:43) | 2026-04-26 |
| 64-66 | WebUI polish: ErrorBoundary + Toast notifications + Loading skeletons + Deeper E2E tests | 2026-04-26 |
| — | Streaming verification: serializeEvent (8 tests) + SSE parse (7 tests) + message_end fix | 2026-04-27 |
| — | remotion_studio v0.3.0: JobStore persistence, DAG routing, restart recovery, image step, cancel workflow, API namespace | 2026-04-27 |
| — | Pipeline progress table: per-episode 7-step status page (GET /api/episode-progress, 6 tests, 242 total) | 2026-04-27 |
| — | remotion_studio v0.3.2: Job history panel + configurable retention (JOB_TTL_DAYS) | 2026-04-27 |
| — | remotion_studio v0.4.0: Batch operations — multi-episode TTS/render (7 tests, 255 total) | 2026-04-27 |
| — | remotion_studio v0.5.0: Kanban board + asset search (EpisodeKanban.tsx, 15 pages) | 2026-04-27 |
| — | remotion_studio v0.6.0: Help text, Monitoring legend, What's Next (6 pages improved) | 2026-04-27 |
| — | remotion_studio v0.7.0: Design brief, quality hints, review checklist | 2026-04-27 |
| — | remotion_studio v0.8.0: Dialog preview (test single scene TTS) | 2026-04-27 |
| — | remotion_studio v0.9.0: Plan revision history with restore | 2026-04-27 |
| — | remotion_studio v0.11.0: zh_TW localization (i18n system, 150+ strings, language toggle, 279 tests) | 2026-04-27 |
| — | bun_pi_agent v0.9.0: E2E test suite (38 tests, 93 expect(), no API keys) + SSE error bug fix + test-reviewer agent (13th) | 2026-04-27 |
| — | bun_pi_agent v0.10.2: GLM5 benchmark run (4 models × 2 suites), Z_AI_API_KEY fix, kg-suite path bugs | 2026-04-28 |
| — | storygraph v0.35.0: Regression test suite (43 tests for graphify-regression.ts) | 2026-04-29 |
| — | storygraph v0.36.0: Dual-agent review (sg_dual_review + sg-dual-reviewer + 17 tests) | 2026-04-29 |
| — | bun_pi_agent: 33 tools (sg_dual_review), 14 agents (sg-dual-reviewer), 477 tests | 2026-04-29 |
| R3 | remotion_studio agent-first quality page (Ask agent CTA, regression endpoint, 10 tests) | 2026-04-29 |
| R4 | CI gate scripts (`ci:kg`, `ci:kg-all`, 6 tests, 1311 total across 4 apps) | 2026-04-29 |
| — | remotion_studio v0.12.1: test-reviewer integration (AgentChat starters, Dashboard test review, i18n) | 2026-04-30 |
| Ch3-Ep3 | 秘境 BOSS (仇恨繞柱, rendered 153M, 6:52) | 2026-04-30 |

## Archive

- Completed tasks: `TODO-archive.md`
- Completed phase specs: `PLAN-archive.md`
- Historical reflections: `REFLECTIONS.md`
