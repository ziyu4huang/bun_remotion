import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";
import { useI18n } from "../i18n";
import { type ChatMessage, loadHistory, saveHistory, PageHeader, LoadingSpinner, StatusBadge, SkeletonRow, Button } from "../components";
import { AdvisorPanelBase } from "../components/AdvisorPanelBase";
import { BuildPanel, type BuildState } from "../components/BuildPanel";
import { ReviewChecklist } from "../components/ReviewChecklist";
import { ScaffoldEpisode, CATEGORY_LABELS } from "../components/ScaffoldEpisode";
import { toast } from "../components/ToastContainer";
import { useTheme, scoreColor } from "../theme";
import type { Project, Episode, WorkflowResult, WorkflowStepStatus } from "../../shared/types";

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
      <div style={{ overflowX: "auto" }}>
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
    </div>
  );

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
        <Button
          onClick={() => goToScaffold()}
        >
          {t.projects.newEpisode}
        </Button>
      </div>
      <ProjectTable projects={projects} onSelect={(id) => { setSelectedId(id); setView("detail"); }} />
    </div>
  );
}

function ProjectTable({ projects, onSelect }: { projects: Project[]; onSelect: (id: string) => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <div style={{ overflowX: "auto" }}>
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
    </div>
  );
}

function ProjectDetail({ project, onBack, onNewEpisode }: { project: Project; onBack: () => void; onNewEpisode: () => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  const [builds, setBuilds] = useState<Map<string, BuildState>>(new Map());
  const [expandedEp, setExpandedEp] = useState<string | null>(null);
  const [showAdvisor, setShowAdvisor] = useState(false);
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

    api.streamJob(jobId, () => {
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
          <Button onClick={onBack} variant="ghost" size="sm" style={{ padding: 0, fontSize: theme.font.sizes.md }}>
            &larr; {t.common.back}
          </Button>
          <PageHeader title={project.name} description={project.category} />
          <Button
            onClick={onNewEpisode}
            size="sm"
            style={{ marginLeft: "auto" }}
          >
            {t.projects.newEpisode}
          </Button>
          <Button
            onClick={() => setShowAdvisor(!showAdvisor)}
            variant="ai"
            size="sm"
          >
            {showAdvisor ? t.projects.hide : "Ask Advisor"}
          </Button>
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
            <div style={{ overflowX: "auto" }}>
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
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setExpandedEp(isExpanded ? null : ep.id)}
                          >
                            {isExpanded ? t.projects.hide : t.projects.view}
                          </Button>
                        ) : build?.status === "completed" ? (
                          <span style={{ color: theme.colors.success, fontSize: theme.font.sizes.sm }}>
                            {t.projects.done}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedEp(isExpanded ? null : ep.id)}
                              style={{ marginLeft: 6, borderColor: theme.colors.success, color: theme.colors.success }}
                            >
                              {isExpanded ? t.projects.hide : t.projects.view}
                            </Button>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleBuild(ep.id)}
                          >
                            {t.projects.build}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            {expandedEp && builds.has(expandedEp) && (
              <BuildPanel
                key={builds.get(expandedEp)!.jobId}
                build={builds.get(expandedEp)!}
                onRetry={() => handleRetry(expandedEp)}
              />
            )}
            <ReviewChecklist episodes={project.episodes} />
          </>
        )}
      </div>
      {showAdvisor && <AdvisorPanel seriesId={project.seriesId} seriesName={project.name} messages={advisorMsgs} setMessages={setAdvisorMsgs} />}
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
