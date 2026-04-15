export interface AgentConfig {
  modelProvider: string;
  modelName: string;
  host: string;
  port: number;
  workDir: string;
  runsDir: string;
}

export function getConfig(): AgentConfig {
  const model = process.env.PI_AGENT_MODEL || "zai/glm-5-turbo";
  const [provider, ...nameParts] = model.split("/");
  const modelName = nameParts.join("/");

  if (!modelName) {
    throw new Error(`Invalid PI_AGENT_MODEL format: "${model}". Expected "provider/model-name" (e.g., "anthropic/claude-sonnet-4-5")`);
  }

  const workDir = process.env.PI_AGENT_WORKDIR || process.cwd();

  return {
    modelProvider: provider,
    modelName,
    host: process.env.PI_AGENT_HOST || "127.0.0.1",
    port: parseInt(process.env.PI_AGENT_PORT || "3456", 10),
    workDir,
    runsDir: process.env.PI_AGENT_RUNS_DIR || `${workDir}/.pi-agent/runs`,
  };
}
