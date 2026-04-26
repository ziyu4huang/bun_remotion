import { useState } from "react";
import type { ToolCallDisplay } from "./ChatTypes";

export function ToolCallCard({ tc }: { tc: ToolCallDisplay }) {
  const [expanded, setExpanded] = useState(false);
  const icon = tc.status === "running" ? "▶" : tc.isError ? "✗" : "✓";
  const iconColor = tc.status === "running" ? "#1976d2" : tc.isError ? "#d32f2f" : "#2e7d32";
  const borderColor = tc.status === "running" ? "#1976d2" : tc.isError ? "#d32f2f" : "#2e7d32";

  return (
    <div style={{
      fontSize: 13,
      margin: "4px 0",
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: "0 6px 6px 0",
      background: "#fafafa",
    }}>
      <div
        onClick={() => tc.result && setExpanded(!expanded)}
        style={{
          padding: "6px 10px",
          cursor: tc.result ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ color: iconColor, fontSize: 11 }}>{icon}</span>
        <span style={{ fontWeight: 500 }}>{tc.name}</span>
        {tc.status === "running" && (
          <span style={{ color: "#999" }}>running...</span>
        )}
        {tc.status === "done" && tc.result && !expanded && (
          <span style={{ color: "#999", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200, display: "inline-block" }}>
            {tc.result.split("\n")[0]}
          </span>
        )}
      </div>
      {expanded && tc.result && (
        <pre style={{
          margin: 0,
          padding: "8px 10px",
          background: "#f0f0f0",
          fontSize: 12,
          whiteSpace: "pre-wrap",
          maxHeight: 200,
          overflow: "auto",
          borderTop: "1px solid #e0e0e0",
        }}>
          {tc.result}
        </pre>
      )}
    </div>
  );
}
