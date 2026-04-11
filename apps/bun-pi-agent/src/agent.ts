import { Agent } from "@mariozechner/pi-agent-core";
import { getModel, getEnvApiKey } from "@mariozechner/pi-ai";
import { createTools } from "./tools/index.js";
import { getConfig } from "./config.js";
import { loadAgentSkills, getSkillsPromptSection } from "./skills/index.js";

const BASE_SYSTEM_PROMPT = `You are a coding assistant. You can read, write, edit, and search files, list directories, and execute bash commands.

Guidelines:
- Explain what you're doing before using tools.
- Read files before editing them to understand context.
- Use grep/find to search for patterns across files.
- Use bash for running builds, tests, and git commands.
- Keep responses concise and focused on the task.`;

export function createAgent() {
  const config = getConfig();

  // Resolve API key from environment
  const apiKey = getEnvApiKey(config.modelProvider as any);
  if (!apiKey) {
    throw new Error(
      `No API key found for provider "${config.modelProvider}". ` +
      `Set ${config.modelProvider.toUpperCase().replace("-", "_")}_API_KEY in your environment.`
    );
  }

  const model = getModel(config.modelProvider as any, config.modelName as any);
  const tools = createTools();

  // Load skills and build system prompt
  const { skills } = loadAgentSkills();
  const skillsSection = getSkillsPromptSection(skills);
  const systemPrompt = BASE_SYSTEM_PROMPT + skillsSection;

  const agent = new Agent({
    initialState: {
      systemPrompt,
      model,
      tools,
    },
    getApiKey: () => apiKey,
  });

  return agent;
}

export type { AgentEvent } from "@mariozechner/pi-agent-core";
