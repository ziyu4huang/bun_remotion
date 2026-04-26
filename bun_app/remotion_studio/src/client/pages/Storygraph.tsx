import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";
import { type ChatMessage, loadHistory, saveHistory, AdvisorPanelBase } from "../components";
import type { Project, Job } from "../../shared/types";

type Mode = "regex" | "hybrid" | "ai";

const MODE_HELP: Record<Mode, string> = {
  regex: "Pattern-based extraction. Fast but produces flat graphs. Use only for debugging structure.",
  hybrid: "Regex + AI verification. Best balance of speed and depth. Recommended for most series.",
  ai: "Pure AI extraction. Deepest semantic analysis but slowest. Use when hybrid misses connections.",
};

const ACTION_HELP = {
  pipeline: "Full extraction: parse scripts → build knowledge graph → generate communities → HTML visualization.",
  check: "Quality gate: validate existing KG against 6 quality checks without re-extracting.",
  score: "AI scoring: dimensional quality analysis of the knowledge graph.",
};

function HelpTip({ text }: { text: string }) {
  return (
    <span title={text} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", background: "#e0e0e0", color: "#666", fontSize: 10, cursor: "help", marginLeft: 4, flexShrink: 0 }}>
      ?
    </span>
  );
}

export function Storygraph() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [mode, setMode] = useState<Mode>("hybrid");
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [progress, setProgress] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, Record<string, unknown>>>({});
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [advisorMsgs, setAdvisorMsgs] = useState<ChatMessage[]>([]);
  const advisorMsgsRef = useRef(advisorMsgs);
  advisorMsgsRef.current = advisorMsgs;
  useEffect(() => {
    if (selected) saveHistory(`sg-advisor-${selected}`, advisorMsgs);
  }, [advisorMsgs, selected]);
  useEffect(() => {
    if (selected) setAdvisorMsgs(loadHistory(`sg-advisor-${selected}`));
  }, [selected]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.listProjects();
    if (res.data) {
      setProjects(res.data);
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

  const selectedProject = projects.find((p) => p.id === selected);

  return (
    <div style={{ display: "flex", gap: 16 }}>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Storygraph</h2>
        <button
          onClick={() => setShowAdvisor(!showAdvisor)}
          style={{ padding: "4px 12px", background: showAdvisor ? "#1565c0" : "#e3f2fd", color: showAdvisor ? "#fff" : "#1565c0", border: "1px solid #1565c0", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
        >
          {showAdvisor ? "Hide Advisor" : "Ask Advisor"}
        </button>
      </div>
      <p style={{ color: "#666", fontSize: 14, marginTop: 0, marginBottom: 20 }}>
        Extract and analyze story knowledge graphs. Build character relationships, story arcs, and quality scores for your series.
      </p>

      <div style={{ display: "flex", gap: 16, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
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

        <div style={{ display: "flex", alignItems: "center" }}>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            style={{ padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc" }}
          >
            <option value="hybrid">Hybrid (recommended)</option>
            <option value="regex">Regex (debug)</option>
            <option value="ai">AI only</option>
          </select>
          <HelpTip text={MODE_HELP[mode]} />
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
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
            Extract KG
          </button>
          <HelpTip text={ACTION_HELP.pipeline} />
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button onClick={() => handleRun("check")} disabled={!selected || job?.status === "running"} style={actionBtnStyle(selected)}>
            Quality Gate
          </button>
          <HelpTip text={ACTION_HELP.check} />
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button onClick={() => handleRun("score")} disabled={!selected || job?.status === "running"} style={actionBtnStyle(selected)}>
            AI Score
          </button>
          <HelpTip text={ACTION_HELP.score} />
        </div>
      </div>

      {/* Mode description */}
      {selected && (
        <div style={{ fontSize: 12, color: "#888", marginBottom: 16, maxWidth: 700 }}>
          Mode: <b>{mode}</b> — {MODE_HELP[mode]}
        </div>
      )}

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
      <h3 style={{ marginBottom: 12 }}>Knowledge Graph Status</h3>
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
    {showAdvisor && (
      <AdvisorPanelBase
        agentName="sg-story-advisor"
        title="Storygraph Advisor"
        titleColor="#1565c0"
        contextLabel={selectedProject?.name ?? "Storygraph"}
        historyKey={`sg-advisor-${selected}`}
        systemPrefix={`Context: Storygraph pipeline operations. Series: ${selectedProject?.name ?? "none selected"}. Mode: ${mode}.`}
        placeholder="Ask about knowledge graph quality, mode selection, or how to improve your storygraph"
        messages={advisorMsgs}
        setMessages={setAdvisorMsgs}
        preferredAgents={["sg-story-advisor", "studio-advisor"]}
      />
    )}
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
