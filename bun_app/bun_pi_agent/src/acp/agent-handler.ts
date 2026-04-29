/**
 * ACP Agent Handler — implements the Agent interface from @agentclientprotocol/sdk.
 *
 * Handles the full ACP lifecycle:
 *   initialize → session/new → session/prompt (→ session/cancel)
 *
 * The handler receives an AgentSideConnection for bidirectional communication,
 * enabling it to send session/update notifications and call client methods.
 */
import type {
  AgentSideConnection,
  Agent,
  InitializeRequest,
  InitializeResponse,
  NewSessionRequest,
  NewSessionResponse,
  LoadSessionRequest,
  LoadSessionResponse,
  PromptRequest,
  PromptResponse,
  CancelNotification,
  AuthenticateRequest,
} from "@agentclientprotocol/sdk";
import type { AgentEvent } from "@mariozechner/pi-agent-core";
import { mapAgentEventToSessionUpdate } from "./event-mapper.js";
import {
  createSession,
  getSession,
  clearSessions,
  saveSessionConversation,
  accumulateSessionUsage,
} from "./session-store.js";
import { getAgentDefinition } from "../agent.js";
import { connectMcpServer } from "../mcp/client.js";
import { wrapMcpTools } from "../mcp/tool-wrapper.js";
import { createPermissionHook } from "./permissions.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROTOCOL_VERSION = 1;

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create an ACP Agent handler wired to a client connection.
 */
export function createAcpAgentHandler(
  conn: AgentSideConnection,
): Agent {
  return {
    // -----------------------------------------------------------------------
    // initialize — version + capability negotiation
    // -----------------------------------------------------------------------
    async initialize(
      params: InitializeRequest,
    ): Promise<InitializeResponse> {
      return {
        protocolVersion: PROTOCOL_VERSION,
        agentCapabilities: {
          loadSession: true,
          promptCapabilities: {
            image: false,
            audio: false,
            embeddedContext: false,
          },
          mcpCapabilities: {
            http: true,
            sse: true,
          },
        },
        agentInfo: {
          name: "bun_pi_agent",
          title: "Bun Pi Agent",
          version: "0.11.0",
        },
        authMethods: [],
      };
    },

    // -----------------------------------------------------------------------
    // authenticate — no-op (we don't require auth)
    // -----------------------------------------------------------------------
    async authenticate(
      params: AuthenticateRequest,
    ): Promise<void> {
      // No authentication required — API key comes from environment
    },

    // -----------------------------------------------------------------------
    // newSession — create a new agent instance for this conversation
    // -----------------------------------------------------------------------
    async newSession(
      params: NewSessionRequest,
    ): Promise<NewSessionResponse> {
      const cwd = params.cwd ?? process.cwd();
      const state = createSession(cwd, {
        agentName: getAgentDefinition()?.name,
      });

      // Store ACP connection reference for permission flow
      state.acpConnection = conn;

      // Attach permission hook — intercepts destructive tools (Write, Edit, Bash)
      state.agent.beforeToolCall = createPermissionHook(state.sessionId, conn);

      // Connect to MCP servers specified by the client
      if (params.mcpServers && params.mcpServers.length > 0) {
        const allMcpTools: any[] = [];
        for (const serverConfig of params.mcpServers) {
          try {
            const conn = await connectMcpServer(serverConfig);
            const tools = wrapMcpTools(conn);
            allMcpTools.push(...tools);
            state.mcpConnections.push(conn);
            console.log(`[mcp] Connected to "${serverConfig.name}": ${conn.tools.length} tools`);
          } catch (err) {
            console.error(`[mcp] Failed to connect to "${serverConfig.name}": ${(err as Error).message}`);
          }
        }
        // Add MCP tools to the agent's existing tools
        if (allMcpTools.length > 0) {
          const existingTools = state.agent.state.tools ?? [];
          state.agent.state.tools = [...existingTools, ...allMcpTools];
        }
      }

      return {
        sessionId: state.sessionId,
        // Optional: expose modes for the client
        modes: [
          {
            id: "code",
            name: "Code",
            description: "Full coding capabilities with all tools",
            tools: [
              { name: "read", description: "Read file contents" },
              { name: "write", description: "Write files" },
              { name: "edit", description: "Edit existing files" },
              { name: "bash", description: "Execute shell commands" },
              { name: "grep", description: "Search file contents" },
              { name: "find", description: "Find files by name" },
              { name: "ls", description: "List directory contents" },
            ],
          },
        ],
      };
    },

    // -----------------------------------------------------------------------
    // loadSession — resume a previous conversation by sessionId
    // -----------------------------------------------------------------------
    async loadSession(
      params: LoadSessionRequest,
    ): Promise<LoadSessionResponse> {
      const cwd = params.cwd ?? process.cwd();
      const state = createSession(cwd, {
        resumeFromId: params.sessionId,
        agentName: getAgentDefinition()?.name,
      });

      return {
        sessionId: state.sessionId,
      };
    },

    // -----------------------------------------------------------------------
    // prompt — process a user message, stream updates, return stop reason
    // -----------------------------------------------------------------------
    async prompt(
      params: PromptRequest,
    ): Promise<PromptResponse> {
      const state = getSession(params.sessionId);
      if (!state) {
        throw { code: -32602, message: `Session "${params.sessionId}" not found` };
      }

      // Fresh turn state: reset cancelled flag and abort controller
      state.cancelled = false;
      state.abortController = new AbortController();

      // Extract text from prompt content blocks
      const prompt = params.prompt
        .filter((block): block is { type: "text"; text: string } => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      if (!prompt.trim()) {
        return { stopReason: "end_turn" };
      }

      // Subscribe to agent events and stream as session/update notifications
      const unsubscribe = state.agent.subscribe(
        (event: AgentEvent) => {
          const update = mapAgentEventToSessionUpdate(event);
          if (update) {
            conn.sessionUpdate({
              sessionId: params.sessionId,
              update,
            }).catch(() => {
              // Connection may close during streaming — ignore write errors
            });
          }

          // Track token usage from turn_end events
          if (event.type === "turn_end") {
            accumulateSessionUsage(params.sessionId, event);
          }

          // Persist conversation history after each agent turn
          if (event.type === "agent_end") {
            try {
              saveSessionConversation(params.sessionId);
            } catch {
              // Persistence failure is non-fatal
            }
          }
        },
      );

      try {
        await state.agent.prompt(prompt);
      } catch (err) {
        if (state.cancelled || (err as any)?.name === "AbortError") {
          return { stopReason: "cancelled" };
        }
        return { stopReason: "end_turn" };
      } finally {
        unsubscribe();
      }

      return { stopReason: state.cancelled ? "cancelled" : "end_turn" };
    },

    // -----------------------------------------------------------------------
    // cancel — abort the current prompt turn
    // -----------------------------------------------------------------------
    async cancel(
      params: CancelNotification,
    ): Promise<void> {
      const state = getSession(params.sessionId);
      if (state) {
        state.cancelled = true;
        state.agent.abort();
        state.abortController.abort();
      }
    },

    // -----------------------------------------------------------------------
    // Extension methods — not implemented
    // -----------------------------------------------------------------------
    async extMethod(
      method: string,
      params: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
      throw { code: -32601, message: `Unknown method: ${method}` };
    },

    async extNotification(
      method: string,
      params: Record<string, unknown>,
    ): Promise<void> {
      // Ignore unknown notifications
    },
  };
}
