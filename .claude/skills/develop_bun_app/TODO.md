# /develop_bun_app — Skill TODO

> **Cross-linked docs:**
> - Skill PLAN: `.claude/skills/develop_bun_app/PLAN.md` — Architecture, operations, design decisions
> - Skill TODO: `.claude/skills/develop_bun_app/TODO.md` — **(this file)** Tasks + history
> - Skill SKILL: `.claude/skills/develop_bun_app/SKILL.md` — Operational playbook

> **Status:** v1.3.0 — develop op rewritten as structured workflow (7 change types)

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

- [ ] **52-C: Agent Chat page** — React page for direct agent interaction
  - Agent selector dropdown (lists from `/api/agent/agents`)
  - Chat input with streaming response display
  - Tool call visualization

- [ ] **52-D: Agent-backed workflow steps** — Replace some direct `pipeline-api.ts` calls with agent delegation
  - Benchmark page → uses sg-benchmark-runner agent
  - Quality page → uses sg-quality-gate agent
  - Backward compatible: direct calls still work, agent path is opt-in

- [ ] **52-E: Studio sub-agent definitions** — `.agent/agents/studio-*.md`
  - studio-scaffold: scaffold generation (Read, Write, Bash, Grep, Glob)
  - studio-reviewer: full quality review (sg_pipeline, sg_check, sg_score, rm_analyze, rm_lint, Read, Grep)
  - studio-advisor: content suggestions (sg_suggest, sg_health, rm_analyze, rm_suggest, Read, Grep, Glob)

## P1 — Standalone mode (Phase 53)

- [ ] **53-A: Agent-backed workflow engine** — Workflow steps delegate to sub-agents via spawn_task
  - Each WorkflowStepKind maps to an agent: scaffold→studio-scaffold, pipeline→studio-pipeline, etc.
  - Steps check previous step results before proceeding
  - On failure: report + retry option

- [ ] **53-B: LLM config API + Settings page** — Configure LLM through the UI
  - `remotion_studio/data/llm-config.json` — provider, apiKey, model, baseUrl
  - `GET/POST /api/settings/llm` — API endpoints
  - Settings page with provider selector, key input, model dropdown
  - Config feeds into bun_pi_agent's `getConfig()`

- [ ] **53-C: "Build Episode" autonomous flow** — One-click episode creation
  - UI button on episode detail page
  - Triggers: scaffold → pipeline → quality → TTS → render
  - Each step streams progress to UI

## P2 — Expanded agent library (Phase 54)

- [ ] **54-A: studio-scaffold agent** — Episode scaffolding + PLAN.md generation
- [ ] **54-B: studio-tts agent** — Voice synthesis + voice map management
- [ ] **54-C: studio-render agent** — Episode rendering + queue management
- [ ] **54-D: studio-image agent** — Character/background image generation
- [ ] **54-E: studio-coordinator agent** — Master orchestrator using spawn_task

## P1 — Feature completeness

- [ ] **Parameterized scaffold** — Ask user what the app needs (CLI? server? config? tools?) before generating. Generate only the needed structure instead of a bare minimum template.
- [ ] **Add `scaffold.ts` script** — Move scaffold from pure-doc to executable script: `bun bun_app/<name>/scripts/scaffold.ts <name>` generates the full structure. More reliable than Claude following a markdown checklist.
- [ ] **Cross-app consistency check** — `status` op should compare all bun_apps: do they all have PLAN.md, TODO.md, passing tests? Flag outliers.

## P2 — Architecture improvements

- [ ] **Enforce PLAN/TODO freshness** — When `status` op runs, check: when was PLAN.md last modified vs. how many source files changed since? Flag stale docs.
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
