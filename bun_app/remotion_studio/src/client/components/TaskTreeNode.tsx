import { useState } from "react";
import type { TaskNode, TaskTree } from "../../shared/types";

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

const STATUS_COLOR: Record<string, string> = {
  pending: "#9e9e9e",
  queued: "#ff9800",
  running: "#1976d2",
  completed: "#2e7d32",
  failed: "#c62828",
  skipped: "#757575",
};

export function TaskTreeNodeView({ node, tree, depth = 0, onRetry }: Props) {
  const [collapsed, setCollapsed] = useState(depth > 1);
  const children = node.children.map((id) => tree.nodes[id]).filter(Boolean);
  const hasChildren = children.length > 0;
  const indent = depth * 20;

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
          <span style={{ fontSize: 10, color: "#999", width: 12, textAlign: "center", flexShrink: 0 }}>
            {collapsed ? "▶" : "▼"}
          </span>
        )}
        {!hasChildren && <span style={{ width: 12, flexShrink: 0 }} />}
        <span style={{ color: STATUS_COLOR[node.status] ?? "#666", flexShrink: 0 }}>
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
          <span style={{ color: "#999", fontSize: 11 }}>({ node.kind })</span>
        )}
        {node.progress > 0 && node.status === "running" && (
          <span style={{ fontSize: 11, color: "#1976d2" }}>{node.progress}%</span>
        )}
        {node.status === "failed" && node.error && (
          <span style={{ fontSize: 11, color: "#c62828", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {node.error.split("\n")[0]}
          </span>
        )}
        {node.status === "failed" && onRetry && depth > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onRetry(node.id); }}
            style={{
              fontSize: 11, padding: "1px 8px", borderRadius: 3,
              border: "1px solid #c62828", color: "#c62828", background: "transparent",
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
