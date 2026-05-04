import {
  type ChatMessage, type ToolCallDisplay,
  ToolCallCard, UserBubble, AssistantBubble, ThinkingIndicator, TurnSeparator,
  MarkdownText, PipelineToolCard, getPipelineOp, JobStatusCard, Button,
} from "../components";
import { AgentDirectory, CONVERSATION_STARTERS } from "./AgentDirectory";
import { getAgentDisplayName } from "../lib/agent-display.js";
import type { AgentInfo } from "../../../shared/types";
import type { JobStatus } from "../../../shared/types";
import type { Theme } from "../theme";

interface ChatMessageAreaProps {
  messages: ChatMessage[];
  activeTools: ToolCallDisplay[];
  thinking: boolean;
  streaming: boolean;
  activeJobId: string | null;
  jobStatus: JobStatus;
  selectedAgent: string;
  agents: AgentInfo[];
  theme: Theme;
  t: any;
  locale?: string;
  onSendMessage: (prompt: string) => void;
  onSelectAgent: (agentName: string) => void;
}

export function ChatMessageArea({
  messages, activeTools, thinking, streaming, activeJobId, jobStatus,
  selectedAgent, agents, theme, t, locale, onSendMessage, onSelectAgent,
}: ChatMessageAreaProps) {
  return (
    <div style={{ flex: 1, overflowY: "auto", paddingRight: theme.spacing.sm }}>
      {messages.length === 0 && !streaming && (
        <div style={{ textAlign: "center", marginTop: 40 }}>
          {!selectedAgent && agents.length > 0 ? (
            <AgentDirectory agents={agents} onSelect={onSelectAgent} theme={theme} t={t} locale={locale} />
          ) : (
            <>
              <div style={{ color: theme.colors.text.muted, fontSize: theme.font.sizes.md, marginBottom: theme.spacing.lg }}>
                {selectedAgent
                  ? t.agentChat.sendMessage(getAgentDisplayName(selectedAgent))
                  : t.agentChat.selectAgentPrompt}
              </div>
              {selectedAgent && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 480, margin: "0 auto" }}>
                  <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary, marginBottom: 4 }}>
                    {t.agentChat.startersHeading}
                  </div>
                  {(CONVERSATION_STARTERS[selectedAgent] || CONVERSATION_STARTERS._default).map((starter: string, i: number) => (
                    <Button
                      key={i}
                      variant="outline"
                      onClick={() => onSendMessage(starter)}
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
              <AssistantBubble msg={msg} agentName={selectedAgent}>
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
    </div>
  );
}
