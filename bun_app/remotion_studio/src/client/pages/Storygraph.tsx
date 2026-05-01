import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";
import { type ChatMessage, loadHistory, saveHistory, PageHeader, LoadingSpinner, StatusBadge, SkeletonRow, Button, Card } from "../components";
import { AdvisorPanelBase } from "../components/AdvisorPanelBase";
import { toast } from "../components/ToastContainer";
import { useTheme, type Theme } from "../theme";
import { useI18n } from "../i18n";
import type { Project, Job } from "../../shared/types";

type Mode = "regex" | "hybrid" | "ai";

function HelpTip({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <span title={text} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", background: theme.colors.border.default, color: theme.colors.text.tertiary, fontSize: theme.font.sizes.xs, cursor: "help", marginLeft: theme.spacing.xs, flexShrink: 0 }}>
      ?
    </span>
  );
}

export function Storygraph() {
  const theme = useTheme();
  const { t } = useI18n();
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
          const sr = await api.pipeline.getStatus(p.id);
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

    const fn = action === "pipeline" ? api.pipeline.run : action === "check" ? api.pipeline.check : api.pipeline.score;
    const res = await fn(selected, mode);
    if (!res.ok) {
      toast("error", res.error ?? "Pipeline failed");
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

  if (loading) return (
    <div>
      <PageHeader title={t.storygraph.title} description={t.storygraph.description} />
      <div style={{ display: "flex", gap: theme.spacing.xl, marginBottom: theme.spacing.xl }}>
        <SkeletonRow width="200px" height={36} />
        <SkeletonRow width="150px" height={36} />
      </div>
      <h3 style={{ marginBottom: theme.spacing.md }}>{t.storygraph.kgStatus}</h3>
      <SkeletonRow height={24} count={4} />
    </div>
  );

  const selectedProject = projects.find((p) => p.id === selected);

  return (
    <div style={{ display: "flex", gap: theme.spacing.xl }}>
    <div style={{ flex: 1 }}>
      <PageHeader title={t.storygraph.title} description={t.storygraph.descriptionFull}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvisor(!showAdvisor)}
        >
          {showAdvisor ? t.storygraph.hideAdvisor : t.storygraph.askAdvisor}
        </Button>
      </PageHeader>

      <div style={{ display: "flex", gap: theme.spacing.xl, marginBottom: theme.spacing.sm, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, fontSize: theme.font.sizes.md, borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border.medium}`, minWidth: 200 }}
        >
          <option value="">{t.storygraph.selectSeries}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <div style={{ display: "flex", alignItems: "center" }}>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, fontSize: theme.font.sizes.md, borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border.medium}` }}
          >
            <option value="hybrid">{t.storygraph.hybrid}</option>
            <option value="regex">{t.storygraph.regex}</option>
            <option value="ai">{t.storygraph.aiOnly}</option>
          </select>
          <HelpTip text={t.storygraph.modeHelp[mode]} />
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleRun("pipeline")}
            disabled={!selected || job?.status === "running"}
          >
            {t.storygraph.extractKg}
          </Button>
          <HelpTip text={t.storygraph.actionHelp.pipeline} />
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Button variant="secondary" size="sm" onClick={() => handleRun("check")} disabled={!selected || job?.status === "running"}>
            {t.storygraph.qualityGate}
          </Button>
          <HelpTip text={t.storygraph.actionHelp.check} />
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Button variant="ai" size="sm" onClick={() => handleRun("score")} disabled={!selected || job?.status === "running"}>
            {t.storygraph.aiScore}
          </Button>
          <HelpTip text={t.storygraph.actionHelp.score} />
        </div>
      </div>

      {/* Mode description */}
      {selected && (
        <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.faint, marginBottom: theme.spacing.xl, maxWidth: 700 }}>
          Mode: <b>{mode}</b> — {t.storygraph.modeHelp[mode]}
        </div>
      )}

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
      <h3 style={{ marginBottom: theme.spacing.md }}>{t.storygraph.kgStatus}</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.md }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${theme.colors.border.default}`, textAlign: "left" }}>
            <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.storygraph.series}</th>
            <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.storygraph.gate}</th>
            <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.storygraph.blended}</th>
            <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.storygraph.nodes}</th>
            <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.storygraph.edges}</th>
            <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.storygraph.html}</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const s = statuses[p.id];
            return (
              <tr key={p.id} style={{ borderBottom: `1px solid ${theme.colors.border.light}`, background: selected === p.id ? theme.colors.primaryLight : "" }}>
                <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, fontWeight: theme.font.weights.medium }}>{p.name}</td>
                <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{s?.gateScore !== undefined ? `${s.gateScore}/100` : "—"}</td>
                <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{s?.blendedScore !== undefined ? `${(s.blendedScore as number * 100).toFixed(1)}%` : "—"}</td>
                <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{(s?.nodeCount as number) ?? "—"}</td>
                <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{(s?.edgeCount as number) ?? "—"}</td>
                <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>
                  {s?.hasHTML ? (
                    <a href={`/api/pipeline/graph-html/${p.id}`} target="_blank" rel="noopener" style={{ color: theme.colors.primary, textDecoration: "none", fontWeight: theme.font.weights.medium }}>
                      {t.storygraph.viewGraph}
                    </a>
                  ) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    {showAdvisor && (
      <AdvisorPanelBase
        agentName="sg-story-advisor"
        title={t.storygraph.advisor}
        titleColor={theme.colors.primaryDark}
        contextLabel={selectedProject?.name ?? t.storygraph.title}
        historyKey={`sg-advisor-${selected}`}
        systemPrefix={`Context: Storygraph pipeline operations. Series: ${selectedProject?.name ?? "none selected"}. Mode: ${mode}.`}
        placeholder={t.storygraph.advisorPlaceholder}
        messages={advisorMsgs}
        setMessages={setAdvisorMsgs}
        preferredAgents={["sg-story-advisor", "studio-advisor"]}
      />
    )}
    </div>
  );
}
