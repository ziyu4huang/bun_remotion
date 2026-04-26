import { Agent } from "@mariozechner/pi-agent-core";
import { getModel, getEnvApiKey } from "@mariozechner/pi-ai";
import { getConfig } from "../config.js";
import { loadAgentSkills, getSkillsPromptSection } from "../skills/index.js";
import { createAllTools, createToolsByNames } from "./tool-registry.js";
import type { AgentDefinition } from "./types.js";

const BASE_SYSTEM_PROMPT = `You are a coding assistant. You can read, write, edit, and search files, list directories, and execute bash commands.

Guidelines:
- Explain what you're doing before using tools.
- Read files before editing them to understand context.
- Use grep/find to search for patterns across files.
- Use bash for running builds, tests, and git commands.
- Keep responses concise and focused on the task.`;

/**
 * Create an Agent from an AgentDefinition.
 * Applies tool scoping, model override, and prompt composition.
 */
export function createAgentFromDef(def: AgentDefinition): Agent {
  const config = getConfig();

  // Resolve model: agent override or default from config
  const modelString = def.model || `${config.modelProvider}/${config.modelName}`;
  const [provider, ...nameParts] = modelString.split("/");
  const modelName = nameParts.join("/");

  const apiKey = getEnvApiKey(provider as any);
  if (!apiKey) {
    throw new Error(
      `No API key found for provider "${provider}". ` +
      `Set ${provider.toUpperCase().replace("-", "_")}_API_KEY in your environment.`
    );
  }

  const model = getModel(provider as any, modelName as any);

  // Tool scoping
  let tools;
  let warnings: string[] = [];
  if (def.tools && def.tools.length > 0) {
    const result = createToolsByNames(def.tools);
    tools = result.tools;
    warnings = result.warnings;
  } else {
    tools = createAllTools();
  }

  if (warnings.length > 0) {
    console.error(`[agents] Warnings for "${def.name}": ${warnings.join(", ")}`);
  }

  // Prompt composition: base + agent body + skills
  const { skills } = loadAgentSkills();
  const skillsSection = getSkillsPromptSection(skills);
  let systemPrompt = BASE_SYSTEM_PROMPT;

  if (def.prompt) {
    systemPrompt += "\n\n" + def.prompt;
  }

  systemPrompt += skillsSection;

  return new Agent({
    initialState: {
      systemPrompt,
      model,
      tools,
    },
    getApiKey: () => apiKey,
  });
}

/**
 * Create default agent (no definition — backward compatible).
 * Identical to the original createAgent() behavior.
 */
export function createDefaultAgent(): Agent {
  const config = getConfig();

  const apiKey = getEnvApiKey(config.modelProvider as any);
  if (!apiKey) {
    throw new Error(
      `No API key found for provider "${config.modelProvider}". ` +
      `Set ${config.modelProvider.toUpperCase().replace("-", "_")}_API_KEY in your environment.`
    );
  }

  const model = getModel(config.modelProvider as any, config.modelName as any);
  const tools = createAllTools();

  const { skills } = loadAgentSkills();
  const skillsSection = getSkillsPromptSection(skills);
  const systemPrompt = BASE_SYSTEM_PROMPT + skillsSection;

  return new Agent({
    initialState: {
      systemPrompt,
      model,
      tools,
    },
    getApiKey: () => apiKey,
  });
}
