import { useState, useEffect, useRef, useCallback } from "react";

interface PlanListItem {
  seriesId: string;
  seriesName: string;
  hasPlan: boolean;
}

interface PlanSection {
  key: string;
  title: string;
  body: string;
}

interface PlanData {
  seriesId: string;
  raw: string;
  sections: PlanSection[];
  parsed: {
    seriesId: string;
    seriesName: string;
    characters: { id: string; name: string; voice: string; gender: string; color: string | null }[] | null;
    episodeGuide: { id: string; title: string; status: string; chapter: number | null; episode: number | null }[] | null;
    storyArcs: { chapter: number; title: string; theme: string }[] | null;
    runningGags: { gagTypes: string[]; episodeColumns: string[] } | null;
    chapters: { chapter: number; episodeCount: number; completedCount: number; status: string }[];
  };
}

type ViewMode = "edit" | "preview" | "sections";

export function StoryEditor() {
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [editContent, setEditContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("sections");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok && res.data) {
          setPlans(res.data);
          if (res.data.length > 0 && !selectedId) {
            setSelectedId(res.data[0].seriesId);
          }
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/plans/${selectedId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok && res.data) {
          setPlanData(res.data);
          setEditContent(res.data.raw);
          setDirty(false);
          setLastSaved(null);
        }
      });
  }, [selectedId]);

  const autoSave = useCallback((content: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        const r = await fetch(`/api/plans/${selectedId}/raw`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        const res = await r.json();
        if (res.ok) {
          setLastSaved(new Date().toLocaleTimeString());
          setDirty(false);
        }
      } finally {
        setSaving(false);
      }
    }, 1500);
  }, [selectedId]);

  const handleEdit = (value: string) => {
    setEditContent(value);
    setDirty(true);
    autoSave(value);
  };

  const handleSave = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    try {
      const r = await fetch(`/api/plans/${selectedId}/raw`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      const res = await r.json();
      if (res.ok) {
        setLastSaved(new Date().toLocaleTimeString());
        setDirty(false);
        // Refresh parsed data
        const refresh = await fetch(`/api/plans/${selectedId}`);
        const refreshRes = await refresh.json();
        if (refreshRes.ok && refreshRes.data) setPlanData(refreshRes.data);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Story Editor</h2>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: 6, fontSize: 14 }}
        >
          {plans.map((p) => (
            <option key={p.seriesId} value={p.seriesId}>
              {p.seriesName}
            </option>
          ))}
        </select>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#666" }}>
          {dirty && <span style={{ color: "#f57c00" }}>Unsaved</span>}
          {saving && <span style={{ color: "#1976d2" }}>Saving...</span>}
          {lastSaved && !dirty && <span style={{ color: "#388e3c" }}>Saved {lastSaved}</span>}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              border: "1px solid #1976d2",
              background: dirty ? "#1976d2" : "#e0e0e0",
              color: dirty ? "#fff" : "#999",
              cursor: dirty ? "pointer" : "default",
              fontSize: 13,
            }}
          >
            Save
          </button>
        </div>
      </div>

      {planData && viewMode === "sections" && (
        <SectionsView data={planData} />
      )}
      {planData && viewMode === "edit" && (
        <MarkdownEditor value={editContent} onChange={handleEdit} />
      )}
      {planData && viewMode === "preview" && (
        <MarkdownPreview raw={editContent} />
      )}
    </div>
  );
}

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const tabs: { id: ViewMode; label: string }[] = [
    { id: "sections", label: "Sections" },
    { id: "edit", label: "Edit" },
    { id: "preview", label: "Preview" },
  ];
  return (
    <div style={{ display: "flex", gap: 0, border: "1px solid #ddd", borderRadius: 6, overflow: "hidden" }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: "6px 14px",
            border: "none",
            background: mode === t.id ? "#e3f2fd" : "#fff",
            cursor: "pointer",
            fontSize: 13,
            borderRight: "1px solid #ddd",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function SectionsView({ data }: { data: PlanData }) {
  const { parsed } = data;
  return (
    <div style={{ display: "grid", gap: 20 }}>
      {parsed.characters && parsed.characters.length > 0 && (
        <SectionCard title={`Characters (${parsed.characters.length})`}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Voice</th>
                <th style={thStyle}>Gender</th>
                <th style={thStyle}>Color</th>
              </tr>
            </thead>
            <tbody>
              {parsed.characters.map((c) => (
                <tr key={c.id}>
                  <td style={tdStyle}>{c.id}</td>
                  <td style={tdStyle}>{c.name}</td>
                  <td style={tdStyle}>{c.voice}</td>
                  <td style={tdStyle}>{c.gender}</td>
                  <td style={tdStyle}>{c.color ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {parsed.episodeGuide && parsed.episodeGuide.length > 0 && (
        <SectionCard title={`Episode Guide (${parsed.episodeGuide.length})`}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {parsed.episodeGuide.map((ep) => (
                <tr key={ep.id}>
                  <td style={tdStyle}><code>{ep.id}</code></td>
                  <td style={tdStyle}>{ep.title}</td>
                  <td style={tdStyle}><StatusBadge status={ep.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {parsed.chapters.length > 0 && (
        <SectionCard title={`Chapters (${parsed.chapters.length})`}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {parsed.chapters.map((ch) => (
              <div
                key={ch.chapter}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  background: ch.status === "complete" ? "#e8f5e9" : ch.status === "in_progress" ? "#fff3e0" : "#f5f5f5",
                  border: "1px solid #ddd",
                  minWidth: 140,
                }}
              >
                <div style={{ fontWeight: 600 }}>Chapter {ch.chapter}</div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {ch.completedCount}/{ch.episodeCount} done
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {parsed.storyArcs && parsed.storyArcs.length > 0 && (
        <SectionCard title={`Story Arcs (${parsed.storyArcs.length})`}>
          {parsed.storyArcs.map((arc) => (
            <div key={arc.chapter} style={{ marginBottom: 8, padding: "8px 12px", background: "#f5f5f5", borderRadius: 6 }}>
              <strong>Chapter {arc.chapter}: {arc.title}</strong>
              {arc.theme && <span style={{ marginLeft: 8, color: "#666", fontSize: 13 }}>({arc.theme})</span>}
            </div>
          ))}
        </SectionCard>
      )}

      {parsed.runningGags && (
        <SectionCard title={`Running Gags (${parsed.runningGags.gagTypes.length})`}>
          <div style={{ fontSize: 13, color: "#666" }}>
            {parsed.runningGags.gagTypes.join(", ")}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", background: "#fafafa", borderBottom: "1px solid #e0e0e0", fontWeight: 600, fontSize: 14 }}>
        {title}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const bg = lower.includes("complete") || lower.includes("rendered") ? "#e8f5e9"
    : lower.includes("planned") ? "#f5f5f5"
    : lower.includes("progress") ? "#fff3e0"
    : "#e3f2fd";
  return (
    <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 12, background: bg }}>
      {status}
    </span>
  );
}

function MarkdownEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        minHeight: "70vh",
        fontFamily: "monospace",
        fontSize: 13,
        padding: 16,
        border: "1px solid #ddd",
        borderRadius: 8,
        resize: "vertical",
        lineHeight: 1.6,
        tabSize: 2,
      }}
      spellCheck={false}
    />
  );
}

function MarkdownPreview({ raw }: { raw: string }) {
  const lines = raw.split("\n");
  return (
    <div
      style={{
        padding: 24,
        border: "1px solid #ddd",
        borderRadius: 8,
        background: "#fff",
        lineHeight: 1.7,
        fontSize: 14,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i} style={{ borderBottom: "1px solid #eee", paddingBottom: 8 }}>{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} style={{ marginTop: 24, color: "#333" }}>{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} style={{ marginTop: 16, color: "#555" }}>{line.slice(4)}</h3>;
        if (line.startsWith("|")) return <div key={i} style={{ fontFamily: "monospace", fontSize: 12, color: "#444" }}>{line}</div>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} style={{ marginLeft: 16 }}>• {line.slice(2)}</div>;
        if (line.trim() === "") return <br key={i} />;
        return <div key={i}>{line}</div>;
      })}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  borderBottom: "2px solid #e0e0e0",
  fontWeight: 600,
  fontSize: 13,
};

const tdStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderBottom: "1px solid #f0f0f0",
  fontSize: 13,
};
