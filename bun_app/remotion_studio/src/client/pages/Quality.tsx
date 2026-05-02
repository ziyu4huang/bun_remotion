import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { PageHeader, LoadingSpinner, EmptyState, Button } from "../components";
import { QualityAskAgent } from "../components/QualityAskAgent";
import { QualityDimensions } from "../components/QualityDimensions";
import { QualityDetail } from "../components/QualityDetail";
import { useTheme, scoreColor } from "../theme";
import { useI18n } from "../i18n";
import { loadApiKeyWithEnvKey } from "./Settings";
import type { Project, SeriesQualitySnapshot, RegressionAlert, ScoreHistoryPoint, AgentTaskResult } from "../../shared/types";

type ViewMode = "overview" | "detail";

interface AgentTaskState {
  jobId: string;
  status: string;
  result: string | null;
}

export function Quality() {
  const theme = useTheme();
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [comparison, setComparison] = useState<SeriesQualitySnapshot[]>([]);
  const [alerts, setAlerts] = useState<RegressionAlert[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [view, setView] = useState<ViewMode>("overview");
  const [qualityData, setQualityData] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<ScoreHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentTask, setAgentTask] = useState<AgentTaskState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [projRes, compRes, alertRes] = await Promise.all([
      api.listProjects(),
      api.getQualityComparison(),
      api.getRegressionAlerts(),
    ]);
    if (projRes.data) setProjects(projRes.data);
    if (compRes.data) setComparison(compRes.data);
    if (alertRes.data) setAlerts(alertRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAskAgent = async (prompt: string) => {
    setAgentTask({ jobId: "", status: "starting", result: null });
    try {
      const { apiKey, envKey } = loadApiKeyWithEnvKey();
      const res = await api.agent.startTask("sg-quality-gate", prompt, undefined, apiKey || undefined, envKey);
      if (!res.ok || !res.data) {
        setAgentTask({ jobId: "", status: "error", result: res.error ?? "Failed to start agent" });
        return;
      }
      setAgentTask({ jobId: res.data.id, status: "running", result: null });

      const TIMEOUT_MS = 3 * 60 * 1000;
      const startTime = Date.now();
      const poll = setInterval(async () => {
        if (Date.now() - startTime > TIMEOUT_MS) {
          clearInterval(poll);
          setAgentTask({ jobId: res.data!.id, status: "error", result: "Agent timed out after 3 minutes. The GLM API may be slow or unresponsive." });
          return;
        }
        try {
          const status = await api.getJob(res.data!.id);
          if (status.data?.status === "completed" || status.data?.status === "failed") {
            clearInterval(poll);
            if (status.data.status === "completed" && status.data.result) {
              const r = status.data.result as AgentTaskResult;
              setAgentTask({ jobId: res.data!.id, status: "done", result: r.response });
            } else {
              setAgentTask({ jobId: res.data!.id, status: "error", result: status.data.error ?? "Agent failed" });
            }
            load();
          }
        } catch {
          clearInterval(poll);
          setAgentTask({ jobId: res.data!.id, status: "error", result: "Network error while polling agent status." });
        }
      }, 2000);
    } catch {
      setAgentTask({ jobId: "", status: "error", result: "Failed to connect to agent. Is the server running?" });
    }
  };

  useEffect(() => {
    if (!selected) { setQualityData(null); setHistory([]); return; }
    Promise.all([
      api.getQuality(selected),
      api.getScoreHistory(selected),
    ]).then(([qRes, hRes]) => {
      setQualityData(qRes.ok ? (qRes.data ?? null) : null);
      setHistory(hRes.ok && hRes.data ? hRes.data : []);
    });
  }, [selected]);

  if (loading) return <LoadingSpinner text={t.quality.description} />;

  const gate = qualityData?.gate as Record<string, unknown> | undefined;
  const qualityScore = qualityData?.qualityScore as Record<string, unknown> | undefined;
  const breakdown = gate?.quality_breakdown as Record<string, number | null> | undefined;
  const aiData = qualityScore?.ai as Record<string, unknown> | undefined;
  const aiDimensions = aiData?.dimensions as Record<string, number> | undefined;

  const regressionAlerts = alerts.filter((a) => a.isRegression);
  const hasRegressions = regressionAlerts.length > 0;

  return (
    <div>
      <PageHeader title={t.quality.title} description={t.quality.description} />

      <QualityAskAgent
        agentTask={agentTask}
        hasRegressions={hasRegressions}
        regressionCount={regressionAlerts.length}
        regressionSummary={regressionAlerts.map(a => `${a.seriesId} (${a.metric}: ${a.baseline} → ${a.current})`).join(", ")}
        selected={selected}
        onAsk={handleAskAgent}
      />

      {hasRegressions && (
        <div style={{ padding: `${theme.spacing.md}px ${theme.spacing.lg}px`, background: theme.colors.warningLight, border: `1px solid ${theme.colors.warning}`, borderRadius: theme.radii.xl, marginBottom: theme.spacing.lg }}>
          <strong style={{ color: theme.colors.warningDark }}>{t.quality.regressionAlerts}</strong>
          {regressionAlerts.map((a, i) => (
            <div key={i} style={{ fontSize: theme.font.sizes.base, color: theme.colors.errorDark, marginTop: theme.spacing.xs }}>
              {a.seriesId} — {a.metric}: {a.baseline} → {a.current} ({a.delta > 0 ? "+" : ""}{a.deltaPercent}%)
            </div>
          ))}
        </div>
      )}

      {/* View toggle */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <Button variant={view === "overview" ? "primary" : "outline"} size="sm" onClick={() => { setView("overview"); setSelected(""); }} style={{ marginRight: theme.spacing.sm }}>{t.quality.crossSeries}</Button>
        <Button variant={view === "detail" ? "primary" : "outline"} size="sm" onClick={() => setView("detail")}>{t.quality.perSeries}</Button>
      </div>

      {/* Cross-series comparison */}
      {view === "overview" && (
        <div>
          <h3 style={{ marginBottom: theme.spacing.sm }}>{t.quality.crossSeriesComparison}</h3>
          {comparison.length === 0 ? (
            <EmptyState icon="📊" title={t.quality.noPipelineData} description={t.quality.noPipelineDataDesc} />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.base }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${theme.colors.border.default}`, textAlign: "left" }}>
                    {["Series", "Gate", "Blended", "Decision", "Trend", "Nodes", "Edges", "Comm.", "AI Score", "Mode", "Genre"].map((h) => (
                      <th key={h} style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((s) => (
                    <tr key={s.seriesId} style={{ borderBottom: `1px solid ${theme.colors.border.light}`, cursor: "pointer" }} onClick={() => { setSelected(s.seriesId); setView("detail"); }}>
                      <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px`, fontWeight: theme.font.weights.medium }}>{s.seriesId}</td>
                      <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}><ScoreBadge value={s.gateScore} max={100} /></td>
                      <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}><ScoreBadge value={s.blendedScore} max={100} suffix="%" /></td>
                      <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}><DecisionBadge decision={s.decision} /></td>
                      <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}><TrendBadge trend={s.trend} delta={s.scoreDelta} /></td>
                      <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>{s.nodeCount}</td>
                      <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>{s.edgeCount}</td>
                      <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>{s.communityCount}</td>
                      <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>{s.aiOverall ?? "—"}</td>
                      <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px`, fontSize: theme.font.sizes.sm }}>{s.generatorMode ?? "—"}</td>
                      <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px`, fontSize: theme.font.sizes.sm }}>{s.genre ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Per-series detail */}
      {view === "detail" && (
        <div>
          <QualityDetail
            selected={selected}
            projects={projects}
            qualityData={qualityData}
            history={history}
            onSelect={setSelected}
            scoreHistoryLabel={t.quality.scoreHistory}
            gateChecksLabel={t.quality.gateChecks}
            selectSeriesLabel={t.quality.selectSeries}
            selectSeriesDesc={t.quality.selectSeriesDesc}
            noDataIcon="🔍"
            noDataTitle={t.quality.noPipelineData}
            noDataDesc={t.quality.noPipelineDataDetail}
          />
          {qualityData && <QualityDimensions aiDimensions={aiDimensions} breakdown={breakdown} />}
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ value, max, suffix }: { value: number | null; max: number; suffix?: string }) {
  const theme = useTheme();
  if (value == null) return <span style={{ color: theme.colors.text.muted }}>—</span>;
  const color = scoreColor(value, max, theme);
  return <span style={{ fontWeight: theme.font.weights.semibold, color }}>{suffix ? `${value}${suffix}` : value}</span>;
}

