import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { renderEvent } from "../cli/renderer.js";
import type { AgentEvent } from "@mariozechner/pi-agent-core";

describe("renderEvent", () => {
  let captured: string[];
  let originalLog: typeof console.log;
  let originalWrite: typeof process.stdout.write;

  beforeEach(() => {
    captured = [];
    originalLog = console.log;
    originalWrite = process.stdout.write;

    // Mock console.log — renderer uses it for tool events
    console.log = mock((...args: any[]) => {
      captured.push(args.map(String).join(" "));
    }) as any;

    // Mock process.stdout.write — renderer uses it for text/thinking deltas
    process.stdout.write = mock((chunk: any) => {
      captured.push(typeof chunk === "string" ? chunk : "");
      return true;
    }) as any;
  });

  afterEach(() => {
    console.log = originalLog;
    process.stdout.write = originalWrite;
  });

  function getOutput(): string {
    return captured.join("");
  }

  test("agent_start produces no output", () => {
    renderEvent({ type: "agent_start" } as AgentEvent);
    expect(getOutput()).toBe("");
  });

  test("agent_end outputs newline via stdout.write", () => {
    renderEvent({ type: "agent_end" } as AgentEvent);
    expect(getOutput()).toBe("\n");
  });

  test("message_update with text_delta writes delta text", () => {
    renderEvent({
      type: "message_update",
      assistantMessageEvent: { type: "text_delta", delta: "Hello world" },
    } as AgentEvent);
    expect(getOutput()).toBe("Hello world");
  });

  test("message_update with thinking_delta writes dimmed text", () => {
    renderEvent({
      type: "message_update",
      assistantMessageEvent: { type: "thinking_delta", delta: "hmm" },
    } as AgentEvent);
    const out = getOutput();
    expect(out).toContain("hmm");
    expect(out).toContain("\x1b[2m");  // DIM
    expect(out).toContain("\x1b[0m");  // RESET
  });

  test("message_update with toolcall_delta produces no output", () => {
    renderEvent({
      type: "message_update",
      assistantMessageEvent: { type: "toolcall_delta", delta: "arg" },
    } as AgentEvent);
    expect(getOutput()).toBe("");
  });

  test("tool_execution_start with path shows tool and path", () => {
    renderEvent({
      type: "tool_execution_start",
      toolName: "read",
      args: { path: "/src/index.ts" },
    } as AgentEvent);
    const out = getOutput();
    expect(out).toContain("read");
    expect(out).toContain("/src/index.ts");
  });

  test("tool_execution_start with command shows truncated if >60 chars", () => {
    const longCmd = "a".repeat(80);
    renderEvent({
      type: "tool_execution_start",
      toolName: "bash",
      args: { command: longCmd },
    } as AgentEvent);
    const out = getOutput();
    expect(out).toContain("bash");
    expect(out).toContain("...");
    expect(out).toContain("a".repeat(60));
  });

  test("tool_execution_start with short command shows full command", () => {
    renderEvent({
      type: "tool_execution_start",
      toolName: "bash",
      args: { command: "ls -la" },
    } as AgentEvent);
    const out = getOutput();
    expect(out).toContain("bash");
    expect(out).toContain("ls -la");
  });

  test("tool_execution_start with pattern shows pattern", () => {
    renderEvent({
      type: "tool_execution_start",
      toolName: "grep",
      args: { pattern: "TODO" },
    } as AgentEvent);
    const out = getOutput();
    expect(out).toContain("grep");
    expect(out).toContain("TODO");
  });

  test("tool_execution_start with directory shows directory", () => {
    renderEvent({
      type: "tool_execution_start",
      toolName: "ls",
      args: { directory: "/src" },
    } as AgentEvent);
    const out = getOutput();
    expect(out).toContain("ls");
    expect(out).toContain("/src");
  });

  test("tool_execution_start with no relevant args shows just tool name", () => {
    renderEvent({
      type: "tool_execution_start",
      toolName: "edit",
      args: {},
    } as AgentEvent);
    const out = getOutput();
    expect(out).toContain("edit");
    expect(out).toContain("[");
  });

  test("tool_execution_update produces no output", () => {
    renderEvent({ type: "tool_execution_update" } as AgentEvent);
    expect(getOutput()).toBe("");
  });

  test("tool_execution_end with error shows red error text", () => {
    renderEvent({
      type: "tool_execution_end",
      isError: true,
      result: { content: [{ text: "file not found" }] },
    } as AgentEvent);
    const out = getOutput();
    expect(out).toContain("Error:");
    expect(out).toContain("file not found");
    expect(out).toContain("\x1b[31m"); // RED
  });

  test("tool_execution_end with success produces no output", () => {
    renderEvent({
      type: "tool_execution_end",
      isError: false,
      result: { content: [{ text: "ok" }] },
    } as AgentEvent);
    expect(getOutput()).toBe("");
  });

  test("tool_execution_end truncates long error to 200 chars", () => {
    const longError = "x".repeat(300);
    renderEvent({
      type: "tool_execution_end",
      isError: true,
      result: { content: [{ text: longError }] },
    } as AgentEvent);
    const out = getOutput();
    // The error text in output should be at most 200 chars
    expect(out).toContain("Error:");
    // Verify "xxx..." part is <= 200 chars
    const errorMatch = out.match(/Error: (.+?)\x1b/);
    if (errorMatch) {
      expect(errorMatch[1].length).toBeLessThanOrEqual(200);
    }
  });

  test("turn_end with error message shows bold red error", () => {
    renderEvent({
      type: "turn_end",
      message: { role: "assistant", errorMessage: "Rate limit exceeded" },
    } as any);
    const out = getOutput();
    expect(out).toContain("Error:");
    expect(out).toContain("Rate limit exceeded");
    expect(out).toContain("\x1b[31m"); // RED
    expect(out).toContain("\x1b[1m");  // BOLD
  });

  test("turn_end without error produces no output", () => {
    renderEvent({
      type: "turn_end",
      message: { role: "assistant" },
    } as any);
    expect(getOutput()).toBe("");
  });
});
