import { useTheme } from "../theme";
import { StatusBadge } from "./StatusBadge";
import type { EpisodeProgress, EpisodeProgressSummary, EpisodeStepProgress } from "../../shared/types";

const STEP_KEYS: (keyof EpisodeStepProgress)[] = ["scaffold", "pipeline", "check", "score", "image", "tts", "render"];

interface ProgressEpisodeTableProps {
  bySeries: Map<string, EpisodeProgress[]>;
  collapsedSeries: Set<string>;
  selected: Set<string>;
  stepLabels: Record<keyof EpisodeStepProgress, string>;
  onToggleSeries: (id: string) => void;
  onToggleEpisode: (id: string) => void;
  onToggleSeriesSelect: (seriesId: string, eps: EpisodeProgress[]) => void;
  seriesLabel: (count: number) => string;
  selectedCountLabel: (count: number) => string;
  episodeLabel: string;
  progressLabel: string;
  scoreLabel: string;
}

export function ProgressEpisodeTable({
  bySeries, collapsedSeries, selected, stepLabels,
  onToggleSeries, onToggleEpisode, onToggleSeriesSelect,
  seriesLabel, selectedCountLabel, episodeLabel, progressLabel, scoreLabel,
}: ProgressEpisodeTableProps) {
  const theme = useTheme();

  return (
    <>
      {[...bySeries.entries()].map(([seriesId, eps]) => {
        const collapsed = collapsedSeries.has(seriesId);
        const pct = eps.reduce((s, e) => s + e.completedSteps, 0) / (eps.length * 7);
        const seriesSelected = eps.filter((e) => selected.has(e.episodeId)).length;
        return (
          <div key={seriesId} style={{
            marginBottom: 16, border: `1px solid ${theme.colors.border.default}`,
            borderRadius: theme.radii.lg, overflow: "hidden",
          }}>
            <div onClick={() => onToggleSeries(seriesId)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                background: theme.colors.bg.muted, cursor: "pointer", userSelect: "none",
              }}>
              <span style={{ fontSize: 10 }}>{collapsed ? "▶" : "▼"}</span>
              <input type="checkbox" checked={seriesSelected === eps.length && eps.length > 0}
                onChange={(e) => { e.stopPropagation(); onToggleSeriesSelect(seriesId, eps); }}
                onClick={(e) => e.stopPropagation()}
                style={{ cursor: "pointer" }} />
              <span style={{ fontWeight: theme.font.weights.medium }}>{eps[0].seriesName}</span>
              <span style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted }}>
                {seriesLabel(eps.length)}
              </span>
              {seriesSelected > 0 && (
                <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.primary }}>
                  {selectedCountLabel(seriesSelected)}
                </span>
              )}
              <ProgressBar pct={pct} color={theme.colors.primary} bg={theme.colors.bg.muted} style={{ marginLeft: "auto", width: 120 }} />
              <span style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted, width: 40, textAlign: "right" }}>
                {Math.round(pct * 100)}%
              </span>
            </div>

            {!collapsed && (
              <div style={{ overflowX: "auto" }}>
              <table aria-label="Episode progress" style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.sm }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.colors.border.default}` }}>
                    <th style={thStyle(theme)}></th>
                    <th style={thStyle(theme)}>{episodeLabel}</th>
                    {STEP_KEYS.map((k) => <th key={k} style={{ ...thStyle(theme), textAlign: "center", minWidth: 56 }}>{stepLabels[k]}</th>)}
                    <th style={{ ...thStyle(theme), textAlign: "center" }}>{progressLabel}</th>
                    <th style={{ ...thStyle(theme), textAlign: "center" }}>{scoreLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {eps.map((ep) => (
                    <tr key={ep.episodeId} style={{
                      borderBottom: `1px solid ${theme.colors.border.light}`,
                      background: selected.has(ep.episodeId) ? theme.colors.primaryLight : "transparent",
                    }}>
                      <td style={{ padding: "6px 8px", width: 32 }}>
                        <input type="checkbox" checked={selected.has(ep.episodeId)}
                          onChange={() => onToggleEpisode(ep.episodeId)} style={{ cursor: "pointer" }} />
                      </td>
                      <td style={{ padding: "6px 14px" }}>
                        {ep.chapter != null ? `Ch${ep.chapter}-Ep${ep.episode}` : `Ep${ep.episode ?? ""}`}
                      </td>
                      {STEP_KEYS.map((k) => (
                        <td key={k} style={{ padding: "6px 8px", textAlign: "center" }}>
                          <StepCell done={ep.steps[k]} theme={theme} />
                        </td>
                      ))}
                      <td style={{ padding: "6px 14px", textAlign: "center" }}>
                        <span style={{
                          fontSize: theme.font.sizes.sm,
                          color: ep.completedSteps === ep.totalSteps ? theme.colors.success : theme.colors.text.secondary,
                        }}>
                          {ep.completedSteps}/{ep.totalSteps}
                        </span>
                      </td>
                      <td style={{ padding: "6px 14px", textAlign: "center" }}>
                        {ep.blendedScore != null ? (
                          <StatusBadge status={ep.blendedScore >= 70 ? "pass" : ep.blendedScore >= 50 ? "warn" : "fail"} label={`${ep.blendedScore}`} />
                        ) : ep.gateScore != null ? (
                          <StatusBadge status={ep.gateScore >= 70 ? "pass" : ep.gateScore >= 50 ? "warn" : "fail"} label={`${ep.gateScore}`} />
                        ) : (
                          <span style={{ color: theme.colors.text.tertiary }}>&mdash;</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function StepCell({ done, theme }: { done: boolean; theme: ReturnType<typeof useTheme> }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 28, height: 28, borderRadius: theme.radii.md,
      background: done ? theme.colors.successLight : theme.colors.bg.muted,
      color: done ? theme.colors.successDark : theme.colors.text.tertiary,
      fontSize: 14, fontWeight: done ? 600 : 400,
    }}>
      {done ? "✓" : "—"}
    </span>
  );
}

function ProgressBar({ pct, color, bg, style }: { pct: number; color: string; bg: string; style?: React.CSSProperties }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: bg, overflow: "hidden", ...style }}>
      <div style={{
        height: "100%", width: `${Math.round(pct * 100)}%`, borderRadius: 3,
        background: color, transition: "width 0.3s",
      }} />
    </div>
  );
}

function thStyle(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    padding: "6px 14px", textAlign: "left",
    fontWeight: theme.font.weights.medium, color: theme.colors.text.muted,
  };
}

interface ProgressStepOverviewProps {
  summary: EpisodeProgressSummary;
  stepLabels: Record<keyof EpisodeStepProgress, string>;
  title: string;
}

export function ProgressStepOverview({ summary, stepLabels, title }: ProgressStepOverviewProps) {
  const theme = useTheme();
  return (
    <div style={{
      marginTop: 24, padding: 16,
      border: `1px solid ${theme.colors.border.default}`, borderRadius: theme.radii.lg,
    }}>
      <h3 style={{ margin: "0 0 12px", fontSize: theme.font.sizes.base, fontWeight: theme.font.weights.medium }}>
        {title}
      </h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {STEP_KEYS.map((k) => {
          const info = summary.byStep[k];
          const p = info.total > 0 ? info.done / info.total : 0;
          return (
            <div key={k} style={{
              flex: "1 1 120px", padding: 10, borderRadius: theme.radii.md,
              background: theme.colors.bg.muted, textAlign: "center",
            }}>
              <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted, marginBottom: 4 }}>
                {stepLabels[k]}
              </div>
              <div style={{
                fontSize: 20, fontWeight: theme.font.weights.bold,
                color: p === 1 ? theme.colors.success : theme.colors.text.primary,
              }}>
                {info.done}/{info.total}
              </div>
              <ProgressBar pct={p} color={theme.colors.primary} bg={theme.colors.bg.muted} style={{ marginTop: 6 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
