# NEXT — Current Work

> **Entry point.** Read this first. Load TODO.md and PLAN.md sections only when actively working on a task.
>
> **Cross-linked docs:**
> - `TODO.md` — Active tasks (Phase 45)
> - `PLAN.md` — Active phase specs (Phase 44–45)
> - `REFLECTIONS.md` — Historical session logs (on-demand)
> - `TODO-archive.md` — Completed tasks (Phase 24–43)
> - `PLAN-archive.md` — Completed phase specs (Phase 24–43)
> - `../storygraph/TODO.md` — Storygraph pipeline tasks + run history
> - `../storygraph/PLAN.md` — Storygraph architecture
> - `../develop_bun_app/TODO.md` — bun_app code-level tasks
> - `../develop_bun_app/PLAN.md` — bun_app architecture
> - `../../bun_app/bun_pi_agent/TODO.md` — bun_pi_agent Phase 3 tasks
> - `../../bun_app/bun_pi_agent/PLAN.md` — bun_pi_agent architecture

> **Status:** v0.9.9 — Phase 58 complete (JSON persistence for TaskStore). Next: Phase 59 (buildTaskTree — template → DAG).

## Next Task

**Phase 59: Template → TaskTree Translator.** Pure function converting WorkflowTemplate into TaskNode tree with parallel dependencies. Enables DAG execution.

**Session findings (2026-04-26):** Tested Build Episode autonomous flow via Playwright. Found 3 bugs (skillPaths crash, error serialization, scaffold prompt). Agent-backed mode works but is flaky — deterministic steps should use direct calls. The workflow engine needs a fundamental redesign: flat linear chain → task tree with dependencies.

**Session findings (2026-04-26):** Tested Build Episode autonomous flow via Playwright. Found 3 bugs (skillPaths crash, error serialization, scaffold prompt). Agent-backed mode works but is flaky — deterministic steps should use direct calls. The workflow engine needs a fundamental redesign: flat linear chain → task tree with dependencies.

**Phase 54-E done:** studio-coordinator agent — master orchestrator using spawn_task to delegate to 6 studio agents. Defines 4 production pipelines: Build Episode (full), Quick Render, Quality Audit, Asset Generation.

## Implementation Order

```
═══ DONE ═══

44-A: storygraph-tools.ts (5 agent tools wrapping pipeline-api.ts) ✓
44-B: storygraph-benchmark skill (autonomous workflow) ✓
44-C: Baseline management + multi-series regression ✓
44-D: CI integration (--ci exit codes + structured JSON) ✓
45: Web UI Benchmark page (routes + API + page) ✓
Ch3-Ep1: 速通記錄 (noclip穿牆, rendered 152M, 6:01) ✓
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

Ch3-Ep2: 隱藏關卡 (查看代碼)
Ch3-Ep3: 秘境 BOSS (仇恨繞柱)

═══ PLANNED — Task Tree Workflow Engine (Phases 57–63) ═══
Replace flat linear workflow with DAG task tree. Parallel execution + resume.

57-A: TaskNode/TaskTree types in types.ts ✓
57-B: TaskStore class (in-memory, createTree/addNode/updateNode/getReadyTasks) ✓
57-C: Unit tests for TaskStore (10 tests) ✓
58-A: JSON persistence (data/task-trees.json, load/save, eviction) ✓
58-B: Eviction policy (cap 50, oldest completed first) ✓
58-C: Corruption recovery (try/catch, start fresh) ✓
59-A: buildTaskTree() — template → task tree with parallel deps
59-B: Dependency graph tests (check+score parallel, image+tts parallel)
60-A: dag-executor.ts (topological sort, Promise.allSettled, failure skipping)
60-B: Parallel timing + resume tests
61-A: Wire DAG into runWorkflow (replace for-loop)
61-B: retryWorkflow = load tree + reset failed + resume
62-A: Tree API routes (GET /tree, POST /tree/:taskId/retry)
62-B: TaskTreeNode component (shared collapsible tree node)
62-C: Dashboard tree view rewrite
63-A: Workflows page tree upgrade (parallel branches visible)
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

## Archive

- Completed tasks: `TODO-archive.md`
- Completed phase specs: `PLAN-archive.md`
- Historical reflections: `REFLECTIONS.md`
