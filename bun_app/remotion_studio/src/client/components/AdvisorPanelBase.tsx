import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { useTheme } from "../theme";
import { useFilePicker } from "../hooks/useFilePicker";
import { type ChatMessage, type ToolCallDisplay, clearHistory, saveHistoryToServer, loadHistoryFromServer, loadHistory, loadSessionId, saveSessionId, ToolCallCard, UserBubble, ThinkingIndicator, TurnSeparator, MarkdownText } from "./index";
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
  titleColor,
  contextLabel,
  historyKey,
  systemPrefix,
  placeholder,
  messages,
  setMessages,
  preferredAgents,
}: AdvisorPanelBaseProps) {
  const theme = useTheme();
  const accent = titleColor ?? theme.colors.aiAccent;
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeTools, setActiveTools] = useState<ToolCallDisplay[]>([]);
  const [thinking, setThinking] = useState(false);
  const [bridgeOk, setBridgeOk] = useState<boolean | null>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const {
    attachedFiles, showFilePicker, fileSeriesId, fileList,
    fileSeriesList, filePickerLoading,
    openFilePicker, selectFileSeries, attachFile,
    removeAttachment, clearAttachments, closeFilePicker,
  } = useFilePicker();

  useEffect(() => {
    (async () => {
      const s = await api.agent.getStatus();
      if (!s.ok || !s.data?.available) { setBridgeOk(false); return; }
      setBridgeOk(true);
      const a = await api.agent.listAgents();
      if (a.data) setAgents(a.data);
    })();
  }, []);

  // Load session from server on mount (fallback to localStorage)
  useEffect(() => {
    if (!historyKey) return;
    let cancelled = false;
    (async () => {
      const serverMsgs = await loadHistoryFromServer(historyKey);
      if (cancelled) return;
      if (serverMsgs.length > 0) {
        setMessages(serverMsgs);
      } else {
        const localMsgs = loadHistory(historyKey);
        if (localMsgs.length > 0) setMessages(localMsgs);
      }
    })();
    return () => { cancelled = true; };
  }, [historyKey]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, activeTools, thinking]);

  // Persist to server when messages change (not during streaming)
  useEffect(() => {
    if (!streaming && historyKey && messages.length > 0) {
      saveHistoryToServer(historyKey, messages);
    }
  }, [messages, streaming, historyKey]);

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
    const files = attachedFiles.length > 0 ? [...attachedFiles] : undefined;
    clearAttachments();

    // Build conversation history from prior messages (exclude current user message just added)
    const history = messages
      .filter(m => !m.isError)
      .map(m => ({ role: m.role, content: m.content }));

    // Read model preference: per-agent key first, then global fallback
    const globalModel = (() => {
      try {
        return localStorage.getItem(`remotion_studio_model_${agent.name}`)
          || localStorage.getItem("remotion_studio_global_model")
          || undefined;
      } catch { return undefined; }
    })();

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
      history.length > 0 ? history : undefined,
      globalModel,
      files,
    );
    abortRef.current = abort;
  };

  const panelBase = { width: 320, borderLeft: `1px solid ${theme.colors.border.default}`, padding: theme.spacing.lg, background: theme.colors.bg.surface };

  if (bridgeOk === false) {
    return (
      <div style={panelBase}>
        <h3 style={{ margin: `0 0 ${theme.spacing.md}px`, fontSize: theme.font.sizes.md, color: accent }}>{title}</h3>
        <div style={{ color: theme.colors.text.muted, fontSize: theme.font.sizes.base }}>Agent bridge unavailable</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div style={panelBase}>
        <h3 style={{ margin: `0 0 ${theme.spacing.md}px`, fontSize: theme.font.sizes.md, color: accent }}>{title}</h3>
        <div style={{ color: theme.colors.text.muted, fontSize: theme.font.sizes.base }}>No advisor agent found</div>
      </div>
    );
  }

  return (
    <div style={{ width: 320, borderLeft: `1px solid ${theme.colors.border.default}`, display: "flex", flexDirection: "column", background: theme.colors.bg.surface }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.colors.border.default}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: theme.font.sizes.md, color: accent }}>{title}</h3>
          <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted }}>{agent.name} · {contextLabel}</div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {messages.length > 0 && !streaming && (
            <>
              <button
                onClick={() => setMessages([])}
                style={{ padding: "2px 8px", background: "none", border: `1px solid ${theme.colors.border.medium}`, borderRadius: theme.radii.sm, cursor: "pointer", fontSize: theme.font.sizes.sm, color: theme.colors.text.muted }}
                title="Start a new conversation (keeps session)"
              >
                New
              </button>
              <button
                onClick={async () => {
                  setMessages([]);
                  clearHistory(historyKey);
                  const sid = loadSessionId(historyKey);
                  if (sid) {
                    try { await api.agent.deleteSession(historyKey, sid); } catch { /* ignore */ }
                    saveSessionId(historyKey, "");
                  }
                }}
                style={{ padding: "2px 8px", background: "none", border: `1px solid ${theme.colors.border.medium}`, borderRadius: theme.radii.sm, cursor: "pointer", fontSize: theme.font.sizes.sm, color: theme.colors.text.muted }}
                title="Clear all history and delete session"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: theme.spacing.md }}>
        {messages.length === 0 && !streaming && (
          <div style={{ color: theme.colors.text.muted, fontSize: theme.font.sizes.base, textAlign: "center", marginTop: 40 }}>
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
                <div style={{ marginBottom: theme.spacing.md }}>
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
                    background: msg.isError ? theme.colors.errorLight : theme.colors.bg.page,
                    boxShadow: theme.shadows.sm,
                    whiteSpace: "pre-wrap",
                    fontSize: theme.font.sizes.base,
                    lineHeight: 1.4,
                  }}>
                    <MarkdownText content={msg.content} />
                  </div>
                  {msg.meta && (
                    <div style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.faint, marginTop: 2, marginLeft: 4 }}>
                      {msg.meta.turnCount} turns · {msg.meta.toolCallCount} tools · {(msg.meta.durationMs / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {activeTools.length > 0 && (
          <div style={{ marginBottom: theme.spacing.sm }}>
            {activeTools.map((tc, i) => (
              <ToolCallCard key={`active-${i}`} tc={tc} />
            ))}
          </div>
        )}
        {thinking && streaming && activeTools.length === 0 && <ThinkingIndicator />}
        <div ref={endRef} />
      </div>

      <div style={{ padding: theme.spacing.md, borderTop: `1px solid ${theme.colors.border.default}` }}>
        {/* Attachment chips */}
        {attachedFiles.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
            {attachedFiles.map((f) => (
              <span key={f.path} style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                padding: "1px 6px", borderRadius: theme.radii.md,
                background: theme.colors.primaryLight, fontSize: 11, color: theme.colors.primaryDark,
              }}>
                <span style={{ fontSize: 10 }}>📎</span>
                {f.name.length > 20 ? f.name.slice(0, 20) + "..." : f.name}
                <button onClick={() => removeAttachment(f.path)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: "0 1px", color: theme.colors.text.muted, lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          {/* Attach button */}
          {!streaming && (
            <button
              onClick={openFilePicker}
              style={{
                padding: "4px 8px", background: theme.colors.bg.surface,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: theme.radii.md, cursor: "pointer", fontSize: 16, lineHeight: 1,
              }}
              title="Attach file"
            >
              📎
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={placeholder}
            disabled={streaming}
            style={{ flex: 1, padding: "8px 10px", fontSize: theme.font.sizes.base, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border.medium}` }}
          />
          <button
            onClick={handleSend}
            disabled={streaming || !input.trim()}
            style={{
              padding: "8px 12px",
              background: streaming || !input.trim() ? theme.colors.border.medium : accent,
              color: theme.colors.bg.page,
              border: "none",
              borderRadius: theme.radii.md,
              cursor: streaming ? "default" : "pointer",
              fontSize: theme.font.sizes.base,
            }}
          >
            {streaming ? "..." : "Ask"}
          </button>
        </div>
      </div>

      {/* File Picker Modal */}
      {showFilePicker && (
        <div
          onClick={closeFilePicker}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: theme.colors.bg.page, borderRadius: theme.radii.xl, padding: theme.spacing.xl, width: "min(480px, 90vw)", maxHeight: "70vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: theme.shadows.lg }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md }}>
              <h3 style={{ margin: 0, fontSize: theme.font.sizes.md, fontWeight: theme.font.weights.semibold }}>Attach Files</h3>
              <button onClick={closeFilePicker} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: theme.colors.text.muted }}>×</button>
            </div>
            <div style={{ marginBottom: theme.spacing.sm }}>
              <select value={fileSeriesId} onChange={(e) => selectFileSeries(e.target.value)} style={{ width: "100%", padding: "6px 10px", fontSize: theme.font.sizes.sm, borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border.medium}` }}>
                <option value="">-- Select a series --</option>
                {fileSeriesList.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}
              </select>
            </div>
            <div style={{ overflowY: "auto", flex: 1, minHeight: 160 }}>
              {filePickerLoading ? (
                <div style={{ textAlign: "center", padding: 30, color: theme.colors.text.muted }}>Loading...</div>
              ) : !fileSeriesId ? (
                <div style={{ textAlign: "center", padding: 30, color: theme.colors.text.muted }}>Select a series above to browse files</div>
              ) : fileList.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: theme.colors.text.muted }}>No files found</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <tbody>
                    {fileList.map((f) => {
                      const isAttached = attachedFiles.some((a) => a.path === f.path);
                      return (
                        <tr key={f.path} style={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
                          <td style={{ padding: "3px 0" }}>
                            <span style={{ fontSize: 10, color: theme.colors.text.muted }}>{f.episode ? `${f.episode}/` : ""}</span>
                            <span style={{ color: theme.colors.text.primary }}>{f.name.replace(f.episode ? `${f.episode}/` : "", "")}</span>
                          </td>
                          <td style={{ padding: "3px 0", textAlign: "right", fontSize: 10, color: theme.colors.text.muted, whiteSpace: "nowrap" }}>{(f.size / 1024).toFixed(1)}KB</td>
                          <td style={{ padding: "3px 0", textAlign: "right", width: 70 }}>
                            <button onClick={() => attachFile(f.path, f.name)} disabled={isAttached} style={{ padding: "1px 8px", fontSize: 11, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.primary}`, background: isAttached ? theme.colors.successLight : theme.colors.bg.page, color: isAttached ? theme.colors.success : theme.colors.primary, cursor: isAttached ? "default" : "pointer" }}>
                              {isAttached ? "Added" : "Attach"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
