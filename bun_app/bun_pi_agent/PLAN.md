# bun_pi_agent — Code Plan

> **Cross-linked docs:**
>
> Code folder (this) | Skill folder
> ---|---
> `bun_app/bun_pi_agent/PLAN.md` — **(this file)** Code-level plan, module reference, future work | `.claude/skills/develop_bun_app/SKILL.md` — Operational playbook for all bun_apps
> `bun_app/bun_pi_agent/TODO.md` — Code-level tasks, test status, run history | `.claude/skills/develop_bun_app/operations/` — Operation docs (scaffold, test, build, etc.)
>
> **Rule:** Architecture decisions → this PLAN.md. Task tracking → TODO.md.

## Current State (v0.13.0)

**Working:**
- **ACP stdio mode (default)**: JSON-RPC 2.0 over stdin/stdout using `@agentclientprotocol/sdk`
- CLI mode: interactive readline with `/quit`, `/clear`, `/model` commands (with validation)
- Server mode: HTTP SSE with legacy `/chat` + IBM/BeeAI ACP endpoints (`/agents`, `/runs` CRUD)
- **Rate limiting**: sliding-window per-IP, configurable, exempts /health and /ping
- Agent creation: multi-provider via pi-ai (`getModel`, `getEnvApiKey`)
- **Token usage tracking**: both HTTP (run store) and stdio (session store) modes
- **GLM5 model benchmark suite**: KG quality + agent coding benchmarks (ran 2026-04-28)
  - Result: glm-5-turbo recommended (same quality as glm-5, 4-5x faster)
  - Report: `bench-report.md`
- **GLM5 model benchmark suite**: KG quality + agent coding benchmarks
- **32 tools** in 8 categories:
  - 7 coding (Read, Write, Bash, Grep, Find, Ls, Edit)
  - 9 storygraph (sg_pipeline, sg_check, sg_score, sg_status, sg_regression, sg_baseline_update, sg_baseline_list, sg_suggest, sg_health)
  - 1 subagent (spawn_task)
  - 3 remotion content (rm_analyze, rm_suggest, rm_lint)
  - 3 scaffold (sc_scaffold, sc_series_list, sc_episode_list)
  - 3 TTS (tts_generate, tts_voices, tts_status)
  - 3 render (render_episode, render_status, render_list)
  - 3 image (image_generate, image_status, image_characters)
- **13 agent definitions** in `.agent/agents/`:
  - Core: pi-developer (all tools)
  - Storygraph: sg-story-advisor (7), sg-quality-gate (9), sg-benchmark-runner (12)
  - Remotion: rm-content-analyst (5)
  - Studio: studio-scaffold (3), studio-tts (3), studio-render (3), studio-image (3), studio-reviewer (8), studio-advisor (7), studio-coordinator (1)
  - Testing: test-reviewer (6)
