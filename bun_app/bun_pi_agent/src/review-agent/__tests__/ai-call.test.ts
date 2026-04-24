import { describe, test, expect } from "bun:test";
import { stripMarkdownFence, repairTruncatedJSON } from "../ai-call";

describe("stripMarkdownFence", () => {
  test("strips ```json fence", () => {
    const input = '```json\n{"decision": "APPROVE"}\n```';
    expect(stripMarkdownFence(input)).toBe('{"decision": "APPROVE"}');
  });

  test("strips ``` fence without language tag", () => {
    const input = '```\n{"decision": "APPROVE"}\n```';
    expect(stripMarkdownFence(input)).toBe('{"decision": "APPROVE"}');
  });

  test("handles nested backticks in values", () => {
    const input = '```json\n{"code": "use `foo` here"}\n```';
    expect(stripMarkdownFence(input)).toBe('{"code": "use `foo` here"}');
  });

  test("extracts balanced braces when no fence", () => {
    const input = 'Here is the result: {"decision": "APPROVE"} and some text after';
    expect(stripMarkdownFence(input)).toBe('{"decision": "APPROVE"}');
  });

  test("extracts balanced brackets when no fence", () => {
    const input = 'Result: [1, 2, 3] done';
    expect(stripMarkdownFence(input)).toBe("[1, 2, 3]");
  });

  test("returns raw text if no JSON structure found", () => {
    expect(stripMarkdownFence("plain text")).toBe("plain text");
  });
});

describe("repairTruncatedJSON", () => {
  test("closes unclosed braces", () => {
    expect(repairTruncatedJSON('{"a": 1')).toBe('{"a": 1}');
  });

  test("closes nested structures", () => {
    expect(repairTruncatedJSON('{"a": {"b": 1')).toBe('{"a": {"b": 1}}');
  });

  test("handles truncated string with trailing comma", () => {
    // Realistic: GLM cut off mid-object with an open string
    const input = '{"a": "truncated", "b": "still going';
    const result = repairTruncatedJSON(input);
    // Cuts at last comma (after "truncated"), closes remaining brace
    expect(result).toBe('{"a": "truncated"}');
    expect(JSON.parse(result)).toBeDefined();
  });

  test("best-effort on unterminated string with no comma", () => {
    const input = '{"a": "incomplete';
    const result = repairTruncatedJSON(input);
    // No comma to cut to — just closes braces, may not parse
    expect(result).toBe('{"a": "incomplete}');
  });

  test("no-op on valid JSON", () => {
    const valid = '{"a": 1, "b": [2, 3]}';
    expect(repairTruncatedJSON(valid)).toBe(valid);
  });
});
