# bun_pi_agent — Code Plan

> **Cross-linked docs:**
>
> Code folder (this) | Skill folder
> ---|---
> `bun_app/bun_pi_agent/PLAN.md` — **(this file)** Code-level plan, module reference, future work | `.claude/skills/develop_bun_app/SKILL.md` — Operational playbook for all bun_apps
> `bun_app/bun_pi_agent/TODO.md` — Code-level tasks, test status, run history | `.claude/skills/develop_bun_app/operations/` — Operation docs (scaffold, test, build, etc.)
>
> **Rule:** Architecture decisions → this PLAN.md. Task tracking → TODO.md.

## Current State (v0.2.0)

**Working:**
- CLI mode: interactive readline with `/quit`, `/clear`, `/model` commands
- Server mode: HTTP SSE with legacy `/chat` + ACP endpoints (`/agents`, `/runs` CRUD)
- Agent creation: multi-provider via pi-ai (`getModel`, `getEnvApiKey`)
- 7 coding tools via pi-coding-agent (read, write, bash, grep, find, ls, edit)
- Skill loading: pi-coding-agent defaults + `.claude/skills` + `.agent/skills`
- Run persistence: file-backed JSON store, reloads on server startup
- Token usage tracking: accumulates from turn_end events, exposed via API
- 108 tests passing across 7 test files
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

## Architecture

```
index.ts ─── CLI arg parsing → mode dispatch
    │
    ├─ [cli/index.ts] Interactive readline loop
    │   └─ renderer.ts — ANSI-colored event output
    │
    ├─ [server/index.ts] Bun.serve() with manual routing
    │   │   initStore(runsDir) on startup
    │   └─ routes/
    │       ├─ health.ts — GET /health
    │       ├─ chat.ts   — POST /chat (SSE)
    │       └─ acp.ts    — ACP protocol: /ping, /agents, /runs CRUD
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
| `src/index.ts` | CLI arg loop | ~38 | Stable |
| `src/config.ts` | `AgentConfig`, `getConfig()` | ~30 | Stable |
| `src/agent.ts` | `createAgent()`, `AgentEvent` type | ~49 | Stable |
| `src/cli/index.ts` | `startCli()` | ~80 | Stable |
| `src/cli/renderer.ts` | `renderEvent()` | ~61 | Stable |
| `src/server/index.ts` | `startServer()` | ~106 | Stable |
| `src/server/routes/health.ts` | `handleHealth()` | ~10 | Stable |
| `src/server/routes/chat.ts` | `handleChat()` | ~50 | Stable |
| `src/server/routes/acp.ts` | ACP handlers (6 functions) | ~380 | Stable |
| `src/store.ts` | `initStore`, `getRun`, `setRun`, `saveRun`, `deleteRun`, `listRuns`, `accumulateUsage` | ~130 | New |
| `src/tools/index.ts` | `createTools()` | ~17 | Stable |
| `src/skills/index.ts` | `loadAgentSkills()`, `getSkillsPromptSection()` | ~56 | Stable |
| `scripts/build.ts` | Binary build + asset copy | ~36 | Stable |

## Dependencies

| Package | Purpose |
|---------|---------|
| `@mariozechner/pi-agent-core` | Agent runtime, event system, state management |
| `@mariozechner/pi-ai` | Multi-provider LLM API (z.ai, anthropic, openai, google) |
| `@mariozechner/pi-coding-agent` | Built-in coding tools, skill loading, HTML export |
| `@sinclair/typebox` | JSON schema validation |
| `acp-sdk` | Agent Communication Protocol types |

## Config (Env Vars)

| Var | Default | Purpose |
|-----|---------|---------|
| `PI_AGENT_MODEL` | `zai/glm-5-turbo` | Provider/model string |
| `PI_AGENT_HOST` | `127.0.0.1` | Server host |
| `PI_AGENT_PORT` | `3456` | Server port |
| `PI_AGENT_WORKDIR` | `process.cwd()` | Working directory for tools |
| `PI_AGENT_RUNS_DIR` | `<workdir>/.pi-agent/runs` | Directory for persisted run JSON files |
| `ZAI_API_KEY` | — | z.ai API key (aliased from `Z_AI_API_KEY`) |

## HTTP API

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
