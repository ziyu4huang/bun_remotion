# Novel Video Generation — TODO

> **Cross-linked docs:**
> - `NEXT.md` — Entry point (read first — status, next task, dependency graph)
> - `PLAN.md` — Active phase spec (Phase 44)
> - `TODO-archive.md` — Completed tasks (Phase 24–43)
> - `PLAN-archive.md` — Completed phase specs (Phase 24–43)
> - `REFLECTIONS.md` — Historical session logs
> - `../storygraph/PLAN.md` — storygraph code-level architecture
> - `../storygraph/TODO.md` — storygraph code-level tasks
> - `../../bun_app/bun_pi_agent/TODO.md` — bun_pi_agent Phase 3 tasks

> **Rule:** Strategic/pipeline tasks → this file. Code implementation tasks → `../storygraph/TODO.md` or `../../bun_app/bun_pi_agent/TODO.md`.

> **Status:** v0.9.9 — Phase 54 complete (all 9 sub-agents built). Next: Episode creation (Ch3-Ep2).

---

## Phase 54-D: studio-image Agent (DONE)

> **Goal:** Add studio-image agent with 3 image tools wrapping bun_image and character profile services.

- [x] **54-D: studio-image agent** — image_generate, image_status, image_characters tools + agent definition
  - Files: bun_pi_agent/src/tools/image-tools.ts, .agent/agents/studio-image.md
  - image_generate: batch generation via bun_image with facing direction enhancement
  - image_status: scan character/background assets, flag missing manifests
  - image_characters: parse characters.ts, characters.md, manifest files for full profile data
  - bun_pi_agent dependency: added bun_image workspace dep
  - Updated tool-registry.ts, tools/index.ts, tools.test.ts (32 total tools, 17 tests pass)

## Phase 54-E: studio-coordinator Agent (DONE)

> **Goal:** Master orchestrator agent that delegates to all other studio agents via spawn_task.

- [x] **54-E: studio-coordinator agent** — Agent definition with 4 production pipelines
  - Files: .agent/agents/studio-coordinator.md
  - Tools: spawn_task, Read, Grep, Find
  - Pipelines: Build Episode (full), Quick Render, Quality Audit, Asset Generation
  - Coordinates 6 studio agents + 4 specialist agents
  - Coordination rules: check prerequisites, pass context, handle failures, respect scopes

---

## Phase 56: Playwright E2E Tests + Pipeline→Storygraph Rename (DONE)

> **Goal:** Add real interactive E2E tests to catch regressions when new features break existing WebUI functionality. Rename confusing "Pipeline" tab to "Storygraph" with help messages and AI advisor.

- [x] **56-A: Playwright setup + smoke tests** — playwright.config.ts, e2e/helpers.ts, 15 smoke tests verifying all 13 pages load
  - Files: playwright.config.ts, e2e/helpers.ts, e2e/smoke.spec.ts
  - All 15 smoke tests pass
- [x] **56-B: Dashboard + Projects E2E** — 6 dashboard tests (health, demo job, SSE streaming), 8 projects tests (list, detail, back, build, advisor, create form)
  - Files: e2e/dashboard.spec.ts, e2e/projects.spec.ts
- [x] **56-C: AgentChat + Benchmark E2E** — 4 agent chat tests (selector, streaming, buttons), 6 benchmark tests (selectors, table, agent toggle)
  - Files: e2e/agent-chat.spec.ts, e2e/benchmark.spec.ts
- [x] **56-D: Pipeline → Storygraph rename** — Renamed Pipeline.tsx→Storygraph.tsx, nav label, added HelpTip component, MODE_HELP descriptions, ACTION_HELP tooltips
  - Files: App.tsx, Storygraph.tsx (renamed from Pipeline.tsx)
- [x] **56-E: Storygraph AI advisor panel** — Extracted AdvisorPanelBase shared component from Projects.tsx, added Ask Advisor toggle + sidebar to Storygraph page using sg-story-advisor
  - Files: AdvisorPanelBase.tsx (new), Storygraph.tsx (+advisor), Projects.tsx (-240 lines inline advisor)
