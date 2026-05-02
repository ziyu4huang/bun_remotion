import { executeTaskTree, type StepExecutor } from "./dag-executor";
import { TaskStore } from "./task-store";
import type {
  WorkflowStepKind,
  WorkflowTemplate,
  JobStatus,
  WorkflowResult,
  TaskTree,
} from "../../shared/types";

// Re-export from sub-modules for backward compatibility
export {
  REPO_ROOT,
  PROJ_DIR,
  STEP_AGENT_MAP,
  WORKFLOW_TEMPLATES,
  TEMPLATE_DEPS,
  listTemplates,
  getTemplate,
  stepProgress,
  type WorkflowTriggerOptions,
} from "./workflow/templates";

export { buildTaskTree } from "./workflow/task-tree-builder";
export { runStep } from "./workflow/step-executors";

import { buildTaskTree } from "./workflow/task-tree-builder";
import { stepProgress } from "./workflow/templates";
import { runStep } from "./workflow/step-executors";
import type { WorkflowTriggerOptions } from "./workflow/templates";

// ── Linear workflow runner ──

export async function runWorkflow(
  template: WorkflowTemplate,
  options: WorkflowTriggerOptions,
  reportOverall: (p: number, msg?: string) => void,
  signal?: AbortSignal,
): Promise<WorkflowResult> {
  const { steps } = template;
  const totalSteps = steps.length;
  const stepOutputs = new Map<number, unknown>();

  const result: WorkflowResult = {
    templateId: template.id,
    startedAt: Date.now(),
    currentStep: -1,
    steps: steps.map((s) => ({
      kind: s.kind,
      label: s.label,
      status: "pending" as JobStatus,
      progress: 0,
    })),
    options: JSON.parse(JSON.stringify(options)),
  };

  for (let i = 0; i < totalSteps; i++) {
    if (signal?.aborted) {
      for (let j = i; j < totalSteps; j++) result.steps[j].status = "pending";
      result.finishedAt = Date.now();
      throw new Error("Cancelled");
    }
    const step = steps[i];
    result.currentStep = i;
    result.steps[i].status = "running";

    const makeProgress = (p: number, msg?: string) => {
      result.steps[i].progress = p;
      const overall = stepProgress(i, totalSteps, p);
      const label = msg ? `${step.label} — ${msg}` : step.label;
      reportOverall(overall, `Step ${i + 1}/${totalSteps}: ${label}`);
    };

    try {
      const output = await runStep(step.kind, i, options, stepOutputs, makeProgress);
      stepOutputs.set(i, output);
      result.steps[i].status = "completed";
      result.steps[i].progress = 100;
      if (options.agent && output && typeof output === "object" && "_agentReport" in output) {
        result.steps[i].agentReport = (output as any)._agentReport;
      }
    } catch (err) {
      result.steps[i].status = "failed";
      result.steps[i].error = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      console.error(`[workflow] Step failed:`, err);
      result.finishedAt = Date.now();
      for (let j = i + 1; j < totalSteps; j++) {
        result.steps[j].status = "pending";
      }
      throw err;
    }
  }

  result.finishedAt = Date.now();
  return result;
}

/** Re-run a workflow starting from a given step index, copying completed steps from a previous result. */
export async function retryWorkflow(
  template: WorkflowTemplate,
  options: WorkflowTriggerOptions,
  previousResult: WorkflowResult,
  fromStep: number,
  reportOverall: (p: number, msg?: string) => void,
): Promise<WorkflowResult> {
  const { steps } = template;
  const totalSteps = steps.length;
  const stepOutputs = new Map<number, unknown>();

  const result: WorkflowResult = {
    templateId: template.id,
    startedAt: Date.now(),
    currentStep: -1,
    steps: steps.map((s, i) => {
      if (i < fromStep && previousResult.steps[i]) {
        return { ...previousResult.steps[i] };
      }
      return { kind: s.kind, label: s.label, status: "pending" as JobStatus, progress: 0 };
    }),
    options: JSON.parse(JSON.stringify(options)),
  };

  const prefixProgress = Math.floor((fromStep / totalSteps) * 100);
  reportOverall(prefixProgress, `Retrying from step ${fromStep + 1}/${totalSteps}`);

  for (let i = fromStep; i < totalSteps; i++) {
    const step = steps[i];
    result.currentStep = i;
    result.steps[i].status = "running";

    const makeProgress = (p: number, msg?: string) => {
      result.steps[i].progress = p;
      const overall = stepProgress(i, totalSteps, p);
      const label = msg ? `${step.label} — ${msg}` : step.label;
      reportOverall(overall, `Step ${i + 1}/${totalSteps}: ${label}`);
    };

    try {
      const output = await runStep(step.kind, i, options, stepOutputs, makeProgress);
      stepOutputs.set(i, output);
      result.steps[i].status = "completed";
      result.steps[i].progress = 100;
      if (options.agent && output && typeof output === "object" && "_agentReport" in output) {
        result.steps[i].agentReport = (output as any)._agentReport;
      }
    } catch (err) {
      result.steps[i].status = "failed";
      result.steps[i].error = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      console.error(`[workflow] Step failed:`, err);
      result.finishedAt = Date.now();
      for (let j = i + 1; j < totalSteps; j++) {
        result.steps[j].status = "pending";
      }
      throw err;
    }
  }

  result.finishedAt = Date.now();
  return result;
}

