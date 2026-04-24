import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import type { Project, RenderStatus, Job, JobProgress } from "../../shared/types";

export function Render() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<string>("");
  const [status, setStatus] = useState<RenderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);

  const loadProjects = useCallback(async () => {
    const res = await api.listProjects();
    if (res.data) setProjects(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const loadStatus = useCallback(async (episodeId: string) => {
    if (!episodeId) { setStatus(null); return; }
    const res = await api.getRenderStatus(episodeId);
    if (res.data) setStatus(res.data);
  }, []);

  useEffect(() => { loadStatus(selectedEpisode); }, [selectedEpisode, loadStatus]);

  const handleRender = async () => {
    if (!selectedEpisode) return;
    const res = await api.triggerRender(selectedEpisode);
    if (res.data) {
      setJob(res.data);
      api.streamJob(res.data.id, (p: JobProgress) => {
        setJob((prev) => prev ? { ...prev, progress: p.progress } : null);
        if (p.progress >= 100) {
          loadStatus(selectedEpisode);
          setJob(null);
        }
      });
    }
  };

  // Flatten scaffolded episodes
  const episodes: { id: string; label: string }[] = [];
  for (const p of projects) {
    for (const ep of p.episodes) {
      if (ep.hasScaffold) {
        episodes.push({ id: `${p.seriesId}/${ep.id}`, label: `${p.seriesId}/${ep.id}` });
      }
    }
  }

  if (loading) return <div style={{ color: "#666" }}>Loading...</div>;

  return (
    <div>
      <h2 style={{ margin: "0 0 16px" }}>Render</h2>

      <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
        <select
          value={selectedEpisode}
          onChange={(e) => setSelectedEpisode(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: 6, fontSize: 14, minWidth: 300 }}
        >
          <option value="">Select episode...</option>
          {episodes.map((ep) => (
            <option key={ep.id} value={ep.id}>{ep.label}</option>
          ))}
        </select>

        <button
          onClick={handleRender}
          disabled={!selectedEpisode || !!job}
          style={{
            padding: "6px 16px",
            borderRadius: 6,
            border: "none",
            background: selectedEpisode && !job ? "#8b5cf6" : "#ccc",
            color: "#fff",
            cursor: selectedEpisode && !job ? "pointer" : "not-allowed",
            fontSize: 14,
          }}
        >
          Render MP4
        </button>
      </div>

      {status && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
            <span style={{
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 12,
              background: status.hasRender ? "#dcfce7" : "#fee2e2",
              color: status.hasRender ? "#166534" : "#991b1b",
            }}>
              {status.hasRender ? "Rendered" : "Not rendered"}
            </span>
            {status.fileSize && (
              <span style={{ fontSize: 12, color: "#666" }}>
                {formatSize(status.fileSize)}
              </span>
            )}
            {status.modifiedAt && (
              <span style={{ fontSize: 12, color: "#999" }}>
                {new Date(status.modifiedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}

      {job && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>
            {job.type} — {job.status} ({job.progress}%)
          </div>
          <div style={{ background: "#e5e7eb", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{ background: "#8b5cf6", height: "100%", width: `${job.progress}%`, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {status?.hasRender && selectedEpisode && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 14, margin: "0 0 8px" }}>Preview</h3>
          <video
            controls
            src={api.renderPreviewUrl(selectedEpisode)}
            style={{ width: "100%", maxWidth: 640, borderRadius: 8, background: "#000" }}
          />
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