- [x] **56-F: Remaining page E2E tests** — 26 tests across navigation, quality, monitoring, story editor, assets/TTS/render, workflows/image pages
  - Files: e2e/navigation.spec.ts, e2e/quality.spec.ts, e2e/monitoring.spec.ts, e2e/story-editor.spec.ts, e2e/assets-tts-render.spec.ts, e2e/workflows-image.spec.ts
  - **65 total E2E tests pass, 198 bun tests pass (2 pre-existing failures unrelated)**

## Phase 51: Rename bun_webui → remotion_studio (DONE)

> **Goal:** Rename bun_webui to remotion_studio across the codebase.
> **Why:** `bun_webui` is too generic — doesn't convey it's a Remotion project builder studio with AI-powered pipeline orchestration.
> **Full spec:** `PLAN.md §Phase 51`

- [x] **51-A: Directory rename** — `git mv bun_app/bun_webui/` → `bun_app/remotion_studio/`
- [x] **51-B: package.json** — name field updated
- [x] **51-C: Root package.json** — workspace entry updated, `bun install` regenerated lock
- [x] **51-D: Internal references** — CLAUDE.md, skill PLAN/TODO/NEXT, memory files, server log
- [x] **51-E: Verification** — `grep bun_webui` returns 0 in active files (only archive files retain old name)

## Phase 52: WebUI ↔ pi_agent Bridge API (PLANNED)

> **Goal:** Build same-process bridge so remotion_studio can spawn bun_pi_agent tasks and stream results to the browser.
> **Why:** The vision is remotion_studio as frontend, pi_agent as backend intelligence. Currently they're disconnected.
> **Chain:** Phase 51 (rename) → Phase 52 (bridge) → Phase 53 (standalone mode)
> **Full spec:** `PLAN.md §Phase 52`

### P0 — Agent bridge

- [ ] **52-A: agent-bridge.ts** — Import `createAgentFromDef()` + `discoverAgents()` from bun_pi_agent
  - `runAgentTask(agentName, prompt)` → creates agent, subscribes to events, returns result
  - `listAvailableAgents()` → discovers and returns agent definitions
  - Same-process mode: no IPC, direct function calls

- [ ] **52-B: Agent API routes** — `server/routes/agent.ts`
  - `POST /api/agent/chat` — Send prompt to agent, stream response via SSE
  - `POST /api/agent/tasks` — Start named task (returns job ID)
  - `GET /api/agent/tasks/:id` — Get task status + result
  - `GET /api/agent/tasks/:id/stream` — SSE stream of agent progress
  - `GET /api/agent/agents` — List available sub-agents

### P1 — UI

- [x] **52-C: Agent Chat page** — React page for direct agent interaction
  - Agent selector dropdown
  - Chat input with streaming response display
  - Tool call visualization
  - Files: AgentChat.tsx (307 lines), agent-bridge.ts (135 lines), routes/agent.ts (109 lines), api.ts agent methods, shared types

- [x] **52-D: Agent-backed workflow steps** — Replace some direct pipeline-api.ts calls with agent delegation
  - Benchmark page → uses sg-benchmark-runner agent
  - Quality page → uses sg-quality-gate agent
  - Backward compatible: direct calls still work, agent path is opt-in
  - Files: benchmark.ts (agent-backed POST /run), Benchmark.tsx (agent toggle + report), Quality.tsx (quality gate button), api.ts (agent param), types.ts (agentReport field)

### P2 — New agents

- [x] **52-E: Studio sub-agent definitions** — `.agent/agents/studio-*.md`
  - studio-scaffold: scaffold generation (Read, Write, Bash, Grep, Find)
  - studio-reviewer: full quality review (sg_pipeline, sg_check, sg_score, rm_analyze, rm_lint, Read, Grep)
  - studio-advisor: content suggestions (sg_suggest, sg_health, rm_analyze, rm_suggest, Read, Grep, Find)
  - Verified: 8 agents discovered (5 existing + 3 new), correct tool counts and model assignments

