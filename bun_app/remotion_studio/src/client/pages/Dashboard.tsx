import { useEffect, useState } from "react";
import { api } from "../api";
import type { Job, JobProgress } from "../../shared/types";

export function Dashboard() {
  const [health, setHealth] = useState<string>("...");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [streamProgress, setStreamProgress] = useState<number | null>(null);

  useEffect(() => {
    api.health().then((r) => {
      if (r.ok && r.data) setHealth(r.data.status);
    });
    api.listJobs().then((r) => {
      if (r.ok && r.data) setJobs(r.data);
    });
  }, []);

  const runDemo = async () => {
    const r = await api.createDemoJob();
    if (!r.ok || !r.data) return;
    const job = r.data;
    // Add job to list immediately so it shows in the table
    setJobs((prev) => [job, ...prev]);
    setStreamProgress(0);
    const unsub = api.streamJob(job.id, (p: JobProgress) => {
      if (p) {
        setStreamProgress(p.progress);
        // Update the job in the list in-place
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, progress: p.progress, status: "running" as const } : j,
          ),
        );
      }
    });
    // poll final status
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

        {jobs.length > 0 && (
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
              {jobs.map((j) => (
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
