# bun_pi_agent — Code TODO

> **Cross-linked docs:**
> - Code PLAN: `bun_app/bun_pi_agent/PLAN.md` — Architecture, modules, HTTP API
> - Code TODO: `bun_app/bun_pi_agent/TODO.md` — **(this file)** Code-level tasks
> - Skill docs: `.claude/skills/develop_bun_app/SKILL.md` — Operational playbook
>
> **Rule:** Architecture decisions → PLAN.md. Task tracking → this file.

> **Status:** v0.13.0 — 32 tools (+ MCP), 13 agents, 475 unit tests (1501 expect()), 38 e2e tests (93 expect())

## Known Issues

**ACP stdio mode:**
- No client-side method support (fs, terminal) — agent uses its own tools directly

**Server (HTTP mode):**
- No `/runs/:id/resume` implementation — returns 501.
- ACP `async` mode still blocks (waits for agent completion) — real impl needs background queue.
- SSE error/timeout events never sent — `closed = true` set before `send()` in chat.ts (fixed v0.9.0).

**Agent:**
- No conversation history persistence — agent state resets on restart.
- No token usage tracking in stdio mode — only HTTP mode tracks usage.
- Model switching in CLI doesn't validate that new model exists in pi-ai MODELS.

**Skills:**
- Skills loaded from `.claude/skills` and `.agent/skills` but no hot-reload — requires restart.

## P0 — Fix next

- [x] **ACP cancel detection** — Per-session `cancelled` flag in SessionState. `cancel()` sets flag + aborts agent. `prompt()` resets per-turn + detects cancelled/AbortError. 5 new tests.
- [x] **Streaming response in chat endpoint** — Exported `serializeEvent`, added 8 unit tests covering all AgentEvent types (text_delta, thinking_delta, toolcall_start/end, tool_execution_start/end, agent_start/end, turn/message lifecycle, unknown pass-through).

## P1 — Feature completeness

- [ ] **Client-side method support** — When client advertises `fs.readTextFile`/`fs.writeTextFile`, use them instead of agent's own tools.
- [x] **Permission flow** — Implement `session/request_permission` for destructive tool calls.
- [x] **MCP server integration** — Connect to MCP servers specified in `session/new` params.
- [x] **Conversation history** — Persist agent state to disk. Resume previous sessions.
- [x] **Model validation on switch** — Check `getModel()` result, show available models on invalid input.
- [x] **Skill hot-reload** — Watch `.claude/skills/` and `.agent/skills/` for changes. Reload without restart.
- [x] **Rate limiting** — Sliding-window per-IP rate limiter, 100 req/min default, exempt /health and /ping.
- [x] **Token usage tracking in stdio mode** — SessionState.usage + accumulateSessionUsage on turn_end events. 4 new tests.

## P1 — GLM5 Benchmark (v0.10.2 baseline)

- [x] **Run GLM5 benchmark end-to-end** — Completed 2026-04-28. Results in `bench-report.md`.
- [x] **Review and refine bench-report.md** — Completed 2026-04-28.
- [x] **Fix kg-suite.ts path bug** — REPO_ROOT off by one, bare model name, bench dir lookup.

### Phase 71: Tool Call Budget (P0) ✅

- [x] **71-A: Tool call budget in agent-suite.ts** — beforeToolCall hook, maxToolCalls=15 default, turnCount tracking, budgetExceeded flag
- [x] **71-B: Continuous efficiency scoring in coding-tasks.ts** — efficiencyScore() decay: ≤2=3, ≤4=2, ≤6=1.5, ≤10=1, ≤15=0.5, >15=0
- [x] **71-C: Report turn counts** — turnCount, toolCallBudget, budgetExceeded in AgentTaskResult + detail section
- [x] **71-D: Tests** — 9 efficiency tests + 3 calibration tests + 3 report tests

### Phase 72: Scoring Calibration Fix (P0) ✅

