import { useTheme } from "../theme";
import type { Theme } from "../theme/tokens";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "ai";
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: { padding: "2px 6px", fontSize: 11 },
  md: { padding: "6px 12px", fontSize: 13 },
  lg: { padding: "8px 16px", fontSize: 14 },
} as const;

function variantStyles(variant: string, theme: Theme, disabled: boolean): React.CSSProperties {
  if (disabled) {
    return { background: theme.colors.border.light, color: theme.colors.text.muted, cursor: "default" };
  }
  switch (variant) {
    case "primary":
      return { background: theme.colors.primary, color: "#fff" };
    case "secondary":
      return { background: theme.colors.bg.muted, color: theme.colors.text.primary };
    case "outline":
      return { background: "transparent", color: theme.colors.text.primary, border: `1px solid ${theme.colors.border.medium}` };
    case "ghost":
      return { background: "transparent", color: theme.colors.text.secondary };
    case "danger":
      return { background: theme.colors.error, color: "#fff" };
    case "ai":
      return { background: theme.colors.aiAccent, color: "#fff" };
    default:
      return { background: theme.colors.primary, color: "#fff" };
  }
}

export function Button({ variant = "primary", size = "md", disabled, style, type = "button", children, ...rest }: ButtonProps) {
  const theme = useTheme();
  const base: React.CSSProperties = {
    ...sizeStyles[size],
    ...variantStyles(variant, theme, !!disabled),
    border: variant === "outline" ? `1px solid ${theme.colors.border.medium}` : "none",
    borderRadius: theme.radii.md,
    cursor: disabled ? "default" : "pointer",
    fontWeight: theme.font.weights.medium,
    lineHeight: 1.2,
    transition: "background 0.15s, opacity 0.15s",
    ...(style as React.CSSProperties),
  };
  return <button disabled={disabled} type={type} style={base} {...rest}>{children}</button>;
}
