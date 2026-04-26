# Novel Video Generation — Strategic Roadmap

> **Cross-linked docs:**
>
> This file (active phases) | Archive
> ---|---
> `PLAN.md` — Phase 44 spec | `PLAN-archive.md` — Phases 24–43 (complete)
> `TODO.md` — Active tasks | `TODO-archive.md` — Completed tasks
> `NEXT.md` — Entry point (read first) | `REFLECTIONS.md` — Historical session logs
> — | `../storygraph/PLAN.md` — Code architecture
> — | `../../bun_app/bun_pi_agent/PLAN.md` — Agent architecture

---

## Phase 44: Autonomous Storygraph Benchmark in bun_pi_agent

### Problem

The three-tier quality pipeline works but requires claude-code to:
1. Trigger storygraph pipeline runs
2. Interpret gate.json scores and regression deltas
3. Decide whether to update baselines or escalate

Phase 43 proved a GLM5-turbo agent can do structured review (review-agent CLI). Now extend this to the full autonomous chain: **pipeline → regression → review → decision**, all run by bun_pi_agent without claude-code.

### Goal

Build agent tools + skill so bun_pi_agent can autonomously:
1. Run storygraph pipeline on any series
2. Run regression check against stored baselines
3. Parse gate.json, interpret scores, decide PASS/FAIL/ESCALATE
4. Update baselines when explicitly authorized
5. Report structured results (CLI or ACP stdio)

### Architecture

```
bun_pi_agent
├── src/tools/storygraph-tools.ts  ← NEW (Phase 44-A)
│   │  5 agent tools wrapping pipeline-api.ts
│   │  sg_pipeline, sg_check, sg_score, sg_regression, sg_status
│   └── imports: runPipeline, runCheck, runScore, getPipelineStatus
│
├── .agent/skills/storygraph-benchmark.md  ← NEW (Phase 44-B)
│   │  Autonomous benchmark workflow skill
│   └── Steps: discover → pipeline → check → regression → report
│
└── src/review-agent/  ← EXISTS (Phase 43)
    └── Used for Tier 2 review in benchmark chain

Integration chain:
  sg_pipeline → sg_check → sg_regression → review-agent → sg_status
  ↓ gate.json    ↓ scores     ↓ deltas        ↓ review      ↓ summary
```

### Key Design Decisions

1. **Import pipeline-api.ts directly** — Same workspace, no subprocess overhead. Fallback to bash tool if import fails.
2. **Storygraph tools are agent tools** — Not a separate mode. Agent uses its existing bash/read/write tools + new sg_* tools.
3. **Skill is system prompt** — `.agent/skills/storygraph-benchmark.md` gives the agent benchmark-specific knowledge. Agent decides which tools to call.
4. **No new dependencies** — storygraph already exports pipeline-api.ts. Just need workspace import.
5. **CI-ready** — Tools return structured JSON. --ci flag on regression exits 0/1.

### Task Breakdown

| ID | Task | Depends | Lines | Priority |
|----|------|---------|-------|----------|
| 44-A | storygraph-tools.ts (5 tools) | pipeline-api.ts exists | ~200 | P0 |
| 44-B | storygraph-benchmark skill | 44-A | ~80 | P1 |
| 44-C | Baseline management tools | 44-A | ~100 | P2 |
| 44-D | CI integration (--ci exit codes) | 44-B | ~30 | P2 |

### Validation Criteria

- bun_pi_agent can run `sg_pipeline <series>` and get PipelineResult
- bun_pi_agent can run `sg_regression --series my-core-is-boss --threshold 10` and get deltas
- Agent interprets gate.json score ≥70 as PASS without human input
- Review agent (Phase 43) can be called as part of the benchmark chain
- Works in both CLI mode (`bun run start`) and ACP stdio mode (editor integration)

## Phase 45: Web UI Benchmark Page

### Problem

Phase 44 autonomous benchmark tools only work via CLI/agent. No way to trigger benchmarks, view regression status, or manage baselines from the Web UI.

### Goal

Add a Benchmark page to remotion_studio that exposes the autonomous benchmark workflow through the existing Hono + React SPA.

### Implementation

- **Server routes** (`server/routes/benchmark.ts`): 5 REST endpoints
  - `GET /baselines` — list all series with baseline status
  - `POST /run` — full benchmark (pipeline → check → regression → score) as job
  - `POST /check` — quality check only as job
  - `POST /regression` — sync regression check
  - `POST /baseline/:seriesId` — update baseline
