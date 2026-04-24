import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import type { Project, Job } from "../../shared/types";

type Mode = "regex" | "hybrid" | "ai";

export function Pipeline() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [mode, setMode] = useState<Mode>("hybrid");
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [progress, setProgress] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, Record<string, unknown>>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.listProjects();
    if (res.data) {
      setProjects(res.data);
      // Load pipeline status for all projects
      const statusMap: Record<string, Record<string, unknown>> = {};
      await Promise.all(
        res.data.map(async (p) => {
          const sr = await api.getPipelineStatus(p.id);
          if (sr.data) statusMap[p.id] = sr.data;
        }),
      );
      setStatuses(statusMap);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRun = async (action: "pipeline" | "check" | "score") => {
    if (!selected) return;
    setProgress(0);
    setJob(null);

    const fn = action === "pipeline" ? api.runPipeline : action === "check" ? api.runCheck : api.runScore;
    const res = await fn(selected, mode);
    if (!res.ok) {
      alert(res.error);
      return;
    }
    setJob(res.data);

    api.streamJob(res.data.id, (p) => setProgress(p.progress));

    const poll = setInterval(async () => {
      const status = await api.getJob(res.data.id);
      if (status.data?.status === "completed" || status.data?.status === "failed") {
        clearInterval(poll);
        setJob(status.data);
        if (status.data.status === "completed") load();
      }
    }, 1000);
  };

  if (loading) return <div style={{ color: "#666" }}>Loading...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Pipeline Runner</h2>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "center" }}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", minWidth: 200 }}
        >
          <option value="">Select series...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          style={{ padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc" }}
        >
          <option value="hybrid">Hybrid (recommended)</option>
          <option value="regex">Regex (debug)</option>
          <option value="ai">AI only</option>
        </select>

        <button
          onClick={() => handleRun("pipeline")}
          disabled={!selected || job?.status === "running"}
          style={{
            padding: "8px 16px",
            background: selected ? "#1976d2" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: selected ? "pointer" : "default",
            fontWeight: 600,
          }}
        >
          Run Pipeline
        </button>
        <button onClick={() => handleRun("check")} disabled={!selected || job?.status === "running"} style={actionBtnStyle(selected)}>
          Check
        </button>
        <button onClick={() => handleRun("score")} disabled={!selected || job?.status === "running"} style={actionBtnStyle(selected)}>
          Score
        </button>
      </div>

      {/* Job status */}
      {job && (
        <div style={{ padding: 16, background: "#f5f5f5", borderRadius: 8, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span>Job: <b>{job.type}</b></span>
            <span style={{ color: job.status === "completed" ? "#2e7d32" : job.status === "failed" ? "#d32f2f" : "#1976d2" }}>
              {job.status}
            </span>
          </div>
          {job.status === "running" && (
            <div style={{ background: "#e0e0e0", borderRadius: 3, height: 8, overflow: "hidden" }}>
              <div style={{ background: "#1976d2", height: "100%", width: `${progress}%`, transition: "width 0.3s" }} />
            </div>
          )}
          {job.status === "failed" && <div style={{ color: "#d32f2f", fontSize: 14, marginTop: 4 }}>{job.error}</div>}
        </div>
      )}

      {/* Status table */}
      <h3 style={{ marginBottom: 12 }}>Pipeline Status</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
            <th style={{ padding: "8px 12px" }}>Series</th>
            <th style={{ padding: "8px 12px" }}>Gate</th>
            <th style={{ padding: "8px 12px" }}>Blended</th>
            <th style={{ padding: "8px 12px" }}>Nodes</th>
            <th style={{ padding: "8px 12px" }}>Edges</th>
            <th style={{ padding: "8px 12px" }}>HTML</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const s = statuses[p.id];
            return (
              <tr key={p.id} style={{ borderBottom: "1px solid #eee", background: selected === p.id ? "#e3f2fd" : "" }}>
                <td style={{ padding: "8px 12px", fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: "8px 12px" }}>{s?.gateScore !== undefined ? `${s.gateScore}/100` : "—"}</td>
                <td style={{ padding: "8px 12px" }}>{s?.blendedScore !== undefined ? `${(s.blendedScore as number * 100).toFixed(1)}%` : "—"}</td>
                <td style={{ padding: "8px 12px" }}>{(s?.nodeCount as number) ?? "—"}</td>
                <td style={{ padding: "8px 12px" }}>{(s?.edgeCount as number) ?? "—"}</td>
                <td style={{ padding: "8px 12px" }}>{s?.hasHTML ? "Yes" : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function actionBtnStyle(enabled: string) {
  return {
    padding: "8px 16px",
    background: enabled ? "#f57c00" : "#ccc" as const,
    color: "#fff" as const,
    border: "none" as const,
    borderRadius: 6,
    cursor: (enabled ? "pointer" : "default") as const,
    fontWeight: 600 as const,
    fontSize: 14,
  };
}
