import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { wrapMcpTool, wrapMcpTools } from "../tool-wrapper.js";
import type { McpConnection, McpTool } from "../client.js";

// ---------------------------------------------------------------------------
// Mock MCP connection for testing tool wrapper
// ---------------------------------------------------------------------------

function mockMcpConnection(name: string, tools: McpTool[]): McpConnection {
  let callLog: Array<{ name: string; args: Record<string, unknown> }> = [];

  return {
    serverName: name,
    tools,
    async callTool(toolName: string, args: Record<string, unknown>) {
      callLog.push({ name: toolName, args });
      return {
        content: [{ type: "text" as const, text: `Result of ${toolName}` }],
      };
    },
    close() {},
  };
}

describe("wrapMcpTool", () => {
  const testTool: McpTool = {
    name: "search",
    description: "Search for items",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number" },
      },
      required: ["query"],
    },
  };

  test("wraps MCP tool with prefixed name", () => {
    const conn = mockMcpConnection("my-server", [testTool]);
    const wrapped = wrapMcpTool(testTool, conn);
    expect(wrapped.name).toBe("mcp_my-server_search");
  });

  test("preserves description", () => {
    const conn = mockMcpConnection("my-server", [testTool]);
    const wrapped = wrapMcpTool(testTool, conn);
    expect(wrapped.description).toContain("Search for items");
  });

  test("sets label to original tool name", () => {
    const conn = mockMcpConnection("my-server", [testTool]);
    const wrapped = wrapMcpTool(testTool, conn);
    expect(wrapped.label).toBe("search");
  });

  test("execute returns text content from MCP result", async () => {
    const conn = mockMcpConnection("my-server", [testTool]);
    const wrapped = wrapMcpTool(testTool, conn);
    const result = await wrapped.execute("call-1", { query: "test" });
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Result of search");
  });

  test("execute details include server and tool names", async () => {
    const conn = mockMcpConnection("my-server", [testTool]);
    const wrapped = wrapMcpTool(testTool, conn);
    const result = await wrapped.execute("call-1", { query: "test" });
    expect(result.details.mcpServer).toBe("my-server");
    expect(result.details.mcpTool).toBe("search");
    expect(result.details.isError).toBeFalsy();
  });

  test("execute handles connection error gracefully", async () => {
    const failingConn: McpConnection = {
      serverName: "failing",
      tools: [testTool],
      async callTool() {
        throw new Error("Connection refused");
      },
      close() {},
    };
    const wrapped = wrapMcpTool(testTool, failingConn);
    const result = await wrapped.execute("call-1", { query: "test" });
    expect(result.details.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("MCP error");
  });

  test("tool without description gets default", () => {
    const noDescTool: McpTool = {
      name: "run",
      inputSchema: { type: "object" },
    };
    const conn = mockMcpConnection("srv", [noDescTool]);
    const wrapped = wrapMcpTool(noDescTool, conn);
    expect(wrapped.description).toContain("MCP tool: run");
  });
});

describe("wrapMcpTools", () => {
  test("wraps all tools from a connection", () => {
    const tools: McpTool[] = [
      { name: "search", description: "Search", inputSchema: { type: "object" } },
      { name: "create", description: "Create", inputSchema: { type: "object" } },
    ];
    const conn = mockMcpConnection("test-server", tools);
    const wrapped = wrapMcpTools(conn);
    expect(wrapped).toHaveLength(2);
    expect(wrapped[0].name).toBe("mcp_test-server_search");
    expect(wrapped[1].name).toBe("mcp_test-server_create");
  });

  test("returns empty array for connection with no tools", () => {
    const conn = mockMcpConnection("empty-server", []);
    const wrapped = wrapMcpTools(conn);
    expect(wrapped).toHaveLength(0);
  });
});
