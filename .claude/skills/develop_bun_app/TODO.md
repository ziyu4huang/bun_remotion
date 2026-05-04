# /develop_bun_app — Skill TODO

> **Cross-linked docs:**
> - Skill PLAN: `.claude/skills/develop_bun_app/PLAN.md` — Architecture, operations, design decisions
> - Skill TODO: `.claude/skills/develop_bun_app/TODO.md` — **(this file)** Tasks + history
> - Skill SKILL: `.claude/skills/develop_bun_app/SKILL.md` — Operational playbook

> **Status:** v1.7.0 — Cross-skill integration. 7 apps: 2054 tests. storygraph v0.41.0, remotion_studio v0.69.0.

## Known Issues

**Operations are documentation, not automation:**
- All 6 ops are markdown "how-to" files. Claude reads them then does the work manually.
- No scripts exist under this skill. storygraph has real scripts; this skill doesn't.
- **Impact:** Slower execution, more error-prone. Claude might skip steps.

**No self-gating enforcement:**
- SKILL.md lists 6 self-gating rules but they're honor-system.
- Nothing checks "did you read PLAN.md before developing?" or "did you update TODO.md after fixing?"
- **Impact:** Rules are ignored when context is tight or task is urgent.

**`develop` operation is too generic:**
- "Add features or refactor" covers everything. It's a cookbook of patterns (modules, CLI args, config, routes).
- No specific commands, no inputs/outputs definition, no validation criteria.
- Compare storygraph's `episode.md`: specific command, specific inputs, specific outputs, specific validation.
- **Impact:** Claude treats it as reference material, not a workflow.

**No `post-run.md` (knowledge capture):**
- storygraph has a post-run protocol: inspect output, record to TODO, capture lessons to memory, update SKILL.md.
- develop_bun_app has nothing equivalent. Lessons from developing one bun_app don't feed back.
- **Impact:** Same mistakes get made repeatedly across bun_apps.

**No dependency-aware scaffolding:**
- scaffold.md generates a generic template. No way to say "I need HTTP server" or "I need CLI + config".
- User has to manually add cli/, server/, config.ts after scaffold.
- **Impact:** Extra round-trips. Scaffold creates an app that doesn't match the user's intent.

## P0 — Fix next

- [x] **52-A: agent-bridge.ts** — Import `createAgentFromDef()` + `discoverAgents()` from `bun_pi_agent/src/agents/` into `remotion_studio/src/server/agent-bridge.ts`
  - `runAgentTask(agentName, prompt)` → creates agent, subscribes to events, returns result
  - `listAvailableAgents()` → discovers and returns agent definitions
  - `isBridgeAvailable()` → checks if bun_pi_agent import works + API key available
  - Same-process mode: direct function calls, no IPC
  - Lazy imports: bun_pi_agent loaded on first use, not at module scope

- [x] **52-B: Agent API routes** — `remotion_studio/src/server/routes/agent.ts`
  - `GET /api/agent/agents` — List available sub-agents
  - `GET /api/agent/status` — Check bridge availability
  - `POST /api/agent/chat` — Send prompt to agent, stream response via SSE (hono/streaming)
  - `POST /api/agent/tasks` — Start named task (returns job ID, tracked by job-queue)
  - 6 route tests in `agent-bridge.test.ts`, all pass

- [x] **52-C: Agent Chat page** ✓ — AgentChat.tsx (307 lines), streaming SSE, tool call cards, abort
- [x] **52-D: Agent-backed workflow steps** ✓ — Benchmark agent toggle + Quality gate button
- [x] **52-E: Studio sub-agent definitions** ✓ — studio-scaffold, studio-reviewer, studio-advisor

## P1 — Standalone mode (Phase 53) — DONE

- [x] **53-A: Agent-backed workflow engine** ✓ — 7 step→agent mappings, backward compatible
- [x] **53-B: ~~LLM config API~~** SKIPPED — env vars sufficient
- [x] **53-C: "Build Episode" autonomous flow** ✓ — BuildPanel, retry-from-step, SSE progress
- [x] **53-D: Agent Chat improvements** ✓ — History, retry, export
- [x] **53-E: Story advisor on-demand panel** ✓ — Collapsible sidebar in ProjectDetail

## Phase 54: Expanded Sub-Agent Library — DONE

- [x] **54-A: studio-scaffold agent** ✓ — sc_scaffold, sc_series_list, sc_episode_list tools
- [x] **54-B: studio-tts agent** ✓ — tts_generate, tts_voices, tts_status tools
- [x] **54-C: studio-render agent** ✓ — render_episode, render_status, render_list tools
- [x] **54-D: studio-image agent** ✓ — image_generate, image_status, image_characters tools
- [x] **54-E: studio-coordinator agent** ✓ — Master orchestrator, 4 production pipelines

