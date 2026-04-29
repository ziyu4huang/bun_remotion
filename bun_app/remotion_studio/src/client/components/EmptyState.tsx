import { useTheme } from "../theme";

export function EmptyState({ icon, title, description, action }: {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  const theme = useTheme();
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "64px 24px",
      color: theme.colors.text.muted,
      gap: 8,
    }}>
      {icon && <span style={{ fontSize: 36, marginBottom: 4 }}>{icon}</span>}
      <div style={{ fontSize: 16, fontWeight: 500, color: theme.colors.text.tertiary }}>{title}</div>
      {description && <div style={{ fontSize: 14, maxWidth: 360, textAlign: "center" }}>{description}</div>}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 12,
            padding: "8px 20px",
            background: theme.colors.primary,
            color: theme.colors.bg.page,
            border: "none",
            borderRadius: theme.radii.lg,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
