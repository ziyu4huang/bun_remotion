/**
 * Standardized coding tasks for agent benchmarking.
 *
 * Each task defines a prompt, allowed tools, and a scoring function
 * that evaluates captured agent events.
 */

import type { AgentEvent } from "@mariozechner/pi-agent-core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BenchTask {
  id: string;
  name: string;
  prompt: string;
  tools: string[];
  /** Score agent events. Returns { toolUse: 0-4, response: 0-3, efficiency: 0-3 } */
  score: (events: AgentEvent[], text: string) => TaskScore;
}

export interface TaskScore {
  toolUse: number;      // 0-4
  response: number;     // 0-3
  efficiency: number;   // 0-3
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toolCallNames(events: AgentEvent[]): string[] {
  return events
    .filter((e): e is AgentEvent & { type: "tool_execution_start"; toolName: string } =>
      e.type === "tool_execution_start")
    .map(e => e.toolName);
}

function hasKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

function uniqueToolCount(events: AgentEvent[]): number {
  return new Set(toolCallNames(events)).size;
}

/** Continuous efficiency scoring: penalizes excessive tool calls with decay. */
export function efficiencyScore(totalCalls: number): number {
  if (totalCalls === 0) return 0;
  if (totalCalls <= 2) return 3;
  if (totalCalls <= 4) return 2;
  if (totalCalls <= 6) return 1.5;
  if (totalCalls <= 10) return 1;
  if (totalCalls <= 15) return 0.5;
  return 0;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export const CODING_TASKS: BenchTask[] = [
  {
    id: "task1-file-read",
    name: "File read + summarize",
    prompt:
      "Read the file bun_remotion_proj/weapon-forger/weapon-forger-ch1-ep2/scripts/narration.ts " +
      "and summarize its episode structure in 3-5 bullet points.",
    tools: ["Read", "Grep", "Find"],
    score(events, text) {
      const calls = toolCallNames(events);
      const usedRead = calls.includes("Read");
      const mentionedDialog = hasKeyword(text, [
        "dialog", "dialogLines", "對話", "dialogue", "conversation", "speech", "lines", "narration", "spoken", "voiceover", "talking",
      ]);
      const mentionedScene = hasKeyword(text, [
        "scene", "場景", "scenes", "segment", "sequence", "section", "part", "act", "chapter", "moment", "幕",
      ]);
      const mentionedCharacter = hasKeyword(text, [
        "character", "角色", "characters", "speaker", "role", "protagonist", "narrator", "person", "人物", "主角",
      ]);

      // Tool use (0-4): used Read (+2), used Grep/Find too (+1 each, max +2)
      const toolUse = Math.min(4, (usedRead ? 2 : 0) + Math.min(2, calls.filter(c => c !== "Read").length));

      // Response quality (0-3): mentioned key concepts
      const concepts = [mentionedDialog, mentionedScene, mentionedCharacter].filter(Boolean).length;
      // Fallback: if response is substantive (>300 chars about the file), award at least 1 point
      const response = Math.min(3, concepts > 0 ? concepts : (text.length >= 300 ? 1 : 0));

      // Efficiency (0-3): continuous decay
      const efficiency = efficiencyScore(calls.length);

      return { toolUse, response, efficiency };
    },
  },
  {
    id: "task2-code-analysis",
    name: "Code analysis",
    prompt:
      "Analyze the Remotion component at bun_remotion_proj/weapon-forger/weapon-forger-ch1-ep2/Root.tsx. " +
      "List any code quality issues, missing error handling, or style problems.",
    tools: ["Read", "Grep", "Find"],
    score(events, text) {
      const calls = toolCallNames(events);
      const usedRead = calls.includes("Read");
      const textLen = text.length;

      // Tool use (0-4)
      const toolUse = Math.min(4, (usedRead ? 2 : 0) + (calls.length >= 2 ? 2 : calls.length > 0 ? 1 : 0));

      // Response quality (0-3): keyword-based quality instead of pure length
      const mentionsIssue = hasKeyword(text, ["issue", "problem", "error", "missing", "improvement", "fix", "quality", "建議", "問題"]);
      const mentionsCode = hasKeyword(text, ["const", "function", "component", "return", "import", "type", "interface"]);
      const response = (mentionsIssue && mentionsCode) ? 3 : mentionsIssue ? 2 : textLen >= 300 ? 1 : 0;

      // Efficiency (0-3): continuous decay
      const efficiency = efficiencyScore(calls.length);

      return { toolUse, response, efficiency };
    },
  },
  {
    id: "task3-bug-fix",
    name: "Bug fix",
    prompt:
      "The test file bun_app/bun_pi_agent/src/__tests__/agent.test.ts has a failing test about tool count. " +
      "Read the test file, find the issue, and describe the fix. Do NOT edit the file.",
    tools: ["Read", "Grep", "Bash"],
    score(events, text) {
      const calls = toolCallNames(events);
      const usedRead = calls.includes("Read");
      const mentionsFix = hasKeyword(text, ["fix", "change", "update", "replace", "修改", "修正", "should be", "correct", "instead of", "needs to", "wrong"]);
      const mentionsTool = hasKeyword(text, ["tool", "32", "expect"]);

      // Tool use (0-4)
      const toolUse = Math.min(4, (usedRead ? 2 : 0) + (calls.length >= 2 ? 2 : 0));

      // Response quality (0-3): identified the fix
      const response = (mentionsFix && mentionsTool) ? 3 : mentionsFix ? 2 : mentionsTool ? 1 : 0;

      // Efficiency (0-3): continuous decay
      const efficiency = efficiencyScore(calls.length);

      return { toolUse, response, efficiency };
    },
  },
  {
    id: "task4-storygraph",
    name: "Storygraph pipeline",
    prompt:
      "Run the storygraph pipeline status check on the weapon-forger series " +
      "and report the current quality gate status. The series directory is " +
      "bun_remotion_proj/weapon-forger.",
    tools: ["sg_status", "sg_check", "sg_score", "Read"],
    score(events, text) {
      const calls = toolCallNames(events);
      const usedSgTool = calls.some(c => c.startsWith("sg_"));
      const mentionsScore = hasKeyword(text, ["score", "gate", "quality", "分數"]);
      const mentionsStatus = hasKeyword(text, ["pass", "warn", "fail", "status", "通過"]);

      // Tool use (0-4): used at least one sg_ tool (+2), used more (+1 each, max +2)
      const sgCount = calls.filter(c => c.startsWith("sg_")).length;
      const toolUse = Math.min(4, (usedSgTool ? 2 : 0) + Math.min(2, sgCount - 1 > 0 ? sgCount - 1 : 0));

      // Response quality (0-3): reported meaningful results
      const response = (mentionsScore && mentionsStatus) ? 3 : mentionsScore ? 2 : mentionsStatus ? 1 : 0;

      // Efficiency (0-3): continuous decay (slightly higher budget for sg tasks)
      const efficiency = efficiencyScore(calls.length + 2);

      return { toolUse, response, efficiency };
    },
  },
  {
    id: "task5-orchestration",
    name: "Multi-step orchestration",
    prompt:
      "List all available Remotion series, then pick the first one and list its episodes. " +
      "Finally, suggest improvements for the latest episode.",
    tools: ["sc_series_list", "sc_episode_list", "sg_suggest", "sg_status", "Read"],
    score(events, text) {
      const calls = toolCallNames(events);
      const uniqueTools = uniqueToolCount(events);
      const mentionsSeries = hasKeyword(text, ["weapon-forger", "series", "系列"]);
      const mentionsEpisode = hasKeyword(text, ["episode", "ep", "集"]);

      // Tool use (0-4): used multiple tools (+1 each unique tool, max 4)
      const toolUse = Math.min(4, uniqueTools);

      // Response quality (0-3): coherent multi-step answer
      const response = (mentionsSeries && mentionsEpisode) ? 3 : mentionsSeries ? 2 : mentionsEpisode ? 1 : 0;

      // Efficiency (0-3): used ≥3 tools efficiently
      const efficiency = uniqueTools >= 3 ? 3 : uniqueTools >= 2 ? 2 : uniqueTools >= 1 ? 1 : 0;

      return { toolUse, response, efficiency };
    },
  },
  {
    id: "task6-file-write-plan",
    name: "File write plan",
    prompt:
      "Create a plan for adding a new episode to the weapon-forger series (ch2ep4). " +
      "List the files that would need to be created and their purposes. " +
      "Look at an existing episode for reference.",
    tools: ["Read", "Find", "sc_series_list", "sc_episode_list"],
    score(events, text) {
      const calls = toolCallNames(events);
      const usedRead = calls.includes("Read");
      const usedExplore = calls.some(c => c === "Find" || c === "sc_series_list" || c === "sc_episode_list");
      const mentionsFile = hasKeyword(text, ["component", "narration", "config", "Root.tsx", "scene", "文件", "檔案"]);
      const mentionsStructure = hasKeyword(text, ["episode", "composition", "props", "template", "結構"]);

      const toolUse = Math.min(4, (usedRead ? 2 : 0) + (usedExplore ? 2 : 0));
      const response = (mentionsFile && mentionsStructure) ? 3 : mentionsFile ? 2 : mentionsStructure ? 1 : 0;
      const efficiency = efficiencyScore(calls.length);

      return { toolUse, response, efficiency };
    },
  },
  {
    id: "task7-error-diagnosis",
    name: "Error diagnosis",
    prompt:
      "The storygraph pipeline for weapon-forger may be showing warnings. " +
      "Run the quality check tools, identify which checks are flagging warnings, " +
      "and explain what they mean. Series directory: bun_remotion_proj/weapon-forger.",
    tools: ["sg_status", "sg_check", "sg_score", "sg_health", "Read"],
    score(events, text) {
      const calls = toolCallNames(events);
      const sgToolCount = calls.filter(c => c.startsWith("sg_")).length;
      const usedMultipleSg = sgToolCount >= 2;
      const mentionsCheck = hasKeyword(text, ["check", "gate", "warn", "fail", "quality", "score", "檢查", "警告"]);
      const explains = hasKeyword(text, ["because", "due to", "missing", "caused by", "indicates", "means"]);

      const toolUse = Math.min(4, Math.min(4, sgToolCount));
      const response = (mentionsCheck && explains) ? 3 : mentionsCheck ? 2 : (text.length >= 200 ? 1 : 0);
      const efficiency = efficiencyScore(calls.length + 2);

      return { toolUse, response, efficiency };
    },
  },
  {
    id: "task8-cross-file",
    name: "Cross-file comparison",
    prompt:
      "Compare the narration files between weapon-forger ch1ep2 and ch1ep3. " +
      "Describe the differences in structure and content. " +
      "Files: bun_remotion_proj/weapon-forger/weapon-forger-ch1-ep2/scripts/narration.ts " +
      "and bun_remotion_proj/weapon-forger/weapon-forger-ch1-ep3/scripts/narration.ts",
    tools: ["Read", "Grep", "Find"],
    score(events, text) {
      const calls = toolCallNames(events);
      const readCount = calls.filter(c => c === "Read").length;
      const readBoth = readCount >= 2;
      const mentionsDiff = hasKeyword(text, ["difference", "different", "compared", "contrast", "差異", "不同", "vs"]);
      const mentionsContent = hasKeyword(text, ["dialog", "scene", "character", "narration", "plot", "story"]);

      const toolUse = Math.min(4, (readBoth ? 3 : readCount > 0 ? 2 : 0) + (calls.length > readCount ? 1 : 0));
      const response = (mentionsDiff && mentionsContent) ? 3 : mentionsDiff ? 2 : (text.length >= 200 ? 1 : 0);
      const efficiency = efficiencyScore(calls.length);

      return { toolUse, response, efficiency };
    },
  },
  {
    id: "task9-code-gen",
    name: "Code generation plan",
    prompt:
      "Write a detailed plan for creating a new Remotion composition that renders " +
      "a karaoke-style text animation with word-by-word highlighting. " +
      "Specify the props interface, composition config, and component structure. " +
      "Look at existing compositions for reference.",
    tools: ["Read", "Grep", "Find"],
    score(events, text) {
      const calls = toolCallNames(events);
      const usedRead = calls.includes("Read");
      const mentionsProps = hasKeyword(text, ["props", "interface", "type", "屬性"]);
      const mentionsStructure = hasKeyword(text, ["component", "composition", "useCurrentFrame", "interpolate", "absoluteFill"]);
      const mentionsConfig = hasKeyword(text, ["duration", "fps", "width", "height", "config"]);

      const toolUse = Math.min(4, (usedRead ? 2 : 0) + (calls.length >= 2 ? 2 : 0));
      const concepts = [mentionsProps, mentionsStructure, mentionsConfig].filter(Boolean).length;
      const response = Math.min(3, concepts);
      const efficiency = efficiencyScore(calls.length);

      return { toolUse, response, efficiency };
    },
  },
  {
    id: "task10-regression",
    name: "Regression check",
    prompt:
      "Check the storygraph regression status for weapon-forger. " +
      "If there's no baseline, explain how to set one up. " +
      "If there is, report the delta. Series directory: bun_remotion_proj/weapon-forger.",
    tools: ["sg_regression", "sg_status", "Read"],
    score(events, text) {
      const calls = toolCallNames(events);
      const usedRegression = calls.includes("sg_regression");
      const mentionsBaseline = hasKeyword(text, ["baseline", "regression", "delta", "score", "baseline"]);
      const explainsProcess = hasKeyword(text, ["baseline", "update", "set", "create", "run", "command"]);

      const toolUse = Math.min(4, (usedRegression ? 3 : 0) + (calls.length >= 2 ? 1 : 0));
      const response = (mentionsBaseline && explainsProcess) ? 3 : mentionsBaseline ? 2 : (text.length >= 150 ? 1 : 0);
      const efficiency = efficiencyScore(calls.length + 2);

      return { toolUse, response, efficiency };
    },
  },
];
