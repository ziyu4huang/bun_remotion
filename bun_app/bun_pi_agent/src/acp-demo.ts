/**
 * bun_pi_agent — ACP Demo Client
 *
 * Spawns the agent as a subprocess and communicates via JSON-RPC 2.0 over stdio.
 * Walks through the full ACP lifecycle:
 *   initialize → session/new → session/prompt → session/cancel
 *
 * Usage:
 *   bun src/acp-demo.ts [--ask "your question"]
 *
 * The agent binary must be built first:
 *   bun run --cwd bun_app/bun_pi_agent build
 */

import { spawn } from "child_process";
import { createInterface } from "readline";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
let askPrompt: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--ask" && args[i + 1]) askPrompt = args[++i];
  else if (args[i] === "--help" || args[i] === "-h") {
    console.log("Usage: bun src/acp-demo.ts [--ask \"your question\"]");
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------
// ANSI colors
// ---------------------------------------------------------------------------

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

// ---------------------------------------------------------------------------
// JSON-RPC helpers
// ---------------------------------------------------------------------------

let nextId = 1;

function makeRequest(method: string, params: Record<string, unknown>): string {
  return JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }) + "\n";
}

function makeNotification(method: string, params: Record<string, unknown>): string {
  return JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n";
}

// ---------------------------------------------------------------------------
// Response tracking
// ---------------------------------------------------------------------------

interface PendingRequest {
  id: number;
  method: string;
  resolve: (result: unknown) => void;
  reject: (err: Error) => void;
}

const pending = new Map<number, PendingRequest>();

function waitForResponse(id: number, method: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    pending.set(id, { id, method, resolve, reject });
  });
}

// ---------------------------------------------------------------------------
// Spawn agent subprocess
// ---------------------------------------------------------------------------

console.log(`\n${BOLD}${CYAN}bun_pi_agent — ACP Demo (stdio)${RESET}\n`);

const agentBin = process.argv[1]?.replace("acp-demo.ts", "index.ts") ?? "src/index.ts";
const agentPath = askPrompt ? agentBin : agentBin;

const proc = spawn("bun", [agentPath], {
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env },
});

// Parse JSON-RPC messages from agent stdout (newline-delimited)
const rl = createInterface({ input: proc.stdout! });

rl.on("line", (line) => {
  try {
    const msg = JSON.parse(line);

    // Response to our request
    if (msg.id !== undefined && msg.id !== null) {
      const req = pending.get(msg.id);
      if (req) {
        pending.delete(msg.id);
        if (msg.error) {
          req.reject(new Error(msg.error.message ?? JSON.stringify(msg.error)));
        } else {
          req.resolve(msg.result);
        }
      }
      return;
    }

    // Notification from agent
    if (msg.method === "session/update") {
      const update = msg.params?.update;
      if (!update) return;

      switch (update.sessionUpdate) {
        case "agent_message_chunk":
          process.stdout.write(update.content?.text ?? "");
          break;
        case "agent_thought_chunk":
          process.stdout.write(`${DIM}${update.content?.text ?? ""}${RESET}`);
          break;
        case "tool_call":
          console.log(`\n  ${YELLOW}[tool: ${update.title}]${RESET} (pending)`);
          break;
        case "tool_call_update":
          if (update.status === "in_progress") {
            // Tool running — no output
          } else if (update.status === "completed") {
            console.log(`  ${GREEN}[tool completed]${RESET}`);
          } else if (update.status === "failed") {
            console.log(`  ${RED}[tool failed]${RESET}`);
          }
          break;
        default:
          // Other updates — ignore
          break;
      }
    }
  } catch {
    // Ignore non-JSON lines
  }
});

// Log agent stderr
proc.stderr!.on("data", (data: Buffer) => {
  const text = data.toString().trim();
  if (text) console.log(`${DIM}[agent stderr] ${text}${RESET}`);
});

proc.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.log(`\n${RED}Agent exited with code ${code}${RESET}`);
  }
  process.exit(code ?? 0);
});

// ---------------------------------------------------------------------------
// Send a JSON-RPC request and wait for the response
// ---------------------------------------------------------------------------

async function rpc(method: string, params: Record<string, unknown>): Promise<unknown> {
  const id = nextId;
  const req = makeRequest(method, params);
  proc.stdin!.write(req);
  return waitForResponse(id, method);
}

// ---------------------------------------------------------------------------
// Demo lifecycle
// ---------------------------------------------------------------------------

async function main() {
  try {
    // 1. Initialize
    console.log(`${BOLD}1. initialize${RESET}`);
    const initResult = await rpc("initialize", {
      protocolVersion: 1,
      clientCapabilities: {},
      clientInfo: { name: "acp-demo", version: "1.0.0" },
    });
    console.log(`   ${GREEN}OK${RESET} — agent: ${(initResult as any)?.agentInfo?.name} v${(initResult as any)?.agentInfo?.version}`);

    // 2. Create session
    console.log(`\n${BOLD}2. session/new${RESET}`);
    const sessionResult = await rpc("session/new", {
      cwd: process.cwd(),
      mcpServers: [],
    });
    const sessionId = (sessionResult as any)?.sessionId;
    console.log(`   ${GREEN}OK${RESET} — sessionId: ${sessionId}`);

    if (!sessionId) {
      throw new Error("No sessionId returned");
    }

    // 3. Prompt
    const prompt = askPrompt ?? "Say exactly: Hello from ACP!";
    console.log(`\n${BOLD}3. session/prompt${RESET}`);
    console.log(`   Prompt: "${prompt}"`);
    console.log(`   ${DIM}--- agent output ---${RESET}`);

    const promptResult = await rpc("session/prompt", {
      sessionId,
      prompt: [{ type: "text", text: prompt }],
    });
    console.log(`\n   ${GREEN}OK${RESET} — stopReason: ${(promptResult as any)?.stopReason}`);

    // 4. Optional cancel demo (only if not using --ask)
    if (!askPrompt) {
      console.log(`\n${BOLD}4. session/cancel demo${RESET}`);
      console.log(`   Sending cancel while prompting...`);

      // Start a new prompt, then immediately cancel
      const cancelPromptId = nextId;
      const cancelReq = makeRequest("session/prompt", {
        sessionId,
        prompt: [{ type: "text", text: "Count from 1 to 100 slowly, one number per line." }],
      });
      proc.stdin!.write(cancelReq);

      // Small delay then send cancel notification
      await new Promise((r) => setTimeout(r, 200));
      proc.stdin!.write(makeNotification("session/cancel", { sessionId }));

      try {
        const cancelResult = await waitForResponse(cancelPromptId, "session/prompt");
        console.log(`   ${GREEN}OK${RESET} — stopReason: ${(cancelResult as any)?.stopReason}`);
      } catch (err) {
        console.log(`   ${RED}Error: ${(err as Error).message}${RESET}`);
      }
    }

    // Summary
    console.log(`\n${BOLD}${GREEN}Demo complete!${RESET}`);
    console.log(`Protocol: JSON-RPC 2.0 over stdio`);
    console.log(`Session: ${sessionId}`);
    console.log();

  } catch (err) {
    console.error(`\n${RED}Fatal: ${(err as Error).message}${RESET}`);
    proc.kill();
    process.exit(1);
  }
}

main();
