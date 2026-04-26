import { useEffect, useState } from "react";
import { api } from "../api";
import { TaskTreeView } from "../components/TaskTreeNode";
import type { Job, JobProgress, TaskTree, WorkflowResult } from "../../shared/types";

export function Dashboard() {
  const [health, setHealth] = useState<string>("...");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [trees, setTrees] = useState<Record<string, TaskTree>>({});
  const [streamProgress, setStreamProgress] = useState<number | null>(null);

  useEffect(() => {
    api.health().then((r) => {
      if (r.ok && r.data) setHealth(r.data.status);
    });
    api.listJobs().then((r) => {
      if (r.ok && r.data) {
        setJobs(r.data);
        loadTrees(r.data);
      }
    });
  }, []);

  const loadTrees = async (jobList: Job[]) => {
    const newTrees: Record<string, TaskTree> = {};
    await Promise.all(
      jobList
        .filter((j) => j.type === "workflow" && (j.result as WorkflowResult)?.taskTreeId)
        .map(async (j) => {
          const r = await api.getWorkflowTree(j.id);
          if (r.ok && r.data) newTrees[j.id] = r.data;
        }),
    );
    if (Object.keys(newTrees).length > 0) setTrees(newTrees);
  };

  const runDemo = async () => {
    const r = await api.createDemoJob();
    if (!r.ok || !r.data) return;
    const job = r.data;
    setJobs((prev) => [job, ...prev]);
    setStreamProgress(0);
    const unsub = api.streamJob(job.id, (p: JobProgress) => {
      if (p) {
        setStreamProgress(p.progress);
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, progress: p.progress, status: "running" as const } : j,
          ),
        );
      }
    });
    const interval = setInterval(async () => {
      const sr = await api.getJob(job.id);
      if (sr.ok && sr.data && (sr.data.status === "completed" || sr.data.status === "failed")) {
        clearInterval(interval);
        unsub();
        setStreamProgress(null);
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, status: sr.data!.status, progress: sr.data!.progress } : j)),
        );
      }
    }, 1000);
  };

  const refreshTree = async (jobId: string) => {
    const r = await api.getWorkflowTree(jobId);
    if (r.ok && r.data) {
      setTrees((prev) => ({ ...prev, [jobId]: r.data! }));
    }
  };

  const handleRetryNode = (jobId: string, taskId: string) => {
    api.retryTreeNode(jobId, taskId).then((r) => {
      if (r.ok && r.data) {
        setJobs((prev) => [r.data!, ...prev]);
      }
    });
  };

  const workflowJobs = jobs.filter((j) => j.type === "workflow");
  const otherJobs = jobs.filter((j) => j.type !== "workflow");

  return (
    <div>
      <h1 style={{ margin: "0 0 16px" }}>Dashboard</h1>

      <section style={{ marginBottom: 24 }}>
        <h3>Server Status</h3>
        <span
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: 12,
            background: health === "ok" ? "#c8e6c9" : "#ffcdd2",
            fontSize: 13,
          }}
        >
          {health}
        </span>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3>Job Queue</h3>
        <button
          onClick={runDemo}
          disabled={streamProgress !== null}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            background: "#1976d2",
            color: "#fff",
            cursor: streamProgress !== null ? "wait" : "pointer",
          }}
        >
          {streamProgress !== null ? `Running... ${streamProgress}%` : "Run Demo Job"}
        </button>

        {workflowJobs.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 8 }}>Workflows</h4>
            {workflowJobs.map((j) => {
              const tree = trees[j.id];
              const wfResult = j.result as WorkflowResult | undefined;
              return (
                <div key={j.id} style={{ ...cardStyle, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      {wfResult?.templateId ?? j.type}
                    </span>
                    <span style={{ color: statusColor(j.status), fontSize: 12 }}>
                      {j.status} {j.status === "running" ? `(${j.progress}%)` : ""}
                    </span>
                  </div>
                  {tree ? (
                    <TaskTreeView
                      tree={tree}
                      onRetry={(taskId) => handleRetryNode(j.id, taskId)}
                    />
                  ) : (
                    <span style={{ fontSize: 12, color: "#999" }}>No task tree</span>
                  )}
                  {j.status === "running" && (
                    <button
                      onClick={() => refreshTree(j.id)}
                      style={{ marginTop: 6, fontSize: 11, padding: "2px 10px", borderRadius: 3, border: "1px solid #ccc", background: "transparent", cursor: "pointer" }}
                    >
                      Refresh
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {otherJobs.length > 0 && (
          <table style={{ marginTop: 12, borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Type</th>
                <th style={th}>Status</th>
                <th style={th}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {otherJobs.map((j) => (
                <tr key={j.id}>
                  <td style={td}>{j.id.slice(-6)}</td>
                  <td style={td}>{j.type}</td>
                  <td style={td}>
                    <span style={{ color: statusColor(j.status) }}>{j.status}</span>
                  </td>
                  <td style={td}>{j.progress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: 8, borderBottom: "2px solid #e0e0e0", fontSize: 13 };
const td: React.CSSProperties = { padding: 8, borderBottom: "1px solid #f0f0f0", fontSize: 13 };

const cardStyle: React.CSSProperties = {
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  padding: 12,
  background: "#fafafa",
};

function statusColor(s: string) {
  switch (s) {
    case "completed":
      return "#2e7d32";
    case "running":
      return "#1565c0";
    case "failed":
      return "#c62828";
    default:
      return "#666";
  }
}
