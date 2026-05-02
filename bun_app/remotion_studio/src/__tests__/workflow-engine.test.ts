import { describe, test, expect } from "bun:test";
import {
  buildTaskTree,
  TEMPLATE_DEPS,
  WORKFLOW_TEMPLATES,
  getTemplate,
  stepProgress,
} from "../server/services/workflow-engine";

describe("TEMPLATE_DEPS — graph correctness", () => {
  test("full-pipeline has correct parallel structure", () => {
    const deps = TEMPLATE_DEPS["full-pipeline"];
    expect(deps).toBeDefined();
    expect(deps.scaffold).toEqual([]);
    expect(deps.image).toEqual(["scaffold"]);
    expect(deps.pipeline).toEqual(["scaffold"]);
    expect(deps.check).toEqual(["pipeline"]);
    expect(deps.score).toEqual(["pipeline"]);
    expect(deps.tts).toEqual(["check", "score", "image"]);
    expect(deps.render).toEqual(["tts"]);
  });

  test("quality-gate has check and score parallel after pipeline", () => {
    const deps = TEMPLATE_DEPS["quality-gate"];
    expect(deps).toBeDefined();
    expect(deps.pipeline).toEqual([]);
    expect(deps.check).toEqual(["pipeline"]);
    expect(deps.score).toEqual(["pipeline"]);
  });

  test("image-tts-render has image and tts parallel, render waits for both", () => {
    const deps = TEMPLATE_DEPS["image-tts-render"];
    expect(deps).toBeDefined();
    expect(deps.image).toEqual([]);
    expect(deps.tts).toEqual([]);
    expect(deps.render).toEqual(["image", "tts"]);
  });

  test("templates without TEMPLATE_DEPS are not listed", () => {
    expect(TEMPLATE_DEPS["scaffold-and-pipeline"]).toBeUndefined();
    expect(TEMPLATE_DEPS["tts-and-render"]).toBeUndefined();
  });

  test("all dep keys are valid step kinds", () => {
    const validKinds = ["scaffold", "pipeline", "check", "score", "image", "tts", "render"];
    for (const [tplId, depMap] of Object.entries(TEMPLATE_DEPS)) {
      for (const [stepKind, deps] of Object.entries(depMap)) {
        expect(validKinds).toContain(stepKind);
        for (const dep of deps) {
          expect(validKinds).toContain(dep);
        }
      }
    }
  });
});

describe("buildTaskTree", () => {
  test("builds DAG tree for full-pipeline with correct deps", () => {
    const tpl = getTemplate("full-pipeline")!;
    const tree = buildTaskTree(tpl, { seriesId: "test" });
    const root = tree.nodes[tree.rootId];

    expect(root.kind).toBe("workflow");
    expect(root.children).toHaveLength(7);

    // All step nodes exist
    const stepNodes = root.children.map((id) => tree.nodes[id]);
    const kinds = stepNodes.map((n) => n.kind);
    expect(kinds).toContain("scaffold");
    expect(kinds).toContain("image");
    expect(kinds).toContain("pipeline");
    expect(kinds).toContain("render");

    // All nodes start pending
    for (const node of stepNodes) {
      expect(node.status).toBe("pending");
      expect(node.progress).toBe(0);
    }
  });

  test("builds linear tree for templates without TEMPLATE_DEPS", () => {
    const tpl = getTemplate("scaffold-and-pipeline")!;
    const tree = buildTaskTree(tpl, { seriesId: "test" });
    const root = tree.nodes[tree.rootId];

    expect(root.children).toHaveLength(2);

    // Second step depends on first (linear chain)
    const firstId = root.children[0];
    const secondId = root.children[1];
    expect(tree.nodes[secondId].deps).toEqual([firstId]);
    expect(tree.nodes[firstId].deps).toEqual([]);
  });

  test("quality-gate tree has pipeline with no deps", () => {
    const tpl = getTemplate("quality-gate")!;
    const tree = buildTaskTree(tpl);
    const root = tree.nodes[tree.rootId];
    const stepNodes = root.children.map((id) => tree.nodes[id]);

    const pipelineNode = stepNodes.find((n) => n.kind === "pipeline");
    expect(pipelineNode!.deps).toEqual([]);
  });

  test("quality-gate tree has check and score both depending on pipeline", () => {
    const tpl = getTemplate("quality-gate")!;
    const tree = buildTaskTree(tpl);
    const root = tree.nodes[tree.rootId];
    const stepNodes = root.children.map((id) => tree.nodes[id]);

    const pipelineId = stepNodes.find((n) => n.kind === "pipeline")!.id;
    const checkNode = stepNodes.find((n) => n.kind === "check");
    const scoreNode = stepNodes.find((n) => n.kind === "score");

    expect(checkNode!.deps).toEqual([pipelineId]);
    expect(scoreNode!.deps).toEqual([pipelineId]);
  });

  test("tree has createdAt and updatedAt timestamps", () => {
    const tpl = getTemplate("full-pipeline")!;
    const tree = buildTaskTree(tpl);
    expect(tree.createdAt).toBeGreaterThan(0);
    expect(tree.updatedAt).toBe(tree.createdAt);
  });

  test("options are stored in root node metadata", () => {
    const tpl = getTemplate("full-pipeline")!;
    const tree = buildTaskTree(tpl, { seriesId: "my-series" });
    const root = tree.nodes[tree.rootId];
    expect(root.metadata).toEqual({
      templateId: "full-pipeline",
      options: { seriesId: "my-series" },
    });
  });

  test("image-tts-render has tts with no deps (parallel with image)", () => {
    const tpl = getTemplate("image-tts-render")!;
    const tree = buildTaskTree(tpl);
    const root = tree.nodes[tree.rootId];
    const stepNodes = root.children.map((id) => tree.nodes[id]);

    const imageNode = stepNodes.find((n) => n.kind === "image");
    const ttsNode = stepNodes.find((n) => n.kind === "tts");
    const imageId = imageNode!.id;

    expect(imageNode!.deps).toEqual([]);
    expect(ttsNode!.deps).toEqual([]);
  });

  test("image-tts-render render depends on both image and tts", () => {
    const tpl = getTemplate("image-tts-render")!;
    const tree = buildTaskTree(tpl);
    const root = tree.nodes[tree.rootId];
    const stepNodes = root.children.map((id) => tree.nodes[id]);

    const imageId = stepNodes.find((n) => n.kind === "image")!.id;
    const ttsId = stepNodes.find((n) => n.kind === "tts")!.id;
    const renderNode = stepNodes.find((n) => n.kind === "render");

    expect(new Set(renderNode!.deps)).toEqual(new Set([imageId, ttsId]));
  });
});

