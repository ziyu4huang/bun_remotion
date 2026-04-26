import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api";
import { type ChatMessage, type ToolCallDisplay, loadHistory, saveHistory, clearHistory, ToolCallCard, UserBubble, AssistantBubble, ThinkingIndicator, TurnSeparator, MarkdownText } from "../components";
import type { AgentInfo, AgentTaskResult, AgentStreamEvent } from "../../shared/types";

export function AgentChat() {
  const [bridgeOk, setBridgeOk] = useState<boolean | null>(null);
  const [bridgeError, setBridgeError] = useState<string>("");
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeTools, setActiveTools] = useState<ToolCallDisplay[]>([]);
  const [thinking, setThinking] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const statusRes = await api.agent.getStatus();
    if (!statusRes.ok || !statusRes.data?.available) {
      setBridgeOk(false);
      setBridgeError(statusRes.data?.error ?? statusRes.error ?? "Unknown error");
      return;
    }
    setBridgeOk(true);
    const agentsRes = await api.agent.listAgents();
    if (agentsRes.data) setAgents(agentsRes.data);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, activeTools, thinking]);

  // Persist messages whenever they change (not during streaming)
  const msgsRef = useRef(messages);
  msgsRef.current = messages;
  useEffect(() => {
    if (!streaming && selected && messages.length > 0) {
      saveHistory(selected, messages);
    }
  }, [messages, streaming, selected]);

  const handleSelectAgent = (name: string) => {
    setSelected(name);
    setMessages(name ? loadHistory(name) : []);
    setActiveTools([]);
  };

  const runStream = useCallback((agentName: string, prompt: string) => {
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setStreaming(true);
    setActiveTools([]);
    setThinking(true);

    let assistantText = "";
    const tools: Map<string, ToolCallDisplay> = new Map();

    const abort = api.agent.streamChat(
      agentName,
      prompt,
      (event: AgentStreamEvent | { type: "result"; result: AgentTaskResult }) => {
        switch (event.type) {
          case "text":
            assistantText += event.delta;
            setThinking(false);
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                next[next.length - 1] = { ...last, content: assistantText };
              } else {
                next.push({ role: "assistant", content: assistantText });
              }
              return next;
            });
            break;

          case "tool_start":
            tools.set(event.toolCallId, { name: event.toolName, status: "running" });
            setActiveTools([...tools.values()]);
            setThinking(false);
            break;

          case "tool_end": {
            const tc = tools.get(event.toolCallId);
            if (tc) {
              const resultStr = typeof event.result === "string"
                ? event.result.slice(0, 500)
                : JSON.stringify(event.result, null, 2)?.slice(0, 500) ?? "";
              tc.status = event.isError ? "error" : "done";
              tc.result = resultStr;
              tc.isError = event.isError;
              setActiveTools([...tools.values()]);
            }
            setThinking(true); // show thinking between tool calls
            break;
          }

          case "result": {
            const r = event.result as AgentTaskResult;
            setThinking(false);
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              const toolDisplays = [...tools.values()];
              if (last?.role === "assistant") {
                next[next.length - 1] = {
                  ...last,
                  content: assistantText || r.response,
                  toolCalls: toolDisplays,
                  meta: { turnCount: r.turnCount, toolCallCount: r.toolCallCount, durationMs: r.durationMs },
                };
              } else {
                next.push({
                  role: "assistant",
                  content: r.response,
                  toolCalls: toolDisplays,
                  meta: { turnCount: r.turnCount, toolCallCount: r.toolCallCount, durationMs: r.durationMs },
                });
              }
              return next;
            });
            setActiveTools([]);
            setStreaming(false);
            break;
          }

          case "error":
            setThinking(false);
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: `Error: ${event.message}`, isError: true },
            ]);
            setActiveTools([]);
            setStreaming(false);
            break;

          case "turn_end":
            break;
          case "done":
            break;
        }
      },
    );

    abortRef.current = abort;
  }, []);

  const handleSend = () => {
    if (!input.trim() || !selected || streaming) return;
    runStream(selected, input.trim());
    setInput("");
  };

  const handleRetry = () => {
    const lastUserIdx = messages.map((m, i) => m.role === "user" ? i : -1).filter(i => i >= 0).pop();
    if (lastUserIdx === undefined || !selected) return;
    const prompt = messages[lastUserIdx].content;
    const trimmed = messages.slice(0, lastUserIdx);
    setMessages(trimmed);
    setTimeout(() => runStream(selected, prompt), 0);
  };

  const handleClear = () => {
    setMessages([]);
    if (selected) clearHistory(selected);
  };

  const handleExport = () => {
    const lines = messages.map((m) => {
      if (m.role === "user") return `## You\n\n${m.content}`;
      let s = `## ${selected}\n\n${m.content}`;
      if (m.meta) s += `\n\n*${m.meta.turnCount} turns, ${m.meta.toolCallCount} tools, ${(m.meta.durationMs / 1000).toFixed(1)}s*`;
      return s;
    });
    const md = `# Chat with ${selected}\n\n${lines.join("\n\n---\n\n")}\n`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${selected}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAbort = () => {
    abortRef.current?.();
    abortRef.current = null;
    setStreaming(false);
    setActiveTools([]);
    setThinking(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const lastMsgIsError = messages.length > 0 && messages[messages.length - 1].isError;

  // Bridge unavailable
  if (bridgeOk === false) {
    return (
      <div>
        <h2 style={{ marginBottom: 20 }}>Agent Chat</h2>
        <div style={errorBox}>Agent bridge unavailable: {bridgeError}</div>
        <div style={{ color: "#666", fontSize: 13, marginTop: 12 }}>
          Check that <code>PI_API_KEY</code> is set and <code>bun_pi_agent</code> is importable.
        </div>
      </div>
    );
  }

  if (bridgeOk === null) return <div style={{ color: "#666" }}>Loading...</div>;

  const selectedAgent = agents.find((a) => a.name === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Agent Chat</h2>
        <select value={selected} onChange={(e) => handleSelectAgent(e.target.value)} style={selectStyle}>
          <option value="">Select agent...</option>
          {agents.map((a) => (
            <option key={a.name} value={a.name}>{a.name}</option>
          ))}
        </select>
        {selectedAgent && (
          <span style={{ fontSize: 13, color: "#666" }}>{selectedAgent.description}</span>
        )}
        {messages.length > 0 && !streaming && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {lastMsgIsError && (
              <button onClick={handleRetry} style={smallBtn("#ff9800")}>Retry</button>
            )}
            <button onClick={handleExport} style={smallBtn("#1976d2")}>Export</button>
            <button onClick={handleClear} style={smallBtn("#999")}>Clear</button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}>
        {messages.length === 0 && !streaming && (
          <div style={{ color: "#999", textAlign: "center", marginTop: 80 }}>
            {selected
              ? `Send a message to ${selected}`
              : "Select an agent above to start chatting"}
          </div>
        )}

        {messages.map((msg, i) => {
          const isTurnBoundary = i > 0 && (
            (msg.role === "user") ||
            (msg.role === "assistant" && messages[i - 1]?.role === "user")
          );

          return (
            <div key={i}>
              {isTurnBoundary && <TurnSeparator />}
              {msg.role === "user" ? (
                <UserBubble msg={msg} />
              ) : (
                <AssistantBubble msg={msg} agentName={selected}>
                  <MarkdownText content={msg.content} />
                </AssistantBubble>
              )}
            </div>
          );
        })}

        {/* Active tool calls during streaming */}
        {activeTools.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {activeTools.map((tc, i) => (
              <ToolCallCard key={`active-${i}`} tc={tc} />
            ))}
          </div>
        )}

        {/* Thinking indicator */}
        {thinking && streaming && activeTools.length === 0 && <ThinkingIndicator />}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #e0e0e0" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selected ? `Message ${selected}...` : "Select an agent first"}
          disabled={!selected || streaming}
          rows={2}
          style={{
            flex: 1,
            padding: "10px 12px",
            fontSize: 14,
            borderRadius: 8,
            border: "1px solid #ccc",
            resize: "none",
            fontFamily: "inherit",
          }}
        />
        {streaming ? (
          <button onClick={handleAbort} style={abortBtn}>Stop</button>
        ) : (
          <button onClick={handleSend} disabled={!selected || !input.trim()} style={sendBtn(selected && !!input.trim())}>
            Send
          </button>
        )}
      </div>
    </div>
  );
}

// --- Styles ---

const selectStyle: React.CSSProperties = { padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", minWidth: 180 };
const errorBox: React.CSSProperties = { padding: 16, background: "#fff3e0", border: "1px solid #ffe0b2", borderRadius: 8, color: "#d32f2f" };

function smallBtn(bg: string): React.CSSProperties {
  return { padding: "4px 10px", background: bg, color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 };
}

function sendBtn(enabled: boolean): React.CSSProperties {
  return { padding: "10px 20px", background: enabled ? "#1976d2" : "#ccc", color: "#fff", border: "none", borderRadius: 8, cursor: enabled ? "pointer" : "default", fontWeight: 600, fontSize: 14, alignSelf: "flex-end" };
}

const abortBtn: React.CSSProperties = { padding: "10px 20px", background: "#d32f2f", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14, alignSelf: "flex-end" };
