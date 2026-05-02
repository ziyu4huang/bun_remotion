import { PageHeader, Button } from "../components";
import type { Theme } from "../theme";

interface ChatErrorStateProps {
  error: string;
  theme: Theme;
  t: any;
  onRetry: () => void;
}

export function ChatErrorState({ error, theme, t, onRetry }: ChatErrorStateProps) {
  return (
    <div>
      <PageHeader title={t.agentChat.title} description={t.agentChat.description} />
      <div style={{
        padding: theme.spacing.xl,
        background: theme.colors.warningLight,
        border: `1px solid ${theme.colors.border.default}`,
        borderRadius: theme.radii.xl,
        color: theme.colors.error,
      }}>
        {t.agentChat.bridgeUnavailable(error)}
      </div>
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
      <Button variant="primary" onClick={onRetry} style={{ marginTop: theme.spacing.xl }}>
        {t.agentChat.retry}
      </Button>
    </div>
  );
}