// ── DAG-based workflow runner ──

const workflowTaskStore = new TaskStore();

export async function runWorkflowDAG(
  template: WorkflowTemplate,
  options: WorkflowTriggerOptions,
  reportOverall: (p: number, msg?: string) => void,
  signal?: AbortSignal,
): Promise<WorkflowResult> {
  const tree = buildTaskTree(template, options as Record<string, unknown>);
  const totalSteps = template.steps.length;
  const stepOutputs = new Map<string, unknown>();

  const storeTree = workflowTaskStore.createTree({
    label: tree.nodes[tree.rootId].label,
    kind: "workflow",
  });
  const idMap = new Map<string, string>();
  idMap.set(tree.rootId, storeTree.rootId);

  for (const node of Object.values(tree.nodes)) {
    if (node.id === tree.rootId) continue;
    const mappedDeps = node.deps.map((d) => idMap.get(d)!).filter(Boolean);
    const added = workflowTaskStore.addNode(storeTree.rootId, {
      label: node.label,
      kind: node.kind,
      deps: mappedDeps,
    })!;
    idMap.set(node.id, added.id);
  }

  let completedCount = 0;
  const executor: StepExecutor = async (node) => {
    const stepIndex = template.steps.findIndex((s) => s.kind === node.kind);
    const makeProgress = (p: number, msg?: string) => {
      const overall = stepProgress(stepIndex, totalSteps, p);
      reportOverall(overall, `${node.label}${msg ? ` — ${msg}` : ""}`);
    };

    const output = await runStep(node.kind as WorkflowStepKind, stepIndex, options, stepOutputs, makeProgress);
    stepOutputs.set(node.id, output);
    return output;
  };

  const loadedTree = workflowTaskStore.getTree(storeTree.rootId)!;
  await executeTaskTree(loadedTree, workflowTaskStore, executor, {
    signal,
    onProgress(done, total) {
      completedCount = done;
    },
  });

  return treeToResult(template, workflowTaskStore.getTree(storeTree.rootId)!, options, stepOutputs);
}

export async function retryWorkflowDAG(
  treeId: string,
  template: WorkflowTemplate,
  options: WorkflowTriggerOptions,
  reportOverall: (p: number, msg?: string) => void,
): Promise<WorkflowResult> {
  const tree = workflowTaskStore.getTree(treeId);
  if (!tree) throw new Error(`Tree ${treeId} not found`);

  const totalSteps = template.steps.length;
  const stepOutputs = new Map<string, unknown>();

  for (const node of Object.values(tree.nodes)) {
    if (node.id === tree.rootId) continue;
    if (node.status === "failed" || node.status === "skipped") {
      workflowTaskStore.updateNode(treeId, node.id, {
        status: "pending",
        progress: 0,
        error: undefined,
        result: undefined,
        startedAt: undefined,
        finishedAt: undefined,
      });
    }
  }

  const executor: StepExecutor = async (node) => {
    const stepIndex = template.steps.findIndex((s) => s.kind === node.kind);
    const makeProgress = (p: number, msg?: string) => {
      const overall = stepProgress(stepIndex, totalSteps, p);
      reportOverall(overall, `${node.label}${msg ? ` — ${msg}` : ""}`);
    };

    const output = await runStep(node.kind as WorkflowStepKind, stepIndex, options, stepOutputs, makeProgress);
    stepOutputs.set(node.id, output);
    return output;
  };

  await executeTaskTree(tree, workflowTaskStore, executor);

  return treeToResult(template, workflowTaskStore.getTree(treeId)!, options, stepOutputs);
}

export function getWorkflowTaskStore(): TaskStore {
  return workflowTaskStore;
}

function treeToResult(
  template: WorkflowTemplate,
  tree: TaskTree,
  options: WorkflowTriggerOptions,
  stepOutputs: Map<string, unknown>,
): WorkflowResult {
  const stepNodes = Object.values(tree.nodes).filter((n) => n.id !== tree.rootId);
  const root = tree.nodes[tree.rootId];

  const result: WorkflowResult = {
    templateId: template.id,
    startedAt: root.startedAt ?? tree.createdAt,
    finishedAt: root.finishedAt,
    currentStep: stepNodes.filter((n) => n.status === "completed").length - 1,
    taskTreeId: tree.rootId,
    steps: template.steps.map((s) => {
      const node = stepNodes.find((n) => n.kind === s.kind);
      const status: JobStatus = node
        ? node.status === "skipped" ? "pending"
          : node.status as JobStatus
        : "pending";
      const output = node ? stepOutputs.get(node.id) : undefined;
      return {
        kind: s.kind,
        label: s.label,
        status,
        progress: node?.progress ?? 0,
        error: node?.error,
        result: output,
        agentReport: output && typeof output === "object" && "_agentReport" in (output as any)
          ? (output as any)._agentReport
          : undefined,
      };
    }),
    options: JSON.parse(JSON.stringify(options)),
  };

  return result;
}
