import type {
  WorkflowStepKind,
  WorkflowTemplate,
  TaskTree,
  TaskNode,
} from "../../../shared/types";
import { TEMPLATE_DEPS } from "./templates";

let nodeCounter = 0;
function nodeId(): string {
  return `tn_${Date.now()}_${++nodeCounter}`;
}

/** Convert a WorkflowTemplate into a TaskTree with dependency edges. */
export function buildTaskTree(
  template: WorkflowTemplate,
  options?: Record<string, unknown>,
): TaskTree {
  const depMap = TEMPLATE_DEPS[template.id];
  if (!depMap) {
    return buildLinearTree(template, options);
  }

  const now = Date.now();
  const rootId = nodeId();
  const nodes: Record<string, TaskNode> = {
    [rootId]: {
      id: rootId,
      parentId: null,
      label: template.label,
      kind: "workflow",
      status: "pending",
      progress: 0,
      deps: [],
      children: [],
      metadata: { templateId: template.id, options },
    },
  };

  const kindToId = new Map<WorkflowStepKind, string>();

  for (const step of template.steps) {
    const id = nodeId();
    const depKinds = depMap[step.kind] ?? [];
    const deps = depKinds.map((k) => kindToId.get(k)).filter(Boolean) as string[];

    nodes[id] = {
      id,
      parentId: rootId,
      label: step.label,
      kind: step.kind,
      status: "pending",
      progress: 0,
      deps,
      children: [],
    };
    kindToId.set(step.kind, id);
    nodes[rootId].children.push(id);
  }

  return { rootId, nodes, createdAt: now, updatedAt: now };
}

function buildLinearTree(template: WorkflowTemplate, options?: Record<string, unknown>): TaskTree {
  const now = Date.now();
  const rootId = nodeId();
  const nodes: Record<string, TaskNode> = {
    [rootId]: {
      id: rootId,
      parentId: null,
      label: template.label,
      kind: "workflow",
      status: "pending",
      progress: 0,
      deps: [],
      children: [],
      metadata: { templateId: template.id, options },
    },
  };

  let prevId: string | undefined;
  for (const step of template.steps) {
    const id = nodeId();
    nodes[id] = {
      id,
      parentId: rootId,
      label: step.label,
      kind: step.kind,
      status: "pending",
      progress: 0,
      deps: prevId ? [prevId] : [],
      children: [],
    };
    nodes[rootId].children.push(id);
    prevId = id;
  }

  return { rootId, nodes, createdAt: now, updatedAt: now };
}
