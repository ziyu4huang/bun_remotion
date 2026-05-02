import { Button } from "./Button";
import { WizardProgressBar } from "./WizardProgressBar";
import { STEPS, type SeriesProgress } from "./WizardTypes";
import type { useI18n } from "../i18n";
import type { useTheme } from "../theme";

function thStyle(theme: ReturnType<typeof useTheme>) {
  return {
    padding: "8px 10px",
    textAlign: "left" as const,
    fontWeight: theme.font.weights.medium as number,
    color: theme.colors.text.muted,
    borderBottom: `1px solid ${theme.colors.border.default}`,
    fontSize: theme.font.sizes.xs,
  };
}

function tdStyle(theme: ReturnType<typeof useTheme>) {
  return {
    padding: "8px 10px",
    borderBottom: `1px solid ${theme.colors.border.light}`,
    color: theme.colors.text.primary,
  };
}

function DesktopBreakdown({ progress, theme, t }: {
  progress: SeriesProgress[];
  theme: ReturnType<typeof useTheme>;
  t: ReturnType<typeof useI18n>["t"];
}) {
  return (
    <div style={{
      padding: theme.spacing.xl,
      borderRadius: theme.radii.lg,
      border: `1px solid ${theme.colors.border.default}`,
      background: theme.colors.bg.surface,
    }}>
      <div style={{
        fontSize: theme.font.sizes.lg,
        fontWeight: theme.font.weights.semibold,
        marginBottom: theme.spacing.lg,
        color: theme.colors.text.primary,
      }}>
        {t.wizard.seriesBreakdown}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.sm }}>
          <thead>
            <tr>
              <th style={thStyle(theme)}>{t.wizard.seriesCol}</th>
              {STEPS.map((s) => (
                <th key={s.key} style={{ ...thStyle(theme), textAlign: "center" as const }}>
                  {t.dashboard.steps[s.key] ? t.dashboard.steps[s.key].split(" ")[0] : s.key}
                </th>
              ))}
              <th style={{ ...thStyle(theme), textAlign: "center" as const }}>{t.wizard.progressCol}</th>
            </tr>
          </thead>
          <tbody>
            {progress.map((p) => {
              const totalDone = Object.values(p.steps).reduce((s, v) => s + v.done, 0);
              const totalSteps = Object.values(p.steps).reduce((s, v) => s + v.total, 0);
              const pct = totalSteps > 0 ? Math.round(totalDone / totalSteps * 100) : 0;

              return (
                <tr key={p.seriesId}>
                  <td style={tdStyle(theme)}>{p.seriesName}</td>
                  {STEPS.map((s) => {
                    const st = p.steps[s.key];
                    return (
                      <td key={s.key} style={{ ...tdStyle(theme), textAlign: "center" as const }}>
                        {st.done}/{st.total}
                      </td>
                    );
                  })}
                  <td style={{ ...tdStyle(theme), textAlign: "center" as const }}>
                    <span style={{
                      color: pct === 100 ? theme.colors.status.success : theme.colors.text.secondary,
                      fontWeight: pct === 100 ? theme.font.weights.medium : theme.font.weights.normal,
                    }}>
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MobileBreakdown({ progress, theme, t, expanded, onToggle }: {
  progress: SeriesProgress[];
  theme: ReturnType<typeof useTheme>;
  t: ReturnType<typeof useI18n>["t"];
  expanded: string | null;
  onToggle: (id: string | null) => void;
}) {
  return (
    <div style={{
      borderRadius: theme.radii.lg,
      border: `1px solid ${theme.colors.border.default}`,
      background: theme.colors.bg.surface,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 16px",
        fontSize: theme.font.sizes.sm,
        fontWeight: theme.font.weights.semibold,
        color: theme.colors.text.primary,
        borderBottom: `1px solid ${theme.colors.border.default}`,
      }}>
        {t.wizard.breakdownMobile}
      </div>
      {progress.map((p) => {
        const totalDone = Object.values(p.steps).reduce((s, v) => s + v.done, 0);
        const totalSteps = Object.values(p.steps).reduce((s, v) => s + v.total, 0);
        const pct = totalSteps > 0 ? Math.round(totalDone / totalSteps * 100) : 0;
        const isOpen = expanded === p.seriesId;

        return (
          <div key={p.seriesId} style={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle(isOpen ? null : p.seriesId)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                textAlign: "left",
                minHeight: 44,
              }}
            >
              <div>
                <div style={{ fontSize: theme.font.sizes.sm, fontWeight: theme.font.weights.medium, color: theme.colors.text.primary }}>
                  {p.seriesName}
                </div>
                <div style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted, marginTop: 2 }}>
                  {p.completedEpisodes}/{p.totalEpisodes} episodes
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: theme.font.sizes.sm,
                  fontWeight: theme.font.weights.medium,
                  color: pct === 100 ? theme.colors.status.success : theme.colors.text.secondary,
                }}>
                  {pct}%
                </span>
                <span style={{ fontSize: 10, color: theme.colors.text.muted, transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                  ▸
                </span>
              </div>
            </Button>
            {isOpen && (
              <div style={{
                padding: "4px 16px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                animation: "wizFadeSlide 0.2s ease-out",
              }}>
                {STEPS.map((s) => {
                  const st = p.steps[s.key];
                  const stPct = st.total > 0 ? Math.round(st.done / st.total * 100) : 0;
                  return (
                    <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 15, width: 22, textAlign: "center" as const }}>{s.icon}</span>
                      <span style={{ flex: 1, fontSize: theme.font.sizes.sm, color: theme.colors.text.primary }}>
                        {t.dashboard.steps[s.key] ?? s.key}
                      </span>
                      <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted, width: 34, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>
                        {st.done}/{st.total}
                      </span>
                      <div style={{ width: 64 }}>
                        <WizardProgressBar pct={stPct} color={stPct === 100 ? theme.colors.status.success : theme.colors.primary} theme={theme} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WizardSeriesBreakdown({ progress, theme, t, isMobile, expanded, onToggle }: {
  progress: SeriesProgress[];
  theme: ReturnType<typeof useTheme>;
  t: ReturnType<typeof useI18n>["t"];
  isMobile: boolean;
  expanded: string | null;
  onToggle: (id: string | null) => void;
}) {
  if (progress.length <= 1) return null;

  if (isMobile) {
    return <MobileBreakdown progress={progress} theme={theme} t={t} expanded={expanded} onToggle={onToggle} />;
  }
  return <DesktopBreakdown progress={progress} theme={theme} t={t} />;
}
