/** Agent definition — parsed from .agent/agents/*.md frontmatter */
export interface AgentDefinition {
  name: string;
  description: string;
  tools?: string[];       // whitelist of tool names; omit = all tools
  model?: string;         // provider/model override (e.g. "zai/glm-5")
  skills?: string[];      // skill names to load; omit = all skills
  prompt: string;         // body of the markdown file (agent-specific system prompt)
  filePath: string;       // source file for debugging
}