- [x] **72-A: Expand task1 keywords** — Added 6+ synonyms per category (dialogue/conversation/speaker/segment/sequence etc.)
- [x] **72-B: Fix task2 response scoring** — Keyword quality: mentionsIssue + mentionsCode = 3
- [x] **72-C: Tests** — 6 scoring calibration tests

### Phase 73: Benchmark System Prompt (P1) ✅

- [x] **73-A: Structured bench prompt** — BENCH_SYSTEM_PROMPT with scoring dimensions, efficiency guidelines

### Phase 74: AI-Only KG Suite + New Tasks (P1) ✅

> Suite A hybrid mode: regex dominates, all 4 models identical output.
> Only 5 tasks — insufficient for robust model differentiation.

- [x] **74-A: AI-only mode for Suite A** — Default to `--mode ai` in kg-suite.ts. Added `--mode` flag to graphify-model-bench.ts.
  - File: `src/bench/kg-suite.ts`, `storygraph/src/scripts/graphify-model-bench.ts`
- [x] **74-B: Add 5 new tasks** — File write plan, error diagnosis, cross-file comparison, code generation plan, regression check. Total: 10 tasks.
  - File: `src/bench/tasks/coding-tasks.ts`
- [x] **74-C: Update report for 10 tasks** — Dynamic columns already work.
  - File: `src/bench/report.ts`
- [x] **74-D: Tests** — 17 new scoring tests for tasks 6-10 (30 total in coding-tasks.test.ts)

### Phase 75: Config + Report Polish (P2) ✅

- [x] **75-A: Bench config fields** — Added `benchMaxToolCalls`, `benchMaxTurns`, `benchMode` to config.ts with env vars. Wired into glm5-bench.ts.
  - File: `src/config.ts`, `src/bench/glm5-bench.ts`
- [x] **75-B: Report recommendation section** — Auto-pick best quality, best efficiency, best speed, best value (with budget penalty).
  - File: `src/bench/report.ts`
- [x] **75-C: Tests** — 3 new report recommendation tests + 2 config bench tests. 22 tests across 2 files.
  - File: `src/bench/__tests__/report.test.ts`, `src/__tests__/config.test.ts`

## P2 — Architecture improvements

- [x] **Router abstraction** — Router class with path params, method matching, 404 fallback. `src/server/router.ts`.
- [ ] **Plugin system** — Allow registering custom tools, routes, and event handlers without modifying core.
- [x] **Middleware chain** — CORS + rate-limiting as composable middleware. `src/server/middleware/cors.ts`, `rate-limit.ts`.

## Done

- [x] **Router + middleware** — Router class, CORS/rate-limit middleware, shared routes.ts. 16 new tests. e2e: 38 pass.
- [x] **v0.10.0:** Conversation history persistence (auto-save + resume + file-backed store)
- [x] **v0.9.0:** E2E test suite (38 tests, 93 expect() calls) + SSE error bug fix
- [x] **v0.8.0:** Fixed 3 stale tool-count test failures (29→32), updated PLAN.md, bumped version
- [x] **Phase 54-D:** image-tools.ts — 3 tools (image_generate, image_status, image_characters) + studio-image agent
- [x] **Phase 54-E:** studio-coordinator agent — master orchestrator, 4 production pipelines
- [x] **Phase 54-C:** render-tools.ts — 3 tools (render_episode, render_status, render_list) + studio-render agent
- [x] **Phase 54-B:** tts-tools.ts — 3 tools (tts_generate, tts_voices, tts_status) + studio-tts agent
- [x] **Phase 54-A:** scaffold-tools.ts — 3 tools (sc_scaffold, sc_series_list, sc_episode_list) + studio-scaffold agent
- [x] **Phase 52-E:** studio-reviewer + studio-advisor agent definitions
- [x] **Phase 50:** Remotion content tools (rm_analyze, rm_suggest, rm_lint) + rm-content-analyst agent
- [x] **Phase 47:** Multi-agent definition system (types + parser + tool-registry + factory + CLI flags + 4 predefined agents)
- [x] **Phase 3:** Autonomous Storygraph Benchmark Agent (storygraph tools + benchmark skill + CI integration)
- [x] ACP stdio mode migration (v0.5.0)
- [x] Run persistence + token usage tracking (v0.2.0)
- [x] Self-contained binary + build system (v0.3.0)
- [x] Run cleanup policy (v0.4.0)
- [x] ACP demo script (v0.4.1)

