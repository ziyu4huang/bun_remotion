import { describe, test, expect, afterAll } from "bun:test";
import { spawn, type Subprocess } from "bun";

// ---------------------------------------------------------------------------
// JSON-RPC 2.0 helpers
// ---------------------------------------------------------------------------

let nextId = 1;

function makeRequest(method: string, params: Record<string, unknown>): string {
  return JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }) + "\n";
}

interface PendingRequest {
  id: number;
  resolve: (result: unknown) => void;
  reject: (err: Error) => void;
}

const pending = new Map<number, PendingRequest>();

function waitForResponse(id: number, timeoutMs = 10_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timeout waiting for response id=${id}`));
    }, timeoutMs);
    pending.set(id, {
      id,
      resolve: (result) => { clearTimeout(timer); resolve(result); },
      reject: (err) => { clearTimeout(timer); reject(err); },
    });
  });
}

// ---------------------------------------------------------------------------
// Subprocess management
// ---------------------------------------------------------------------------

let proc: Subprocess<"pipe", "pipe", "pipe"> | null = null;
const notifications: Array<{ method: string; params: any }> = [];
let buffer = "";

function handleMessage(msg: any) {
  if (msg.id != null) {
    const req = pending.get(msg.id);
    if (req) {
      pending.delete(msg.id);
      if (msg.error) req.reject(new Error(msg.error.message));
      else req.resolve(msg.result);
    }
  } else if (msg.method) {
    notifications.push({ method: msg.method, params: msg.params });
  }
}

async function readStdout() {
  if (!proc) return;
  const reader = proc.stdout.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop()!; // keep incomplete line in buffer
      for (const line of lines) {
        if (line.trim()) {
          try { handleMessage(JSON.parse(line)); } catch { /* ignore */ }
        }
      }
    }
  } catch { /* stream closed */ }
}

async function spawnAgent(): Promise<void> {
  proc = spawn({
    cmd: ["bun", "src/index.ts"],
    cwd: import.meta.dir + "/../",
    stdout: "pipe",
    stdin: "pipe",
    stderr: "pipe",
    env: { ...process.env, PI_AGENT_E2E_MOCK: "1" },
  });
  buffer = "";
  // Start reading stdout in background
  readStdout();
  // Give the process time to start
  await new Promise((r) => setTimeout(r, 200));
}

function writeStdin(data: string) {
  proc!.stdin.write(data);
  proc!.stdin.flush();
}

async function killAgent() {
  if (proc) {
    proc.kill();
    await proc.exited.catch(() => {});
    proc = null;
  }
  pending.clear();
  notifications.length = 0;
}

afterAll(async () => {
  await killAgent();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ACP stdio lifecycle", () => {
  test("agent starts and responds to initialize", async () => {
    await spawnAgent();

    const id = nextId;
    writeStdin(makeRequest("initialize", {
      protocolVersion: 1,
      clientCapabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" },
    }));

    const result = await waitForResponse(id) as any;
    expect(result).toBeDefined();
    expect(result.agentInfo).toBeDefined();
    expect(result.agentInfo.name).toBeDefined();
  });

  test("session/new returns sessionId", async () => {
    const id = nextId;
    writeStdin(makeRequest("session/new", {
      cwd: process.cwd(),
      mcpServers: [],
    }));

    const result = await waitForResponse(id) as any;
    expect(result).toBeDefined();
    expect(result.sessionId).toBeDefined();
    expect(typeof result.sessionId).toBe("string");
  });

  test("session/prompt completes with stopReason", async () => {
    const sessId = nextId;
    writeStdin(makeRequest("session/new", {
      cwd: process.cwd(),
      mcpServers: [],
    }));
    const sessionResult = await waitForResponse(sessId) as any;

    notifications.length = 0;
    const promptId = nextId;
    writeStdin(makeRequest("session/prompt", {
      sessionId: sessionResult.sessionId,
      prompt: [{ type: "text", text: "hello" }],
    }));

    const result = await waitForResponse(promptId, 15_000) as any;
    expect(result).toBeDefined();
    expect(result.stopReason).toBeDefined();
  });

  test("agent exits cleanly on stdin close", async () => {
    proc!.stdin.end();
    const exitCode = await proc!.exited;
    expect(exitCode === 0 || exitCode === 143).toBe(true);
    proc = null;
  });
});
