import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { type ChatMessage, type ToolCallDisplay, clearHistory, ToolCallCard, UserBubble, ThinkingIndicator, TurnSeparator, MarkdownText } from "./index";
import type { AgentInfo, AgentStreamEvent, AgentTaskResult } from "../../shared/types";

interface AdvisorPanelBaseProps {
  agentName: string;
  title: string;
  titleColor?: string;
  contextLabel: string;
  historyKey: string;
  systemPrefix: string;
  placeholder: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  preferredAgents?: string[];
}

export function AdvisorPanelBase({
  agentName,
  title,
  titleColor = "#7b1fa2",
  contextLabel,
  historyKey,
  systemPrefix,
  placeholder,
  messages,
  setMessages,
  preferredAgents,
}: AdvisorPanelBaseProps) {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeTools, setActiveTools] = useState<ToolCallDisplay[]>([]);
  const [thinking, setThinking] = useState(false);
  const [bridgeOk, setBridgeOk] = useState<boolean | null>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const s = await api.agent.getStatus();
      if (!s.ok || !s.data?.available) { setBridgeOk(false); return; }
      setBridgeOk(true);
      const a = await api.agent.listAgents();
      if (a.data) setAgents(a.data);
    })();
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, activeTools, thinking]);

  const agent = preferredAgents
    ? preferredAgents.map((n) => agents.find((a) => a.name === n)).find(Boolean) ?? agents.find((a) => a.name === agentName)
    : agents.find((a) => a.name === agentName);

  const handleSend = () => {
    if (!input.trim() || !agent || streaming) return;
    const prompt = `${systemPrefix}\n\n${input.trim()}`;
    setMessages((prev) => [...prev, { role: "user", content: input.trim() }]);
    setInput("");
    setStreaming(true);
    setActiveTools([]);
    setThinking(true);

    let text = "";
    const tools: Map<string, ToolCallDisplay> = new Map();

    const abort = api.agent.streamChat(
      agent.name,
      prompt,
      (event: AgentStreamEvent | { type: "result"; result: AgentTaskResult }) => {
        switch (event.type) {
          case "text":
            text += event.delta;
            setThinking(false);
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                next[next.length - 1] = { ...last, content: text };
              } else {
                next.push({ role: "assistant", content: text });
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
            setThinking(true);
            break;
          }

          case "result": {
            const r = event.result as AgentTaskResult;
            setThinking(false);
            const toolDisplays = [...tools.values()];
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                next[next.length - 1] = {
                  ...last,
                  content: text || r.response,
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
            setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${event.message}`, isError: true }]);
            setActiveTools([]);
            setStreaming(false);
            break;
        }
      },
    );
    abortRef.current = abort;
  };

  if (bridgeOk === false) {
    return (
      <div style={{ width: 320, borderLeft: "1px solid #e0e0e0", padding: 16, background: "#fafafa" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: titleColor }}>{title}</h3>
        <div style={{ color: "#999", fontSize: 13 }}>Agent bridge unavailable</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div style={{ width: 320, borderLeft: "1px solid #e0e0e0", padding: 16, background: "#fafafa" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: titleColor }}>{title}</h3>
        <div style={{ color: "#999", fontSize: 13 }}>No advisor agent found</div>
      </div>
    );
  }

  return (
    <div style={{ width: 320, borderLeft: "1px solid #e0e0e0", display: "flex", flexDirection: "column", background: "#fafafa" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, color: titleColor }}>{title}</h3>
          <div style={{ fontSize: 12, color: "#999" }}>{agent.name} · {contextLabel}</div>
        </div>
        {messages.length > 0 && !streaming && (
          <button
            onClick={() => { setMessages([]); clearHistory(historyKey); }}
            style={{ padding: "2px 8px", background: "none", border: "1px solid #ccc", borderRadius: 3, cursor: "pointer", fontSize: 11, color: "#999" }}
          >
            Clear
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {messages.length === 0 && !streaming && (
          <div style={{ color: "#999", fontSize: 13, textAlign: "center", marginTop: 40 }}>
            {placeholder}
          </div>
        )}
        {messages.map((msg, i) => {
          const isTurnBoundary = i > 0 && (
            msg.role === "user" || (msg.role === "assistant" && messages[i - 1]?.role === "user")
          );
          return (
            <div key={i}>
              {isTurnBoundary && <TurnSeparator />}
              {msg.role === "user" ? (
                <UserBubble msg={msg} />
              ) : (
                <div style={{ marginBottom: 12 }}>
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      {msg.toolCalls.map((tc, j) => (
                        <ToolCallCard key={j} tc={tc} />
                      ))}
                    </div>
                  )}
                  <div style={{
                    padding: "8px 10px",
                    borderRadius: "8px 8px 8px 2px",
                    background: msg.isError ? "#ffebee" : "#fff",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                    whiteSpace: "pre-wrap",
                    fontSize: 13,
                    lineHeight: 1.4,
                  }}>
                    <MarkdownText content={msg.content} />
                  </div>
                  {msg.meta && (
                    <div style={{ fontSize: 10, color: "#aaa", marginTop: 2, marginLeft: 4 }}>
                      {msg.meta.turnCount} turns · {msg.meta.toolCallCount} tools · {(msg.meta.durationMs / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {activeTools.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {activeTools.map((tc, i) => (
              <ToolCallCard key={`active-${i}`} tc={tc} />
            ))}
          </div>
        )}
        {thinking && streaming && activeTools.length === 0 && <ThinkingIndicator />}
        <div ref={endRef} />
      </div>

      <div style={{ padding: 12, borderTop: "1px solid #e0e0e0" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={placeholder}
            disabled={streaming}
            style={{ flex: 1, padding: "8px 10px", fontSize: 13, borderRadius: 4, border: "1px solid #ccc" }}
          />
          <button
            onClick={handleSend}
            disabled={streaming || !input.trim()}
            style={{
              padding: "8px 12px",
              background: streaming || !input.trim() ? "#ccc" : titleColor,
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: streaming ? "default" : "pointer",
              fontSize: 13,
            }}
          >
            {streaming ? "..." : "Ask"}
          </button>
        </div>
      </div>
    </div>
  );
}
