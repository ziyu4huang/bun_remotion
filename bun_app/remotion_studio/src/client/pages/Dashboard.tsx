import { useEffect, useState } from "react";
import { api } from "../api";
import { PageHeader, StatusBadge, LoadingSpinner, EmptyState, SkeletonCard, SkeletonRow, AgentResultPanel, Card, Button } from "../components";
import { toast } from "../components/ToastContainer";
import { TaskTreeView } from "../components/TaskTreeNode";
import { useAgentTask } from "../hooks/useAgentTask";
import { useI18n } from "../i18n";
import { useTheme, type Theme, scoreColor } from "../theme";
import type { Job, JobProgress, JobStatus, TaskTree, WorkflowResult, EpisodeProgress, EpisodeStepProgress, Project } from "../../shared/types";

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
    if (!jobs) return;
    const toDelete = jobs.filter((j) => j.status === "completed" || j.status === "failed");
    await Promise.all(toDelete.map((j) => api.deleteJob(j.id)));
    setJobs((prev) => prev?.filter((j) => j.status === "running" || j.status === "pending") ?? null);
    setExpandedJobs(new Set());
    toast("info", t.dashboard.cleared(toDelete.length));
  };

  const toggleExpand = (jobId: string) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId); else next.add(jobId);
      return next;
    });
  };

  if (jobs === null) return (
    <div>
      <PageHeader title={t.dashboard.title} description={t.dashboard.description} />
      <section style={{ marginBottom: theme.spacing.xxl }}>
        <h3 style={{ margin: `0 0 ${theme.spacing.sm}px`, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold }}>{t.dashboard.serverStatus}</h3>
        <span style={{ color: theme.colors.text.muted }}>{t.dashboard.checking}</span>
      </section>
      <section style={{ marginBottom: theme.spacing.xxl }}>
        <h3 style={{ ...{ margin: `0 0 ${theme.spacing.md}px`, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold } }}>{t.dashboard.jobQueue}</h3>
        <SkeletonCard rows={2} />
        <div style={{ marginTop: theme.spacing.md }}>
          <SkeletonRow height={24} count={3} />
        </div>
      </section>
    </div>
  );

  const workflowJobs = jobs.filter((j) => j.type === "workflow");
  const otherJobs = jobs.filter((j) => j.type !== "workflow");

  const filteredJobs = filter === "all"
    ? jobs
    : jobs.filter((j) => j.status === filter);

  const counts = {
    all: jobs.length,
    running: jobs.filter((j) => j.status === "running").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
  };

  const hasCompleted = jobs.some((j) => j.status === "completed" || j.status === "failed");

  return (
    <div>
      <PageHeader title={t.dashboard.title} description={t.dashboard.description} />

      {/* System Status */}
      <section style={{ marginBottom: theme.spacing.xxl }}>
        <SystemStatus health={health} activeJobs={counts.running} theme={theme} t={t} />
      </section>

      {/* What's Next */}
      <WhatsNext />

      {/* Ask advisor */}
      <Card variant="default" padding="md" style={{ marginBottom: theme.spacing.xxl }}>
        <div style={{
          display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.md,
          fontSize: theme.font.sizes.sm, fontWeight: theme.font.weights.semibold, color: theme.colors.text.primary,
        }}>
          {t.dashboard.agentAdvisor}
          {agentTask.bridgeDown && (
            <StatusBadge status="warn" label={t.dashboard.agentOffline} />
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: theme.spacing.sm }}>
          <DashboardAgentBtn
            label={t.dashboard.healthCheck}
            prompt={series.length > 0
              ? `Analyze the story health of these Remotion series: ${series.map(s => s.name || s.id).join(", ")}. Use sg_health and sg_suggest on each series. Prioritize: which series needs the most attention and what specific fixes are needed? Respond in zh_TW for story content.`
              : `List the Remotion series under bun_remotion_proj/ and analyze their story health. Use sg_health and sg_suggest. Which series needs the most attention? Prioritize actionable fixes. Respond in zh_TW for story content.`}
            onClick={handleAskAgent} theme={theme} variant="primary"
          />
          <DashboardAgentBtn
            label={t.dashboard.contentGaps}
            prompt={series.length > 0
              ? `For these series: ${series.map(s => s.name || s.id).join(", ")}, use rm_suggest to find content gaps and story opportunities. What character moments, plot developments, or new episodes would best improve each series? Rank by impact. Respond in zh_TW for story content.`
              : `Use rm_suggest to analyze series under bun_remotion_proj/ for content gaps. What character moments, plot developments, or new episodes would best improve each series? Rank by impact. Respond in zh_TW for story content.`}
            onClick={handleAskAgent} theme={theme}
          />
          <DashboardAgentBtn
            label={t.dashboard.qualityAudit}
            prompt={series.length > 0
              ? `Run a comprehensive quality audit on: ${series.map(s => s.name || s.id).join(", ")}. Use rm_analyze on each series. Check: foreshadowing debt, character arc flatness, gag stagnation, missing interactions, pacing issues, trait gaps, duplicate risk. Compare across series. Respond in zh_TW for story content.`
              : `Run a comprehensive quality audit on all series under bun_remotion_proj/. Use rm_analyze. Check: foreshadowing debt, character arcs, gag stagnation, missing interactions, pacing, trait gaps. Compare across series. Respond in zh_TW for story content.`}
            onClick={handleAskAgent} theme={theme}
          />
        </div>
        {agentTask.status !== "idle" && (
          <AgentResultPanel task={agentTask} theme={theme} />
        )}
      </Card>

      {/* Test Review */}
      <Card variant="default" padding="md" style={{ marginBottom: theme.spacing.xl }}>
        <div style={{
          display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.md,
          fontSize: theme.font.sizes.sm, fontWeight: theme.font.weights.semibold, color: theme.colors.text.primary,
        }}>
          {t.dashboard.testReview}
          {testTask.bridgeDown && (
            <StatusBadge status="warn" label={t.dashboard.agentOffline} />
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: theme.spacing.sm }}>
          <DashboardAgentBtn
            label={t.dashboard.runTests}
            prompt="Run bun test across all apps (bun_app/remotion_studio, bun_app/bun_pi_agent, bun_app/storygraph, bun_app/remotion_types). Capture the full output. Summarize: total tests, pass/fail/skip by app, any failures with root cause analysis. If all pass, confirm with metrics."
            onClick={handleTestReview} theme={theme} variant="primary"
          />
          <DashboardAgentBtn
            label="Analyze failures"
            prompt="Find and read the most recent test results across bun_app/. Look for .last-run.json, test-results/, or run bun test to get fresh results. Identify all failures, group by root cause, and suggest specific fixes with file paths and line numbers."
            onClick={handleTestReview} theme={theme}
          />
          <DashboardAgentBtn
            label="Flaky test check"
            prompt="Run bun test twice across all apps in bun_app/. Compare the results — any test that passes in one run but fails in another is flaky. List all flaky tests with their failure patterns and suggest stabilization fixes."
            onClick={handleTestReview} theme={theme}
          />
        </div>
        {testTask.status !== "idle" && (
          <AgentResultPanel task={testTask} theme={theme} />
        )}
      </Card>

      {/* Job Queue */}
      <section style={{ marginBottom: theme.spacing.xxl }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.md, flexWrap: "wrap", gap: theme.spacing.sm }}>
          <h3 style={{ margin: 0, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold }}>{t.dashboard.jobQueue}</h3>
          <div style={{ display: "flex", gap: theme.spacing.sm }}>
            {hasCompleted && (
              <Button variant="outline" size="sm" onClick={handleClearCompleted}>
                {t.dashboard.clearCompleted}
              </Button>
            )}
            <Button variant="primary" size="md" onClick={runDemo} disabled={streamProgress !== null}>
              {streamProgress !== null ? t.dashboard.running(streamProgress) : t.dashboard.runDemoJob}
            </Button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: theme.spacing.xs, marginBottom: theme.spacing.lg }}>
          {(["all", "running", "completed", "failed"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: "4px 12px",
                borderRadius: theme.radii.xl,
                border: "none",
                background: filter === tab ? theme.colors.primaryLight : theme.colors.bg.muted,
                color: filter === tab ? theme.colors.primaryDark : theme.colors.text.secondary,
                cursor: "pointer",
                fontSize: theme.font.sizes.sm,
                fontWeight: filter === tab ? theme.font.weights.medium : theme.font.weights.normal,
              }}
            >
              {t.dashboard.status[tab]}
              {counts[tab] > 0 && (
                <span style={{ marginLeft: 4, fontSize: theme.font.sizes.xs, opacity: 0.7 }}>{counts[tab]}</span>
              )}
            </button>
          ))}
        </div>

        {filteredJobs.length === 0 ? (
          <EmptyState icon={"\u{1F4CB}"} title={t.dashboard.noJobs} description={t.dashboard.noJobsDesc} />
        ) : (
          filteredJobs.map((j) => {
            const tree = trees[j.id];
            const wfResult = j.result as WorkflowResult | undefined;
            const isWorkflow = j.type === "workflow";
            const isExpanded = expandedJobs.has(j.id);
            const duration = (j.status === "completed" || j.status === "failed") ? j.updatedAt - j.createdAt : null;

            return (
              <div key={j.id} style={{
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: theme.radii.xl,
                padding: theme.spacing.md,
                background: theme.colors.bg.surface,
                marginBottom: theme.spacing.sm,
              }}>
                {/* Job header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.xs }}>
                  <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
                    <span style={{ fontWeight: theme.font.weights.semibold, fontSize: theme.font.sizes.base }}>
                      {wfResult?.templateId ?? j.type}
                    </span>
                    <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted }}>
                      {j.id.slice(-6)} · {relativeTime(j.createdAt, t)}
                    </span>
                    {duration !== null && (
                      <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.faint }}>
                        {formatDuration(duration, t)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
                    <StatusBadge status={j.status} label={j.status === "running" ? `${j.progress}%` : j.status} />
                    {j.status === "running" && (
                      <Button variant="danger" size="sm" onClick={() => handleCancel(j.id)}>
                        {t.dashboard.cancel}
                      </Button>
                    )}
                    {(j.status === "completed" || j.status === "failed") && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(j.id)}>
                        {t.dashboard.delete}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress bar for running jobs */}
                {j.status === "running" && (
                  <div style={{ background: theme.colors.border.light, borderRadius: theme.radii.sm, height: 6, overflow: "hidden", marginBottom: theme.spacing.sm }}>
                    <div style={{
                      background: theme.colors.status.running,
                      height: "100%",
                      width: `${j.progress}%`,
                      transition: "width 0.3s",
                    }} />
                  </div>
                )}

                {/* Error message */}
                {j.status === "failed" && j.error && (
                  <div style={{
                    fontSize: theme.font.sizes.sm,
                    color: theme.colors.errorDark,
                    background: theme.colors.errorLight,
                    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                    borderRadius: theme.radii.sm,
                    marginBottom: theme.spacing.sm,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {j.error}
                  </div>
                )}

                {/* Workflow tree (collapsible) */}
                {isWorkflow && tree && (
                  <div>
                    <button
                      onClick={() => toggleExpand(j.id)}
                      style={{
                        fontSize: theme.font.sizes.sm, padding: "2px 8px",
                        background: "none", border: "none", color: theme.colors.primary,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: theme.spacing.xs,
                      }}
                    >
                      <span style={{ fontSize: 10 }}>{isExpanded ? "▼" : "▶"}</span>
                      {isExpanded ? t.dashboard.hideTree : t.dashboard.showTree(treeSummary(tree, t))}
                    </button>
                    {isExpanded && (
                      <div style={{ marginTop: theme.spacing.sm, border: `1px solid ${theme.colors.border.light}`, borderRadius: theme.radii.md, padding: theme.spacing.sm, background: theme.colors.bg.muted }}>
                        <TaskTreeView tree={tree} onRetry={(taskId) => handleRetryNode(j.id, taskId)} />
                      </div>
                    )}
                  </div>
                )}

                {/* Refresh button for running workflow jobs */}
                {isWorkflow && j.status === "running" && (
                  <Button variant="outline" size="sm" onClick={() => refreshTree(j.id)} style={{ marginTop: theme.spacing.xs }}>
                    {t.dashboard.refresh}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* Job History */}
      {history !== null && history.length > 0 && (
        <section style={{ marginBottom: theme.spacing.xxl }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              display: "flex", alignItems: "center", gap: theme.spacing.sm,
              margin: 0, marginBottom: showHistory ? theme.spacing.md : 0,
              padding: 0, background: "none", border: "none",
              cursor: "pointer", color: theme.colors.text.primary,
              fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold,
            }}
          >
            <span style={{ fontSize: 10 }}>{showHistory ? "▼" : "▶"}</span>
            {t.dashboard.jobHistory}
            <span style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted, fontWeight: theme.font.weights.normal }}>
              {t.dashboard.olderJobs(history.length)}
            </span>
          </button>

          {showHistory && history.map((j) => {
            const duration = j.updatedAt - j.createdAt;
            return (
              <div key={j.id} style={{
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radii.lg,
                padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                background: theme.colors.bg.muted,
                marginBottom: theme.spacing.xs,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
                  <span style={{ fontWeight: theme.font.weights.medium, fontSize: theme.font.sizes.sm }}>
                    {(j.result as WorkflowResult)?.templateId ?? j.type}
                  </span>
                  <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted }}>
                    {j.id.slice(-6)} · {relativeTime(j.createdAt, t)}
                  </span>
                  <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.faint }}>
                    {formatDuration(duration, t)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
                  <StatusBadge status={j.status} />
                  <Button variant="ghost" size="sm" onClick={async () => {
                    await api.deleteJob(j.id);
                    setHistory((prev) => prev?.filter((h) => h.id !== j.id) ?? null);
                  }}>
                    {t.dashboard.delete}
                  </Button>
                </div>
              </div>
            );
          })}
        </section>
      )}
      {version && (
        <div style={{ marginTop: theme.spacing.xl, padding: `${theme.spacing.sm}px 0`, borderTop: `1px solid ${theme.colors.border.light}`, color: theme.colors.text.muted, fontSize: theme.font.sizes.xs }}>
          Remotion Studio v{version}
        </div>
      )}
    </div>
  );
}

function relativeTime(timestamp: number, t: any): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return t.dashboard.justNow;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t.dashboard.timeAgo(minutes, "m");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t.dashboard.timeAgo(hours, "h");
  const days = Math.floor(hours / 24);
  return t.dashboard.timeAgo(days, "d");
}

function formatDuration(ms: number, t: any): string {
  const seconds = Math.floor(ms / 1000);
  return t.dashboard.duration(seconds);
}

function treeSummary(tree: TaskTree, t: any): string {
  const nodes = Object.values(tree.nodes);
  const completed = nodes.filter((n) => n.status === "completed").length;
  const total = nodes.length;
  return t.dashboard.treeDone(completed, total);
}

const STEP_ROUTE: Record<string, { page: string; label: string }> = {
  scaffold: { page: "projects", label: "Scaffold Episode" },
  pipeline: { page: "storygraph", label: "Extract KG" },
  check: { page: "storygraph", label: "Quality Gate" },
  score: { page: "storygraph", label: "AI Score" },
  image: { page: "image", label: "Generate Images" },
  tts: { page: "tts", label: "Generate TTS" },
  render: { page: "render", label: "Render Video" },
};

function WhatsNext() {
  const theme = useTheme();
  const { t } = useI18n();
  const [episodes, setEpisodes] = useState<EpisodeProgress[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getEpisodeProgress().then((res) => {
      if (res.data) setEpisodes(res.data.episodes);
      setLoaded(true);
    });
  }, []);

  if (!loaded || episodes.length === 0) return null;

  // Find the most common next step across incomplete episodes
  const stepCounts: Partial<Record<keyof EpisodeStepProgress, number>> = {};
  for (const ep of episodes) {
    if (ep.completedSteps === ep.totalSteps) continue;
    for (const key of ["scaffold", "pipeline", "check", "score", "image", "tts", "render"] as const) {
      if (!ep.steps[key]) {
        stepCounts[key] = (stepCounts[key] ?? 0) + 1;
        break;
      }
    }
  }

  const nextStep = (Object.entries(stepCounts) as [keyof EpisodeStepProgress, number][])
    .sort((a, b) => b[1] - a[1])[0];

  if (!nextStep) return null;

  const info = STEP_ROUTE[nextStep[0]];
  const incomplete = episodes.filter((e) => e.completedSteps < e.totalSteps).length;

  return (
    <section style={{ marginBottom: theme.spacing.xxl }}>
      <div style={{
        padding: "14px 18px",
        border: `1px solid ${theme.colors.primary}33`, borderRadius: theme.radii.lg,
        background: `${theme.colors.primary}08`,
      }}>
        <div style={{ fontSize: theme.font.sizes.base, fontWeight: theme.font.weights.semibold, marginBottom: 6, color: theme.colors.primaryDark }}>
          {t.dashboard.whatsNext}
        </div>
        <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary, lineHeight: 1.6 }}>
          {t.dashboard.episodesInProgress(incomplete)}. {t.dashboard.mostCommonStep}{" "}
          <strong>{t.dashboard.steps[nextStep[0] as keyof typeof t.dashboard.steps] ?? nextStep[0]}</strong> ({t.dashboard.waiting(nextStep[1])}).
          {" "}{t.dashboard.goTo} <strong>{info?.page ?? nextStep[0]}</strong> to continue.
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {(Object.entries(stepCounts) as [string, number][])
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([step, count]) => (
              <StatusBadge key={step} status="pending" label={`${t.dashboard.steps[step as keyof typeof t.dashboard.steps] ?? step}: ${count}`} />
            ))}
        </div>
      </div>
    </section>
  );
}

