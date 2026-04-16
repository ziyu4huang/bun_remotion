/**
 * bun_pi_agent — ACP Demo Client
 *
 * Walks through every ACP endpoint against a running bun_pi_agent server.
 *
 * Usage:
 *   bun src/demo.ts [--host 127.0.0.1] [--port 3456]
 *
 * Start the server first:
 *   bun run --cwd bun_app/bun_pi_agent server
 */

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
let host = "127.0.0.1";
let port = 3456;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--host" && args[i + 1]) host = args[++i];
  else if (args[i] === "--port" && args[i + 1]) port = parseInt(args[++i], 10);
  else if (args[i] === "--help" || args[i] === "-h") {
    console.log("Usage: bun src/demo.ts [--host HOST] [--port PORT]");
    console.log("  Defaults: --host 127.0.0.1 --port 3456");
    process.exit(0);
  }
}

const BASE = `http://${host}:${port}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

function log(label: string, data: unknown) {
  console.log(`\n${BOLD}${CYAN}${label}${RESET}`);
  console.log(DIM + "─".repeat(50) + RESET);
  console.log(JSON.stringify(data, null, 2));
}

async function request(method: string, path: string, body?: unknown): Promise<{ status: number; data: unknown }> {
  const opts: RequestInit = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Demo steps
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n${BOLD}bun_pi_agent — ACP Demo${RESET}`);
  console.log(`Server: ${BASE}\n`);

  // Check server is up
  try {
    await fetch(`${BASE}/ping`);
  } catch {
    console.error(`${RED}Server not reachable at ${BASE}${RESET}`);
    console.error(`Start it with: ${BOLD}bun run --cwd bun_app/bun_pi_agent server${RESET}`);
    process.exit(1);
  }

  // 1. GET /ping
  {
    const { status, data } = await request("GET", "/ping");
    log("1. GET /ping — health check", { status, response: data });
  }

  // 2. GET /agents
  {
    const { status, data } = await request("GET", "/agents");
    log("2. GET /agents — list agent manifests", { status, response: data });
  }

  // 3. GET /agents/bun_pi_agent
  {
    const { status, data } = await request("GET", "/agents/bun_pi_agent");
    log("3. GET /agents/bun_pi_agent — single agent manifest", { status, response: data });
  }

  // 4. POST /runs (sync) — simple question that doesn't need tools
  let syncRunId: string | undefined;
  {
    const { status, data } = await request("POST", "/runs", {
      agent_name: "bun_pi_agent",
      input: [{ parts: [{ content: "Say exactly: Hello from ACP demo!" }] }],
      mode: "sync",
    });
    syncRunId = (data as any)?.run_id;
    log("4. POST /runs (sync) — create run, wait for completion", { status, response: data });
  }

  if (!syncRunId) {
    console.log(`\n${RED}Sync run failed — skipping dependent demos${RESET}`);
    process.exit(1);
  }

  // 5. GET /runs/:id
  {
    const { status, data } = await request("GET", `/runs/${syncRunId}`);
    log("5. GET /runs/:id — run status + token usage", { status, runId: syncRunId, response: data });
  }

  // 6. GET /runs/:id/events
  {
    const { status, data } = await request("GET", `/runs/${syncRunId}/events`);
    const eventTypes = (data as any)?.events?.map((e: any) => e.type);
    log("6. GET /runs/:id/events — event history", {
      status,
      runId: syncRunId,
      eventCount: eventTypes?.length,
      eventTypes,
    });
  }

  // 7. POST /runs (stream) — SSE streaming
  let streamRunId: string | undefined;
  {
    console.log(`\n${BOLD}${CYAN}7. POST /runs (stream) — SSE real-time events${RESET}`);
    console.log(DIM + "─".repeat(50) + RESET);

    const res = await fetch(`${BASE}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_name: "bun_pi_agent",
        input: [{ parts: [{ content: "Say exactly: Streaming works!" }] }],
        mode: "stream",
      }),
    });

    if (!res.ok || !res.body) {
      console.log(`${RED}Stream request failed: ${res.status}${RESET}`);
    } else {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let eventCount = 0;
      let runId: string | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        // Parse SSE lines: "event: type\ndata: json\n\n"
        for (const line of text.split("\n")) {
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7);
            process.stdout.write(`  ${GREEN}${eventType}${RESET}`);
            eventCount++;

            // Extract run_id from run.created event
            if (eventType === "run.created") {
              const nextLine = text.split("\n")[text.split("\n").indexOf(line) + 1];
              if (nextLine?.startsWith("data: ")) {
                try {
                  const evt = JSON.parse(nextLine.slice(6));
                  runId = evt.run?.run_id;
                } catch {}
              }
            }
          }
          if (line.startsWith("data: ") && line.includes('"content"')) {
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.part?.content) {
                process.stdout.write(` ${DIM}${evt.part.content.slice(0, 60)}${RESET}`);
              }
            } catch {}
          }
        }
      }

      streamRunId = runId;
      console.log(`\n  Total events: ${eventCount}`);
    }
  }

  // 8. POST /runs/:id/cancel — create a long-running run, then cancel
  {
    console.log(`\n${BOLD}${CYAN}8. POST /runs/:id/cancel — cancel a running run${RESET}`);
    console.log(DIM + "─".repeat(50) + RESET);

    // Create a run that will take time (asks agent to do tool work)
    const { data: createData } = await request("POST", "/runs", {
      agent_name: "bun_pi_agent",
      input: [{ parts: [{ content: "List all files in the current directory recursively, then count lines in each." }] }],
      mode: "async",
    });
    const longRunId = (createData as any)?.run_id;

    if (!longRunId) {
      console.log(`${YELLOW}Could not create long-running run (async may block in current impl)${RESET}`);
    } else {
      // Small delay then cancel
      await sleep(100);
      const { status, data } = await request("POST", `/runs/${longRunId}/cancel`);
      log("  Cancel result", { status, runId: longRunId, response: data });
    }
  }

  // Summary
  console.log(`\n${BOLD}${GREEN}Demo complete!${RESET}`);
  console.log(`Sync run: ${syncRunId ?? "n/a"}`);
  console.log(`Stream run: ${streamRunId ?? "n/a"}`);
  console.log();
}

main().catch((err) => {
  console.error(`${RED}Fatal: ${err.message}${RESET}`);
  process.exit(1);
});
