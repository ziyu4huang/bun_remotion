import { useState, useEffect } from "react";
import { api } from "../api";
import { Button, EmptyState } from "../components";
import { useTheme, scoreColor } from "../theme";
import { useI18n } from "../i18n";
import type { Project, ContinuityIssue, ContinuityReport as ContinuityReportType } from "../../shared/types";

interface Props {
  projects: Project[];
}

const SEVERITY_STYLES = {
  error: { bg: "errorLight", color: "error", border: "error" },
  warning: { bg: "warningLight", color: "warningDark", border: "warning" },
  info: { bg: "primaryLight", color: "primary", border: "primary" },
} as const;

export function ContinuityReport({ projects }: Props) {
  const theme = useTheme();
  const { t } = useI18n();
  const [seriesId, setSeriesId] = useState("");
  const [report, setReport] = useState<ContinuityReportType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!seriesId) { setReport(null); return; }
    setLoading(true);
    api.getContinuityReport(seriesId).then((res) => {
      if (res.data) setReport(res.data);
      else setReport(null);
    }).finally(() => setLoading(false));
  }, [seriesId]);

  const ct = t.continuity;

  return (
    <div>
      <h3 style={{ marginBottom: theme.spacing.md }}>{ct.continuityDesc}</h3>

      {/* Series selector */}
      <div style={{ marginBottom: theme.spacing.lg, display: "flex", gap: theme.spacing.sm, alignItems: "center" }}>
        <select
          aria-label={ct.selectSeries}
          value={seriesId}
          onChange={(e) => setSeriesId(e.target.value)}
          style={{
            padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
            borderRadius: theme.radii.md,
            border: `1px solid ${theme.colors.border.default}`,
            fontSize: theme.font.sizes.base,
            background: theme.colors.background.paper,
            color: theme.colors.text.primary,
            minWidth: 200,
          }}
        >
          <option value="">{ct.selectSeries}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.id}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div style={{ color: theme.colors.text.muted, padding: theme.spacing.md }}>
          {ct.checking}
        </div>
      )}

      {!loading && seriesId && report && report.episodeCount === 0 && (
        <EmptyState icon="📭" title={ct.noData} description="" />
      )}

      {!loading && report && report.episodeCount > 0 && (
        <div>
          {/* Summary */}
          <div style={{
            display: "flex",
            gap: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
            padding: theme.spacing.md,
            background: theme.colors.background.paper,
            borderRadius: theme.radii.xl,
            border: `1px solid ${theme.colors.border.light}`,
          }}>
            <SummaryCard label={ct.episodeCount} value={report.episodeCount} theme={theme} />
            <SummaryCard label={ct.issueCount} value={report.issues.length} theme={theme} highlight={report.issues.length > 0} />
          </div>

          {report.issues.length === 0 ? (
            <EmptyState icon="✅" title={ct.noIssues} description="" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.md }}>
              {report.issues.map((issue, i) => (
                <IssueCard key={i} issue={issue} theme={theme} ct={ct} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, theme, highlight }: {
  label: string;
  value: number;
  theme: ReturnType<typeof useTheme>;
  highlight?: boolean;
}) {
  return (
    <div style={{ textAlign: "center", minWidth: 80 }}>
      <div style={{ fontSize: theme.font.sizes["2xl"], fontWeight: theme.font.weights.bold, color: highlight ? theme.colors.warning : theme.colors.text.primary }}>
        {value}
      </div>
      <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted, marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

function IssueCard({ issue, theme, ct }: {
  issue: ContinuityIssue;
  theme: ReturnType<typeof useTheme>;
  ct: Record<string, any>;
}) {
  const styles = SEVERITY_STYLES[issue.severity];
  const kindLabel = ct.kindLabels?.[issue.kind] ?? issue.kind;
  const sevLabel = ct.severityLabels?.[issue.severity] ?? issue.severity;

  return (
    <div style={{
      padding: theme.spacing.md,
      background: theme.colors[styles.bg],
      border: `1px solid ${theme.colors[styles.border]}`,
      borderRadius: theme.radii.xl,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
        <span style={{
          padding: `${theme.spacing.xs - 2}px ${theme.spacing.sm}px`,
          borderRadius: theme.radii.md,
          fontSize: theme.font.sizes.xs,
          fontWeight: theme.font.weights.semibold,
          color: theme.colors[styles.color],
          background: theme.colors.background.paper,
        }}>
          {sevLabel}
        </span>
        <span style={{
          padding: `${theme.spacing.xs - 2}px ${theme.spacing.sm}px`,
          borderRadius: theme.radii.md,
          fontSize: theme.font.sizes.xs,
          fontWeight: theme.font.weights.medium,
          color: theme.colors.text.secondary,
          background: theme.colors.background.paper,
        }}>
          {kindLabel}
        </span>
        <span style={{ fontWeight: theme.font.weights.medium, color: theme.colors.text.primary }}>
          {issue.subject}
        </span>
      </div>

      {/* Detail */}
      <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary, marginBottom: theme.spacing.xs }}>
        {issue.detail}
      </div>

      {/* Episodes */}
      {issue.episodes.length > 0 && (
        <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted, marginBottom: theme.spacing.xs }}>
          <strong>{ct.affectedEpisodes}:</strong> {issue.episodes.join(", ")}
        </div>
      )}

      {/* Suggestion */}
      <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors[styles.color], fontStyle: "italic" }}>
        {ct.suggestion}: {issue.suggestion}
      </div>
    </div>
  );
}
