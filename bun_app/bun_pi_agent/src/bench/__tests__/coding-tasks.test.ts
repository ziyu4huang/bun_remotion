import { describe, test, expect } from "bun:test";
import { CODING_TASKS, efficiencyScore } from "../tasks/coding-tasks.js";

describe("CODING_TASKS", () => {
  test("has 10 tasks", () => {
    expect(CODING_TASKS).toHaveLength(10);
  });

  test("each task has required fields", () => {
    for (const task of CODING_TASKS) {
      expect(task.id).toBeTruthy();
      expect(task.name).toBeTruthy();
      expect(task.prompt.length).toBeGreaterThan(10);
      expect(task.tools.length).toBeGreaterThan(0);
      expect(typeof task.score).toBe("function");
    }
  });

  test("task IDs are unique", () => {
    const ids = CODING_TASKS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("task1 scoring: perfect response", () => {
    const task = CODING_TASKS.find(t => t.id === "task1-file-read")!;
    const events = [
      { type: "tool_execution_start", toolName: "Read" },
    ] as any[];
    const text = "The file contains dialog and scenes with multiple characters.";

    const score = task.score(events, text);
    expect(score.toolUse).toBeGreaterThanOrEqual(1);
    expect(score.response).toBeGreaterThanOrEqual(1);
  });

  test("task1 scoring: empty response", () => {
    const task = CODING_TASKS.find(t => t.id === "task1-file-read")!;
    const score = task.score([], "");
    expect(score.toolUse).toBe(0);
    expect(score.response).toBe(0);
  });

  test("task1 scoring: expanded keywords match dialogue/conversation/speaker", () => {
    const task = CODING_TASKS.find(t => t.id === "task1-file-read")!;
    const events = [{ type: "tool_execution_start", toolName: "Read" }] as any[];

    // "dialogue" should match the dialog concept
    const score1 = task.score(events, "The file contains dialogue between characters in each scene.");
    expect(score1.response).toBeGreaterThanOrEqual(2);

    // "conversation" should match
    const score2 = task.score(events, "Conversation segments and scene transitions are present.");
    expect(score2.response).toBeGreaterThanOrEqual(2);

    // "speaker" should match character concept
    const score3 = task.score(events, "Each speaker has dialog lines in the narration.");
    expect(score3.response).toBeGreaterThanOrEqual(2);
  });

  test("task1 scoring: substantive text fallback", () => {
    const task = CODING_TASKS.find(t => t.id === "task1-file-read")!;
    const events = [{ type: "tool_execution_start", toolName: "Read" }] as any[];
    // Long text without keywords → fallback to 1 point
    const longText = "The file exports a TypeScript module. ".repeat(15);
    const score = task.score(events, longText);
    expect(score.response).toBe(1);
  });

  test("task2 scoring: keyword quality instead of length", () => {
    const task = CODING_TASKS.find(t => t.id === "task2-code-analysis")!;
    const events = [{ type: "tool_execution_start", toolName: "Read" }] as any[];

    // mentions issue + code → 3
    const score1 = task.score(events, "Found a missing error handling issue in the component function.");
    expect(score1.response).toBe(3);

    // mentions issue only (no code keywords) → 2
    const score2 = task.score(events, "There is a quality problem with the overall design approach.");
    expect(score2.response).toBe(2);

    // short text with no keywords → 0
    const score3 = task.score(events, "ok");
    expect(score3.response).toBe(0);
  });

  test("task3 scoring: expanded fix keywords", () => {
    const task = CODING_TASKS.find(t => t.id === "task3-bug-fix")!;
    const events = [{ type: "tool_execution_start", toolName: "Read" }] as any[];

    // "should be" + "tool" → 3
    const score1 = task.score(events, "The tool count should be 32, not 29.");
    expect(score1.response).toBe(3);

    // "correct" + "expect" → 3
    const score2 = task.score(events, "The correct value for expect is 32 tool calls.");
    expect(score2.response).toBe(3);
  });

  test("task4 scoring: uses sg_ tool and reports results", () => {
    const task = CODING_TASKS.find(t => t.id === "task4-storygraph")!;
    const events = [
      { type: "tool_execution_start", toolName: "sg_status" },
      { type: "tool_execution_start", toolName: "sg_score" },
    ] as any[];
    const text = "The quality gate score is 87.5 (PASS). Blended score: 82.3.";

    const score = task.score(events, text);
    expect(score.toolUse).toBeGreaterThanOrEqual(2);
    expect(score.response).toBe(3);
  });

  test("task5 scoring: uses 3+ unique tools", () => {
    const task = CODING_TASKS.find(t => t.id === "task5-orchestration")!;
    const events = [
      { type: "tool_execution_start", toolName: "sc_series_list" },
      { type: "tool_execution_start", toolName: "sc_episode_list" },
      { type: "tool_execution_start", toolName: "sg_suggest" },
    ] as any[];
    const text = "Found series weapon-forger with 8 episodes. Latest episode ch3ep2 could improve pacing.";

    const score = task.score(events, text);
    expect(score.toolUse).toBe(3);
    expect(score.response).toBe(3);
    expect(score.efficiency).toBe(3);
  });

  test("task6 scoring: file write plan with Read + explore", () => {
    const task = CODING_TASKS.find(t => t.id === "task6-file-write-plan")!;
    const events = [
      { type: "tool_execution_start", toolName: "Read" },
      { type: "tool_execution_start", toolName: "sc_episode_list" },
    ] as any[];
    const text = "Need to create Root.tsx component, narration.ts config, and scene files for the new episode composition.";

    const score = task.score(events, text);
    expect(score.toolUse).toBe(4);
    expect(score.response).toBe(3);
  });

  test("task6 scoring: no tools used", () => {
    const task = CODING_TASKS.find(t => t.id === "task6-file-write-plan")!;
    const score = task.score([], "Need to create some files.");
    expect(score.toolUse).toBe(0);
    expect(score.response).toBeLessThanOrEqual(1);
  });

  test("task7 scoring: error diagnosis with sg tools + explanation", () => {
    const task = CODING_TASKS.find(t => t.id === "task7-error-diagnosis")!;
    const events = [
      { type: "tool_execution_start", toolName: "sg_check" },
      { type: "tool_execution_start", toolName: "sg_health" },
    ] as any[];
    const text = "The quality check shows warnings because some scenes are missing character interactions. This indicates the narrator is not properly tracked due to missing role annotations.";

    const score = task.score(events, text);
    expect(score.toolUse).toBeGreaterThanOrEqual(2);
    expect(score.response).toBe(3);
  });

  test("task7 scoring: mentions checks but no explanation", () => {
    const task = CODING_TASKS.find(t => t.id === "task7-error-diagnosis")!;
    const events = [
      { type: "tool_execution_start", toolName: "sg_status" },
    ] as any[];
    const text = "The gate score is 75 with 3 warnings.";

    const score = task.score(events, text);
    expect(score.response).toBe(2);
  });

  test("task8 scoring: cross-file comparison reads both files", () => {
    const task = CODING_TASKS.find(t => t.id === "task8-cross-file")!;
    const events = [
      { type: "tool_execution_start", toolName: "Read" },
      { type: "tool_execution_start", toolName: "Read" },
    ] as any[];
    const text = "The main difference is that ep3 has more dialog scenes compared to ep2, with different character interactions.";

    const score = task.score(events, text);
    expect(score.toolUse).toBe(3);
    expect(score.response).toBe(3);
  });

  test("task8 scoring: only reads one file", () => {
    const task = CODING_TASKS.find(t => t.id === "task8-cross-file")!;
    const events = [
      { type: "tool_execution_start", toolName: "Read" },
    ] as any[];
    const text = "The file has dialog and scenes but I only read one file so can't compare the difference.";

    const score = task.score(events, text);
    expect(score.toolUse).toBe(2);
  });

  test("task9 scoring: code gen plan with all concepts", () => {
    const task = CODING_TASKS.find(t => t.id === "task9-code-gen")!;
    const events = [
      { type: "tool_execution_start", toolName: "Read" },
      { type: "tool_execution_start", toolName: "Grep" },
    ] as any[];
    const text = "Props interface should have text, highlightIndex. Use useCurrentFrame and interpolate for absoluteFill animation. Duration 150 frames at 30fps config.";

    const score = task.score(events, text);
    expect(score.toolUse).toBe(4);
    expect(score.response).toBe(3);
  });

  test("task9 scoring: no code concepts mentioned", () => {
    const task = CODING_TASKS.find(t => t.id === "task9-code-gen")!;
    const score = task.score([], "I would make a cool text animation.");
    expect(score.response).toBe(0);
  });

  test("task10 scoring: regression check with sg_regression tool", () => {
    const task = CODING_TASKS.find(t => t.id === "task10-regression")!;
    const events = [
      { type: "tool_execution_start", toolName: "sg_regression" },
      { type: "tool_execution_start", toolName: "sg_status" },
    ] as any[];
    const text = "The regression delta shows no baseline set. To create one, run the baseline update command with the current score.";

    const score = task.score(events, text);
    expect(score.toolUse).toBe(4);
    expect(score.response).toBe(3);
  });

  test("task10 scoring: mentions baseline but no process explanation", () => {
    const task = CODING_TASKS.find(t => t.id === "task10-regression")!;
    const events = [
      { type: "tool_execution_start", toolName: "sg_regression" },
    ] as any[];
    const text = "No regression data found.";

    const score = task.score(events, text);
    expect(score.toolUse).toBe(3);
    expect(score.response).toBe(2);
  });
});

describe("efficiencyScore", () => {
  test("0 calls = 0", () => {
    expect(efficiencyScore(0)).toBe(0);
  });

  test("1-2 calls = 3 (optimal)", () => {
    expect(efficiencyScore(1)).toBe(3);
    expect(efficiencyScore(2)).toBe(3);
  });

  test("3-4 calls = 2", () => {
    expect(efficiencyScore(3)).toBe(2);
    expect(efficiencyScore(4)).toBe(2);
  });

  test("5-6 calls = 1.5", () => {
    expect(efficiencyScore(5)).toBe(1.5);
    expect(efficiencyScore(6)).toBe(1.5);
  });

  test("7-10 calls = 1", () => {
    expect(efficiencyScore(7)).toBe(1);
    expect(efficiencyScore(10)).toBe(1);
  });

  test("11-15 calls = 0.5", () => {
    expect(efficiencyScore(11)).toBe(0.5);
    expect(efficiencyScore(15)).toBe(0.5);
  });

  test("35 calls (glm-5 bug fix) = 0", () => {
    expect(efficiencyScore(35)).toBe(0);
  });

  test("14 calls (glm-5.1 bug fix) = 0.5", () => {
    expect(efficiencyScore(14)).toBe(0.5);
  });

  test("6 vs 14 calls differentiate", () => {
    expect(efficiencyScore(6)).toBeGreaterThan(efficiencyScore(14));
  });
});