- **Frontend** (`pages/Benchmark.tsx`): Series selector, baseline table, full benchmark runner with SSE progress, regression results, baseline management
- **Types** (`shared/types.ts`): `BenchmarkResult`, `BaselineInfo`

### Validation

- API endpoints return correct structured JSON for all paths (no baseline, no gate, regression OK, regression flagged)
- SSE progress streaming works for full benchmark runs
- Baseline update persists correctly

## Phase 47: Multi-Agent Definition System

### Problem

pi-agent is a monolith — all 16 tools always loaded, single system prompt. For specialized tasks:
- **Story advising** needs sg_suggest + sg_health + file reading, but NOT write/bash/edit
- **Quality gating** needs sg_pipeline + sg_check + sg_regression, but NOT creative writing tools
- **Benchmark running** needs all sg_* tools with a specific workflow prompt

Currently all tasks go through the same generic agent. This wastes context tokens on irrelevant tools and dilutes the system prompt.

### Goal

Add `.agent/agents/` support to pi-agent, allowing multiple configured agents with:
1. Scoped tool sets (whitelist)
2. Custom system prompts
3. Model overrides (per-agent)
4. Backward compatible (no `--agent` = current behavior)

Inspired by Claude Code's `.claude/agents/` pattern (markdown + YAML frontmatter).

### Agent Definition Format

Files live in `.agent/agents/*.md` (project-level) or `~/.agent/agents/*.md` (user-level).

```markdown
---
name: sg-story-advisor
description: Story continuity and creative writing advisor for Remotion series
tools: sg_suggest, sg_health, sg_status, Read, Grep, Glob
model: zai/glm-5-turbo
---

You are a story advisor for Remotion video series. Your role is to:

1. Analyze story health using sg_health to identify issues
2. Generate prioritized suggestions using sg_suggest
3. Read narration files and series PLAN.md for context
4. Advise on continuity, character arcs, pacing, and thematic coherence

Always respond in zh_TW when discussing story content.
Focus on actionable suggestions, not just diagnostics.
```

**Frontmatter fields:**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | yes | string | Agent identifier (lowercase + hyphens) |
| `description` | yes | string | When to use this agent (for delegation) |
| `tools` | no | string[] | Tool name whitelist (omit = all tools) |
| `model` | no | string | Provider/model override (e.g. `zai/glm-5`) |
| `skills` | no | string[] | Skill names to load (omit = all skills) |

**Tool name resolution:**

| Name in config | Maps to |
|---------------|---------|
| `Read` | `createReadTool` |
| `Write` | `createWriteTool` |
| `Bash` | `createBashTool` |
| `Grep` | `createGrepTool` |
| `Find` | `createFindTool` |
| `Ls` | `createLsTool` |
| `Edit` | `createEditTool` |
| `sg_pipeline` | `createStorygraphPipelineTool` |
| `sg_check` | `createStorygraphCheckTool` |
| `sg_score` | `createStorygraphScoreTool` |
| `sg_status` | `createStorygraphStatusTool` |
| `sg_regression` | `createStorygraphRegressionTool` |
| `sg_baseline_update` | `createStorygraphBaselineUpdateTool` |
| `sg_baseline_list` | `createStorygraphBaselineListTool` |
| `sg_suggest` | `createStorygraphSuggestTool` |
| `sg_health` | `createStorygraphHealthTool` |

### Architecture

```
bun_pi_agent/src/
├── agents/                          ← NEW
│   ├── types.ts                     AgentDefinition, AgentRegistry types
│   ├── parser.ts                    parseAgentDef(), discoverAgents()
│   ├── factory.ts                   createAgentFromDef() → Agent
│   └── tool-registry.ts             name → factory function mapping
├── agent.ts                         ← MODIFIED: delegates to factory when --agent used
├── tools/index.ts                   ← MODIFIED: createToolsByName(names[]) for scoping
└── index.ts                         ← MODIFIED: --agent <name> and --list-agents flags

.agent/agents/                       ← NEW (project-level)
├── sg-story-advisor.md              Creative writing + story continuity
├── sg-quality-gate.md               Strict quality enforcement
├── sg-benchmark-runner.md           Autonomous benchmark workflow
└── pi-developer.md                  General coding + storygraph (default)
```

### Predefined Agents

