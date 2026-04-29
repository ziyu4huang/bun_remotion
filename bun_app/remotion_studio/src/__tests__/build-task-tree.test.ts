import { describe, test, expect } from "bun:test";
import { buildTaskTree, WORKFLOW_TEMPLATES } from "../server/services/workflow-engine";
import type { TaskNode } from "../shared/types";

function getTemplate(id: string) {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id)!;
}

/** Collect nodes by kind (excluding root). */
function nodesByKind(nodes: Record<string, TaskNode>, rootId: string) {
  const map = new Map<string, TaskNode>();
  for (const node of Object.values(nodes)) {
    if (node.id !== rootId) map.set(node.kind, node);
  }
  return map;
}

describe("buildTaskTree", () => {
  test("full-pipeline: 8 nodes (1 root + 7 steps)", () => {
    const tpl = getTemplate("full-pipeline");
    const tree = buildTaskTree(tpl);
    expect(Object.keys(tree.nodes).length).toBe(8);
    expect(tree.nodes[tree.rootId].kind).toBe("workflow");
    expect(tree.nodes[tree.rootId].children.length).toBe(7);
  });

  test("full-pipeline: check and score are parallel (both depend on pipeline, not each other)", () => {
    const tpl = getTemplate("full-pipeline");
    const tree = buildTaskTree(tpl);
    const byKind = nodesByKind(tree.nodes, tree.rootId);

    const pipeline = byKind.get("pipeline")!;
    const check = byKind.get("check")!;
    const score = byKind.get("score")!;

    expect(check.deps).toEqual([pipeline.id]);
    expect(score.deps).toEqual([pipeline.id]);
    expect(check.deps).not.toContain(score.id);
    expect(score.deps).not.toContain(check.id);
  });

  test("full-pipeline: tts depends on check+score, render depends on tts", () => {
    const tpl = getTemplate("full-pipeline");
    const tree = buildTaskTree(tpl);
    const byKind = nodesByKind(tree.nodes, tree.rootId);

    const check = byKind.get("check")!;
    const score = byKind.get("score")!;
    const tts = byKind.get("tts")!;
    const render = byKind.get("render")!;

    const image = byKind.get("image")!;
    expect(tts.deps.sort()).toEqual([check.id, score.id, image.id].sort());
    expect(render.deps).toEqual([tts.id]);
  });

  test("full-pipeline: scaffold has no deps", () => {
    const tpl = getTemplate("full-pipeline");
    const tree = buildTaskTree(tpl);
    const byKind = nodesByKind(tree.nodes, tree.rootId);

    expect(byKind.get("scaffold")!.deps).toEqual([]);
  });

  test("quality-gate: 4 nodes (root + 3 steps)", () => {
    const tpl = getTemplate("quality-gate");
    const tree = buildTaskTree(tpl);
    expect(Object.keys(tree.nodes).length).toBe(4);
  });

  test("quality-gate: check and score parallel after pipeline", () => {
    const tpl = getTemplate("quality-gate");
    const tree = buildTaskTree(tpl);
    const byKind = nodesByKind(tree.nodes, tree.rootId);

    const pipeline = byKind.get("pipeline")!;
    const check = byKind.get("check")!;
    const score = byKind.get("score")!;

    expect(check.deps).toEqual([pipeline.id]);
    expect(score.deps).toEqual([pipeline.id]);
  });

  test("image-tts-render: 4 nodes (root + 3 steps)", () => {
    const tpl = getTemplate("image-tts-render");
    const tree = buildTaskTree(tpl);
    expect(Object.keys(tree.nodes).length).toBe(4);
  });

  test("image-tts-render: image and tts are parallel, render depends on both", () => {
    const tpl = getTemplate("image-tts-render");
    const tree = buildTaskTree(tpl);
    const byKind = nodesByKind(tree.nodes, tree.rootId);

    const image = byKind.get("image")!;
    const tts = byKind.get("tts")!;
    const render = byKind.get("render")!;

    expect(image.deps).toEqual([]);
    expect(tts.deps).toEqual([]);
    expect(render.deps.sort()).toEqual([image.id, tts.id].sort());
  });

  test("unknown template falls back to linear chain", () => {
    const tpl = {
      id: "custom-linear",
      label: "Custom",
      description: "test",
      steps: [
        { kind: "scaffold" as const, label: "A" },
        { kind: "render" as const, label: "B" },
      ],
    };
    const tree = buildTaskTree(tpl);
    const byKind = nodesByKind(tree.nodes, tree.rootId);

    expect(Object.keys(tree.nodes).length).toBe(3);
    expect(byKind.get("scaffold")!.deps).toEqual([]);
    expect(byKind.get("render")!.deps).toEqual([byKind.get("scaffold")!.id]);
  });

  test("all nodes have consistent parent links", () => {
    for (const tpl of WORKFLOW_TEMPLATES) {
      const tree = buildTaskTree(tpl);
      for (const node of Object.values(tree.nodes)) {
        if (node.id === tree.rootId) {
          expect(node.parentId).toBeNull();
        } else {
          expect(node.parentId).toBe(tree.rootId);
          expect(tree.nodes[node.parentId].children).toContain(node.id);
        }
      }
    }
  });
});
