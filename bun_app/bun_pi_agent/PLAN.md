# bun_pi_agent — Code Plan

> **Cross-linked docs:**
>
> Code folder (this) | Skill folder
> ---|---
> `bun_app/bun_pi_agent/PLAN.md` — **(this file)** Code-level plan, module reference, future work | `.claude/skills/develop_bun_app/SKILL.md` — Operational playbook for all bun_apps
> `bun_app/bun_pi_agent/TODO.md` — Code-level tasks, test status, run history | `.claude/skills/develop_bun_app/operations/` — Operation docs (scaffold, test, build, etc.)
>
> **Rule:** Architecture decisions → this PLAN.md. Task tracking → TODO.md.

## Current State (v0.7.0)

**Working:**
- **ACP stdio mode (default)**: JSON-RPC 2.0 over stdin/stdout using `@agentclientprotocol/sdk` — compatible with Zed, JetBrains, and other ACP editors
- CLI mode: interactive readline with `/quit`, `/clear`, `/model` commands
- Server mode: HTTP SSE with legacy `/chat` + IBM/BeeAI ACP endpoints (`/agents`, `/runs` CRUD)
- Agent creation: multi-provider via pi-ai (`getModel`, `getEnvApiKey`)
- 7 coding tools via pi-coding-agent (read, write, bash, grep, find, ls, edit)
- 9 storygraph tools (sg_pipeline, sg_check, sg_score, sg_status, sg_regression, sg_baseline_update, sg_baseline_list, sg_suggest, sg_health)
- **3 Remotion content tools** (rm_analyze, rm_suggest, rm_lint) — hybrid data strategy (storygraph + src parsing)
- **rm_analyze**: Episode content analysis — dialog, characters, scenes, effects, timing, voice assignments
- **rm_suggest**: Series content suggestions — character gaps, pacing anomalies, gag stagnation
- **rm_lint**: 6 lint rules — naming, staticFile, animation, imports, assets, structure
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
- **Multi-agent definition system** — `.agent/agents/*.md` files define agents with scoped tools, model overrides, custom prompts
- **Agent factory** — `createAgentFromDef()` creates agents with filtered tools + composed prompt
- **Tool registry** — `createToolsByNames()` for name-based tool scoping
- **CLI flags** — `--agent <name>` selects agent, `--list-agents` shows available agents
- **5 predefined agents** — sg-story-advisor (7 tools), sg-quality-gate (9 tools), sg-benchmark-runner (12 tools), rm-content-analyst (5 tools), pi-developer (all tools)
- 283 tests passing across 19 files (20 new remotion-tools tests)

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
index.ts ─── CLI arg parsing → ensurePackageJson() → agent resolution → dynamic import → mode dispatch
    │         ↑ handles --help/--version before any heavy imports
    │         ↑ --agent <name> resolves agent def from .agent/agents/
    │         ↑ --list-agents discovers and prints available agents
    │         ↑ writes package.json next to binary if missing (self-contained)
    │         ↑ default mode: stdio (ACP), --cli for readline, --server for HTTP
    │
    ├─ [agents/]
    │   ├─ types.ts — AgentDefinition interface
    │   ├─ parser.ts — parseAgentDef(), discoverAgents() — .agent/agents/*.md
    │   ├─ tool-registry.ts — name→factory mapping, createToolsByNames(), createAllTools()
    │   ├─ factory.ts — createAgentFromDef(), createDefaultAgent()
    │   └─ index.ts — barrel exports
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
    ├─ agent.ts — createAgent() (delegates to factory), setAgentDefinition()
    ├─ config.ts — getConfig(): env var parsing with defaults
    ├─ store.ts — File-backed run store + token usage accumulation
    ├─ tools/index.ts — 7 coding tools + 9 storygraph tools + 3 remotion tools
    └─ skills/index.ts — Skill discovery + system prompt injection

.agent/agents/               ← Project-level agent definitions
    ├─ sg-story-advisor.md  Creative writing (7 tools: sg_suggest, sg_health, sg_status, rm_analyze, rm_suggest, Read, Grep)
    ├─ sg-quality-gate.md   Quality enforcement (9 tools: sg_pipeline/check/score/regression, baselines, rm_lint, Read, Grep)
    ├─ sg-benchmark-runner.md Autonomous benchmark (12 tools: all sg_* + all rm_*)
    ├─ rm-content-analyst.md Remotion content analysis (5 tools: rm_analyze, rm_suggest, rm_lint, Read, Grep)
    └─ pi-developer.md      Full access (all 20 tools, no model override)
```

## Module Reference

| File | Exports | Lines | Status |
|------|---------|-------|--------|
| `src/index.ts` | CLI arg loop, `ensurePackageJson()`, dynamic imports, help/version, `--agent`, `--list-agents` | ~140 | Updated |
| `src/config.ts` | `AgentConfig`, `getConfig()` | ~35 | Updated |
| `src/agent.ts` | `createAgent()`, `setAgentDefinition()`, `getAgentDefinition()`, `AgentEvent` type | ~35 | Updated |
| `src/agents/types.ts` | `AgentDefinition` type | ~10 | New |
| `src/agents/parser.ts` | `parseAgentDef()`, `discoverAgents()` | ~90 | New |
| `src/agents/tool-registry.ts` | `createToolByName()`, `createToolsByNames()`, `createAllTools()`, `ALL_TOOL_NAMES` | ~70 | New |
| `src/agents/factory.ts` | `createAgentFromDef()`, `createDefaultAgent()` | ~95 | New |
| `src/agents/index.ts` | Barrel exports for agents module | ~5 | New |
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
| `src/tools/remotion-tools.ts` | `createRemotionAnalyzeTool()`, `createRemotionSuggestTool()`, `createRemotionLintTool()`, `createRemotionTools()` | ~400 | New |
| `src/tools/index.ts` | `createTools()` | ~20 | Updated |
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
