import { useTheme } from "../theme";
import { Button, Card } from "../components";

interface AgentTaskState {
  jobId: string;
  status: string;
  result: string | null;
}

interface QualityAskAgentProps {
  agentTask: AgentTaskState | null;
  hasRegressions: boolean;
  regressionCount: number;
  regressionSummary: string;
  selected: string;
  onAsk: (prompt: string) => void;
}

export function QualityAskAgent({ agentTask, hasRegressions, regressionCount, regressionSummary, selected, onAsk }: QualityAskAgentProps) {
  const theme = useTheme();

  return (
    <Card variant="default" padding="md" style={{ marginBottom: theme.spacing.xl }}>
      <h3 style={{ margin: `0 0 ${theme.spacing.sm}px 0` }}>Ask Quality Agent</h3>
      <p style={{ margin: `0 0 ${theme.spacing.md}px 0`, color: theme.colors.text.secondary, fontSize: theme.font.sizes.base }}>
        The agent analyzes quality data, explains scores, checks regressions, and suggests improvements.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: theme.spacing.sm }}>
        <AgentPromptButton label="How's my overall quality?" onClick={() => onAsk("Review the overall quality across all series. Highlight any regressions, low scores, or areas needing attention. Give a brief summary.")} />
        {hasRegressions && (
          <AgentPromptButton label={`Investigate ${regressionCount} regression(s)`} variant="warning" onClick={() => onAsk(`I see regression alerts for: ${regressionSummary}. Investigate each regression — explain what changed and why, and suggest fixes.`)} />
        )}
        {selected && (
          <AgentPromptButton label={`Analyze ${selected}`} onClick={() => onAsk(`Analyze the quality of series "${selected}" in detail. Explain the gate score, check results, AI dimensions, and any issues. Suggest specific improvements.`)} />
        )}
        {selected && (
          <AgentPromptButton label="Run full quality gate" variant="primary" onClick={() => onAsk(`Run a full quality gate check on series "${selected}". Check gate scores, run regression if baseline exists, and provide PASS/WARN/FAIL decision with explanations.`)} />
        )}
      </div>

      {agentTask && (
        <div style={{ marginTop: theme.spacing.md }}>
          {agentTask.status === "running" && (
            <div style={{ padding: theme.spacing.md, background: theme.colors.bg.page, borderRadius: theme.radii.lg, fontStyle: "italic", color: theme.colors.text.tertiary }}>
              Agent analyzing...
            </div>
          )}
          {agentTask.status === "done" && agentTask.result && (
            <div style={{ padding: theme.spacing.lg, background: theme.colors.successLight, borderRadius: theme.radii.xl, border: `1px solid ${theme.colors.successLight}` }}>
              <h4 style={{ margin: `0 0 ${theme.spacing.sm}px 0` }}>Quality Gate Report</h4>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: theme.font.sizes.base, lineHeight: 1.5, margin: 0, fontFamily: "inherit" }}>
                {agentTask.result}
              </pre>
            </div>
          )}
          {agentTask.status === "error" && agentTask.result && (
            <div style={{ padding: theme.spacing.md, background: theme.colors.errorLight, borderRadius: theme.radii.lg, color: theme.colors.error }}>
              {agentTask.result}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function AgentPromptButton({ label, onClick, variant }: {
  label: string;
  onClick: () => void;
  variant?: "primary" | "warning";
}) {
  return <Button variant={variant ? "primary" : "outline"} size="sm" onClick={onClick}>{label}</Button>;
}
