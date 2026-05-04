import { StatusBadge, Button, EmptyState, Card } from "../components";
import { TaskTreeView } from "./TaskTreeNode";
import type { Job, TaskTree, WorkflowResult } from "../../../shared/types";
import type { Theme } from "../theme";
import { relativeTime, formatDuration, treeSummary } from "./DashboardHelpers";

interface JobListSectionProps {
  jobs: Job[];
  trees: Record<string, TaskTree>;
  filter: string;
  counts: Record<string, number>;
  expandedJobs: Set<string>;
  streamProgress: number | null;
  theme: Theme;
  t: any;
  onFilterChange: (filter: string) => void;
  onClearCompleted: () => void;
  onClearFailed: () => void;
  onClearAllTerminal: () => void;
  onRunDemo: () => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onRefreshTree: (id: string) => void;
  onRetryNode: (jobId: string, taskId: string) => void;
}

export function JobListSection({
  jobs, trees, filter, counts, expandedJobs, streamProgress,
  theme, t,
  onFilterChange, onClearCompleted, onClearFailed, onClearAllTerminal, onRunDemo, onCancel, onDelete,
  onToggleExpand, onRefreshTree, onRetryNode,
}: JobListSectionProps) {
  const hasTerminal = counts.completed > 0 || counts.failed > 0;

  return (
    <section style={{ marginBottom: theme.spacing.xxl }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.md, flexWrap: "wrap", gap: theme.spacing.sm }}>
        <h3 style={{ margin: 0, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold }}>{t.dashboard.jobQueue}</h3>
        <div style={{ display: "flex", gap: theme.spacing.sm }}>
          {hasTerminal && (
            <>
              {counts.completed > 0 && (
                <Button variant="outline" size="sm" onClick={onClearCompleted}>
                  {t.dashboard.clearCompleted} ({counts.completed})
                </Button>
              )}
              {counts.failed > 0 && (
                <Button variant="outline" size="sm" onClick={onClearFailed}>
                  {t.dashboard.clearFailed} ({counts.failed})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClearAllTerminal}>
                {t.dashboard.clearAllTerminal} ({counts.completed + counts.failed})
              </Button>
            </>
          )}
          <Button variant="primary" size="md" onClick={onRunDemo} disabled={streamProgress !== null}>
            {streamProgress !== null ? t.dashboard.running(streamProgress) : t.dashboard.runDemoJob}
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: theme.spacing.xs, marginBottom: theme.spacing.lg }}>
        {(["all", "running", "completed", "failed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onFilterChange(tab)}
            style={{
              padding: "4px 12px",
              borderRadius: theme.radii.xl,
              border: "none",
              background: filter === tab ? theme.colors.primaryLight : theme.colors.bg.muted,
              color: filter === tab ? theme.colors.primaryDark : theme.colors.text.secondary,
              cursor: "pointer",
              fontSize: theme.font.sizes.sm,
              fontWeight: filter === tab ? theme.font.weights.medium : theme.font.weights.normal,
            }}
          >
            {t.dashboard.status[tab]}
            {counts[tab] > 0 && (
              <span style={{ marginLeft: 4, fontSize: theme.font.sizes.xs, opacity: 0.7 }}>{counts[tab]}</span>
            )}
          </button>
        ))}
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon={"\u{1F4CB}"} title={t.dashboard.noJobs} description={t.dashboard.noJobsDesc} />
      ) : (
        jobs.map((j) => {
          const tree = trees[j.id];
          const wfResult = j.result as WorkflowResult | undefined;
          const isWorkflow = j.type === "workflow";
          const isExpanded = expandedJobs.has(j.id);
          const duration = (j.status === "completed" || j.status === "failed") ? j.updatedAt - j.createdAt : null;

          return (
            <div key={j.id} style={{
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: theme.radii.xl,
              padding: theme.spacing.md,
              background: theme.colors.bg.surface,
              marginBottom: theme.spacing.sm,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.xs, flexWrap: "wrap", gap: theme.spacing.xs }}>
                <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, minWidth: 0, overflow: "hidden" }}>
                  <span style={{ fontWeight: theme.font.weights.semibold, fontSize: theme.font.sizes.base }}>
                    {wfResult?.templateId ?? j.type}
                  </span>
                  <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted, whiteSpace: "nowrap" }}>
                    {j.id.slice(-6)} · {relativeTime(j.createdAt, t)}
                  </span>
                  {duration !== null && (
                    <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.faint }}>
                      {formatDuration(duration, t)}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
                  <StatusBadge status={j.status} label={j.status === "running" ? `${j.progress}%` : j.status} />
                  {j.status === "running" && (
                    <Button variant="danger" size="sm" onClick={() => onCancel(j.id)}>
                      {t.dashboard.cancel}
                    </Button>
                  )}
                  {(j.status === "completed" || j.status === "failed") && (
                    <Button variant="ghost" size="sm" onClick={() => onDelete(j.id)}>
                      {t.dashboard.delete}
                    </Button>
                  )}
                </div>
              </div>

              {j.status === "running" && (
                <div style={{ background: theme.colors.border.light, borderRadius: theme.radii.sm, height: 6, overflow: "hidden", marginBottom: theme.spacing.sm }}>
                  <div style={{
                    background: theme.colors.status.running,
                    height: "100%",
                    width: `${j.progress}%`,
                    transition: "width 0.3s",
                  }} />
                </div>
              )}

              {j.status === "failed" && j.error && (
                <div style={{
                  fontSize: theme.font.sizes.sm,
                  color: theme.colors.errorDark,
                  background: theme.colors.errorLight,
                  padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                  borderRadius: theme.radii.sm,
                  marginBottom: theme.spacing.sm,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  wordBreak: "break-word",
                }}>
                  {j.error}
                </div>
              )}

              {isWorkflow && tree && (
                <div>
                  <button onClick={() => onToggleExpand(j.id)}
                    style={{
                      fontSize: theme.font.sizes.sm, padding: "2px 8px",
                      background: "none", border: "none", color: theme.colors.primary,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: theme.spacing.xs,
                    }}>
                    <span style={{ fontSize: 10 }}>{isExpanded ? "▼" : "▶"}</span>
                    {isExpanded ? t.dashboard.hideTree : t.dashboard.showTree(treeSummary(tree, t))}
                  </button>
                  {isExpanded && (
                    <div style={{ marginTop: theme.spacing.sm, border: `1px solid ${theme.colors.border.light}`, borderRadius: theme.radii.md, padding: theme.spacing.sm, background: theme.colors.bg.muted }}>
                      <TaskTreeView tree={tree} onRetry={(taskId) => onRetryNode(j.id, taskId)} />
                    </div>
                  )}
                </div>
              )}

              {isWorkflow && j.status === "running" && (
                <Button variant="outline" size="sm" onClick={() => onRefreshTree(j.id)} style={{ marginTop: theme.spacing.xs }}>
                  {t.dashboard.refresh}
                </Button>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
