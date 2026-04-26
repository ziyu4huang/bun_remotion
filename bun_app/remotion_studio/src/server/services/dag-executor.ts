/**
 * DAG Executor — topological-sort executor with parallel dispatch.
 * Phase 60: Runs ready tasks in parallel, skips dependents on failure, resumes completed.
 */

import type { TaskTree, TaskNode } from "../../shared/types";
import { TaskStore } from "./task-store";

export interface StepExecutor {
  (node: TaskNode): Promise<unknown>;
}

export interface DagExecutorOptions {
  /** Called for each node before execution. */
  onNodeStart?: (node: TaskNode) => void;
  /** Called after each node completes/fails. */
  onNodeDone?: (node: TaskNode, error?: string) => void;
  /** Progress callback. */
  onProgress?: (done: number, total: number) => void;
}

export async function executeTaskTree(
  tree: TaskTree,
  store: TaskStore,
  executor: StepExecutor,
  options?: DagExecutorOptions,
): Promise<TaskTree> {
  const treeId = tree.rootId;
  const stepNodes = Object.values(tree.nodes).filter((n) => n.id !== tree.rootId);
  const total = stepNodes.length;

  // Mark root as running
  store.updateNode(treeId, tree.rootId, { status: "running" });

  let done = stepNodes.filter((n) => n.status === "completed").length;
  const maxIterations = stepNodes.length + 1;
  let iterations = 0;

  while (true) {
    if (++iterations > maxIterations) {
      console.error(`[dag-executor] Exceeded max iterations (${maxIterations}), breaking`);
      break;
    }

    const ready = store.getReadyTasks(treeId);
    if (ready.length === 0) break;

    // Check if any work remains
    const allSettled = stepNodes.every(
      (n) => n.status === "completed" || n.status === "failed" || n.status === "skipped",
    );
    if (allSettled) break;

    // Run all ready tasks in parallel
    const results = await Promise.allSettled(
      ready.map(async (node) => {
        store.updateNode(treeId, node.id, { status: "running", startedAt: Date.now() });
        options?.onNodeStart?.(node);

        try {
          const result = await executor(node);
          store.updateNode(treeId, node.id, {
            status: "completed",
            progress: 100,
            result,
            finishedAt: Date.now(),
          });
          done++;
          options?.onProgress?.(done, total);
          options?.onNodeDone?.(node);
          return { ok: true as const, id: node.id };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          store.updateNode(treeId, node.id, {
            status: "failed",
            error: msg,
            finishedAt: Date.now(),
          });
          options?.onNodeDone?.(node, msg);
          return { ok: false as const, id: node.id };
        }
      }),
    );

    // For failed tasks, mark transitive dependents as skipped
    for (const r of results) {
      if (r.status === "fulfilled" && !r.value.ok) {
        skipDependents(treeId, r.value.id, tree, store);
      }
    }

    // Re-read step nodes to reflect updates
    const updated = store.getTree(treeId);
    if (updated) {
      for (const key of Object.keys(tree.nodes)) {
        tree.nodes[key] = updated.nodes[key];
      }
    }
  }

  // Determine final root status
  const finalNodes = Object.values(store.getTree(treeId)!.nodes).filter((n) => n.id !== tree.rootId);
  const allCompleted = finalNodes.every((n) => n.status === "completed");
  const anyFailed = finalNodes.some((n) => n.status === "failed");

  store.updateNode(treeId, tree.rootId, {
    status: allCompleted ? "completed" : anyFailed ? "failed" : "completed",
    progress: 100,
    finishedAt: Date.now(),
  });

  return store.getTree(treeId)!;
}

/** Recursively skip all transitive dependents of a failed node. */
function skipDependents(treeId: string, failedId: string, tree: TaskTree, store: TaskStore): void {
  const toSkip: string[] = [];
  const visited = new Set<string>();

  function walk(nodeId: string): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    for (const node of Object.values(tree.nodes)) {
      if (node.deps.includes(nodeId) && node.status === "pending") {
        toSkip.push(node.id);
        walk(node.id);
      }
    }
  }

  walk(failedId);

  for (const id of toSkip) {
    store.updateNode(treeId, id, { status: "skipped", progress: 0, finishedAt: Date.now() });
  }
}
