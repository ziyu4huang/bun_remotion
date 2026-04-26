# bun_pi_agent — Code TODO

> **Cross-linked docs:**
> - Code PLAN: `bun_app/bun_pi_agent/PLAN.md` — Architecture, modules, HTTP API
> - Code TODO: `bun_app/bun_pi_agent/TODO.md` — **(this file)** Code-level tasks
> - Skill docs: `.claude/skills/develop_bun_app/SKILL.md` — Operational playbook
>
> **Rule:** Architecture decisions → PLAN.md. Task tracking → this file.

> **Status:** v0.7.0 — Remotion content tools (rm_analyze, rm_suggest, rm_lint), 283 tests passing

## Known Issues

**ACP stdio mode:**
- `prompt()` doesn't detect abort properly — need to track cancelled state per session
- No client-side method support (fs, terminal) — agent uses its own tools directly
- No MCP server integration — `mcpServers` param in `session/new` is ignored

**Server (HTTP mode):**
- No `/runs/:id/resume` implementation — returns 501.
- ACP `async` mode still blocks (waits for agent completion) — real impl needs background queue.

**Agent:**
- No conversation history persistence — agent state resets on restart.
- No token usage tracking — can't monitor cost per session.
- Model switching in CLI doesn't validate that new model exists in pi-ai MODELS.

**Skills:**
- Skills loaded from `.claude/skills` and `.agent/skills` but no hot-reload — requires restart.

## P0 — Fix next

- [ ] **ACP cancel detection** — `prompt()` handler needs a per-session cancelled flag that `cancel()` sets, so `prompt()` returns `{ stopReason: "cancelled" }` properly.
- [ ] **Streaming response in chat endpoint** — Verify that `/chat` SSE properly streams text deltas end-to-end (code exists, needs integration test).

## Phase 3 — Autonomous Storygraph Benchmark Agent (DONE)

> bun_pi_agent runs storygraph pipeline + regression autonomously, no claude-code subagent needed.
> Completed as strategic Phases 44-45 (2026-04-25).

### P0 — Core integration
- [x] **3-A1: storygraph-tools.ts** — 5 agent tools (sg_pipeline, sg_check, sg_score, sg_regression, sg_status)
  - Imports pipeline-api.ts directly from storygraph workspace
  - Tests: `src/__tests__/storygraph-tools.test.ts` (10 tests)

- [x] **3-A2: storygraph-benchmark skill** — `.agent/skills/storygraph-benchmark.md`
  - 7-step workflow: discover → status → pipeline → check → regression → score → report
  - Works in both CLI and ACP stdio mode
  - Tests: `src/__tests__/skills.test.ts` (4 tests)

### P1 — Workflow automation
- [x] **3-B1: Automated baseline management**
  - `sg_baseline_update` — saves current gate.json as baseline-gate.json
  - `sg_baseline_list` — discovers series, shows baselines + deltas

- [x] **3-B2: Multi-series regression** — sg_baseline_list discovers all series, reports per-series deltas

### P2 — Advanced
- [ ] **3-C1: Continuous monitoring** — Watch for narration.ts changes, auto-trigger pipeline
- [ ] **3-C2: Model benchmark orchestration** — Run storygraph with multiple models, compare scores
- [x] **3-C3: Web UI integration** — Phase 45: remotion_studio Benchmark page (5 endpoints + React page)

### CI integration
- [x] **CI exit codes + structured JSON** — `src/ci.ts` standalone entry point (pipeline → check → regression → exit 0/1)
  - `sg_regression` tool: `ci: true` parameter returns structured JSON + exitCode

## P1 — Feature completeness

- [ ] **Client-side method support** — When client advertises `fs.readTextFile`/`fs.writeTextFile`, use them instead of agent's own tools.
- [ ] **Permission flow** — Implement `session/request_permission` for destructive tool calls.
- [ ] **MCP server integration** — Connect to MCP servers specified in `session/new` params.
- [ ] **Conversation history** — Persist agent state to disk. Resume previous sessions.
- [ ] **Model validation on switch** — Check that `provider/model` exists in pi-ai MODELS const before applying.
- [ ] **Skill hot-reload** — Watch `.claude/skills/` and `.agent/skills/` for changes. Reload without restart.
- [ ] **Rate limiting** — Add basic rate limiting to HTTP endpoints.

## P2 — Architecture improvements