## Development History

### 2026-04-28 — v0.13.0: Permission flow

| Metric | Before (v0.12.0) | After (v0.13.0) |
|--------|-----------------|-----------------|
| Unit tests | 461 pass | **475 pass** (+14 permission tests) |
| expect() calls | 1481 | **1501** (+20) |
| Permission flow | None (all tools execute freely) | **beforeToolCall hook, ACP requestPermission, allow/reject caching** |

**New files:**
- `src/acp/permissions.ts` — `createPermissionHook()` factory, intercepts Write/Edit/Bash, sends ACP `requestPermission` with 4 options (allow_once, allow_always, reject_once, reject_always), caches always decisions per session
- `src/acp/__tests__/permissions.test.ts` — 14 tests: tool classification, allow/reject/cancel flows, always caching, session isolation, failure handling

**Modified:**
- `src/acp/agent-handler.ts` — Stores ACP connection in session state, attaches `beforeToolCall` permission hook on agent creation
- `src/acp/session-store.ts` — `SessionState` holds `acpConnection` reference

### 2026-04-28 — v0.12.0: MCP server integration

| Metric | Before (v0.11.0) | After (v0.12.0) |
|--------|-----------------|-----------------|
| Unit tests | 452 pass | **461 pass** (+10 MCP tests) |
| expect() calls | 1466 | **1481** (+15) |
| MCP support | None (mcpServers ignored) | **stdio + HTTP transports, tool discovery, AgentTool wrapping** |

**New files:**
- `src/mcp/client.ts` — MCP client with stdio (subprocess) and HTTP transports, JSON-RPC 2.0, tool discovery
- `src/mcp/tool-wrapper.ts` — Wraps MCP tools as pi-agent AgentTool instances (prefixed names, schema pass-through, error handling)
- `src/mcp/index.ts` — Barrel exports
- `src/mcp/__tests__/client.test.ts` — 10 tests (wrapping, execution, error handling, empty connections)

**Modified:**
- `src/acp/agent-handler.ts` — `newSession` processes `mcpServers`, connects, wraps tools, adds to agent. `initialize` advertises `mcpCapabilities: { http: true, sse: true }`
- `src/acp/session-store.ts` — `SessionState` holds `mcpConnections[]`
- Version bumped to 0.12.0

### 2026-04-28 — v0.11.0: Skill hot-reload

| Metric | Before (v0.10.2) | After (v0.11.0) |
|--------|-----------------|-----------------|
| Unit tests | 446 pass | **452 pass** (+6 cache tests) |
| expect() calls | 1452 | **1466** (+14) |
| Skills loading | No cache, reload every agent creation | **Cached by cwd, invalidated by fs.watch** |
| Hot-reload | None (required restart) | **fs.watch on .claude/skills + .agent/skills** |

**Changes applied:**
- `skills/index.ts`: Added cwd-aware cache, `startSkillsWatcher()` (fs.watch + debounce), `stopSkillsWatcher()`, `invalidateSkillsCache()`
- `acp/stdio.ts`: Start/stop watcher on process lifecycle
- `server/index.ts`: Start watcher on server startup
- 6 new tests: cache hit, cache bypass on cwd change, cache bypass on skillPaths, invalidation forces reload, watcher on valid dirs, watcher on missing dirs
- Updated SKILL.md, develop_bun_app PLAN.md, memory `bun-pi-agent.md`

