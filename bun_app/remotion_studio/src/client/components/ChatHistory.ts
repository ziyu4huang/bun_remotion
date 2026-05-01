import type { ChatMessage } from "./ChatTypes";
import { api } from "../api";

const HISTORY_KEY = "agent-chat-history";
const SESSION_ID_KEY = "agent-session-ids";

export function loadHistory(agentKey: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, ChatMessage[]>;
    return all[agentKey] ?? [];
  } catch {
    return [];
  }
}

export function saveHistory(agentKey: string, msgs: ChatMessage[]) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const all: Record<string, ChatMessage[]> = raw ? JSON.parse(raw) : {};
    all[agentKey] = msgs.slice(-200);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
  } catch { /* quota exceeded — silently ignore */ }
}

export function clearHistory(agentKey: string) {
  saveHistory(agentKey, []);
}

export function loadSessionId(agentKey: string): string {
  try {
    const raw = localStorage.getItem(SESSION_ID_KEY);
    if (!raw) return "";
    const all = JSON.parse(raw) as Record<string, string>;
    return all[agentKey] ?? "";
  } catch { return ""; }
}

export function saveSessionId(agentKey: string, sessionId: string) {
  try {
    const raw = localStorage.getItem(SESSION_ID_KEY);
    const all: Record<string, string> = raw ? JSON.parse(raw) : {};
    all[agentKey] = sessionId;
    localStorage.setItem(SESSION_ID_KEY, JSON.stringify(all));
  } catch { /* quota exceeded */ }
}

export async function loadHistoryFromServer(agentKey: string): Promise<ChatMessage[]> {
  const sessionId = loadSessionId(agentKey);
  if (!sessionId) return [];
  try {
    const res = await api.agent.getSession(agentKey, sessionId);
    if (res.ok && res.data?.messages) {
      return res.data.messages as ChatMessage[];
    }
  } catch { /* server unreachable */ }
  return [];
}

export async function saveHistoryToServer(agentKey: string, msgs: ChatMessage[]): Promise<void> {
  let sessionId = loadSessionId(agentKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    saveSessionId(agentKey, sessionId);
  }
  // Read per-agent model preference for server persistence
  let modelOverride: string | undefined;
  try {
    const perAgent = localStorage.getItem(`remotion_studio_model_${agentKey}`);
    modelOverride = perAgent ?? undefined;
  } catch { /* ignore */ }
  try {
    await api.agent.saveSession(
      agentKey,
      sessionId,
      msgs.map((m) => ({ role: m.role, content: m.content })),
      modelOverride,
    );
  } catch { /* server unreachable — localStorage fallback already saved */ }
}

export async function migrateHistoryIfNeeded(agentKey: string): Promise<void> {
  const sessionId = loadSessionId(agentKey);
  if (sessionId) return; // already has server session
  const localMsgs = loadHistory(agentKey);
  if (localMsgs.length === 0) return; // nothing to migrate
  await saveHistoryToServer(agentKey, localMsgs);
}
