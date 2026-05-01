import { resolve } from "node:path";
import type { AgentDefinition } from "../../../bun_pi_agent/src/agents/types.js";
import type { AgentEvent } from "../../../bun_pi_agent/src/agent.js";
import type { AgentInfo, AgentTaskResult, AgentStreamEvent } from "../shared/types.js";
import type { AgentProvider, RunTaskOptions, AgentAttachment } from "./agent-interface.js";

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

/** Inject attachment file contents into the prompt as context. */
function buildPromptWithAttachments(prompt: string, attachments?: AgentAttachment[]): string {
  if (!attachments || attachments.length === 0) return prompt;
  const ctx = attachments
    .map((a) => `\n--- File: ${a.name} (${a.path}) ---\n${a.content}\n--- End of ${a.name} ---`)
    .join("\n");
  return `${prompt}\n\n[Attached file contents for context — use these when answering:]\n${ctx}`;
}

/**
 * Default AgentProvider — runs agents in-process via bun_pi_agent.
 * Implements the AgentProvider interface for decoupled access.
 */
export const bridge: AgentProvider = {
  async isAvailable() {
    try {
      await ensureLoaded();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  async listAgents(workDir?: string): Promise<AgentInfo[]> {
    await ensureLoaded();
    const defs = _discoverAgents!(workDir || REPO_ROOT);
    return defs.map(defToInfo);
  },

  async runTask(
    agentName: string,
    prompt: string,
    options?: RunTaskOptions,
  ): Promise<AgentTaskResult> {
    await ensureLoaded();

    const workDir = options?.workDir || REPO_ROOT;
    const defs = _discoverAgents!(workDir);
    const def = defs.find((d) => d.name === agentName);
    if (!def) {
      throw new Error(`Unknown agent: "${agentName}". Available: ${defs.map((d) => d.name).join(", ") || "(none)"}`);
    }

    const effectivePrompt = buildPromptWithAttachments(prompt, options?.attachments);
    const agent = _createAgentFromDef!(def, options?.history, options?.model);
    const startTime = Date.now();

    let response = "";
    let turnCount = 0;
    let toolCallCount = 0;
    const toolCalls: AgentTaskResult["toolCalls"] = [];
    const onEvent = options?.onEvent;

    agent.subscribe((event: AgentEvent) => {
      try {
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
            if (!response) {
              const content = event.message?.content;
              if (typeof content === "string" && content) {
                response = content;
              } else if (Array.isArray(content)) {
                response = content
                  .filter((b: any) => b.type === "text" && typeof b.text === "string")
                  .map((b: any) => b.text)
                  .join("");
              }
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
      } catch (err) {
        console.error("[agent-bridge] Error in subscribe callback:", err);
      }
    });

    try {
      const AGENT_TIMEOUT_MS = 3 * 60 * 1000;
      await Promise.race([
        agent.prompt(effectivePrompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            agent.abort();
            reject(new Error("Agent timed out after 3 minutes. The LLM API may be slow or unresponsive."));
          }, AGENT_TIMEOUT_MS)
        ),
      ]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      onEvent?.({ type: "error", message: errMsg });
      throw err;
    }

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
  },
};

function defToInfo(def: AgentDefinition): AgentInfo {
  return {
    name: def.name,
    description: def.description,
    tools: def.tools,
    model: def.model,
    skills: def.skills,
  };
}
