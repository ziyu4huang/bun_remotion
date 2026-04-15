import { randomUUID } from "crypto";
import { createAgent } from "../../agent.js";
import type { AgentEvent } from "@mariozechner/pi-agent-core";
import type {
  AgentManifest,
  Event as ACPEvent,
  Message,
  MessagePart,
  Run,
  RunMode,
} from "acp-sdk";
import {
  getRun,
  setRun,
  listRuns,
  saveRun,
  deleteRun,
  EMPTY_USAGE,
  accumulateUsage,
  type RunState,
  type TokenUsage,
} from "../../store.js";

// ---------------------------------------------------------------------------
// Agent manifest — describes this coding agent to ACP clients
// ---------------------------------------------------------------------------
const CODING_AGENT: AgentManifest = {
  name: "bun_pi_agent",
  description:
    "Coding assistant that can read, write, edit, and search files, list directories, and execute bash commands.",
  input_content_types: ["text/plain"],
  output_content_types: ["text/plain"],
  metadata: {
    framework: "pi-agent",
    capabilities: [
      { name: "read", description: "Read file contents" },
      { name: "write", description: "Write files" },
      { name: "edit", description: "Edit existing files" },
      { name: "bash", description: "Execute shell commands" },
      { name: "grep", description: "Search file contents" },
      { name: "find", description: "Find files by name" },
      { name: "ls", description: "List directory contents" },
    ],
    domains: ["software-engineering"],
    tags: ["Chat", "Code", "Tools"],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract text from an array of ACP Messages */
function messagesToPrompt(input: Message[]): string {
  return input
    .flatMap((m) => m.parts.map((p) => p.content ?? ""))
    .filter(Boolean)
    .join("\n");
}

/** Map pi-agent events → ACP events appended to run */
function piEventToACP(event: AgentEvent): ACPEvent | null {
  switch (event.type) {
    case "message_update": {
      const evt = event.assistantMessageEvent;
      if (evt.type === "text_delta") {
        return {
          type: "message.part",
          part: {
            content_type: "text/plain",
            content: evt.delta,
          },
        };
      }
      if (evt.type === "thinking_delta") {
        return {
          type: "message.part",
          part: {
            content_type: "text/plain",
            content: evt.delta,
            metadata: { kind: "trajectory", message: "thinking" },
          },
        };
      }
      if (evt.type === "toolcall_start") {
        return {
          type: "message.part",
          part: {
            content_type: "text/plain",
            content: `[tool: ${event.toolName || "unknown"}]`,
            metadata: {
              kind: "trajectory",
              tool_name: event.toolName,
            },
          },
        };
      }
      return null;
    }

    case "tool_execution_start":
      return {
        type: "message.part",
        part: {
          content_type: "text/plain",
          content: `▶ ${event.toolName}${event.args?.path ? `: ${event.args.path}` : event.args?.command ? `: ${String(event.args.command).slice(0, 80)}` : ""}`,
          metadata: {
            kind: "trajectory",
            tool_name: event.toolName,
            tool_input: event.args as Record<string, unknown>,
          },
        },
      };

    case "tool_execution_end":
      if (event.isError) {
        const result = event.result as { content?: Array<{ text?: string }> };
        return {
          type: "message.part",
          part: {
            content_type: "text/plain",
            content: `✗ ${event.toolName} error`,
            metadata: {
              kind: "trajectory",
              tool_name: event.toolName,
              tool_output: { error: result?.content?.[0]?.text ?? "unknown" },
            },
          },
        };
      }
      return null;

    case "agent_end":
      return null;

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/** GET /ping */
export function handlePing(): Response {
  return Response.json({});
}

/** GET /agents */
export function handleAgentsList(): Response {
  return Response.json({ agents: [CODING_AGENT] });
}

/** GET /agents/:name */
export function handleAgentRead(name: string): Response {
  if (name !== CODING_AGENT.name) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }
  return Response.json(CODING_AGENT);
}

/** POST /runs — create a run (sync, async, or stream) */
export async function handleRunCreate(req: Request): Promise<Response> {
  let body: {
    agent_name?: string;
    input?: Message[];
    mode?: RunMode;
    session_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.agent_name || body.agent_name !== CODING_AGENT.name) {
    return Response.json(
      { error: `Unknown agent "${body.agent_name}"` },
      { status: 404 },
    );
  }

  const mode: RunMode = body.mode || "sync";
  const input = body.input || [];

  if (input.length === 0) {
    return Response.json(
      { error: "input must contain at least one Message" },
      { status: 400 },
    );
  }

  const runId = randomUUID();
  const sessionId = body.session_id ?? randomUUID();
  const abortController = new AbortController();

  const now = new Date().toISOString();
  const run: Run = {
    run_id: runId,
    agent_name: CODING_AGENT.name,
    session_id: sessionId,
    status: "created",
    output: [],
    created_at: now,
  };

  const state: RunState = {
    run,
    events: [{ type: "run.created", run }],
    usage: { ...EMPTY_USAGE },
    agent: null,
    abortController,
  };
  setRun(runId, state);

  // Execute the agent
  const execute = async () => {
    const agent = createAgent();
    state.agent = agent;
    run.status = "in-progress";
    state.events.push({ type: "run.in-progress", run });

    const prompt = messagesToPrompt(input);

    // Start message
    const startEvent: ACPEvent = {
      type: "message.created",
      message: {
        role: "agent",
        parts: [],
        created_at: new Date().toISOString(),
        completed_at: null,
      },
    };
    state.events.push(startEvent);
    let currentParts: MessagePart[] = [];

    agent.subscribe((event: AgentEvent) => {
      // Accumulate token usage from turn_end events
      state.usage = accumulateUsage(state.usage, event);

      const acpEvent = piEventToACP(event);
      if (acpEvent) {
        state.events.push(acpEvent);
        if (acpEvent.type === "message.part") {
          currentParts.push(acpEvent.part);
        }
      }

      if (event.type === "agent_end") {
        // Complete the output message
        const completedMsg: Message = {
          role: "agent",
          parts: currentParts.length > 0 ? currentParts : [{ content_type: "text/plain", content: "" }],
          created_at: startEvent.message!.created_at!,
          completed_at: new Date().toISOString(),
        };
        run.output.push(completedMsg);
        state.events.push({ type: "message.completed", message: completedMsg });

        run.status = "completed";
        run.finished_at = new Date().toISOString();
        state.events.push({ type: "run.completed", run });

        // Persist completed run to disk
        saveRun(runId);
      }
    });

    try {
      await agent.prompt(prompt);
    } catch (err) {
      if (run.status !== "cancelled") {
        run.status = "failed";
        run.error = { code: 500, message: String(err) };
        state.events.push({ type: "run.failed", run });
        saveRun(runId);
      }
    }
  };

  if (mode === "stream") {
    // Stream: return SSE immediately, execute in background
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const sendEvent = (evt: ACPEvent) => {
          controller.enqueue(
            encoder.encode(`event: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`),
          );
        };

        // Send events already collected
        for (const evt of state.events) {
          sendEvent(evt);
        }

        // Poll for new events
        let sentCount = state.events.length;
        const interval = setInterval(() => {
          while (sentCount < state.events.length) {
            sendEvent(state.events[sentCount]);
            sentCount++;
          }
          if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") {
            clearInterval(interval);
            controller.close();
          }
        }, 50);

        // Cleanup on abort
        abortController.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    // Kick off execution (non-blocking)
    execute();

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // sync / async: execute, then return run
  await execute();

  if (mode === "async") {
    // For async we still wait — a real impl would use a background queue
    // but for a single-agent binary this is fine
  }

  return Response.json(run);
}

/** GET /runs/:runId */
export function handleRunRead(runId: string): Response {
  const state = getRun(runId);
  if (!state) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }
  return Response.json({ ...state.run, usage: state.usage });
}

/** POST /runs/:runId/cancel */
export function handleRunCancel(runId: string): Response {
  const state = getRun(runId);
  if (!state) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }

  if (state.run.status === "completed" || state.run.status === "failed" || state.run.status === "cancelled") {
    return Response.json({ error: `Run already ${state.run.status}` }, { status: 409 });
  }

  state.agent?.abort();
  state.abortController.abort();
  state.run.status = "cancelled";
  state.run.finished_at = new Date().toISOString();
  state.events.push({ type: "run.cancelled", run: state.run });

  // Persist cancelled state
  saveRun(runId);

  return Response.json({ ...state.run, usage: state.usage });
}

/** GET /runs/:runId/events */
export function handleRunEvents(runId: string): Response {
  const state = getRun(runId);
  if (!state) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }
  return Response.json({ events: state.events });
}
