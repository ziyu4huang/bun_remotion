import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import type { Project, WorkflowTemplate, WorkflowStepStatus, Job, JobProgress, WorkflowResult } from "../../shared/types";

export function Workflows() {
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
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [tplRes, projRes] = await Promise.all([api.listWorkflowTemplates(), api.listProjects()]);
    if (tplRes.data) setTemplates(tplRes.data);
    if (projRes.data) setProjects(projRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const template = templates.find((t) => t.id === selectedTemplate);

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
      api.streamJob(j.id, (p: JobProgress) => {
        setJob((prev) => (prev ? { ...prev, progress: p.progress } : null));
        // Poll for step-level detail
        pollSteps(j.id);
        if (p.progress >= 100) {
          setTimeout(() => {
            pollSteps(j.id);
            setJob(null);
          }, 500);
        }
      });
    }
  };

  const pollSteps = async (jobId: string) => {
    const res = await api.getWorkflowJob(jobId);
    if (res.data?.result) {
      setStepStatuses(res.data.result.steps);
    }
  };

  const needsSeries = template?.steps.some(
    (s) => s.kind === "scaffold" || s.kind === "pipeline" || s.kind === "check" || s.kind === "score",
  );
  const needsChapterEp = template?.steps.some((s) => s.kind === "scaffold");
  const needsMode = template?.steps.some((s) => s.kind === "pipeline" || s.kind === "check" || s.kind === "score");
  const needsTtsEngine = template?.steps.some((s) => s.kind === "tts");
  const needsImages = template?.steps.some((s) => s.kind === "image");

  const canTrigger = selectedTemplate && (!needsSeries || selectedSeries) && (!needsChapterEp || (chapter && episode)) && (!needsImages || imageItems.length > 0);

  if (loading) return <div style={{ color: "#666" }}>Loading...</div>;

  return (
    <div>
      <h2 style={{ margin: "0 0 16px" }}>Workflows</h2>

      {/* Template selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 4 }}>Template</label>
        <select
          value={selectedTemplate}
          onChange={(e) => { setSelectedTemplate(e.target.value); setStepStatuses([]); }}
          style={{ padding: "6px 12px", borderRadius: 6, fontSize: 14, minWidth: 300 }}
        >
          <option value="">Select template...</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.label} — {t.description}</option>
          ))}
        </select>
      </div>

      {template && (
        <div style={{ marginBottom: 16, padding: 12, background: "#f5f5f5", borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: "#555" }}>
            Steps: {template.steps.map((s) => s.label).join(" → ")}
          </div>
        </div>
      )}

      {/* Config form */}
      {template && (
        <div>
        <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          {needsSeries && (
            <div>
              <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 4 }}>Series</label>
              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: 6, fontSize: 14 }}
              >
                <option value="">Select...</option>
                {projects.map((p) => (
                  <option key={p.seriesId} value={p.seriesId}>{p.seriesId}</option>
                ))}
              </select>
            </div>
          )}

          {needsChapterEp && (
            <>
              <div>
                <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 4 }}>Chapter</label>
                <input
                  type="number" min={1} value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: 6, fontSize: 14, width: 80 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 4 }}>Episode</label>
                <input
                  type="number" min={1} value={episode}
                  onChange={(e) => setEpisode(e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: 6, fontSize: 14, width: 80 }}
                />
              </div>
            </>
          )}

          {needsMode && (
            <div>
              <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 4 }}>Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                style={{ padding: "6px 12px", borderRadius: 6, fontSize: 14 }}
              >
                <option value="hybrid">Hybrid</option>
                <option value="ai">AI</option>
                <option value="regex">Regex</option>
              </select>
            </div>
          )}

          {needsTtsEngine && (
            <div>
              <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 4 }}>TTS Engine</label>
              <select
                value={ttsEngine}
                onChange={(e) => setTtsEngine(e.target.value as any)}
                style={{ padding: "6px 12px", borderRadius: 6, fontSize: 14 }}
              >
                <option value="mlx">MLX (macOS)</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>
          )}

          {needsImages && (
            <>
              <div>
                <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 4 }}>Asset Type</label>
                <select
                  value={imageAssetType}
                  onChange={(e) => setImageAssetType(e.target.value as any)}
                  style={{ padding: "6px 12px", borderRadius: 6, fontSize: 14 }}
                >
                  <option value="characters">Characters</option>
                  <option value="backgrounds">Backgrounds</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 18 }}>
                <input
                  type="checkbox" checked={skipExistingImages}
                  onChange={(e) => setSkipExistingImages(e.target.checked)}
                  id="skipExistingImages"
                />
                <label htmlFor="skipExistingImages" style={{ fontSize: 13, color: "#555" }}>Skip existing</label>
              </div>
            </>
          )}
        </div>

        {/* Image list editor */}
        {needsImages && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Images ({imageItems.length})</span>
              <button
                onClick={() => setImageItems([...imageItems, { filename: "", prompt: "" }])}
                style={{ padding: "2px 10px", borderRadius: 4, border: "1px solid #ccc", background: "#fff", fontSize: 13, cursor: "pointer" }}
              >
                + Add
              </button>
            </div>
            {imageItems.map((item, idx) => (
              <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <input
                  placeholder="filename.png"
                  value={item.filename}
                  onChange={(e) => {
                    const next = [...imageItems];
                    next[idx] = { ...next[idx], filename: e.target.value };
                    setImageItems(next);
                  }}
                  style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", fontSize: 13, width: 150 }}
                />
                <input
                  placeholder="Prompt description..."
                  value={item.prompt}
                  onChange={(e) => {
                    const next = [...imageItems];
                    next[idx] = { ...next[idx], prompt: e.target.value };
                    setImageItems(next);
                  }}
                  style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", fontSize: 13, flex: 1 }}
                />
                <button
                  onClick={() => setImageItems(imageItems.filter((_, i) => i !== idx))}
                  style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #e5e7eb", background: "#fee2e2", color: "#991b1b", fontSize: 12, cursor: "pointer" }}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

          <button
            onClick={handleTrigger}
            disabled={!canTrigger || !!job}
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              border: "none",
              background: canTrigger && !job ? "#059669" : "#ccc",
              color: "#fff",
              cursor: canTrigger && !job ? "pointer" : "not-allowed",
              fontSize: 14,
            }}
          >
            Run Workflow
          </button>
        </div>
      )}

      {/* Overall progress */}
      {job && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>
            Workflow — {job.status} ({job.progress}%)
          </div>
          <div style={{ background: "#e5e7eb", borderRadius: 4, height: 10, overflow: "hidden" }}>
            <div style={{ background: "#059669", height: "100%", width: `${job.progress}%`, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {/* Per-step status */}
      {stepStatuses.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 14, margin: "0 0 8px" }}>Steps</h3>
          {stepStatuses.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, width: 160, flexShrink: 0 }}>{i + 1}. {step.label}</span>
              <div style={{ background: "#e5e7eb", borderRadius: 3, height: 6, flex: 1, overflow: "hidden" }}>
                <div style={{
                  background: stepColor(step.status),
                  height: "100%",
                  width: `${step.progress}%`,
                  transition: "width 0.3s",
                }} />
              </div>
              <span style={{
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 3,
                background: statusBg(step.status),
                color: statusColor(step.status),
                minWidth: 60,
                textAlign: "center",
              }}>
                {step.status}
              </span>
              {step.error && (
                <span style={{ fontSize: 11, color: "#dc2626" }}>{step.error}</span>
              )}
            </div>
          ))}
        </div>
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

function statusBg(status: string): string {
  switch (status) {
    case "completed": return "#dcfce7";
    case "running": return "#dbeafe";
    case "failed": return "#fee2e2";
    default: return "#f3f4f6";
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "completed": return "#166534";
    case "running": return "#1e40af";
    case "failed": return "#991b1b";
    default: return "#6b7280";
  }
}
