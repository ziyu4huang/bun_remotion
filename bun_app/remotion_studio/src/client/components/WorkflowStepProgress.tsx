import type { FC } from "react";
import { StatusBadge, Card } from ".";
import { Button } from "./Button";
import { TaskTreeView } from "./TaskTreeNode";
import type { WorkflowStepStatus, Job, TaskTree } from "../../shared/types";

function stepColor(status: string): string {
  switch (status) {
    case "completed": return "#059669";
    case "running": return "#2563eb";
    case "failed": return "#dc2626";
    default: return "#9ca3af";
  }
}

interface WorkflowStepProgressProps {
  job: Job | null;
  tree: TaskTree | null;
  stepStatuses: WorkflowStepStatus[];
  onRefreshTree: () => void;
  onRetryNode: (taskId: string) => void;
  labels: {
    workflow: string;
    taskTree: string;
    refresh: string;
    steps: string;
  };
  theme: any;
}

export const WorkflowStepProgress: FC<WorkflowStepProgressProps> = ({
  job,
  tree,
  stepStatuses,
  onRefreshTree,
  onRetryNode,
  labels,
  theme,
}) => (
  <>
    {job && (
      <div style={{ marginBottom: theme.spacing.lg }}>
        <div style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, marginBottom: theme.spacing.xs }}>
          {labels.workflow} — {job.status} ({job.progress}%)
        </div>
        <div style={{ background: "#e5e7eb", borderRadius: theme.radii.md, height: 10, overflow: "hidden" }}>
          <div style={{ background: "#059669", height: "100%", width: `${job.progress}%`, transition: "width 0.3s" }} />
        </div>
      </div>
    )}

    {tree && (
      <div style={{ marginTop: theme.spacing.lg }}>
        <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          <h3 style={{ fontSize: theme.font.sizes.md, margin: 0 }}>{labels.taskTree}</h3>
          {job?.status === "running" && (
            <Button variant="ghost" size="sm" onClick={onRefreshTree}>
              {labels.refresh}
            </Button>
          )}
        </div>
        <Card variant="surface" padding="sm">
          <TaskTreeView tree={tree} onRetry={job ? onRetryNode : undefined} />
        </Card>
      </div>
    )}

    {!tree && stepStatuses.length > 0 && (
      <div style={{ marginTop: theme.spacing.lg }}>
        <h3 style={{ fontSize: theme.font.sizes.md, margin: `0 0 ${theme.spacing.sm}px` }}>{labels.steps}</h3>
        {stepStatuses.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
            <span style={{ fontSize: theme.font.sizes.base, width: 160, flexShrink: 0 }}>{i + 1}. {step.label}</span>
            <div style={{ background: "#e5e7eb", borderRadius: theme.radii.sm, height: 6, flex: 1, overflow: "hidden" }}>
              <div style={{
                background: stepColor(step.status),
                height: "100%",
                width: `${step.progress}%`,
                transition: "width 0.3s",
              }} />
            </div>
            <StatusBadge status={step.status} />
            {step.error && (
              <span style={{ fontSize: theme.font.sizes.sm, color: "#dc2626" }}>{step.error}</span>
            )}
          </div>
        ))}
      </div>
    )}
  </>
);
