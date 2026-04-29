/**
 * Agent coding benchmark — runs standardized tasks with different GLM models.
 *
 * For each model × task combination:
 * 1. Create an agent with the task's tool whitelist
 * 2. Send the task prompt
 * 3. Capture all events (tool calls, text output)
 * 4. Score the result
 *
 * Uses beforeToolCall hook to enforce tool call budget per task.
 */

import type { AgentEvent } from "@mariozechner/pi-agent-core";
import type { AgentTaskResult } from "./report.js";
import { CODING_TASKS, type BenchTask } from "./tasks/coding-tasks.js";
import { createToolsByNames } from "../agents/tool-registry.js";
import { getModel, getEnvApiKey } from "@mariozechner/pi-ai";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentSuiteOptions {
  models: string[];
  /** Override tasks (default: all CODING_TASKS) */
  tasks?: BenchTask[];
  /** Max tool calls per task before blocking (default: 15) */
  maxToolCalls?: number;
  /** Called after each model×task with progress */
  onProgress?: (model: string, taskId: string, index: number, total: number) => void;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

export async function runAgentSuite(options: AgentSuiteOptions): Promise<AgentTaskResult[]> {
  const { models, onProgress } = options;
  const tasks = options.tasks ?? CODING_TASKS;
  const maxToolCalls = options.maxToolCalls ?? 15;
  const results: AgentTaskResult[] = [];
  const total = models.length * tasks.length;
  let idx = 0;

  for (const modelStr of models) {
    const [provider, ...nameParts] = modelStr.split("/");
    const modelName = nameParts.join("/");
    if (!provider || !modelName) {
      console.error(`Skipping invalid model: ${modelStr}`);
      for (const task of tasks) {
        results.push(makeErrorResult(task, modelStr, "No API key"));
      }
      continue;
    }

    const apiKey = getEnvApiKey(provider as any);
    if (!apiKey) {
      console.error(`No API key for ${provider} — skipping ${modelStr}`);
      for (const task of tasks) {
        results.push(makeErrorResult(task, modelStr, "No API key"));
      }
      continue;
    }

    const model = getModel(provider as any, modelName as any);
    if (!model) {
      console.error(`Unknown model: ${modelStr} — skipping`);
      for (const task of tasks) {
        results.push(makeErrorResult(task, modelStr, "Unknown model"));
      }
      continue;
    }

    for (const task of tasks) {
      idx++;
      onProgress?.(modelStr, task.id, idx, total);
      console.log(`  [${idx}/${total}] ${modelStr} / ${task.name}...`);

      try {
        const result = await runTask(task, model, modelStr, apiKey, maxToolCalls);
        results.push(result);
        console.log(`    Score: ${result.totalScore}/10 (tool:${result.toolUseScore} resp:${result.responseScore} eff:${result.efficiencyScore})`);
      } catch (e: any) {
        console.error(`    Error: ${e.message}`);
        results.push(makeErrorResult(task, modelStr, e.message));
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Single task execution
// ---------------------------------------------------------------------------

const BENCH_SYSTEM_PROMPT = `You are a benchmark assistant scored on accuracy, completeness, and efficiency.

Guidelines:
- Plan before using tools. Use minimum tool calls needed.
- After gathering info, provide a complete, detailed response.
- When summarizing files, mention key structural elements: scenes, characters, dialogue, plot points.
- When analyzing code, identify specific issues with line references and suggest fixes.
- Do NOT repeat tool calls with the same arguments.
- Stop as soon as you have enough information to answer the task.

Scoring: tool usage (appropriate tools), response quality (completeness), efficiency (minimal tool calls).`;

async function runTask(
  task: BenchTask,
  model: any,
  modelStr: string,
  apiKey: string,
  maxToolCalls: number,
): Promise<AgentTaskResult> {
  // Dynamic import to avoid loading pi-agent-core at module scope
  const { Agent } = await import("@mariozechner/pi-agent-core");

  const { tools } = createToolsByNames(task.tools);

  // Tool call budget tracking
  let toolCallCount = 0;
  let budgetExceeded = false;

  const agent = new Agent({
    initialState: { systemPrompt: BENCH_SYSTEM_PROMPT, model, tools },
    getApiKey: () => apiKey,
    beforeToolCall: async (_context: any, _signal?: any) => {
      toolCallCount++;
      if (toolCallCount > maxToolCalls) {
        budgetExceeded = true;
        return { block: true, reason: `Tool call budget exceeded (${toolCallCount}/${maxToolCalls})` };
      }
      return undefined;
    },
  });

  const events: AgentEvent[] = [];
  let textOutput = "";
  let turnCount = 0;

  const unsubscribe = agent.subscribe((event: AgentEvent) => {
    events.push(event);
    if (event.type === "message_update") {
      const evt = (event as any).assistantMessageEvent;
      if (evt?.type === "text_delta") {
        textOutput += evt.delta ?? "";
      }
    }
    if (event.type === "turn_start") {
      turnCount++;
    }
  });

  const startMs = Date.now();
  try {
    await agent.prompt(task.prompt);
  } finally {
    unsubscribe();
  }
  const durationMs = Date.now() - startMs;

  // Score
  const score = task.score(events, textOutput);
  const totalScore = score.toolUse + score.response + score.efficiency;

  const toolCalls = events
    .filter((e): e is AgentEvent & { toolName: string } => e.type === "tool_execution_start")
    .map(e => e.toolName);

  return {
    taskId: task.id,
    taskName: task.name,
    model: modelStr,
    toolUseScore: score.toolUse,
    responseScore: score.response,
    efficiencyScore: score.efficiency,
    totalScore,
    toolCalls,
    textLength: textOutput.length,
    durationMs,
    turnCount,
    toolCallBudget: maxToolCalls,
    budgetExceeded,
  };
}

function makeErrorResult(task: BenchTask, modelStr: string, error: string): AgentTaskResult {
  return {
    taskId: task.id,
    taskName: task.name,
    model: modelStr,
    toolUseScore: 0,
    responseScore: 0,
    efficiencyScore: 0,
    totalScore: 0,
    toolCalls: [],
    textLength: 0,
    durationMs: 0,
    error,
    turnCount: 0,
    toolCallBudget: 15,
    budgetExceeded: false,
  };
}
