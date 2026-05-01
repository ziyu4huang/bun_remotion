import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { PageHeader, LoadingSpinner, StatusBadge, AgentResultPanel, Button } from "../components";
import { useAgentTask } from "../hooks/useAgentTask";
import { useTheme, type Theme } from "../theme";
import { useI18n } from "../i18n";
import type { Project, Job, BaselineInfo } from "../../shared/types";

export function Benchmark() {
  const theme = useTheme();
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [baselines, setBaselines] = useState<BaselineInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { task: agentTask, start: handleAskAgent } = useAgentTask("sg-benchmark-runner");
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    (async () => {
      const [projRes, blRes] = await Promise.all([
        api.listProjects(),
        api.benchmark.listBaselines(),
      ]);
      if (projRes.data) setProjects(projRes.data);
      if (blRes.data) setBaselines(blRes.data);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text={t.benchmark.loading} />;

  return (
    <div>
      <PageHeader title={t.benchmark.title} description={t.benchmark.description} />

      {/* Ask benchmark agent */}
      <div style={{ marginBottom: theme.spacing.xl, padding: theme.spacing.lg, background: theme.colors.bg.muted, borderRadius: theme.radii.xl }}>
        <h3 style={{ margin: `0 0 ${theme.spacing.sm}px 0` }}>Ask Benchmark Agent</h3>
        <p style={{ margin: `0 0 ${theme.spacing.md}px 0`, color: theme.colors.text.secondary, fontSize: theme.font.sizes.base }}>
          The agent runs benchmarks, analyzes scores, checks regression, and explains results.
        </p>

        {/* Series selector for context */}
        <div style={{ marginBottom: theme.spacing.md }}>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, fontSize: theme.font.sizes.md, borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border.medium}`, minWidth: 200 }}
          >
            <option value="">All series</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: theme.spacing.sm }}>
          <AgentPromptButton
            label="Run full benchmark"
            prompt={selected
              ? `Run a full benchmark on series "${selected}": pipeline → check → regression → score. Report the results and explain what each metric means.`
              : "Run a full benchmark on the series with the lowest quality score. Report results and suggest improvements."}
            onClick={handleAskAgent}
            theme={theme}
            variant="primary"
          />
          <AgentPromptButton
            label="Compare all baselines"
            prompt="Compare all series baselines against current scores. Which series regressed? Which improved? Explain the trends and suggest actions."
            onClick={handleAskAgent}
            theme={theme}
          />
          {selected && (
            <AgentPromptButton
              label={`Analyze ${selected} regression`}
              prompt={`Check regression for series "${selected}". Compare current scores against the baseline. If there's regression, explain what changed and why, and suggest fixes.`}
              onClick={handleAskAgent}
              theme={theme}
            />
          )}
          <AgentPromptButton
            label="Recommend improvements"
            prompt="Review all series quality scores and baselines. Which series need the most attention? What specific improvements would raise the quality gate scores?"
            onClick={handleAskAgent}
            theme={theme}
          />
        </div>

        {/* Agent response */}
        {agentTask.status !== "idle" && (
          <AgentResultPanel task={agentTask} theme={theme} />
        )}
      </div>

      {/* Baselines table (read-only) */}
      <h3 style={{ marginBottom: theme.spacing.md }}>{t.benchmark.baselines}</h3>
      {baselines.length === 0 ? (
        <div style={{ color: theme.colors.text.tertiary }}>No baseline data yet. Run a benchmark to establish baselines.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.md }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${theme.colors.border.default}`, textAlign: "left" }}>
              <th style={thStyle(theme)}>{t.benchmark.series}</th>
              <th style={thStyle(theme)}>{t.benchmark.baseline}</th>
              <th style={thStyle(theme)}>{t.benchmark.current}</th>
              <th style={thStyle(theme)}>{t.benchmark.delta}</th>
              <th style={thStyle(theme)}>{t.benchmark.status}</th>
            </tr>
          </thead>
          <tbody>
            {baselines.map((b) => (
              <tr key={b.seriesId} style={{ borderBottom: `1px solid ${theme.colors.border.light}`, background: selected === b.seriesId ? theme.colors.primaryLight : "" }}>
                <td style={tdStyle(theme)}>{b.seriesId}</td>
                <td style={tdStyle(theme)}>{b.baselineScore != null ? `${b.baselineScore}` : "—"}</td>
                <td style={tdStyle(theme)}>{b.currentScore != null ? `${b.currentScore}` : "—"}</td>
                <td style={tdStyle(theme)}>
                  {b.delta != null ? (
                    <span style={{ color: b.delta >= 0 ? theme.colors.success : theme.colors.error }}>
                      {b.delta > 0 ? "+" : ""}{b.delta}
                    </span>
                  ) : "—"}
                </td>
                <td style={tdStyle(theme)}>
                  {b.hasBaseline
                    ? <StatusBadge status="ok" label={t.benchmark.ok} />
                    : <StatusBadge status="pending" label={t.benchmark.noBaseline} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AgentPromptButton({ label, prompt, onClick, theme, variant }: {
  label: string;
  prompt: string;
  onClick: (prompt: string) => void;
  theme: Theme;
  variant?: "primary" | "warning";
}) {
  const btnVariant = variant ? "ai" : "outline";

  return (
    <Button
      variant={btnVariant}
      size="sm"
      onClick={() => onClick(prompt)}
    >
      {label}
    </Button>
  );
}

function thStyle(t: Theme): React.CSSProperties {
  return { padding: `${t.spacing.sm}px ${t.spacing.md}px` };
}

function tdStyle(t: Theme): React.CSSProperties {
  return { padding: `${t.spacing.sm}px ${t.spacing.md}px` };
}
