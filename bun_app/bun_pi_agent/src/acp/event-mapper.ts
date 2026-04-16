/**
 * Maps pi-agent-core AgentEvent → ACP SessionUpdate notifications.
 *
 * This is the core translation layer between the agent runtime and the
 * Agent Client Protocol. Each AgentEvent is mapped to the appropriate
 * SessionUpdate variant for streaming to the client.
 */
import type { AgentEvent } from "@mariozechner/pi-agent-core";
import type {
  SessionUpdate,
  ToolKind,
  ToolCallStatus,
} from "@agentclientprotocol/sdk";

// ---------------------------------------------------------------------------
// Tool name → ToolKind mapping
// ---------------------------------------------------------------------------

const TOOL_KIND_MAP: Record<string, ToolKind> = {
  read: "read",
  write: "edit",
  edit: "edit",
  bash: "execute",
  grep: "search",
  find: "search",
  ls: "read",
};

function toolKind(name: string): ToolKind {
  return TOOL_KIND_MAP[name] ?? "other";
}

// ---------------------------------------------------------------------------
// Event mapper
// ---------------------------------------------------------------------------

/**
 * Convert a pi-agent-core AgentEvent to an ACP SessionUpdate.
 * Returns null for events that don't map to any session update.
 */
export function mapAgentEventToSessionUpdate(
  event: AgentEvent,
): SessionUpdate | null {
  switch (event.type) {
    // --- Text streaming ---
    case "message_update": {
      const evt = event.assistantMessageEvent;

      if (evt.type === "text_delta") {
        return {
          sessionUpdate: "agent_message_chunk",
          content: { type: "text", text: evt.delta },
        };
      }

      if (evt.type === "thinking_delta") {
        return {
          sessionUpdate: "agent_thought_chunk",
          content: { type: "text", text: evt.delta },
        };
      }

      // toolcall_start: the LLM decided to call a tool (args may still be streaming)
      if (evt.type === "toolcall_start") {
        return {
          sessionUpdate: "tool_call",
          toolCallId: event.toolCallId ?? "",
          title: event.toolName ?? "unknown",
          kind: toolKind(event.toolName ?? ""),
          status: "pending" as ToolCallStatus,
        };
      }

      return null;
    }

    // --- Tool execution lifecycle ---
    case "tool_execution_start":
      return {
        sessionUpdate: "tool_call_update",
        toolCallId: event.toolCallId,
        status: "in_progress" as ToolCallStatus,
      };

    case "tool_execution_update":
      // Progress updates — could send partial content but keep it simple
      return null;

    case "tool_execution_end": {
      if (event.isError) {
        const result = event.result as { content?: Array<{ text?: string }> };
        return {
          sessionUpdate: "tool_call_update",
          toolCallId: event.toolCallId,
          status: "failed" as ToolCallStatus,
          rawOutput: result?.content?.[0]?.text ?? "unknown error",
        };
      }

      const result = event.result as { content?: Array<{ text?: string }> };
      return {
        sessionUpdate: "tool_call_update",
        toolCallId: event.toolCallId,
        status: "completed" as ToolCallStatus,
        rawOutput: result?.content?.[0]?.text ?? "",
      };
    }

    // --- Internal events (no session update) ---
    case "agent_start":
    case "agent_end":
    case "turn_start":
    case "turn_end":
    case "message_start":
    case "message_end":
      return null;
  }
}
