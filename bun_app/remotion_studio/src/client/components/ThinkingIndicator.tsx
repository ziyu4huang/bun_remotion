import { useTheme } from "../theme";

export function ThinkingIndicator() {
  const theme = useTheme();
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 10px",
      color: theme.colors.text.muted,
      fontStyle: "italic",
      fontSize: 12,
    }}>
      <span className="thinking-dots" style={{ display: "inline-flex", gap: 2 }}>
        <span style={{ animation: "blink 1.4s infinite", animationDelay: "0s" }}>●</span>
        <span style={{ animation: "blink 1.4s infinite", animationDelay: "0.2s" }}>●</span>
        <span style={{ animation: "blink 1.4s infinite", animationDelay: "0.4s" }}>●</span>
      </span>
      Analyzing...
      <style>{`
        @keyframes blink {
          0%, 20% { opacity: 0.2; }
          50% { opacity: 1; }
          80%, 100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

export function TurnSeparator() {
  const theme = useTheme();
  return (
    <div style={{
      borderBottom: `1px solid ${theme.colors.border.default}`,
      margin: "16px 0",
    }} />
  );
}
