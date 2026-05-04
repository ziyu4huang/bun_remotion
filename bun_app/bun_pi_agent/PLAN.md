# bun_pi_agent — Plan

> Full architecture docs → GitHub issues #15–#17 (PRDs)

## Quick Reference

- **Version:** v0.13.0
- **Tools:** 32 (7 coding, 9 storygraph, 3×4 studio, 1 subagent)
- **Agents:** 13 (see `.agent/agents/`)
- **Tests:** 475 unit + 38 e2e
- **Modes:** ACP stdio (default), CLI readline, HTTP server

## Architecture (one-liners)

- `index.ts` — CLI args → agent resolution → mode dispatch
- `agents/` — AgentDefinition parser + tool registry + factory
- `acp/` — ACP stdio, agent-handler, permissions, session store
- `cli/` — Interactive readline + ANSI renderer
- `server/` — Bun.serve, Router, CORS/rate-limit middleware
- `tools/` — 32 tool factories (storygraph, remotion, scaffold, tts, render, image)
- `skills/` — Skill discovery + hot-reload
- `mcp/` — MCP client + tool wrapper
- `bench/` — GLM5 benchmark (KG + agent suites)
- `conversation-store.ts` — File-backed conversation persistence
- `config.ts` — Env var parsing, `store.ts` — File-backed run store

## Config (key env vars)

| Var | Default |
|-----|---------|
| `PI_AGENT_MODEL` | `zai/glm-5-turbo` |
| `PI_AGENT_PORT` | `3456` |
| `PI_AGENT_WORKDIR` | `process.cwd()` |

## HTTP API

- `GET /health`, `POST /chat` (SSE)
- ACP: `/ping`, `/agents`, `/runs` CRUD
