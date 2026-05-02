import { useTheme } from "../theme";
import { MarkdownText } from "./MarkdownText";
import type { AgentTaskState } from "../hooks/useAgentTask";

/**
 * Shared display for agent task results, streaming text, and errors.
 * Used by Dashboard, Monitoring, Benchmark, Quality pages.
 */
export function AgentResultPanel({ task, theme }: { task: AgentTaskState; theme: ReturnType<typeof useTheme> }) {
  if (task.status === "idle") return null;

  const contentStyle = {
    fontSize: theme.font.sizes.base,
    lineHeight: 1.6,
    padding: theme.spacing.md,
    background: theme.colors.bg.page,
    borderRadius: theme.radii.lg,
    maxHeight: 480,
    overflowY: "auto" as const,
  };

  return (
    <div style={{ marginTop: theme.spacing.md }}>
      {task.status === "starting" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: theme.colors.text.tertiary }}>
          <span style={{ animation: "pulse 1.5s infinite", display: "inline-block" }}>●</span>
          <span style={{ fontStyle: "italic" }}>Starting agent...</span>
        </div>
      )}
      {task.status === "running" && task.streamingText && (
        <div style={contentStyle}>
          <MarkdownText content={task.streamingText} />
          <span style={{ display: "inline-block", animation: "pulse 1s infinite", color: theme.colors.aiAccent, marginLeft: 2 }}>▌</span>
        </div>
      )}
      {task.status === "running" && !task.streamingText && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: theme.colors.text.tertiary }}>
          <span style={{ animation: "pulse 1.5s infinite", display: "inline-block" }}>●</span>
          <span style={{ fontStyle: "italic" }}>Agent analyzing...</span>
        </div>
      )}
      {task.status === "done" && task.result && (
        <div style={contentStyle}>
          <MarkdownText content={task.result} />
        </div>
      )}
      {task.status === "error" && task.result && (
        <div style={{
          padding: theme.spacing.md,
          background: task.bridgeDown ? theme.colors.warningLight : theme.colors.errorLight,
          borderRadius: theme.radii.lg,
          color: task.bridgeDown ? theme.colors.warningDark : theme.colors.errorDark,
          fontSize: theme.font.sizes.base,
          lineHeight: 1.5,
        }}>
          {task.bridgeDown && <div style={{ fontWeight: theme.font.weights.semibold, marginBottom: 4 }}>Agent Unavailable</div>}
          {task.result}
        </div>
      )}
    </div>
  );
}
