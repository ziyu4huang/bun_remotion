import type { AgentEvent } from "@mariozechner/pi-agent-core";

const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

export function renderEvent(event: AgentEvent): void {
  switch (event.type) {
    case "agent_start":
      break;

    case "agent_end":
      process.stdout.write("\n");
      break;

    case "message_update": {
      const evt = event.assistantMessageEvent;
      if (evt.type === "text_delta") {
        process.stdout.write(evt.delta);
      } else if (evt.type === "thinking_delta") {
        process.stdout.write(`${DIM}${evt.delta}${RESET}`);
      } else if (evt.type === "toolcall_delta") {
        // Don't print tool call argument streaming
      }
      break;
    }

    case "tool_execution_start": {
      const args = event.args as Record<string, unknown>;
      let detail = "";
      if (args.path) detail = String(args.path);
      else if (args.command) detail = String(args.command).length > 60 ? String(args.command).slice(0, 60) + "..." : String(args.command);
      else if (args.pattern) detail = String(args.pattern);
      else if (args.directory) detail = String(args.directory);
      console.log(`\n${DIM}${CYAN}[${event.toolName}${detail ? `: ${detail}` : ""}]${RESET}`);
      break;
    }

    case "tool_execution_update":
      // Partial tool results — don't spam terminal
      break;

    case "tool_execution_end":
      if (event.isError) {
        const result = event.result as { content?: Array<{ text?: string }> };
        const text = result?.content?.[0]?.text ?? "unknown error";
        console.log(`${RED}  Error: ${text.slice(0, 200)}${RESET}`);
      }
      break;

    case "turn_end":
      if (event.message.role === "assistant" && (event.message as any).errorMessage) {
        console.log(`\n${RED}${BOLD}Error: ${(event.message as any).errorMessage}${RESET}`);
      }
      break;
  }
}