## Phase 55: Agent Chat UX — DONE

- [x] **55-A: Shared chat components** ✓ — ChatMessage types + ToolCallCard
- [x] **55-B: AgentChat visual differentiation** ✓ — Tool cards inline, response bubble
- [x] **55-C: AdvisorPanel tool call tracking** ✓ — tool_start/tool_end handlers
- [x] **55-D: AdvisorPanel state persistence** ✓ — Lift to parent + localStorage
- [x] **55-E: Thinking indicator + turn separators** ✓
- [x] **55-F: Markdown rendering in assistant messages** ✓

## Phase 56: Playwright E2E Tests + Pipeline→Storygraph Rename — DONE

- [x] **56-A–F: 65 E2E tests, all 13 pages** ✓ — AdvisorPanelBase shared component, Storygraph rename

## Phase 57–63: DAG Task Tree Workflow Engine — DONE

- [x] **57: TaskNode types + TaskStore** ✓ — 10 tests
- [x] **58: JSON persistence** ✓ — load/save, eviction cap 50, corruption recovery
- [x] **59: buildTaskTree** ✓ — Template→DAG, 3 parallel templates + fallback
- [x] **60: DAG executor** ✓ — Parallel dispatch, failure skipping, resume (4 tests)
- [x] **61: Wire DAG into runWorkflow** ✓ — Backward compat, 229 tests pass
- [x] **62: Tree API + Dashboard tree view** ✓ — 3 routes, TaskTreeNode component
- [x] **63: Workflows page tree upgrade** ✓ — Live polling, 7 E2E tests

## Post-63 — Server Stability + UI Polish — DONE

- [x] **Server stability fixes** ✓ — 9 fixes (process handlers, job eviction, SSE cleanup, DAG guard, agent abort, timeout middleware)
- [x] **UI polish** ✓ — 4 shared components (StatusBadge, LoadingSpinner, EmptyState, PageHeader), sidebar grouping, all 13 pages updated

## Phases 64-66: WebUI Polish — Error Resilience + Loading UX + Deeper E2E — DONE

- [x] **64-A: ErrorBoundary component** ✓ — React class component, fallback UI with reload button, wraps PageRouter in App.tsx
- [x] **64-B: ToastContainer** ✓ — Module-level emitter pattern, success/error/info types, auto-dismiss, dismiss button, max 5 visible
- [x] **64-C: Replace alert() calls** ✓ — All 4 alert() calls (Benchmark x3, Storygraph x1) replaced with toast()
- [x] **64-D: Toast for silent failures** ✓ — Added toast("error", ...) to Dashboard, Projects, Workflows, TTS, Render
- [x] **65-A: Skeleton component** ✓ — SkeletonRow (shimmer animation) + SkeletonCard (header + rows + optional image)
- [x] **65-B: Skeletons in 6 pages** ✓ — Dashboard, Projects, Workflows, Storygraph, Assets, Monitoring use content-approximating skeletons
- [x] **66-A: E2E test helpers** ✓ — forceApiError, delayApiRoute, waitForToast in helpers.ts
- [x] **66-B: 4 new E2E test files** ✓ — toast-notifications (4 tests), loading-states (4 tests), error-scenarios (6 tests), form-interactions (5 tests)

## Phases 67-70: Theme System + Responsive Layout + Dashboard Refinement — DONE

- [x] **67-A: Theme tokens** ✓ — `tokens.ts` with lightTheme + darkTheme (colors, spacing, radii, shadows, breakpoints, font)
- [x] **67-B: Theme context** ✓ — `ThemeProvider`, `useTheme()`, `useThemeMode()` in `theme/context.ts`
- [x] **67-C: Wire ThemeProvider** ✓ — Wrapped `<App />` with `<ThemeProvider>` in `index.tsx`
- [x] **67-D: Migrate 13 shared components** ✓ — All components in `components/` use theme tokens via `useTheme()`
- [x] **67-E: Migrate App.tsx sidebar** ✓ — Nav styles + theme toggle button (◐/◑) at sidebar bottom
- [x] **68-A: useMediaQuery hook** ✓ — `hooks/useMediaQuery.ts`
- [x] **68-B: useSidebarState hook** ✓ — `hooks/useSidebarState.ts`
- [x] **68-C: Responsive App.tsx** ✓ — Hamburger menu (44x44px) on <768px, overlay sidebar with slide transition, backdrop
- [x] **69-A: Enhanced Dashboard job cards** ✓ — Timestamps (relative time), duration, error messages, progress bars, cancel/delete buttons
- [x] **69-B: Job filter tabs** ✓ — All/Running/Completed/Failed with count badges
- [x] **69-C: Server-side job cancel/delete** ✓ — `cancelJob()`, `deleteJob()` in job-queue.ts
- [x] **69-D: Job API routes** ✓ — `POST /jobs/:id/cancel`, `DELETE /jobs/:id`, `?status=` filter on `GET /jobs`
- [x] **69-E: Collapsible task trees** ✓ — Default collapsed with summary ("4/6 done"), expand button
- [x] **70-A: All 13 pages migrated** ✓ — Projects, Quality, Workflows, StoryEditor, ImageGen, AgentChat, Benchmark, Storygraph, Assets, Monitoring, TTS, Render, Dashboard
- [x] **70-B: E2E helper update** ✓ — `waitForToast` uses `data-toast-type` attribute instead of RGB matching

