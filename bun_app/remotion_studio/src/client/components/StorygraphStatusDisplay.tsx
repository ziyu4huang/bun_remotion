import { useTheme } from "../theme";
import { StatusBadge, Card } from "../components";
import type { Project, Job } from "../../shared/types";

interface StructuredError {
  name?: string;
  code?: string;
  message?: string;
  retryable?: boolean;
  failedStep?: string;
  stepIndex?: number;
  suggestedFix?: string;
  [key: string]: unknown;
}

function parseStructuredError(error: string | undefined): StructuredError | null {
  if (!error) return null;
  try {
    const parsed = JSON.parse(error);
    if (parsed && typeof parsed === "object" && (parsed.code || parsed.name === "PipelineError")) return parsed;
  } catch { /* not JSON */ }
  return null;
}

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
    errorCode?: string;
    failedStep?: string;
    retryable?: string;
    suggestedFix?: string;
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
          {job.status === "failed" && (
            <PipelineErrorDisplay error={job.error} theme={theme} labels={labels} />
          )}
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

function PipelineErrorDisplay({ error, theme, labels }: { error: string | undefined; theme: ReturnType<typeof useTheme>; labels: StorygraphStatusDisplayProps["labels"] }) {
  const structured = parseStructuredError(error);

  if (!structured) {
    return <div style={{ color: theme.colors.error, fontSize: theme.font.sizes.md, marginTop: theme.spacing.xs }}>{error ?? "Unknown error"}</div>;
  }

  const fixSuggestions: Record<string, string> = {
    TIMEOUT: "Try again or increase the timeout setting.",
    SCHEMA_VALIDATION: "Check the artifact file for required fields.",
    PIPELINE_FAILED: "Review the step logs for details.",
    RETRY_EXHAUSTED: "The step failed after multiple retries. Check for systemic issues.",
    MISSING_ARTIFACT: "Run the prerequisite step first (e.g., scaffold before pipeline).",
    PARSE_ERROR: "Check the file format and encoding.",
  };

  return (
    <div style={{
      marginTop: theme.spacing.sm,
      padding: theme.spacing.md,
      background: theme.colors.errorLight,
      borderRadius: theme.radii.md,
      border: `1px solid ${theme.colors.error}`,
    }}>
      <div style={{ display: "flex", gap: theme.spacing.lg, flexWrap: "wrap", marginBottom: theme.spacing.xs }}>
        {structured.code && (
          <div>
            <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.tertiary }}>{labels.errorCode ?? "Error Code"}</span>
            <div style={{ fontFamily: "monospace", fontSize: theme.font.sizes.sm, fontWeight: theme.font.weights.semibold, color: theme.colors.errorDark }}>{structured.code}</div>
          </div>
        )}
        {labels.retryable && (
          <div>
            <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.tertiary }}>{labels.retryable}</span>
            <div><StatusBadge status={structured.retryable ? "running" : "failed"} label={structured.retryable ? "Yes" : "No"} /></div>
          </div>
        )}
      </div>
      <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.errorDark, marginBottom: theme.spacing.xs }}>{structured.message}</div>
      {(labels.suggestedFix || fixSuggestions[structured.code ?? ""]) && (
        <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary }}>
          <strong>{labels.suggestedFix ?? "Fix"}:</strong> {fixSuggestions[structured.code ?? ""] ?? "Review the error details above."}
        </div>
      )}
    </div>
  );
}