## Phase 53: Standalone Mode — No claude-code (PLANNED)

> **Goal:** remotion_studio + bun_pi_agent runs autonomously. Only needs an LLM endpoint.
> **Why:** The user wants to produce videos without claude-code in the loop. The studio should be a standalone application.
> **Chain:** Phase 52 (bridge) → Phase 53 (standalone)
> **Full spec:** `PLAN.md §Phase 53`

### P0 — Config

- [x] **53-A: Agent-backed workflow engine** — Workflow steps delegate to sub-agents via runAgentTask()
  - STEP_AGENT_MAP: scaffold→studio-scaffold, pipeline→sg-benchmark-runner, check/score→sg-quality-gate, tts/render/image→pi-developer
  - buildStepPrompt() generates context-aware prompts per step kind
  - resolveAgentStepOutput() reads disk artifacts after agent completion
  - Backward compatible: agent?: boolean flag, default false
  - agentReport captured in WorkflowStepStatus for UI display
  - Files: workflow-engine.ts (~150 lines added), workflows.ts (agent flag), types.ts (agentReport field)
  - All 198 tests pass (15 workflow tests, 0 regressions)

- [x] ~~**53-B: LLM config API + Settings page**~~ SKIPPED — env vars already work, no need for UI config layer yet

### P1 — Autonomous flows

- [x] **53-C: "Build Episode" flow** — One-click episode creation
  - UI button on episode detail page (Build column in ProjectDetail episode table)
  - Triggers: scaffold → pipeline → quality → TTS → render (full-pipeline template, agent-backed)
  - Each step streams progress to UI via SSE + step polling
  - Failure handling: stop + report + "Retry from failed step" button
  - retryWorkflow() in workflow-engine.ts: re-runs from specific step, copies completed steps from previous result
  - POST /api/workflows/:id/retry route
  - BuildPanel component with per-step progress bars and retry button
  - Files: workflow-engine.ts (+55 lines), workflows.ts (+35 lines), api.ts (+25 lines), Projects.tsx (+150 lines), types.ts (+2 lines)
  - All 716 tests pass (2 pre-existing failures unrelated)

### P2 — Polish

- [x] **53-D: Agent Chat improvements** — Conversation history (localStorage per agent), retry on error, export as markdown
- [x] **53-E: Story advisor on-demand panel** — Collapsible sidebar on ProjectDetail, streams from studio-advisor/sg-story-advisor

## Phase 54: Expanded Sub-Agent Library (PLANNED)

> **Goal:** Complete sub-agent library covering the full video production pipeline.
> **Full spec:** `PLAN.md §Phase 54`

- [x] **54-A: studio-scaffold agent** — Episode scaffolding + PLAN.md generation
  - `bun_app/bun_pi_agent/src/tools/scaffold-tools.ts` — 3 tools: sc_scaffold, sc_series_list, sc_episode_list
  - Wraps episodeforge scaffold() function for reliable one-call scaffolding
  - Updated studio-scaffold agent definition (8 tools: 3 scaffold + 5 basic)
  - Updated workflow-engine.ts scaffold prompt to reference sc_scaffold
  - All 299 tests pass (6 new scaffold tests, 0 regressions)
- [x] **54-B: studio-tts agent** — Voice synthesis + voice map management
  - `bun_app/bun_pi_agent/src/tools/tts-tools.ts` — 3 tools: tts_generate, tts_voices, tts_status
  - Wraps bun_tts pipeline for audio generation, reads voice-config.json or VOICE_MAP from narration.ts
  - Updated studio-tts agent definition (6 tools: 3 tts + Read + Grep + Find)
  - Updated workflow-engine.ts tts step prompt to reference tts_generate
  - All 300 tests pass (3 new TTS tool tests, 0 regressions, tool count 23→26)
