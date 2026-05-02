import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";
import { type ChatMessage, loadHistory, saveHistory, PageHeader, LoadingSpinner, SkeletonRow, Button } from "../components";
import { AdvisorPanelBase } from "../components/AdvisorPanelBase";
import { StorygraphActionPanel } from "../components/StorygraphActionPanel";
import { StorygraphStatusDisplay } from "../components/StorygraphStatusDisplay";
import { toast } from "../components/ToastContainer";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import type { Project, Job } from "../../shared/types";

type Mode = "regex" | "hybrid" | "ai";

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

      <StorygraphActionPanel
        projects={projects} selected={selected} mode={mode}
        isRunning={job?.status === "running"}
        onSeriesChange={setSelected} onModeChange={setMode} onRun={handleRun}
        labels={{
          selectSeries: t.storygraph.selectSeries, hybrid: t.storygraph.hybrid,
          regex: t.storygraph.regex, aiOnly: t.storygraph.aiOnly,
          extractKg: t.storygraph.extractKg, qualityGate: t.storygraph.qualityGate,
          aiScore: t.storygraph.aiScore,
        }}
        modeHelp={t.storygraph.modeHelp as Record<Mode, string>}
        actionHelp={t.storygraph.actionHelp}
      />

      <StorygraphStatusDisplay
        job={job} progress={progress}
        projects={projects} statuses={statuses} selected={selected}
        labels={{
          series: t.storygraph.series, gate: t.storygraph.gate,
          blended: t.storygraph.blended, nodes: t.storygraph.nodes,
          edges: t.storygraph.edges, html: t.storygraph.html,
          viewGraph: t.storygraph.viewGraph, kgStatus: t.storygraph.kgStatus,
        }}
      />
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