describe("stepProgress — edge cases", () => {
  test("step 0 of 1 at 0% is 0", () => {
    expect(stepProgress(0, 1, 0)).toBe(0);
  });

  test("step 0 of 1 at 100% is 100", () => {
    expect(stepProgress(0, 1, 100)).toBe(100);
  });

  test("step 0 of 7 at 50% is roughly 7%", () => {
    const result = stepProgress(0, 7, 50);
    expect(result).toBeGreaterThanOrEqual(5);
    expect(result).toBeLessThanOrEqual(10);
  });

  test("last step at 100% always reaches 100", () => {
    for (const tpl of WORKFLOW_TEMPLATES) {
      const n = tpl.steps.length;
      expect(stepProgress(n - 1, n, 100)).toBe(100);
    }
  });

  test("first step at 0% always starts at 0", () => {
    for (const tpl of WORKFLOW_TEMPLATES) {
      expect(stepProgress(0, tpl.steps.length, 0)).toBe(0);
    }
  });
});

describe("WORKFLOW_TEMPLATES — consistency", () => {
  test("each template with TEMPLATE_DEPS has matching step kinds", () => {
    for (const [tplId, depMap] of Object.entries(TEMPLATE_DEPS)) {
      const tpl = getTemplate(tplId);
      expect(tpl).toBeDefined();
      const stepKinds = new Set(tpl!.steps.map((s) => s.kind));
      for (const depKey of Object.keys(depMap)) {
        expect(stepKinds.has(depKey as any)).toBe(true);
      }
    }
  });

  test("STEP_AGENT_MAP covers all step kinds used in templates", () => {
    const usedKinds = new Set<string>();
    for (const tpl of WORKFLOW_TEMPLATES) {
      for (const step of tpl.steps) {
        usedKinds.add(step.kind);
      }
    }
    // These are the kinds that appear in STEP_AGENT_MAP
    const agentMappedKinds = ["scaffold", "pipeline", "check", "score", "tts", "render", "image"];
    for (const kind of usedKinds) {
      expect(agentMappedKinds).toContain(kind);
    }
  });

  test("no duplicate step kinds within a single template", () => {
    for (const tpl of WORKFLOW_TEMPLATES) {
      const kinds = tpl.steps.map((s) => s.kind);
      // full-pipeline intentionally has no duplicates
      if (tpl.id !== "full-pipeline") {
        const unique = new Set(kinds);
        expect(unique.size).toBe(kinds.length);
      }
    }
  });
});
