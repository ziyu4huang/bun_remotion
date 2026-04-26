export function ThinkingIndicator() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 10px",
      color: "#999",
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
  return (
    <div style={{
      borderBottom: "1px solid #e0e0e0",
      margin: "16px 0",
    }} />
  );
}
