# bun_pi_agent — Code Plan

> **Cross-linked docs:**
>
> Code folder (this) | Skill folder
> ---|---
> `bun_app/bun_pi_agent/PLAN.md` — **(this file)** Code-level plan, module reference, future work | `.claude/skills/develop_bun_app/SKILL.md` — Operational playbook for all bun_apps
> `bun_app/bun_pi_agent/TODO.md` — Code-level tasks, test status, run history | `.claude/skills/develop_bun_app/operations/` — Operation docs (scaffold, test, build, etc.)
>
> **Rule:** Architecture decisions → this PLAN.md. Task tracking → TODO.md.

## Current State (v0.5.0)

**Working:**
- **ACP stdio mode (default)**: JSON-RPC 2.0 over stdin/stdout using `@agentclientprotocol/sdk` — compatible with Zed, JetBrains, and other ACP editors
- CLI mode: interactive readline with `/quit`, `/clear`, `/model` commands
- Server mode: HTTP SSE with legacy `/chat` + IBM/BeeAI ACP endpoints (`/agents`, `/runs` CRUD)
- Agent creation: multi-provider via pi-ai (`getModel`, `getEnvApiKey`)
- 7 coding tools via pi-coding-agent (read, write, bash, grep, find, ls, edit)
- Skill loading: pi-coding-agent defaults + `.claude/skills` + `.agent/skills`
- ACP lifecycle: `initialize` → `session/new` → `session/prompt` → `session/cancel`
- Session model: each session gets its own agent instance with independent conversation history
- Event streaming: pi-agent-core events mapped to ACP `session/update` notifications
- Run persistence: file-backed JSON store (HTTP mode only)
- Token usage tracking: accumulates from turn_end events, exposed via API (HTTP mode)
- **Run cleanup policy** — age-based + count-based cleanup on startup via `PI_AGENT_MAX_RUN_AGE` / `PI_AGENT_MAX_RUN_COUNT`
- **Self-contained standalone binary** — only needs bun runtime, creates package.json on first run
- `--version` / `-v` flag for version display
- Comprehensive help with examples, env vars, mode descriptions
- 160 tests passing across 11 files (28 new ACP tests)
- Standalone binary build via `bun build --compile`

**Test Coverage:**
| Module | Tests | Coverage |
|--------|-------|----------|
| config.ts | 11 | Env var parsing, defaults, validation, runsDir |
| tools/index.ts | 10 | Tool creation, uniqueness, all 7 tools present |
| agent.ts | 10 | Agent creation, API key resolution, state, subscribe |
| cli/renderer.ts | ~15 | Event rendering for all AgentEvent types |
| server (all routes) | ~40 | Health, chat SSE, ACP agents/runs lifecycle |
| skills/index.ts | ~9 | Skill loading, formatting, discovery from dirs |
| store.ts | 15 | Persistence, usage accumulation, init/load, cleanup |
| binary (dist/) | 16 | Self-contained, --help, --version, server mode, isolated dir |
| acp/event-mapper | 16 | All AgentEvent → SessionUpdate mappings, tool kind mapping |
| acp/session-store | 8 | CRUD, clear, listing |
| acp/agent-handler | 4 | initialize, newSession, authenticate |

## Architecture

```
index.ts ─── CLI arg parsing → ensurePackageJson() → dynamic import → mode dispatch
    │         ↑ handles --help/--version before any heavy imports
    │         ↑ writes package.json next to binary if missing (self-contained)
    │         ↑ default mode: stdio (ACP), --cli for readline, --server for HTTP
    │
    ├─ [acp/stdio.ts] ACP stdio mode (default) — JSON-RPC 2.0 over stdin/stdout
    │   │   AgentSideConnection + ndJsonStream from @agentclientprotocol/sdk
    │   ├─ agent-handler.ts — implements Agent interface (initialize, newSession, prompt, cancel)
    │   ├─ event-mapper.ts — maps pi-agent-core AgentEvent → ACP SessionUpdate
    │   └─ session-store.ts — in-memory session → agent instance mapping
    │
    ├─ [cli/index.ts] Interactive readline loop
    │   └─ renderer.ts — ANSI-colored event output
    │
    ├─ [server/index.ts] Bun.serve() with manual routing
    │   │   initStore(runsDir) on startup
    │   └─ routes/
    │       ├─ health.ts — GET /health
    │       ├─ chat.ts   — POST /chat (SSE)
    │       └─ acp.ts    — IBM/BeeAI ACP: /ping, /agents, /runs CRUD
    │                       uses store.ts for persistence + usage tracking
    │
    ├─ agent.ts — createAgent(): config → model → tools → skills → Agent
    ├─ config.ts — getConfig(): env var parsing with defaults
    ├─ store.ts — File-backed run store + token usage accumulation
    ├─ tools/index.ts — 7 coding tools from pi-coding-agent
    └─ skills/index.ts — Skill discovery + system prompt injection
```

## Module Reference

