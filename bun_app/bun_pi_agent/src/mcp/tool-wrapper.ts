/**
 * Wraps MCP tools as pi-agent AgentTool instances.
 *
 * Each MCP tool becomes an AgentTool that:
 * - Validates input against the MCP tool's JSON Schema
 * - Calls the MCP server via the McpConnection
 * - Returns text content from the MCP result
 */
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { Type } from "@sinclair/typebox";
import type { TSchema, Static } from "@sinclair/typebox";
import type { McpConnection, McpTool } from "./client.js";

/**
 * Convert an MCP tool's inputSchema to a TypeBox schema.
 * MCP tools provide JSON Schema objects — TypeBox's Type.Unsafe() wraps them directly.
 */
function mcpSchemaToTypeBox(schema: McpTool["inputSchema"]): TSchema {
  return Type.Unsafe(schema) as TSchema;
}

/**
 * Create an AgentTool that wraps an MCP tool.
 */
export function wrapMcpTool(mcpTool: McpTool, connection: McpConnection): AgentTool {
  const schema = mcpSchemaToTypeBox(mcpTool.inputSchema);

  return {
    name: `mcp_${connection.serverName}_${mcpTool.name}`,
    description: mcpTool.description || `MCP tool: ${mcpTool.name} (from ${connection.serverName})`,
    label: mcpTool.name,
    parameters: schema,
    async execute(
      _toolCallId: string,
      params: Static<typeof schema>,
      _signal?: AbortSignal,
    ): Promise<AgentToolResult<{ mcpServer: string; mcpTool: string; isError?: boolean }>> {
      try {
        const result = await connection.callTool(mcpTool.name, params as Record<string, unknown>);

        const textParts = result.content
          .filter((c) => c.type === "text" && c.text)
          .map((c) => c.text!);

        return {
          content: [{ type: "text", text: textParts.join("\n") || "(empty response)" }],
          details: {
            mcpServer: connection.serverName,
            mcpTool: mcpTool.name,
            isError: result.isError,
          },
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `MCP error: ${(err as Error).message}` }],
          details: {
            mcpServer: connection.serverName,
            mcpTool: mcpTool.name,
            isError: true,
          },
        };
      }
    },
  };
}

/**
 * Wrap all tools from an MCP connection as AgentTools.
 */
export function wrapMcpTools(connection: McpConnection): AgentTool[] {
  return connection.tools.map((tool) => wrapMcpTool(tool, connection));
}