function DecisionBadge({ decision }: { decision: string | null }) {
  const theme = useTheme();
  if (!decision) return <span style={{ color: theme.colors.text.muted }}>—</span>;
  if (decision === "ACCEPT" || decision === "PASS") return <span style={{ padding: `${theme.spacing.xs - 2}px ${theme.spacing.sm}px`, borderRadius: theme.radii.md, fontSize: theme.font.sizes.sm, fontWeight: theme.font.weights.semibold, color: theme.colors.success, background: theme.colors.successLight }}>{decision}</span>;
  if (decision === "REJECT" || decision === "FAIL") return <span style={{ padding: `${theme.spacing.xs - 2}px ${theme.spacing.sm}px`, borderRadius: theme.radii.md, fontSize: theme.font.sizes.sm, fontWeight: theme.font.weights.semibold, color: theme.colors.error, background: theme.colors.errorLight }}>{decision}</span>;
  if (decision === "WARN") return <span style={{ padding: `${theme.spacing.xs - 2}px ${theme.spacing.sm}px`, borderRadius: theme.radii.md, fontSize: theme.font.sizes.sm, fontWeight: theme.font.weights.semibold, color: theme.colors.warning, background: theme.colors.warningLight }}>{decision}</span>;
  return <span style={{ color: theme.colors.text.muted }}>{decision}</span>;
}

function TrendBadge({ trend, delta }: { trend: string; delta: number | null }) {
  const theme = useTheme();
  const icons: Record<string, string> = { improving: "↑", stable: "→", declining: "↓", new: "?" };
  const colors: Record<string, string> = { improving: theme.colors.success, stable: theme.colors.text.tertiary, declining: theme.colors.error, new: theme.colors.primary };
  return (
    <span style={{ color: colors[trend] || theme.colors.text.tertiary }}>
      {icons[trend] || "?"} {delta != null ? (delta > 0 ? `+${delta}` : `${delta}`) : ""}
    </span>
  );
}