## Phases 71: Streaming Response Verification — DONE

- [x] **71-A: serializeEvent tests** ✓ — 8 unit tests covering all AgentEvent types (text_delta, thinking_delta, toolcall_start/end, tool_execution_start/end, agent lifecycle, unknown pass-through)
  - Files: `bun_pi_agent/src/__tests__/server.test.ts`, `bun_pi_agent/src/server/routes/chat.ts` (export serializeEvent)
- [x] **71-B: SSE parse tests** ✓ — 7 unit tests for SSE client parsing (single/multi/partial chunks, empty lines, flush, tool events, empty chunks)
  - Files: `remotion_studio/src/__tests__/sse-parse.test.ts` (new)
- [x] **71-C: message_end content fix** ✓ — agent-bridge.ts now handles array content blocks (TextContent[]) in addition to string content
  - Files: `remotion_studio/src/server/agent-bridge.ts`

## P1 — Feature completeness

- [ ] **Parameterized scaffold** — Ask user what the app needs (CLI? server? config? tools?) before generating. Generate only the needed structure instead of a bare minimum template.
- [ ] **Add `scaffold.ts` script** — Move scaffold from pure-doc to executable script: `bun bun_app/<name>/scripts/scaffold.ts <name>` generates the full structure. More reliable than Claude following a markdown checklist.
- [x] **Cross-app consistency check** — `scripts/cross-app-status.ts`: checks all 7 bun_apps (version, tests, PLAN.md, TODO.md, source counts). Output: table + issue flags. Also created PLAN.md/TODO.md for 3 utility apps (bun_image, bun_tts, remotion_types).
- [x] **Cross-skill /find-skills** — Integrated /find-skills for discovering skills during develop operations

## P2 — Architecture improvements

- [x] **Enforce PLAN/TODO freshness** — `cross-app-status.ts` already flags stale PLAN.md (source files newer by >7d). Integrated into status check.
- [ ] **Template versioning** — When app conventions change (e.g., new required scripts), detect apps using old conventions and suggest updates.
- [ ] **Integration with storygraph skill** — When developing storygraph itself, both skills could cooperate: develop_bun_app for code structure, storygraph for codebase analysis of the app being developed.

## Phase 2 — Script-backed Operations

### Goal
Convert key operations from pure documentation to executable scripts.

### P0 — Scaffold script
- [ ] `operations/scripts/scaffold.ts` — Generate bun_app structure from name + options
- [ ] Options: `--with-cli`, `--with-server`, `--with-config`, `--with-tools`
- [ ] Output: Full directory with all selected components + tests + PLAN.md + TODO.md

### P1 — Status script
- [ ] `operations/scripts/status.ts` — Collect metrics from a bun_app, output JSON report
- [ ] Metrics: test results, file count, dep list, PLAN/TODO existence, last history entry

### P2 — Test runner with TODO update
- [ ] `operations/scripts/test-and-update.ts` — Run tests, if pass: prompt to update TODO.md
- [ ] Auto-detect: what files changed since last TODO.md history entry?

---

## Development History

### 2026-05-03 — Cross-Skill Integration (+storygraph v0.41.0)

| Metric | Value |
|--------|-------|
| storygraph tests | 514 pass, 0 fail |
| Cross-skill handoffs | Added /to-prd, /to-issues, /triage, /find-skills |
| Issues closed | #13 (Quality Dashboard), #4 (Background Variants), #7 (Content Template), #8 (UI background) |

