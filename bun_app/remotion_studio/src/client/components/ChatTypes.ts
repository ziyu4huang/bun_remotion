export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCallDisplay[];
  meta?: { turnCount: number; toolCallCount: number; durationMs: number };
  isError?: boolean;
  thinking?: boolean;
}

export interface ToolCallDisplay {
  name: string;
  status: "running" | "done" | "error";
  result?: string;
  isError?: boolean;
}