- [x] **54-C: studio-render agent** — Episode rendering + queue management
  - `bun_app/bun_pi_agent/src/tools/render-tools.ts` — 3 tools: render_episode, render_status, render_list
  - Wraps remotion-renderer.ts for agent-driven rendering, status checking, and series-level render listing
  - Updated studio-render agent definition (6 tools: 3 render + Read + Grep + Find)
  - Updated workflow-engine.ts: render step now delegates to studio-render agent, tts to studio-tts agent
  - Updated tool-registry.ts with 3 new render tool mappings
  - All 308 tests pass (7 new render tests, 0 regressions, tool count 26→29)
- [ ] **54-D: studio-image agent** — Character/background image generation
- [ ] **54-E: studio-coordinator agent** — Master orchestrator using spawn_task

## Phase 55: Agent Chat UX — Visual Differentiation (PLANNED)

> **Goal:** Make chat UI differentiate between tool calls, thinking, and chat messages. Fix AdvisorPanel bugs (state destruction on hide, no tool tracking).
> **Full spec:** `PLAN.md §Phase 55`

### P0 — Shared components + critical bugs

- [x] **55-A: Shared chat components** — Extract `ChatMessage` types + `ToolCallCard` from AgentChat into `src/client/components/`
  - `ChatMessage` type: role, content, toolCalls[], meta, isError, thinking?
  - `ToolCallCard` component: inline card with status icon, collapsible result, left border accent
  - `ChatBubble` component: user (blue) vs assistant (white) styling
  - Both AgentChat and AdvisorPanel import from shared components

- [x] **55-B: AgentChat visual differentiation** — Rebuild message rendering
  - Tool cards appear inline between user msg and response (not after)
  - Response in distinct white bubble with shadow
  - Streaming: tool cards collapse to summary when response starts
  - Turn count / duration shown as subtle metadata

- [x] **55-C: AdvisorPanel tool call tracking** — Add tool_start/tool_end handlers
  - Currently only captures `text` events — tools are invisible to user
  - Reuse shared ToolCallCard component
  - Show "Analyzing..." indicator while tools run

- [x] **55-D: AdvisorPanel state persistence** — Fix hide/show destroying history
  - **BUG:** Closing panel unmounts component, losing all messages
  - Fix: Lift messages state to `ProjectDetail` parent (survives unmount)
  - Add localStorage persistence keyed by seriesId (like AgentChat pattern)

### P1 — Polish

- [x] **55-E: Thinking indicator + turn separators**
  - Show "Thinking..." between tool calls (auto-hidden when response starts)
  - Subtle line separator between multi-turn conversations
  - Both UIs

- [x] **55-F: Markdown rendering in assistant messages**
  - Parse basic markdown: **bold**, *italic*, `code`, lists
  - Preserve pre-wrap for code blocks
  - Both UIs

> **Goal:** bun_pi_agent runs storygraph pipeline + regression + review autonomously — no claude-code subagent needed.
> **Why:** Current quality pipeline requires claude-code to trigger scripts and interpret results. Phase 43 review agent proved GLM can do Tier 2 review. Now extend to the full chain: pipeline → regression → review → decision.
> **Chain:** Phase 43 (review agent, done) → Phase 44 (autonomous benchmark) → Phase 45 (Web UI integration)
> **Full spec:** `PLAN.md §Phase 44`

### P0 — Core integration (agent tools)

- [x] **44-A: storygraph-tools.ts** — `bun_app/bun_pi_agent/src/tools/storygraph-tools.ts`
  - 5 agent tools: `sg_pipeline`, `sg_check`, `sg_score`, `sg_status`, `sg_regression`
  - Imports pipeline-api.ts directly from storygraph workspace
  - Tests: `src/__tests__/storygraph-tools.test.ts` (10 tests), existing `tools.test.ts` + `agent.test.ts` updated (7→12 tools)
  - All 210 tests pass

### P1 — Workflow automation (agent skill)

- [x] **44-B: storygraph-benchmark skill** — `.agent/skills/storygraph-benchmark.md`
  - 7-step workflow: discover → status → pipeline → check → regression → score → report
  - Decision logic: PASS ≥70, WARN 40-69, FAIL <40, regression if delta > threshold
  - Works in both CLI and ACP stdio mode
  - Report format: markdown with scores, FAIL/WARN details, regression deltas
  - Tests: `src/__tests__/skills.test.ts` (4 tests), all 214 tests pass

