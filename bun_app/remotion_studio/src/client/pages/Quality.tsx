import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { PageHeader, LoadingSpinner, EmptyState, StatusBadge } from "../components";
import { useTheme, scoreColor } from "../theme";
import { useI18n } from "../i18n";
import type { Project, SeriesQualitySnapshot, RegressionAlert, ScoreHistoryPoint, AgentTaskResult } from "../../shared/types";

type ViewMode = "overview" | "detail";

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
  const [agentTask, setAgentTask] = useState<{ jobId: string; status: string; result: string | null } | null>(null);

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
      const res = await api.agent.startTask("sg-quality-gate", prompt);
      if (!res.ok || !res.data) {
        setAgentTask({ jobId: "", status: "error", result: res.error ?? "Failed to start agent" });
        return;
      }
      setAgentTask({ jobId: res.data.id, status: "running", result: null });

      const TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
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
  const checks = gate?.checks as Array<Record<string, unknown>> | undefined;
  const breakdown = gate?.quality_breakdown as Record<string, number | null> | undefined;
  const blended = qualityScore?.blended as Record<string, unknown> | undefined;
  const aiData = qualityScore?.ai as Record<string, unknown> | undefined;
  const aiDimensions = aiData?.dimensions as Record<string, number> | undefined;

  const regressionAlerts = alerts.filter((a) => a.isRegression);
  const hasRegressions = regressionAlerts.length > 0;

  return (
    <div>
      <PageHeader title={t.quality.title} description={t.quality.description} />

      {/* Ask agent section */}
      <div style={{ marginBottom: theme.spacing.xl, padding: theme.spacing.lg, background: theme.colors.bg.muted, borderRadius: theme.radii.xl }}>
        <h3 style={{ margin: `0 0 ${theme.spacing.sm}px 0` }}>Ask Quality Agent</h3>
        <p style={{ margin: `0 0 ${theme.spacing.md}px 0`, color: theme.colors.text.secondary, fontSize: theme.font.sizes.base }}>
          The agent analyzes quality data, explains scores, checks regressions, and suggests improvements.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: theme.spacing.sm }}>
          <AgentPromptButton
            label="How's my overall quality?"
            prompt="Review the overall quality across all series. Highlight any regressions, low scores, or areas needing attention. Give a brief summary."
            onClick={handleAskAgent}
            theme={theme}
          />
          {hasRegressions && (
            <AgentPromptButton
              label={`Investigate ${regressionAlerts.length} regression(s)`}
              prompt={`I see regression alerts for: ${regressionAlerts.map(a => `${a.seriesId} (${a.metric}: ${a.baseline} → ${a.current})`).join(", ")}. Investigate each regression — explain what changed and why, and suggest fixes.`}
              onClick={handleAskAgent}
              theme={theme}
              variant="warning"
            />
          )}
          {selected && (
            <AgentPromptButton
              label={`Analyze ${selected}`}
              prompt={`Analyze the quality of series "${selected}" in detail. Explain the gate score, check results, AI dimensions, and any issues. Suggest specific improvements.`}
              onClick={handleAskAgent}
              theme={theme}
            />
          )}
          {selected && (
            <AgentPromptButton
              label="Run full quality gate"
              prompt={`Run a full quality gate check on series "${selected}". Check gate scores, run regression if baseline exists, and provide PASS/WARN/FAIL decision with explanations.`}
              onClick={handleAskAgent}
              theme={theme}
              variant="primary"
            />
          )}
        </div>

        {/* Agent response */}
        {agentTask && (
          <div style={{ marginTop: theme.spacing.md }}>
            {agentTask.status === "running" && (
              <div style={{ padding: theme.spacing.md, background: theme.colors.bg.page, borderRadius: theme.radii.lg, fontStyle: "italic", color: theme.colors.text.tertiary }}>
                Agent analyzing...
              </div>
            )}
            {agentTask.status === "done" && agentTask.result && (
              <div style={{ padding: theme.spacing.lg, background: theme.colors.successLight, borderRadius: theme.radii.xl, border: `1px solid ${theme.colors.successLight}` }}>
                <h4 style={{ margin: `0 0 ${theme.spacing.sm}px 0` }}>{t.quality.qualityGateReport}</h4>
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
      </div>

      {/* Regression alerts banner */}
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
        <button
          onClick={() => { setView("overview"); setSelected(""); }}
          style={{
            padding: `${theme.spacing.xs + 2}px ${theme.spacing.lg}px`,
            marginRight: theme.spacing.sm,
            border: `1px solid ${theme.colors.border.medium}`,
            borderRadius: theme.radii.lg,
            background: view === "overview" ? theme.colors.primary : theme.colors.bg.page,
            color: view === "overview" ? theme.colors.bg.page : theme.colors.text.primary,
            cursor: "pointer",
          }}
        >{t.quality.crossSeries}</button>
        <button
          onClick={() => setView("detail")}
          style={{
            padding: `${theme.spacing.xs + 2}px ${theme.spacing.lg}px`,
            border: `1px solid ${theme.colors.border.medium}`,
            borderRadius: theme.radii.lg,
            background: view === "detail" ? theme.colors.primary : theme.colors.bg.page,
            color: view === "detail" ? theme.colors.bg.page : theme.colors.text.primary,
            cursor: "pointer",
          }}
        >{t.quality.perSeries}</button>
      </div>

      {/* Cross-series comparison */}
      {view === "overview" && (
        <div>
          <h3 style={{ marginBottom: theme.spacing.sm }}>{t.quality.crossSeriesComparison}</h3>
          {comparison.length === 0 ? (
            <EmptyState icon="📊" title={t.quality.noPipelineData} description={t.quality.noPipelineDataDesc} />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.base }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.colors.border.default}`, textAlign: "left" }}>
                  <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>Series</th>
                  <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>Gate</th>
                  <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>Blended</th>
                  <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>Decision</th>
                  <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>Trend</th>
                  <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>Nodes</th>
                  <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>Edges</th>
                  <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>Comm.</th>
                  <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>AI Score</th>
                  <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>Mode</th>
                  <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>Genre</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((s) => (
                  <tr
                    key={s.seriesId}
                    style={{ borderBottom: `1px solid ${theme.colors.border.light}`, cursor: "pointer" }}
                    onClick={() => { setSelected(s.seriesId); setView("detail"); }}
                  >
                    <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px`, fontWeight: theme.font.weights.medium }}>{s.seriesId}</td>
                    <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>
                      <ScoreBadge value={s.gateScore} max={100} />
                    </td>
                    <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>
                      <ScoreBadge value={s.blendedScore} max={100} suffix="%" />
                    </td>
                    <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>
                      <DecisionBadge decision={s.decision} />
                    </td>
                    <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>
                      <TrendBadge trend={s.trend} delta={s.scoreDelta} />
                    </td>
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
          )}
        </div>
      )}

      {/* Per-series detail */}
      {view === "detail" && (
        <div>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, fontSize: theme.font.sizes.md, borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border.medium}`, minWidth: 200, marginBottom: theme.spacing.xl }}
          >
            <option value="">{t.quality.selectSeries}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {!selected && <EmptyState icon="📋" title={t.quality.selectSeries} description={t.quality.selectSeriesDesc} />}

          {qualityData && (
            <div>
              {/* Score summary */}
              <div style={{ display: "flex", gap: theme.spacing.lg, marginBottom: theme.spacing.xxl }}>
                <ScoreCard label="Gate Score" value={gate?.score as number} max={100} />
                <ScoreCard label="Blended" value={blended ? Math.round((blended.overall as number) * 1000) / 10 : undefined} max={100} suffix="%" />
                <ScoreCard label="Decision" value={gate?.decision as string} />
                <ScoreCard label="AI Overall" value={aiData?.overall as number} max={10} />
              </div>

              {/* Score history */}
              {history.length > 0 && (
                <div style={{ marginBottom: theme.spacing.xxl }}>
                  <h3 style={{ marginBottom: theme.spacing.sm }}>{t.quality.scoreHistory}</h3>
                  <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 80 }}>
                    {history.map((h) => (
                      <div key={h.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                        <div
                          style={{
                            width: "100%",
                            maxWidth: 40,
                            height: `${Math.max(h.gateScore, 2)}%`,
                            background: scoreColor(h.gateScore, 100, theme),
                            borderRadius: "2px 2px 0 0",
                            minHeight: 2,
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
              )}

              {/* AI dimensions */}
              {aiDimensions && (
                <div style={{ marginBottom: theme.spacing.xxl }}>
                  <h3 style={{ marginBottom: theme.spacing.sm }}>{t.quality.aiQualityDimensions}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: theme.spacing.sm }}>
                    {Object.entries(aiDimensions).map(([key, value]) => (
                      <div key={key} style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, background: theme.colors.bg.muted, borderRadius: theme.radii.lg }}>
                        <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary }}>{formatDimensionName(key)}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
                          <div style={{ fontSize: theme.font.sizes.xl, fontWeight: theme.font.weights.semibold, color: scoreColor(value, 10, theme) }}>
                            {value}
                          </div>
                          <div style={{ flex: 1, height: 4, background: theme.colors.border.default, borderRadius: 2 }}>
                            <div style={{ width: `${value * 10}%`, height: "100%", background: scoreColor(value, 10, theme), borderRadius: 2 }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality breakdown */}
              {breakdown && (
                <div style={{ marginBottom: theme.spacing.xxl }}>
                  <h3 style={{ marginBottom: theme.spacing.sm }}>{t.quality.qualityBreakdown}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: theme.spacing.sm }}>
                    {Object.entries(breakdown).map(([key, value]) => (
                      <div key={key} style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, background: theme.colors.bg.muted, borderRadius: theme.radii.lg }}>
                        <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary }}>{formatDimensionName(key)}</div>
                        <div style={{ fontSize: theme.font.sizes.xl, fontWeight: theme.font.weights.semibold, color: value == null ? theme.colors.text.muted : scoreColor(value * 100, 100, theme) }}>
                          {value == null ? "N/A" : `${(value * 100).toFixed(0)}%`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checks table */}
              {checks && checks.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: theme.spacing.sm }}>{t.quality.gateChecks} ({checks.length})</h3>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.base }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${theme.colors.border.default}`, textAlign: "left" }}>
                        <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>{t.quality.check}</th>
                        <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>{t.quality.status}</th>
                        <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>{t.quality.impact}</th>
                        <th style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>{t.quality.fixSuggestion}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checks.map((c, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
                          <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>{c.name as string}</td>
                          <td style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px` }}>
                            <StatusBadge status={c.status as string} />
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
              )}
            </div>
          )}

          {selected && !qualityData && (
            <EmptyState icon="🔍" title={t.quality.noPipelineData} description={t.quality.noPipelineDataDetail} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Components ──

function AgentPromptButton({ label, prompt, onClick, theme, variant }: {
  label: string;
  prompt: string;
  onClick: (prompt: string) => void;
  theme: ReturnType<typeof useTheme>;
  variant?: "primary" | "warning";
}) {
  const bg = variant === "warning" ? theme.colors.warning
    : variant === "primary" ? theme.colors.primary
    : theme.colors.bg.page;
  const fg = variant ? theme.colors.bg.page : theme.colors.text.primary;
  const border = variant ? "none" : `1px solid ${theme.colors.border.medium}`;

  return (
    <button
      onClick={() => onClick(prompt)}
      style={{
        padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
        border,
        borderRadius: theme.radii.lg,
        background: bg,
        color: fg,
        cursor: "pointer",
        fontSize: theme.font.sizes.base,
        fontWeight: variant ? theme.font.weights.semibold : theme.font.weights.normal,
      }}
    >
      {label}
    </button>
  );
}

function ScoreCard({ label, value, max, suffix }: { label: string; value?: number | string; max?: number; suffix?: string }) {
  const theme = useTheme();
  const display = value === undefined ? "—" : typeof value === "number" ? (suffix ? `${value}${suffix}` : `${value}/${max}`) : value;
  const color = typeof value === "number" && max ? scoreColor(value, max, theme) : theme.colors.text.primary;

  return (
    <div style={{ padding: theme.spacing.lg, background: theme.colors.bg.muted, borderRadius: theme.radii.xl, minWidth: 120, textAlign: "center" }}>
      <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary, marginBottom: theme.spacing.xs }}>{label}</div>
      <div style={{ fontSize: theme.font.sizes.xxl, fontWeight: theme.font.weights.bold, color }}>{display}</div>
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

function formatDimensionName(key: string): string {
  const names: Record<string, string> = {
    entity_accuracy: "Entity Accuracy",
    relationship_correctness: "Relationship Correctness",
    completeness: "Completeness",
    cross_episode_coherence: "Cross-Episode Coherence",
    actionability: "Actionability",
    consistency: "Consistency",
    arc_structure: "Arc Structure",
    pacing: "Pacing",
    character_growth: "Character Growth",
    thematic_coherence: "Thematic Coherence",
    gag_evolution: "Gag Evolution",
  };
  return names[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
