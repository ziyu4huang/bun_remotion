import { useTheme } from "../theme";
import type { Theme } from "../theme/tokens";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "surface" | "elevated" | "outline";
  padding?: "sm" | "md" | "lg" | "none";
}

const paddingMap = { sm: "xs", md: "lg", lg: "xxl", none: "none" } as const;

function cardStyles(variant: string, padding: string, theme: Theme): React.CSSProperties {
  const pad = paddingMap[padding as keyof typeof paddingMap] ?? "lg";
  const base: React.CSSProperties = {
    borderRadius: theme.radii.xl,
    padding: pad === "none" ? 0 : theme.spacing[pad as keyof typeof theme.spacing],
  };
  switch (variant) {
    case "surface":
      return { ...base, background: theme.colors.bg.surface, border: `1px solid ${theme.colors.border.default}` };
    case "elevated":
      return { ...base, background: theme.colors.bg.surface, boxShadow: theme.shadows.md };
    case "outline":
      return { ...base, border: `1px solid ${theme.colors.border.default}` };
    default:
      return { ...base, background: theme.colors.bg.muted, border: `1px solid ${theme.colors.border.default}` };
  }
}

export function Card({ variant = "default", padding = "md", style, children, ...rest }: CardProps) {
  const theme = useTheme();
  return <div style={{ ...cardStyles(variant, padding, theme), ...(style as React.CSSProperties) }} {...rest}>{children}</div>;
}