| Agent | Tools | Prompt Focus | Model |
|-------|-------|-------------|-------|
| **sg-story-advisor** | sg_suggest, sg_health, sg_status, Read, Grep, Glob | Story continuity, creative suggestions, zh_TW responses | glm-5-turbo |
| **sg-quality-gate** | sg_pipeline, sg_check, sg_score, sg_regression, sg_baseline_update, sg_baseline_list, Read, Grep | Strict quality enforcement, fail-fast, no creative writing | glm-5 |
| **sg-benchmark-runner** | All sg_* tools | Follow benchmark workflow step by step, structured reports | glm-5-turbo |
| **pi-developer** | All 16 tools | Current default behavior (backward compatible) | glm-5-turbo |

### Implementation Steps

| ID | Task | Depends | Lines | Priority |
|----|------|---------|-------|----------|
| 47-A | Agent definition parser (types + parser + discovery) | — | ~80 | P0 |
| 47-B | Agent factory (tool scoping + prompt composition) | 47-A | ~60 | P1 |
| 47-C | CLI `--agent` flag + `--list-agents` | 47-B | ~30 | P2 |
| 47-D | Predefined agent definitions | 47-A | ~80 | P2 |

### Validation

- `bun run pi-agent --list-agents` shows 4 predefined agents
- `bun run pi-agent --agent sg-story-advisor` starts with 6 tools (not 16)
- Agent with unknown tool name in config → skips with warning, doesn't crash
- No `--agent` flag → exact same behavior as before (backward compatible)
- Each agent definition file parses correctly (frontmatter + body)

## Phase 48: Subagent Invocation (spawn_task)

### Problem

Phase 47 gives each agent a focused scope. But there's no way for one agent to *delegate* to another. A pi-developer agent writing an episode should be able to ask the sg-quality-gate agent to run checks and return results, without leaving its own session.

### Goal

Add a `spawn_task` tool that allows an agent to invoke another agent as a subagent:
1. Parent agent calls `spawn_task(agent_name, task_prompt)`
2. Subagent runs with its own tools and prompt
3. Result extracted and returned to parent

### Architecture

```typescript
// spawn_task tool
interface SpawnTaskParams {
  agent_name: string;      // Agent definition to use
  task_prompt: string;     // What to ask the subagent
  max_turns?: number;      // Limit subagent turns (default: 10)
}
```

The tool creates a temporary `Agent` from the definition, runs `agent.prompt(task_prompt)`, collects the response, and returns it as the tool result.

### Implementation

| ID | Task | Depends | Lines |
|----|------|---------|-------|
| 48-A | `spawn_task` tool implementation | Phase 47 | ~80 |
| 48-B | Subagent result extraction | 48-A | ~30 |

### Validation

- pi-developer agent can call `spawn_task("sg-quality-gate", "run full benchmark on my-core-is-boss")`
- Subagent runs with sg-quality-gate's tools only (not pi-developer's full set)
- Result includes subagent's final response text
- Works in CLI and ACP modes
- Error if agent_name doesn't match any definition

## Phase 51: Rename bun_webui → remotion_studio (DONE)

### Problem

`bun_webui` is a generic name that doesn't convey what the app does — a Remotion project builder studio with pipeline orchestration, quality gates, and AI-powered video production.

### Goal

Rename `bun_app/bun_webui/` → `bun_app/remotion_studio/` across the entire codebase. Update all references.

### Scope

| What | Details |
|------|---------|
| Directory | `bun_app/bun_webui/` → `bun_app/remotion_studio/` |
| package.json | name: `bun_webui` → `remotion_studio` |
| Root package.json | workspace entry updated |
| Skill docs | remotion-best-practices PLAN/TODO/NEXT references |
| develop_bun_app PLAN | Managed apps table |
| bun_pi_agent TODO | Cross-references |
| Memory files | project-structure, cdp-browser-policy, cross-skill-roadmap-update |
| Server log | `[bun_webui]` → `[remotion_studio]` |

### Validation

- `bun install` succeeds (workspace resolves correctly)
- `grep -r bun_webui` returns 0 hits in active files
- Archive files retain old name for historical accuracy

## Phase 52: WebUI ↔ pi_agent Bridge API

### Problem

Currently `remotion_studio` (formerly remotion_studio) and `bun_pi_agent` are completely separate — no integration. The WebUI calls storygraph pipeline-api.ts directly via route handlers. The agent has 20 tools and 5 sub-agents but nothing talks to the WebUI.

