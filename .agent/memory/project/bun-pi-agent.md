---
name: bun-pi-agent
description: Coding assistant agent built on pi-agent ecosystem (pi-agent-core, pi-ai, pi-coding-agent) with CLI + HTTP SSE server
type: project
---

# bun-pi-agent

## Overview
A coding assistant backend at `apps/bun-pi-agent/` that uses the `@mariozechner/pi-agent-*` ecosystem. Sits between simple LLM tool calls and full frameworks like OpenClaw.

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

## Commands (from repo root)
- `bun run agent` — CLI mode
- `bun run agent:server` — HTTP server on 127.0.0.1:3456
- `bun run agent:cli` — same as above

## HTTP Endpoints
- `GET /health` — `{"status":"ok"}`
- `POST /chat` — SSE streaming, body: `{"message":"...", "model":"zai/glm-4.6"}`

## Env Vars
- `ZAI_API_KEY` (aliased from `Z_AI_API_KEY` in ~/.zshrc)
- `PI_AGENT_MODEL` (default: `zai/glm-4.6`)
- `PI_AGENT_HOST` (default: `127.0.0.1`)
- `PI_AGENT_PORT` (default: `3456`)
- `PI_AGENT_WORKDIR` (default: cwd)

## Workspace
Default test workspace: `output/pi-workspace/`
