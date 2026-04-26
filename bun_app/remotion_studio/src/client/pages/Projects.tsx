import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";
import { type ChatMessage, type ToolCallDisplay, loadHistory, saveHistory, clearHistory, ToolCallCard, UserBubble, ThinkingIndicator, TurnSeparator, MarkdownText, AdvisorPanelBase } from "../components";
import type { AgentInfo, AgentStreamEvent, AgentTaskResult, Project, Job, WorkflowResult, WorkflowStepStatus } from "../../shared/types";

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

  if (loading) return <div style={{ color: "#666" }}>Loading projects...</div>;

  // Silently refresh data without unmounting the current view
  const silentRefresh = () => load(false);

  const goToCreate = (seriesId?: string) => {
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
    return <CreateProject onBack={goBack} onCreated={silentRefresh} projects={projects} initialSeries={prefillSeries} />;
  }

  if (view === "detail" && selectedId) {
    const project = projects.find((p) => p.id === selectedId);
    if (project) {
      return <ProjectDetail project={project} onBack={() => setView("list")} onNewEpisode={() => goToCreate(project.seriesId)} />;
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Projects ({projects.length})</h2>
        <button
          onClick={() => goToCreate()}
          style={{ padding: "8px 16px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
        >
          + New Episode
        </button>
      </div>
      <ProjectTable projects={projects} onSelect={(id) => { setSelectedId(id); setView("detail"); }} />
    </div>
  );
}

function ProjectTable({ projects, onSelect }: { projects: Project[]; onSelect: (id: string) => void }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
          <th style={{ padding: "8px 12px" }}>Series</th>
          <th style={{ padding: "8px 12px" }}>Category</th>
          <th style={{ padding: "8px 12px" }}>Episodes</th>
          <th style={{ padding: "8px 12px" }}>Scaffolded</th>
          <th style={{ padding: "8px 12px" }}>Gate Score</th>
          <th style={{ padding: "8px 12px" }}>Plan</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => (
          <tr
            key={p.id}
            onClick={() => onSelect(p.id)}
            style={{ borderBottom: "1px solid #eee", cursor: "pointer" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#f5f5f5")}
            onMouseOut={(e) => (e.currentTarget.style.background = "")}
          >
            <td style={{ padding: "8px 12px", fontWeight: 500 }}>{p.name}</td>
            <td style={{ padding: "8px 12px" }}>
              <span style={{ background: "#e3f2fd", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
                {CATEGORY_LABELS[p.category] ?? p.category}
              </span>
            </td>
            <td style={{ padding: "8px 12px" }}>{p.episodeCount}</td>
            <td style={{ padding: "8px 12px" }}>{p.scaffoldedCount}</td>
            <td style={{ padding: "8px 12px" }}>
              <ScoreBadge score={p.gateScore} />
            </td>
            <td style={{ padding: "8px 12px" }}>{p.hasPlan ? "Yes" : "—"}</td>
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
    if (!res.ok || !res.data) return;

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
    if (!res.ok || !res.data) return;

    const newJobId = res.data.id;
    setBuilds((prev) => new Map(prev).set(epId, { jobId: newJobId, steps: build.steps.map((s) => s.status === "completed" ? s : { ...s, status: "pending" as const, progress: 0, error: undefined }), status: "running", error: undefined }));

    api.streamJob(newJobId, () => pollSteps(epId, newJobId));
  };

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", color: "#1976d2", padding: 0, fontSize: 14 }}>
            &larr; Back
          </button>
          <h2 style={{ margin: 0 }}>{project.name}</h2>
          <button
            onClick={onNewEpisode}
            style={{ marginLeft: "auto", padding: "4px 12px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
          >
            + New Episode
          </button>
          <button
            onClick={() => setShowAdvisor(!showAdvisor)}
            style={{ padding: "4px 12px", background: showAdvisor ? "#7b1fa2" : "#f3e5f5", color: showAdvisor ? "#fff" : "#7b1fa2", border: "1px solid #7b1fa2", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
          >
            {showAdvisor ? "Hide Advisor" : "Ask Advisor"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 20, color: "#666", fontSize: 14 }}>
          <span>Category: <b>{CATEGORY_LABELS[project.category] ?? project.category}</b></span>
          <span>Episodes: <b>{project.episodeCount}</b></span>
          <span>Gate: <ScoreBadge score={project.gateScore} /></span>
          <span>Plan: {project.hasPlan ? "Yes" : "No"}</span>
        </div>

        {project.episodes.length === 0 ? (
          <div style={{ color: "#999", fontStyle: "italic" }}>No episodes found (broken symlinks or empty series)</div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
                  <th style={{ padding: "8px 12px" }}>Episode</th>
                  <th style={{ padding: "8px 12px" }}>Ch</th>
                  <th style={{ padding: "8px 12px" }}>Ep</th>
                  <th style={{ padding: "8px 12px" }}>Scaffold</th>
                  <th style={{ padding: "8px 12px" }}>TTS</th>
                  <th style={{ padding: "8px 12px" }}>Render</th>
                  <th style={{ padding: "8px 12px" }}>Gate</th>
                  <th style={{ padding: "8px 12px" }}>Build</th>
                </tr>
              </thead>
              <tbody>
                {project.episodes.map((ep) => {
                  const build = builds.get(ep.id);
                  const isBuilding = build?.status === "running";
                  const isExpanded = expandedEp === ep.id;
                  return (
                    <tr key={ep.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 500 }}>{ep.id}</td>
                      <td style={{ padding: "8px 12px" }}>{ep.chapter ?? "—"}</td>
                      <td style={{ padding: "8px 12px" }}>{ep.episode ?? "—"}</td>
                      <td style={{ padding: "8px 12px" }}>{ep.hasScaffold ? "Yes" : "—"}</td>
                      <td style={{ padding: "8px 12px" }}>{ep.hasTTS ? "Yes" : "—"}</td>
                      <td style={{ padding: "8px 12px" }}>{ep.hasRender ? "Yes" : "—"}</td>
                      <td style={{ padding: "8px 12px" }}><ScoreBadge score={ep.gateScore} /></td>
                      <td style={{ padding: "8px 12px" }}>
                        {isBuilding ? (
                          <button
                            onClick={() => setExpandedEp(isExpanded ? null : ep.id)}
                            style={{ padding: "4px 10px", background: "#ff9800", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                          >
                            {isExpanded ? "Hide" : "View"}
                          </button>
                        ) : build?.status === "completed" ? (
                          <span style={{ color: "#2e7d32", fontSize: 12 }}>
                            Done
                            <button
                              onClick={() => setExpandedEp(isExpanded ? null : ep.id)}
                              style={{ marginLeft: 6, padding: "2px 6px", background: "none", border: "1px solid #2e7d32", borderRadius: 3, cursor: "pointer", fontSize: 11, color: "#2e7d32" }}
                            >
                              {isExpanded ? "Hide" : "View"}
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleBuild(ep.id)}
                            style={{ padding: "4px 10px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                          >
                            Build
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
          </>
        )}
      </div>
      {showAdvisor && <AdvisorPanel seriesId={project.seriesId} seriesName={project.name} messages={advisorMsgs} setMessages={setAdvisorMsgs} />}
    </div>
  );
}

function BuildPanel({ build, onRetry }: { build: BuildState; onRetry: () => void }) {
  return (
    <div style={{ marginTop: 16, padding: 16, background: "#fafafa", border: "1px solid #e0e0e0", borderRadius: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>Build Progress</h3>
        <span style={{ fontSize: 12, color: build.status === "running" ? "#ff9800" : build.status === "completed" ? "#2e7d32" : "#d32f2f", fontWeight: 600 }}>
          {build.status.toUpperCase()}
        </span>
      </div>
      {build.steps.map((step, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ width: 16, textAlign: "center", fontSize: 13 }}>
            {step.status === "completed" ? "+" : step.status === "failed" ? "x" : step.status === "running" ? ">" : " "}
          </span>
          <span style={{ width: 140, fontSize: 13 }}>{step.label}</span>
          <div style={{ flex: 1, background: "#e0e0e0", borderRadius: 3, height: 6, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${step.progress}%`,
                background: step.status === "completed" ? "#4caf50" : step.status === "failed" ? "#f44336" : "#1976d2",
                transition: "width 0.3s",
              }}
            />
          </div>
          <span style={{ width: 50, textAlign: "right", fontSize: 12, color: "#666" }}>{step.progress}%</span>
        </div>
      ))}
      {build.status === "failed" && (
        <div style={{ marginTop: 12, padding: "8px 12px", background: "#ffebee", borderRadius: 6 }}>
          <div style={{ color: "#d32f2f", fontSize: 13, marginBottom: 8 }}>
            {build.error ?? build.steps.find((s) => s.status === "failed")?.error ?? "Unknown error"}
          </div>
          <button
            onClick={onRetry}
            style={{ padding: "6px 14px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 }}
          >
            Retry from failed step
          </button>
        </div>
      )}
      {build.status === "completed" && (
        <div style={{ marginTop: 12, color: "#2e7d32", fontSize: 13 }}>
          All {build.steps.length} steps completed successfully.
        </div>
      )}
    </div>
  );
}

function CreateProject({ onBack, onCreated, projects, initialSeries }: { onBack: () => void; onCreated: () => void; projects: Project[]; initialSeries?: string | null }) {
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
      <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", color: "#1976d2", marginBottom: 16, padding: 0, fontSize: 14 }}>
        &larr; Back to list
      </button>
      <h2 style={{ marginBottom: 20 }}>Create Episode</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
        <label style={{ fontSize: 14 }}>
          Series *
          <select
            value={series}
            onChange={(e) => handleSeriesChange(e.target.value)}
            style={{ display: "block", width: "100%", padding: "8px 12px", marginTop: 4, border: "1px solid #ccc", borderRadius: 6, fontSize: 14, background: "#fff" }}
          >
            <option value="">-- Select series --</option>
            {projects.map((p) => (
              <option key={p.seriesId} value={p.seriesId}>
                {p.name} ({CATEGORY_LABELS[p.category] ?? p.category}, {p.episodeCount} ep{p.episodeCount !== 1 ? "s" : ""})
              </option>
            ))}
            <option value="__custom__">+ New series...</option>
          </select>
        </label>
        {isCustom && (
          <label style={{ fontSize: 14 }}>
            New Series ID *
            <input
              value={customSeries}
              onChange={(e) => setCustomSeries(e.target.value)}
              placeholder="my-new-series"
              style={{ display: "block", width: "100%", padding: "8px 12px", marginTop: 4, border: "1px solid #ccc", borderRadius: 6, fontSize: 14 }}
            />
          </label>
        )}
        {selectedProject && (
          <div style={{ fontSize: 12, color: "#666", background: "#f5f5f5", padding: "6px 10px", borderRadius: 4 }}>
            Category: {CATEGORY_LABELS[selectedProject.category] ?? selectedProject.category} &middot;
            {" "}{selectedProject.episodeCount} episode{selectedProject.episodeCount !== 1 ? "s" : ""} existing
          </div>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ flex: 1, fontSize: 14 }}>
            Chapter
            <input
              type="number"
              min={1}
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="1"
              style={{ display: "block", width: "100%", padding: "8px 12px", marginTop: 4, border: "1px solid #ccc", borderRadius: 6, fontSize: 14 }}
            />
          </label>
          <label style={{ flex: 1, fontSize: 14 }}>
            Episode *
            <input
              type="number"
              min={1}
              value={episode}
              onChange={(e) => setEpisode(e.target.value)}
              placeholder="1"
              style={{ display: "block", width: "100%", padding: "8px 12px", marginTop: 4, border: "1px solid #ccc", borderRadius: 6, fontSize: 14 }}
            />
          </label>
        </div>
        <label style={{ fontSize: 14 }}>
          Scenes (optional)
          <input
            type="number"
            value={scenes}
            onChange={(e) => setScenes(e.target.value)}
            placeholder="7"
            style={{ display: "block", width: "100%", padding: "8px 12px", marginTop: 4, border: "1px solid #ccc", borderRadius: 6, fontSize: 14 }}
          />
        </label>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
          Dry run (preview only)
        </label>

        {error && <div style={{ color: "#d32f2f", fontSize: 14, padding: "8px 12px", background: "#ffebee", borderRadius: 6 }}>{error}</div>}

        {job && (
          <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: 6, fontSize: 14 }}>
            <div>Status: <b>{job.status}</b></div>
            {job.status === "running" && (
              <div style={{ marginTop: 8 }}>
                <div style={{ background: "#e0e0e0", borderRadius: 3, height: 8, overflow: "hidden" }}>
                  <div style={{ background: "#1976d2", height: "100%", width: `${progress}%`, transition: "width 0.3s" }} />
                </div>
              </div>
            )}
            {job.status === "completed" && (
              <ScaffoldResultPreview result={job.result as ScaffoldResultData} dryRun={dryRun} />
            )}
            {job.status === "failed" && <div style={{ color: "#d32f2f", marginTop: 4 }}>{job.error}</div>}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!resolvedSeries || !episode || job?.status === "running"}
          style={{
            padding: "10px 20px",
            background: resolvedSeries && episode ? "#1976d2" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: resolvedSeries && episode ? "pointer" : "default",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {dryRun ? "Preview Scaffold" : "Create Episode"}
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
  const n = result.naming;
  return (
    <div style={{ marginTop: 8, fontSize: 13 }}>
      <div style={{ color: "#2e7d32", fontWeight: 600, marginBottom: 8 }}>
        {dryRun ? "Preview — no files written" : "Scaffold complete!"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "4px 12px", background: "#fff", padding: 10, borderRadius: 6, border: "1px solid #e0e0e0" }}>
        <span style={{ color: "#666" }}>Directory</span>
        <span style={{ fontFamily: "monospace" }}>{n.dirName}</span>
        <span style={{ color: "#666" }}>Package</span>
        <span style={{ fontFamily: "monospace" }}>{n.packageName}</span>
        <span style={{ color: "#666" }}>Composition</span>
        <span style={{ fontFamily: "monospace" }}>{n.compositionId}</span>
        <span style={{ color: "#666" }}>Scenes</span>
        <span>{n.numScenes} scenes, {n.numTransitions} transitions</span>
        <span style={{ color: "#666" }}>Files</span>
        <span>{dryRun ? `${result.filesWritten} would be created` : `${result.filesWritten} written`}</span>
      </div>
      {result.skipped.length > 0 && (
        <div style={{ marginTop: 6, color: "#f57c00", fontSize: 12 }}>
          Skipped: {result.skipped.join(", ")}
        </div>
      )}
      {result.errors.length > 0 && (
        <div style={{ marginTop: 6, color: "#d32f2f", fontSize: 12 }}>
          Errors: {result.errors.join(", ")}
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined) return <span style={{ color: "#999" }}>—</span>;
  const color = score >= 70 ? "#2e7d32" : score >= 40 ? "#f57c00" : "#d32f2f";
  return <span style={{ color, fontWeight: 600 }}>{score}/100</span>;
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