### P2 — Baseline management

- [x] **44-C: Baseline management + multi-series regression**
  - `sg_baseline_update` — saves current gate.json as baseline-gate.json
  - `sg_baseline_list` — discovers series, shows baselines + deltas
  - Updated benchmark skill to use sg_baseline_list for discovery
  - Tests: storygraph-tools.test.ts (+2 tests), tools.test.ts + agent.test.ts (14 tools), all 218 tests pass

### P2 — CI integration

- [x] **44-D: CI integration** — --ci exit codes, structured JSON output for CI pipelines
  - `src/ci.ts` — standalone CI entry point (pipeline → check → regression → exit 0/1)
  - `sg_regression` tool: `ci: true` parameter returns structured JSON + exitCode in details
  - CI modes for no-baseline (exit 0, NO_BASELINE) and no-gate (exit 1, NO_GATE) cases
  - Tests: storygraph-tools.test.ts (+3 tests: ci JSON, ci error, non-ci text), all 221 tests pass

## Phase 45: Web UI Benchmark Page (DONE)

> **Goal:** Expose Phase 44 autonomous benchmark tools through the remotion_studio Hono + React SPA.
> **Full spec:** `PLAN.md §Phase 45`

- [x] **45: Web UI Benchmark page**
  - `remotion_studio/src/shared/types.ts` — Added `BenchmarkResult`, `BaselineInfo` types
  - `remotion_studio/src/server/routes/benchmark.ts` — 5 API endpoints: GET /baselines, POST /run, POST /check, POST /regression, POST /baseline/:seriesId
  - `remotion_studio/src/server/index.ts` — Registered `/api/benchmark` route
  - `remotion_studio/src/client/api.ts` — Added `api.benchmark` methods
  - `remotion_studio/src/client/pages/Benchmark.tsx` — React page with series selector, baseline table, full benchmark runner with SSE progress, regression check, baseline management
  - `remotion_studio/src/client/App.tsx` — Added "Benchmark" nav item
  - API tested: baselines, regression, baseline update all return correct structured JSON
  - Pre-existing test failures (export-import, image timeout) unrelated to benchmark changes

## Phase 46: Proactive Storygraph Tools (DONE)

> **Goal:** Add proactive story suggestion and health tools that analyze existing KG data *before* writing the next episode, rather than only checking quality after episodes are written.

- [x] **46-A: runSuggest() + runHealth() in pipeline-api.ts**
  - 8 analyzer functions: foreshadow_debt, flat_arc, gag_stagnation, missing_interaction, thematic_gap, pacing_issue, trait_gap, duplicate_risk
  - `Suggestion`, `SuggestResult`, `HealthDimension`, `HealthResult` types
  - Pure programmatic analysis — no AI calls, reads existing `storygraph_out/` artifacts
  - ~450 lines added to pipeline-api.ts

- [x] **46-B: sg_suggest + sg_health tool wrappers**
  - `createStorygraphSuggestTool()` — returns prioritized story suggestions
  - `createStorygraphHealthTool()` — returns per-dimension health dashboard
  - Updated `createStorygraphTools()` to return 9 tools
  - Tool count updated: 7 base + 9 storygraph = 16 total tools

- [x] **46-C: Tests**
  - 6 new tests (sg_suggest: 3, sg_health: 3)
  - Updated tool counts in agent.test.ts (14→16), tools.test.ts (14→16), storygraph-tools.test.ts (7→9)
  - All 227 tests pass

- [x] **46-D: Benchmark skill update**
  - Added Step 5.5 (sg_health) and Step 5.6 (sg_suggest) to workflow
  - Added Story Health table to report template

## Phase 47: Multi-Agent Definition System (DONE)

> **Goal:** Add `.agent/agents/` support to pi-agent, allowing multiple configured agents with scoped tools, custom prompts, and model overrides.
> **Result:** 4 predefined agents, 254 tests passing, CLI flags --agent/--list-agents working.

