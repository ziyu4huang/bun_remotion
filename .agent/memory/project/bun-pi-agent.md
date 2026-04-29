---
name: bun-pi-agent
description: Coding assistant agent on pi-agent ecosystem — multi-agent, ACP stdio, 32 tools, 13 agent defs, GLM5 benchmark
type: project
---

# bun_pi_agent (v0.10.2)

## Overview
Coding assistant backend at `bun_app/bun_pi_agent/` built on `@mariozechner/pi-agent-*` ecosystem. Three modes: ACP stdio (default), interactive CLI, HTTP SSE server. Multi-agent definition system with 13 scoped agents and 32 tools.

## Architecture
- **pi-agent-core**: Agent runtime, event system, state management
- **pi-ai**: Multi-provider LLM API (z.ai, anthropic, openai, google)
- **pi-coding-agent**: Built-in coding tools (read, write, edit, bash, grep, find, ls)
- **@agentclientprotocol/sdk**: ACP JSON-RPC 2.0 over stdin/stdout

## Modes
1. **ACP stdio** (default): JSON-RPC 2.0 over stdin/stdout, session lifecycle, conversation persistence
2. **CLI**: Interactive readline with `/quit`, `/clear`, `/model` commands
3. **HTTP server**: SSE streaming, legacy `/chat` + IBM/BeeAI ACP endpoints (`/agents`, `/runs` CRUD)

## Tools (32 total, 8 categories)
- 7 coding: Read, Write, Bash, Grep, Find, Ls, Edit
- 9 storygraph: sg_pipeline, sg_check, sg_score, sg_status, sg_regression, sg_baseline_update, sg_baseline_list, sg_suggest, sg_health
- 1 subagent: spawn_task
- 3 remotion content: rm_analyze, rm_suggest, rm_lint
- 3 scaffold: sc_scaffold, sc_series_list, sc_episode_list
- 3 TTS: tts_generate, tts_voices, tts_status
- 3 render: render_episode, render_status, render_list
- 3 image: image_generate, image_status, image_characters

## Agent Definitions (13 in `.agent/agents/`)
- Core: pi-developer (all 32 tools)
- Storygraph: sg-story-advisor (7), sg-quality-gate (9), sg-benchmark-runner (12)
- Remotion: rm-content-analyst (5)
- Studio: studio-scaffold (3), studio-tts (3), studio-render (3), studio-image (3), studio-reviewer (8), studio-advisor (7), studio-coordinator (1)
- Testing: test-reviewer (6)

## Key Features
- Multi-agent definition system: `.agent/agents/*.md` with scoped tools, model overrides, custom prompts
- Agent factory: `createAgentFromDef()` with filtered tools + composed prompt
- Conversation history persistence: auto-save on `agent_end`, resume via `loadSession`
- Token usage tracking: both HTTP (run store) and stdio (session store) modes
- Rate limiting: sliding-window per-IP, configurable
- GLM5 benchmark suite: KG quality + agent coding benchmarks
- Self-contained standalone binary via `bun build --compile`

## Tests
- **430 unit tests** across 27 files (1428 expect() calls)
- **38 e2e tests** across 5 files (93 expect() calls)

## Default Model
`zai/glm-5-turbo` — benchmarked as same quality as glm-5, 4-5x faster

## Commands
- `bun run --cwd bun_app/bun_pi_agent start` — ACP stdio mode (default)
- `bun run --cwd bun_app/bun_pi_agent start --cli` — Interactive CLI mode
- `bun run --cwd bun_app/bun_pi_agent start --server` — HTTP server
- `bun run --cwd bun_app/bun_pi_agent start --agent <name>` — Use specific agent def
- `bun run --cwd bun_app/bun_pi_agent start --list-agents` — List available agents
- `bun run --cwd bun_app/bun_pi_agent test` — Run unit tests
- `bun run --cwd bun_app/bun_pi_agent test:e2e` — Run e2e tests

## HTTP Endpoints
- `GET /health` — `{"status":"ok"}`
- `POST /chat` — SSE streaming, body: `{"message":"..."}`
- ACP: `/ping`, `/agents`, `/agents/:name`, `/runs` (CRUD), `/runs/:id/events`, `/runs/:id/cancel`
- Rate limited (100 req/min default), exempt /health and /ping

## Env Vars
- `Z_AI_API_KEY` — z.ai API key (aliased to `ZAI_API_KEY` in ~/.zshrc)
- `PI_AGENT_MODEL` (default: `zai/glm-5-turbo`)
- `PI_AGENT_HOST` (default: `127.0.0.1`)
- `PI_AGENT_PORT` (default: `3456`)
- `PI_AGENT_WORKDIR` (default: cwd)
- `PI_AGENT_RUNS_DIR`, `PI_AGENT_CONV_DIR` — persistence directories
- `PI_AGENT_RATE_LIMIT_MAX` (100), `PI_AGENT_RATE_LIMIT_WINDOW_MS` (60000)
- `PI_AGENT_BENCH_MAX_TOOL_CALLS` (15), `PI_AGENT_BENCH_MAX_TURNS` (10), `PI_AGENT_BENCH_MODE` ("ai")

## Cross-links
- PLAN: `bun_app/bun_pi_agent/PLAN.md` — Architecture, modules, HTTP API
- TODO: `bun_app/bun_pi_agent/TODO.md` — Tasks, known issues, dev history
