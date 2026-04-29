import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";
import { useI18n } from "../i18n";
import { type ChatMessage, type ToolCallDisplay, loadHistory, saveHistory, clearHistory, ToolCallCard, UserBubble, ThinkingIndicator, TurnSeparator, MarkdownText, AdvisorPanelBase, PageHeader, LoadingSpinner, StatusBadge, SkeletonRow } from "../components";
import { toast } from "../components/ToastContainer";
import { useTheme, scoreColor } from "../theme";
import type { AgentInfo, AgentStreamEvent, AgentTaskResult, Project, Episode, Job, WorkflowResult, WorkflowStepStatus } from "../../shared/types";

const CATEGORY_LABELS: Record<string, string> = {
  narrative_drama: "Narrative Drama",
  galgame_vn: "Galgame VN",
  tech_explainer: "Tech Explainer",
  data_story: "Data Story",
  listicle: "Listicle",
  tutorial: "Tutorial",
  shorts_meme: "Shorts / Meme",
};

type View = "list" | "detail" | "create";

export function Projects() {
  const theme = useTheme();
  const { t } = useI18n();
  const [view, setView] = useState<View>("list");
  const [prevView, setPrevView] = useState<View>("list");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prefillSeries, setPrefillSeries] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    const res = await api.listProjects();
    if (res.data) setProjects(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(true); }, [load]);

  if (loading) return (
    <div>
      <PageHeader title={t.projects.title} description={t.projects.description} />
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.md }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${theme.colors.border.default}`, textAlign: "left" }}>
            <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>Series</th>
            <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.projects.category}</th>
            <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.projects.episodes}</th>
            <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.projects.scaffolded}</th>
            <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.projects.gate}</th>
            <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.projects.plan}</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
              <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}><SkeletonRow width="120px" /></td>
              <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}><SkeletonRow width="80px" /></td>
              <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}><SkeletonRow width="30px" /></td>
              <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}><SkeletonRow width="30px" /></td>
              <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}><SkeletonRow width="50px" /></td>
              <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}><SkeletonRow width="30px" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Silently refresh data without unmounting the current view
  const silentRefresh = () => load(false);

  const goToScaffold = (seriesId?: string) => {
    setPrevView(view);
    setPrefillSeries(seriesId ?? null);
    setView("create");
  };

  const goBack = () => {
    if (prevView === "detail" && selectedId) {
      setView("detail");
    } else {
      setView("list");
    }
    setPrefillSeries(null);
  };

  if (view === "create") {
    return <ScaffoldEpisode onBack={goBack} onCreated={silentRefresh} projects={projects} initialSeries={prefillSeries} />;
  }

  if (view === "detail" && selectedId) {
    const project = projects.find((p) => p.id === selectedId);
    if (project) {
      return <ProjectDetail project={project} onBack={() => setView("list")} onNewEpisode={() => goToScaffold(project.seriesId)} />;
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.xl }}>
        <PageHeader title={`${t.projects.title} (${projects.length})`} description={t.projects.description} />
        <button
          onClick={() => goToScaffold()}
          style={{ padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`, background: theme.colors.primary, color: theme.colors.bg.page, border: "none", borderRadius: theme.radii.lg, cursor: "pointer" }}
        >
          {t.projects.newEpisode}
        </button>
      </div>
      <ProjectTable projects={projects} onSelect={(id) => { setSelectedId(id); setView("detail"); }} />
    </div>
  );
}

