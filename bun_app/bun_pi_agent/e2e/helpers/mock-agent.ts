/**
 * Deterministic mock agent for e2e tests.
 *
 * Implements the Agent interface shape used by server routes and ACP handlers.
 * Replays a scripted event sequence — no LLM API calls, no API keys needed.
 */

import type { AgentEvent } from "@mariozechner/pi-agent-core";

export interface MockAgentOptions {
  /** Events to replay when prompt() is called. */
  script: AgentEvent[];
  /** Delay between events in ms. Default: 10 */
  delayMs?: number;
  /** If set, prompt() rejects with this error. */
  error?: Error;
  /** If true, prompt() never resolves (for cancel testing). */
  hang?: boolean;
}

export function createMockAgent(options: MockAgentOptions) {
  const listeners: Array<(event: AgentEvent) => void> = [];
  let aborted = false;
  let promptResolve: (() => void) | null = null;

  const agent = {
    subscribe(fn: (event: AgentEvent) => void): () => void {
      listeners.push(fn);
      return () => {
        const idx = listeners.indexOf(fn);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    },

    async prompt(_text: string): Promise<void> {
      aborted = false;

      if (options.error) {
        // Emit agent_start then throw after a short delay
        await sleep(10);
        if (aborted) return;
        throw options.error;
      }

      if (options.hang) {
        // Never resolve — used for cancel testing
        return new Promise<void>((resolve) => {
          promptResolve = resolve;
        });
      }

      // Replay scripted events
      for (const event of options.script) {
        if (aborted) break;
        await sleep(options.delayMs ?? 10);
        if (aborted) break;
        for (const fn of listeners) fn(event);
      }
    },

    abort(): void {
      aborted = true;
      if (promptResolve) {
        promptResolve();
        promptResolve = null;
      }
    },

    reset(): void {
      listeners.length = 0;
      aborted = false;
    },

    // Minimal state stub — server routes read agent.state.model
    state: {
      model: { provider: "mock", name: "mock-model" },
      messages: [],
      tools: [],
    },

    // Stub methods not used by server routes
    steer() {},
    followUp() {},
    clearSteeringQueue() {},
    clearFollowUpQueue() {},
    clearAllQueues() {},
    hasQueuedMessages() { return false; },
    waitForIdle() { return Promise.resolve(); },
    continue() { return Promise.resolve(); },
  };

  return agent;
}

// --- Preset scripts for common test scenarios ---

/** Simple text response: "Hello!" */
export const SIMPLE_TEXT_SCRIPT: AgentEvent[] = [
  { type: "agent_start" } as AgentEvent,
  {
    type: "message_update",
    message: {} as any,
    assistantMessageEvent: { type: "text_delta", delta: "Hello!" },
  } as AgentEvent,
  { type: "agent_end", messages: [] } as AgentEvent,
];

/** Text response with a tool call in between */
export const TOOL_CALL_SCRIPT: AgentEvent[] = [
  { type: "agent_start" } as AgentEvent,
  {
    type: "message_update",
    message: {} as any,
    assistantMessageEvent: { type: "text_delta", delta: "Let me check..." },
  } as AgentEvent,
  {
    type: "tool_execution_start",
    toolCallId: "tc-1",
    toolName: "Read",
    args: { path: "/tmp/test.txt" },
  } as AgentEvent,
  {
    type: "tool_execution_end",
    toolCallId: "tc-1",
    toolName: "Read",
    result: "file contents here",
    isError: false,
  } as AgentEvent,
  {
    type: "message_update",
    message: {} as any,
    assistantMessageEvent: { type: "text_delta", delta: "The file says hello." },
  } as AgentEvent,
  { type: "agent_end", messages: [] } as AgentEvent,
];

/** Long response for testing streaming with multiple chunks */
export const MULTI_CHUNK_SCRIPT: AgentEvent[] = [
  { type: "agent_start" } as AgentEvent,
  {
    type: "message_update",
    message: {} as any,
    assistantMessageEvent: { type: "text_delta", delta: "Part one. " },
  } as AgentEvent,
  {
    type: "message_update",
    message: {} as any,
    assistantMessageEvent: { type: "text_delta", delta: "Part two. " },
  } as AgentEvent,
  {
    type: "message_update",
    message: {} as any,
    assistantMessageEvent: { type: "text_delta", delta: "Part three." },
  } as AgentEvent,
  { type: "agent_end", messages: [] } as AgentEvent,
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
