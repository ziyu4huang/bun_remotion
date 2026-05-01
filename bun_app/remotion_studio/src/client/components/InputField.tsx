import { useTheme } from "../theme";

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function InputField({ label, error, style, id, ...rest }: InputFieldProps) {
  const theme = useTheme();
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    fontSize: theme.font.sizes.base,
    borderRadius: theme.radii.md,
    border: `1px solid ${error ? theme.colors.error : theme.colors.border.medium}`,
    background: theme.colors.bg.page,
    color: theme.colors.text.primary,
    outline: "none",
    transition: "border-color 0.15s",
    ...(style as React.CSSProperties),
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary, fontWeight: theme.font.weights.medium }}>
          {label}
        </label>
      )}
      <input id={id} style={inputStyle} {...rest} />
      {error && <span role="alert" style={{ fontSize: theme.font.sizes.xs, color: theme.colors.error }}>{error}</span>}
    </div>
  );
}