function SystemStatus({ health, activeJobs, theme, t }: {
  health: string | null; activeJobs: number; theme: Theme; t: ReturnType<typeof useI18n>["t"];
}) {
  const isDown = health === null;
  const isBusy = activeJobs >= 3;
  const statusColor = isDown ? theme.colors.error
    : isBusy ? theme.colors.warning
    : theme.colors.success;
  const statusText = isDown ? (t.jobs?.systemOffline ?? "Server unreachable")
    : isBusy ? (t.jobs?.systemBusy?.(activeJobs) ?? `Queue busy (${activeJobs} jobs)`)
    : (t.jobs?.systemHealthy ?? "All systems running");

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
      borderRadius: theme.radii.xl,
      border: `1px solid ${theme.colors.border.light}`,
      background: theme.colors.bg.muted,
    }}>
      <div style={{
        width: 12,
        height: 12,
        borderRadius: theme.radii.full,
        background: statusColor,
        boxShadow: isDown ? "none" : `0 0 6px ${statusColor}`,
        animation: isBusy ? "pulse 2s infinite" : "none",
      }} />
      <span style={{
        fontSize: theme.font.sizes.base,
        fontWeight: theme.font.weights.medium,
        color: statusColor,
      }}>
        {statusText}
      </span>
      <span style={{ marginLeft: "auto", fontSize: theme.font.sizes.sm, color: theme.colors.text.muted }}>
        {activeJobs > 0 ? `${activeJobs} active` : "Idle"}
      </span>
    </div>
  );
}

function DashboardAgentBtn({ label, prompt, onClick, theme, variant }: {
  label: string; prompt: string; onClick: (p: string) => void; theme: Theme; variant?: "primary";
}) {
  return (
    <Button variant={variant === "primary" ? "ai" : "outline"} size="md" onClick={() => onClick(prompt)}>
      {label}
    </Button>
  );
}