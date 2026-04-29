import { useState } from "react";
import type { ToolCallDisplay } from "./ChatTypes";
import { useTheme } from "../theme";

export function ToolCallCard({ tc }: { tc: ToolCallDisplay }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const icon = tc.status === "running" ? "▶" : tc.isError ? "✗" : "✓";
  const iconColor = tc.status === "running" ? theme.colors.primary : tc.isError ? theme.colors.error : theme.colors.success;
  const borderColor = tc.status === "running" ? theme.colors.primary : tc.isError ? theme.colors.error : theme.colors.success;

  return (
    <div style={{
      fontSize: 13,
      margin: "4px 0",
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: `0 ${theme.radii.lg}px ${theme.radii.lg}px 0`,
      background: theme.colors.bg.surface,
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
          <span style={{ color: theme.colors.text.muted }}>running...</span>
        )}
        {tc.status === "done" && tc.result && !expanded && (
          <span style={{ color: theme.colors.text.muted, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200, display: "inline-block" }}>
            {tc.result.split("\n")[0]}
          </span>
        )}
      </div>
      {expanded && tc.result && (
        <pre style={{
          margin: 0,
          padding: "8px 10px",
          background: theme.colors.border.light,
          fontSize: 12,
          whiteSpace: "pre-wrap",
          maxHeight: 200,
          overflow: "auto",
          borderTop: `1px solid ${theme.colors.border.default}`,
        }}>
          {tc.result}
        </pre>
      )}
    </div>
  );
}
