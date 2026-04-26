import { resolve } from "node:path";
import type { AgentDefinition } from "../../../bun_pi_agent/src/agents/types.js";
import type { AgentEvent } from "../../../bun_pi_agent/src/agent.js";
import type { AgentInfo, AgentTaskResult, AgentStreamEvent } from "../shared/types.js";

// Lazy imports — bun_pi_agent depends on pi-ai/pi-agent-core which need API keys.
// Importing at module scope would fail if no key is configured.
let _discoverAgents: typeof import("../../../bun_pi_agent/src/agents/parser.js").discoverAgents | null = null;
let _createAgentFromDef: typeof import("../../../bun_pi_agent/src/agents/factory.js").createAgentFromDef | null = null;

// .agent/agents/ lives at the repo root, which is 4 levels up from this file (src/server/ → remotion_studio/ → bun_app/ → root)
const REPO_ROOT = resolve(import.meta.dir, "../../../..");

async function ensureLoaded() {
  if (_discoverAgents) return;
  const parser = await import("../../../bun_pi_agent/src/agents/parser.js");
  const factory = await import("../../../bun_pi_agent/src/agents/factory.js");
  _discoverAgents = parser.discoverAgents;
  _createAgentFromDef = factory.createAgentFromDef;
}

/** List available agent definitions from .agent/agents/ */
export async function listAvailableAgents(workDir?: string): Promise<AgentInfo[]> {
  await ensureLoaded();
  const defs = _discoverAgents!(workDir || REPO_ROOT);
  return defs.map(defToInfo);
}

/** Check if the agent bridge is functional (bun_pi_agent importable + API key available) */
export async function isBridgeAvailable(): Promise<{ ok: boolean; error?: string }> {
  try {
    await ensureLoaded();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Run an agent task, collecting events into a structured result */
export async function runAgentTask(
  agentName: string,
  prompt: string,
  options?: {
    workDir?: string;
    onEvent?: (event: AgentStreamEvent) => void;
  },
): Promise<AgentTaskResult> {
  await ensureLoaded();

  const workDir = options?.workDir || REPO_ROOT;
  const defs = _discoverAgents!(workDir);
  const def = defs.find((d) => d.name === agentName);
  if (!def) {
    throw new Error(`Unknown agent: "${agentName}". Available: ${defs.map((d) => d.name).join(", ") || "(none)"}`);
  }

  const agent = _createAgentFromDef!(def);
  const startTime = Date.now();

  let response = "";
  let turnCount = 0;
  let toolCallCount = 0;
  const toolCalls: AgentTaskResult["toolCalls"] = [];
  const onEvent = options?.onEvent;

  agent.subscribe((event: AgentEvent) => {
    switch (event.type) {
      case "turn_end":
        turnCount++;
        onEvent?.({ type: "turn_end" });
        break;
      case "message_update": {
        const delta = (event as any).assistantMessageEvent?.delta;
        if (typeof delta === "string" && delta) {
          response += delta;
          onEvent?.({ type: "text", delta });
        }
        break;
      }
      case "message_end": {
        const content = event.message?.content;
        if (typeof content === "string" && content && !response) {
          response = content;
        }
        break;
      }
      case "tool_execution_start":
        toolCallCount++;
        onEvent?.({
          type: "tool_start",
          toolName: event.toolName,
          toolCallId: event.toolCallId,
          args: event.args,
        });
        break;
      case "tool_execution_end":
        toolCalls.push({
          name: event.toolName,
          args: undefined,
          result: event.result,
          isError: event.isError,
        });
        onEvent?.({
          type: "tool_end",
          toolName: event.toolName,
          toolCallId: event.toolCallId,
          result: event.result,
          isError: event.isError,
        });
        break;
    }
  });

  await agent.prompt(prompt);

  const durationMs = Date.now() - startTime;
  onEvent?.({ type: "done", turnCount, toolCallCount });

  return {
    agentName: def.name,
    response,
    turnCount,
    toolCallCount,
    toolCalls,
    durationMs,
  };
}

function defToInfo(def: AgentDefinition): AgentInfo {
  return {
    name: def.name,
    description: def.description,
    tools: def.tools,
    model: def.model,
    skills: def.skills,
  };
}
