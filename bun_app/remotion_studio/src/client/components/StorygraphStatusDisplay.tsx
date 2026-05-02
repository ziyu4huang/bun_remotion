import { useTheme } from "../theme";
import { StatusBadge, Card } from "../components";
import type { Project, Job } from "../../shared/types";

interface StorygraphStatusDisplayProps {
  job: Job | null;
  progress: number;
  projects: Project[];
  statuses: Record<string, Record<string, unknown>>;
  selected: string;
  labels: {
    series: string;
    gate: string;
    blended: string;
    nodes: string;
    edges: string;
    html: string;
    viewGraph: string;
    kgStatus: string;
  };
}

export function StorygraphStatusDisplay({
  job, progress, projects, statuses, selected, labels,
}: StorygraphStatusDisplayProps) {
  const theme = useTheme();

  return (
    <>
      {/* Job status */}
      {job && (
        <Card variant="default" padding="lg" style={{ marginBottom: theme.spacing.xxl }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: theme.spacing.sm }}>
            <span>Job: <b>{job.type}</b></span>
            <StatusBadge status={job.status} />
          </div>
          {job.status === "running" && (
            <div style={{ background: theme.colors.border.default, borderRadius: theme.radii.sm, height: 8, overflow: "hidden" }}>
              <div style={{ background: theme.colors.primary, height: "100%", width: `${progress}%`, transition: "width 0.3s" }} />
            </div>
          )}
          {job.status === "failed" && <div style={{ color: theme.colors.error, fontSize: theme.font.sizes.md, marginTop: theme.spacing.xs }}>{job.error}</div>}
        </Card>
      )}

      {/* Status table */}
      <h3 style={{ marginBottom: theme.spacing.md }}>{labels.kgStatus}</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.md }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${theme.colors.border.default}`, textAlign: "left" }}>
            <th style={thStyle(theme)}>{labels.series}</th>
            <th style={thStyle(theme)}>{labels.gate}</th>
            <th style={thStyle(theme)}>{labels.blended}</th>
            <th style={thStyle(theme)}>{labels.nodes}</th>
            <th style={thStyle(theme)}>{labels.edges}</th>
            <th style={thStyle(theme)}>{labels.html}</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const s = statuses[p.id];
            return (
              <tr key={p.id} style={{ borderBottom: `1px solid ${theme.colors.border.light}`, background: selected === p.id ? theme.colors.primaryLight : "" }}>
                <td style={tdStyle(theme)}>{p.name}</td>
                <td style={tdStyle(theme)}>{s?.gateScore !== undefined ? `${s.gateScore}/100` : "—"}</td>
                <td style={tdStyle(theme)}>{s?.blendedScore !== undefined ? `${((s.blendedScore as number) * 100).toFixed(1)}%` : "—"}</td>
                <td style={tdStyle(theme)}>{(s?.nodeCount as number) ?? "—"}</td>
                <td style={tdStyle(theme)}>{(s?.edgeCount as number) ?? "—"}</td>
                <td style={tdStyle(theme)}>
                  {s?.hasHTML ? (
                    <a href={`/api/pipeline/graph-html/${p.id}`} target="_blank" rel="noopener" style={{ color: theme.colors.primary, textDecoration: "none", fontWeight: theme.font.weights.medium }}>
                      {labels.viewGraph}
                    </a>
                  ) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function thStyle(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return { padding: `${theme.spacing.sm}px ${theme.spacing.md}px` };
}

function tdStyle(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return { padding: `${theme.spacing.sm}px ${theme.spacing.md}px` };
}
