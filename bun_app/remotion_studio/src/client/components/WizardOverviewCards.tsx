import { WizardProgressBar } from "./WizardProgressBar";
import type { useI18n } from "../i18n";
import type { useTheme } from "../theme";
import type { SeriesProgress } from "./WizardTypes";

export { WizardProgressBar } from "./WizardProgressBar";

export function WizardOverviewCards({ progress, theme, t, isMobile }: {
  progress: SeriesProgress[];
  theme: ReturnType<typeof useTheme>;
  t: ReturnType<typeof useI18n>["t"];
  isMobile: boolean;
}) {
  const totalEps = progress.reduce((s, p) => s + p.totalEpisodes, 0);
  const completedEps = progress.reduce((s, p) => s + p.completedEpisodes, 0);
  const avgCompletion = totalEps > 0
    ? Math.round(progress.reduce((s, p) => {
        const stepDone = Object.values(p.steps).reduce((a, b) => a + b.done, 0);
        const stepTotal = Object.values(p.steps).reduce((a, b) => a + b.total, 0);
        return s + (stepTotal > 0 ? stepDone / stepTotal : 0);
      }, 0) / progress.length * 100)
    : 0;
  const completedPct = totalEps > 0 ? Math.round(completedEps / totalEps * 100) : 0;

  const cards = [
    { label: t.wizard.totalEpisodes, value: String(totalEps), color: theme.colors.primary, pct: 100 },
    { label: t.wizard.completed, value: String(completedEps), color: theme.colors.status.success, pct: completedPct },
    { label: t.wizard.avgCompletion, value: `${avgCompletion}%`, color: theme.colors.primary, pct: avgCompletion },
  ];

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" as const : "row" as const, gap: theme.spacing.md, marginBottom: theme.spacing.xl }}>
      {cards.map((c) => (
        <div key={c.label} style={{
          flex: 1,
          padding: theme.spacing.lg,
          borderRadius: theme.radii.lg,
          border: `1px solid ${theme.colors.border.default}`,
          background: theme.colors.bg.surface,
        }}>
          <div style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted, marginBottom: 4 }}>{c.label}</div>
          <div style={{ fontSize: theme.font.sizes.xxl, fontWeight: theme.font.weights.bold, color: c.color, marginBottom: 8 }}>{c.value}</div>
          <WizardProgressBar pct={c.pct} color={c.color} theme={theme} />
        </div>
      ))}
    </div>
  );
}
