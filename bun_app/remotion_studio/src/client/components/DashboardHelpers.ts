import type { TaskTree } from "../../../shared/types";

export function relativeTime(timestamp: number, t: any): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return t.dashboard.justNow;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t.dashboard.timeAgo(minutes, "m");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t.dashboard.timeAgo(hours, "h");
  const days = Math.floor(hours / 24);
  return t.dashboard.timeAgo(days, "d");
}

export function formatDuration(ms: number, t: any): string {
  const seconds = Math.floor(ms / 1000);
  return t.dashboard.duration(seconds);
}

export function treeSummary(tree: TaskTree, t: any): string {
  const nodes = Object.values(tree.nodes);
  const completed = nodes.filter((n) => n.status === "completed").length;
  const total = nodes.length;
  return t.dashboard.treeDone(completed, total);
}
