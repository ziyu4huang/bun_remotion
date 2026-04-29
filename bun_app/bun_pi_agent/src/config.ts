export interface AgentConfig {
  modelProvider: string;
  modelName: string;
  host: string;
  port: number;
  workDir: string;
  runsDir: string;
  maxRunAge: number;   // seconds; runs older than this are deleted on startup
  maxRunCount: number; // max persisted runs; oldest deleted when exceeded
  convDir: string;     // conversation persistence directory
  maxConvAge: number;  // seconds; conversations older than this are deleted
  maxConvCount: number; // max persisted conversations
  rateLimitMax: number;   // max requests per window
  rateLimitWindowMs: number; // window in milliseconds
  agentName?: string;  // agent definition name (from --agent flag)
  benchMaxToolCalls: number; // max tool calls per benchmark task
  benchMaxTurns: number;    // max agent turns per benchmark task
  benchMode: "regex" | "ai" | "hybrid"; // KG suite extraction mode
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
    maxRunAge: parseInt(process.env.PI_AGENT_MAX_RUN_AGE || "604800", 10), // 7 days
    maxRunCount: parseInt(process.env.PI_AGENT_MAX_RUN_COUNT || "100", 10),
    convDir: process.env.PI_AGENT_CONV_DIR || `${workDir}/.pi-agent/conversations`,
    maxConvAge: parseInt(process.env.PI_AGENT_MAX_CONV_AGE || "2592000", 10), // 30 days
    maxConvCount: parseInt(process.env.PI_AGENT_MAX_CONV_COUNT || "50", 10),
    rateLimitMax: parseInt(process.env.PI_AGENT_RATE_LIMIT_MAX || "100", 10),
    rateLimitWindowMs: parseInt(process.env.PI_AGENT_RATE_LIMIT_WINDOW_MS || "60000", 10),
    agentName: process.env.PI_AGENT_NAME || undefined,
    benchMaxToolCalls: parseInt(process.env.PI_AGENT_BENCH_MAX_TOOL_CALLS || "15", 10),
    benchMaxTurns: parseInt(process.env.PI_AGENT_BENCH_MAX_TURNS || "10", 10),
    benchMode: (process.env.PI_AGENT_BENCH_MODE as "regex" | "ai" | "hybrid") || "ai",
  };
}