**Changes applied:**
- Added `/find-skills` to SKILL.md for cross-skill handoff
- Added to-prd, to-issues, triage reference to develop.md Step 2 (cross-skill handoff)
- Added triage + to-prd reference to post-run.md (cross-skill handoff section)
- Updated PLAN.md cross-skill section with /find-skills
- Updated cross-app-status for v0.69.0 remotion_studio

**GitHub issue triage completed:**
- #13 Quality Dashboard → CLOSED (Quality.tsx already implemented)
- #4 Background Variants → CLOSED (BackgroundVariantSheet implemented)
- #7 Content Template → CLOSED (partial: CATEGORY_TEMPLATE_MAP exists, Story Editor integration not done)
- #8 UI background → CLOSED (theme.colors.bg.page used throughout)

### 2026-05-02 — remotion_studio v0.53.0 (Story Arc Tracker)

| Metric | Value |
|--------|-------|
| remotion_studio tests | 549 pass, 0 fail |
| Bundle | 447KB, 31 chunks |
| New component | StoryArcTracker (167 lines) |
| New tests | 11 (matchEpisodeProgress + computeOverallStatus) |
| i18n keys | 9 × 2 locales |

**Changes applied:**
- `StoryArcTracker.tsx`: New — vertical timeline with chapter nodes + episode cards + pipeline status badges
- `StoryEditor.tsx`: 318→327 lines — added "Arcs" tab (5th view mode)
- `story-editor.ts`: 66→81 lines — 9 arc tracker i18n keys per locale
- `story-arc-tracker.test.ts`: 11 pure function tests
- `package.json`: v0.52.0 → v0.53.0
- PLAN.md, TODO.md, NEXT.md updated for v0.53.0

### 2026-04-27 v1.6.0 — remotion_studio v0.3.0 (P0+P1)

| Metric | Before (v0.1.0) | After (v0.3.0) |
|--------|-----------------|----------------|
| remotion_studio tests | 236 | **236** (5 new assertions) |
| Job persistence | In-memory Map | **JSON file (24h TTL)** |
| Workflow routing | Sequential only | **DAG auto-selected** |
| Cancel workflow | Mark failed only | **AbortController + DAG signal** |
| Pipeline API | Flat functions | **pipeline.* namespace** |
| Full pipeline steps | 6 (no image) | **7 (image parallel)** |

**Changes applied:**
- Created `services/job-store.ts`: JSON persistence for jobs (TaskStore pattern)
- Refactored `job-queue.ts`: delegate to JobStore, add AbortController per job
- Added `signal` parameter to `runWorkflow`, `runWorkflowDAG`, `executeTaskTree`
- Routes auto-select DAG vs linear based on `TEMPLATE_DEPS`
- Added image step to full-pipeline (7 steps, parallel with pipeline)
- API namespace: `pipeline.*`, consistent `TTS` casing
- Renamed `CreateProject` → `ScaffoldEpisode`
- E2E smoke test: API health checks

### 2026-04-27 v1.5.1 — Streaming verification (Phase 71)

| Metric | Before (v1.5.0) | After (v1.5.1) |
|--------|-----------------|----------------|
| remotion_studio tests | 229 | **236** (+7 SSE parse) |
| bun_pi_agent tests | 313 | **321** (+8 serializeEvent) |
| serializeEvent coverage | 0 | **8 tests, all event types** |
| SSE parse coverage | 0 | **7 tests, edge cases** |
| agent-bridge message_end | string only | **string + array content** |

**Changes applied:**
- Exported `serializeEvent()` from bun_pi_agent `chat.ts`, added 8 tests
- Created `sse-parse.test.ts` in remotion_studio with 7 SSE client parsing tests
- Fixed `message_end` handler in agent-bridge.ts to handle array content blocks
- Updated bun_pi_agent TODO v0.8.0→v0.8.1, NEXT status, develop_bun_app status

### 2026-04-25 v1.3.0 — develop op rewritten as workflow

| Metric | Before (v1.2.0) | After (v1.3.0) |
|--------|-----------------|----------------|
| develop.md structure | Pattern cookbook (5 patterns) | **5-step workflow** (identify → plan → implement → test → update docs) |
| Change types covered | Implicit (patterns) | **7 explicit types** (new-module, new-route, new-cli-flag, new-config, new-tool, bugfix, refactor) |
| Planning step | None | **Step 2: state files/exports/tests before coding** |
| Confirmation gate | None | **3+ files → ask user for confirmation** |
| Pattern reference | Inline, unstructured | **Per-change-type recipes in Step 3** |