> **Goal:** Add `.agent/agents/` support to pi-agent, allowing multiple configured agents with scoped tools, custom prompts, and model overrides. Inspired by Claude Code's `.claude/agents/` pattern.
> **Why:** Currently pi-agent is a monolith — all 16 tools always loaded, single system prompt. For specialized tasks (story advising, quality gating, benchmarking), the agent needs focused tool sets and tailored prompts. Multi-agent enables task delegation like Claude Code's subagent system.
> **Full spec:** `PLAN.md §Phase 47`

### P0 — Agent definition parser

- [x] **47-A: Agent definition format + parser** — `bun_app/bun_pi_agent/src/agents/`
  - Markdown files in `.agent/agents/*.md` with YAML frontmatter
  - Frontmatter fields: `name`, `description`, `tools` (whitelist), `model` (override), `skills` (filter)
  - Body = agent-specific system prompt (appended to base)
  - Parser: `parseAgentDef(filePath)` → `AgentDefinition` type
  - Discovery: `discoverAgents(workDir)` → scans `.agent/agents/` + `~/.agent/agents/`

### P1 — Agent factory

- [x] **47-B: Agent factory with tool scoping** — `bun_app/bun_pi_agent/src/agents/factory.ts`
  - `createAgentFromDef(def: AgentDefinition)` — creates Agent with filtered tools + composed prompt
  - Tool filtering: resolve tool names → select from `createTools()` pool
  - Prompt composition: base prompt + agent body + filtered skills section
  - Model override: if `model` specified, use `getModel()` instead of default config
  - Fallback: unknown tool names → skip with warning (not error)

### P2 — CLI integration

- [x] **47-C: CLI `--agent <name>` flag** — `bun_app/bun_pi_agent/src/index.ts`
  - `bun run pi-agent --agent sg-story-advisor` starts with that agent definition
  - If `--agent` not provided, use default monolithic agent (backward compatible)
  - Agent list: `bun run pi-agent --list-agents` shows available agents
  - Works in all modes: CLI, server, ACP stdio

### P2 — Predefined agents

- [x] **47-D: Predefined agent definitions** — `.agent/agents/`
  - `sg-story-advisor.md` — creative writing + story continuity (sg_suggest, sg_health, sg_status, Read, Grep, Glob)
  - `sg-quality-gate.md` — strict quality enforcement (sg_pipeline, sg_check, sg_score, sg_regression, Read, Grep)
  - `sg-benchmark-runner.md` — autonomous benchmark workflow (all sg_* tools)
  - `pi-developer.md` — general coding + storygraph (all tools, = current default)

## Phase 48: Subagent Invocation (DONE)

> **Goal:** Add `spawn_task` tool that allows one agent to invoke another agent as a subagent. Enables orchestration patterns like "pi-developer delegates quality check to sg-quality-gate agent".
> **Depends on:** Phase 47 (agent definition system)

- [x] **48-A: spawn_task tool** — `bun_app/bun_pi_agent/src/tools/spawn-task.ts`
  - Parameters: `agent_name`, `task_prompt`, `max_turns` (optional, default 10)
  - Creates a new Agent from definition, runs prompt, returns result
  - Isolation: subagent has its own context, doesn't pollute parent
  - Turn limiting via abort on max_turns exceeded
  - Works in CLI and ACP modes

- [x] **48-B: Subagent result extraction** — Parse subagent output into structured result
  - Event subscription collects final assistant text, tool calls, turn count
  - Returns structured details: `{ agent_name, turn_count, tool_calls, truncated }`
  - Registered in tool-registry.ts and tools/index.ts (17 total tools)
  - Tests: spawn-task.test.ts (9 tests), updated tool counts (254→263)

## Phase 57: TaskNode Types + In-Memory TaskStore (DONE)

> **Goal:** Define TaskNode type hierarchy and in-memory TaskStore. Pure data layer.
> **Full spec:** `PLAN.md §Phase 57`

- [x] **57-A: TaskNode/TaskTree types** — `remotion_studio/src/shared/types.ts` (~40 lines)
  - TaskStatus, TaskNode (id, parentId, label, kind, status, progress, deps, children, error, result, timestamps)
  - TaskTree (rootId, nodes Record, createdAt, updatedAt) — using Record instead of Map for JSON safety