### 2026-04-28 — Router + Middleware abstraction

| Metric | Before | After |
|--------|--------|-------|
| server/index.ts | 127 lines (manual routing) | ~70 lines (delegates to Router) |
| test-server.ts | 115 lines (duplicated routing) | ~45 lines (uses shared createRouter) |
| Server tests | 14 | **30** (+16 router + middleware tests) |
| E2E tests | 38 pass | 38 pass (unchanged) |

**New files:**
- `src/server/router.ts` — Router class with path params, middleware chain, fetch()
- `src/server/middleware/cors.ts` — CORS middleware (preflight + header injection)
- `src/server/middleware/rate-limit.ts` — Rate-limit middleware wrapping existing RateLimiter
- `src/server/routes.ts` — Shared createRouter() for production + test servers
- `src/server/__tests__/router.test.ts` — 16 tests (path params, method matching, CORS, rate-limit, middleware ordering)

**Modified:**
- `src/server/index.ts` — Delegates to Router + middleware
- `e2e/helpers/test-server.ts` — Uses shared createRouter(), eliminates 70 lines of duplicated routing

### 2026-04-28 — Phase 75: Bench config + report recommendations

| Metric | Before | After |
|--------|--------|-------|
| Config bench fields | None | **3** (benchMaxToolCalls, benchMaxTurns, benchMode) |
| Report recommendations | 2 (quality, speed) | **4** (quality, efficiency, speed, value + recommended default) |
| Unit tests | 416 | **430** (+14: 5 report + 2 config + 7 scoring) |
| expect() calls | 1414 | **1428** (+14) |

**New files/changes:**
- `config.ts`: Added benchMaxToolCalls (15), benchMaxTurns (10), benchMode ("ai") with env vars
- `glm5-bench.ts`: Reads config for mode + maxToolCalls, passes to suites
- `report.ts`: Enhanced recommendations — best quality/efficiency/speed/value + budget penalty + recommended default
- `report.test.ts`: 3 new recommendation tests (multi-model, budget penalty)
- `config.test.ts`: 2 new bench config tests (defaults + env override)

### 2026-04-28 — Phase 74: AI-only KG suite + 10 benchmark tasks

| Metric | Before | After |
|--------|--------|-------|
| KG suite mode | hybrid (regex dominates) | **ai** (model differentiation) |
| Benchmark tasks | 5 | **10** (+5: file write plan, error diagnosis, cross-file, code gen, regression) |
| Scoring tests | 13 | **30** (+17) |
| expect() calls | 1339 | **1414** (+75) |

**New files/changes:**
- `kg-suite.ts`: Added `mode` option (default `"ai"`), passes `--mode` to graphify-model-bench
- `graphify-model-bench.ts`: Added `--mode` flag (default `"hybrid"`), passes through to pipeline
- `coding-tasks.ts`: Tasks 6-10 already existed; verified and unchanged
- `coding-tasks.test.ts`: 17 new scoring tests covering tasks 6-10

### 2026-04-28 — Phases 71-73: Benchmark improvements (tool budget + scoring + prompt)

| Metric | Before | After |
|--------|--------|-------|
| Tasks | 5 | **10** (+5 new) |
| Efficiency scoring | 3-tier (≤3/≤5/>5) | **Continuous decay** (≤2=3, ...>15=0) |
| Tool call limit | None | **beforeToolCall hook** (max 15) |
| System prompt | 1 sentence | **Structured** (scoring dimensions + guidelines) |
| Task1 response scoring | 3 narrow keywords | **Expanded** (6+ synonyms + fallback) |
| Task2 response scoring | Text length | **Keyword quality** (issue + code) |
| Report | Basic table | **+ efficiency summary, recommendations, budget status** |
| Tests | 7 | **24** (+17) |
| Unit tests total | 399 pass | **416 pass** (+17) |

