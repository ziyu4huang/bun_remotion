import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import type { Project, SeriesQualitySnapshot, RegressionAlert, ScoreHistoryPoint, AgentTaskResult } from "../../shared/types";

type ViewMode = "overview" | "detail";

export function Quality() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [comparison, setComparison] = useState<SeriesQualitySnapshot[]>([]);
  const [alerts, setAlerts] = useState<RegressionAlert[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [view, setView] = useState<ViewMode>("overview");
  const [qualityData, setQualityData] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<ScoreHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [gateRunning, setGateRunning] = useState(false);
  const [gateResult, setGateResult] = useState<string | null>(null);

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

  const handleRunQualityGate = async () => {
    if (!selected) return;
    setGateRunning(true);
    setGateResult(null);

    const res = await api.agent.startTask("sg-quality-gate", `Run quality gate check on series "${selected}". Check gate scores, run regression if baseline exists, and provide PASS/WARN/FAIL decision.`);
    if (!res.ok || !res.data) {
      setGateResult(`Error: ${res.error ?? "Failed to start quality gate"}`);
      setGateRunning(false);
      return;
    }

    const poll = setInterval(async () => {
      const status = await api.getJob(res.data!.id);
      if (status.data?.status === "completed" || status.data?.status === "failed") {
        clearInterval(poll);
        if (status.data.status === "completed" && status.data.result) {
          const r = status.data.result as AgentTaskResult;
          setGateResult(r.response || "Quality gate complete (no text response)");
        } else {
          setGateResult(`Quality gate failed: ${status.data.error ?? "unknown error"}`);
        }
        setGateRunning(false);
        load();
      }
    }, 1000);
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

  if (loading) return <div style={{ color: "#666" }}>Loading...</div>;

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
      <h2 style={{ marginBottom: 20 }}>Quality Dashboard</h2>

      {/* Regression alerts banner */}
      {hasRegressions && (
        <div style={{ padding: "12px 16px", background: "#fff3e0", border: "1px solid #ff9800", borderRadius: 8, marginBottom: 16 }}>
          <strong style={{ color: "#e65100" }}>Regression Alerts</strong>
          {regressionAlerts.map((a, i) => (
            <div key={i} style={{ fontSize: 13, color: "#bf360c", marginTop: 4 }}>
              {a.seriesId} — {a.metric}: {a.baseline} → {a.current} ({a.delta > 0 ? "+" : ""}{a.deltaPercent}%)
            </div>
          ))}
        </div>
      )}

      {/* Agent quality gate */}
      {view === "detail" && selected && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={handleRunQualityGate}
            disabled={gateRunning}
            style={{
              padding: "6px 16px",
              border: "1px solid #2e7d32",
              borderRadius: 6,
              background: gateRunning ? "#ccc" : "#2e7d32",
              color: "#fff",
              cursor: gateRunning ? "default" : "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {gateRunning ? "Agent running..." : "Run Agent Quality Gate"}
          </button>
          {gateResult && (
            <div style={{ marginTop: 12, padding: 16, background: "#e8f5e9", borderRadius: 8, border: "1px solid #c8e6c9" }}>
              <h4 style={{ margin: "0 0 8px 0" }}>Quality Gate Report</h4>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.5, margin: 0, fontFamily: "inherit" }}>
                {gateResult}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* View toggle */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => { setView("overview"); setSelected(""); }}
          style={{
            padding: "6px 16px",
            marginRight: 8,
            border: "1px solid #ccc",
            borderRadius: 6,
            background: view === "overview" ? "#1976d2" : "#fff",
            color: view === "overview" ? "#fff" : "#333",
            cursor: "pointer",
          }}
        >Cross-Series</button>
        <button
          onClick={() => setView("detail")}
          style={{
            padding: "6px 16px",
            border: "1px solid #ccc",
            borderRadius: 6,
            background: view === "detail" ? "#1976d2" : "#fff",
            color: view === "detail" ? "#fff" : "#333",
            cursor: "pointer",
          }}
        >Per-Series</button>
      </div>

      {/* Cross-series comparison */}
      {view === "overview" && (
        <div>
          <h3 style={{ marginBottom: 8 }}>Cross-Series Comparison</h3>
          {comparison.length === 0 ? (
            <div style={{ color: "#999" }}>No pipeline data found for any series.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
                  <th style={{ padding: "6px 10px" }}>Series</th>
                  <th style={{ padding: "6px 10px" }}>Gate</th>
                  <th style={{ padding: "6px 10px" }}>Blended</th>
                  <th style={{ padding: "6px 10px" }}>Decision</th>
                  <th style={{ padding: "6px 10px" }}>Trend</th>
                  <th style={{ padding: "6px 10px" }}>Nodes</th>
                  <th style={{ padding: "6px 10px" }}>Edges</th>
                  <th style={{ padding: "6px 10px" }}>Comm.</th>
                  <th style={{ padding: "6px 10px" }}>AI Score</th>
                  <th style={{ padding: "6px 10px" }}>Mode</th>
                  <th style={{ padding: "6px 10px" }}>Genre</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((s) => (
                  <tr
                    key={s.seriesId}
                    style={{ borderBottom: "1px solid #eee", cursor: "pointer" }}
                    onClick={() => { setSelected(s.seriesId); setView("detail"); }}
                  >
                    <td style={{ padding: "6px 10px", fontWeight: 500 }}>{s.seriesId}</td>
                    <td style={{ padding: "6px 10px" }}>
                      <ScoreBadge value={s.gateScore} max={100} />
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      <ScoreBadge value={s.blendedScore} max={100} suffix="%" />
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      <DecisionBadge decision={s.decision} />
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      <TrendBadge trend={s.trend} delta={s.scoreDelta} />
                    </td>
                    <td style={{ padding: "6px 10px" }}>{s.nodeCount}</td>
                    <td style={{ padding: "6px 10px" }}>{s.edgeCount}</td>
                    <td style={{ padding: "6px 10px" }}>{s.communityCount}</td>
                    <td style={{ padding: "6px 10px" }}>{s.aiOverall ?? "—"}</td>
                    <td style={{ padding: "6px 10px", fontSize: 11 }}>{s.generatorMode ?? "—"}</td>
                    <td style={{ padding: "6px 10px", fontSize: 11 }}>{s.genre ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Regression summary */}
          {alerts.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ marginBottom: 8 }}>Regression Status</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
                    <th style={{ padding: "6px 10px" }}>Series</th>
                    <th style={{ padding: "6px 10px" }}>Metric</th>
                    <th style={{ padding: "6px 10px" }}>Baseline</th>
                    <th style={{ padding: "6px 10px" }}>Current</th>
                    <th style={{ padding: "6px 10px" }}>Delta</th>
                    <th style={{ padding: "6px 10px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "6px 10px" }}>{a.seriesId}</td>
                      <td style={{ padding: "6px 10px" }}>{a.metric}</td>
                      <td style={{ padding: "6px 10px" }}>{a.baseline}</td>
                      <td style={{ padding: "6px 10px" }}>{a.current}</td>
                      <td style={{ padding: "6px 10px", color: a.delta < 0 ? "#d32f2f" : "#2e7d32" }}>
                        {a.delta > 0 ? "+" : ""}{a.deltaPercent}%
                      </td>
                      <td style={{ padding: "6px 10px" }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          color: a.isRegression ? "#d32f2f" : "#2e7d32",
                          background: a.isRegression ? "#ffebee" : "#e8f5e9",
                        }}>
                          {a.isRegression ? "REGRESSED" : "OK"}
                        </span>
                      </td>
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
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", minWidth: 200, marginBottom: 20 }}
          >
            <option value="">Select series...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {!selected && <div style={{ color: "#999" }}>Select a series to view quality details.</div>}

          {qualityData && (
            <div>
              {/* Score summary */}
              <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <ScoreCard label="Gate Score" value={gate?.score as number} max={100} />
                <ScoreCard label="Blended" value={blended ? Math.round((blended.overall as number) * 1000) / 10 : undefined} max={100} suffix="%" />
                <ScoreCard label="Decision" value={gate?.decision as string} />
                <ScoreCard label="AI Overall" value={aiData?.overall as number} max={10} />
              </div>

              {/* Score history */}
              {history.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ marginBottom: 8 }}>Score History</h3>
                  <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 80 }}>
                    {history.map((h) => (
                      <div key={h.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                        <div
                          style={{
                            width: "100%",
                            maxWidth: 40,
                            height: `${Math.max(h.gateScore, 2)}%`,
                            background: h.gateScore >= 70 ? "#4caf50" : h.gateScore >= 40 ? "#ff9800" : "#f44336",
                            borderRadius: "2px 2px 0 0",
                            minHeight: 2,
                          }}
                          title={`Gate: ${h.gateScore}${h.blendedScore != null ? ` / Blended: ${h.blendedScore}%` : ""}`}
                        />
                        <div style={{ fontSize: 9, color: "#999", marginTop: 2 }}>
                          {h.date.slice(4, 6)}/{h.date.slice(6, 8)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                    {history.map((h) => (
                      <span key={h.date} style={{ marginRight: 12 }}>
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
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ marginBottom: 8 }}>AI Quality Dimensions</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                    {Object.entries(aiDimensions).map(([key, value]) => (
                      <div key={key} style={{ padding: "8px 12px", background: "#f5f5f5", borderRadius: 6 }}>
                        <div style={{ fontSize: 12, color: "#666" }}>{formatDimensionName(key)}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 18, fontWeight: 600, color: value >= 7 ? "#2e7d32" : value >= 5 ? "#f57c00" : "#d32f2f" }}>
                            {value}
                          </div>
                          <div style={{ flex: 1, height: 4, background: "#e0e0e0", borderRadius: 2 }}>
                            <div style={{ width: `${value * 10}%`, height: "100%", background: value >= 7 ? "#4caf50" : value >= 5 ? "#ff9800" : "#f44336", borderRadius: 2 }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality breakdown */}
              {breakdown && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ marginBottom: 8 }}>Quality Breakdown</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                    {Object.entries(breakdown).map(([key, value]) => (
                      <div key={key} style={{ padding: "8px 12px", background: "#f5f5f5", borderRadius: 6 }}>
                        <div style={{ fontSize: 12, color: "#666" }}>{formatDimensionName(key)}</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: value == null ? "#999" : (value * 100) >= 70 ? "#2e7d32" : (value * 100) >= 40 ? "#f57c00" : "#d32f2f" }}>
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
                  <h3 style={{ marginBottom: 8 }}>Gate Checks ({checks.length})</h3>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
                        <th style={{ padding: "6px 10px" }}>Check</th>
                        <th style={{ padding: "6px 10px" }}>Status</th>
                        <th style={{ padding: "6px 10px" }}>Impact</th>
                        <th style={{ padding: "6px 10px" }}>Fix Suggestion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checks.map((c, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "6px 10px" }}>{c.name as string}</td>
                          <td style={{ padding: "6px 10px" }}>
                            <StatusBadge status={c.status as string} />
                          </td>
                          <td style={{ padding: "6px 10px" }}>{(c.score_impact as number) > 0 ? `-${c.score_impact}` : "—"}</td>
                          <td style={{ padding: "6px 10px", fontSize: 12, color: "#666", maxWidth: 300 }}>
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
            <div style={{ color: "#999", fontStyle: "italic" }}>No pipeline data found for this series.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Components ──

function ScoreCard({ label, value, max, suffix }: { label: string; value?: number | string; max?: number; suffix?: string }) {
  const display = value === undefined ? "—" : typeof value === "number" ? (suffix ? `${value}${suffix}` : `${value}/${max}`) : value;
  const color = typeof value === "number" && max ? (value >= max * 0.7 ? "#2e7d32" : value >= max * 0.4 ? "#f57c00" : "#d32f2f") : "#333";

  return (
    <div style={{ padding: 16, background: "#f5f5f5", borderRadius: 8, minWidth: 120, textAlign: "center" }}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{display}</div>
    </div>
  );
}

function ScoreBadge({ value, max, suffix }: { value: number | null; max: number; suffix?: string }) {
  if (value == null) return <span style={{ color: "#999" }}>—</span>;
  const color = value >= max * 0.7 ? "#2e7d32" : value >= max * 0.4 ? "#f57c00" : "#d32f2f";
  return <span style={{ fontWeight: 600, color }}>{suffix ? `${value}${suffix}` : value}</span>;
}

function DecisionBadge({ decision }: { decision: string | null }) {
  if (!decision) return <span style={{ color: "#999" }}>—</span>;
  if (decision === "ACCEPT" || decision === "PASS") return <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: "#2e7d32", background: "#e8f5e9" }}>{decision}</span>;
  if (decision === "REJECT" || decision === "FAIL") return <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: "#d32f2f", background: "#ffebee" }}>{decision}</span>;
  if (decision === "WARN") return <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: "#f57c00", background: "#fff3e0" }}>{decision}</span>;
  return <span style={{ color: "#999" }}>{decision}</span>;
}

function TrendBadge({ trend, delta }: { trend: string; delta: number | null }) {
  const icons: Record<string, string> = { improving: "\u2191", stable: "\u2192", declining: "\u2193", new: "?" };
  const colors: Record<string, string> = { improving: "#2e7d32", stable: "#666", declining: "#d32f2f", new: "#1976d2" };
  return (
    <span style={{ color: colors[trend] || "#666" }}>
      {icons[trend] || "?"} {delta != null ? (delta > 0 ? `+${delta}` : `${delta}`) : ""}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    PASS: { color: "#2e7d32", bg: "#e8f5e9" },
    FAIL: { color: "#d32f2f", bg: "#ffebee" },
    WARN: { color: "#f57c00", bg: "#fff3e0" },
    SKIP: { color: "#666", bg: "#f5f5f5" },
  };
  const c = config[status] || { color: "#666", bg: "#f5f5f5" };
  return (
    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: c.color, background: c.bg }}>
      {status}
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
