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
} from "./session-store.js";

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
          loadSession: false,
          promptCapabilities: {
            image: false,
            audio: false,
            embeddedContext: false,
          },
          mcpCapabilities: {
            http: false,
            sse: false,
          },
        },
        agentInfo: {
          name: "bun_pi_agent",
          title: "Bun Pi Agent",
          version: "0.5.0",
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
      const state = createSession(cwd);

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
    // prompt — process a user message, stream updates, return stop reason
    // -----------------------------------------------------------------------
    async prompt(
      params: PromptRequest,
    ): Promise<PromptResponse> {
      const state = getSession(params.sessionId);
      if (!state) {
        throw { code: -32602, message: `Session "${params.sessionId}" not found` };
      }

      // Extract text from prompt content blocks
      const prompt = params.prompt
        .filter((block): block is { type: "text"; text: string } => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      if (!prompt.trim()) {
        return { stopReason: "end_turn" };
      }

      // Track cancellation
      let cancelled = false;

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

          // Detect cancellation via agent_end after abort
          if (event.type === "agent_end" && state.agent.state.isStreaming === false) {
            // Agent has finished (possibly due to abort)
          }
        },
      );

      try {
        await state.agent.prompt(prompt);
      } catch (err) {
        // Agent was aborted — check if it was a cancellation
        if ((err as any)?.name === "AbortError" || cancelled) {
          return { stopReason: "cancelled" };
        }
        // Other errors — treat as end_turn, error content was streamed
        return { stopReason: "end_turn" };
      } finally {
        unsubscribe();
      }

      return { stopReason: cancelled ? "cancelled" : "end_turn" };
    },

    // -----------------------------------------------------------------------
    // cancel — abort the current prompt turn
    // -----------------------------------------------------------------------
    async cancel(
      params: CancelNotification,
    ): Promise<void> {
      const state = getSession(params.sessionId);
      if (state) {
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
