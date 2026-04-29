import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api";
import { type ChatMessage, type ToolCallDisplay, loadHistory, saveHistory, clearHistory, ToolCallCard, UserBubble, AssistantBubble, ThinkingIndicator, TurnSeparator, MarkdownText, PageHeader, LoadingSpinner } from "../components";
import { useTheme, type Theme } from "../theme";
import { useI18n } from "../i18n";
import type { AgentInfo, AgentTaskResult, AgentStreamEvent } from "../../shared/types";

const CONVERSATION_STARTERS: Record<string, string[]> = {
  "studio-tts": [
    "What voices are available for my characters?",
    "How do I fix audio timing issues?",
    "Compare MLX vs Gemini TTS quality",
  ],
  "studio-advisor": [
    "What should I work on next?",
    "Analyze my pipeline quality",
    "Suggest improvements for my latest episode",
  ],
  "sg-story-advisor": [
    "How can I improve character consistency?",
    "Review my story arc structure",
    "Suggest plot developments for my series",
  ],
  "studio-coordinator": [
    "What's blocking my production pipeline?",
    "Show me the status of all episodes",
    "Prioritize my next workflow steps",
  ],
  "studio-image": [
    "Help me write a better character prompt",
    "What art style works for anime characters?",
    "How do I ensure consistent character design?",
  ],
  _default: [
    "What can you help me with?",
    "Explain your available tools",
    "What's your area of expertise?",
    "Help me get started",
  ],
};

const MODEL_OPTIONS = [
  { value: "", label: "Default (agent)" },
  { value: "zai/glm-5-turbo", label: "GLM 5 Turbo" },
  { value: "zai/glm-4.7", label: "GLM 4.7" },
  { value: "zai/glm-4.5-air", label: "GLM 4.5 Air" },
  { value: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro" },
  { value: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash" },
];

function loadModelPref(): string {
  try { return localStorage.getItem("remotion_studio_model") || ""; } catch { return ""; }
}
function saveModelPref(model: string) {
  try { localStorage.setItem("remotion_studio_model", model); } catch { /* noop */ }
}

export function AgentChat() {
  const theme = useTheme();
  const { t } = useI18n();
  const [bridgeOk, setBridgeOk] = useState<boolean | null>(null);
  const [bridgeError, setBridgeError] = useState<string>("");
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [model, setModel] = useState<string>(loadModelPref);
  const [activeTools, setActiveTools] = useState<ToolCallDisplay[]>([]);
  const [thinking, setThinking] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const _modelRef = useRef<string>("");
  _modelRef.current = model;

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

  // Sync ref so runStream callback always reads latest messages (avoids stale closure)
  messagesRef.current = messages;
  // Persist messages whenever they change (not during streaming)
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
    // Build conversation history from all prior non-error messages (read via ref to avoid stale closure)
    const priorMsgs = messagesRef.current.filter((m) => !m.isError);
    const history = [...priorMsgs, { role: "user" as const, content: prompt }]
      .map((m) => ({ role: m.role, content: m.content }));

    // Read model from ref to avoid stale closure in the callback
    const currentModel = _modelRef.current;
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
      history,
      currentModel || undefined,
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

  function AgentCapabilityCard({ agent }: { agent: AgentInfo }) {
    return (
      <div data-testid="agent-capability-card" style={{
        padding: theme.spacing.md,
        border: `1px solid ${theme.colors.border.default}`,
        borderRadius: theme.radii.lg,
        background: theme.colors.bg.surface,
        marginBottom: theme.spacing.lg,
        maxWidth: 500,
      }}>
        <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary, marginBottom: theme.spacing.sm }}>
          {agent.description}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", marginBottom: theme.spacing.xs }}>
          <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted, marginRight: 4 }}>{t.agentChat.tools}:</span>
          {(agent.tools ?? []).length > 0
            ? agent.tools!.map((tool) => (
              <span key={tool} style={{ padding: "2px 8px", borderRadius: theme.radii.sm, background: theme.colors.primaryLight, fontSize: theme.font.sizes.xs, color: theme.colors.primaryDark }}>{tool}</span>
            ))
            : <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted }}>{t.agentChat.noTools}</span>
          }
        </div>
        {agent.skills && agent.skills.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", marginBottom: theme.spacing.xs }}>
            <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted, marginRight: 4 }}>{t.agentChat.skills}:</span>
            {agent.skills.map((skill) => (
              <span key={skill} style={{ padding: "2px 8px", borderRadius: theme.radii.sm, background: theme.colors.warningLight, fontSize: theme.font.sizes.xs, color: "#92400e" }}>{skill}</span>
            ))}
          </div>
        )}
        {agent.model && (
          <div style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted }}>
            {t.agentChat.model}: {agent.model}
          </div>
        )}
      </div>
    );
  }

  // Bridge unavailable
  if (bridgeOk === false) {
    return (
      <div>
        <PageHeader title={t.agentChat.title} description={t.agentChat.description} />
        <div style={errorBoxStyle(theme)}>{t.agentChat.bridgeUnavailable(bridgeError)}</div>
        <div style={{ marginTop: theme.spacing.lg }}>
          <div style={{ fontWeight: theme.font.weights.semibold, marginBottom: theme.spacing.sm, fontSize: theme.font.sizes.base }}>
            {t.agentChat.recoveryTitle}
          </div>
          <ol style={{ margin: 0, paddingLeft: 20, color: theme.colors.text.secondary, fontSize: theme.font.sizes.base, lineHeight: 1.8 }}>
            {t.agentChat.recoverySteps.map((step: string, i: number) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
        <button
          onClick={() => {
            setBridgeOk(null);
            setBridgeError("");
            load();
          }}
          style={{
            marginTop: theme.spacing.xl,
            padding: `${theme.spacing.sm}px ${theme.spacing.xl}px`,
            background: theme.colors.primary, color: theme.colors.bg.page,
            border: "none", borderRadius: theme.radii.lg, cursor: "pointer",
            fontSize: theme.font.sizes.base, fontWeight: theme.font.weights.medium,
          }}
        >
          {t.agentChat.retry}
        </button>
      </div>
    );
  }

  if (bridgeOk === null) return <LoadingSpinner />;

  const selectedAgent = agents.find((a) => a.name === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.md, marginBottom: theme.spacing.xl }}>
        <PageHeader title={t.agentChat.title} description={t.agentChat.description} />
        <select value={selected} onChange={(e) => handleSelectAgent(e.target.value)} style={selectStyle(theme)}>
          <option value="">{t.agentChat.selectAgent}</option>
          {agents.map((a) => (
            <option key={a.name} value={a.name}>{a.name}</option>
          ))}
        </select>
        <select
          value={model}
          onChange={(e) => { setModel(e.target.value); saveModelPref(e.target.value); }}
          style={{ ...selectStyle(theme), minWidth: 150 }}
          title="Model override"
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        {selectedAgent && (
          <span style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.tertiary }}>{t.agentChat.chatWith(selectedAgent.name)}</span>
        )}
        {messages.length > 0 && !streaming && (
          <div style={{ marginLeft: "auto", display: "flex", gap: theme.spacing.xs }}>
            {lastMsgIsError && (
              <button onClick={handleRetry} style={smallBtn(theme.colors.warning, theme)}>{t.agentChat.retry}</button>
            )}
            <button onClick={handleExport} style={smallBtn(theme.colors.primary, theme)}>{t.agentChat.export}</button>
            <button onClick={handleClear} style={smallBtn(theme.colors.text.muted, theme)}>{t.agentChat.clear}</button>
          </div>
        )}
      </div>

      {/* Agent capability card */}
      {selectedAgent && (
        <AgentCapabilityCard agent={selectedAgent} />
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: theme.spacing.sm }}>
        {messages.length === 0 && !streaming && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <div style={{ color: theme.colors.text.muted, fontSize: theme.font.sizes.md, marginBottom: theme.spacing.lg }}>
              {selected
                ? t.agentChat.sendMessage(selected)
                : t.agentChat.selectAgentPrompt}
            </div>
            {selected && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 480, margin: "0 auto" }}>
                <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary, marginBottom: 4 }}>
                  {t.agentChat.startersHeading}
                </div>
                {(CONVERSATION_STARTERS[selected] || CONVERSATION_STARTERS._default).map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput("");
                      runStream(selected, starter);
                    }}
                    style={{
                      padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: theme.radii.lg,
                      background: theme.colors.bg.surface,
                      cursor: "pointer",
                      textAlign: "left" as const,
                      fontSize: theme.font.sizes.base,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}
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
          <div style={{ marginBottom: theme.spacing.sm }}>
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
      <div style={{ display: "flex", gap: theme.spacing.sm, paddingTop: theme.spacing.md, borderTop: `1px solid ${theme.colors.border.default}` }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selected ? t.agentChat.placeholder(selected) : t.agentChat.noAgentPlaceholder}
          disabled={!selected || streaming}
          rows={2}
          style={{
            flex: 1,
            padding: `10px ${theme.spacing.md}px`,
            fontSize: theme.font.sizes.md,
            borderRadius: theme.radii.xl,
            border: `1px solid ${theme.colors.border.medium}`,
            resize: "none",
            fontFamily: "inherit",
          }}
        />
        {streaming ? (
          <button onClick={handleAbort} style={abortBtnStyle(theme)}>{t.agentChat.stop}</button>
        ) : (
          <button onClick={handleSend} disabled={!selected || !input.trim()} style={sendBtnStyle(selected && !!input.trim(), theme)}>
            {t.agentChat.send}
          </button>
        )}
      </div>
    </div>
  );
}

