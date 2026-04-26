import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { TaskStore } from "../server/services/task-store";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { TaskTree } from "../shared/types";

const TMP_DIR = resolve(import.meta.dir, "__tmp_task_store__");
const TMP_FILE = resolve(TMP_DIR, "task-trees.json");

function makeStore(): TaskStore {
  return new TaskStore(TMP_FILE);
}

describe("TaskStore", () => {
  beforeEach(() => {
    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
    mkdirSync(TMP_DIR, { recursive: true });
  });
  afterEach(() => {
    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
  });

  test("createTree creates root node", () => {
    const store = makeStore();
    const tree = store.createTree({ label: "Full Pipeline", kind: "workflow" });
    expect(tree.rootId).toBeTruthy();
    expect(tree.nodes[tree.rootId]).toBeDefined();
    expect(tree.nodes[tree.rootId].label).toBe("Full Pipeline");
    expect(tree.nodes[tree.rootId].kind).toBe("workflow");
    expect(tree.nodes[tree.rootId].status).toBe("pending");
  });

  test("addNode creates child linked to parent", () => {
    const store = makeStore();
    const tree = store.createTree({ label: "Root", kind: "workflow" });
    const child = store.addNode(tree.rootId, { label: "Scaffold", kind: "scaffold" });
    expect(child).not.toBeNull();
    expect(child!.parentId).toBe(tree.rootId);
    expect(tree.nodes[tree.rootId].children).toContain(child!.id);
  });

  test("addNode with custom parentId", () => {
    const store = makeStore();
    const tree = store.createTree({ label: "Root", kind: "workflow" });
    const parent = store.addNode(tree.rootId, { label: "Group", kind: "group" });
    const child = store.addNode(tree.rootId, { label: "Child", kind: "scaffold" }, parent!.id);
    expect(child!.parentId).toBe(parent!.id);
    expect(parent!.children).toContain(child!.id);
  });

  test("updateNode patches fields", () => {
    const store = makeStore();
    const tree = store.createTree({ label: "Root", kind: "workflow" });
    const child = store.addNode(tree.rootId, { label: "Step", kind: "scaffold" });
    store.updateNode(tree.rootId, child!.id, { status: "running", progress: 50 });
    const updated = store.getNode(tree.rootId, child!.id);
    expect(updated!.status).toBe("running");
    expect(updated!.progress).toBe(50);
  });

  test("getReadyTasks returns pending tasks with completed deps", () => {
    const store = makeStore();
    const tree = store.createTree({ label: "Root", kind: "workflow" });
    const step1 = store.addNode(tree.rootId, { label: "Scaffold", kind: "scaffold" });
    const step2 = store.addNode(tree.rootId, { label: "Pipeline", kind: "pipeline", deps: [step1!.id] });

    let ready = store.getReadyTasks(tree.rootId);
    expect(ready.map((n) => n.kind)).toEqual(["scaffold"]);

    store.updateNode(tree.rootId, step1!.id, { status: "completed", progress: 100 });
    ready = store.getReadyTasks(tree.rootId);
    expect(ready.map((n) => n.kind)).toEqual(["pipeline"]);
  });

  test("getReadyTasks returns parallel tasks when deps met", () => {
    const store = makeStore();
    const tree = store.createTree({ label: "Root", kind: "workflow" });
    const pipeline = store.addNode(tree.rootId, { label: "Pipeline", kind: "pipeline" });
    const check = store.addNode(tree.rootId, { label: "Check", kind: "check", deps: [pipeline!.id] });
    store.addNode(tree.rootId, { label: "Score", kind: "score", deps: [pipeline!.id] });

    store.updateNode(tree.rootId, pipeline!.id, { status: "completed", progress: 100 });

    const ready = store.getReadyTasks(tree.rootId);
    const kinds = ready.map((n) => n.kind).sort();
    expect(kinds).toEqual(["check", "score"]);
  });

  test("getProgress computes average of children", () => {
    const store = makeStore();
    const tree = store.createTree({ label: "Root", kind: "workflow" });
    store.addNode(tree.rootId, { label: "A", kind: "scaffold" });
    store.addNode(tree.rootId, { label: "B", kind: "pipeline" });

    store.updateNode(tree.rootId, tree.nodes[tree.rootId].children[0], { progress: 100 });
    store.updateNode(tree.rootId, tree.nodes[tree.rootId].children[1], { progress: 50 });

    expect(store.getProgress(tree.rootId)).toBe(75);
  });

  test("getChildrenOf returns direct children", () => {
    const store = makeStore();
    const tree = store.createTree({ label: "Root", kind: "workflow" });
    store.addNode(tree.rootId, { label: "A", kind: "scaffold" });
    store.addNode(tree.rootId, { label: "B", kind: "pipeline" });

    const children = store.getChildrenOf(tree.rootId, tree.rootId);
    expect(children.length).toBe(2);
    expect(children.map((c) => c.label).sort()).toEqual(["A", "B"]);
  });

  test("listTrees returns all trees", () => {
    const store = makeStore();
    store.createTree({ label: "Tree 1", kind: "workflow" });
    store.createTree({ label: "Tree 2", kind: "workflow" });
    expect(store.listTrees().length).toBe(2);
  });

  test("deleteTree removes tree", () => {
    const store = makeStore();
    const tree = store.createTree({ label: "Root", kind: "workflow" });
    expect(store.deleteTree(tree.rootId)).toBe(true);
    expect(store.getTree(tree.rootId)).toBeUndefined();
  });

  // ── Phase 58: Persistence ──

  test("trees persist to disk after create", async () => {
    const store = makeStore();
    const tree = store.createTree({ label: "Persistent", kind: "workflow" });
    store.addNode(tree.rootId, { label: "Step", kind: "scaffold" });

    expect(existsSync(TMP_FILE)).toBe(true);
    const data = JSON.parse(await Bun.file(TMP_FILE).text());
    expect(data.trees.length).toBe(1);
    expect(data.trees[0].rootId).toBe(tree.rootId);
    // 2 nodes: root + child
    expect(Object.keys(data.trees[0].nodes).length).toBe(2);
  });

  test("new store instance loads persisted trees", () => {
    const store1 = makeStore();
    const tree = store1.createTree({ label: "Survive", kind: "workflow" });
    store1.addNode(tree.rootId, { label: "Step", kind: "pipeline" });

    const store2 = makeStore();
    const loaded = store2.getTree(tree.rootId);
    expect(loaded).toBeDefined();
    expect(loaded!.nodes[tree.rootId].label).toBe("Survive");
    expect(Object.keys(loaded!.nodes).length).toBe(2);
  });

  test("corrupted JSON starts fresh without crash", () => {
    writeFileSync(TMP_FILE, "{ not valid json }}}");
    const store = makeStore();
    const tree = store.createTree({ label: "Fresh", kind: "workflow" });
    expect(tree.rootId).toBeTruthy();
    expect(store.listTrees().length).toBe(1);
  });

  test("eviction removes oldest completed trees over cap", () => {
    const store = makeStore();
    // Create 51 completed trees
    const ids: string[] = [];
    for (let i = 0; i < 51; i++) {
      const tree = store.createTree({ label: `Tree ${i}`, kind: "workflow", status: "completed" });
      ids.push(tree.rootId);
    }
    // Should be at most 50 trees
    expect(store.listTrees().length).toBeLessThanOrEqual(50);
    // Oldest completed should be evicted
    expect(store.getTree(ids[0])).toBeUndefined();
    // Newest should survive
    expect(store.getTree(ids[50])).toBeDefined();
  });

  test("deleteTree persists removal to disk", () => {
    const store = makeStore();
    const tree = store.createTree({ label: "ToDelete", kind: "workflow" });
    store.deleteTree(tree.rootId);

    const store2 = makeStore();
    expect(store2.getTree(tree.rootId)).toBeUndefined();
  });
});
