import { describe, test, expect } from "bun:test";

/**
 * SSE parse logic extracted from client/api.ts streamChat() for testability.
 * This mirrors the exact parsing loop used in the browser SSE client.
 */
function parseSSEEvents(chunks: string[]): any[] {
  const events: any[] = [];
  let buf = "";
  const decoder = new TextDecoder();

  for (const chunk of chunks) {
    buf += chunk;
    const lines = buf.split("\n");
    buf = lines.pop()!;
    for (const line of lines) {
      if (line.startsWith("data:")) {
        events.push(JSON.parse(line.slice(5).trim()));
      }
    }
  }

  // Flush remaining buffer
  if (buf.startsWith("data:")) {
    events.push(JSON.parse(buf.slice(5).trim()));
  }

  return events;
}

describe("SSE parse logic", () => {
  test("parses single complete data line", () => {
    const events = parseSSEEvents(["data: {\"type\":\"text\",\"delta\":\"hello\"}\n\n"]);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ type: "text", delta: "hello" });
  });

  test("parses multiple data lines in one chunk", () => {
    const chunk = [
      "data: {\"type\":\"text\",\"delta\":\"hello\"}\n",
      "data: {\"type\":\"text\",\"delta\":\" world\"}\n",
      "\n",
    ].join("");
    const events = parseSSEEvents([chunk]);
    expect(events).toHaveLength(2);
    expect(events[0].delta).toBe("hello");
    expect(events[1].delta).toBe(" world");
  });

  test("buffers partial line across chunks", () => {
    const events = parseSSEEvents([
      "data: {\"type\":\"tex",
      "t\",\"delta\":\"hello\"}\n\n",
    ]);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ type: "text", delta: "hello" });
  });

  test("skips empty lines between data lines", () => {
    const chunk = [
      "data: {\"type\":\"text\",\"delta\":\"a\"}\n",
      "\n",
      "data: {\"type\":\"text\",\"delta\":\"b\"}\n",
      "\n",
    ].join("");
    const events = parseSSEEvents([chunk]);
    expect(events).toHaveLength(2);
  });

  test("flushes final partial data line without trailing newline", () => {
    const events = parseSSEEvents([
      "data: {\"type\":\"done\",\"turnCount\":3}\n\n",
      "data: {\"type\":\"result\",\"id\":\"x\"}", // no trailing \n
    ]);
    expect(events).toHaveLength(2);
    expect(events[1]).toEqual({ type: "result", id: "x" });
  });

  test("handles tool_start and tool_end events", () => {
    const chunk = [
      "data: {\"type\":\"tool_start\",\"toolName\":\"Read\",\"toolCallId\":\"tc1\"}\n",
      "data: {\"type\":\"tool_end\",\"toolCallId\":\"tc1\",\"isError\":false}\n",
      "\n",
    ].join("");
    const events = parseSSEEvents([chunk]);
    expect(events).toHaveLength(2);
    expect(events[0].toolName).toBe("Read");
    expect(events[1].isError).toBe(false);
  });

  test("handles empty chunks gracefully", () => {
    const events = parseSSEEvents(["", "", ""]);
    expect(events).toHaveLength(0);
  });
});
