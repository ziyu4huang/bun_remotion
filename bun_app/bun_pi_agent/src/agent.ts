import type { Agent } from "@mariozechner/pi-agent-core";
import { createDefaultAgent, createAgentFromDef } from "./agents/index.js";
import type { AgentDefinition } from "./agents/types.js";

/** Active agent definition override (set by --agent flag in index.ts) */
let activeDef: AgentDefinition | undefined;

/** E2E mock override — set by test-server helper via setMockAgent(). */
let mockAgent: Agent | undefined;

/** Set the active agent definition. Called by index.ts when --agent is used. */
export function setAgentDefinition(def: AgentDefinition | undefined): void {
  activeDef = def;
}

/** Get the current agent definition (if any). */
export function getAgentDefinition(): AgentDefinition | undefined {
  return activeDef;
}

/** Inject a mock agent for e2e testing. Only call from test helpers. */
export function setMockAgent(agent: Agent | undefined): void {
  mockAgent = agent;
}

export interface CreateAgentOptions {
  /** Seed the agent with prior conversation history */
  initialMessages?: any[];
}

/**
 * Create agent — returns mock if injected, env-var mock if set, agent definition if set, otherwise default.
 * All modes (CLI, ACP, server) call this function.
 */
export function createAgent(options?: CreateAgentOptions): Agent {
  if (mockAgent) return mockAgent;
  if (process.env.PI_AGENT_E2E_MOCK === "1") return createEnvMockAgent();
  const msgs = options?.initialMessages;
  if (activeDef) return createAgentFromDef(activeDef, msgs);
  return createDefaultAgent(msgs);
}

/**
 * Lightweight mock agent for subprocess e2e tests.
 * Self-contained — no imports from test helpers. Replays a simple text response.
 */
function createEnvMockAgent(): Agent {
  const listeners: Array<(event: any) => void> = [];
  let aborted = false;

  const agent = {
    subscribe(fn: (event: any) => void): () => void {
      listeners.push(fn);
      return () => { listeners.splice(listeners.indexOf(fn), 1); };
    },
    async prompt(_text: string): Promise<void> {
      aborted = false;
      const events = [
        { type: "agent_start" },
        { type: "message_update", message: {}, assistantMessageEvent: { type: "text_delta", delta: "Mock response" } },
        { type: "agent_end", messages: [] },
      ];
      for (const evt of events) {
        if (aborted) break;
        await new Promise((r) => setTimeout(r, 5));
        if (aborted) break;
        for (const fn of listeners) fn(evt);
      }
    },
    abort() { aborted = true; },
    reset() { listeners.length = 0; },
    state: { model: { provider: "mock", name: "mock-model" }, messages: [], tools: [] },
    steer() {},
    followUp() {},
    clearSteeringQueue() {},
    clearFollowUpQueue() {},
    clearAllQueues() {},
    hasQueuedMessages() { return false; },
    waitForIdle() { return Promise.resolve(); },
    continue() { return Promise.resolve(); },
  };
  return agent as unknown as Agent;
}

export type { AgentEvent } from "@mariozechner/pi-agent-core";