- Skill loading: pi-coding-agent defaults + `.claude/skills` + `.agent/skills`
- ACP lifecycle: `initialize` → `session/new` → `session/prompt` → `session/cancel`
- **Conversation history persistence**: auto-save on `agent_end`, resume via `loadSession`, file-backed store in `data/conversations/`
- Run persistence: file-backed JSON store (HTTP mode)
- Token usage tracking + run cleanup policy
- Self-contained standalone binary via `bun build --compile`
- Multi-agent definition system: `.agent/agents/*.md` with scoped tools, model overrides, custom prompts
- Agent factory: `createAgentFromDef()` creates agents with filtered tools + composed prompt
- CLI: `--agent <name>`, `--list-agents`, `--version` flags
- **400 unit tests across 27 files (1339 expect() calls) + 38 e2e tests across 5 files (93 expect() calls)**
- **Skill hot-reload**: `fs.watch` on `.claude/skills/` and `.agent/skills/`, debounced cache invalidation, new agents pick up changes without restart
- **MCP server integration**: Connect to MCP servers (stdio, HTTP, SSE) from `session/new`, auto-discover tools, wrap as pi-agent AgentTools
- **Permission flow**: `beforeToolCall` hook intercepts Write/Edit/Bash, asks client via ACP `requestPermission`, caches allow_always/reject_always decisions

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
    │   ├─ tool-registry.ts — 32 tool factories, ALL_TOOL_NAMES, createToolsByNames()
    │   ├─ factory.ts — createAgentFromDef(), createDefaultAgent()
    │   └─ index.ts — barrel exports
    │
    ├─ [acp/stdio.ts] ACP stdio mode (default) — JSON-RPC 2.0 over stdin/stdout
    │   ├─ agent-handler.ts — implements Agent interface (initialize, newSession, loadSession, prompt, cancel)
    │   ├─ event-mapper.ts — maps pi-agent-core AgentEvent → ACP SessionUpdate
    │   ├─ permissions.ts — beforeToolCall hook for destructive tool permission flow
    │   └─ session-store.ts — in-memory session → agent instance mapping + conversation persistence
    │
    ├─ [cli/index.ts] Interactive readline loop
    │   └─ renderer.ts — ANSI-colored event output
    │
    ├─ [server/index.ts] Bun.serve() with manual routing
    │   └─ routes/
    │       ├─ health.ts — GET /health
    │       ├─ chat.ts   — POST /chat (SSE)
    │       └─ acp.ts    — IBM/BeeAI ACP: /ping, /agents, /runs CRUD
    │
    ├─ [tools/]
    │   ├─ index.ts — createTools() (re-exports all tool factories)
    │   ├─ storygraph-tools.ts — 9 tools wrapping pipeline-api.ts
    │   ├─ remotion-tools.ts — rm_analyze, rm_suggest, rm_lint
    │   ├─ scaffold-tools.ts — sc_scaffold, sc_series_list, sc_episode_list
    │   ├─ tts-tools.ts — tts_generate, tts_voices, tts_status
    │   ├─ render-tools.ts — render_episode, render_status, render_list
    │   ├─ image-tools.ts — image_generate, image_status, image_characters
    │   └─ spawn-task.ts — subagent invocation
    │
    ├─ agent.ts — createAgent(options?) (delegates to factory), setAgentDefinition(), CreateAgentOptions
    ├─ config.ts — getConfig(): env var parsing with defaults
    ├─ store.ts — File-backed run store + token usage accumulation
    ├─ conversation-store.ts — File-backed conversation history (save/load/list/delete/cleanup)
    ├─ skills/index.ts — Skill discovery + system prompt injection + hot-reload watcher
    ├─ mcp/
    │   ├─ client.ts — MCP client (stdio + HTTP transports, tool discovery)
    │   ├─ tool-wrapper.ts — MCP tool → AgentTool adapter
    │   └─ index.ts — Barrel exports
    └─ bench/
        ├─ glm5-bench.ts — CLI entry: GLM5 model benchmark (KG + agent suites)
        ├─ kg-suite.ts — Suite A: KG quality via graphify-model-bench (AI-only mode for differentiation)
        ├─ agent-suite.ts — Suite B: agent coding benchmark (10 tasks × model, tool call budgets)
        ├─ tasks/coding-tasks.ts — 10 standardized tasks with calibrated scoring
        └─ report.ts — Unified markdown report generator (turn counts, budget, recommendations)

.agent/agents/               ← Agent definitions (13 total)
    ├─ pi-developer.md        Full access (all 32 tools)
    ├─ sg-story-advisor.md    Story advice (7 tools)
    ├─ sg-quality-gate.md     Quality enforcement (9 tools)
    ├─ sg-benchmark-runner.md Autonomous benchmark (12 tools)
    ├─ rm-content-analyst.md  Remotion content analysis (5 tools)
    ├─ studio-scaffold.md     Episode scaffolding (3 tools)
    ├─ studio-tts.md          TTS voice synthesis (3 tools)
    ├─ studio-render.md       Episode rendering (3 tools)
    ├─ studio-image.md        Image generation (3 tools)
    ├─ studio-reviewer.md     Quality review pipeline (8 tools)
    ├─ studio-advisor.md      Story advisory (7 tools)
    ├─ studio-coordinator.md  Master orchestrator (spawn_task only)
    └─ test-reviewer.md       Test results analysis (6 tools)