// --- Styles ---

function selectStyle(t: Theme): React.CSSProperties {
  return { padding: `${t.spacing.sm}px ${t.spacing.md}px`, fontSize: t.font.sizes.md, borderRadius: t.radii.lg, border: `1px solid ${t.colors.border.medium}`, minWidth: 180 };
}

function errorBoxStyle(t: Theme): React.CSSProperties {
  return { padding: t.spacing.xl, background: t.colors.warningLight, border: `1px solid ${t.colors.border.default}`, borderRadius: t.radii.xl, color: t.colors.error };
}

function smallBtn(bg: string, t: Theme): React.CSSProperties {
  return { padding: `${t.spacing.xs}px 10px`, background: bg, color: t.colors.bg.page, border: "none", borderRadius: t.radii.md, cursor: "pointer", fontSize: t.font.sizes.sm };
}

function sendBtnStyle(enabled: boolean, t: Theme): React.CSSProperties {
  return { padding: `10px ${t.spacing.xl}px`, background: enabled ? t.colors.primary : t.colors.border.medium, color: t.colors.bg.page, border: "none", borderRadius: t.radii.xl, cursor: enabled ? "pointer" : "default", fontWeight: t.font.weights.semibold, fontSize: t.font.sizes.md, alignSelf: "flex-end" };
}

function abortBtnStyle(t: Theme): React.CSSProperties {
  return { padding: `10px ${t.spacing.xl}px`, background: t.colors.error, color: t.colors.bg.page, border: "none", borderRadius: t.radii.xl, cursor: "pointer", fontWeight: t.font.weights.semibold, fontSize: t.font.sizes.md, alignSelf: "flex-end" };
}