- [ ] **Router abstraction** — Manual regex routing in server/index.ts is getting long. Extract a simple router: `app.get("/path", handler)`, `app.post("/path", handler)`.
- [ ] **Plugin system** — Allow registering custom tools, routes, and event handlers without modifying core.
- [ ] **Multi-agent support** — Support multiple agent configurations (coding, research, etc.) via ACP agent manifests. ← **Phase 47 done** (agent definitions via .agent/agents/*.md)
- [ ] **Middleware chain** — CORS, auth, logging, rate-limiting as composable middleware.

## Phase 2 — Enhanced Agent Capabilities

### P0 — Core
- [ ] **Streaming output for /chat** — Text deltas should stream immediately, not batch.

### P1 — Quality of Life
- [ ] **Markdown rendering in CLI** — Detect terminal capabilities, render markdown tables/code blocks.
- [ ] **Progress indicators** — Show spinner during tool execution, progress bars for long operations.

### P2 — Advanced
- [ ] **Agent memory** — Cross-session memory: project context, user preferences, past decisions.
- [ ] **Tool approval flow** — Interactive approval for destructive operations (rm, write to non-project files).

---

## Development History

### 2026-04-25 — Remotion content tools (v0.7.0)

| Metric | Before (v0.6.1) | After (v0.7.0) |
|--------|-----------------|----------------|
| Tools | 17 (7 coding + 9 sg + 1 spawn_task) | **20** (+3 rm_*) |
| Agent definitions | 4 | **5** (+rm-content-analyst) |
| Tests | 263 pass | **283 pass** (+20) |
| Test files | 18 | **19** (+remotion-tools.test.ts) |
| expect() calls | 685 | **793** (+108) |

**Changes applied:**
- `src/tools/remotion-tools.ts` — 3 new tools: rm_analyze, rm_suggest, rm_lint
  - rm_analyze: Episode content analysis (dialog, characters, scenes, effects, timing, voices)
  - rm_suggest: Series content suggestions (character gaps, pacing, gag stagnation)
  - rm_lint: Remotion code quality (6 rules: naming, staticFile, animation, imports, assets, structure)
  - Hybrid data strategy: storygraph artifacts first, source parsing fallback
  - Two-pass regex dialog parser for inline `dialogLines[]` arrays
- `src/agents/tool-registry.ts` — Added rm_analyze, rm_suggest, rm_lint to TOOL_FACTORIES
- `src/tools/index.ts` — Added createRemotionTools() spread
- `.agent/agents/rm-content-analyst.md` — New agent (5 tools, zai/glm-5-turbo)
- `.agent/agents/sg-story-advisor.md` — Added rm_analyze, rm_suggest
- `.agent/agents/sg-quality-gate.md` — Added rm_lint
- `.agent/agents/sg-benchmark-runner.md` — Added all 3 rm_* tools
- `src/__tests__/remotion-tools.test.ts` — 20 tests (tools, analyze, suggest, lint)
- Updated tests in tools.test.ts, agents.test.ts, agent.test.ts (count 17→20)

### 2026-04-25 — Agent domain-prefix rename (v0.6.1)

| Metric | Before (v0.6.0) | After (v0.6.1) |
|--------|-----------------|----------------|
| Agent files | story-advisor, quality-gate, benchmark-runner, developer | **sg-story-advisor, sg-quality-gate, sg-benchmark-runner, pi-developer** |
| Tests | 254 pass | **263 pass** (+9 from recent additions) |
| Frontmatter names | Unprefixed | **Domain-prefixed** (sg-*, pi-*) |

**Changes applied:**
- Renamed `.agent/agents/*.md` files with domain prefixes (sg-* for storygraph, pi-* for agent-level)
- Updated `name:` frontmatter fields in all 4 agent files
- Updated `src/tools/spawn-task.ts` description example
- Updated `src/index.ts` help text example
- Updated `src/__tests__/agents.test.ts` test fixture
- Updated `bun_app/bun_pi_agent/PLAN.md` architecture diagram + agent table
- Updated skill-level `PLAN.md` and `TODO.md` references

### 2026-04-25 — Multi-agent definition system (v0.6.0)

| Metric | Before (v0.5.0) | After (v0.6.0) |
|--------|-----------------|----------------|
| Tests | 227 pass | **254 pass** (+27) |
| Test files | 17 | **18** (+agents.test.ts) |
| expect() calls | 616 | **685** |
| Source modules | 18 | **23** (+5 agent modules) |
| Agent definitions | 0 | **4** (story-advisor, quality-gate, benchmark-runner, developer) |
| CLI flags | --cli, --server, --stdio | **+ --agent, --list-agents** |
| Tool scoping | All 16 always loaded | **Per-agent whitelist** |

**Changes applied:**
- `src/agents/types.ts` — AgentDefinition interface (name, description, tools, model, skills, prompt)
- `src/agents/parser.ts` — parseAgentDef(), discoverAgents() — frontmatter + body parsing
- `src/agents/tool-registry.ts` — 16 tool factories, createToolByName(), createToolsByNames(), createAllTools()
- `src/agents/factory.ts` — createAgentFromDef(), createDefaultAgent() — scoped tools + prompt composition
- `src/agents/index.ts` — Barrel exports
- `src/agent.ts` — Refactored to delegate to factory, added setAgentDefinition()/getAgentDefinition()
- `src/config.ts` — Added agentName field (PI_AGENT_NAME env var)
- `src/index.ts` — Added --agent <name>, --list-agents flags, version bumped to 0.6.0
- `.agent/agents/story-advisor.md` — 5 tools, zh_TW story advice
- `.agent/agents/quality-gate.md` — 8 tools, strict quality enforcement
- `.agent/agents/benchmark-runner.md` — 9 tools, autonomous benchmark workflow
- `.agent/agents/developer.md` — all tools, default behavior
- `src/__tests__/agents.test.ts` — 27 tests (parser, discovery, tool-registry, factory, integration)

**Lessons learned:**
- Tool name from pi-coding-agent is "read" not "read_file" — always verify against actual package exports
- Bun test `describe` blocks can't use top-level `await` — use static imports instead
- Using module-level variable (activeDef) in agent.ts is cleaner than globalThis for state injection
- discoverAgents naturally deduplicates by name (first occurrence wins) — project-level agents shadow user-level

### 2026-04-16 — ACP stdio mode migration (v0.5.0)

| Metric | Before (v0.4.1) | After (v0.5.0) |
|--------|-----------------|----------------|
| Tests | 132 pass | **160 pass** (+28) |
| Test files | 8 | **11** (+3 ACP tests) |
| expect() calls | 316 | **377** |
| Source modules | 13 | **18** (+4 ACP modules + acp-demo) |
| Transport modes | 2 (CLI, HTTP) | **3** (+ACP stdio) |
| Default mode | CLI | **ACP stdio** |
| Protocol | REST (IBM/BeeAI) | **JSON-RPC 2.0** (Zed/JetBrains ACP) |

**Changes applied:**
- `src/acp/event-mapper.ts` — Maps pi-agent-core AgentEvent → ACP SessionUpdate (text, thought, tool calls)
- `src/acp/session-store.ts` — In-memory session → agent instance store (CRUD)
- `src/acp/agent-handler.ts` — Implements Agent interface from @agentclientprotocol/sdk (initialize, newSession, prompt, cancel)
- `src/acp/stdio.ts` — Sets up ndJsonStream + AgentSideConnection over stdin/stdout
- `src/acp-demo.ts` — Demo client that spawns agent subprocess, walks through full ACP lifecycle
- `src/index.ts` — Default mode changed to stdio, added --cli/--server flags, version bumped to 0.5.0
- `package.json` — Added @agentclientprotocol/sdk, added acp-demo + test:acp scripts, version 0.5.0
- `src/acp/__tests__/event-mapper.test.ts` — 16 tests for all event mappings
- `src/acp/__tests__/session-store.test.ts` — 8 tests for session CRUD
- `src/acp/__tests__/agent-handler.test.ts` — 4 tests for handler logic

**Lessons learned:**
- `@agentclientprotocol/sdk` (v0.19.0) provides AgentSideConnection + ndJsonStream — handles all JSON-RPC framing
- The IBM/BeeAI `acp-sdk` and the Zed/JetBrains `@agentclientprotocol/sdk` are completely different packages despite sharing "ACP" name
- Default mode must be stdio for editor integration — editors spawn agent without flags

### 2026-04-16 — ACP demo script + dist/demo binary (v0.4.1)

| Metric | Before (v0.4.0) | After (v0.4.1) |
|--------|-----------------|----------------|
| Source modules | 12 | **13** (+demo.ts) |
| Dist binaries | 1 (agent-cli) | **2** (+demo) |
| Build steps | 2 | **3** (+demo compile) |

**Changes applied:**
- `src/demo.ts` — New ACP client demo: walks through all 8 endpoints (ping, agents, sync run, run status, events, stream run, cancel run), colorized output, --host/--port args
- `scripts/build.ts` — Added step 2/3 to compile `src/demo.ts` into `dist/demo` binary
- `package.json` — Added `"demo"` script

**Usage:**
```bash
# Terminal 1: start server
bun run --cwd bun_app/bun_pi_agent server

# Terminal 2: run demo (from source)
bun run --cwd bun_app/bun_pi_agent demo

# Or after build: dist/demo
```

### 2026-04-16 — Run cleanup policy (v0.4.0)

| Metric | Before (v0.3.0) | After (v0.4.0) |
|--------|-----------------|----------------|
| Tests | 124 pass | **132 pass** (+8) |
| expect() calls | 291 | **316** |
| Store exports | 8 | **9** (+cleanupRuns) |
| Config fields | 6 | **8** (+maxRunAge, maxRunCount) |

**Changes applied:**
- `src/config.ts` — Added `maxRunAge` (default 604800 = 7 days) and `maxRunCount` (default 100) to AgentConfig
- `src/store.ts` — New `cleanupRuns()`: age-based removal (deletes runs older than maxAge), count-based removal (deletes oldest when exceeding maxCount). `initStore()` now accepts cleanup opts and auto-runs cleanup after loading. `initStore()` clears in-memory Map on re-init.
- `src/server/index.ts` — Passes cleanup opts from config to `initStore()`
- `src/__tests__/store.test.ts` — 8 new tests: age-based cleanup, count-based cleanup, combined, no-op cases, initStore auto-cleanup, config defaults/custom

**Lessons learned:**
- Module-level `runs` Map in store.ts leaks between test describe blocks — `initStore()` must call `runs.clear()` before `loadFromDisk()` to avoid stale state

### 2026-04-16 — Self-contained binary + binary integration tests (v0.3.0)

| Metric | Before (v0.2.0) | After (v0.3.0) |
|--------|-----------------|----------------|
| Tests | 108 pass | **124 pass** (+16) |
| Test files | 7 | **8** (+binary.test.ts) |
| expect() calls | 254 | **291** |
| Binary self-contained | No (needs package.json) | **Yes** (creates on first run) |
| --version flag | No | **Yes** (-v / --version) |
| Help message | Basic | **Full** (examples, env vars, modes) |

**Changes applied:**
- `src/index.ts` — Rewritten with dynamic imports, `ensurePackageJson()`, `showHelp()`, `--version` flag
- `scripts/build.ts` — Removed manual package.json write (binary creates it automatically)
- `src/__tests__/binary.test.ts` — 16 new integration tests for packaged binary
- Binary now works from any directory without companion files (only needs bun runtime)
- `--version` / `-v` flag prints `bun_pi_agent v0.3.0`
- Help message now includes: mode descriptions, all env vars, ZAI_API_KEY, examples section

**Lessons learned:**
- pi-coding-agent reads `package.json` from `dirname(process.execPath)` at module scope via `getPackageDir()`
- `--help` worked without package.json because static imports are deferred in compiled binaries until the module is actually accessed
- Converting static imports to dynamic imports (`await import()`) allows code to run BEFORE pi-coding-agent loads
- `ensurePackageJson()` writes embedded package.json content to disk before dynamic import triggers pi-coding-agent

### 2026-04-16 — Run persistence + token usage tracking (v0.2.0)

| Metric | Before (v0.1.0) | After (v0.2.0) |
|--------|-----------------|----------------|
| Tests | 93 pass | **108 pass** (+15) |
| Test files | 6 | **7** (+store.test.ts) |
| expect() calls | 217 | **254** |
| Source modules | 11 | **12** (+store.ts) |

**Changes applied:**
- New `src/store.ts` — File-backed run store with `initStore()`, `getRun()`, `setRun()`, `saveRun()`, `listRuns()`, `deleteRun()`
- Token usage tracking via `accumulateUsage()` — accumulates from `turn_end` events
- `GET /runs/:id` now includes `usage` field with input/output/cache tokens + estimated cost
- `POST /runs/:id/cancel` includes usage in response
- Runs persisted as JSON to configurable `PI_AGENT_RUNS_DIR` (default: `<workdir>/.pi-agent/runs/`)
- Runs reload from disk on server startup
- `src/config.ts` — added `runsDir` config option
- `src/server/index.ts` — calls `initStore()` on startup, prints runs directory
- `src/index.ts` — added `PI_AGENT_RUNS_DIR` to help text
- `src/server/routes/acp.ts` — uses store module instead of inline Map

**Lessons learned:**
- pi-agent `AssistantMessage.usage` is on `turn_end` events, not `message_update` or `tool_execution_end`
- Agent doesn't aggregate usage — must accumulate from individual turn_end events
- Store persistence must be resilient — tests call route handlers directly without `startServer()`, so `saveRun` must create directories on the fly

### 2026-04-16 — Renamed from bun-pi-agent to bun_pi_agent

| Metric | Value |
|--------|-------|
| Tests | 93 pass, 0 fail |
| Test files | 6 |
| expect() calls | 217 |
| Duration | 4.77s |

**Changes applied:**
- Directory renamed: `bun_app/bun-pi-agent/` → `bun_app/bun_pi_agent/`
- Package name: `@bun-remotion/bun-pi-agent` → `bun_pi_agent`
- All internal references updated: index.ts, acp.ts, server.test.ts, build.ts, skills/index.ts
- Root package.json agent scripts updated

### 2026-04-16 — Baseline (inherited from bun-pi-agent)

| Metric | Value |
|--------|-------|
| Tests | 93 pass, 0 fail |
| Modules | 11 source files |
| Dependencies | 5 (pi-agent-core, pi-ai, pi-coding-agent, typebox, acp-sdk) |
| HTTP endpoints | 8 (2 legacy + 6 ACP) |
| Tools | 7 (read, write, bash, grep, find, ls, edit) |

## Done

- [x] **Phase 50:** Remotion content tools (rm_analyze, rm_suggest, rm_lint) + rm-content-analyst agent
- [x] 20 new tests (remotion-tools.test.ts: tools, analyze, suggest, lint suites)
- [x] src/tools/remotion-tools.ts — 3 tool factories + dialog parser + 6 lint rules
- [x] rm-content-analyst agent definition (5 tools: rm_analyze, rm_suggest, rm_lint, Read, Grep)
- [x] Updated 3 existing agents with rm_* tools (sg-story-advisor, sg-quality-gate, sg-benchmark-runner)
- [x] Tool count updated: 17→20 across all test files
- [x] **Phase 47:** Multi-agent definition system (types + parser + tool-registry + factory + CLI flags + 4 predefined agents)
- [x] 27 new tests (parser: 6, discovery: 5, tool-registry: 8, factory: 5, integration: 3)
- [x] src/agents/ module (types.ts, parser.ts, tool-registry.ts, factory.ts, index.ts)
- [x] --agent <name> and --list-agents CLI flags
- [x] agent.ts refactored to delegate to factory with setAgentDefinition()
- [x] 4 predefined agent definitions: story-advisor, quality-gate, benchmark-runner, developer
- [x] ACP demo script: src/demo.ts walks all 8 endpoints, compiled to dist/demo binary
- [x] Run cleanup policy: age-based + count-based cleanup on startup (PI_AGENT_MAX_RUN_AGE, PI_AGENT_MAX_RUN_COUNT)
- [x] 8 new cleanup tests (age, count, combined, no-op, initStore auto-cleanup, config)
- [x] Self-contained binary: writes package.json on first run, works without companion files
- [x] --version / -v flag for version display
- [x] Comprehensive help message with examples, env vars, mode descriptions
- [x] 16 binary integration tests (help, version, self-contained, server mode)
- [x] Dynamic imports in index.ts to defer pi-coding-agent loading
- [x] Build script simplified (no package.json write needed)
- [x] Run store persistence: file-backed JSON in configurable PI_AGENT_RUNS_DIR
- [x] Token usage tracking: accumulate from turn_end events, expose via GET /runs/:id
- [x] New src/store.ts module with initStore, getRun, setRun, saveRun, deleteRun
- [x] 15 new tests for store + usage accumulation + config
- [x] Directory rename: bun-pi-agent → bun_pi_agent (snake_case convention)
- [x] Package name: @bun-remotion/bun-pi-agent → bun_pi_agent
- [x] All internal references updated (6 files + root package.json)
- [x] 93 tests verified passing after rename
