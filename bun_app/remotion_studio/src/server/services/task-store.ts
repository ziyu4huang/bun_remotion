/**
 * TaskStore — in-memory store for TaskNode trees with JSON persistence.
 * Phase 57: Foundation for DAG-based workflow engine.
 * Phase 58: Adds JSON persistence, eviction, corruption recovery.
 */

import type { TaskNode, TaskTree } from "../../shared/types";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const MAX_TREES = 50;

let counter = 0;
function nextId(): string {
  return `task_${Date.now()}_${++counter}`;
}

export class TaskStore {
  private trees = new Map<string, TaskTree>();
  private filePath: string;
  private loaded = false;

  constructor(filePath?: string) {
    this.filePath = filePath ?? resolve(import.meta.dir, "../../../data/task-trees.json");
  }

  /** Load trees from disk (lazy, idempotent). Corrupted file → start fresh. */
  private ensureLoaded(): void {
    if (this.loaded) return;
    this.loaded = true;
    if (existsSync(this.filePath)) {
      try {
        const data = JSON.parse(readFileSync(this.filePath, "utf-8"));
        if (data.trees && Array.isArray(data.trees)) {
          for (const tree of data.trees) {
            if (tree.rootId && tree.nodes) this.trees.set(tree.rootId, tree);
          }
        }
        if (typeof data.counter === "number") counter = data.counter;
      } catch {
        // Corrupted — start fresh
      }
    }
  }

  /** Persist current state to disk. */
  private saveToDisk(): void {
    const dir = resolve(this.filePath, "..");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const trees = [...this.trees.values()];
    writeFileSync(this.filePath, JSON.stringify({ trees, counter }, null, 2));
  }

  /** Evict oldest completed trees if over cap. */
  private evictIfNeeded(): void {
    if (this.trees.size <= MAX_TREES) return;
    const completed = [...this.trees.entries()]
      .filter(([, t]) => {
        const root = t.nodes[t.rootId];
        return root && (root.status === "completed" || root.status === "failed");
      })
      .sort(([, a], [, b]) => a.updatedAt - b.updatedAt);

    while (this.trees.size > MAX_TREES && completed.length > 0) {
      const [id] = completed.shift()!;
      this.trees.delete(id);
    }
  }

  /** Create a new task tree with a root node. */
  createTree(root: Partial<TaskNode> & { label: string; kind: string }): TaskTree {
    this.ensureLoaded();
    const id = nextId();
    const now = Date.now();
    const rootNode: TaskNode = {
      id,
      parentId: null,
      label: root.label,
      kind: root.kind,
      status: root.status ?? "pending",
      progress: 0,
      deps: [],
      children: [],
      metadata: root.metadata,
      ...Object.fromEntries(
        ["error", "result", "startedAt", "finishedAt"]
          .filter((k) => (root as any)[k] !== undefined)
          .map((k) => [k, (root as any)[k]]),
      ),
    };
    const tree: TaskTree = { rootId: id, nodes: { [id]: rootNode }, createdAt: now, updatedAt: now };
    this.trees.set(id, tree);
    this.evictIfNeeded();
    this.saveToDisk();
    return tree;
  }

  /** Add a child node to a tree. */
  addNode(treeId: string, node: Partial<TaskNode> & { label: string; kind: string }, parentId?: string): TaskNode | null {
    this.ensureLoaded();
    const tree = this.trees.get(treeId);
    if (!tree) return null;

    const id = nextId();
    const taskNode: TaskNode = {
      id,
      parentId: parentId ?? tree.rootId,
      label: node.label,
      kind: node.kind,
      status: node.status ?? "pending",
      progress: 0,
      deps: node.deps ?? [],
      children: [],
      metadata: node.metadata,
      ...Object.fromEntries(
        ["error", "result", "startedAt", "finishedAt"]
          .filter((k) => (node as any)[k] !== undefined)
          .map((k) => [k, (node as any)[k]]),
      ),
    };

    tree.nodes[id] = taskNode;
    const parent = tree.nodes[taskNode.parentId];
    if (parent && !parent.children.includes(id)) {
      parent.children.push(id);
    }
    tree.updatedAt = Date.now();
    this.saveToDisk();
    return taskNode;
  }

  /** Update a node's fields. */
  updateNode(treeId: string, nodeId: string, patch: Partial<TaskNode>): TaskNode | null {
    this.ensureLoaded();
    const tree = this.trees.get(treeId);
    if (!tree) return null;
    const node = tree.nodes[nodeId];
    if (!node) return null;

    Object.assign(node, patch);
    tree.updatedAt = Date.now();
    this.saveToDisk();
    return node;
  }

  /** Get a tree by its root ID. */
  getTree(treeId: string): TaskTree | undefined {
    this.ensureLoaded();
    return this.trees.get(treeId);
  }

  /** Get a specific node. */
  getNode(treeId: string, nodeId: string): TaskNode | null {
    this.ensureLoaded();
    return this.trees.get(treeId)?.nodes[nodeId] ?? null;
  }

  /** Get all children of a node. */
  getChildrenOf(treeId: string, parentId: string): TaskNode[] {
    this.ensureLoaded();
    const tree = this.trees.get(treeId);
    if (!tree) return [];
    const parent = tree.nodes[parentId];
    if (!parent) return [];
    return parent.children.map((id) => tree.nodes[id]).filter(Boolean);
  }

  /** Get tasks that are ready to run (pending, not root, all deps completed). */
  getReadyTasks(treeId: string): TaskNode[] {
    this.ensureLoaded();
    const tree = this.trees.get(treeId);
    if (!tree) return [];

    return Object.values(tree.nodes).filter((node) => {
      if (node.id === tree.rootId) return false;
      if (node.status !== "pending") return false;
      return node.deps.every((depId) => {
        const dep = tree.nodes[depId];
        return dep && dep.status === "completed";
      });
    });
  }

  /** Compute aggregate progress for a tree (average of direct children). */
  getProgress(treeId: string): number {
    this.ensureLoaded();
    const tree = this.trees.get(treeId);
    if (!tree) return 0;
    const root = tree.nodes[tree.rootId];
    if (!root || root.children.length === 0) return root?.progress ?? 0;
    const children = root.children.map((id) => tree.nodes[id]).filter(Boolean);
    return Math.round(children.reduce((sum, c) => sum + c.progress, 0) / children.length);
  }

  /** Get all trees. */
  listTrees(): TaskTree[] {
    this.ensureLoaded();
    return [...this.trees.values()];
  }

  /** Delete a tree. */
  deleteTree(treeId: string): boolean {
    this.ensureLoaded();
    const deleted = this.trees.delete(treeId);
    if (deleted) this.saveToDisk();
    return deleted;
  }
}
