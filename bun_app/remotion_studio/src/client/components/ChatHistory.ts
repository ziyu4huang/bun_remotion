import type { ChatMessage } from "./ChatTypes";

const HISTORY_KEY = "agent-chat-history";

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
