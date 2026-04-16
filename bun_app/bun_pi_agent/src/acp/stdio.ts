/**
 * ACP stdio transport — sets up the AgentSideConnection over stdin/stdout.
 *
 * This is the primary mode for editor integration. The agent runs as a
 * subprocess of the editor, communicating via newline-delimited JSON-RPC.
 *
 * Usage:
 *   bun src/index.ts              # default: stdio mode
 *   bun src/index.ts --stdio      # explicit stdio mode
 */
import {
  AgentSideConnection,
  ndJsonStream,
} from "@agentclientprotocol/sdk";
import type { AnyMessage } from "@agentclientprotocol/sdk";
import { createAcpAgentHandler } from "./agent-handler.js";

// ---------------------------------------------------------------------------
// Stdin → ReadableStream adapter
// ---------------------------------------------------------------------------

function readableStreamFromStdin(): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      process.stdin.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      process.stdin.on("end", () => {
        controller.close();
      });
      process.stdin.on("error", (err) => {
        controller.error(err);
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Stdout ← WritableStream adapter
// ---------------------------------------------------------------------------

function writableStreamToStdout(): WritableStream<Uint8Array> {
  return new WritableStream({
    write(chunk) {
      process.stdout.write(chunk);
    },
  });
}

// ---------------------------------------------------------------------------
// Start stdio transport
// ---------------------------------------------------------------------------

export function startStdio(): void {
  // Log to stderr (stdout is reserved for JSON-RPC messages)
  const log = (...args: unknown[]) => process.stderr.write(args.join(" ") + "\n");

  log("bun_pi_agent: starting ACP stdio mode");

  const input = readableStreamFromStdin();
  const output = writableStreamToStdout();
  const stream = ndJsonStream(output, input);

  const conn = new AgentSideConnection(
    (connection) => createAcpAgentHandler(connection),
    stream,
  );

  // Clean exit when the client closes the connection
  conn.closed
    .then(() => {
      log("bun_pi_agent: connection closed");
      process.exit(0);
    })
    .catch((err: unknown) => {
      log("bun_pi_agent: connection error:", err);
      process.exit(1);
    });

  // Also exit when stdin closes (client process died)
  process.stdin.on("close", () => {
    log("bun_pi_agent: stdin closed");
    process.exit(0);
  });
}
