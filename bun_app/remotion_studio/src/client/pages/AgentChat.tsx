import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api";
import { type ChatMessage, type ToolCallDisplay, loadHistory, saveHistory, clearHistory, loadSessionId, saveSessionId, loadHistoryFromServer, saveHistoryToServer, migrateHistoryIfNeeded, ToolCallCard, UserBubble, AssistantBubble, ThinkingIndicator, TurnSeparator, MarkdownText, PageHeader, LoadingSpinner, PipelineToolCard, getPipelineOp, JobStatusCard, Button, Card } from "../components";
import { useFilePicker } from "../hooks/useFilePicker";
import { useTheme, type Theme } from "../theme";
import { useI18n } from "../i18n";
import type { AgentInfo, AgentTaskResult, AgentStreamEvent, JobStatus } from "../../shared/types";

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
  "test-reviewer": [
    "Run the full test suite and summarize results",
    "Analyze recent test failures and suggest fixes",
    "Check for flaky tests across all apps",
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

function loadModelPref(agentName?: string): string {
  try {
    if (agentName) {
      const perAgent = localStorage.getItem(`remotion_studio_model_${agentName}`);
      if (perAgent !== null) return perAgent;
    }
    return localStorage.getItem("remotion_studio_global_model") || "";
  } catch { return ""; }
}
function saveModelPref(model: string, agentName?: string) {
  try {
    if (agentName) {
      localStorage.setItem(`remotion_studio_model_${agentName}`, model);
    }
    // Always keep global in sync as fallback for unselected state
    localStorage.setItem("remotion_studio_global_model", model);
  } catch { /* noop */ }
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
  const [model, setModel] = useState<string>("");
  const [activeTools, setActiveTools] = useState<ToolCallDisplay[]>([]);
  const [thinking, setThinking] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobStatus, setJobStatus] = useState<JobStatus>("pending");
  const abortRef = useRef<(() => void) | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const _modelRef = useRef<string>("");
  _modelRef.current = model;

  // File attachment via shared hook
  const {
    attachedFiles, showFilePicker, fileSeriesId, fileList,
    fileSeriesList, filePickerLoading,
    openFilePicker, selectFileSeries, attachFile,
    removeAttachment, clearAttachments, closeFilePicker,
  } = useFilePicker();

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
      saveHistoryToServer(selected, messages);
    }
  }, [messages, streaming, selected]);

  const handleSelectAgent = async (name: string) => {
    setSelected(name);
    setActiveTools([]);
    if (!name) { setMessages([]); return; }
    // Load per-agent model preference
    setModel(loadModelPref(name));
    // Try server session first, fall back to localStorage
    const serverMsgs = await loadHistoryFromServer(name);
    if (serverMsgs.length > 0) {
      setMessages(serverMsgs);
      saveHistory(name, serverMsgs); // keep localStorage in sync
    } else {
      const localMsgs = loadHistory(name);
      setMessages(localMsgs);
      // Migrate localStorage history to server on first load
      if (localMsgs.length > 0) {
        migrateHistoryIfNeeded(name);
      }
    }
  };

  const runStream = useCallback((agentName: string, prompt: string, files?: Array<{ path: string; name: string; content: string }>) => {
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setStreaming(true);
    setActiveTools([]);
    setThinking(true);
    setActiveJobId(null);
    setJobProgress(0);
    setJobStatus("pending");

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
            const jobId = r.jobId ?? null;
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
                  meta: { turnCount: r.turnCount, toolCallCount: r.toolCallCount, durationMs: r.durationMs, jobId: jobId ?? undefined },
                };
              } else {
                next.push({
                  role: "assistant",
                  content: r.response,
                  toolCalls: toolDisplays,
                  meta: { turnCount: r.turnCount, toolCallCount: r.toolCallCount, durationMs: r.durationMs, jobId: jobId ?? undefined },
                });
              }
              return next;
            });
            setActiveTools([]);
            setStreaming(false);
            setActiveJobId(null);
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
            setActiveJobId(null);
            break;

          case "job_id":
            setActiveJobId(event.jobId);
            setJobProgress(0);
            setJobStatus("running");
            break;

          case "job_update":
            setJobProgress(event.progress);
            setJobStatus(event.status);
            break;

          case "turn_end":
            break;
          case "done":
            break;
        }
      },
      history,
      currentModel || undefined,
      files && files.length > 0 ? files : undefined,
    );

    abortRef.current = abort;
  }, []);

  const handleSend = () => {
    if (!input.trim() || !selected || streaming) return;
    const files = attachedFiles.length > 0 ? [...attachedFiles] : undefined;
    runStream(selected, input.trim(), files);
    setInput("");
    clearAttachments();
  };

  const handleRetry = () => {
    const lastUserIdx = messages.map((m, i) => m.role === "user" ? i : -1).filter(i => i >= 0).pop();
    if (lastUserIdx === undefined || !selected) return;
    const prompt = messages[lastUserIdx].content;
    const trimmed = messages.slice(0, lastUserIdx);
    setMessages(trimmed);
    setTimeout(() => runStream(selected, prompt), 0);
  };

  const handleClear = async () => {
    setMessages([]);
    if (selected) {
      clearHistory(selected);
      const sessionId = loadSessionId(selected);
      if (sessionId) {
        try { await api.agent.deleteSession(selected, sessionId); } catch { /* ignore */ }
        saveSessionId(selected, "");
      }
    }
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
    setActiveJobId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const lastMsgIsError = messages.length > 0 && messages[messages.length - 1].isError;

  function AgentDirectory({ agents: agentList, onSelect, theme: th, t: tt }: {
    agents: AgentInfo[];
    onSelect: (name: string) => void;
    theme: Theme;
    t: ReturnType<typeof useI18n>["t"];
  }) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontSize: th.font.sizes.lg, fontWeight: th.font.weights.semibold, color: th.colors.text.primary, marginBottom: th.spacing.lg }}>
          {tt.agentChat.selectAgentPrompt}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: th.spacing.md, textAlign: "left" as const }}>
          {agentList.map((agent) => (
            <Button
              key={agent.name}
              variant="ai"
              onClick={() => onSelect(agent.name)}
              style={{
                padding: th.spacing.lg,
                textAlign: "left" as const,
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = th.colors.aiAccent;
                e.currentTarget.style.boxShadow = `0 0 0 1px ${th.colors.aiAccent}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = th.colors.border.default;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: th.font.sizes.md, fontWeight: th.font.weights.semibold, color: th.colors.aiAccent, marginBottom: 4 }}>
                {agent.name}
              </div>
              <div style={{
                fontSize: th.font.sizes.xs,
                color: th.colors.text.muted,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
                lineHeight: 1.4,
              }}>
                {agent.description ?? "Specialized AI agent"}
              </div>
              {(agent.tools?.length ?? 0) > 0 && (
                <div style={{ marginTop: th.spacing.sm, fontSize: th.font.sizes.xs, color: th.colors.text.faint }}>
                  {agent.tools!.length} tools
                </div>
              )}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  function AgentCapabilityCard({ agent }: { agent: AgentInfo }) {
    return (
      <Card data-testid="agent-capability-card" variant="surface" padding="md" style={{
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
      </Card>
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
        <Button
          variant="primary"
          onClick={() => {
            setBridgeOk(null);
            setBridgeError("");
            load();
          }}
          style={{ marginTop: theme.spacing.xl }}
        >
          {t.agentChat.retry}
        </Button>
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
          onChange={(e) => { setModel(e.target.value); saveModelPref(e.target.value, selected || undefined); }}
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
              <Button variant="ghost" size="sm" onClick={handleRetry}>{t.agentChat.retry}</Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleExport}>{t.agentChat.export}</Button>
            <Button variant="ghost" size="sm" onClick={handleClear}>{t.agentChat.clear}</Button>
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
            {!selected && agents.length > 0 ? (
              <AgentDirectory agents={agents} onSelect={handleSelectAgent} theme={theme} t={t} />
            ) : (
              <>
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
                      <Button
                        key={i}
                        variant="outline"
                        onClick={() => {
                          setInput("");
                          runStream(selected, starter);
                        }}
                        style={{ textAlign: "left" as const }}
                      >
                        {starter}
                      </Button>
                    ))}
                  </div>
                )}
              </>
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
            {activeTools.map((tc, i) => {
              const isPipelineTool = getPipelineOp(tc.name).op !== "other";
              return isPipelineTool
                ? <PipelineToolCard key={`active-${i}`} tc={tc} />
                : <ToolCallCard key={`active-${i}`} tc={tc} />;
            })}
          </div>
        )}

        {/* Job status card during streaming */}
        {activeJobId && (jobStatus === "running" || jobStatus === "pending") && (
          <div style={{ marginBottom: theme.spacing.sm }}>
            <JobStatusCard jobId={activeJobId} live={true} />
          </div>
        )}

        {/* Thinking indicator */}
        {thinking && streaming && activeTools.length === 0 && <ThinkingIndicator />}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: `1px solid ${theme.colors.border.default}`, paddingTop: theme.spacing.sm }}>
        {/* Attachment chips */}
        {attachedFiles.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: theme.spacing.sm }}>
            {attachedFiles.map((f) => (
              <span key={f.path} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: theme.radii.md,
                background: theme.colors.primaryLight,
                fontSize: 12,
                color: theme.colors.primaryDark,
              }}>
                <span style={{ fontSize: 11 }}>📎</span>
                {f.name.length > 30 ? f.name.slice(0, 30) + "..." : f.name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(f.path)}
                  style={{ fontSize: 14, padding: "0 2px", lineHeight: 1 }}
                  title="Remove attachment"
                >
                  ×
                </Button>
              </span>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: theme.spacing.sm }}>
          {/* Attach button */}
          {!streaming && selected && (
            <Button
              variant="outline"
              size="sm"
              onClick={openFilePicker}
              style={{ fontSize: 18, lineHeight: 1 }}
              title="Attach file from project"
            >
              📎
            </Button>
          )}

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
            <Button variant="danger" onClick={handleAbort} style={{ alignSelf: "flex-end" }}>{t.agentChat.stop}</Button>
          ) : (
            <Button variant="primary" onClick={handleSend} disabled={!selected || !input.trim()} style={{ alignSelf: "flex-end" }}>
              {t.agentChat.send}
            </Button>
          )}
        </div>
      </div>

      {/* File Picker Modal */}
      {showFilePicker && (
        <div
          onClick={closeFilePicker}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.colors.bg.page,
              borderRadius: theme.radii.xl,
              padding: theme.spacing.xl,
              width: "min(520px, 90vw)",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: theme.shadows.lg,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md }}>
              <h3 style={{ margin: 0, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold }}>
                Attach Files
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeFilePicker}
                style={{ fontSize: 20 }}
              >
                ×
              </Button>
            </div>

            {/* Series selector */}
            <div style={{ marginBottom: theme.spacing.sm }}>
              <select
                value={fileSeriesId}
                onChange={(e) => selectFileSeries(e.target.value)}
                style={{
                  width: "100%",
                  padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                  fontSize: theme.font.sizes.base,
                  borderRadius: theme.radii.lg,
                  border: `1px solid ${theme.colors.border.medium}`,
                }}
              >
                <option value="">-- Select a series --</option>
                {fileSeriesList.map((s) => (
                  <option key={s.id} value={s.id}>{s.id}</option>
                ))}
              </select>
            </div>

            {/* File list */}
            <div style={{ overflowY: "auto", flex: 1, minHeight: 200 }}>
              {filePickerLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: theme.colors.text.muted }}>Loading...</div>
              ) : !fileSeriesId ? (
                <div style={{ textAlign: "center", padding: 40, color: theme.colors.text.muted }}>
                  Select a series above to browse files
                </div>
              ) : fileList.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: theme.colors.text.muted }}>
                  No files found
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <tbody>
                    {fileList.map((f) => {
                      const isAttached = attachedFiles.some((a) => a.path === f.path);
                      return (
                        <tr key={f.path} style={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
                          <td style={{ padding: "4px 0" }}>
                            <span style={{ fontSize: 11, color: theme.colors.text.muted }}>
                              {f.episode ? `${f.episode}/` : ""}
                            </span>
                            <span style={{ color: theme.colors.text.primary }}>
                              {f.name.replace(f.episode ? `${f.episode}/` : "", "")}
                            </span>
                          </td>
                          <td style={{ padding: "4px 0", textAlign: "right", fontSize: 11, color: theme.colors.text.muted, whiteSpace: "nowrap" }}>
                            {(f.size / 1024).toFixed(1)}KB
                          </td>
                          <td style={{ padding: "4px 0", textAlign: "right", width: 80 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => attachFile(f.path, f.name)}
                              disabled={isAttached}
                              style={{ fontSize: 12 }}
                            >
                              {isAttached ? "Added" : "Attach"}
                            </Button>
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

// --- Styles ---

function selectStyle(t: Theme): React.CSSProperties {
  return { padding: `${t.spacing.sm}px ${t.spacing.md}px`, fontSize: t.font.sizes.md, borderRadius: t.radii.lg, border: `1px solid ${t.colors.border.medium}`, minWidth: 180 };
}

function errorBoxStyle(t: Theme): React.CSSProperties {
  return { padding: t.spacing.xl, background: t.colors.warningLight, border: `1px solid ${t.colors.border.default}`, borderRadius: t.radii.xl, color: t.colors.error };
}
