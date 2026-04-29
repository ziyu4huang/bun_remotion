import { useEffect, useState } from "react";
import { api } from "../api";
import type { MonitoringOverview, SeriesHealth, ActivityEntry } from "../../shared/types";
import { PageHeader, StatusBadge, LoadingSpinner, EmptyState, SkeletonCard, SkeletonRow, AgentResultPanel } from "../components";
import { useAgentTask } from "../hooks/useAgentTask";
import { useTheme, type Theme } from "../theme";
import { useI18n } from "../i18n";

export function Monitoring() {
  const theme = useTheme();
  const { t } = useI18n();
  const [overview, setOverview] = useState<MonitoringOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const { task: agentTask, start: handleAskAgent } = useAgentTask("studio-advisor");

  useEffect(() => {
    api.getMonitoringOverview().then((r) => {
      if (r.ok && r.data) setOverview(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div>
      <PageHeader title={t.monitoring.title} description={t.monitoring.description} />
      <div style={{ display: "flex", gap: theme.spacing.lg, marginBottom: theme.spacing.xxl, flexWrap: "wrap" }}>
        {Array.from({ length: 7 }, (_, i) => <SkeletonCard key={i} rows={1} showHeader />)}
      </div>
      <h3 style={{ marginBottom: theme.spacing.md }}>{t.monitoring.seriesHealth}</h3>
      <SkeletonRow height={24} count={4} />
    </div>
  );
  if (!overview) return <EmptyState icon="⚠" title="Failed to load monitoring data" description="Could not retrieve monitoring overview from the server." />;

  return (
    <div>
      <PageHeader title={t.monitoring.title} description={t.monitoring.description} />

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: theme.spacing.lg, marginBottom: theme.spacing.xxl, flexWrap: "wrap" }}>
        <SummaryCard label="Series" value={overview.totalSeries} />
        <SummaryCard label="Episodes" value={overview.totalEpisodes} />
        <SummaryCard label="Scaffolded" value={overview.totalScaffolded} />
        <SummaryCard label="Rendered" value={overview.totalRendered} />
        <SummaryCard label="Completion" value={`${overview.overallCompletionRate}%`} />
        <SummaryCard label="Avg Gate" value={overview.avgGateScore != null ? `${overview.avgGateScore}/100` : "N/A"} />
        <SummaryCard label="Avg Blended" value={overview.avgBlendedScore != null ? `${overview.avgBlendedScore}%` : "N/A"} />
      </div>

      {/* Ask advisor */}
      <div style={{ marginBottom: theme.spacing.xl, padding: theme.spacing.lg, background: theme.colors.bg.muted, borderRadius: theme.radii.xl }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: theme.spacing.sm }}>
          <AgentBtn label="What should I work on next?" prompt="Review the current state of all series. What's blocking production? Which series need attention? Give a prioritized action list." onClick={handleAskAgent} theme={theme} variant="primary" />
          <AgentBtn label="Analyze production bottlenecks" prompt="Analyze the production pipeline. Which steps are slowest? Which series have the lowest completion rates? Suggest ways to unblock." onClick={handleAskAgent} theme={theme} />
          <AgentBtn label="Quality summary" prompt="Summarize the quality state across all series. Which are improving, declining, or stable? What's the biggest quality risk?" onClick={handleAskAgent} theme={theme} />
        </div>
        {agentTask.status !== "idle" && (
          <AgentResultPanel task={agentTask} theme={theme} />
        )}
      </div>

      {/* Series Health Table */}
      <section style={{ marginBottom: theme.spacing.xxxl }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.sm }}>
          <h3 style={{ margin: 0 }}>{t.monitoring.seriesHealth}</h3>
          <TrendLegend theme={theme} />
        </div>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={getTh(theme)}>Series</th>
              <th style={getTh(theme)}>Category</th>
              <th style={getTh(theme)}>Episodes</th>
              <th style={getTh(theme)}>Progress</th>
              <th style={getTh(theme)}>Gate</th>
              <th style={getTh(theme)}>Blended</th>
              <th style={getTh(theme)}>Decision</th>
              <th style={getTh(theme)}>Graph</th>
              <th style={getTh(theme)}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {overview.seriesHealth.map((h) => (
              <tr key={h.seriesId}>
                <td style={getTd(theme)}>{h.name}</td>
                <td style={getTd(theme)}><StatusBadge status={h.category} /></td>
                <td style={getTd(theme)}>{h.renderedCount}/{h.episodeCount}</td>
                <td style={getTd(theme)}><CompletionBar rate={h.completionRate} /></td>
                <td style={getTd(theme)}>{h.gateScore != null ? h.gateScore : "—"}</td>
                <td style={getTd(theme)}>{h.blendedScore != null ? `${h.blendedScore}%` : "—"}</td>
                <td style={getTd(theme)}>{h.qualityDecision ? <StatusBadge status={h.qualityDecision} /> : "—"}</td>
                <td style={getTd(theme)}>{h.nodeCount}n/{h.edgeCount}e/{h.communityCount}c</td>
                <td style={getTd(theme)}><TrendIndicator trend={h.trend} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Recent Activity */}
      <section>
        <h3>{t.monitoring.recentActivity}</h3>
        {overview.recentActivity.length === 0 ? (
          <EmptyState icon="📋" title={t.monitoring.noActivity} description={t.monitoring.noActivityDesc} />
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={getTh(theme)}>Time</th>
                <th style={getTh(theme)}>Series</th>
                <th style={getTh(theme)}>Type</th>
                <th style={getTh(theme)}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentActivity.map((a, i) => (
                <ActivityRow key={i} entry={a} />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  const theme = useTheme();
  return (
    <div style={{
      padding: `${theme.spacing.md}px ${theme.spacing.xl}px`,
      borderRadius: theme.radii.xl,
      background: theme.colors.bg.muted,
      minWidth: 100,
    }}>
      <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary, marginBottom: theme.spacing.xs }}>{label}</div>
      <div style={{ fontSize: theme.font.sizes.xl, fontWeight: theme.font.weights.semibold }}>{value}</div>
    </div>
  );
}

function CompletionBar({ rate }: { rate: number }) {
  const theme = useTheme();
  const color = rate >= 80 ? theme.colors.success : rate >= 40 ? theme.colors.warning : theme.colors.error;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
      <div style={{ width: 60, height: 6, background: theme.colors.border.default, borderRadius: theme.radii.sm, overflow: "hidden" }}>
        <div style={{ width: `${rate}%`, height: "100%", background: color, borderRadius: theme.radii.sm }} />
      </div>
      <span style={{ fontSize: theme.font.sizes.sm }}>{rate}%</span>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: SeriesHealth["trend"] }) {
  const theme = useTheme();
  const config: Record<string, { symbol: string; color: string }> = {
    improving: { symbol: "↑", color: theme.colors.success },
    stable: { symbol: "→", color: theme.colors.text.tertiary },
    declining: { symbol: "↓", color: theme.colors.errorDark },
    new: { symbol: "★", color: theme.colors.primaryDark },
  };
  const c = config[trend] ?? config.stable;
  return <span style={{ color: c.color, fontWeight: theme.font.weights.semibold }}>{c.symbol} {trend}</span>;
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const theme = useTheme();
  const typeColors: Record<string, string> = {
    pipeline: theme.colors.primaryDark,
    render: theme.colors.purple,
    scaffold: theme.colors.success,
  };
  const time = new Date(entry.timestamp).toLocaleString();
  return (
    <tr>
      <td style={getTd(theme)}>{time}</td>
      <td style={getTd(theme)}>{entry.seriesId}</td>
      <td style={getTd(theme)}>
        <span style={{ color: typeColors[entry.type] ?? theme.colors.text.tertiary, fontWeight: theme.font.weights.medium }}>{entry.type}</span>
      </td>
      <td style={getTd(theme)}>{entry.detail}</td>
    </tr>
  );
}

const getTh = (theme: Theme): React.CSSProperties => ({ textAlign: "left", padding: theme.spacing.sm, borderBottom: `2px solid ${theme.colors.border.default}`, fontSize: theme.font.sizes.base });
const getTd = (theme: Theme): React.CSSProperties => ({ padding: theme.spacing.sm, borderBottom: `1px solid ${theme.colors.border.light}`, fontSize: theme.font.sizes.base });

function TrendLegend({ theme }: { theme: ReturnType<typeof useTheme> }) {
  const { t } = useI18n();
  const items: { symbol: string; label: string; color: string }[] = [
    { symbol: "↑", label: t.monitoring.trendLegend.improving, color: theme.colors.success },
    { symbol: "→", label: t.monitoring.trendLegend.stable, color: theme.colors.text.tertiary },
    { symbol: "↓", label: t.monitoring.trendLegend.declining, color: theme.colors.errorDark },
    { symbol: "★", label: t.monitoring.trendLegend.new, color: theme.colors.primaryDark },
  ];
  return (
    <div style={{ display: "flex", gap: 12, fontSize: theme.font.sizes.xs, color: theme.colors.text.muted }}>
      {items.map((it) => (
        <span key={it.label}><span style={{ color: it.color, fontWeight: 600 }}>{it.symbol}</span> {it.label}</span>
      ))}
    </div>
  );
}

function AgentBtn({ label, prompt, onClick, theme, variant }: {
  label: string; prompt: string; onClick: (p: string) => void; theme: Theme; variant?: "primary";
}) {
  const bg = variant === "primary" ? theme.colors.primary : theme.colors.bg.page;
  const fg = variant ? theme.colors.bg.page : theme.colors.text.primary;
  const border = variant ? "none" : `1px solid ${theme.colors.border.medium}`;
  return (
    <button onClick={() => onClick(prompt)} style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, border, borderRadius: theme.radii.lg, background: bg, color: fg, cursor: "pointer", fontSize: theme.font.sizes.base, fontWeight: variant ? theme.font.weights.semibold : theme.font.weights.normal }}>
      {label}
    </button>
  );
}
