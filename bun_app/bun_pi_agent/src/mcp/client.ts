/**
 * Lightweight MCP (Model Context Protocol) client.
 *
 * Connects to MCP servers via stdio or HTTP transport,
 * discovers their tools, and provides a call interface.
 *
 * Protocol: JSON-RPC 2.0 over stdio (subprocess) or HTTP (POST).
 */
import type { McpServer } from "@agentclientprotocol/sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface McpTool {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface McpConnection {
  readonly serverName: string;
  readonly tools: McpTool[];
  callTool(name: string, args: Record<string, unknown>): Promise<McpToolResult>;
  close(): void;
}

// ---------------------------------------------------------------------------
// JSON-RPC helpers
// ---------------------------------------------------------------------------

let nextId = 1;

function jsonrpcRequest(method: string, params?: Record<string, unknown>): string {
  return JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params: params ?? {} });
}

function parseJsonrpcResponse(data: string): { result?: unknown; error?: { code: number; message: string } } {
  const parsed = JSON.parse(data);
  if (parsed.error) return { error: parsed.error };
  return { result: parsed.result };
}

// ---------------------------------------------------------------------------
// Stdio transport — spawn subprocess, communicate via stdin/stdout
// ---------------------------------------------------------------------------

class StdioMcpConnection implements McpConnection {
  readonly serverName: string;
  readonly tools: McpTool[] = [];
  private proc: ReturnType<typeof Bun.spawn> | null = null;
  private buffer = "";

  constructor(serverConfig: Extract<McpServer, { command: string }>) {
    this.serverName = serverConfig.name;
    const env: Record<string, string> = {};
    for (const e of serverConfig.env ?? []) {
      env[e.name] = e.value;
    }
    Object.assign(env, process.env);

    this.proc = Bun.spawn([serverConfig.command, ...serverConfig.args], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      env,
    });
  }

  async initialize(): Promise<void> {
    // MCP initialize handshake
    const initResult = await this.sendRequest("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "bun_pi_agent", version: "0.11.0" },
    });
    // Send initialized notification (no response expected)
    this.sendNotification("notifications/initialized");

    // Discover tools
    const toolsResult = await this.sendRequest("tools/list", {}) as { tools: McpTool[] };
    this.tools.push(...(toolsResult.tools ?? []));
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<McpToolResult> {
    return await this.sendRequest("tools/call", { name, arguments: args }) as McpToolResult;
  }

  close(): void {
    try {
      this.proc?.stdin?.end();
      this.proc?.kill();
    } catch {}
    this.proc = null;
  }

  private sendNotification(method: string, params?: Record<string, unknown>): void {
    if (!this.proc?.stdin) return;
    const msg = JSON.stringify({ jsonrpc: "2.0", method, params });
    this.proc.stdin.write(msg + "\n");
  }

  private async sendRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.proc?.stdout || !this.proc?.stdin) {
        return reject(new Error(`MCP server "${this.serverName}" not connected`));
      }

      const msg = jsonrpcRequest(method, params);
      this.proc.stdin.write(msg + "\n");

      // Read response line from stdout
      const onData = (line: string) => {
        try {
          const resp = parseJsonrpcResponse(line);
          if (resp.error) {
            reject(new Error(`MCP error: ${resp.error.message} (${resp.error.code})`));
          } else {
            resolve(resp.result);
          }
        } catch (err) {
          reject(new Error(`MCP parse error: ${(err as Error).message}`));
        }
      };

      this.readLine().then(onData).catch(reject);
    });
  }

  private async readLine(): Promise<string> {
    // Read from stdout until we get a complete JSON line
    const reader = this.proc!.stdout.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) throw new Error("MCP server closed stdout");
        this.buffer += new TextDecoder().decode(value);
        const idx = this.buffer.indexOf("\n");
        if (idx !== -1) {
          const line = this.buffer.slice(0, idx);
          this.buffer = this.buffer.slice(idx + 1);
          return line.trim();
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// ---------------------------------------------------------------------------
// HTTP transport — POST JSON-RPC to URL
// ---------------------------------------------------------------------------

class HttpMcpConnection implements McpConnection {
  readonly serverName: string;
  readonly tools: McpTool[] = [];
  private url: string;
  private headers: Record<string, string> = {};

  constructor(serverConfig: Extract<McpServer, { url: string }>) {
    this.serverName = serverConfig.name;
    this.url = serverConfig.url;
    for (const h of serverConfig.headers ?? []) {
      this.headers[h.name] = h.value;
    }
    this.headers["Content-Type"] = "application/json";
  }

  async initialize(): Promise<void> {
    const initResult = await this.sendRequest("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "bun_pi_agent", version: "0.11.0" },
    });

    const toolsResult = await this.sendRequest("tools/list", {}) as { tools: McpTool[] };
    this.tools.push(...(toolsResult.tools ?? []));
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<McpToolResult> {
    return await this.sendRequest("tools/call", { name, arguments: args }) as McpToolResult;
  }

  close(): void {
    // HTTP connections are stateless — nothing to close
  }

  private async sendRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    const body = jsonrpcRequest(method, params);
    const resp = await fetch(this.url, {
      method: "POST",
      headers: this.headers,
      body,
    });

    if (!resp.ok) {
      throw new Error(`MCP HTTP ${resp.status}: ${await resp.text()}`);
    }

    const data = await resp.json();
    if (data.error) {
      throw new Error(`MCP error: ${data.error.message} (${data.error.code})`);
    }
    return data.result;
  }
}

// ---------------------------------------------------------------------------
// Connection factory
// ---------------------------------------------------------------------------

export async function connectMcpServer(server: McpServer): Promise<McpConnection> {
  let conn: McpConnection;

  if ("command" in server) {
    conn = new StdioMcpConnection(server);
  } else if ("url" in server) {
    conn = new HttpMcpConnection(server as any);
  } else {
    throw new Error(`Unsupported MCP server config: ${JSON.stringify(server)}`);
  }

  await conn.initialize();
  return conn;
}