**New files/changes:**
- `agent-suite.ts`: beforeToolCall budget hook, BENCH_SYSTEM_PROMPT, turnCount tracking
- `coding-tasks.ts`: efficiencyScore() function, 5 new tasks (6-10), expanded keywords
- `report.ts`: AgentTaskResult new fields, model efficiency summary, recommendation section
- Test files updated for new fields and scoring

### 2026-04-28 — v0.10.2: GLM5 benchmark run + env var fix

**Benchmark results** (`bench-report.md`):
- Suite A (KG): All 4 models identical — hybrid mode regex dominates AI contribution
- Suite B (Agent): glm-5/5-turbo/5.1 = 6.8 avg, glm-4.5-air = 6.2 avg
- Key finding: glm-5-turbo is 4-5x faster with identical quality

**Bug fixes:**
- `kg-suite.ts`: REPO_ROOT path off by one (`../../..` → `../../../..` — bench dir was `bun_app/bun_app/`)
- `kg-suite.ts`: Pass bare model names to graphify-model-bench (strip `zai/` prefix)
- `kg-suite.ts`: Read from `storygraph_out_bench/<model>_run0/` instead of restored `storygraph_out/`
- Global: `ZAI_API_KEY` → `Z_AI_API_KEY` across all docs, PLANs, TODOs, memory, help text, tests

### 2026-04-28 — v0.10.2: GLM5 benchmark suite

**New files:**
- `src/bench/glm5-bench.ts` — CLI entry point, orchestrates both suites
- `src/bench/kg-suite.ts` — Suite A: KG quality via graphify-model-bench
- `src/bench/agent-suite.ts` — Suite B: Agent coding benchmark (5 tasks per model)
- `src/bench/tasks/coding-tasks.ts` — 5 standardized tasks with scoring functions
- `src/bench/report.ts` — Unified markdown report generator
- `src/bench/__tests__/report.test.ts` — 4 tests
- `src/bench/__tests__/coding-tasks.test.ts` — 7 tests
- Updated `storygraph/scripts/graphify-model-bench.ts`: defaults to glm-5, glm-5-turbo, glm-5.1

**Models benchmarked:** glm-5, glm-5-turbo, glm-5.1, glm-4.5-air
**Usage:** `bun run --cwd bun_app/bun_pi_agent src/bench/glm5-bench.ts <series-dir>`

### 2026-04-28 — v0.10.2: Build fix, agent smoke tests

**Changes applied:**
- Build pipeline: added `--external` flags for playwright/electron/chromium-bidi (workspace deps not needed by agent)
- Build verified: 65MB binary, all 13 agents work, server health check passes
- Version bumped to 0.10.2 across package.json, index.ts, agent-handler.ts
- New `agent-smoke.test.ts`: 42 tests covering all 13 agent definitions
  - Level 1: Definition parsing (name, description, prompt, tool count, model)
  - Level 2: Tool registry (ALL_TOOL_NAMES=32, createToolsByNames, unknown tool warnings)
  - Level 3: Agent instance creation (requires API key, skipped if absent)

### 2026-04-28 — v0.10.2: Model validation + rate limiting

**Changes applied:**
- CLI `/model` validates via `getModel()` — shows available models on invalid input
- New `server/rate-limit.ts`: sliding-window per-IP rate limiter (RateLimiter class)
- Server fetch: applies rate limiting, exempts /health and /ping
- Config: `rateLimitMax` (default 100), `rateLimitWindowMs` (default 60000) via env vars
- 7 new tests: allow/reject, independent IPs, remaining(), reset(), window sliding

### 2026-04-28 — v0.10.2: Model validation on switch

**Changes applied:**
- CLI `/model` command now validates via `getModel()` — returns `undefined` for unknown models
- On invalid model: shows available model IDs for the given provider
- Removed try/catch (getModel never throws, returns undefined)
- Added format validation: missing provider or model name shows usage hint

