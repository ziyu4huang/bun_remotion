import type { ChatMessage } from "./ChatTypes";
import { ToolCallCard } from "./ToolCallCard";
import { PipelineToolCard, getPipelineOp } from "./PipelineToolCard";
import { JobStatusCard } from "./JobStatusCard";
import { useTheme } from "../theme";

export function UserBubble({ msg }: { msg: ChatMessage }) {
  const theme = useTheme();
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
      <div style={{
        maxWidth: "75%",
        padding: "10px 14px",
        borderRadius: "12px 12px 2px 12px",
        background: theme.colors.primaryLight,
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
  const theme = useTheme();

  const pipelineTools = (msg.toolCalls ?? []).filter((tc) => getPipelineOp(tc.name).op !== "other");
  const otherTools = (msg.toolCalls ?? []).filter((tc) => getPipelineOp(tc.name).op === "other");

  return (
    <div style={{ marginBottom: 16 }}>
      {pipelineTools.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {pipelineTools.map((tc, i) => (
            <PipelineToolCard key={`pipeline-${i}`} tc={tc} />
          ))}
        </div>
      )}

      {otherTools.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {otherTools.map((tc, i) => (
            <ToolCallCard key={i} tc={tc} />
          ))}
        </div>
      )}

      <div style={{
        maxWidth: "85%",
        padding: "10px 14px",
        borderRadius: "12px 12px 12px 2px",
        background: msg.isError ? theme.colors.errorLight : theme.colors.bg.page,
        boxShadow: theme.shadows.md,
        whiteSpace: "pre-wrap",
        fontSize: 14,
        lineHeight: 1.5,
      }}>
        {children ?? (msg.content || " ")}
      </div>

      {msg.meta?.jobId && (
        <div style={{ marginTop: 4 }}>
          <JobStatusCard jobId={msg.meta.jobId} live={false} />
        </div>
      )}

      {msg.meta && (
        <div style={{ fontSize: 11, color: theme.colors.text.faint, marginTop: 4, marginLeft: 4 }}>
          {msg.meta.turnCount} turns · {msg.meta.toolCallCount} tools · {(msg.meta.durationMs / 1000).toFixed(1)}s
        </div>
      )}
    </div>
  );
}
