import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import type { Project, Job, BaselineInfo, BenchmarkResult } from "../../shared/types";

type Mode = "regex" | "hybrid" | "ai";

export function Benchmark() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [baselines, setBaselines] = useState<BaselineInfo[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [mode, setMode] = useState<Mode>("hybrid");
  const [threshold, setThreshold] = useState(10);
  const [agentMode, setAgentMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [lastResult, setLastResult] = useState<BenchmarkResult | null>(null);
  const [agentReport, setAgentReport] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [projRes, baseRes] = await Promise.all([
      api.listProjects(),
      api.benchmark.listBaselines(),
    ]);
    if (projRes.data) setProjects(projRes.data);
    if (baseRes.data) setBaselines(baseRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRunFull = async () => {
    if (!selected) return;
    setProgress(0);
    setProgressMsg("");
    setJob(null);
    setLastResult(null);
    setAgentReport(null);

    const res = await api.benchmark.run(selected, mode, threshold, agentMode);
    if (!res.ok || !res.data) { alert(res.error ?? "Failed to start benchmark"); return; }

    setJob(res.data);
    api.streamJob(res.data.id, (p) => {
      setProgress(p.progress);
      if (p.message) setProgressMsg(p.message);
    });

    const poll = setInterval(async () => {
      const status = await api.getJob(res.data.id);
      if (status.data?.status === "completed" || status.data?.status === "failed") {
        clearInterval(poll);
        setJob(status.data);
        if (status.data.status === "completed" && status.data.result) {
          const result = status.data.result as BenchmarkResult;
          setLastResult(result);
          if (result.agentReport) setAgentReport(result.agentReport);
        }
        load();
      }
    }, 1000);
  };

  const handleRegression = async () => {
    if (!selected) return;
    const res = await api.benchmark.regression(selected, threshold);
    if (res.ok && res.data) setLastResult(res.data);
    else alert(res.error ?? "Regression check failed");
  };

  const handleUpdateBaseline = async (seriesId: string) => {
    const res = await api.benchmark.updateBaseline(seriesId);
    if (res.ok) load();
    else alert(res.error ?? "Failed to update baseline");
  };

  if (loading) return <div style={{ color: "#666" }}>Loading...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Benchmark</h2>

      {/* Controls */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select series...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} style={selectStyle}>
          <option value="hybrid">Hybrid</option>
          <option value="regex">Regex</option>
          <option value="ai">AI only</option>
        </select>

        <label style={{ fontSize: 14 }}>
          Threshold:
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            style={{ ...selectStyle, width: 60, marginLeft: 4 }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={agentMode} onChange={(e) => setAgentMode(e.target.checked)} />
          Agent mode
        </label>

        <button onClick={handleRunFull} disabled={!selected || job?.status === "running"} style={primaryBtn(selected)}>
          {agentMode ? "Agent Benchmark" : "Run Full Benchmark"}
        </button>
        <button onClick={handleRegression} disabled={!selected} style={secondaryBtn(selected)}>
          Regression Check
        </button>
      </div>

      {/* Job progress */}
      {job && (
        <div style={{ padding: 16, background: "#f5f5f5", borderRadius: 8, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span>Job: <b>{job.type}</b></span>
            <span style={{ color: job.status === "completed" ? "#2e7d32" : job.status === "failed" ? "#d32f2f" : "#1976d2" }}>
              {job.status}
            </span>
          </div>
          {job.status === "running" && (
            <>
              <div style={{ background: "#e0e0e0", borderRadius: 3, height: 8, overflow: "hidden" }}>
                <div style={{ background: "#1976d2", height: "100%", width: `${progress}%`, transition: "width 0.3s" }} />
              </div>
              {progressMsg && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{progressMsg}</div>}
            </>
          )}
          {job.status === "failed" && <div style={{ color: "#d32f2f", fontSize: 14, marginTop: 4 }}>{job.error}</div>}
        </div>
      )}

      {/* Last result */}
      {lastResult && (
        <div style={{ padding: 16, background: "#fff3e0", borderRadius: 8, marginBottom: 20, border: "1px solid #ffe0b2" }}>
          <h3 style={{ margin: "0 0 12px 0" }}>Last Result — {lastResult.seriesId}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            <Metric label="Gate Score" value={`${lastResult.gateScore}/100`} />
            <Metric label="Decision" value={lastResult.gateDecision} color={decisionColor(lastResult.gateDecision)} />
            <Metric label="Blended" value={lastResult.blendedScore != null ? `${lastResult.blendedScore}` : "—"} />
            <Metric
              label="Regression"
              value={lastResult.regressionStatus}
              color={lastResult.regressionStatus === "OK" ? "#2e7d32" : lastResult.regressionStatus === "REGRESSION" ? "#d32f2f" : "#f57c00"}
            />
            <Metric label="Baseline" value={lastResult.baselineScore != null ? `${lastResult.baselineScore}` : "none"} />
            <Metric
              label="Delta"
              value={lastResult.scoreDelta != null ? `${lastResult.scoreDelta > 0 ? "+" : ""}${lastResult.scoreDelta}` : "—"}
              color={lastResult.scoreDelta != null ? (lastResult.scoreDelta >= 0 ? "#2e7d32" : "#d32f2f") : undefined}
            />
          </div>
          {lastResult.checkDeltas && lastResult.checkDeltas.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 13, color: "#555" }}>
              <b>Check changes:</b>
              <ul style={{ margin: "4px 0", paddingLeft: 20 }}>
                {lastResult.checkDeltas.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Agent report */}
      {agentReport && (
        <div style={{ padding: 16, background: "#e8f5e9", borderRadius: 8, marginBottom: 20, border: "1px solid #c8e6c9" }}>
          <h3 style={{ margin: "0 0 8px 0" }}>Agent Report</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.5, margin: 0, fontFamily: "inherit" }}>
            {agentReport}
          </pre>
        </div>
      )}

      {/* Baselines table */}
      <h3 style={{ marginBottom: 12 }}>Baselines</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
            <th style={thStyle}>Series</th>
            <th style={thStyle}>Baseline</th>
            <th style={thStyle}>Current</th>
            <th style={thStyle}>Delta</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {baselines.map((b) => (
            <tr key={b.seriesId} style={{ borderBottom: "1px solid #eee", background: selected === b.seriesId ? "#e3f2fd" : "" }}>
              <td style={tdStyle}>{b.seriesId}</td>
              <td style={tdStyle}>{b.baselineScore != null ? `${b.baselineScore}` : "—"}</td>
              <td style={tdStyle}>{b.currentScore != null ? `${b.currentScore}` : "—"}</td>
              <td style={tdStyle}>
                {b.delta != null ? (
                  <span style={{ color: b.delta >= 0 ? "#2e7d32" : "#d32f2f" }}>
                    {b.delta > 0 ? "+" : ""}{b.delta}
                  </span>
                ) : "—"}
              </td>
              <td style={tdStyle}>
                {b.hasBaseline ? "OK" : "No baseline"}
              </td>
              <td style={tdStyle}>
                {b.currentScore != null && (
                  <button
                    onClick={() => handleUpdateBaseline(b.seriesId)}
                    style={{ padding: "2px 8px", fontSize: 12, border: "1px solid #1976d2", borderRadius: 4, background: "#fff", color: "#1976d2", cursor: "pointer" }}
                  >
                    Save baseline
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#888" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: color ?? "#333" }}>{value}</div>
    </div>
  );
}

function decisionColor(d: string): string {
  if (d === "PASS") return "#2e7d32";
  if (d === "WARN") return "#f57c00";
  return "#d32f2f";
}

const selectStyle: React.CSSProperties = { padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", minWidth: 120 };

function primaryBtn(enabled: string): React.CSSProperties {
  return { padding: "8px 16px", background: enabled ? "#1976d2" : "#ccc", color: "#fff", border: "none", borderRadius: 6, cursor: enabled ? "pointer" : "default", fontWeight: 600, fontSize: 14 };
}

function secondaryBtn(enabled: string): React.CSSProperties {
  return { padding: "8px 16px", background: enabled ? "#f57c00" : "#ccc", color: "#fff", border: "none", borderRadius: 6, cursor: enabled ? "pointer" : "default", fontWeight: 600, fontSize: 14 };
}

const thStyle: React.CSSProperties = { padding: "8px 12px" };
const tdStyle: React.CSSProperties = { padding: "8px 12px" };
