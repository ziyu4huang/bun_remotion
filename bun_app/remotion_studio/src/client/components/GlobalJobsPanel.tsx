import { useState } from "react";
import { useTheme } from "../theme";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useI18n } from "../i18n";
import type { Job } from "../../shared/types";

interface GlobalJobsPanelProps {
  activeJobs: Job[];
  recentDone: Job[];
  onCancel: (id: string) => void;
}

export function GlobalJobsPanel({ activeJobs, recentDone, onCancel }: GlobalJobsPanelProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.mobile - 1}px)`);
  const [open, setOpen] = useState(false);

  const count = activeJobs.length;
  if (count === 0 && recentDone.length === 0) return null;

  // Mobile: bottom sheet spanning full width. Desktop: fixed-position panel.
  const panelStyle = isMobile ? {
    position: "fixed" as const,
    bottom: 76,
    left: 8,
    right: 8,
    zIndex: 901,
    maxHeight: 320,
    overflowY: "auto" as const,
    borderRadius: theme.radii.xl,
    border: `1px solid ${theme.colors.border.default}`,
    background: theme.colors.bg.surface,
    boxShadow: theme.shadows.lg,
    padding: theme.spacing.md,
  } : {
    position: "fixed" as const,
    bottom: 76,
    right: 20,
    zIndex: 901,
    width: 320,
    maxHeight: 400,
    overflowY: "auto" as const,
    borderRadius: theme.radii.xl,
    border: `1px solid ${theme.colors.border.default}`,
    background: theme.colors.bg.surface,
    boxShadow: theme.shadows.lg,
    padding: theme.spacing.md,
  };

  return (
    <>
      {/* Floating badge */}
      <button
        data-testid="global-jobs-badge"
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 900,
          width: 48,
          height: 48,
          borderRadius: theme.radii.xxl,
          border: "none",
          background: count > 0 ? theme.colors.primary : theme.colors.bg.muted,
          color: count > 0 ? "#fff" : theme.colors.text.primary,
          fontSize: 16,
          fontWeight: theme.font.weights.bold,
          cursor: "pointer",
          boxShadow: theme.shadows.lg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.2s, transform 0.15s",
        }}
        title={t.jobs?.globalTitle ?? "Jobs"}
      >
        {count > 0 ? count : "✓"}
      </button>

      {/* Panel */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 899,
              background: "transparent",
            }}
          />
          <div
            data-testid="global-jobs-panel"
            style={panelStyle}
          >
            <div style={{
              fontSize: theme.font.sizes.md,
              fontWeight: theme.font.weights.semibold,
              marginBottom: theme.spacing.sm,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span>{t.jobs?.globalTitle ?? "Jobs"}</span>
              <span style={{
                fontSize: theme.font.sizes.sm,
                color: theme.colors.text.muted,
              }}>
                {count} active
              </span>
            </div>

            {/* Active jobs */}
            {activeJobs.map((job) => (
              <JobRow key={job.id} job={job} onCancel={onCancel} theme={theme} />
            ))}

            {/* Recent completed */}
            {recentDone.length > 0 && (
              <>
                <div style={{
                  fontSize: theme.font.sizes.xs,
                  color: theme.colors.text.muted,
                  textTransform: "uppercase" as const,
                  letterSpacing: 0.5,
                  marginTop: theme.spacing.sm,
                  marginBottom: 4,
                }}>
                  Recent
                </div>
                {recentDone.map((job) => (
                  <JobRow key={job.id} job={job} theme={theme} />
                ))}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}

function JobRow({ job, onCancel, theme }: { job: Job; onCancel?: (id: string) => void; theme: ReturnType<typeof useTheme> }) {
  const terminal = job.status === "completed" || job.status === "failed";
  const statusColor = terminal
    ? job.status === "completed" ? theme.colors.success : theme.colors.error
    : theme.colors.primary;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 8px",
      marginBottom: 4,
      borderRadius: theme.radii.lg,
      background: theme.colors.bg.muted,
      fontSize: theme.font.sizes.sm,
    }}>
      {/* Progress mini-bar */}
      <div style={{
        flex: 1,
        minWidth: 0,
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 3,
        }}>
          <span style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap" as const,
            fontWeight: theme.font.weights.medium,
          }}>
            {job.type}
          </span>
          <span style={{
            fontSize: theme.font.sizes.xs,
            color: statusColor,
            fontWeight: theme.font.weights.medium,
            flexShrink: 0,
          }}>
            {terminal ? job.status : `${job.progress}%`}
          </span>
        </div>
        <div style={{
          height: 3,
          borderRadius: 2,
          background: theme.colors.border.light,
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${job.progress}%`,
            borderRadius: 2,
            background: statusColor,
            transition: "width 0.3s",
          }} />
        </div>
      </div>

      {!terminal && onCancel && (
        <button
          onClick={() => onCancel(job.id)}
          style={{
            border: "none",
            background: "transparent",
            color: theme.colors.error,
            cursor: "pointer",
            fontSize: theme.font.sizes.xs,
            padding: "2px 4px",
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
