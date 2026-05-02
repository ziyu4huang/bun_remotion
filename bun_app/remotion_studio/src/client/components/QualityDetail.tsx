import { Card } from "../components";
import { useTheme, scoreColor } from "../theme";
import type { Project, ScoreHistoryPoint } from "../../shared/types";

interface QualityDetailProps {
  selected: string;
  projects: Project[];
  qualityData: Record<string, unknown> | null;
  history: ScoreHistoryPoint[];
  onSelect: (seriesId: string) => void;
  scoreHistoryLabel: string;
  gateChecksLabel: string;
  selectSeriesLabel: string;
  selectSeriesDesc: string;
  noDataIcon: string;
  noDataTitle: string;
  noDataDesc: string;
}

export function QualityDetail({
  selected, projects, qualityData, history, onSelect,
  scoreHistoryLabel, gateChecksLabel, selectSeriesLabel, selectSeriesDesc,
  noDataIcon, noDataTitle, noDataDesc,
}: QualityDetailProps) {
  const theme = useTheme();

  if (!selected) {
    return <EmptyMessage icon="📋" title={selectSeriesLabel} description={selectSeriesDesc} />;
  }

  if (!qualityData) {
    return <EmptyMessage icon={noDataIcon} title={noDataTitle} description={noDataDesc} />;
  }

  const gate = qualityData.gate as Record<string, unknown> | undefined;
  const qualityScore = qualityData.qualityScore as Record<string, unknown> | undefined;
  const checks = gate?.checks as Array<Record<string, unknown>> | undefined;
  const blended = qualityScore?.blended as Record<string, unknown> | undefined;
  const aiData = qualityScore?.ai as Record<string, unknown> | undefined;

  return (
    <div>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, fontSize: theme.font.sizes.md, borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border.medium}`, minWidth: 200, marginBottom: theme.spacing.xl }}
      >
        <option value="">{selectSeriesLabel}</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {/* Score summary */}
      <div style={{ display: "flex", gap: theme.spacing.lg, marginBottom: theme.spacing.xxl }}>
        <ScoreCard label="Gate Score" value={gate?.score as number} max={100} />
        <ScoreCard label="Blended" value={blended ? Math.round((blended.overall as number) * 1000) / 10 : undefined} max={100} suffix="%" />
        <ScoreCard label="Decision" value={gate?.decision as string} />
        <ScoreCard label="AI Overall" value={aiData?.overall as number} max={10} />
      </div>

      {/* Score history */}
      {history.length > 0 && <ScoreHistoryChart history={history} label={scoreHistoryLabel} />}

      {/* Checks table */}
      {checks && checks.length > 0 && <ChecksTable checks={checks} label={gateChecksLabel} />}
    </div>
  );
}

function ScoreCard({ label, value, max, suffix }: { label: string; value?: number | string; max?: number; suffix?: string }) {
  const theme = useTheme();
  const display = value === undefined ? "—" : typeof value === "number" ? (suffix ? `${value}${suffix}` : `${value}/${max}`) : value;
  const color = typeof value === "number" && max ? scoreColor(value, max, theme) : theme.colors.text.primary;

  return (
    <Card variant="default" padding="md" style={{ minWidth: 120, textAlign: "center" }}>
      <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary, marginBottom: theme.spacing.xs }}>{label}</div>
      <div style={{ fontSize: theme.font.sizes.xxl, fontWeight: theme.font.weights.bold, color }}>{display}</div>
    </Card>
  );
}

function ScoreHistoryChart({ history, label }: { history: ScoreHistoryPoint[]; label: string }) {
  const theme = useTheme();
  return (
    <div style={{ marginBottom: theme.spacing.xxl }}>
      <h3 style={{ marginBottom: theme.spacing.sm }}>{label}</h3>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 80 }}>
        {history.map((h) => (
          <div key={h.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div
              style={{
                width: "100%", maxWidth: 40,
                height: `${Math.max(h.gateScore, 2)}%`,
                background: scoreColor(h.gateScore, 100, theme),
                borderRadius: "2px 2px 0 0", minHeight: 2,
              }}
              title={`Gate: ${h.gateScore}${h.blendedScore != null ? ` / Blended: ${h.blendedScore}%` : ""}`}
            />
            <div style={{ fontSize: theme.font.sizes.xs - 1, color: theme.colors.text.muted, marginTop: 2 }}>
              {h.date.slice(4, 6)}/{h.date.slice(6, 8)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary, marginTop: theme.spacing.xs }}>
        {history.map((h) => (
          <span key={h.date} style={{ marginRight: theme.spacing.md }}>
            {h.date.slice(0, 4)}-{h.date.slice(4, 6)}-{h.date.slice(6, 8)}: Gate {h.gateScore}
            {h.blendedScore != null ? ` / Blended ${h.blendedScore}%` : ""}
            {h.aiOverall != null ? ` / AI ${h.aiOverall}` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChecksTable({ checks, label }: { checks: Array<Record<string, unknown>>; label: string }) {
  const theme = useTheme();
  return (
    <div>
      <h3 style={{ marginBottom: theme.spacing.sm }}>{label} ({checks.length})</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.base }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${theme.colors.border.default}`, textAlign: "left" }}>
              <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>Check</th>
              <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>Status</th>
              <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>Impact</th>
              <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>Suggestion</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
                <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>{c.name as string}</td>
                <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>
                  <StatusPill status={c.status as string} />
                </td>
                <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>{(c.score_impact as number) > 0 ? `-${c.score_impact}` : "—"}</td>
                <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px`, fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary, maxWidth: 300 }}>
                  {(c.fix_suggestion_zhTW as string) || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const theme = useTheme();
  const color = status === "pass" ? theme.colors.success : status === "fail" ? theme.colors.error : theme.colors.warning;
  const bg = status === "pass" ? theme.colors.successLight : status === "fail" ? theme.colors.errorLight : theme.colors.warningLight;
  return (
    <span style={{ padding: `${theme.spacing.xs - 2}px ${theme.spacing.sm}px`, borderRadius: theme.radii.md, fontSize: theme.font.sizes.sm, fontWeight: theme.font.weights.semibold, color, background: bg }}>
      {status}
    </span>
  );
}

function EmptyMessage({ icon, title, description }: { icon: string; title: string; description: string }) {
  const theme = useTheme();
  return (
    <div style={{ textAlign: "center", padding: theme.spacing.xxl, color: theme.colors.text.tertiary }}>
      <div style={{ fontSize: 40, marginBottom: theme.spacing.sm }}>{icon}</div>
      <h3 style={{ margin: `0 0 ${theme.spacing.xs}px 0` }}>{title}</h3>
      <p style={{ margin: 0, fontSize: theme.font.sizes.base }}>{description}</p>
    </div>
  );
}
