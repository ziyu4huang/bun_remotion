# bun_pi_agent — Code TODO

> **Cross-linked docs:**
> - Code PLAN: `bun_app/bun_pi_agent/PLAN.md` — Architecture, modules, HTTP API
> - Code TODO: `bun_app/bun_pi_agent/TODO.md` — **(this file)** Code-level tasks
> - Skill docs: `.claude/skills/develop_bun_app/SKILL.md` — Operational playbook
>
> **Rule:** Architecture decisions → PLAN.md. Task tracking → this file.

> **Status:** v0.2.0 — Run persistence + token usage tracking, 108 tests passing

## Known Issues

**Server:**
- No `/runs/:id/resume` implementation — returns 501.
- ACP `async` mode still blocks (waits for agent completion) — real impl needs background queue.
- Run persistence is file-based JSON — no cleanup of old runs, directory grows indefinitely.

**Agent:**
- No conversation history persistence — agent state resets on restart.
- No token usage tracking — can't monitor cost per session.
- Model switching in CLI doesn't validate that new model exists in pi-ai MODELS.

**Skills:**
- Skills loaded from `.claude/skills` and `.agent/skills` but no hot-reload — requires restart.

## P0 — Fix next

- [ ] **Run cleanup policy** — Add max age or max count for persisted runs. Clean up on startup or via endpoint.
- [ ] **Streaming response in chat endpoint** — The `/chat` SSE endpoint should stream text deltas, not wait for full completion.

## P1 — Feature completeness

- [ ] **Conversation history** — Persist agent state to disk. Resume previous sessions.
- [ ] **Model validation on switch** — Check that `provider/model` exists in pi-ai MODELS const before applying.
- [ ] **Skill hot-reload** — Watch `.claude/skills/` and `.agent/skills/` for changes. Reload without restart.
- [ ] **Rate limiting** — Add basic rate limiting to HTTP endpoints.

## P2 — Architecture improvements

- [ ] **Router abstraction** — Manual regex routing in server/index.ts is getting long. Extract a simple router: `app.get("/path", handler)`, `app.post("/path", handler)`.
- [ ] **Plugin system** — Allow registering custom tools, routes, and event handlers without modifying core.
- [ ] **Multi-agent support** — Support multiple agent configurations (coding, research, etc.) via ACP agent manifests.
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

- [x] Run store persistence: file-backed JSON in configurable PI_AGENT_RUNS_DIR
- [x] Token usage tracking: accumulate from turn_end events, expose via GET /runs/:id
- [x] New src/store.ts module with initStore, getRun, setRun, saveRun, deleteRun
- [x] 15 new tests for store + usage accumulation + config
- [x] Directory rename: bun-pi-agent → bun_pi_agent (snake_case convention)
- [x] Package name: @bun-remotion/bun-pi-agent → bun_pi_agent
- [x] All internal references updated (6 files + root package.json)
- [x] 93 tests verified passing after rename
