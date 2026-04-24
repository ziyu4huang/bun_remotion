import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import type { Project, Job } from "../../shared/types";

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.listProjects();
    if (res.data) setProjects(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ color: "#666" }}>Loading projects...</div>;

  if (view === "create") {
    return <CreateProject onBack={() => setView("list")} onCreated={load} />;
  }

  if (view === "detail" && selectedId) {
    const project = projects.find((p) => p.id === selectedId);
    if (project) {
      return <ProjectDetail project={project} onBack={() => setView("list")} />;
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Projects ({projects.length})</h2>
        <button
          onClick={() => setView("create")}
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

function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", color: "#1976d2", marginBottom: 16, padding: 0, fontSize: 14 }}>
        &larr; Back to list
      </button>
      <h2 style={{ marginBottom: 8 }}>{project.name}</h2>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, color: "#666", fontSize: 14 }}>
        <span>Category: <b>{CATEGORY_LABELS[project.category] ?? project.category}</b></span>
        <span>Episodes: <b>{project.episodeCount}</b></span>
        <span>Gate: <ScoreBadge score={project.gateScore} /></span>
        <span>Plan: {project.hasPlan ? "Yes" : "No"}</span>
      </div>

      {project.episodes.length === 0 ? (
        <div style={{ color: "#999", fontStyle: "italic" }}>No episodes found (broken symlinks or empty series)</div>
      ) : (
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
            </tr>
          </thead>
          <tbody>
            {project.episodes.map((ep) => (
              <tr key={ep.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "8px 12px", fontWeight: 500 }}>{ep.id}</td>
                <td style={{ padding: "8px 12px" }}>{ep.chapter ?? "—"}</td>
                <td style={{ padding: "8px 12px" }}>{ep.episode ?? "—"}</td>
                <td style={{ padding: "8px 12px" }}>{ep.hasScaffold ? "Yes" : "—"}</td>
                <td style={{ padding: "8px 12px" }}>{ep.hasTTS ? "Yes" : "—"}</td>
                <td style={{ padding: "8px 12px" }}>{ep.hasRender ? "Yes" : "—"}</td>
                <td style={{ padding: "8px 12px" }}><ScoreBadge score={ep.gateScore} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CreateProject({ onBack, onCreated }: { onBack: () => void; onCreated: () => void }) {
  const [series, setSeries] = useState("");
  const [chapter, setChapter] = useState("");
  const [episode, setEpisode] = useState("");
  const [scenes, setScenes] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const res = await api.scaffold({
      series: series.trim(),
      chapter: chapter ? +chapter : undefined,
      episode: episode ? +episode : undefined,
      scenes: scenes ? +scenes : undefined,
      dryRun,
    });
    if (!res.ok) {
      setError(res.error ?? "Unknown error");
      return;
    }
    setJob(res.data);

    // Stream progress
    api.streamJob(res.data.id, (p) => {
      setProgress(p.progress);
    });

    // Poll for completion
    const poll = setInterval(async () => {
      const status = await api.getJob(res.data.id);
      if (status.data?.status === "completed" || status.data?.status === "failed") {
        clearInterval(poll);
        setJob(status.data);
        if (status.data.status === "completed") onCreated();
      }
    }, 500);
  };

  return (
    <div>
      <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", color: "#1976d2", marginBottom: 16, padding: 0, fontSize: 14 }}>
        &larr; Back to list
      </button>
      <h2 style={{ marginBottom: 20 }}>Create Episode</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
        <label style={{ fontSize: 14 }}>
          Series ID *
          <input
            value={series}
            onChange={(e) => setSeries(e.target.value)}
            placeholder="weapon-forger"
            style={{ display: "block", width: "100%", padding: "8px 12px", marginTop: 4, border: "1px solid #ccc", borderRadius: 6, fontSize: 14 }}
          />
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ flex: 1, fontSize: 14 }}>
            Chapter
            <input
              type="number"
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
            {job.status === "completed" && <div style={{ color: "#2e7d32", marginTop: 4 }}>Scaffold complete!</div>}
            {job.status === "failed" && <div style={{ color: "#d32f2f", marginTop: 4 }}>{job.error}</div>}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!series.trim() || job?.status === "running"}
          style={{
            padding: "10px 20px",
            background: series.trim() ? "#1976d2" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: series.trim() ? "pointer" : "default",
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

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined) return <span style={{ color: "#999" }}>—</span>;
  const color = score >= 70 ? "#2e7d32" : score >= 40 ? "#f57c00" : "#d32f2f";
  return <span style={{ color, fontWeight: 600 }}>{score}/100</span>;
}