The user's vision: **remotion_studio becomes the frontend that drives bun_pi_agent**, which orchestrates specialized sub-agents. Only an LLM endpoint needed — no claude-code required.

### Goal

Build a bridge so remotion_studio can send tasks to bun_pi_agent and receive structured results:

1. **Agent Proxy API** — New route group in remotion_studio that spawns pi_agent tasks
2. **Agent Socket/SSE** — Real-time streaming of agent progress to the browser
3. **Agent-backed Workflow Steps** — Replace direct pipeline-api.ts calls with agent delegation

### Architecture

```
remotion_studio (Hono server)
    │
    ├── /api/agent/chat          POST — Send prompt to pi_agent, get streaming response
    ├── /api/agent/tasks         POST — Start a named task (benchmark, review, scaffold)
    ├── /api/agent/tasks/:id     GET  — Get task status + result
    ├── /api/agent/tasks/:id/stream  GET — SSE stream of agent progress
    ├── /api/agent/agents        GET  — List available sub-agents
    │
    └── Internal: bun_pi_agent spawned as child process (ACP stdio mode)
         or: import agent factory directly (same-process, cheaper)

bun_pi_agent
    ├── Sub-agents orchestrated by spawn_task:
    │   ├── sg-quality-gate     ← /api/quality → delegates to this agent
    │   ├── sg-story-advisor    ← /api/pipeline → delegates for story analysis
    │   ├── sg-benchmark-runner ← /api/benchmark → delegates for full benchmark
    │   ├── rm-content-analyst  ← /api/projects → delegates for content analysis
    │   └── pi-developer        ← /api/agent/chat → general coding
    │
    └── All existing tools work unchanged
```

**Two integration modes:**

| Mode | How | Pros | Cons |
|------|-----|------|------|
| **Same-process** | Import `createAgentFromDef()` directly | Fast, no IPC overhead, shared memory | Coupled, one crash kills both |
| **Subprocess** | Spawn `bun_pi_agent --stdio` as child, ACP JSON-RPC | Isolated, can restart independently, language-agnostic | IPC latency, process management |

Start with **same-process** for speed, add subprocess mode later for production resilience.

### Same-Process Integration

```typescript
// remotion_studio/src/server/agent-bridge.ts
import { createAgentFromDef, discoverAgents } from "../../bun_pi_agent/src/agents";
import { loadAgentSkills } from "../../bun_pi_agent/src/skills";

export async function runAgentTask(agentName: string, prompt: string) {
  const agents = await discoverAgents(process.cwd());
  const def = agents.find(a => a.name === agentName);
  if (!def) throw new Error(`Unknown agent: ${agentName}`);

  const agent = createAgentFromDef(def, await loadAgentSkills(process.cwd()));
  const events: AgentEvent[] = [];

  agent.subscribe(event => events.push(event));
  await agent.prompt(prompt);

  return { events, agent };
}
```

### New Sub-Agents for Studio Integration

| Agent | Tools | Studio Page | Purpose |
|-------|-------|-------------|---------|
| **studio-scaffold** | Read, Write, Bash, Grep, Glob | /scaffold | Generate episode scaffolds via agent |
| **studio-reviewer** | sg_pipeline, sg_check, sg_score, rm_analyze, rm_lint, Read, Grep | /quality | Full quality review of a series |
| **studio-advisor** | sg_suggest, sg_health, rm_analyze, rm_suggest, Read, Grep, Glob | /projects | Content suggestions + story analysis |

### Task Breakdown

