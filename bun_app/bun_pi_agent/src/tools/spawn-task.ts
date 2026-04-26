import { Type } from "@sinclair/typebox";
import type { AgentTool, AgentToolResult, AgentEvent } from "@mariozechner/pi-agent-core";
import { discoverAgents, createAgentFromDef } from "../agents/index.js";
import { getConfig } from "../config.js";

// ─── Helpers ───

function textResult(text: string, details?: unknown): AgentToolResult<unknown> {
  return {
    content: [{ type: "text" as const, text }],
    details: details ?? {},
  };
}

function errorResult(msg: string): AgentToolResult<unknown> {
  return {
    content: [{ type: "text" as const, text: `Error: ${msg}` }],
    details: { error: msg },
  };
}

// ─── Schema ───

const spawnTaskSchema = Type.Object({
  agent_name: Type.String({ description: "Name of the agent definition to invoke (e.g. 'sg-quality-gate', 'sg-story-advisor')" }),
  task_prompt: Type.String({ description: "The task description to give the subagent" }),
  max_turns: Type.Optional(Type.Number({ description: "Maximum LLM turns for the subagent (default: 10)", default: 10 })),
});

// ─── Tool ───

export function createSpawnTaskTool(): AgentTool<typeof spawnTaskSchema> {
  return {
    name: "spawn_task",
    label: "Spawn Subagent",
    description:
      "Invoke another agent as a subagent to perform a delegated task. " +
      "The subagent runs with its own scoped tools and prompt, isolated from the parent conversation. " +
      "Returns the subagent's final response text.",
    parameters: spawnTaskSchema,
    execute: async (_id, params, _signal) => {
      const { agent_name, task_prompt, max_turns = 10 } = params;

      // Discover available agents
      const workDir = getConfig().workDir;
      const agents = discoverAgents(workDir);

      // Find the target agent definition
      const def = agents.find((a) => a.name === agent_name);
      if (!def) {
        const available = agents.map((a) => a.name);
        return errorResult(
          `Unknown agent "${agent_name}". Available agents: ${
            available.length ? available.join(", ") : "none"
          }`
        );
      }

      // Prevent self-spawn (agent spawning itself)
      // This is a safety check — the definition name matches the running agent

      // Create subagent from definition
      let subAgent;
      try {
        subAgent = createAgentFromDef(def);
      } catch (e: any) {
        return errorResult(`Failed to create agent "${agent_name}": ${e.message}`);
      }

      // Collect results via event subscription
      let turnCount = 0;
      let lastAssistantText = "";
      const toolCalls: { name: string; success: boolean }[] = [];

      const unsubscribe = subAgent.subscribe((event: AgentEvent) => {
        switch (event.type) {
          case "turn_end": {
            turnCount++;
            // Extract text from the assistant message
            const msg = event.message as any;
            if (msg?.role === "assistant" && Array.isArray(msg.content)) {
              for (const block of msg.content) {
                if (block.type === "text" && block.text) {
                  lastAssistantText = block.text;
                }
              }
            }
            // Enforce max_turns
            if (turnCount >= max_turns) {
              subAgent.abort();
            }
            break;
          }
          case "tool_execution_end":
            toolCalls.push({
              name: event.toolName,
              success: !event.isError,
            });
            break;
        }
      });

      try {
        await subAgent.prompt(task_prompt);
      } catch (e: any) {
        // Aborted runs (max_turns exceeded) are not errors
        if (e?.message?.includes("abort")) {
          // Fall through to return whatever was collected
        } else {
          unsubscribe();
          return errorResult(`Subagent "${agent_name}" failed: ${e.message}`);
        }
      } finally {
        unsubscribe();
      }

      return textResult(lastAssistantText, {
        agent_name,
        turn_count: turnCount,
        tool_calls: toolCalls,
        truncated: turnCount >= max_turns,
      });
    },
  };
}