- [x] **57-B: TaskStore class** — `remotion_studio/src/server/services/task-store.ts` NEW (~120 lines)
  - createTree(), addNode(), updateNode(), getTree(), getReadyTasks(), getProgress(), listTrees(), deleteTree()
  - getReadyTasks skips root node (container, not executable)
- [x] **57-C: Unit tests** — `task-store.test.ts` (10 tests, 21 assertions)
  - All 10 pass, 208 total tests pass (2 pre-existing failures unrelated)

## Phase 58: JSON Persistence for TaskStore (DONE)

> **Goal:** Persist TaskStore to `data/task-trees.json`. Survive restarts.
> **Full spec:** `PLAN.md §Phase 58`

- [x] **58-A: loadFromDisk/saveToDisk** — TaskStore persistence via constructor filePath param, lazy ensureLoaded(), saveToDisk() after every mutation
- [x] **58-B: Eviction policy** — cap 50 trees, evict oldest completed/failed first
- [x] **58-C: Corruption recovery** — try/catch on load, start fresh silently
- Tests: task-store.test.ts (15 tests, 34 assertions), 213 total pass, 0 regressions

## Phase 59: Template → TaskTree Translator (PLANNED)

> **Goal:** Pure function converting WorkflowTemplate into TaskNode tree with parallelism.
> **Full spec:** `PLAN.md §Phase 59`

- [ ] **59-A: buildTaskTree() function** — `workflow-engine.ts` (~80 lines)
  - full-pipeline: scaffold → pipeline → [check, score] → tts → render
  - quality-gate: pipeline → [check, score]
  - image-tts-render: [image, tts] → render
- [ ] **59-B: Unit tests** — verify dependency graph for each template (~50 lines)

## Phase 60: DAG Executor (PLANNED)

> **Goal:** Topological-sort executor with parallel dispatch and resume capability.
> **Full spec:** `PLAN.md §Phase 60`

- [ ] **60-A: dag-executor.ts** — NEW (~120 lines)
  - Promise.allSettled for parallel dispatch
  - Failed task → mark transitive dependents as skipped
  - Skip completed tasks on resume
- [ ] **60-B: Unit tests** — parallel timing, failure skipping, resume (~60 lines)

## Phase 61: Wire DAG into Workflow Engine (PLANNED)

> **Goal:** Replace runWorkflow for-loop with DAG executor. Backward compatible.
> **Full spec:** `PLAN.md §Phase 61`

- [ ] **61-A: Refactor runWorkflow** — use buildTaskTree + executeTaskTree (~150 lines changed)
- [ ] **61-B: retryWorkflow = resume** — load tree, reset failed, re-execute (~40 lines)
- [ ] **61-C: All existing tests pass** — backward compatible (~20 lines)

## Phase 62: Task Tree API + Dashboard View (PLANNED)

> **Goal:** Tree API endpoints + Dashboard collapsible tree view.
> **Full spec:** `PLAN.md §Phase 62`

- [ ] **62-A: Tree API routes** — GET /tree, GET /tree/:taskId, POST /tree/:taskId/retry (~80 lines)
- [ ] **62-B: TaskTreeNode component** — shared collapsible tree node (~80 lines)
- [ ] **62-C: Dashboard rewrite** — tree view replacing flat job table (~150 lines)
- [ ] **62-D: api.ts client methods** — tree endpoint wrappers (~30 lines)

## Phase 63: Workflows Page Tree Upgrade (PLANNED)

> **Goal:** Replace flat step list with tree visualization showing parallel branches.
> **Full spec:** `PLAN.md §Phase 63`

- [ ] **63-A: Workflows.tsx tree view** — use TaskTreeNode component (~150 lines changed)
- [ ] **63-B: Live tree polling** — refresh tree during execution (~30 lines)
- [ ] **63-C: Playwright E2E test** — verify tree loads and nodes interactive (~50 lines)
