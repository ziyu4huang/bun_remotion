import { existsSync, writeFileSync } from "fs";
import { dirname, join } from "path";

const args = process.argv.slice(2);
const VERSION = "0.6.0";

// Embedded package.json content — needed by pi-coding-agent at startup.
// For compiled binaries, pi-coding-agent reads dirname(process.execPath)/package.json
// at module-scope to resolve APP_NAME and VERSION. Writing this file before
// the dynamic import ensures the binary works without any companion files.
const EMBEDDED_PACKAGE_JSON = JSON.stringify({
  name: "bun_pi_agent",
  version: VERSION,
  private: true,
}, null, 2);

function ensurePackageJson(): void {
  const binDir = dirname(process.execPath);
  const pkgPath = join(binDir, "package.json");
  if (!existsSync(pkgPath)) {
    try {
      writeFileSync(pkgPath, EMBEDDED_PACKAGE_JSON);
    } catch (e: any) {
      console.error(
        `Error: Cannot write package.json next to binary (${pkgPath}).\n` +
        `  ${e.message}\n\n` +
        `  Create this file manually:\n` +
        `  echo '${EMBEDDED_PACKAGE_JSON}' > "${pkgPath}"\n`
      );
      process.exit(1);
    }
  }
}

// --- Parse --agent flag early (before help/version check so --list-agents works) ---
let agentName: string | undefined;
let listAgents = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--agent" && args[i + 1]) {
    agentName = args[i + 1];
    i++; // skip next arg
  } else if (args[i]?.startsWith("--agent=")) {
    agentName = args[i].split("=")[1];
  } else if (args[i] === "--list-agents") {
    listAgents = true;
  }
}

// --- Handle --help / --version BEFORE any heavy imports ---
for (const arg of args) {
  if (arg === "--help" || arg === "-h") {
    showHelp();
    process.exit(0);
  }
  if (arg === "--version" || arg === "-v") {
    console.log(`bun_pi_agent v${VERSION}`);
    process.exit(0);
  }
}

// --- Ensure runtime dependencies before loading pi-coding-agent ---
ensurePackageJson();

// --- Dynamic imports — deferred so --help/--version don't trigger pi-coding-agent ---
const { startServer } = await import("./server/index.js");
const { discoverAgents } = await import("./agents/parser.js");
const { setAgentDefinition } = await import("./agent.js");

// --- Handle --list-agents ---
if (listAgents) {
  const workDir = process.env.PI_AGENT_WORKDIR || process.cwd();
  const agents = discoverAgents(workDir);
  if (agents.length === 0) {
    console.log("No agent definitions found.");
    console.log(`Searched: ${workDir}/.agent/agents/, ~/.agent/agents/`);
  } else {
    console.log(`Available agents (${agents.length}):\n`);
    for (const a of agents) {
      const toolInfo = a.tools ? ` (${a.tools.length} tools)` : " (all tools)";
      const modelInfo = a.model ? ` [${a.model}]` : "";
      console.log(`  ${a.name}${modelInfo}${toolInfo}`);
      console.log(`    ${a.description}`);
    }
  }
  process.exit(0);
}

// --- Resolve agent definition ---
if (agentName) {
  const workDir = process.env.PI_AGENT_WORKDIR || process.cwd();
  const agents = discoverAgents(workDir);
  const found = agents.find(a => a.name === agentName);

  if (!found) {
    console.error(`Error: Agent "${agentName}" not found.`);
    const available = agents.map(a => a.name);
    if (available.length > 0) {
      console.error(`Available agents: ${available.join(", ")}`);
    } else {
      console.error("No agent definitions found. Create .agent/agents/*.md files.");
    }
    process.exit(1);
  }

  console.error(`[agents] Using agent: ${found.name} (${found.tools?.length ?? "all"} tools)`);
  setAgentDefinition(found);
}

// --- Mode dispatch ---
let mode: "stdio" | "cli" | "server" = "stdio";

for (const arg of args) {
  if (arg === "--server" || arg === "--mode=server") {
    mode = "server";
  } else if (arg === "--mode=cli" || arg === "--cli") {
    mode = "cli";
  } else if (arg === "--mode=stdio" || arg === "--stdio") {
    mode = "stdio";
  }
}

if (mode === "server") {
  startServer();
} else if (mode === "cli") {
  const { startCli } = await import("./cli/index.js");
  startCli();
} else {
  const { startStdio } = await import("./acp/stdio.js");
  startStdio();
}

// ---------------------------------------------------------------------------
// Help text
// ---------------------------------------------------------------------------

function showHelp(): void {
  console.log(`bun_pi_agent v${VERSION} — Coding assistant powered by pi-agent

Usage:
  bun_pi_agent [options]

Modes:
  (default)        ACP stdio mode (JSON-RPC 2.0 over stdin/stdout)
  --cli            Interactive CLI with readline
  --server         HTTP API server with SSE streaming

Agent System:
  --agent <name>   Use a specific agent definition from .agent/agents/
  --list-agents    List available agent definitions and exit

Options:
  --stdio          ACP stdio mode (default)
  --mode=stdio     Same as --stdio
  --mode=cli       Interactive CLI mode
  --cli            Shorthand for --mode=cli
  --mode=server    HTTP API server with SSE
  --server         Shorthand for --mode=server
  --version, -v    Print version and exit
  --help, -h       Show this help and exit

Environment:
  PI_AGENT_MODEL      Provider/model (default: zai/glm-5-turbo)
  PI_AGENT_HOST       Server bind host (default: 127.0.0.1)
  PI_AGENT_PORT       Server bind port (default: 3456)
  PI_AGENT_WORKDIR    Working directory for tools (default: cwd)
  PI_AGENT_RUNS_DIR   Run persistence directory (default: <workdir>/.pi-agent/runs)
  PI_AGENT_NAME       Default agent definition name (overridden by --agent)
  ZAI_API_KEY         API key for z.ai provider

Examples:
  bun_pi_agent                                          # Start ACP stdio mode
  bun_pi_agent --cli                                    # Start interactive CLI
  bun_pi_agent --server                                 # Start HTTP API server
  bun_pi_agent --agent sg-story-advisor                  # Use sg-story-advisor agent
  bun_pi_agent --list-agents                            # Show available agents
  PI_AGENT_MODEL=anthropic/claude-sonnet-4-5 bun_pi_agent  # Use Anthropic model`);
}