function ProjectTable({ projects, onSelect }: { projects: Project[]; onSelect: (id: string) => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.md }}>
      <thead>
        <tr style={{ borderBottom: `2px solid ${theme.colors.border.default}`, textAlign: "left" }}>
          <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>Series</th>
          <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.projects.category}</th>
          <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.projects.episodes}</th>
          <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.projects.scaffolded}</th>
          <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.projects.gate}</th>
          <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.projects.plan}</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => (
          <tr
            key={p.id}
            onClick={() => onSelect(p.id)}
            style={{ borderBottom: `1px solid ${theme.colors.border.light}`, cursor: "pointer" }}
            onMouseOver={(e) => (e.currentTarget.style.background = theme.colors.bg.muted)}
            onMouseOut={(e) => (e.currentTarget.style.background = "")}
          >
            <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, fontWeight: theme.font.weights.medium }}>{p.name}</td>
            <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>
              <span style={{ background: theme.colors.primaryLight, padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`, borderRadius: theme.radii.md, fontSize: theme.font.sizes.sm }}>
                {CATEGORY_LABELS[p.category] ?? p.category}
              </span>
            </td>
            <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{p.episodeCount}</td>
            <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{p.scaffoldedCount}</td>
            <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>
              <ScoreBadge score={p.gateScore} />
            </td>
            <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{p.hasPlan ? "Yes" : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface BuildState {
  jobId: string;
  steps: WorkflowStepStatus[];
  status: "running" | "completed" | "failed";
  error?: string;
}

function ProjectDetail({ project, onBack, onNewEpisode }: { project: Project; onBack: () => void; onNewEpisode: () => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  const [builds, setBuilds] = useState<Map<string, BuildState>>(new Map());
  const [expandedEp, setExpandedEp] = useState<string | null>(null);
  const [showAdvisor, setShowAdvisor] = useState(false);
  // Lifted advisor state — survives hide/show
  const [advisorMsgs, setAdvisorMsgs] = useState<ChatMessage[]>(() => loadHistory(`advisor-${project.seriesId}`));
  const advisorMsgsRef = useRef(advisorMsgs);
  advisorMsgsRef.current = advisorMsgs;
  useEffect(() => {
    saveHistory(`advisor-${project.seriesId}`, advisorMsgs);
  }, [advisorMsgs, project.seriesId]);

  const handleBuild = async (epId: string) => {
    const res = await api.triggerEpisodeBuild(project.id, epId, true);
    if (!res.ok || !res.data) { toast("error", "Failed to start build"); return; }

    const jobId = res.data.id;
    setBuilds((prev) => new Map(prev).set(epId, { jobId, steps: [], status: "running" }));
    setExpandedEp(epId);

    // Stream progress
    api.streamJob(jobId, () => {
      // On each SSE event, poll for full step data
      pollSteps(epId, jobId);
    });
  };

  const pollSteps = async (epId: string, jobId: string) => {
    const status = await api.getWorkflowJob(jobId);
    if (!status.data?.result) return;

    const wfResult = status.data.result as WorkflowResult;
    const jobStatus = status.data.status as BuildState["status"];

    setBuilds((prev) => {
      const next = new Map(prev);
      next.set(epId, {
        jobId,
        steps: wfResult.steps,
        status: jobStatus,
        error: status.data?.error,
      });
      return next;
    });
  };

  const handleRetry = async (epId: string) => {
    const build = builds.get(epId);
    if (!build) return;

    const failedIdx = build.steps.findIndex((s) => s.status === "failed");
    const res = await api.retryWorkflow(build.jobId, failedIdx >= 0 ? failedIdx : undefined);
    if (!res.ok || !res.data) { toast("error", "Retry failed"); return; }

    const newJobId = res.data.id;
    setBuilds((prev) => new Map(prev).set(epId, { jobId: newJobId, steps: build.steps.map((s) => s.status === "completed" ? s : { ...s, status: "pending" as const, progress: 0, error: undefined }), status: "running", error: undefined }));

    api.streamJob(newJobId, () => pollSteps(epId, newJobId));
  };

  return (
    <div style={{ display: "flex", gap: theme.spacing.lg }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", color: theme.colors.primary, padding: 0, fontSize: theme.font.sizes.md }}>
            &larr; {t.common.back}
          </button>
          <PageHeader title={project.name} description={project.category} />
          <button
            onClick={onNewEpisode}
            style={{ marginLeft: "auto", padding: `${theme.spacing.xs}px ${theme.spacing.md}px`, background: theme.colors.primary, color: theme.colors.bg.page, border: "none", borderRadius: theme.radii.md, cursor: "pointer", fontSize: theme.font.sizes.sm }}
          >
            {t.projects.newEpisode}
          </button>
          <button
            onClick={() => setShowAdvisor(!showAdvisor)}
            style={{ padding: `${theme.spacing.xs}px ${theme.spacing.md}px`, background: showAdvisor ? theme.colors.purple : theme.colors.purpleLight, color: showAdvisor ? theme.colors.bg.page : theme.colors.purple, border: `1px solid ${theme.colors.purple}`, borderRadius: theme.radii.md, cursor: "pointer", fontSize: theme.font.sizes.sm }}
          >
            {showAdvisor ? t.projects.hide : "Ask Advisor"}
          </button>
        </div>
        <div style={{ display: "flex", gap: theme.spacing.lg, marginBottom: theme.spacing.xl, color: theme.colors.text.tertiary, fontSize: theme.font.sizes.md }}>
          <span>{t.projects.category}: <b>{CATEGORY_LABELS[project.category] ?? project.category}</b></span>
          <span>{t.projects.episodes}: <b>{project.episodeCount}</b></span>
          <span>{t.projects.gate}: <ScoreBadge score={project.gateScore} /></span>
          <span>{t.projects.plan}: {project.hasPlan ? "Yes" : "No"}</span>
        </div>

        {project.episodes.length === 0 ? (
          <div style={{ color: theme.colors.text.muted, fontStyle: "italic" }}>{t.projects.noEpisodes}</div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.md }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.colors.border.default}`, textAlign: "left" }}>
                  <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>Episode</th>
                  <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>Ch</th>
                  <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>Ep</th>
                  <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>Scaffold</th>
                  <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>TTS</th>
                  <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>Render</th>
                  <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.projects.gate}</th>
                  <th style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{t.projects.build}</th>
                </tr>
              </thead>
              <tbody>
                {project.episodes.map((ep) => {
                  const build = builds.get(ep.id);
                  const isBuilding = build?.status === "running";
                  const isExpanded = expandedEp === ep.id;
                  return (
                    <tr key={ep.id} style={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
                      <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, fontWeight: theme.font.weights.medium }}>{ep.id}</td>
                      <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{ep.chapter ?? "—"}</td>
                      <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{ep.episode ?? "—"}</td>
                      <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{ep.hasScaffold ? "Yes" : "—"}</td>
                      <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{ep.hasTTS ? "Yes" : "—"}</td>
                      <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>{ep.hasRender ? "Yes" : "—"}</td>
                      <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}><ScoreBadge score={ep.gateScore} /></td>
                      <td style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>
                        {isBuilding ? (
                          <button
                            onClick={() => setExpandedEp(isExpanded ? null : ep.id)}
                            style={{ padding: `${theme.spacing.xs}px ${theme.spacing.sm + 2}px`, background: theme.colors.warning, color: theme.colors.bg.page, border: "none", borderRadius: theme.radii.md, cursor: "pointer", fontSize: theme.font.sizes.sm }}
                          >
                            {isExpanded ? t.projects.hide : t.projects.view}
                          </button>
                        ) : build?.status === "completed" ? (
                          <span style={{ color: theme.colors.success, fontSize: theme.font.sizes.sm }}>
                            {t.projects.done}
                            <button
                              onClick={() => setExpandedEp(isExpanded ? null : ep.id)}
                              style={{ marginLeft: 6, padding: `${theme.spacing.xs - 2}px ${theme.spacing.xs}px`, background: "none", border: `1px solid ${theme.colors.success}`, borderRadius: theme.radii.sm, cursor: "pointer", fontSize: theme.font.sizes.sm, color: theme.colors.success }}
                            >
                              {isExpanded ? t.projects.hide : t.projects.view}
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleBuild(ep.id)}
                            style={{ padding: `${theme.spacing.xs}px ${theme.spacing.sm + 2}px`, background: theme.colors.primary, color: theme.colors.bg.page, border: "none", borderRadius: theme.radii.md, cursor: "pointer", fontSize: theme.font.sizes.sm }}
                          >
                            {t.projects.build}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {expandedEp && builds.has(expandedEp) && (
              <BuildPanel
                key={builds.get(expandedEp)!.jobId}
                build={builds.get(expandedEp)!}
                onRetry={() => handleRetry(expandedEp)}
              />
            )}
            <ReviewChecklist episodes={project.episodes} theme={theme} />
          </>
        )}
      </div>
      {showAdvisor && <AdvisorPanel seriesId={project.seriesId} seriesName={project.name} messages={advisorMsgs} setMessages={setAdvisorMsgs} />}
    </div>
  );
}

