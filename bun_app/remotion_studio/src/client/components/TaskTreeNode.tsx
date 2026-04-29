import { useState } from "react";
import type { TaskNode, TaskTree } from "../../shared/types";
import { useTheme } from "../theme";

interface Props {
  node: TaskNode;
  tree: TaskTree;
  depth?: number;
  onRetry?: (taskId: string) => void;
}

const STATUS_ICON: Record<string, string> = {
  pending: "○",
  queued: "◷",
  running: "●",
  completed: "✓",
  failed: "✗",
  skipped: "⊘",
};

export function TaskTreeNodeView({ node, tree, depth = 0, onRetry }: Props) {
  const theme = useTheme();
  const [collapsed, setCollapsed] = useState(depth > 1);
  const children = node.children.map((id) => tree.nodes[id]).filter(Boolean);
  const hasChildren = children.length > 0;
  const indent = depth * 20;

  const statusColor = (s: string) => theme.colors.status[s as keyof typeof theme.colors.status] ?? theme.colors.text.tertiary;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 8px",
          paddingLeft: 8 + indent,
          cursor: hasChildren ? "pointer" : "default",
          borderRadius: 4,
          fontSize: 13,
          lineHeight: "20px",
        }}
        onClick={() => hasChildren && setCollapsed(!collapsed)}
      >
        {hasChildren && (
          <span style={{ fontSize: 10, color: theme.colors.text.muted, width: 12, textAlign: "center", flexShrink: 0 }}>
            {collapsed ? "▶" : "▼"}
          </span>
        )}
        {!hasChildren && <span style={{ width: 12, flexShrink: 0 }} />}
        <span style={{ color: statusColor(node.status), flexShrink: 0 }}>
          {node.status === "running" ? (
            <span className="task-spinning" style={{ display: "inline-block" }}>
              {STATUS_ICON[node.status]}
            </span>
          ) : (
            STATUS_ICON[node.status]
          )}
        </span>
        <span style={{ fontWeight: depth === 0 ? 600 : 400 }}>{node.label}</span>
        {node.kind !== "workflow" && node.kind !== "group" && (
          <span style={{ color: theme.colors.text.muted, fontSize: 11 }}>({ node.kind })</span>
        )}
        {node.progress > 0 && node.status === "running" && (
          <span style={{ fontSize: 11, color: theme.colors.primary }}>{node.progress}%</span>
        )}
        {node.status === "failed" && node.error && (
          <span style={{ fontSize: 11, color: theme.colors.errorDark, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {node.error.split("\n")[0]}
          </span>
        )}
        {node.status === "failed" && onRetry && depth > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onRetry(node.id); }}
            style={{
              fontSize: 11, padding: "1px 8px", borderRadius: 3,
              border: `1px solid ${theme.colors.errorDark}`, color: theme.colors.errorDark, background: "transparent",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            Retry
          </button>
        )}
      </div>

      {!collapsed && children.map((child) => (
        <TaskTreeNodeView
          key={child.id}
          node={child}
          tree={tree}
          depth={depth + 1}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
}

/** Render a full TaskTree starting from root. */
export function TaskTreeView({ tree, onRetry }: { tree: TaskTree; onRetry?: (taskId: string) => void }) {
  const root = tree.nodes[tree.rootId];
  if (!root) return null;
  return <TaskTreeNodeView node={root} tree={tree} depth={0} onRetry={onRetry} />;
}
