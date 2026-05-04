/**
 * E2E integration tests for the workflow DAG pipeline.
 *
 * Tests the full-pipeline template from scaffold → pipeline → check → score → tts → render
 * using mock executors to verify DAG ordering, parallel execution, and failure propagation.
 * Uses the weapon-forger fixture for pre-condition validation.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { TaskStore } from "../server/services/task-store";
import { executeTaskTree, type StepExecutor } from "../server/services/dag-executor";
import { buildTaskTree } from "../server/services/workflow/task-tree-builder";
import { WORKFLOW_TEMPLATES, TEMPLATE_DEPS } from "../server/services/workflow/templates";
import { validateWorkflow } from "../server/services/workflow/step-validator";
import type { TaskNode, TaskTree } from "../shared/types";

const TMP_DIR = resolve(import.meta.dir, "__tmp_pipeline_integration__");
const TMP_FILE = resolve(TMP_DIR, "task-trees.json");

function makeStore(): TaskStore {
  return new TaskStore(TMP_FILE);
}

function getTemplate(id: string) {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id)!;
}

/** Insert a task tree into the store, preserving dependency edges. */
function insertTree(tree: TaskTree, store: TaskStore): TaskTree {
  const storeTree = store.createTree({
    label: tree.nodes[tree.rootId].label,
    kind: "workflow",
  });

  const idMap = new Map<string, string>();
  idMap.set(tree.rootId, storeTree.rootId);

  for (const node of Object.values(tree.nodes)) {
    if (node.id === tree.rootId) continue;
    const mappedDeps = node.deps.map((d) => idMap.get(d)!).filter(Boolean);
    const added = store.addNode(storeTree.rootId, {
      label: node.label,
      kind: node.kind,
      deps: mappedDeps,
    })!;
    idMap.set(node.id, added.id);
  }

  return store.getTree(storeTree.rootId)!;
}

describe("Pipeline E2E: Full-Pipeline Template", () => {
  beforeEach(() => {
    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
    mkdirSync(TMP_DIR, { recursive: true });
  });
  afterEach(() => {
    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
  });

  test("happy path: all 7 steps complete in correct order", async () => {
    const tpl = getTemplate("full-pipeline");
    const tree = buildTaskTree(tpl);
    const store = makeStore();
    const inserted = insertTree(tree, store);

    const executionOrder: string[] = [];
    const executor: StepExecutor = async (node) => {
      executionOrder.push(node.kind);
      // Simulate work
      await new Promise((r) => setTimeout(r, 10));
      return { success: true, kind: node.kind };
    };

    const result = await executeTaskTree(inserted, store, executor);

    // All 7 steps executed
    expect(executionOrder).toHaveLength(7);
    expect(executionOrder).toContain("scaffold");
    expect(executionOrder).toContain("pipeline");
    expect(executionOrder).toContain("check");
    expect(executionOrder).toContain("score");
    expect(executionOrder).toContain("tts");
    expect(executionOrder).toContain("render");
    expect(executionOrder).toContain("image");

    // Root completed
    const root = result.nodes[result.rootId];
    expect(root.status).toBe("completed");

    // Verify ordering constraints from TEMPLATE_DEPS
    const idx = (kind: string) => executionOrder.indexOf(kind);

    // scaffold before [image, pipeline]
    expect(idx("scaffold")).toBeLessThan(idx("image"));
    expect(idx("scaffold")).toBeLessThan(idx("pipeline"));

    // pipeline before [check, score]
    expect(idx("pipeline")).toBeLessThan(idx("check"));
    expect(idx("pipeline")).toBeLessThan(idx("score"));

    // [check, score, image] before tts
    expect(idx("check")).toBeLessThan(idx("tts"));
    expect(idx("score")).toBeLessThan(idx("tts"));
    expect(idx("image")).toBeLessThan(idx("tts"));

    // tts before render
    expect(idx("tts")).toBeLessThan(idx("render"));
  });

  test("happy path: parallel steps run concurrently", async () => {
    const tpl = getTemplate("full-pipeline");
    const tree = buildTaskTree(tpl);
    const store = makeStore();
    const inserted = insertTree(tree, store);

    const timestamps: Record<string, number> = {};
    const executor: StepExecutor = async (node) => {
      timestamps[node.kind] = Date.now();
      await new Promise((r) => setTimeout(r, 50));
      return { success: true };
    };

    await executeTaskTree(inserted, store, executor);

    // image and pipeline should start at roughly the same time (both depend only on scaffold)
    const imageStart = timestamps["image"];
    const pipelineStart = timestamps["pipeline"];
    expect(Math.abs(imageStart - pipelineStart)).toBeLessThan(100);

    // check and score should start at roughly the same time (both depend on pipeline)
    const checkStart = timestamps["check"];
    const scoreStart = timestamps["score"];
    expect(Math.abs(checkStart - scoreStart)).toBeLessThan(100);
  });

  test("failure propagation: pipeline failure skips check/score/tts/render", async () => {
    const tpl = getTemplate("full-pipeline");
    const tree = buildTaskTree(tpl);
    const store = makeStore();
    const inserted = insertTree(tree, store);

    const executor: StepExecutor = async (node) => {
      if (node.kind === "pipeline") {
        throw new Error("Pipeline failed: missing story files");
      }
      await new Promise((r) => setTimeout(r, 10));
      return { success: true };
    };

    const result = await executeTaskTree(inserted, store, executor);

    // scaffold and image should complete (they don't depend on pipeline)
    const root = result.nodes[result.rootId];
    const findNode = (kind: string) =>
      Object.values(result.nodes).find((n) => n.kind === kind)!;

    expect(findNode("scaffold").status).toBe("completed");
    expect(findNode("image").status).toBe("completed");
    expect(findNode("pipeline").status).toBe("failed");
    expect(findNode("check").status).toBe("skipped");
    expect(findNode("score").status).toBe("skipped");
    expect(findNode("tts").status).toBe("skipped");
    expect(findNode("render").status).toBe("skipped");

    // Root should be failed (not all completed)
    expect(root.status).toBe("failed");
  });

  test("failure propagation: scaffold failure skips all downstream", async () => {
    const tpl = getTemplate("full-pipeline");
    const tree = buildTaskTree(tpl);
    const store = makeStore();
    const inserted = insertTree(tree, store);

    const executor: StepExecutor = async (node) => {
      if (node.kind === "scaffold") {
        throw new Error("Scaffold failed: invalid category");
      }
      return { success: true };
    };

    const result = await executeTaskTree(inserted, store, executor);
    const findNode = (kind: string) =>
      Object.values(result.nodes).find((n) => n.kind === kind)!;

    expect(findNode("scaffold").status).toBe("failed");
    expect(findNode("image").status).toBe("skipped");
    expect(findNode("pipeline").status).toBe("skipped");
    expect(findNode("check").status).toBe("skipped");
    expect(findNode("score").status).toBe("skipped");
    expect(findNode("tts").status).toBe("skipped");
    expect(findNode("render").status).toBe("skipped");
  });

  test("failure propagation: tts failure skips render only", async () => {
    const tpl = getTemplate("full-pipeline");
    const tree = buildTaskTree(tpl);
    const store = makeStore();
    const inserted = insertTree(tree, store);

    const executor: StepExecutor = async (node) => {
      if (node.kind === "tts") {
        throw new Error("TTS failed: no dialog files found");
      }
      await new Promise((r) => setTimeout(r, 10));
      return { success: true };
    };

    const result = await executeTaskTree(inserted, store, executor);
    const findNode = (kind: string) =>
      Object.values(result.nodes).find((n) => n.kind === kind)!;

    // Everything up to tts should complete
    expect(findNode("scaffold").status).toBe("completed");
    expect(findNode("pipeline").status).toBe("completed");
    expect(findNode("check").status).toBe("completed");
    expect(findNode("score").status).toBe("completed");
    expect(findNode("image").status).toBe("completed");

    // tts fails, render skipped
    expect(findNode("tts").status).toBe("failed");
    expect(findNode("render").status).toBe("skipped");
  });
});

