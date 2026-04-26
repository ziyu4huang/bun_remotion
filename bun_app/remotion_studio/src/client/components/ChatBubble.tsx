import type { ChatMessage } from "./ChatTypes";
import { ToolCallCard } from "./ToolCallCard";

export function UserBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
      <div style={{
        maxWidth: "75%",
        padding: "10px 14px",
        borderRadius: "12px 12px 2px 12px",
        background: "#e3f2fd",
        whiteSpace: "pre-wrap",
        fontSize: 14,
        lineHeight: 1.5,
      }}>
        {msg.content}
      </div>
    </div>
  );
}

export function AssistantBubble({ msg, agentName, children }: { msg: ChatMessage; agentName: string; children?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {msg.toolCalls && msg.toolCalls.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {msg.toolCalls.map((tc, i) => (
            <ToolCallCard key={i} tc={tc} />
          ))}
        </div>
      )}

      <div style={{
        maxWidth: "85%",
        padding: "10px 14px",
        borderRadius: "12px 12px 12px 2px",
        background: msg.isError ? "#ffebee" : "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        whiteSpace: "pre-wrap",
        fontSize: 14,
        lineHeight: 1.5,
      }}>
        {children ?? (msg.content || " ")}
      </div>

      {msg.meta && (
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 4, marginLeft: 4 }}>
          {msg.meta.turnCount} turns · {msg.meta.toolCallCount} tools · {(msg.meta.durationMs / 1000).toFixed(1)}s
        </div>
      )}
    </div>
  );
}
