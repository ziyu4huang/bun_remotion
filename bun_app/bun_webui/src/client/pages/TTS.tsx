import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import type { Project, TTSStatus, Job, JobProgress } from "../../shared/types";

export function TTS() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<string>("");
  const [status, setStatus] = useState<TTSStatus | null>(null);
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
    const res = await api.getTtsStatus(episodeId);
    if (res.data) setStatus(res.data);
  }, []);

  useEffect(() => { loadStatus(selectedEpisode); }, [selectedEpisode, loadStatus]);

  const handleGenerate = async () => {
    if (!selectedEpisode) return;
    const res = await api.generateTTS(selectedEpisode, { skipExisting: true });
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

  // Flatten episodes from all projects
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
      <h2 style={{ margin: "0 0 16px" }}>TTS Generation</h2>

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
          onClick={handleGenerate}
          disabled={!selectedEpisode || !status?.hasNarration || !!job}
          style={{
            padding: "6px 16px",
            borderRadius: 6,
            border: "none",
            background: selectedEpisode && status?.hasNarration && !job ? "#3b82f6" : "#ccc",
            color: "#fff",
            cursor: selectedEpisode && status?.hasNarration && !job ? "pointer" : "not-allowed",
            fontSize: 14,
          }}
        >
          Generate TTS
        </button>
      </div>

      {status && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
            <Badge label="Narration" active={status.hasNarration} />
            <Badge label="Audio" active={status.hasAudio} />
          </div>

          {status.voiceMap && (
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
              Voices: {Object.entries(status.voiceMap).map(([c, v]) => `${c}→${v}`).join(", ")}
            </div>
          )}

          {!status.hasNarration && (
            <div style={{ color: "#ef4444", fontSize: 13 }}>
              No narration.ts found. Run scaffold first.
            </div>
          )}
        </div>
      )}

      {job && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>
            {job.type} — {job.status} ({job.progress}%)
          </div>
          <div style={{ background: "#e5e7eb", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{ background: "#3b82f6", height: "100%", width: `${job.progress}%`, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {status && status.audioFiles.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, margin: "0 0 8px" }}>Audio Files ({status.audioFiles.length})</h3>
          {status.audioFiles.map((file) => (
            <div key={file} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#777", minWidth: 160 }}>{file}</span>
              <audio
                controls
                src={api.assetFileUrl(status.episodeId + "/public/audio/" + file)}
                style={{ height: 32 }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span style={{
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 12,
      background: active ? "#dcfce7" : "#fee2e2",
      color: active ? "#166534" : "#991b1b",
    }}>
      {label}: {active ? "Yes" : "No"}
    </span>
  );
}
