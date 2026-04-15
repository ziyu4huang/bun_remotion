import { createAgent } from "../../agent.js";
import { getModel, getEnvApiKey } from "@mariozechner/pi-ai";

export async function handleChat(req: Request): Promise<Response> {
  let body: { message?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.message) {
    return Response.json({ error: "field 'message' is required" }, { status: 400 });
  }

  const agent = createAgent();

  // Override model if specified
  if (body.model) {
    try {
      const [provider, ...nameParts] = body.model.split("/");
      const modelName = nameParts.join("/");
      const apiKey = getEnvApiKey(provider as any);
      if (apiKey) {
        agent.state.model = getModel(provider as any, modelName as any);
      }
    } catch {
      // Ignore invalid model override, use default
    }
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        if (!closed) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }
      };

      const unsubscribe = agent.subscribe((event) => {
        // Serialize event for SSE — strip any non-serializable fields
        const serializable = serializeEvent(event);
        send(serializable);

        if (event.type === "agent_end") {
          closed = true;
          controller.close();
        }
      });

      // Timeout after 5 minutes
      const timeout = setTimeout(() => {
        if (!closed) {
          closed = true;
          agent.abort();
          send({ type: "timeout", message: "Request timed out" });
          controller.close();
        }
      }, 300_000);

      agent.prompt(body.message!).catch((err) => {
        clearTimeout(timeout);
        if (!closed) {
          closed = true;
          send({ type: "error", message: String(err) });
          controller.close();
        }
      }).finally(() => {
        clearTimeout(timeout);
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function serializeEvent(event: any): Record<string, unknown> {
  // AgentMessage objects have circular refs and huge usage data — strip them
  if (event.type === "message_update") {
    const evt = event.assistantMessageEvent;
    const base: Record<string, unknown> = { type: event.type, eventType: evt.type };
    if (evt.type === "text_delta") {
      base.delta = evt.delta;
    } else if (evt.type === "thinking_delta") {
      base.delta = evt.delta;
    } else if (evt.type === "toolcall_start") {
      base.contentIndex = evt.contentIndex;
    } else if (evt.type === "toolcall_end") {
      base.toolCall = { id: evt.toolCall?.id, name: evt.toolCall?.name };
    }
    return base;
  }

  if (event.type === "tool_execution_start") {
    return { type: event.type, toolCallId: event.toolCallId, toolName: event.toolName, args: event.args };
  }

  if (event.type === "tool_execution_end") {
    return {
      type: event.type,
      toolCallId: event.toolCallId,
      toolName: event.toolName,
      isError: event.isError,
    };
  }

  if (event.type === "agent_end") {
    return { type: "agent_end" };
  }

  return { type: event.type };
}
