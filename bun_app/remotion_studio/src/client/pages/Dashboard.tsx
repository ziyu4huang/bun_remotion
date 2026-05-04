import { useEffect, useState } from "react";
import { api } from "../api";
import { PageHeader, StatusBadge, LoadingSpinner, SkeletonCard, SkeletonRow, AgentResultPanel, Card, Button } from "../components";
import { DashboardAgentBtn } from "../components/DashboardAgentBtn";
import { SystemStatus } from "../components/SystemStatus";
import { WhatsNext } from "../components/WhatsNext";
import { JobListSection } from "../components/JobListSection";
import { JobHistorySection } from "../components/JobHistorySection";
import { toast } from "../components/ToastContainer";
import { useAgentTask } from "../hooks/useAgentTask";
import { useI18n } from "../i18n";
import { useTheme } from "../theme";
import type { Job, JobProgress, TaskTree, WorkflowResult, Project } from "../../shared/types";

type FilterTab = "all" | "running" | "completed" | "failed";

export function Dashboard() {
  const theme = useTheme();
  const { t } = useI18n();
  const [health, setHealth] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [history, setHistory] = useState<Job[] | null>(null);
  const [trees, setTrees] = useState<Record<string, TaskTree>>({});
  const [streamProgress, setStreamProgress] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [series, setSeries] = useState<Project[]>([]);
  const [version, setVersion] = useState<string>("");
  const [advisorSeries, setAdvisorSeries] = useState<string>("");
  const [advisorActive, setAdvisorActive] = useState<"story" | "quality" | null>(null);
  const { task: agentTask, start: handleAskAgent } = useAgentTask("studio-advisor", { mode: "stream" });
  const { task: testTask, start: handleTestReview } = useAgentTask("test-reviewer", { mode: "stream" });

  useEffect(() => {
    api.health().then((r) => {
      if (r.ok && r.data) setHealth(r.data.status);
    });
    api.listJobs().then((r) => {
      if (r.ok && r.data) {
        setJobs(r.data);
        loadTrees(r.data);
      } else {
        toast("error", "Failed to load jobs");
      }
    });
    api.listJobHistory("24h").then((r) => {
      if (r.ok && r.data) setHistory(r.data);
    });
    api.listProjects().then((r) => {
      if (r.ok && r.data) setSeries(r.data);
    });
    api.getVersion().then((r) => {
      if (r.ok && r.data) setVersion(r.data.version);
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
    if (!r.ok || !r.data) { toast("error", "Failed to create demo job"); return; }
    const job = r.data;
    setJobs((prev) => prev ? [job, ...prev] : [job]);
    setStreamProgress(0);
    const unsub = api.streamJob(job.id, (p: JobProgress) => {
      if (p) {
        setStreamProgress(p.progress);
        setJobs((prev) =>
          prev?.map((j) =>
            j.id === job.id ? { ...j, progress: p.progress, status: "running" as const } : j,
          ) ?? prev,
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
          prev?.map((j) => (j.id === job.id ? { ...j, status: sr.data!.status, progress: sr.data!.progress } : j)) ?? prev,
        );
      }
    }, 1000);
  };

  const handleCancel = async (jobId: string) => {
    const r = await api.cancelJob(jobId);
    if (r.ok && r.data) {
      setJobs((prev) => prev?.map((j) => j.id === jobId ? r.data! : j) ?? prev);
      toast("info", t.dashboard.jobCancelled);
    } else {
      toast("error", r.error ?? "Failed to cancel job");
    }
  };

  const handleDelete = async (jobId: string) => {
    const r = await api.deleteJob(jobId);
    if (r.ok && r.data) {
      setJobs((prev) => prev?.filter((j) => j.id !== jobId) ?? prev);
      setTrees((prev) => { const next = { ...prev }; delete next[jobId]; return next; });
      setExpandedJobs((prev) => { const next = new Set(prev); next.delete(jobId); return next; });
    } else {
      toast("error", r.error ?? "Failed to delete job");
    }
  };

  const handleClearCompleted = async () => {
    const r = await api.clearJobs("completed");
    if (r.ok && r.data) {
      setJobs((prev) => prev?.filter((j) => j.status !== "completed") ?? null);
      setExpandedJobs(new Set());
      toast("info", t.dashboard.cleared(r.data.deleted));
    }
  };

  const handleClearFailed = async () => {
    const r = await api.clearJobs("failed");
    if (r.ok && r.data) {
      setJobs((prev) => prev?.filter((j) => j.status !== "failed") ?? null);
      setExpandedJobs(new Set());
      toast("info", t.dashboard.cleared(r.data.deleted));
    }
  };

  const handleClearAllTerminal = async () => {
    const r = await api.clearJobs("completed,failed");
    if (r.ok && r.data) {
      setJobs((prev) => prev?.filter((j) => j.status === "running" || j.status === "pending") ?? null);
      setExpandedJobs(new Set());
      toast("info", t.dashboard.cleared(r.data.deleted));
    }
  };

  const toggleExpand = (jobId: string) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId); else next.add(jobId);
      return next;
    });
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
        setJobs((prev) => prev ? [r.data!, ...prev] : [r.data!]);
      }
    });
  };

  const handleDeleteHistory = async (id: string) => {
    await api.deleteJob(id);
    setHistory((prev) => prev?.filter((h) => h.id !== id) ?? null);
  };

  if (jobs === null) return (
    <div>
      <PageHeader title={t.dashboard.title} description={t.dashboard.description} />
      <section style={{ marginBottom: theme.spacing.xxl }}>
        <h3 style={{ margin: `0 0 ${theme.spacing.sm}px`, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold }}>{t.dashboard.serverStatus}</h3>
        <span style={{ color: theme.colors.text.muted }}>{t.dashboard.checking}</span>
      </section>
      <section style={{ marginBottom: theme.spacing.xxl }}>
        <h3 style={{ margin: `0 0 ${theme.spacing.md}px`, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold }}>{t.dashboard.jobQueue}</h3>
        <SkeletonCard rows={2} />
        <div style={{ marginTop: theme.spacing.md }}>
          <SkeletonRow height={24} count={3} />
        </div>
      </section>
    </div>
  );

  const counts = {
    all: jobs.length,
    running: jobs.filter((j) => j.status === "running").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
  };

  const filteredJobs = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  return (
    <div style={{ maxWidth: 1200, overflow: "hidden" }}>
      <PageHeader title={t.dashboard.title} description={t.dashboard.description} />

      {/* System Status */}
      <section style={{ marginBottom: theme.spacing.xxl }}>
        <h3 style={{ margin: `0 0 ${theme.spacing.md}px`, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold }}>{t.dashboard.serverStatus}</h3>
        <SystemStatus health={health} activeJobs={counts.running} theme={theme} t={t} />
      </section>

      {/* What's Next */}
      <WhatsNext />

      {/* Unified AI Advisor */}
      <Card variant="default" padding="md" style={{ marginBottom: theme.spacing.xxl }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.md,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, fontSize: theme.font.sizes.sm, fontWeight: theme.font.weights.semibold, color: theme.colors.text.primary }}>
            {t.dashboard.aiAdvisor}
            {(agentTask.bridgeDown || testTask.bridgeDown) && <StatusBadge status="warn" label={t.dashboard.agentOffline} />}
          </div>
          <select
            value={advisorSeries}
            onChange={(e) => setAdvisorSeries(e.target.value)}
            style={{ padding: `4px ${theme.spacing.sm}px`, borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border.medium}`, fontSize: theme.font.sizes.sm, fontFamily: "inherit" }}
          >
            <option value="">{t.dashboard.advisorAllSeries}</option>
            {series.map((s) => (
              <option key={s.seriesId} value={s.seriesId}>{s.name || s.seriesId}</option>
            ))}
          </select>
        </div>

        {/* Story group */}
        <div style={{ marginBottom: theme.spacing.sm }}>
          <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.tertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.dashboard.advisorStoryGroup}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
            <DashboardAgentBtn label={t.dashboard.healthCheck}
              prompt={advisorSeries
                ? `Analyze the story health of the Remotion series: ${series.find(s => s.seriesId === advisorSeries)?.name || advisorSeries}. Use sg_health and sg_suggest. Prioritize: what specific fixes are needed? Respond in zh_TW for story content.`
                : `List the Remotion series under bun_remotion_proj/ and analyze their story health. Use sg_health and sg_suggest. Which series needs the most attention? Prioritize actionable fixes. Respond in zh_TW for story content.`}
              onClick={(p) => { setAdvisorActive("story"); handleAskAgent(p); }} variant="primary"
            />
            <DashboardAgentBtn label={t.dashboard.contentGaps}
              prompt={advisorSeries
                ? `For series ${series.find(s => s.seriesId === advisorSeries)?.name || advisorSeries}, use rm_suggest to find content gaps and story opportunities. What character moments, plot developments, or new episodes would best improve the series? Rank by impact. Respond in zh_TW for story content.`
                : `Use rm_suggest to analyze series under bun_remotion_proj/ for content gaps. What character moments, plot developments, or new episodes would best improve each series? Rank by impact. Respond in zh_TW for story content.`}
              onClick={(p) => { setAdvisorActive("story"); handleAskAgent(p); }}
            />
            <DashboardAgentBtn label={t.dashboard.qualityAudit}
              prompt={advisorSeries
                ? `Run a comprehensive quality audit on: ${series.find(s => s.seriesId === advisorSeries)?.name || advisorSeries}. Use rm_analyze. Check: foreshadowing debt, character arc flatness, gag stagnation, missing interactions, pacing issues, trait gaps, duplicate risk. Respond in zh_TW for story content.`
                : `Run a comprehensive quality audit on all series under bun_remotion_proj/. Use rm_analyze. Check: foreshadowing debt, character arcs, gag stagnation, missing interactions, pacing, trait gaps. Compare across series. Respond in zh_TW for story content.`}
              onClick={(p) => { setAdvisorActive("story"); handleAskAgent(p); }}
            />
          </div>
        </div>

        {/* Quality group */}
        <div>
          <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.tertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.dashboard.advisorQualityGroup}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
            <DashboardAgentBtn label={t.dashboard.runTests}
              prompt="Run bun test across all apps (bun_app/remotion_studio, bun_app/bun_pi_agent, bun_app/storygraph, bun_app/remotion_types). Capture the full output. Summarize: total tests, pass/fail/skip by app, any failures with root cause analysis. If all pass, confirm with metrics."
              onClick={(p) => { setAdvisorActive("quality"); handleTestReview(p); }} variant="primary"
            />
            <DashboardAgentBtn label={t.dashboard.analyzeFailures}
              prompt="Find and read the most recent test results across bun_app/. Look for .last-run.json, test-results/, or run bun test to get fresh results. Identify all failures, group by root cause, and suggest specific fixes with file paths and line numbers."
              onClick={(p) => { setAdvisorActive("quality"); handleTestReview(p); }}
            />
            <DashboardAgentBtn label={t.dashboard.flakyCheck}
              prompt="Run bun test twice across all apps in bun_app/. Compare the results — any test that passes in one run but fails in another is flaky. List all flaky tests with their failure patterns and suggest stabilization fixes."
              onClick={(p) => { setAdvisorActive("quality"); handleTestReview(p); }}
            />
          </div>
        </div>

        {/* Unified result panel */}
        {advisorActive === "story" && agentTask.status !== "idle" && <AgentResultPanel task={agentTask} theme={theme} />}
        {advisorActive === "quality" && testTask.status !== "idle" && <AgentResultPanel task={testTask} theme={theme} />}
      </Card>

      {/* Job Queue */}
      <JobListSection
        jobs={filteredJobs} trees={trees} filter={filter} counts={counts}
        expandedJobs={expandedJobs} streamProgress={streamProgress}
        theme={theme} t={t}
        onFilterChange={setFilter} onClearCompleted={handleClearCompleted}
        onClearFailed={handleClearFailed} onClearAllTerminal={handleClearAllTerminal}
        onRunDemo={runDemo} onCancel={handleCancel} onDelete={handleDelete}
        onToggleExpand={toggleExpand} onRefreshTree={refreshTree}
        onRetryNode={handleRetryNode}
      />

      {/* Job History */}
      {history !== null && (
        <JobHistorySection
          history={history} showHistory={showHistory}
          theme={theme} t={t}
          onToggle={() => setShowHistory(!showHistory)}
          onDelete={handleDeleteHistory}
        />
      )}

      {version && (
        <div style={{ marginTop: theme.spacing.xl, padding: `${theme.spacing.sm}px 0`, borderTop: `1px solid ${theme.colors.border.light}`, color: theme.colors.text.muted, fontSize: theme.font.sizes.xs }}>
          Remotion Studio v{version}
        </div>
      )}
    </div>
  );
}