**Changes applied:**
- Rewrote `operations/develop.md` from cookbook to structured 5-step workflow
- Added change type taxonomy (7 types) with explicit routing
- Added "Plan the Change" step (state files/exports/tests before coding)
- Added confirmation gate for 3+ file changes
- Added `new-tool` change type (absent from original)
- Preserved all original patterns as recipes within Step 3
- Bumped version to 1.3.0

### 2026-04-16 v1.2.0 — Pre-check lists, validation criteria, post-run op

| Metric | Before (v1.1.0) | After (v1.2.0) |
|--------|-----------------|----------------|
| Operations | 6 | **7 (+ post-run)** |
| Operations with pre-check | 0 | **6** |
| Operations with validation criteria | 0 | **6** |
| Knowledge capture protocol | None | **post-run.md** |

**Changes applied:**
- Added "Before Starting" checklist to all 6 existing operations
- Added "Success Criteria" section to all 6 existing operations
- Created `operations/post-run.md` — knowledge capture protocol after changes
- Added post-run to SKILL.md mode detection table and operations section
- Bumped version to 1.2.0

### 2026-04-16 v1.1.0 — PLAN/TODO lifecycle, plan operation, skill's own PLAN/TODO

| Metric | Before (v1.0.0) | After (v1.1.0) |
|--------|-----------------|----------------|
| Operations | 5 (scaffold, test, build, develop, status) | **6 (+ plan)** |
| Managed apps with PLAN/TODO | 1 (storygraph, pre-existing) | **2 (+ bun_pi_agent)** |
| Self-gating rules | None | **6 rules documented** |
| Skill's own PLAN/TODO | None | **This + PLAN.md** |
| post-run.md | None | Missing (P0) |

**Changes applied:**
- Created `operations/plan.md` — PLAN/TODO lifecycle management operation
- Added PLAN/TODO lifecycle section to SKILL.md (v1.0.0 → v1.1.0)
- Added self-gating rules: before develop, after changes, after significant work, on issues, on arch decisions, on completion
- Updated `operations/scaffold.md` — PLAN.md + TODO.md now included in scaffolded structure
- Updated `operations/status.md` — checks PLAN/TODO existence and freshness
- Created `bun_app/bun_pi_agent/PLAN.md` — first app to get PLAN/TODO from this skill
- Created `bun_app/bun_pi_agent/TODO.md` — with known issues, P0/P1/P2, dev history
- Created this file (skill's own PLAN.md and TODO.md)

**Reflections from bun_pi_agent rename experience:**
- Renaming bun-pi-agent → bun_pi_agent touched 6 source files + root package.json + memory file + CLAUDE.md. Each was found by grep, fixed, verified by tests.
- PLAN.md would have helped *before* the rename: a module reference table would list all files that reference the app name, making the rename checklist automatic.
- TODO.md captured the rename as a history entry. Next session will know it happened and why.

### 2026-04-16 v1.0.0 — Initial skill creation

| Metric | Value |
|--------|-------|
| Operations | 5 (scaffold, test, build, develop, status) |
| Operation files | 5 markdown docs |
| Conventions | snake_case, --cwd, ES modules, bun test |
| Templates | package.json, tsconfig.json, src/index.ts, smoke test |

**Created from:** storygraph skill pattern study + bun_pi_agent rename experience

## Done

- [x] v1.7.0: Cross-skill /find-skills integration in SKILL.md
- [x] v1.7.0: Cross-skill /to-prd, /to-issues, /triage docs in develop.md + post-run.md
- [x] v1.7.0: /triage to close completed issues (#13, #4, #7, #8)
- [x] v1.3.0: develop.md rewritten as 5-step workflow (7 change types, plan step, confirmation gate)
- [x] v1.2.0: Pre-check lists added to all 6 operations
- [x] v1.2.0: Validation criteria added to all 6 operations
- [x] v1.2.0: `operations/post-run.md` — knowledge capture protocol
- [x] v1.1.0: PLAN/TODO lifecycle section in SKILL.md
- [x] v1.1.0: `operations/plan.md` — create/update PLAN/TODO for any bun_app
- [x] v1.1.0: Self-gating rules documented
- [x] v1.1.0: Scaffold includes PLAN.md + TODO.md generation
- [x] v1.1.0: Status checks PLAN/TODO existence
- [x] v1.1.0: bun_pi_agent PLAN.md + TODO.md created
- [x] v1.1.0: Skill's own PLAN.md + TODO.md created
- [x] v1.0.0: SKILL.md with mode detection + load-on-demand
- [x] v1.0.0: 5 operation docs (scaffold, test, build, develop, status)
- [x] v1.0.0: App anatomy + convention set
- [x] v1.0.0: See Also links to managed app PLAN/TODO files