| ID | Task | Depends | Lines | Priority |
|----|------|---------|-------|----------|
| 52-A | agent-bridge.ts (same-process import + task runner) | Phase 51 (rename) | ~120 | P0 |
| 52-B | Agent API routes (/api/agent/*) | 52-A | ~150 | P0 |
| 52-C | Agent Chat page (React) | 52-B | ~200 | P1 |
| 52-D | Agent-backed workflow steps (replace direct calls) | 52-A | ~100 | P1 |
| 52-E | New studio-* sub-agent definitions | 52-A | ~90 | P2 |

### Validation

- `POST /api/agent/chat` sends prompt, gets streaming response
- `POST /api/agent/tasks` starts named task, `GET /api/agent/tasks/:id` tracks it
- Agent Chat page works in browser with real LLM responses
- Existing pages still work (backward compatible — direct calls not removed yet)

## Phase 53: Standalone Mode (No claude-code)

### Problem

Currently every complex operation (episode creation, pipeline orchestration, quality review) requires claude-code to drive the process. The user wants remotion_studio + bun_pi_agent to be **autonomous** — only needs an LLM endpoint, not a human in the loop or claude-code.

### Goal

Make the remotion_studio self-sufficient:

1. **Agent-driven workflow engine** — Current workflow engine runs shell commands. Replace with agent delegation: each workflow step becomes an agent task.
2. **Autonomous episode builder** — A "Build Episode" button that runs scaffold → pipeline → quality → TTS → render, all via sub-agents, no human intervention.
3. **LLM endpoint configuration** — UI for setting ZAI_API_KEY or other provider keys. No env var required — stored in remotion_studio config.
4. **Story advisor on demand** — Ask the studio-advisor agent questions about any series, get suggestions, apply them.

### Architecture

```
User clicks "Build Episode" in remotion_studio UI
    │
    ▼
Workflow engine creates job with steps:
    │
    ├── Step 1: Scaffold  → spawn_task("studio-scaffold", "scaffold ch4-ep1 for weapon-forger")
    ├── Step 2: Pipeline  → spawn_task("sg-benchmark-runner", "run pipeline on weapon-forger")
    ├── Step 3: Quality   → spawn_task("sg-quality-gate", "check quality for weapon-forger")
    ├── Step 4: TTS       → spawn_task("pi-developer", "generate TTS for weapon-forger/ch4-ep1")
    ├── Step 5: Render    → spawn_task("pi-developer", "render weapon-forger/ch4-ep1")
    └── Step 6: Review    → spawn_task("studio-reviewer", "review weapon-forger ch4-ep1")
    │
    ▼
Each step:
    - Returns structured result
    - Next step checks previous result
    - On failure: report + option to retry or skip
    - All progress streamed to UI via SSE
```

### LLM Config UI

```typescript
// remotion_studio/src/shared/types.ts additions
interface LLMConfig {
  provider: "zai" | "anthropic" | "openai" | "google";
  apiKey: string;           // stored encrypted or in local config
  model: string;            // e.g., "glm-5-turbo"
  baseUrl?: string;         // custom endpoint
}

// Stored in remotion_studio/data/llm-config.json
// UI at /settings page
```

### Task Breakdown

| ID | Task | Depends | Lines | Priority |
|----|------|---------|-------|----------|
| 53-A | Agent-backed workflow engine | Phase 52 | ~200 | P0 |
| ~~53-B~~ | ~~LLM config API + Settings page~~ | ~~Phase 51~~ | — | SKIPPED |
| 53-C | Autonomous "Build Episode" flow | 53-A | ~100 | P1 |
| 53-D | Agent Chat improvements (history, retry) | Phase 52 | ~150 | P2 |
| 53-E | Story advisor on-demand panel | 53-A | ~100 | P2 |

### Validation

- User can configure LLM endpoint entirely through the UI
- "Build Episode" button runs full pipeline without any claude-code involvement
- Each workflow step delegates to the correct sub-agent
- Errors are caught and reported with retry options
- All existing direct-call routes still work (backward compatible)

## Phase 54: Expanded Sub-Agent Library

### Problem

Phase 52-53 establishes the agent bridge but only has 5 agents focused on storygraph + quality. The studio needs agents covering the full video production pipeline.

### Goal

Build out a complete library of specialized sub-agents, each handling one domain of the video production workflow:

| Agent | Domain | Key Capabilities |
|-------|--------|-----------------|
| **studio-scaffold** | Episode creation | Generate episode scaffolds, create PLAN.md, set up file structure |
| **studio-pipeline** | Knowledge graph | Run storygraph pipeline, analyze results, compare with baselines |
| **studio-quality** | Quality assurance | Run quality gate, interpret scores, suggest fixes |
| **studio-reviewer** | Content review | Full episode review, narrative analysis, character consistency |
| **studio-advisor** | Story consulting | Proactive suggestions, story health, pacing analysis |
| **studio-tts** | Voice synthesis | Generate TTS, manage voice assignments, handle multi-character |
| **studio-render** | Video rendering | Render episodes, manage render queue, verify outputs |
| **studio-image** | Asset generation | Character/background image generation, variant management |
| **studio-coordinator** | Orchestration | Master agent that delegates to other agents, full pipeline |

### Implementation

- Each agent: `.agent/agents/studio-*.md` definition + any new tools needed
- studio-coordinator uses `spawn_task` to delegate to other agents
- Model hierarchy: cheap model (glm-5-turbo) for analysis, better model for creative tasks
- All agents respond in zh_TW for story content, en for technical content

### Task Breakdown

| ID | Task | Depends | Lines | Priority |
|----|------|---------|-------|----------|
| 54-A | studio-scaffold agent + scaffold tools | Phase 52 | ~120 | P1 |
| 54-B | studio-tts agent + TTS tools | Phase 52 | ~100 | P1 |
| 54-C | studio-render agent + render tools | Phase 52 | ~80 | P1 |
| 54-D | studio-image agent (wraps existing image API) | Phase 52 | ~60 | P2 |
| 54-E | studio-coordinator agent (orchestration prompt) | 54-A–D | ~80 | P2 |

## Phase 55: Agent Chat UX — Visual Differentiation

### Problem

The current agent chat UIs (both AgentChat page and AdvisorPanel sidebar) treat all events as flat text. Users can't distinguish between:
1. **Chat messages** — the agent's final answer or reasoning
2. **Tool calls** — intermediate operations (sg_suggest, rm_analyze, Read, etc.)
3. **Thinking/reasoning** — the agent's internal deliberation between tool calls

Additionally, AdvisorPanel has critical bugs:
- **No tool call tracking** — only captures `text` events, ignores `tool_start`/`tool_end`
- **Hide Advisor destroys state** — closing the panel unmounts the component, losing all conversation history
- **No persistence** — unlike AgentChat, AdvisorPanel has no localStorage

### Goal

Make the chat experience feel like a professional AI assistant, where users can clearly see what the agent is doing (tools), what it's thinking (reasoning), and what it concludes (response).

### Design: Three Visual Layers

```
┌─────────────────────────────────────────┐
│ You                                     │
│ ┌─────────────────────────────────────┐ │
│ │ What plot holes exist in ch3?       │ │  ← User bubble (blue)
│ └─────────────────────────────────────┘ │
│                                         │
│ Advisor                                 │
│ ┌─ ▶ sg_health ────────────────────┐   │  ← Tool call (collapsible)
│ │  ▶ Analyzing story health...      │   │     border-left accent color
│ │  ✓ Result: 3 warnings found       │   │     icon + name + status
│ └───────────────────────────────────┘   │
│ ┌─ ▶ sg_suggest ───────────────────┐   │  ← Second tool call
│ │  ✓ flat_arc: ch3-ep2 arc flat    │   │
│ └───────────────────────────────────┘   │
│ ┌─────────────────────────────────────┐ │
│ │ Based on analysis, here are the    │   │  ← Response bubble (white)
│ │ key plot holes in chapter 3...     │   │     distinct from tool cards
│ │                                     │   │
│ │ 1. The weapon forging scene...     │   │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Visual Language

| Element | Style | Color | Behavior |
|---------|-------|-------|----------|
| **User message** | Rounded bubble, solid bg | `#e3f2fd` (light blue) | Static |
| **Tool call (running)** | Card with left border accent, spinner | Border `#1976d2`, icon ▶ | Animated |
| **Tool call (success)** | Card, collapsible result | Border `#2e7d32`, icon ✓ | Expandable |
| **Tool call (error)** | Card, collapsible error | Border `#d32f2f`, icon ✗ | Expandable |
| **Agent response** | Rounded bubble, white bg, shadow | `#fff` with `box-shadow` | Streaming |
| **Thinking indicator** | Small italic text, muted | `#999`, `font-style: italic` | Auto-hidden after response |
| **Turn separator** | Thin line between multi-turn | `#e0e0e0` | Subtle |

### Key Behaviors

1. **Tool cards inline** — Tools appear between user message and final response, not after
2. **Streaming response** — Text appears character-by-character while tool cards collapse to summary
3. **Thinking indicator** — Shows "Analyzing..." / "Thinking..." between tool calls, hidden when response starts
4. **Collapsible tools** — Default collapsed (just name + status), click to expand result preview (max 500 chars)
5. **Multi-turn layout** — Each turn is a group: [tools] → [response], visually separated

### AdvisorPanel Fixes

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Hide destroys state | Unmount on `showAdvisor=false` | Lift messages state to parent (`ProjectDetail`) or persist to localStorage |
| No tool tracking | Only listens for `text` events | Add `tool_start`/`tool_end` handlers like AgentChat |
| No persistence | No localStorage | Reuse `HISTORY_KEY` pattern from AgentChat, keyed by `seriesId` |

### Task Breakdown

| ID | Task | Depends | Priority |
|----|------|---------|----------|
| 55-A | Shared `ChatMessage` types + `ToolCallCard` component (extracted from AgentChat) | — | P0 |
| 55-B | AgentChat.tsx: rebuild message rendering with visual differentiation | 55-A | P0 |
| 55-C | AdvisorPanel: add tool call tracking + shared components | 55-A | P0 |
| 55-D | AdvisorPanel: persist state (lift to parent + localStorage) | 55-C | P0 |
| 55-E | Thinking indicator + turn separators in both chat UIs | 55-B | P1 |
| 55-F | Markdown rendering in assistant messages | 55-B | P1 |

### Validation

- AgentChat page: tool calls show as inline cards during streaming, response in separate bubble
- AdvisorPanel: tool calls visible during streaming, not just final text
- AdvisorPanel: Hide/Show preserves conversation history
- Both UIs: clear visual hierarchy between tools, thinking, and response

## Phase 57: TaskNode Types + In-Memory TaskStore

### Problem

The workflow engine uses a flat `WorkflowStepStatus[]` array — no sub-task breakdown, no dependency graph, no resume from arbitrary checkpoint. Agent-backed steps fail silently and restart from scratch.

### Goal

Define a recursive `TaskNode` type hierarchy and in-memory `TaskStore` that can hold task trees. Pure data layer — no execution changes.

### Key Data Structures

```typescript
type TaskStatus = "pending" | "queued" | "running" | "completed" | "failed" | "skipped";
interface TaskNode {
  id: string; parentId: string | null; label: string; kind: string;
  status: TaskStatus; progress: number; deps: string[]; children: string[];
  error?: string; result?: unknown; startedAt?: number; finishedAt?: number;
  metadata?: Record<string, unknown>;
}
interface TaskTree { rootId: string; nodes: Map<string, TaskNode>; createdAt: number; updatedAt: number; }
```

### Task Breakdown

| ID | Task | Depends | Lines | Priority |
|----|------|---------|-------|----------|
| 57-A | TaskNode/TaskTree types in types.ts | — | ~40 | P0 |
| 57-B | TaskStore class (in-memory) | 57-A | ~100 | P0 |
| 57-C | Unit tests (create tree, deps, getReadyTasks) | 57-B | ~60 | P0 |

### Validation

- All existing tests pass unchanged
- `getReadyTasks()` returns correct set for 3-node dependency chain
- `TaskNode` serializes to clean JSON

## Phase 58: JSON Persistence for TaskStore

### Problem

Task trees are in-memory only — lost on server restart. User can't resume builds after crash.

### Goal

Persist `TaskStore` to `data/task-trees.json` using same pattern as `scheduler-service.ts`.

### Task Breakdown

| ID | Task | Depends | Lines | Priority |
|----|------|---------|-------|----------|
| 58-A | loadFromDisk/saveToDisk in TaskStore | Phase 57 | ~50 | P0 |
| 58-B | Eviction policy (cap 50 trees, oldest completed first) | 58-A | ~20 | P1 |
| 58-C | Corruption recovery (try/catch, start fresh) | 58-A | ~15 | P1 |

### Validation

- Kill + restart server → trees persist
- Corrupted JSON → server starts with empty store (no crash)
- Existing workflow API tests still pass

## Phase 59: Template → TaskTree Translator

### Problem

Templates define steps as a flat array. No parallelism is possible — `check` and `score` run sequentially even though they're independent.

### Goal

Pure function converting `WorkflowTemplate` + options into `TaskNode` tree with correct dependency edges enabling parallel execution.

### Dependency Graphs

```
full-pipeline:
  scaffold → pipeline → [check, score] (parallel) → tts → render

quality-gate:
  pipeline → [check, score] (parallel)

image-tts-render:
  [image, tts] (parallel) → render
```

### Task Breakdown

| ID | Task | Depends | Lines | Priority |
|----|------|---------|-------|----------|
| 59-A | buildTaskTree() function in workflow-engine.ts | Phase 57 | ~80 | P0 |
| 59-B | Unit tests for each template's dependency graph | 59-A | ~50 | P0 |

### Validation

- `buildTaskTree("full-pipeline", opts)` → 7 nodes (1 root + 6 steps)
- `check` and `score` share same single dep (`pipeline`), neither depends on the other
- `image-tts-render` → `image` and `tts` have empty deps, `render` depends on both

## Phase 60: DAG Executor

### Problem

No parallel execution — all steps run sequentially. Failed step kills entire workflow with no partial progress.

### Goal

Topological-sort executor that runs ready tasks in parallel, respects dependencies, skips completed tasks on resume.

### Architecture

```typescript
// dag-executor.ts
export async function executeTaskTree(tree, store, options, reportOverall): Promise<TaskTree> {
  // 1. Mark root as "running"
  // 2. Loop: getReadyTasks() → Promise.allSettled → update nodes
  // 3. Failed task → mark transitive dependents as "skipped"
  // 4. Skip already-completed tasks
}
```

### Task Breakdown

| ID | Task | Depends | Lines | Priority |
|----|------|---------|-------|----------|
| 60-A | dag-executor.ts (topological sort + parallel dispatch) | Phase 57, 59 | ~120 | P0 |
| 60-B | Unit tests (parallel timing, failure skipping, resume) | 60-A | ~60 | P0 |

### Validation

- 2 parallel tasks run concurrently (total time = max, not sum)
- Failed task skips downstream but allows sibling branches
- Resuming skips completed tasks

## Phase 61: Wire DAG into Workflow Engine

### Problem

`runWorkflow` uses a for-loop — sequential, no parallelism, no resume.

### Goal

Replace for-loop with `buildTaskTree` + `executeTaskTree`. Backward compatible.

### Task Breakdown

| ID | Task | Depends | Lines | Priority |
|----|------|---------|-------|----------|
| 61-A | Refactor runWorkflow to use buildTaskTree + executeTaskTree | Phase 58, 60 | ~150 | P0 |
| 61-B | retryWorkflow = load tree + reset failed + resume | 61-A | ~40 | P0 |
| 61-C | All existing tests pass (backward compatible) | 61-A | ~20 | P0 |

### Validation

- All existing workflow API tests pass without modification
- `check` + `score` run in parallel (log timestamps confirm)
- Retry from failed step → completed steps stay completed

## Phase 62: Task Tree API + Dashboard View

### Problem

Dashboard shows flat job list — no detail on what sub-tasks are doing. No way to retry individual sub-tasks.

### Goal

Add task tree API endpoints and rebuild Dashboard with collapsible tree view.

### New API Endpoints

```
GET  /api/workflows/:id/tree          → TaskTree (full node map)
GET  /api/workflows/:id/tree/:taskId  → single TaskNode
POST /api/workflows/:id/tree/:taskId/retry → retry specific sub-task
```

### Task Breakdown

| ID | Task | Depends | Lines | Priority |
|----|------|---------|-------|----------|
| 62-A | Tree API routes in workflows.ts | Phase 61 | ~80 | P0 |
| 62-B | TaskTreeNode component (shared) | Phase 61 | ~80 | P0 |
| 62-C | Dashboard rewrite with tree view | 62-A, 62-B | ~150 | P1 |
| 62-D | api.ts client methods for tree endpoints | 62-A | ~30 | P1 |

### Validation

- Dashboard shows tree for running workflow jobs
- Collapse/expand tree nodes works
- Retry button on individual failed tasks triggers `POST /tree/:taskId/retry`
- Non-workflow jobs still show in flat table

## Phase 63: Workflows Page Tree Upgrade

### Problem

Workflows page shows flat step list — parallel branches aren't visible, no per-sub-task detail.

### Goal

Replace flat step progress bars with tree visualization using `TaskTreeNode` component.

### Task Breakdown

| ID | Task | Depends | Lines | Priority |
|----|------|---------|-------|----------|
| 63-A | Workflows.tsx tree view replacing flat step list | Phase 62 | ~150 | P0 |
| 63-B | Live tree polling during execution | 63-A | ~30 | P1 |
| 63-C | Playwright E2E test for tree view | 63-A | ~50 | P1 |

### Validation

- Triggering workflow shows live tree updates
- Parallel branches visually indicated (both running simultaneously)
- Failed task shows inline error + retry button
- E2E test verifies tree loads and nodes are interactive
