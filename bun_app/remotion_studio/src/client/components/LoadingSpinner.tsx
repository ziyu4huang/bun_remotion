import { useTheme } from "../theme";

export function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  const theme = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, gap: 10, color: theme.colors.text.faint }}>
      <span
        style={{
          display: "inline-block",
          width: 18,
          height: 18,
          border: `2px solid ${theme.colors.border.default}`,
          borderTopColor: theme.colors.primary,
          borderRadius: "50%",
          animation: "spin 0.6s linear infinite",
        }}
      />
      <span style={{ fontSize: 14 }}>{text}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
