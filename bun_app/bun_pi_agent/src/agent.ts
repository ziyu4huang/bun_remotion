import type { Agent } from "@mariozechner/pi-agent-core";
import { createDefaultAgent, createAgentFromDef } from "./agents/index.js";
import type { AgentDefinition } from "./agents/types.js";

/** Active agent definition override (set by --agent flag in index.ts) */
let activeDef: AgentDefinition | undefined;

/** Set the active agent definition. Called by index.ts when --agent is used. */
export function setAgentDefinition(def: AgentDefinition | undefined): void {
  activeDef = def;
}

/** Get the current agent definition (if any). */
export function getAgentDefinition(): AgentDefinition | undefined {
  return activeDef;
}

/**
 * Create agent — uses agent definition if set, otherwise default.
 * All modes (CLI, ACP, server) call this function.
 */
export function createAgent(): Agent {
  if (activeDef) {
    return createAgentFromDef(activeDef);
  }
  return createDefaultAgent();
}

export type { AgentEvent } from "@mariozechner/pi-agent-core";
