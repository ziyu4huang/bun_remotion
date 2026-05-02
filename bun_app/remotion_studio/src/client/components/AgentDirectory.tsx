import { Button } from "./Button";
import { Card } from "./Card";
import type { AgentInfo } from "../../shared/types";
import type { Theme } from "../theme";
import type { useI18n } from "../i18n";

export const CONVERSATION_STARTERS: Record<string, string[]> = {
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

export function AgentDirectory({ agents: agentList, onSelect, theme: th, t: tt }: {
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

export function AgentCapabilityCard({ agent, theme, t }: {
  agent: AgentInfo;
  theme: Theme;
  t: ReturnType<typeof useI18n>["t"];
}) {
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
