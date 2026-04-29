import { Agent } from "@mariozechner/pi-agent-core";
import { getModel, getEnvApiKey } from "@mariozechner/pi-ai";
import { getConfig } from "../config.js";
import { loadAgentSkills, getSkillsPromptSection } from "../skills/index.js";
import { createAllTools, createToolsByNames } from "./tool-registry.js";
import { getDeepSeekModel, getDeepSeekApiKey, isDeepSeekModel } from "../models/deepseek.js";
import type { AgentDefinition } from "./types.js";
import type { Model } from "@mariozechner/pi-ai";

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
export function createAgentFromDef(
  def: AgentDefinition,
  initialMessages?: any[],
  /** Override the agent definition's model (e.g. "deepseek/deepseek-v4-pro"). */
  modelOverride?: string,
): Agent {
  const config = getConfig();

  // Resolve model: override > agent def > config default
  const modelString = modelOverride || def.model || `${config.modelProvider}/${config.modelName}`;
  const [provider, ...nameParts] = modelString.split("/");
  const modelName = nameParts.join("/");

  let model: Model<any>;
  let apiKey: string | undefined;

  if (provider === "deepseek") {
    // DeepSeek custom provider — not in pi-ai's built-in registry
    model = getDeepSeekModel(modelName || "deepseek-v4-pro");
    apiKey = getDeepSeekApiKey();
    if (!apiKey) {
      throw new Error(
        `No API key found for DeepSeek. ` +
        `Set DEEPSEEK_API_KEY in your environment.`
      );
    }
  } else {
    apiKey = getEnvApiKey(provider as any);
    if (!apiKey) {
      throw new Error(
        `No API key found for provider "${provider}". ` +
        `Set ${provider.toUpperCase().replace("-", "_")}_API_KEY in your environment.`
      );
    }
    model = getModel(provider as any, modelName as any);
  }

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

  const initialState: any = {
    systemPrompt,
    model,
    tools,
  };
  if (initialMessages && initialMessages.length > 0) {
    initialState.messages = initialMessages;
  }

  return new Agent({
    initialState,
    getApiKey: () => apiKey,
  });
}

/**
 * Create default agent (no definition — backward compatible).
 * Identical to the original createAgent() behavior.
 */
export function createDefaultAgent(initialMessages?: any[]): Agent {
  const config = getConfig();

  let model: Model<any>;
  let apiKey: string | undefined;

  if (config.modelProvider === "deepseek") {
    model = getDeepSeekModel(config.modelName || "deepseek-v4-pro");
    apiKey = getDeepSeekApiKey();
    if (!apiKey) {
      throw new Error(
        `No API key found for DeepSeek. ` +
        `Set DEEPSEEK_API_KEY in your environment.`
      );
    }
  } else {
    apiKey = getEnvApiKey(config.modelProvider as any);
    if (!apiKey) {
      throw new Error(
        `No API key found for provider "${config.modelProvider}". ` +
        `Set ${config.modelProvider.toUpperCase().replace("-", "_")}_API_KEY in your environment.`
      );
    }
    model = getModel(config.modelProvider as any, config.modelName as any);
  }
  const tools = createAllTools();

  const { skills } = loadAgentSkills();
  const skillsSection = getSkillsPromptSection(skills);
  const systemPrompt = BASE_SYSTEM_PROMPT + skillsSection;

  const initialState: any = {
    systemPrompt,
    model,
    tools,
  };
  if (initialMessages && initialMessages.length > 0) {
    initialState.messages = initialMessages;
  }

  return new Agent({
    initialState,
    getApiKey: () => apiKey,
  });
}