describe("Pipeline E2E: Template Dependency Validation", () => {
  test("all templates with TEMPLATE_DEPS have valid dependency refs", () => {
    for (const [templateId, depMap] of Object.entries(TEMPLATE_DEPS)) {
      const tpl = getTemplate(templateId);
      expect(tpl).toBeDefined();

      const stepKinds = new Set(tpl.steps.map((s) => s.kind));

      // Every dependency must reference a step that exists in the template
      for (const [stepKind, deps] of Object.entries(depMap)) {
        expect(stepKinds.has(stepKind as any)).toBe(true);
        for (const dep of deps) {
          expect(stepKinds.has(dep)).toBe(true);
        }
      }

      // Every step in the template must have a dep entry
      for (const step of tpl.steps) {
        expect(depMap[step.kind]).toBeDefined();
      }
    }
  });

  test("full-pipeline DAG has no cycles", () => {
    const tpl = getTemplate("full-pipeline");
    const tree = buildTaskTree(tpl);

    // Verify no cycles via topological sort attempt
    const visited = new Set<string>();
    const inStack = new Set<string>();
    let hasCycle = false;

    function dfs(nodeId: string) {
      if (inStack.has(nodeId)) { hasCycle = true; return; }
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      inStack.add(nodeId);

      const node = tree.nodes[nodeId];
      if (node) {
        // Find nodes that have this node as a dependency
        for (const n of Object.values(tree.nodes)) {
          if (n.deps.includes(nodeId)) dfs(n.id);
        }
      }
      inStack.delete(nodeId);
    }

    // Start from root
    dfs(tree.rootId);
    expect(hasCycle).toBe(false);
  });
});

describe("Pipeline E2E: Pre-execution Validation with Fixtures", () => {
  test("weapon-forger passes validation for quality-gate steps", () => {
    const steps = [
      { kind: "pipeline" as const },
      { kind: "check" as const },
      { kind: "score" as const },
    ];

    const results = validateWorkflow(steps, { seriesId: "weapon-forger" });
    for (const [, r] of results) {
      expect(r.valid).toBe(true);
      expect(r.errors).toHaveLength(0);
    }
  });

  test("weapon-forger passes validation for full-pipeline steps", () => {
    const steps = [
      { kind: "scaffold" as const },
      { kind: "image" as const },
      { kind: "pipeline" as const },
      { kind: "check" as const },
      { kind: "score" as const },
      { kind: "tts" as const },
      { kind: "render" as const },
    ];

    const results = validateWorkflow(steps, {
      seriesId: "weapon-forger",
      images: [{ filename: "test.png", prompt: "warrior" }],
    });

    for (const [kind, r] of results) {
      expect(r.valid).toBe(true);
      expect(r.errors).toHaveLength(0);
    }
  });

  test("non-existent series fails validation for pipeline", () => {
    const result = validateWorkflow(
      [{ kind: "pipeline" }],
      { seriesId: "nonexistent-xyz" },
    );
    expect(result.get("pipeline")!.valid).toBe(false);
  });
});
