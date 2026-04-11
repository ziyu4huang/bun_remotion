---
name: bun-pi-agent
description: Coding assistant agent built on pi-agent ecosystem (pi-agent-core, pi-ai, pi-coding-agent) with CLI + HTTP SSE server
type: project
---

# bun-pi-agent

## Overview
A coding assistant backend at `bun_app/bun-pi-agent/` (moved from `apps/`) that uses the `@mariozechner/pi-agent-*` ecosystem. Sits between simple LLM tool calls and full frameworks like OpenClaw.

## Architecture
- **pi-agent-core**: Agent runtime with event system, tool execution, state management
- **pi-ai**: Unified multi-provider LLM API (z.ai, anthropic, openai, google, etc.)
- **pi-coding-agent**: Built-in coding tools (read, write, edit, bash, grep, find, ls)

## Key APIs

### Agent Creation
```typescript
import { Agent } from "@mariozechner/pi-agent-core";
import { getModel, getEnvApiKey } from "@mariozechner/pi-ai";

const model = getModel("zai", "glm-4.6");  // typed: provider + modelId from MODELS const
const agent = new Agent({
  initialState: { systemPrompt, model, tools },
  getApiKey: () => getEnvApiKey("zai"),
});
agent.subscribe((event, signal) => { /* handle events */ });
await agent.prompt("hello");
```

### Tool Creation (from pi-coding-agent)
```typescript
import { createReadTool, createBashTool, createWriteTool, createGrepTool, createFindTool, createLsTool, createEditTool } from "@mariozechner/pi-coding-agent";
// All take (cwd: string, options?) and return AgentTool
const tools = [createReadTool(cwd), createWriteTool(cwd), createBashTool(cwd), ...];
```

### AgentEvent Types
`agent_start`, `agent_end`, `turn_start`, `turn_end`, `message_start`, `message_update` (with `assistantMessageEvent` sub-types: `text_delta`, `thinking_delta`, `toolcall_start/end`), `message_end`, `tool_execution_start/end/update`

### getModel Signature
```typescript
getModel<TProvider extends KnownProvider, TModelId>(provider: TProvider, modelId: TModelId): Model<...>
// Both params are typed — must match MODELS const in models.generated.d.ts
```

### getEnvApiKey
```typescript
getEnvApiKey(provider: KnownProvider): string | undefined
// Maps: "zai" -> ZAI_API_KEY, "anthropic" -> ANTHROPIC_API_KEY, etc.
```

## Available z.ai Models
Provider: `"zai"`, models: `glm-4.5`, `glm-4.5-air`, `glm-4.5-flash`, `glm-4.5v`, `glm-4.6`, `glm-4.6v`, `glm-4.6v-plus`, etc. All use `openai-completions` API with `thinkingFormat: "zai"`.

## Commands
- `bun run --cwd bun_app/bun-pi-agent start` — CLI mode
- `bun run --cwd bun_app/bun-pi-agent server` — HTTP server on 127.0.0.1:3456
- `bun run --cwd bun_app/bun-pi-agent test` — Run all tests

## HTTP Endpoints
- `GET /health` — `{"status":"ok"}`
- `POST /chat` — SSE streaming, body: `{"message":"...", "model":"zai/glm-4.6"}`
- ACP endpoints: `/ping`, `/agents`, `/agents/:name`, `/runs` (CRUD), `/runs/:id/events`, `/runs/:id/cancel`

## Tests (93 total)
- `src/__tests__/config.test.ts` — Config parsing, env var defaults, validation
- `src/__tests__/tools.test.ts` — All 7 tools creation, uniqueness
- `src/__tests__/agent.test.ts` — Agent creation, API key resolution, state (system prompt, model, tools)
- `src/__tests__/renderer.test.ts` — CLI renderer for all AgentEvent types
- `src/__tests__/server.test.ts` — HTTP routes: health, chat SSE, ACP endpoints (agents, runs lifecycle)
- `src/skills/__tests__/skills.test.ts` — Skill loading, formatting, discovery from .claude/skills & .agent/skills

## API Key Mapping (pi-ai)
- `zai` → `ZAI_API_KEY`
- `anthropic` → `ANTHROPIC_OAUTH_TOKEN` | `ANTHROPIC_API_KEY`
- `openai` → `OPENAI_API_KEY`
- `google` → `GEMINI_API_KEY` (not GOOGLE_API_KEY)
- `google-vertex` → `GOOGLE_CLOUD_API_KEY` or ADC

## Env Vars
- `ZAI_API_KEY` (aliased from `Z_AI_API_KEY` in ~/.zshrc)
- `PI_AGENT_MODEL` (default: `zai/glm-4.6`)
- `PI_AGENT_HOST` (default: `127.0.0.1`)
- `PI_AGENT_PORT` (default: `3456`)
- `PI_AGENT_WORKDIR` (default: cwd)

## Workspace
Default test workspace: `output/pi-workspace/`
