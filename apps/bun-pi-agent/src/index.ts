import { startCli } from "./cli/index.js";
import { startServer } from "./server/index.js";

const args = process.argv.slice(2);

let mode: "cli" | "server" = "cli";

for (const arg of args) {
  if (arg === "--server" || arg === "--mode=server") {
    mode = "server";
  } else if (arg === "--mode=cli" || arg === "--cli") {
    mode = "cli";
  } else if (arg === "--help" || arg === "-h") {
    console.log("Usage: bun-pi-agent [options]");
    console.log("");
    console.log("Options:");
    console.log("  --mode=cli     Interactive CLI (default)");
    console.log("  --mode=server  HTTP API server with SSE");
    console.log("  --server       Shorthand for --mode=server");
    console.log("  --cli          Shorthand for --mode=cli");
    console.log("  --help, -h     Show this help");
    console.log("");
    console.log("Environment variables:");
    console.log("  PI_AGENT_MODEL   Provider/model (default: anthropic/claude-sonnet-4-5)");
    console.log("  PI_AGENT_HOST   Server host (default: 127.0.0.1)");
    console.log("  PI_AGENT_PORT   Server port (default: 3456)");
    console.log("  PI_AGENT_WORKDIR Working directory (default: cwd)");
    process.exit(0);
  }
}

if (mode === "server") {
  startServer();
} else {
  startCli();
}
