import { useState, useEffect, useRef } from "react";
import type { Job } from "../../shared/types";
import { api } from "../api";
import { useTheme } from "../theme";

interface JobStatusCardProps {
  jobId: string;
  /** If true, polls for job updates */
  live?: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pending: { bg: "#f5f5f4", border: "#a8a29e", text: "#44403c" },
  running: { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" },
  completed: { bg: "#f0fdf4", border: "#22c55e", text: "#166534" },
  failed: { bg: "#fef2f2", border: "#ef4444", text: "#991b1b" },
};

export function JobStatusCard({ jobId, live }: JobStatusCardProps) {
  const theme = useTheme();
  const [job, setJob] = useState<Job | null>(null);
  const [expanded, setExpanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchJob = async () => {
      const res = await api.getJob(jobId);
      if (!cancelled && res.data) setJob(res.data);
    };
    fetchJob();

    if (live) {
      intervalRef.current = setInterval(fetchJob, 2000);
    }

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobId, live]);

  if (!job) {
    return (
      <div data-testid="job-status-card" style={{
        padding: "8px 12px",
        borderRadius: theme.radii.lg,
        border: `1px solid ${theme.colors.border.default}`,
        background: theme.colors.bg.surface,
        fontSize: 13,
        color: theme.colors.text.muted,
      }}>
        Loading job {jobId.slice(0, 8)}...
      </div>
    );
  }

  const colors = STATUS_COLORS[job.status] ?? STATUS_COLORS.pending;
  const terminal = job.status === "completed" || job.status === "failed";

  return (
    <div
      data-testid="job-status-card"
      style={{
        margin: "4px 0",
        borderRadius: theme.radii.lg,
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          cursor: "pointer",
        }}
      >
        {/* Progress bar */}
        <div style={{
          flex: 1,
          height: 4,
          borderRadius: 2,
          background: theme.colors.border.light,
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${job.progress}%`,
            borderRadius: 2,
            background: job.status === "failed" ? theme.colors.error : theme.colors.primary,
            transition: "width 0.3s",
          }} />
        </div>

        <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>
          {terminal ? job.status : `${job.progress}%`}
        </span>

        {!terminal && live && (
          <span style={{ fontSize: 11, color: theme.colors.text.muted }}>live</span>
        )}
      </div>

      {expanded && (
        <div style={{ padding: "6px 12px 8px", borderTop: `1px solid ${theme.colors.border.light}` }}>
          <div style={{ fontSize: 12, color: theme.colors.text.secondary, lineHeight: 1.6 }}>
            <div><strong>Type:</strong> {job.type}</div>
            {job.error && <div style={{ color: theme.colors.error }}><strong>Error:</strong> {job.error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
