import { useTheme } from "../theme";

type StatusVariant = "ok" | "pass" | "fail" | "warn" | "running" | "pending" | "completed" | "skipped";

const VARIANT_ALIASES: Record<string, StatusVariant> = {
  ok: "ok",
  pass: "pass",
  pass_warn: "warn",
  fail: "fail",
  running: "running",
  pending: "pending",
  completed: "completed",
  skipped: "skipped",
};

function getColors(theme: ReturnType<typeof useTheme>): Record<StatusVariant, { bg: string; text: string }> {
  return {
    ok: { bg: theme.colors.successLight, text: theme.colors.success },
    pass: { bg: theme.colors.successLight, text: theme.colors.success },
    fail: { bg: theme.colors.errorLight, text: theme.colors.errorDark },
    warn: { bg: theme.colors.warningLight, text: theme.colors.warningDark },
    running: { bg: theme.colors.primaryLight, text: theme.colors.primaryDark },
    pending: { bg: theme.colors.bg.muted, text: theme.colors.status.skipped },
    completed: { bg: theme.colors.successLight, text: theme.colors.success },
    skipped: { bg: theme.colors.bg.muted, text: theme.colors.status.pending },
  };
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const theme = useTheme();
  const variant = VARIANT_ALIASES[status.toLowerCase()] ?? "pending";
  const colors = getColors(theme)[variant];
  return (
    <span
      role="status"
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500,
        background: colors.bg,
        color: colors.text,
        lineHeight: "20px",
      }}
    >
      {label ?? status}
    </span>
  );
}
