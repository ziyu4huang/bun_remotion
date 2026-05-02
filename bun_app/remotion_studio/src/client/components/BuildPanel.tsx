import { Button } from "./Button";
import { Card } from "./Card";
import { useI18n } from "../i18n";
import { useTheme } from "../theme";
import type { WorkflowStepStatus } from "../../shared/types";

interface BuildState {
  jobId: string;
  steps: WorkflowStepStatus[];
  status: "running" | "completed" | "failed";
  error?: string;
}

export function BuildPanel({ build, onRetry }: { build: BuildState; onRetry: () => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <Card variant="surface" padding="lg" style={{ marginTop: theme.spacing.lg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md }}>
        <h3 style={{ margin: 0, fontSize: theme.font.sizes.lg }}>Build Progress</h3>
        <span style={{ fontSize: theme.font.sizes.sm, color: build.status === "running" ? theme.colors.warning : build.status === "completed" ? theme.colors.success : theme.colors.error, fontWeight: theme.font.weights.semibold }}>
          {build.status.toUpperCase()}
        </span>
      </div>
      {build.steps.map((step, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          <span style={{ width: 16, textAlign: "center", fontSize: theme.font.sizes.base }}>
            {step.status === "completed" ? "+" : step.status === "failed" ? "x" : step.status === "running" ? ">" : " "}
          </span>
          <span style={{ width: 140, fontSize: theme.font.sizes.base }}>{step.label}</span>
          <div style={{ flex: 1, background: theme.colors.border.default, borderRadius: theme.radii.sm, height: 6, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${step.progress}%`,
                background: step.status === "completed" ? theme.colors.success : step.status === "failed" ? theme.colors.error : theme.colors.primary,
                transition: "width 0.3s",
              }}
            />
          </div>
          <span style={{ width: 50, textAlign: "right", fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary }}>{step.progress}%</span>
        </div>
      ))}
      {build.status === "failed" && (
        <div style={{ marginTop: theme.spacing.md, padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, background: theme.colors.errorLight, borderRadius: theme.radii.lg }}>
          <div style={{ color: theme.colors.error, fontSize: theme.font.sizes.base, marginBottom: theme.spacing.sm }}>
            {build.error ?? build.steps.find((s) => s.status === "failed")?.error ?? "Unknown error"}
          </div>
          <Button
            onClick={onRetry}
            size="sm"
          >
            {t.projects.retry}
          </Button>
        </div>
      )}
      {build.status === "completed" && (
        <div style={{ marginTop: theme.spacing.md, color: theme.colors.success, fontSize: theme.font.sizes.base }}>
          {t.projects.done} — {build.steps.length} steps completed successfully.
        </div>
      )}
    </Card>
  );
}

export type { BuildState };
