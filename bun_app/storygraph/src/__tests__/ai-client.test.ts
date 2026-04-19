import { describe, test, expect } from "bun:test";
import { stripMarkdownFence, repairTruncatedJSON } from "../ai-client";

describe("stripMarkdownFence", () => {
  test("strips simple ```json fence", () => {
    const input = "```json\n{\"key\": \"value\"}\n```";
    expect(stripMarkdownFence(input)).toBe("{\"key\": \"value\"}");
  });

  test("strips bare ``` fence", () => {
    const input = "```\n{\"key\": \"value\"}\n```";
    expect(stripMarkdownFence(input)).toBe("{\"key\": \"value\"}");
  });

  test("handles nested backticks inside JSON string (GLM-5 bug)", () => {
    const input = "```json\n{\"code\": \"some ``` python code\"}\n```";
    expect(stripMarkdownFence(input)).toBe("{\"code\": \"some ``` python code\"}");
  });

  test("handles nested backticks on separate line inside JSON", () => {
    const input = "```json\n{\"code\": \"line1\\n```python\\nline3\"}\n```";
    expect(stripMarkdownFence(input)).toBe("{\"code\": \"line1\\n```python\\nline3\"}");
  });

  test("extracts raw JSON when no fence present", () => {
    const input = "Here is the result:\n{\"key\": \"value\"}\nDone.";
    expect(stripMarkdownFence(input)).toBe("{\"key\": \"value\"}");
  });

  test("extracts array JSON when no fence present", () => {
    const input = "Result:\n[{\"id\": 1}, {\"id\": 2}]";
    expect(stripMarkdownFence(input)).toBe("[{\"id\": 1}, {\"id\": 2}]");
  });

  test("returns trimmed text when no JSON found", () => {
    const input = "  plain text response  ";
    expect(stripMarkdownFence(input)).toBe("plain text response");
  });

  test("handles 4-backtick outer fence (GLM-5 alternative)", () => {
    const input = "````json\n{\"code\": \"```nested```\"}\n````";
    // Greedy match: finds last ``` → matches ``` at end of ``````
    // The regex requires \n```, and ```` has 4 backticks, so \n``` matches first 3
    // This actually captures content up to the last ```
    const result = stripMarkdownFence(input);
    expect(JSON.parse(result)).toEqual({ code: "```nested```" });
  });

  test("handles fence with text before and after", () => {
    const input = "Here's the JSON:\n```json\n{\"a\": 1}\n```\nHope that helps!";
    expect(stripMarkdownFence(input)).toBe("{\"a\": 1}");
  });

  test("handles escaped quotes inside JSON", () => {
    const input = "```json\n{\"msg\": \"He said \\\"hello\\\"\"}\n```";
    expect(stripMarkdownFence(input)).toBe("{\"msg\": \"He said \\\"hello\\\"\"}");
  });

  test("handles nested objects in JSON", () => {
    const input = "```json\n{\"outer\": {\"inner\": {\"deep\": true}}}\n```";
    const result = stripMarkdownFence(input);
    expect(JSON.parse(result)).toEqual({ outer: { inner: { deep: true } } });
  });
});

describe("repairTruncatedJSON", () => {
  test("returns valid JSON unchanged", () => {
    const input = "{\"nodes\": [], \"edges\": []}";
    expect(repairTruncatedJSON(input)).toBe(input);
  });

  test("closes missing braces", () => {
    const input = "{\"nodes\": [{\"id\": \"a\"}";
    const result = repairTruncatedJSON(input);
    expect(JSON.parse(result)).toEqual({ nodes: [{ id: "a" }] });
  });

  test("closes nested missing braces", () => {
    const input = "{\"nodes\": [{\"id\": \"a\", \"props\": {\"x\": 1";
    const result = repairTruncatedJSON(input);
    expect(JSON.parse(result)).toEqual({ nodes: [{ id: "a", props: { x: 1 } }] });
  });

  test("strips truncated string value", () => {
    const input = "{\"nodes\": [{\"id\": \"a\", \"label\": \"unterminated";
    const result = repairTruncatedJSON(input);
    const parsed = JSON.parse(result);
    expect(parsed.nodes[0].id).toBe("a");
    expect(parsed.nodes[0]).not.toHaveProperty("label");
  });

  test("handles truncated array item", () => {
    const input = "{\"nodes\": [1, 2,";
    const result = repairTruncatedJSON(input);
    expect(JSON.parse(result)).toEqual({ nodes: [1, 2] });
  });

  test("repairs real GLM-5 truncation pattern", () => {
    // Actual pattern from debug output — second node truncated mid-key
    const input = `{"nodes":[{"id":"ch1ep1_plot","label":"test","type":"episode_plot","properties":{}},{"id":"ch1ep1_theme_x","label":"`;
    const result = repairTruncatedJSON(input);
    const parsed = JSON.parse(result);
    // First node is complete, second node gets its id salvaged
    expect(parsed.nodes).toHaveLength(2);
    expect(parsed.nodes[0].id).toBe("ch1ep1_plot");
    expect(parsed.nodes[1].id).toBe("ch1ep1_theme_x");
  });
});
