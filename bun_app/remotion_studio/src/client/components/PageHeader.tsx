import { useTheme } from "../theme";

export function PageHeader({ title, description, children }: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <div style={{ marginBottom: theme.spacing.xxl }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: theme.spacing.md }}>
        <h1 style={{ margin: 0, fontSize: theme.font.sizes.xxl, fontWeight: theme.font.weights.semibold }}>{title}</h1>
        {children}
      </div>
      {description && <p style={{ margin: `${theme.spacing.xs}px 0 0`, fontSize: theme.font.sizes.md, color: theme.colors.text.faint }}>{description}</p>}
    </div>
  );
}
