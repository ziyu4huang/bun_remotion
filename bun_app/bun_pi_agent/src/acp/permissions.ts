/**
 * Permission flow for ACP tool calls.
 *
 * Intercepts destructive tool calls (Write, Edit, Bash) and asks
 * the client for permission via the ACP requestPermission protocol.
 *
 * Tools requiring permission are configurable. The flow:
 * 1. beforeToolCall hook checks if tool needs permission
 * 2. If yes, sends requestPermission to client via ACP connection
 * 3. Client shows UI, user approves/rejects
 * 4. If rejected, tool is blocked; if approved, tool executes
 */
import type { AgentSideConnection } from "@agentclientprotocol/sdk";
import type { BeforeToolCallContext, BeforeToolCallResult } from "@mariozechner/pi-agent-core";

/** Tool names that require permission before execution */
const PERMISSION_TOOLS = new Set(["Write", "Edit", "Bash"]);

/** Allow-always decisions cached per session: toolName → true */
const alwaysAllowed = new Map<string, Set<string>>();
/** Reject-always decisions cached per session: toolName → true */
const alwaysRejected = new Map<string, Set<string>>();

/** Check if a tool name requires permission */
export function requiresPermission(toolName: string): boolean {
  return PERMISSION_TOOLS.has(toolName);
}

/** Clear cached permission decisions (for testing or session reset) */
export function clearPermissionCache(): void {
  alwaysAllowed.clear();
  alwaysRejected.clear();
}

/**
 * Create a beforeToolCall hook that enforces permission flow via ACP.
 *
 * Returns undefined if the tool doesn't need permission (passthrough).
 * Returns { block: true } if permission is denied.
 * Returns undefined if permission is granted.
 */
export function createPermissionHook(
  sessionId: string,
  conn: AgentSideConnection,
): (context: BeforeToolCallContext, signal?: AbortSignal) => Promise<BeforeToolCallResult | undefined> {
  return async (context: BeforeToolCallContext, signal?: AbortSignal) => {
    const toolName = context.toolCall.toolName;

    if (!requiresPermission(toolName)) {
      return undefined; // passthrough — no permission needed
    }

    // Check cached "always" decisions
    const allowed = alwaysAllowed.get(sessionId);
    if (allowed?.has(toolName)) return undefined;

    const rejected = alwaysRejected.get(sessionId);
    if (rejected?.has(toolName)) {
      return { block: true, reason: `Tool "${toolName}" is permanently rejected for this session` };
    }

    // Ask client for permission
    try {
      const response = await conn.requestPermission({
        sessionId,
        toolCall: {
          name: toolName,
          content: [
            {
              type: "text",
              text: formatToolCallSummary(context),
            },
          ],
        },
        options: [
          { optionId: "allow_once", name: "Allow once", kind: "allow_once" },
          { optionId: "allow_always", name: "Always allow", kind: "allow_always" },
          { optionId: "reject_once", name: "Reject", kind: "reject_once" },
          { optionId: "reject_always", name: "Always reject", kind: "reject_always" },
        ],
      });

      const outcome = response.outcome;

      // Cancelled (client cancelled the prompt turn)
      if (outcome.outcome === "cancelled") {
        return { block: true, reason: "Permission request cancelled" };
      }

      // Selected an option
      const selectedId = outcome.optionId;

      if (selectedId === "allow_once") {
        return undefined; // allow this call
      }
      if (selectedId === "allow_always") {
        if (!alwaysAllowed.has(sessionId)) alwaysAllowed.set(sessionId, new Set());
        alwaysAllowed.get(sessionId)!.add(toolName);
        return undefined;
      }
      if (selectedId === "reject_once") {
        return { block: true, reason: `Tool "${toolName}" was rejected by user` };
      }
      if (selectedId === "reject_always") {
        if (!alwaysRejected.has(sessionId)) alwaysRejected.set(sessionId, new Set());
        alwaysRejected.get(sessionId)!.add(toolName);
        return { block: true, reason: `Tool "${toolName}" is permanently rejected for this session` };
      }

      // Unknown option — reject for safety
      return { block: true, reason: `Unknown permission option: ${selectedId}` };
    } catch (err) {
      // Permission request failed (connection error, timeout, etc.)
      // Default: block the tool for safety
      return { block: true, reason: `Permission request failed: ${(err as Error).message}` };
    }
  };
}

/** Format a brief summary of the tool call for the permission UI */
function formatToolCallSummary(context: BeforeToolCallContext): string {
  const args = context.args as Record<string, unknown>;
  const toolName = context.toolCall.toolName;

  if (toolName === "Bash" && args.command) {
    return `Execute: ${String(args.command).slice(0, 200)}`;
  }
  if (toolName === "Write" && args.file_path) {
    return `Write file: ${String(args.file_path)}`;
  }
  if (toolName === "Edit" && args.file_path) {
    return `Edit file: ${String(args.file_path)}`;
  }
  return `${toolName}(${JSON.stringify(args).slice(0, 200)})`;
}
