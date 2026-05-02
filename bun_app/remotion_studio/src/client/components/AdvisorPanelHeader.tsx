import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import type { ChatMessage } from "./ChatTypes";

export function AdvisorPanelHeader({ title, accent, agentName, contextLabel, messages, streaming, historyKey, onNewChat, onClear }: {
  title: string;
  accent: string;
  agentName: string;
  contextLabel: string;
  messages: ChatMessage[];
  streaming: boolean;
  historyKey: string;
  onNewChat: () => void;
  onClear: () => void;
}) {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.colors.border.default}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <h3 style={{ margin: 0, fontSize: theme.font.sizes.md, color: accent }}>{title}</h3>
        <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted }}>{agentName} · {contextLabel}</div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {messages.length > 0 && !streaming && (
          <>
            <button onClick={onNewChat}
              style={{ padding: "2px 8px", background: "none", border: `1px solid ${theme.colors.border.medium}`, borderRadius: theme.radii.sm, cursor: "pointer", fontSize: theme.font.sizes.sm, color: theme.colors.text.muted }}
              title="Start a new conversation">
              {t.advisor.newChat}
            </button>
            <button onClick={onClear}
              style={{ padding: "2px 8px", background: "none", border: `1px solid ${theme.colors.border.medium}`, borderRadius: theme.radii.sm, cursor: "pointer", fontSize: theme.font.sizes.sm, color: theme.colors.text.muted }}
              title="Clear all history">
              {t.advisor.clearChat}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
