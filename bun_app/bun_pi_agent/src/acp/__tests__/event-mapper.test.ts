import { describe, test, expect } from "bun:test";
import { mapAgentEventToSessionUpdate } from "../event-mapper.js";
import type { AgentEvent } from "@mariozechner/pi-agent-core";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a message_update event with the given assistant message event type */
function msgUpdate(subType: string, overrides: Record<string, unknown> = {}): AgentEvent {
  return {
    type: "message_update",
    assistantMessageEvent: { type: subType, ...overrides } as any,
    toolCallId: overrides.toolCallId as string | undefined,
    toolName: overrides.toolName as string | undefined,
  } as any;
}

function toolExecStart(toolCallId: string, toolName: string): AgentEvent {
  return {
    type: "tool_execution_start",
    toolCallId,
    toolName,
    args: {},
  } as AgentEvent;
}

function toolExecEnd(
  toolCallId: string,
  toolName: string,
  isError: boolean,
  result: unknown = {},
): AgentEvent {
  return {
    type: "tool_execution_end",
    toolCallId,
    toolName,
    isError,
    result,
  } as AgentEvent;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("event-mapper: text streaming", () => {
  test("maps text_delta → agent_message_chunk", () => {
    const update = mapAgentEventToSessionUpdate(msgUpdate("text_delta", { delta: "Hello" }));
    expect(update).not.toBeNull();
    expect(update!.sessionUpdate).toBe("agent_message_chunk");
    expect((update as any).content.type).toBe("text");
    expect((update as any).content.text).toBe("Hello");
  });

  test("maps thinking_delta → agent_thought_chunk", () => {
    const update = mapAgentEventToSessionUpdate(msgUpdate("thinking_delta", { delta: "thinking..." }));
    expect(update).not.toBeNull();
    expect(update!.sessionUpdate).toBe("agent_thought_chunk");
    expect((update as any).content.text).toBe("thinking...");
  });
});

describe("event-mapper: tool calls", () => {
  test("maps toolcall_start → tool_call with pending status", () => {
    const update = mapAgentEventToSessionUpdate(
      msgUpdate("toolcall_start", { toolCallId: "tc1", toolName: "read" }),
    );
    expect(update).not.toBeNull();
    expect(update!.sessionUpdate).toBe("tool_call");
    expect((update as any).toolCallId).toBe("tc1");
    expect((update as any).kind).toBe("read");
    expect((update as any).status).toBe("pending");
  });

  test("maps tool_execution_start → tool_call_update in_progress", () => {
    const update = mapAgentEventToSessionUpdate(toolExecStart("tc1", "bash"));
    expect(update).not.toBeNull();
    expect(update!.sessionUpdate).toBe("tool_call_update");
    expect((update as any).toolCallId).toBe("tc1");
    expect((update as any).status).toBe("in_progress");
  });

  test("maps tool_execution_end success → tool_call_update completed", () => {
    const update = mapAgentEventToSessionUpdate(
      toolExecEnd("tc1", "read", false, { content: [{ text: "file contents" }] }),
    );
    expect(update).not.toBeNull();
    expect(update!.sessionUpdate).toBe("tool_call_update");
    expect((update as any).status).toBe("completed");
    expect((update as any).rawOutput).toBe("file contents");
  });

  test("maps tool_execution_end error → tool_call_update failed", () => {
    const update = mapAgentEventToSessionUpdate(
      toolExecEnd("tc1", "bash", true, { content: [{ text: "command failed" }] }),
    );
    expect(update).not.toBeNull();
    expect(update!.sessionUpdate).toBe("tool_call_update");
    expect((update as any).status).toBe("failed");
    expect((update as any).rawOutput).toBe("command failed");
  });
});

describe("event-mapper: tool kind mapping", () => {
  test("maps write → edit", () => {
    const update = mapAgentEventToSessionUpdate(
      msgUpdate("toolcall_start", { toolCallId: "tc2", toolName: "write" }),
    );
    expect((update as any).kind).toBe("edit");
  });

  test("maps bash → execute", () => {
    const update = mapAgentEventToSessionUpdate(
      msgUpdate("toolcall_start", { toolCallId: "tc3", toolName: "bash" }),
    );
    expect((update as any).kind).toBe("execute");
  });

  test("maps grep → search", () => {
    const update = mapAgentEventToSessionUpdate(
      msgUpdate("toolcall_start", { toolCallId: "tc4", toolName: "grep" }),
    );
    expect((update as any).kind).toBe("search");
  });

  test("maps unknown → other", () => {
    const update = mapAgentEventToSessionUpdate(
      msgUpdate("toolcall_start", { toolCallId: "tc5", toolName: "custom_tool" }),
    );
    expect((update as any).kind).toBe("other");
  });
});

describe("event-mapper: returns null for internal events", () => {
  for (const type of ["agent_start", "agent_end", "turn_start", "turn_end", "message_start", "message_end"] as const) {
    test(`${type} → null`, () => {
      const update = mapAgentEventToSessionUpdate({ type } as AgentEvent);
      expect(update).toBeNull();
    });
  }
});
