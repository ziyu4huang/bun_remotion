import { existsSync, writeFileSync } from "fs";
import { dirname, join } from "path";

const args = process.argv.slice(2);
const VERSION = "0.5.0";

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
  ZAI_API_KEY         API key for z.ai provider

Examples:
  bun_pi_agent                                          # Start ACP stdio mode
  bun_pi_agent --cli                                    # Start interactive CLI
  bun_pi_agent --server                                 # Start HTTP API server
  PI_AGENT_MODEL=anthropic/claude-sonnet-4-5 bun_pi_agent  # Use Anthropic model`);
}