### 2026-04-27 — v0.10.1: Token usage tracking in stdio mode

| Metric | Before (v0.10.0) | After (v0.10.1) |
|--------|-----------------|-----------------|
| Unit tests | 336 pass | **340 pass** (+4) |
| expect() calls | 1019 | **1030** (+11) |
| Stdio usage tracking | None | **accumulateSessionUsage on turn_end** |

**Changes applied:**
- Added `usage: TokenUsage` field to `SessionState` (initialized with `EMPTY_USAGE`)
- New `accumulateSessionUsage()` in session-store.ts — delegates to `accumulateUsage()` from store.ts
- agent-handler.ts: calls `accumulateSessionUsage` on `turn_end` events in subscribe callback
- 4 new tests: usage initialized to empty, accumulation across events, ignore non-turn_end, no-op for unknown session

### 2026-04-27 — v0.10.0: Conversation history persistence

| Metric | Before (v0.9.0) | After (v0.10.0) |
|--------|-----------------|-----------------|
| Unit tests | 321 pass | **336 pass** (+15) |
| expect() calls | 982 | **1019** (+37) |
| Conversation persistence | None (lost on restart) | **File-backed, auto-save, resume** |

**Changes applied:**
- Created `conversation-store.ts`: `initConversationStore`, `saveConversation`, `loadConversation`, `listConversations`, `deleteConversation`, `cleanupConversations`
- Storage: `data/conversations/{sessionId}.json` — messages + metadata (agentName, cwd, timestamps)
- Cleanup: configurable TTL (30 days default) + max count (50 default) via `PI_AGENT_MAX_CONV_AGE` / `PI_AGENT_MAX_CONV_COUNT`
- Updated `session-store.ts`: `createSession()` accepts `resumeFromId` option to load history; `saveSessionConversation()` persists current session
- Updated `agent-handler.ts`: auto-saves on `agent_end` event; implements ACP `loadSession` method; `loadSession` capability set to `true`
- Updated `agent.ts` + `factory.ts`: `createAgent(options?)` accepts `initialMessages` to seed agent state
- Updated `config.ts`: added `convDir`, `maxConvAge`, `maxConvCount` config fields
- Initialized conversation store in both stdio (`stdio.ts`) and server (`server/index.ts`) startup
- 12 new conversation-store tests + 3 new session-store tests (resume scenarios)

### 2026-04-27 — v0.9.0: E2E test suite + SSE error bug fix

| Metric | Before (v0.8.1) | After (v0.9.0) |
|--------|-----------------|----------------|
| Unit tests | 321 pass | **321 pass** (unchanged) |
| E2E tests | 0 | **38 pass** |
| expect() calls (unit) | 982 | **982** (unchanged) |
| expect() calls (e2e) | 0 | **93** |
| SSE error bug | error/timeout events silently dropped | **Fixed** |

**Changes applied:**
- **E2E test infrastructure:** `e2e/helpers/mock-agent.ts` (MockAgent with scripted events), `test-server.ts` (start/stop Bun.serve on random port), `sse-client.ts` (SSE stream parser)
- **Agent mock injection:** `setMockAgent()` in agent.ts — in-process mock for HTTP e2e tests; `PI_AGENT_E2E_MOCK=1` env var + `createEnvMockAgent()` for subprocess stdio tests
- **5 e2e test files:**
  - `server-health.e2e.test.ts` — 8 tests: health, ping, agents, CORS, 404s
  - `sse-streaming.e2e.test.ts` — 8 tests: SSE format, event ordering, text concatenation, input validation
  - `acp-runs.e2e.test.ts` — 11 tests: sync/stream runs, read, events, cancel, validation
  - `acp-runs-error.e2e.test.ts` — 7 tests: agent errors, malformed input, concurrent requests
  - `acp-stdio.e2e.test.ts` — 4 tests: subprocess spawn, JSON-RPC handshake, session lifecycle
