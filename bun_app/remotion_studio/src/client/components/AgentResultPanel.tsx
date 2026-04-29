import { useTheme } from "../theme";
import type { AgentTaskState } from "../hooks/useAgentTask";

/**
 * Shared display for agent task results, loading, and errors.
 * Used by Dashboard, Monitoring, Benchmark, Quality pages.
 */
export function AgentResultPanel({ task, theme }: { task: AgentTaskState; theme: ReturnType<typeof useTheme> }) {
  if (task.status === "idle") return null;

  return (
    <div style={{ marginTop: theme.spacing.md }}>
      {task.status === "starting" && (
        <div style={{ fontStyle: "italic", color: theme.colors.text.tertiary }}>Starting agent...</div>
      )}
      {task.status === "running" && (
        <div style={{ fontStyle: "italic", color: theme.colors.text.tertiary }}>Agent analyzing...</div>
      )}
      {task.status === "done" && task.result && (
        <pre style={{
          whiteSpace: "pre-wrap", fontSize: theme.font.sizes.base, lineHeight: 1.5,
          margin: 0, fontFamily: "inherit", padding: theme.spacing.md,
          background: theme.colors.bg.page, borderRadius: theme.radii.lg,
        }}>
          {task.result}
        </pre>
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
