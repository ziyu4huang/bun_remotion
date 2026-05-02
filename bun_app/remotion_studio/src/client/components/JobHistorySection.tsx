import { StatusBadge, Button } from "../components";
import type { Job, TaskTree, WorkflowResult } from "../../../shared/types";
import type { Theme } from "../theme";
import { relativeTime, formatDuration } from "./DashboardHelpers";

interface JobHistorySectionProps {
  history: Job[];
  showHistory: boolean;
  theme: Theme;
  t: any;
  onToggle: () => void;
  onDelete: (id: string) => void;
}

export function JobHistorySection({ history, showHistory, theme, t, onToggle, onDelete }: JobHistorySectionProps) {
  if (history.length === 0) return null;

  return (
    <section style={{ marginBottom: theme.spacing.xxl }}>
      <button
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: theme.spacing.sm,
          margin: 0, marginBottom: showHistory ? theme.spacing.md : 0,
          padding: 0, background: "none", border: "none",
          cursor: "pointer", color: theme.colors.text.primary,
          fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold,
        }}
      >
        <span style={{ fontSize: 10 }}>{showHistory ? "▼" : "▶"}</span>
        {t.dashboard.jobHistory}
        <span style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted, fontWeight: theme.font.weights.normal }}>
          {t.dashboard.olderJobs(history.length)}
        </span>
      </button>

      {showHistory && history.map((j) => {
        const duration = j.updatedAt - j.createdAt;
        return (
          <div key={j.id} style={{
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: theme.radii.lg,
            padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
            background: theme.colors.bg.muted,
            marginBottom: theme.spacing.xs,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
              <span style={{ fontWeight: theme.font.weights.medium, fontSize: theme.font.sizes.sm }}>
                {(j.result as WorkflowResult)?.templateId ?? j.type}
              </span>
              <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted }}>
                {j.id.slice(-6)} · {relativeTime(j.createdAt, t)}
              </span>
              <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.faint }}>
                {formatDuration(duration, t)}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
              <StatusBadge status={j.status} />
              <Button variant="ghost" size="sm" onClick={() => onDelete(j.id)}>
                {t.dashboard.delete}
              </Button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