function BuildPanel({ build, onRetry }: { build: BuildState; onRetry: () => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <div style={{ marginTop: theme.spacing.lg, padding: theme.spacing.lg, background: theme.colors.bg.surface, border: `1px solid ${theme.colors.border.default}`, borderRadius: theme.radii.xl }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md }}>
        <h3 style={{ margin: 0, fontSize: theme.font.sizes.lg }}>Build Progress</h3>
        <span style={{ fontSize: theme.font.sizes.sm, color: build.status === "running" ? theme.colors.warning : build.status === "completed" ? theme.colors.success : theme.colors.error, fontWeight: theme.font.weights.semibold }}>
          {build.status.toUpperCase()}
        </span>
      </div>
      {build.steps.map((step, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          <span style={{ width: 16, textAlign: "center", fontSize: theme.font.sizes.base }}>
            {step.status === "completed" ? "+" : step.status === "failed" ? "x" : step.status === "running" ? ">" : " "}
          </span>
          <span style={{ width: 140, fontSize: theme.font.sizes.base }}>{step.label}</span>
          <div style={{ flex: 1, background: theme.colors.border.default, borderRadius: theme.radii.sm, height: 6, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${step.progress}%`,
                background: step.status === "completed" ? theme.colors.success : step.status === "failed" ? theme.colors.error : theme.colors.primary,
                transition: "width 0.3s",
              }}
            />
          </div>
          <span style={{ width: 50, textAlign: "right", fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary }}>{step.progress}%</span>
        </div>
      ))}
      {build.status === "failed" && (
        <div style={{ marginTop: theme.spacing.md, padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, background: theme.colors.errorLight, borderRadius: theme.radii.lg }}>
          <div style={{ color: theme.colors.error, fontSize: theme.font.sizes.base, marginBottom: theme.spacing.sm }}>
            {build.error ?? build.steps.find((s) => s.status === "failed")?.error ?? "Unknown error"}
          </div>
          <button
            onClick={onRetry}
            style={{ padding: `${theme.spacing.xs + 2}px ${theme.spacing.md + 2}px`, background: theme.colors.primary, color: theme.colors.bg.page, border: "none", borderRadius: theme.radii.md, cursor: "pointer", fontSize: theme.font.sizes.base }}
          >
            {t.projects.retry}
          </button>
        </div>
      )}
      {build.status === "completed" && (
        <div style={{ marginTop: theme.spacing.md, color: theme.colors.success, fontSize: theme.font.sizes.base }}>
          {t.projects.done} — {build.steps.length} steps completed successfully.
        </div>
      )}
    </div>
  );
}

function ScaffoldEpisode({ onBack, onCreated, projects, initialSeries }: { onBack: () => void; onCreated: () => void; projects: Project[]; initialSeries?: string | null }) {
  const theme = useTheme();
  const { t } = useI18n();
  const [series, setSeries] = useState(initialSeries ?? "");
  const [customSeries, setCustomSeries] = useState("");
  const [inited, setInited] = useState(false);
  const [chapter, setChapter] = useState("");
  const [episode, setEpisode] = useState("");
  const [scenes, setScenes] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isCustom = series === "__custom__";
  const resolvedSeries = isCustom ? customSeries.trim() : series;

  // Auto-fill ch/ep when series is set from initialSeries
  useEffect(() => {
    if (!inited && initialSeries) {
      handleSeriesChange(initialSeries);
      setInited(true);
    }
  }, [initialSeries, inited]);

  // When series changes, auto-detect next chapter/episode
  const handleSeriesChange = (val: string) => {
    setSeries(val);
    if (val === "__custom__" || !val) {
      setChapter("");
      setEpisode("");
      return;
    }
    const project = projects.find((p) => p.seriesId === val);
    if (!project || project.episodes.length === 0) {
      setChapter("1");
      setEpisode("1");
      return;
    }
    const chapters = [...new Set(project.episodes.map((e) => e.chapter ?? 1))].sort((a, b) => b - a);
    const latestCh = chapters[0];
    const epsInLatestCh = project.episodes.filter((e) => (e.chapter ?? 1) === latestCh);
    const maxEp = Math.max(...epsInLatestCh.map((e) => e.episode));
    setChapter(String(latestCh));
    setEpisode(String(maxEp + 1));
  };

  const handleSubmit = async () => {
    setError(null);
    const res = await api.scaffold({
      series: resolvedSeries,
      chapter: chapter ? +chapter : undefined,
      episode: episode ? +episode : undefined,
      scenes: scenes ? +scenes : undefined,
      dryRun,
    });
    if (!res.ok || !res.data) {
      setError(res.error ?? "Unknown error");
      return;
    }
    const job = res.data;
    setJob(job);

    api.streamJob(job.id, (p) => {
      setProgress(p.progress);
    });

    // Immediate first poll — scaffold can complete in <1ms
    const poll = async () => {
      const status = await api.getJob(job.id);
      if (status.data) setJob(status.data);
      if (status.data?.status === "completed" || status.data?.status === "failed") {
        if (status.data.status === "completed") onCreated();
        return;
      }
      setTimeout(poll, 500);
    };
    poll();
  };

  const selectedProject = !isCustom && series ? projects.find((p) => p.seriesId === series) : null;

  return (
    <div>
      <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", color: theme.colors.primary, marginBottom: theme.spacing.lg, padding: 0, fontSize: theme.font.sizes.md }}>
        &larr; {t.projects.backToList}
      </button>
      <PageHeader title={t.projects.scaffoldTitle} description={t.projects.scaffoldDesc} />

      <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.md, maxWidth: 400 }}>
        <label style={{ fontSize: theme.font.sizes.md }}>
          {t.projects.seriesLabel}
          <select
            value={series}
            onChange={(e) => handleSeriesChange(e.target.value)}
            style={{ display: "block", width: "100%", padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, marginTop: theme.spacing.xs, border: `1px solid ${theme.colors.border.medium}`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md, background: theme.colors.bg.page }}
          >
            <option value="">{t.projects.selectSeries}</option>
            {projects.map((p) => (
              <option key={p.seriesId} value={p.seriesId}>
                {p.name} ({CATEGORY_LABELS[p.category] ?? p.category}, {p.episodeCount} ep{p.episodeCount !== 1 ? "s" : ""})
              </option>
            ))}
            <option value="__custom__">{t.projects.newSeries}</option>
          </select>
        </label>
        {isCustom && (
          <label style={{ fontSize: theme.font.sizes.md }}>
            {t.projects.newSeriesId}
            <input
              value={customSeries}
              onChange={(e) => setCustomSeries(e.target.value)}
              placeholder={t.projects.newSeriesPlaceholder}
              style={{ display: "block", width: "100%", padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, marginTop: theme.spacing.xs, border: `1px solid ${theme.colors.border.medium}`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md }}
            />
          </label>
        )}
        {selectedProject && (
          <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary, background: theme.colors.bg.muted, padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px`, borderRadius: theme.radii.md }}>
            {t.projects.category}: {CATEGORY_LABELS[selectedProject.category] ?? selectedProject.category} &middot;
            {" "}{selectedProject.episodeCount} episode{selectedProject.episodeCount !== 1 ? "s" : ""} existing
          </div>
        )}
        <div style={{ display: "flex", gap: theme.spacing.md }}>
          <label style={{ flex: 1, fontSize: theme.font.sizes.md }}>
            {t.projects.chapter}
            <input
              type="number"
              min={1}
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="1"
              style={{ display: "block", width: "100%", padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, marginTop: theme.spacing.xs, border: `1px solid ${theme.colors.border.medium}`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md }}
            />
          </label>
          <label style={{ flex: 1, fontSize: theme.font.sizes.md }}>
            {t.projects.episodeLabel}
            <input
              type="number"
              min={1}
              value={episode}
              onChange={(e) => setEpisode(e.target.value)}
              placeholder="1"
              style={{ display: "block", width: "100%", padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, marginTop: theme.spacing.xs, border: `1px solid ${theme.colors.border.medium}`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md }}
            />
          </label>
        </div>
        <label style={{ fontSize: theme.font.sizes.md }}>
          {t.projects.scenes}
          <input
            type="number"
            value={scenes}
            onChange={(e) => setScenes(e.target.value)}
            placeholder="7"
            style={{ display: "block", width: "100%", padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, marginTop: theme.spacing.xs, border: `1px solid ${theme.colors.border.medium}`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md }}
          />
        </label>
        <label style={{ fontSize: theme.font.sizes.md, display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
          {t.projects.dryRun}
        </label>

        {error && <div style={{ color: theme.colors.error, fontSize: theme.font.sizes.md, padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, background: theme.colors.errorLight, borderRadius: theme.radii.lg }}>{error}</div>}

        {job && (
          <div style={{ padding: theme.spacing.md, background: theme.colors.bg.muted, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md }}>
            <div>Status: <b>{job.status}</b></div>
            {job.status === "running" && (
              <div style={{ marginTop: theme.spacing.sm }}>
                <div style={{ background: theme.colors.border.default, borderRadius: theme.radii.sm, height: 8, overflow: "hidden" }}>
                  <div style={{ background: theme.colors.primary, height: "100%", width: `${progress}%`, transition: "width 0.3s" }} />
                </div>
              </div>
            )}
            {job.status === "completed" && (
              <ScaffoldResultPreview result={job.result as ScaffoldResultData} dryRun={dryRun} />
            )}
            {job.status === "failed" && <div style={{ color: theme.colors.error, marginTop: theme.spacing.xs }}>{job.error}</div>}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!resolvedSeries || !episode || job?.status === "running"}
          style={{
            padding: `${theme.spacing.sm + 2}px ${theme.spacing.xl}px`,
            background: resolvedSeries && episode ? theme.colors.primary : theme.colors.border.medium,
            color: theme.colors.bg.page,
            border: "none",
            borderRadius: theme.radii.lg,
            cursor: resolvedSeries && episode ? "pointer" : "default",
            fontSize: theme.font.sizes.md,
            fontWeight: theme.font.weights.semibold,
          }}
        >
          {dryRun ? t.projects.previewScaffold : t.projects.scaffoldEpisode}
        </button>
      </div>
    </div>
  );
}

interface ScaffoldResultData {
  success: boolean;
  naming: {
    dirName: string;
    packageName: string;
    compositionId: string;
    scriptAlias: string;
    episodeDir: string;
    seriesDir: string;
    numScenes: number;
    numTransitions: number;
    isStandalone: boolean;
  };
  filesWritten: number;
  skipped: string[];
  errors: string[];
}

function ScaffoldResultPreview({ result, dryRun }: { result: ScaffoldResultData; dryRun: boolean }) {
  const theme = useTheme();
  const n = result.naming;
  return (
    <div style={{ marginTop: theme.spacing.sm, fontSize: theme.font.sizes.base }}>
      <div style={{ color: theme.colors.success, fontWeight: theme.font.weights.semibold, marginBottom: theme.spacing.sm }}>
        {dryRun ? "Preview — no files written" : "Scaffold complete!"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: `${theme.spacing.xs}px ${theme.spacing.md}px`, background: theme.colors.bg.page, padding: 10, borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border.default}` }}>
        <span style={{ color: theme.colors.text.tertiary }}>Directory</span>
        <span style={{ fontFamily: theme.font.mono }}>{n.dirName}</span>
        <span style={{ color: theme.colors.text.tertiary }}>Package</span>
        <span style={{ fontFamily: theme.font.mono }}>{n.packageName}</span>
        <span style={{ color: theme.colors.text.tertiary }}>Composition</span>
        <span style={{ fontFamily: theme.font.mono }}>{n.compositionId}</span>
        <span style={{ color: theme.colors.text.tertiary }}>Scenes</span>
        <span>{n.numScenes} scenes, {n.numTransitions} transitions</span>
        <span style={{ color: theme.colors.text.tertiary }}>Files</span>
        <span>{dryRun ? `${result.filesWritten} would be created` : `${result.filesWritten} written`}</span>
      </div>
      {result.skipped.length > 0 && (
        <div style={{ marginTop: 6, color: theme.colors.warning, fontSize: theme.font.sizes.sm }}>
          Skipped: {result.skipped.join(", ")}
        </div>
      )}
      {result.errors.length > 0 && (
        <div style={{ marginTop: 6, color: theme.colors.error, fontSize: theme.font.sizes.sm }}>
          Errors: {result.errors.join(", ")}
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ score }: { score?: number }) {
  const theme = useTheme();
  if (score === undefined) return <span style={{ color: theme.colors.text.muted }}>—</span>;
  const color = scoreColor(score, 100, theme);
  return <span style={{ color, fontWeight: theme.font.weights.semibold }}>{score}/100</span>;
}

function AdvisorPanel({ seriesId, seriesName, messages, setMessages }: { seriesId: string; seriesName: string; messages: ChatMessage[]; setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>> }) {
  return (
    <AdvisorPanelBase
      agentName="sg-story-advisor"
      title="Story Advisor"
      contextLabel={seriesName}
      historyKey={`advisor-${seriesId}`}
      systemPrefix={`Series: ${seriesId} (${seriesName})`}
      placeholder="Ask about story, characters, pacing, or suggestions for this series"
      messages={messages}
      setMessages={setMessages}
      preferredAgents={["studio-advisor", "sg-story-advisor"]}
    />
  );
}

function ReviewChecklist({ episodes, theme }: { episodes: Episode[]; theme: ReturnType<typeof useTheme> }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const total = episodes.length;
  if (total === 0) return null;

  const checks = {
    scaffolded: episodes.filter((e) => e.hasScaffold).length,
    hasTTS: episodes.filter((e) => e.hasTTS).length,
    hasRender: episodes.filter((e) => e.hasRender).length,
    gateOk: episodes.filter((e) => (e.gateScore ?? 0) >= 50).length,
    gateScored: episodes.filter((e) => e.gateScore != null).length,
  };

  const rows: { label: string; done: number; total: number; ok: boolean }[] = [
    { label: "Scaffold complete", done: checks.scaffolded, total, ok: checks.scaffolded === total },
    { label: "TTS generated", done: checks.hasTTS, total, ok: checks.hasTTS === total },
    { label: "Rendered to MP4", done: checks.hasRender, total, ok: checks.hasRender === total },
    { label: "Gate scored (>= 50)", done: checks.gateOk, total, ok: checks.gateOk === total && checks.gateScored === total },
  ];

  const allOk = rows.every((r) => r.ok);

  return (
    <div style={{ marginTop: theme.spacing.xl, border: `1px solid ${allOk ? theme.colors.successLight : theme.colors.border.default}`, borderRadius: theme.radii.lg, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 14px", border: "none",
          background: allOk ? theme.colors.successLight : theme.colors.bg.muted,
          cursor: "pointer", fontSize: theme.font.sizes.sm,
        }}>
        <span style={{ fontWeight: theme.font.weights.medium }}>
          {allOk ? `${t.projects.done}` : t.projects.reviewChecklist} ({total} episodes)
        </span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: 14 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{
                width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: r.ok ? theme.colors.successLight : theme.colors.warningLight,
                color: r.ok ? theme.colors.successDark : theme.colors.warningDark,
                fontSize: 12, fontWeight: 700,
              }}>
                {r.ok ? "+" : "-"}
              </span>
              <span style={{ flex: 1, fontSize: theme.font.sizes.sm }}>{r.label}</span>
              <span style={{ fontSize: theme.font.sizes.sm, color: r.ok ? theme.colors.success : theme.colors.text.secondary }}>
                {r.done}/{r.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