| File | Exports | Lines | Status |
|------|---------|-------|--------|
| `src/index.ts` | CLI arg loop, `ensurePackageJson()`, dynamic imports, help/version | ~95 | Updated |
| `src/config.ts` | `AgentConfig`, `getConfig()` | ~30 | Stable |
| `src/agent.ts` | `createAgent()`, `AgentEvent` type | ~49 | Stable |
| `src/cli/index.ts` | `startCli()` | ~80 | Stable |
| `src/cli/renderer.ts` | `renderEvent()` | ~61 | Stable |
| `src/server/index.ts` | `startServer()` | ~106 | Stable |
| `src/server/routes/health.ts` | `handleHealth()` | ~10 | Stable |
| `src/server/routes/chat.ts` | `handleChat()` | ~50 | Stable |
| `src/server/routes/acp.ts` | IBM/BeeAI ACP handlers (6 functions) | ~380 | Stable |
| `src/acp/stdio.ts` | `startStdio()` — ndJsonStream + AgentSideConnection setup | ~50 | New |
| `src/acp/agent-handler.ts` | `createAcpAgentHandler()` — Agent interface impl | ~130 | New |
| `src/acp/event-mapper.ts` | `mapAgentEventToSessionUpdate()` — event translation | ~100 | New |
| `src/acp/session-store.ts` | `createSession`, `getSession`, `deleteSession`, `listSessions` | ~60 | New |
| `src/store.ts` | `initStore`, `getRun`, `setRun`, `saveRun`, `deleteRun`, `listRuns`, `accumulateUsage`, `cleanupRuns` | ~170 | Stable |
| `src/tools/index.ts` | `createTools()` | ~17 | Stable |
| `src/skills/index.ts` | `loadAgentSkills()`, `getSkillsPromptSection()` | ~56 | Stable |
| `src/demo.ts` | IBM/BeeAI HTTP demo client | ~180 | Stable |
| `src/acp-demo.ts` | ACP stdio demo client | ~180 | New |
| `scripts/build.ts` | Binary build + demo binary + optional asset copy | ~40 | Stable |

## Dependencies

| Package | Purpose |
|---------|---------|
| `@agentclientprotocol/sdk` | ACP protocol: AgentSideConnection, ndJsonStream, types |
| `@mariozechner/pi-agent-core` | Agent runtime, event system, state management |
| `@mariozechner/pi-ai` | Multi-provider LLM API (z.ai, anthropic, openai, google) |
| `@mariozechner/pi-coding-agent` | Built-in coding tools, skill loading, HTML export |
| `@sinclair/typebox` | JSON schema validation |
| `acp-sdk` | IBM/BeeAI ACP types (HTTP server mode, to be removed) |

## Config (Env Vars)

| Var | Default | Purpose |
|-----|---------|---------|
| `PI_AGENT_MODEL` | `zai/glm-5-turbo` | Provider/model string |
| `PI_AGENT_HOST` | `127.0.0.1` | Server host |
| `PI_AGENT_PORT` | `3456` | Server port |
| `PI_AGENT_WORKDIR` | `process.cwd()` | Working directory for tools |
| `PI_AGENT_RUNS_DIR` | `<workdir>/.pi-agent/runs` | Directory for persisted run JSON files |
| `PI_AGENT_MAX_RUN_AGE` | `604800` (7 days) | Max run age in seconds; older runs deleted on startup |
| `PI_AGENT_MAX_RUN_COUNT` | `100` | Max persisted runs; oldest removed when exceeded |
| `ZAI_API_KEY` | — | z.ai API key (aliased from `Z_AI_API_KEY`) |

## ACP Protocol (stdio mode)

### Transport
- JSON-RPC 2.0 over stdin/stdout (newline-delimited)
- Agent runs as subprocess of the client (editor)
- stderr used for logging

### Agent Methods (handled by agent)
- `initialize` — protocol version + capability negotiation
- `authenticate` — no-op (API key from env)
- `session/new` — create session with cwd + MCP config
- `session/prompt` — send user prompt, stream updates, return stopReason

### Agent Notifications (handled by agent)
- `session/cancel` — abort current prompt turn

### Agent → Client Notifications
- `session/update` — real-time updates (agent_message_chunk, tool_call, etc.)

### Agent → Client Methods (deferred)
- `session/request_permission` — ask user for tool approval
- `fs/read_text_file`, `fs/write_text_file` — delegate file ops to client
- `terminal/*` — delegate terminal ops to client

## HTTP API (server mode)

### Legacy
- `GET /health` → `{"status":"ok","timestamp":"..."}`
- `POST /chat` → SSE stream, body: `{"message":"..."}`

### ACP
- `GET /ping` → `{}`
- `GET /agents` → `[CODING_AGENT manifest]`
- `GET /agents/:name` → agent manifest
- `POST /runs` → create run (sync/async/stream)
- `GET /runs/:id` → run status + `usage` (token counts + estimated cost)
- `POST /runs/:id/cancel` → cancel run + usage in response
- `GET /runs/:id/events` → run event history