- **Bug fix:** SSE error/timeout events never sent — `send()` checked `!closed` but `closed` was set to `true` on the line before. Reordered: send first, then set closed.
- Added `test:e2e` script to package.json
- **test-reviewer agent:** `.agent/agents/test-reviewer.md` — uses existing tools (Bash, Read, Grep, Find, Ls, Write) to run tests, parse output, summarize findings, suggest fixes. No new code — pure prompt engineering over existing tools. 13th agent definition.

### 2026-04-27 — v0.8.1: Streaming response verification

| Metric | Before (v0.8.0) | After (v0.8.1) |
|--------|-----------------|----------------|
| serializeEvent tests | 0 | **8** |
| Total tests | 313 | **321** |
| expect() calls | 958 | **982** |

**Changes applied:**
- Exported `serializeEvent()` from `chat.ts` for direct testing
- 8 new tests: text_delta, thinking_delta, toolcall_start, toolcall_end, tool_execution_start/end, agent lifecycle events, unknown type pass-through
- Verified all 10 AgentEvent types from pi-agent-core are serialized correctly
- Confirmed `tool_execution_end.result` is intentionally excluded from SSE output (too large for streaming)

### 2026-04-27 — v0.8.0: Doc sync + ACP cancel detection

| Metric | Before (v0.7.0) | After (v0.8.0) |
|--------|-----------------|----------------|
| Tests | 305 pass, 3 fail | **313 pass, 0 fail** |
| expect() calls | 939 | **958** |
| Tools | 32 (docs said 20) | **32 (docs accurate)** |
| PLAN.md tool count | 20 (stale) | **32 (accurate)** |
| package.json version | 0.5.0 (stale) | **0.8.0** |
| ACP cancel detection | Broken (local var) | **Fixed (per-session flag)** |

**Changes applied:**
- Fixed 3 stale tool-count assertions (29→32) in agents.test.ts and agent.test.ts
- Rewrote PLAN.md: accurate module table, 32 tools, 12 agents, correct line counts
- Bumped package.json version 0.5.0→0.8.0
- **ACP cancel detection fix:**
  - Added `cancelled` field to `SessionState` in session-store.ts
  - `cancel()` sets `state.cancelled = true` + aborts agent + aborts session controller
  - `prompt()` resets turn state at start (fresh AbortController + cancelled=false)
  - `prompt()` catch block checks both `state.cancelled` and `AbortError` name
  - 5 new tests: cancel sets flag, cancel aborts controller, turn reset, AbortError detection, state shape

### 2026-04-26 — Studio tools (scaffold, TTS, render, image)

**Phases 54-A through 54-E added 12 new tools and 7 new agents:**
- scaffold-tools.ts (3 tools), tts-tools.ts (3 tools), render-tools.ts (3 tools), image-tools.ts (3 tools)
- Agent definitions: studio-scaffold, studio-tts, studio-render, studio-image, studio-reviewer, studio-advisor, studio-coordinator
- Tool count: 20→32
- Total agents: 5→12

### 2026-04-25 — Remotion content tools (v0.7.0)

| Metric | Before (v0.6.1) | After (v0.7.0) |
|--------|-----------------|----------------|
| Tools | 17 | **20** (+3 rm_*) |
| Agent definitions | 4 | **5** (+rm-content-analyst) |
| Tests | 263 pass | **283 pass** (+20) |

### 2026-04-25 — Multi-agent definition system (v0.6.0)

- 27 new tests, 4 agent definitions, tool scoping, --agent/--list-agents flags
- Tests: 227→254

### 2026-04-16 — ACP stdio mode migration (v0.5.0)

- 28 new tests, ACP protocol, JSON-RPC 2.0, default mode changed to stdio
- Tests: 132→160

### 2026-04-16 — Baseline (v0.1.0)

- 93 tests, 11 modules, 7 coding tools, 8 HTTP endpoints
