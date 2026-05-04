import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";
import { PageHeader, StatusBadge, LoadingSpinner, EmptyState, SkeletonRow, Button, Card, InputField, type ChatMessage, loadHistory, saveHistory } from "../components";
import { AdvisorPanelBase } from "../components/AdvisorPanelBase";
import { WorkflowImageEditor } from "../components/WorkflowImageEditor";
import { WorkflowStepProgress } from "../components/WorkflowStepProgress";
import { toast } from "../components/ToastContainer";
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
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [categoryData, setCategoryData] = useState<Array<{ id: string; label: { en: string; zh_TW: string }; templates: Array<{ templateId: string; reason: string; defaults?: Record<string, unknown> }> }>>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    const [tplRes, projRes, catRes] = await Promise.all([api.listWorkflowTemplates(), api.listProjects(), api.getWorkflowCategories()]);
    if (tplRes.data) setTemplates(tplRes.data);
    if (projRes.data) setProjects(projRes.data);
    if (catRes.data) setCategoryData(catRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Apply category defaults when template is selected with a category filter
  useEffect(() => {
    if (!categoryFilter || !selectedTemplate) return;
    const rec = getRecommendation(selectedTemplate);
    if (!rec?.defaults) return;
    if (rec.defaults.mode) setMode(rec.defaults.mode as "regex" | "ai" | "hybrid");
    if (rec.defaults.ttsEngine) setTtsEngine(rec.defaults.ttsEngine as "mlx" | "gemini");
  }, [selectedTemplate, categoryFilter]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const template = templates.find((tpl) => tpl.id === selectedTemplate);

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

      startTreePolling(j.id);
    } else {
      toast("error", res.error ?? "Failed to trigger workflow");
    }
  };

  const pollSteps = async (jobId: string) => {
    const res = await api.getWorkflowJob(jobId);
    if (res.data?.result) {
      setStepStatuses(res.data.result.steps);
      if ((res.data.result as WorkflowResult)?.taskTreeId) {
        loadTree(jobId);
      }
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

  // Category-template helpers
  const catEntry = categoryFilter ? categoryData.find((c) => c.id === categoryFilter) : null;
  const recommendedIds = catEntry ? new Set(catEntry.templates.map((t) => t.templateId)) : new Set<string>();
  const filteredTemplates = categoryFilter
    ? templates.filter((tpl) => recommendedIds.has(tpl.id))
    : templates;
  const getRecommendation = (tplId: string) => catEntry?.templates.find((t) => t.templateId === tplId);

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

      {/* Category filter */}
      <div style={{ marginBottom: theme.spacing.md, display: "flex", gap: theme.spacing.sm, flexWrap: "wrap" }}>
        <Button variant={!categoryFilter ? "primary" : "outline"} size="sm" onClick={() => setCategoryFilter("")}>
          {t.workflows.allCategories}
        </Button>
        {categoryData.map((cat) => (
          <Button
            key={cat.id}
            variant={categoryFilter === cat.id ? "primary" : "outline"}
            size="sm"
            onClick={() => {
              setCategoryFilter(categoryFilter === cat.id ? "" : cat.id);
            }}
          >
            {cat.label.en}
          </Button>
        ))}
      </div>

      {/* Template selector */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <label style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, display: "block", marginBottom: theme.spacing.xs }}>{t.workflows.template}</label>
        <select
          value={selectedTemplate}
          onChange={(e) => { setSelectedTemplate(e.target.value); setStepStatuses([]); setTree(null); }}
          style={{ padding: `6px ${theme.spacing.md}px`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md, minWidth: 300 }}
        >
          <option value="">{t.workflows.selectTemplate}</option>
          {filteredTemplates.map((tpl) => {
            const rec = categoryFilter ? getRecommendation(tpl.id) : null;
            return (
              <option key={tpl.id} value={tpl.id}>
                {rec ? "★ " : ""}{tpl.label} — {tpl.description}
              </option>
            );
          })}
        </select>
      </div>

      {/* Recommendation reason */}
      {selectedTemplate && categoryFilter && getRecommendation(selectedTemplate) && (
        <div style={{ marginBottom: theme.spacing.md, padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, background: theme.colors.primaryLight, borderRadius: theme.radii.md, fontSize: theme.font.sizes.sm, color: theme.colors.primary }}>
          {t.workflows.recommended}: {getRecommendation(selectedTemplate)!.reason}
        </div>
      )}

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
                <InputField type="number" min={1} value={chapter} onChange={(e) => setChapter(e.target.value)} style={{ width: 80 }} />
              </div>
              <div>
                <label style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, display: "block", marginBottom: theme.spacing.xs }}>{t.workflows.episode}</label>
                <InputField type="number" min={1} value={episode} onChange={(e) => setEpisode(e.target.value)} style={{ width: 80 }} />
              </div>
            </>
          )}

          {needsMode && (
            <div>
              <label style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, display: "block", marginBottom: theme.spacing.xs }}>{t.workflows.mode}</label>
              <select value={mode} onChange={(e) => setMode(e.target.value as any)} style={{ padding: `6px ${theme.spacing.md}px`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md }}>
                <option value="hybrid">Hybrid</option>
                <option value="ai">AI</option>
                <option value="regex">Regex</option>
              </select>
            </div>
          )}

          {needsTtsEngine && (
            <div>
              <label style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, display: "block", marginBottom: theme.spacing.xs }}>{t.workflows.ttsEngine}</label>
              <select value={ttsEngine} onChange={(e) => setTtsEngine(e.target.value as any)} style={{ padding: `6px ${theme.spacing.md}px`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md }}>
                <option value="mlx">MLX (macOS)</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>
          )}

          {needsImages && (
            <>
              <div>
                <label style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, display: "block", marginBottom: theme.spacing.xs }}>{t.workflows.assetType}</label>
                <select value={imageAssetType} onChange={(e) => setImageAssetType(e.target.value as any)} style={{ padding: `6px ${theme.spacing.md}px`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md }}>
                  <option value="characters">{t.workflows.characters}</option>
                  <option value="backgrounds">{t.workflows.backgrounds}</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, paddingTop: 18 }}>
                <input type="checkbox" checked={skipExistingImages} onChange={(e) => setSkipExistingImages(e.target.checked)} id="skipExistingImages" />
                <label htmlFor="skipExistingImages" style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary }}>{t.workflows.skipExisting}</label>
              </div>
            </>
          )}
        </div>

        {needsImages && (
          <WorkflowImageEditor
            imageItems={imageItems}
            onChange={setImageItems}
            labels={{
              title: t.workflows.images,
              add: t.workflows.add,
              placeholderFilename: t.workflows.placeholderFilename,
              placeholderPrompt: t.workflows.placeholderPrompt,
            }}
            theme={theme}
          />
        )}

          <Button variant="primary" onClick={handleTrigger} disabled={!canTrigger || !!job}>
            {t.workflows.runWorkflow}
          </Button>
        </div>
      )}

      <WorkflowStepProgress
        job={job}
        tree={tree}
        stepStatuses={stepStatuses}
        onRefreshTree={() => job && loadTree(job.id)}
        onRetryNode={handleRetryNode}
        labels={{
          workflow: "Workflow",
          taskTree: t.workflows.taskTree,
          refresh: t.workflows.refresh,
          steps: "Steps",
        }}
        theme={theme}
      />
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
