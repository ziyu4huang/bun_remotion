import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { TaskStore } from "../server/services/task-store";
import { executeTaskTree, type StepExecutor } from "../server/services/dag-executor";
import { buildTaskTree } from "../server/services/workflow-engine";
import { WORKFLOW_TEMPLATES } from "../server/services/workflow-engine";
import type { TaskNode } from "../shared/types";

const TMP_DIR = resolve(import.meta.dir, "__tmp_dag_executor__");
const TMP_FILE = resolve(TMP_DIR, "task-trees.json");

function makeStore(): TaskStore {
  return new TaskStore(TMP_FILE);
}

function getTemplate(id: string) {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id)!;
}

describe("DAG Executor", () => {
  beforeEach(() => {
    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
    mkdirSync(TMP_DIR, { recursive: true });
  });
  afterEach(() => {
    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
  });

  test("parallel tasks run concurrently (total time = max, not sum)", async () => {
    const st = makeStore();
    const root = st.createTree({ label: "Test", kind: "workflow" });

    // image (no deps), tts (no deps), render (deps: image + tts)
    const image = st.addNode(root.rootId, { label: "Image", kind: "image" })!;
    const tts = st.addNode(root.rootId, { label: "TTS", kind: "tts" })!;
    const render = st.addNode(root.rootId, { label: "Render", kind: "render", deps: [image.id, tts.id] })!;

    const executor: StepExecutor = async () => {
      await new Promise((r) => setTimeout(r, 100));
      return { done: true };
    };

    const tree = st.getTree(root.rootId)!;
    const start = Date.now();
    await executeTaskTree(tree, st, executor);
    const elapsed = Date.now() - start;

    // image and tts ran in parallel, so total should be ~200ms (2 rounds of 100ms), not ~300ms
    expect(elapsed).toBeLessThan(350);
    expect(st.getNode(root.rootId, image.id)!.status).toBe("completed");
    expect(st.getNode(root.rootId, tts.id)!.status).toBe("completed");
    expect(st.getNode(root.rootId, render.id)!.status).toBe("completed");
  });

  test("failed task skips dependents but allows siblings", async () => {
    const st = makeStore();
    const root = st.createTree({ label: "Test", kind: "workflow" });

    // A → [B, C] (parallel), B → D
    // If B fails, D gets skipped, but C still runs
    const a = st.addNode(root.rootId, { label: "A", kind: "scaffold" })!;
    const b = st.addNode(root.rootId, { label: "B", kind: "pipeline", deps: [a.id] })!;
    const c = st.addNode(root.rootId, { label: "C", kind: "check", deps: [a.id] })!;
    const d = st.addNode(root.rootId, { label: "D", kind: "render", deps: [b.id] })!;

    const executor: StepExecutor = async (node) => {
      if (node.kind === "pipeline") throw new Error("B failed!");
      return { done: true };
    };

    const tree = st.getTree(root.rootId)!;
    await executeTaskTree(tree, st, executor);

    expect(st.getNode(root.rootId, a.id)!.status).toBe("completed");
    expect(st.getNode(root.rootId, b.id)!.status).toBe("failed");
    expect(st.getNode(root.rootId, c.id)!.status).toBe("completed");
    expect(st.getNode(root.rootId, d.id)!.status).toBe("skipped");
  });

  test("resume skips already-completed tasks", async () => {
    const st = makeStore();
    const root = st.createTree({ label: "Test", kind: "workflow" });

    const a = st.addNode(root.rootId, { label: "A", kind: "scaffold" })!;
    const b = st.addNode(root.rootId, { label: "B", kind: "pipeline", deps: [a.id] })!;

    // Mark A as already completed (simulating resume)
    st.updateNode(root.rootId, a.id, { status: "completed", progress: 100 });

    let aRan = false;
    const executor: StepExecutor = async (node) => {
      if (node.kind === "scaffold") aRan = true;
      return { done: true };
    };

    const tree = st.getTree(root.rootId)!;
    await executeTaskTree(tree, st, executor);

    // A should NOT re-run
    expect(aRan).toBe(false);
    expect(st.getNode(root.rootId, b.id)!.status).toBe("completed");
  });

  test("full-pipeline tree executes all 6 steps", async () => {
    const tpl = getTemplate("full-pipeline");
    const tree = buildTaskTree(tpl);
    const st = makeStore();

    // Insert tree into store
    const storeTree = st.createTree({ label: tree.nodes[tree.rootId].label, kind: "workflow" });
    const idMap = new Map<string, string>();

    for (const node of Object.values(tree.nodes)) {
      if (node.id === tree.rootId) {
        idMap.set(node.id, storeTree.rootId);
        continue;
      }
      const mappedDeps = node.deps.map((d) => idMap.get(d)!).filter(Boolean);
      const added = st.addNode(storeTree.rootId, {
        label: node.label,
        kind: node.kind,
        deps: mappedDeps,
      })!;
      idMap.set(node.id, added.id);
    }

    const executionOrder: string[] = [];
    const executor: StepExecutor = async (node) => {
      executionOrder.push(node.kind);
      return { done: true };
    };

    const loadedTree = st.getTree(storeTree.rootId)!;
    await executeTaskTree(loadedTree, st, executor);

    // All 6 steps executed
    expect(executionOrder.length).toBe(6);
    // scaffold before pipeline before check/score before tts before render
    const scaffoldIdx = executionOrder.indexOf("scaffold");
    const pipelineIdx = executionOrder.indexOf("pipeline");
    const checkIdx = executionOrder.indexOf("check");
    const scoreIdx = executionOrder.indexOf("score");
    const ttsIdx = executionOrder.indexOf("tts");
    const renderIdx = executionOrder.indexOf("render");

    expect(scaffoldIdx).toBeLessThan(pipelineIdx);
    expect(pipelineIdx).toBeLessThan(checkIdx);
    expect(pipelineIdx).toBeLessThan(scoreIdx);
    expect(checkIdx).toBeLessThan(ttsIdx);
    expect(scoreIdx).toBeLessThan(ttsIdx);
    expect(ttsIdx).toBeLessThan(renderIdx);
  });
});
