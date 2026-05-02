import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api";
import { loadHistory, saveHistory, clearHistory, loadSessionId, saveSessionId, loadHistoryFromServer, saveHistoryToServer, migrateHistoryIfNeeded, PageHeader, LoadingSpinner, Button } from "../components";
import { ChatInput, FilePickerModal, type ChatInputState, type ChatInputActions, type FilePickerState, type FilePickerActions } from "../components/ChatInput";
import { ChatErrorState } from "../components/ChatErrorState";
import { ChatMessageArea } from "../components/ChatMessageArea";
import { useFilePicker } from "../hooks/useFilePicker";
import { useTheme, type Theme } from "../theme";
import { useI18n } from "../i18n";
import { loadApiKeyWithEnvKey } from "./Settings";
import type { AgentInfo, AgentTaskResult, AgentStreamEvent, JobStatus, ChatMessage, ToolCallDisplay } from "../../shared/types";

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
    if (agentName) localStorage.setItem(`remotion_studio_model_${agentName}`, model);
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
  messagesRef.current = messages;
  useEffect(() => {
    if (!streaming && selected && messages.length > 0) {
      saveHistory(selected, messages);
      saveHistoryToServer(selected, messages);
    }
  }, [messages, streaming, selected]);

  const handleSelectAgent = async (name: string) => {
    if (streaming) {
      abortRef.current?.();
      abortRef.current = null;
      setStreaming(false);
      setThinking(false);
      setActiveTools([]);
      setActiveJobId(null);
    }
    setSelected(name);
    setActiveTools([]);
    if (!name) { setMessages([]); return; }
    setModel(loadModelPref(name));
    const serverMsgs = await loadHistoryFromServer(name);
    if (serverMsgs.length > 0) {
      setMessages(serverMsgs);
      saveHistory(name, serverMsgs);
    } else {
      const localMsgs = loadHistory(name);
      setMessages(localMsgs);
      if (localMsgs.length > 0) migrateHistoryIfNeeded(name);
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
    const priorMsgs = messagesRef.current.filter((m) => !m.isError);
    const history = [...priorMsgs, { role: "user" as const, content: prompt }]
      .map((m) => ({ role: m.role, content: m.content }));
    const currentModel = _modelRef.current;

    const abort = api.agent.streamChat(
      agentName, prompt,
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
            setThinking(true);
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
                next[next.length - 1] = { ...last, content: assistantText || r.response, toolCalls: toolDisplays, meta: { turnCount: r.turnCount, toolCallCount: r.toolCallCount, durationMs: r.durationMs, jobId: jobId ?? undefined } };
              } else {
                next.push({ role: "assistant", content: r.response, toolCalls: toolDisplays, meta: { turnCount: r.turnCount, toolCallCount: r.toolCallCount, durationMs: r.durationMs, jobId: jobId ?? undefined } });
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
            setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${event.message}`, isError: true }]);
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
          case "turn_end": case "done": break;
        }
      },
      history, currentModel || undefined,
      files && files.length > 0 ? files : undefined,
      loadApiKeyWithEnvKey().apiKey || undefined,
      loadApiKeyWithEnvKey().envKey,
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
    setMessages(messages.slice(0, lastUserIdx));
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
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const lastMsgIsError = messages.length > 0 && messages[messages.length - 1].isError;
  const chatInputState: ChatInputState = { input, selected, streaming, attachedFiles };
  const chatInputActions: ChatInputActions = { setInput, handleSend, handleAbort, handleKeyDown, openFilePicker, removeAttachment };
  const filePickerState: FilePickerState = { showFilePicker, fileSeriesId, fileSeriesList, fileList, filePickerLoading, attachedFiles };
  const filePickerActions: FilePickerActions = { closeFilePicker, selectFileSeries, attachFile };

  // Bridge unavailable
  if (bridgeOk === false) {
    return <ChatErrorState error={bridgeError} theme={theme} t={t} onRetry={() => { setBridgeOk(null); setBridgeError(""); load(); }} />;
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
          {agents.map((a) => (<option key={a.name} value={a.name}>{a.name}</option>))}
        </select>
        <select
          value={model}
          onChange={(e) => { setModel(e.target.value); saveModelPref(e.target.value, selected || undefined); }}
          style={{ ...selectStyle(theme), minWidth: 150 }}
          title="Model override"
        >
          {MODEL_OPTIONS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
        </select>
        {selectedAgent && (
          <span style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.tertiary }}>{t.agentChat.chatWith(selectedAgent.name)}</span>
        )}
        {messages.length > 0 && !streaming && (
          <div style={{ marginLeft: "auto", display: "flex", gap: theme.spacing.xs }}>
            {lastMsgIsError && <Button variant="ghost" size="sm" onClick={handleRetry}>{t.agentChat.retry}</Button>}
            <Button variant="ghost" size="sm" onClick={handleExport}>{t.agentChat.export}</Button>
            <Button variant="ghost" size="sm" onClick={handleClear}>{t.agentChat.clear}</Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <ChatMessageArea
        messages={messages} activeTools={activeTools} thinking={thinking}
        streaming={streaming} activeJobId={activeJobId} jobStatus={jobStatus}
        selectedAgent={selected} agents={agents} theme={theme} t={t}
        onSendMessage={(prompt) => { setInput(""); runStream(selected, prompt); }}
      />
      <div ref={chatEndRef} />

      {/* Input */}
      <ChatInput state={chatInputState} actions={chatInputActions} theme={theme} t={t} />
      <FilePickerModal state={filePickerState} actions={filePickerActions} theme={theme} />
    </div>
  );
}

function selectStyle(t: Theme): React.CSSProperties {
  return { padding: `${t.spacing.sm}px ${t.spacing.md}px`, fontSize: t.font.sizes.md, borderRadius: t.radii.lg, border: `1px solid ${t.colors.border.medium}`, minWidth: 180 };
}
