import type { Theme } from "../theme";
import type { useI18n } from "../i18n";

export function SystemStatus({ health, activeJobs, theme, t }: {
  health: string | null;
  activeJobs: number;
  theme: Theme;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const isDown = health === null;
  const isBusy = activeJobs >= 3;
  const statusColor = isDown ? theme.colors.error
    : isBusy ? theme.colors.warning
    : theme.colors.success;
  const statusText = isDown ? (t.jobs?.systemOffline ?? "Server unreachable")
    : isBusy ? (t.jobs?.systemBusy?.(activeJobs) ?? `Queue busy (${activeJobs} jobs)`)
    : (t.jobs?.systemHealthy ?? "All systems running");

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
      borderRadius: theme.radii.xl,
      border: `1px solid ${theme.colors.border.light}`,
      background: theme.colors.bg.muted,
    }}>
      <div style={{
        width: 12,
        height: 12,
        borderRadius: theme.radii.full,
        background: statusColor,
        boxShadow: isDown ? "none" : `0 0 6px ${statusColor}`,
        animation: isBusy ? "pulse 2s infinite" : "none",
      }} />
      <span style={{
        fontSize: theme.font.sizes.base,
        fontWeight: theme.font.weights.medium,
        color: statusColor,
      }}>
        {statusText}
      </span>
      <span style={{ marginLeft: "auto", fontSize: theme.font.sizes.sm, color: theme.colors.text.muted }}>
        {activeJobs > 0 ? `${activeJobs} active` : "Idle"}
      </span>
    </div>
  );
}