```

## Module Reference

| File | Exports | Lines | Status |
|------|---------|-------|--------|
| `src/index.ts` | CLI arg loop, `ensurePackageJson()`, dynamic imports, `--agent`, `--list-agents` | ~140 | Updated |
| `src/config.ts` | `AgentConfig`, `getConfig()` | ~35 | Stable |
| `src/agent.ts` | `createAgent(options?)`, `setAgentDefinition()`, `getAgentDefinition()`, `CreateAgentOptions` | ~40 | Updated |
| `src/config.ts` | `AgentConfig`, `getConfig()` | ~42 | Updated |
| `src/conversation-store.ts` | `initConversationStore`, `saveConversation`, `loadConversation`, `listConversations`, `deleteConversation`, `cleanupConversations` | ~130 | New |
| `src/agents/types.ts` | `AgentDefinition` type | ~10 | Stable |
| `src/agents/parser.ts` | `parseAgentDef()`, `discoverAgents()` | ~103 | Stable |
| `src/agents/tool-registry.ts` | `createToolByName()`, `createToolsByNames()`, `createAllTools()`, `ALL_TOOL_NAMES` | ~126 | Updated |
| `src/agents/factory.ts` | `createAgentFromDef()`, `createDefaultAgent()` | ~105 | Stable |
| `src/agents/index.ts` | Barrel exports | ~4 | Stable |
| `src/tools/index.ts` | `createTools()` | ~30 | Updated |
| `src/tools/storygraph-tools.ts` | 9 storygraph tool factories | ~500 | Stable |
| `src/tools/remotion-tools.ts` | `rm_analyze`, `rm_suggest`, `rm_lint` | ~905 | Stable |
| `src/tools/scaffold-tools.ts` | `sc_scaffold`, `sc_series_list`, `sc_episode_list` | ~166 | New |
| `src/tools/tts-tools.ts` | `tts_generate`, `tts_voices`, `tts_status` | ~295 | New |
| `src/tools/render-tools.ts` | `render_episode`, `render_status`, `render_list` | ~283 | New |
| `src/tools/image-tools.ts` | `image_generate`, `image_status`, `image_characters` | ~427 | New |
| `src/tools/spawn-task.ts` | `createSpawnTaskTool()` | ~125 | Stable |
| `src/cli/index.ts` | `startCli()` | ~80 | Stable |
| `src/cli/renderer.ts` | `renderEvent()` | ~61 | Stable |
| `src/server/index.ts` | `startServer()` | ~70 | Updated |
| `src/server/router.ts` | `Router`, `RouteContext`, `RouteHandler`, `Middleware` | ~90 | New |
| `src/server/routes.ts` | `createRouter()` — shared route registration | ~35 | New |
| `src/server/middleware/cors.ts` | `cors()` middleware | ~25 | New |
| `src/server/middleware/rate-limit.ts` | `rateLimit()` middleware | ~25 | New |
| `src/server/routes/health.ts` | `handleHealth()` | ~10 | Stable |
| `src/server/rate-limit.ts` | `RateLimiter` (sliding-window per-IP) | ~50 | Stable |
| `src/server/routes/chat.ts` | `handleChat()` | ~50 | Stable |
| `src/server/routes/acp.ts` | IBM/BeeAI ACP handlers (6 functions) | ~380 | Stable |
| `src/acp/stdio.ts` | `startStdio()` | ~85 | Stable |
| `src/acp/agent-handler.ts` | `createAcpAgentHandler()` | ~230 | Updated |
| `src/acp/permissions.ts` | `createPermissionHook()`, `requiresPermission()`, `clearPermissionCache()` | ~120 | New |
| `src/acp/event-mapper.ts` | `mapAgentEventToSessionUpdate()` | ~118 | Stable |
| `src/acp/session-store.ts` | `createSession`, `getSession`, `deleteSession`, `listSessions`, `saveSessionConversation`, `initSessionStore` | ~110 | Updated |
| `src/store.ts` | `initStore`, `getRun`, `setRun`, `saveRun`, `deleteRun`, `listRuns`, `accumulateUsage`, `cleanupRuns` | ~170 | Stable |
| `src/skills/index.ts` | `loadAgentSkills()`, `getSkillsPromptSection()`, `startSkillsWatcher()`, `stopSkillsWatcher()`, `invalidateSkillsCache()` | ~90 | Updated |
| `src/mcp/client.ts` | `connectMcpServer()`, `McpConnection`, `McpTool`, `McpToolResult` | ~200 | New |
| `src/mcp/tool-wrapper.ts` | `wrapMcpTool()`, `wrapMcpTools()` | ~80 | New |
| `src/demo.ts` | IBM/BeeAI HTTP demo client | ~180 | Stable |
| `src/acp-demo.ts` | ACP stdio demo client | ~180 | Stable |
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
| `bun_image` | Image generation pipeline (workspace dep) |

## Config (Env Vars)

| Var | Default | Purpose |
|-----|---------|---------|
| `PI_AGENT_MODEL` | `zai/glm-5-turbo` | Provider/model string |
| `PI_AGENT_HOST` | `127.0.0.1` | Server host |
| `PI_AGENT_PORT` | `3456` | Server port |
| `PI_AGENT_WORKDIR` | `process.cwd()` | Working directory for tools |
| `PI_AGENT_RUNS_DIR` | `<workdir>/.pi-agent/runs` | Directory for persisted run JSON files |
| `PI_AGENT_MAX_RUN_AGE` | `604800` (7 days) | Max run age in seconds |
| `PI_AGENT_MAX_RUN_COUNT` | `100` | Max persisted runs |
| `PI_AGENT_CONV_DIR` | `<workdir>/.pi-agent/conversations` | Directory for persisted conversations |
| `PI_AGENT_MAX_CONV_AGE` | `2592000` (30 days) | Max conversation age in seconds |
| `PI_AGENT_MAX_CONV_COUNT` | `50` | Max persisted conversations |
| `PI_AGENT_RATE_LIMIT_MAX` | `100` | Max requests per rate-limit window |
| `PI_AGENT_RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window in milliseconds |
| `PI_AGENT_BENCH_MAX_TOOL_CALLS` | `15` | Max tool calls per benchmark task |
| `PI_AGENT_BENCH_MAX_TURNS` | `10` | Max agent turns per benchmark task |
| `PI_AGENT_BENCH_MODE` | `ai` | KG suite mode: regex/ai/hybrid |
| `Z_AI_API_KEY` | — | z.ai API key (pi-ai reads `ZAI_API_KEY`, aliased in shell) |

## GLM5 Benchmark

| Command | Description |
|---------|-------------|
| `bun run --cwd bun_app/bun_pi_agent src/bench/glm5-bench.ts <series-dir>` | Run both suites |
| `... --suite kg` | KG quality only (cheaper) |
| `... --suite agent` | Agent coding only |
| `... --models glm-5,glm-5-turbo,glm-5.1,glm-4.5-air` | Custom model list |
| `... --runs 3` | Multiple KG runs per model |
| `... --output report.md` | Custom output path |

## HTTP API (server mode)

### Legacy
- `GET /health` → `{"status":"ok","timestamp":"..."}`
- `POST /chat` → SSE stream, body: `{"message":"..."}`

### ACP
- `GET /ping` → `{}`
- `GET /agents` → `[CODING_AGENT manifest]`
- `GET /agents/:name` → agent manifest
- `POST /runs` → create run (sync/async/stream)
- `GET /runs/:id` → run status + `usage`
- `POST /runs/:id/cancel` → cancel run + usage
- `GET /runs/:id/events` → run event history
