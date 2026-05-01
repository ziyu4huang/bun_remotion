import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";
import { PageHeader, StatusBadge, LoadingSpinner, EmptyState, SkeletonRow, Button, Card, InputField, type ChatMessage, loadHistory, saveHistory } from "../components";
import { AdvisorPanelBase } from "../components/AdvisorPanelBase";
import { toast } from "../components/ToastContainer";
import { TaskTreeView } from "../components/TaskTreeNode";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import type { Project, WorkflowTemplate, WorkflowStepStatus, Job, JobProgress, WorkflowResult, TaskTree } from "../../shared/types";

export function Workflows() {
  const theme = useTheme();
  const { t } = useI18n();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string>("");
  const [chapter, setChapter] = useState<string>("");
  const [episode, setEpisode] = useState<string>("");
  const [mode, setMode] = useState<"regex" | "ai" | "hybrid">("hybrid");
  const [ttsEngine, setTtsEngine] = useState<"mlx" | "gemini">("mlx");
  const [imageAssetType, setImageAssetType] = useState<"characters" | "backgrounds">("characters");
  const [skipExistingImages, setSkipExistingImages] = useState(true);
  const [imageItems, setImageItems] = useState<Array<{ filename: string; prompt: string; aspectRatio?: string }>>([]);
  const [job, setJob] = useState<Job<WorkflowResult> | null>(null);
  const [stepStatuses, setStepStatuses] = useState<WorkflowStepStatus[]>([]);
  const [tree, setTree] = useState<TaskTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [advisorMsgs, setAdvisorMsgs] = useState<ChatMessage[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    const [tplRes, projRes] = await Promise.all([api.listWorkflowTemplates(), api.listProjects()]);
    if (tplRes.data) setTemplates(tplRes.data);
    if (projRes.data) setProjects(projRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const template = templates.find((t) => t.id === selectedTemplate);

  const loadTree = useCallback(async (jobId: string) => {
    const r = await api.getWorkflowTree(jobId);
    if (r.ok && r.data) setTree(r.data);
  }, []);

  const startTreePolling = useCallback((jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadTree(jobId), 2000);
  }, [loadTree]);

  const stopTreePolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleTrigger = async () => {
    if (!selectedTemplate || !selectedSeries) return;
    const res = await api.triggerWorkflow({
      templateId: selectedTemplate,
      seriesId: selectedSeries,
      chapter: chapter ? Number(chapter) : undefined,
      episode: episode ? Number(episode) : undefined,
      mode,
      ttsEngine,
      ...(needsImages && imageItems.length > 0
        ? { images: imageItems, imageAssetType, skipExistingImages }
        : {}),
    });
    if (res.data) {
      const j = res.data;
      setJob(j);
      setStepStatuses((j.result as WorkflowResult)?.steps ?? []);
      setTree(null);

      // Try to load tree immediately (may not exist yet)
      const wfResult = j.result as WorkflowResult;
      if (wfResult?.taskTreeId) loadTree(j.id);

      api.streamJob(j.id, (p: JobProgress) => {
        setJob((prev) => (prev ? { ...prev, progress: p.progress } : null));
        pollSteps(j.id);
        if (p.progress >= 100) {
          setTimeout(() => {
            pollSteps(j.id);
            loadTree(j.id);
            stopTreePolling();
            setJob(null);
          }, 500);
        }
      });

      // Start tree polling for live updates
      startTreePolling(j.id);
    } else {
      toast("error", res.error ?? "Failed to trigger workflow");
    }
  };

  const pollSteps = async (jobId: string) => {
    const res = await api.getWorkflowJob(jobId);
    if (res.data?.result) {
      setStepStatuses(res.data.result.steps);
      // Also refresh tree if available
      if ((res.data.result as WorkflowResult)?.taskTreeId) {
        loadTree(jobId);
      }
      // Stop polling if done
      if (res.data.status === "completed" || res.data.status === "failed") {
        stopTreePolling();
      }
    }
  };

  const handleRetryNode = (taskId: string) => {
    if (!job) return;
    api.retryTreeNode(job.id, taskId).then((r) => {
      if (r.ok && r.data) {
        setJob(r.data);
        setTree(null);
        startTreePolling(r.data.id);
      }
    });
  };

  const needsSeries = template?.steps.some(
    (s) => s.kind === "scaffold" || s.kind === "pipeline" || s.kind === "check" || s.kind === "score",
  );
  const needsChapterEp = template?.steps.some((s) => s.kind === "scaffold");
  const needsMode = template?.steps.some((s) => s.kind === "pipeline" || s.kind === "check" || s.kind === "score");
  const needsTtsEngine = template?.steps.some((s) => s.kind === "tts");
  const needsImages = template?.steps.some((s) => s.kind === "image");

  const canTrigger = selectedTemplate && (!needsSeries || selectedSeries) && (!needsChapterEp || (chapter && episode)) && (!needsImages || imageItems.length > 0);

  if (loading) return (
    <div>
      <PageHeader title={t.workflows.title} description={t.workflows.description} />
      <div style={{ marginBottom: theme.spacing.lg }}>
        <label style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, display: "block", marginBottom: theme.spacing.xs }}>{t.workflows.template}</label>
        <SkeletonRow width="300px" height={36} />
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: theme.spacing.xl }}>
      <div style={{ flex: 1 }}>
      <PageHeader title={t.workflows.title} description={t.workflows.description}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvisor(!showAdvisor)}
        >
          {showAdvisor ? t.workflows.hideAdvisor : t.workflows.askAdvisor}
        </Button>
      </PageHeader>

      {/* Template selector */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <label style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, display: "block", marginBottom: theme.spacing.xs }}>{t.workflows.template}</label>
        <select
          value={selectedTemplate}
          onChange={(e) => { setSelectedTemplate(e.target.value); setStepStatuses([]); setTree(null); }}
          style={{ padding: `6px ${theme.spacing.md}px`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md, minWidth: 300 }}
        >
          <option value="">{t.workflows.selectTemplate}</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.label} — {t.description}</option>
          ))}
        </select>
      </div>

      {template && (
        <Card variant="default" padding="md" style={{ marginBottom: theme.spacing.lg }}>
          <div style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary }}>
            {t.workflows.steps}: {template.steps.map((s) => s.label).join(" → ")}
          </div>
        </Card>
      )}

      {/* Config form */}
      {template && (
        <div>
        <div style={{ marginBottom: theme.spacing.lg, display: "flex", flexWrap: "wrap", gap: theme.spacing.md, alignItems: "flex-end" }}>
          {needsSeries && (
            <div>
              <label style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, display: "block", marginBottom: theme.spacing.xs }}>{t.workflows.series}</label>
              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                style={{ padding: `6px ${theme.spacing.md}px`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md }}
              >
                <option value="">{t.workflows.selectSeries}</option>
                {projects.map((p) => (
                  <option key={p.seriesId} value={p.seriesId}>{p.seriesId}</option>
                ))}
              </select>
            </div>
          )}

          {needsChapterEp && (
            <>
              <div>
                <label style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, display: "block", marginBottom: theme.spacing.xs }}>{t.workflows.chapter}</label>
                <InputField
                  type="number" min={1} value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  style={{ width: 80 }}
                />
              </div>
              <div>
                <label style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, display: "block", marginBottom: theme.spacing.xs }}>{t.workflows.episode}</label>
                <InputField
                  type="number" min={1} value={episode}
                  onChange={(e) => setEpisode(e.target.value)}
                  style={{ width: 80 }}
                />
              </div>
            </>
          )}

          {needsMode && (
            <div>
              <label style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, display: "block", marginBottom: theme.spacing.xs }}>{t.workflows.mode}</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                style={{ padding: `6px ${theme.spacing.md}px`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md }}
              >
                <option value="hybrid">Hybrid</option>
                <option value="ai">AI</option>
                <option value="regex">Regex</option>
              </select>
            </div>
          )}

          {needsTtsEngine && (
            <div>
              <label style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, display: "block", marginBottom: theme.spacing.xs }}>{t.workflows.ttsEngine}</label>
              <select
                value={ttsEngine}
                onChange={(e) => setTtsEngine(e.target.value as any)}
                style={{ padding: `6px ${theme.spacing.md}px`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md }}
              >
                <option value="mlx">MLX (macOS)</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>
          )}

          {needsImages && (
            <>
              <div>
                <label style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, display: "block", marginBottom: theme.spacing.xs }}>{t.workflows.assetType}</label>
                <select
                  value={imageAssetType}
                  onChange={(e) => setImageAssetType(e.target.value as any)}
                  style={{ padding: `6px ${theme.spacing.md}px`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md }}
                >
                  <option value="characters">{t.workflows.characters}</option>
                  <option value="backgrounds">{t.workflows.backgrounds}</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, paddingTop: 18 }}>
                <input
                  type="checkbox" checked={skipExistingImages}
                  onChange={(e) => setSkipExistingImages(e.target.checked)}
                  id="skipExistingImages"
                />
                <label htmlFor="skipExistingImages" style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary }}>{t.workflows.skipExisting}</label>
              </div>
            </>
          )}
        </div>

        {/* Image list editor */}
        {needsImages && (
          <div style={{ marginBottom: theme.spacing.lg }}>
            <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
              <span style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, fontWeight: theme.font.weights.semibold }}>{t.workflows.images} ({imageItems.length})</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImageItems([...imageItems, { filename: "", prompt: "" }])}
              >
                {t.workflows.add}
              </Button>
            </div>
            {imageItems.map((item, idx) => (
              <div key={idx} style={{ display: "flex", gap: theme.spacing.xs, marginBottom: theme.spacing.xs, alignItems: "center" }}>
                <input
                  placeholder={t.workflows.placeholderFilename}
                  value={item.filename}
                  onChange={(e) => {
                    const next = [...imageItems];
                    next[idx] = { ...next[idx], filename: e.target.value };
                    setImageItems(next);
                  }}
                  style={{ padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border.medium}`, fontSize: theme.font.sizes.base, width: 150 }}
                />
                <input
                  placeholder={t.workflows.placeholderPrompt}
                  value={item.prompt}
                  onChange={(e) => {
                    const next = [...imageItems];
                    next[idx] = { ...next[idx], prompt: e.target.value };
                    setImageItems(next);
                  }}
                  style={{ padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border.medium}`, fontSize: theme.font.sizes.base, flex: 1 }}
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setImageItems(imageItems.filter((_, i) => i !== idx))}
                >
                  x
                </Button>
              </div>
            ))}
          </div>
        )}

          <Button
            variant="primary"
            onClick={handleTrigger}
            disabled={!canTrigger || !!job}
          >
            {t.workflows.runWorkflow}
          </Button>
        </div>
      )}

      {/* Overall progress */}
      {job && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          <div style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, marginBottom: theme.spacing.xs }}>
            Workflow — {job.status} ({job.progress}%)
          </div>
          <div style={{ background: "#e5e7eb", borderRadius: theme.radii.md, height: 10, overflow: "hidden" }}>
            <div style={{ background: "#059669", height: "100%", width: `${job.progress}%`, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {/* Task tree view (primary) */}
      {tree && (
        <div style={{ marginTop: theme.spacing.lg }}>
          <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
            <h3 style={{ fontSize: theme.font.sizes.md, margin: 0 }}>{t.workflows.taskTree}</h3>
            {job?.status === "running" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => job && loadTree(job.id)}
              >
                {t.workflows.refresh}
              </Button>
            )}
          </div>
          <Card variant="surface" padding="sm">
            <TaskTreeView
              tree={tree}
              onRetry={job ? handleRetryNode : undefined}
            />
          </Card>
        </div>
      )}

      {/* Flat step list (fallback when no tree) */}
      {!tree && stepStatuses.length > 0 && (
        <div style={{ marginTop: theme.spacing.lg }}>
          <h3 style={{ fontSize: theme.font.sizes.md, margin: `0 0 ${theme.spacing.sm}px` }}>Steps</h3>
          {stepStatuses.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
              <span style={{ fontSize: theme.font.sizes.base, width: 160, flexShrink: 0 }}>{i + 1}. {step.label}</span>
              <div style={{ background: "#e5e7eb", borderRadius: theme.radii.sm, height: 6, flex: 1, overflow: "hidden" }}>
                <div style={{
                  background: stepColor(step.status),
                  height: "100%",
                  width: `${step.progress}%`,
                  transition: "width 0.3s",
                }} />
              </div>
              <StatusBadge status={step.status} />
              {step.error && (
                <span style={{ fontSize: theme.font.sizes.sm, color: "#dc2626" }}>{step.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
      {showAdvisor && (
        <AdvisorPanelBase
          agentName="studio-coordinator"
          title={t.workflows.advisor}
          titleColor={theme.colors.primaryDark}
          contextLabel={selectedSeries || t.workflows.title}
          historyKey="workflows-advisor"
          systemPrefix={`Context: Workflows. Template: ${selectedTemplate || "none"}. Pipeline orchestration guidance.`}
          placeholder={t.workflows.advisorPlaceholder}
          messages={advisorMsgs}
          setMessages={setAdvisorMsgs}
          preferredAgents={["studio-coordinator", "studio-advisor"]}
        />
      )}
    </div>
  );
}

function stepColor(status: string): string {
  switch (status) {
    case "completed": return "#059669";
    case "running": return "#2563eb";
    case "failed": return "#dc2626";
    default: return "#9ca3af";
  }
}
