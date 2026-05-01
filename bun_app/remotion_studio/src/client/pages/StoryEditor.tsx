import { useState, useEffect, useRef, useCallback } from "react";
import { Button, PageHeader, StatusBadge, SectionEditor, type ChatMessage, loadHistory, saveHistory } from "../components";
import { AdvisorPanelBase } from "../components/AdvisorPanelBase";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";

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

type ViewMode = "sections" | "structure" | "edit" | "preview";

export function StoryEditor() {
  const theme = useTheme();
  const { t } = useI18n();
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [editContent, setEditContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("sections");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [advisorMsgs, setAdvisorMsgs] = useState<ChatMessage[]>([]);
  const [revisions, setRevisions] = useState<{ id: string; timestamp: string; size: number }[]>([]);
  const [viewingRev, setViewingRev] = useState<string | null>(null);
  const [revContent, setRevContent] = useState<string | null>(null);
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

  const handleStructureChange = (newMd: string) => {
    setEditContent(newMd);
    setDirty(true);
    autoSave(newMd);
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
    <div style={{ display: "flex", gap: theme.spacing.xl }}>
      <div style={{ flex: 1 }}>
      <PageHeader title={t.storyEditor.title} description={t.storyEditor.description}>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{ padding: `6px ${theme.spacing.md}px`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md }}
        >
          {plans.map((p) => (
            <option key={p.seriesId} value={p.seriesId}>
              {p.seriesName}
            </option>
          ))}
        </select>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvisor(!showAdvisor)}
        >
          {showAdvisor ? t.storyEditor.hideAdvisor : t.storyEditor.askAdvisor}
        </Button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: theme.spacing.sm, fontSize: theme.font.sizes.base, color: theme.colors.text.tertiary }}>
          {dirty && <span style={{ color: theme.colors.warning }}>{t.storyEditor.unsaved}</span>}
          {saving && <span style={{ color: theme.colors.primary }}>{t.storyEditor.saving}</span>}
          {lastSaved && !dirty && <span style={{ color: "#388e3c" }}>{t.storyEditor.saved} {lastSaved}</span>}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {t.storyEditor.save}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              setShowRevisions(!showRevisions);
              if (!showRevisions && selectedId) {
                const res = await fetch(`/api/plans/${selectedId}/revisions`);
                const data = await res.json();
                if (data.ok) setRevisions(data.data);
              }
            }}
          >
            {showRevisions ? t.storyEditor.hideHistory : t.storyEditor.history}
          </Button>
        </div>
      </PageHeader>

      {planData && viewMode === "sections" && (
        <>
          <QualityHints data={planData} />
          <SectionsView data={planData} />
        </>
      )}
      {planData && viewMode === "structure" && (
        <SectionEditor
          sections={planData.sections}
          fullMarkdown={editContent}
          onSectionChange={handleStructureChange}
        />
      )}
      {planData && viewMode === "edit" && (
        <MarkdownEditor value={editContent} onChange={handleEdit} />
      )}
      {planData && viewMode === "preview" && (
        <MarkdownPreview raw={editContent} />
      )}

      {/* Revision History */}
      {showRevisions && (
        <div style={{
          marginTop: theme.spacing.lg,
          border: `1px solid ${theme.colors.border.default}`, borderRadius: theme.radii.lg,
          overflow: "hidden",
        }}>
          <div style={{ padding: "10px 14px", background: theme.colors.bg.muted, fontWeight: theme.font.weights.medium, fontSize: theme.font.sizes.sm }}>
            {t.storyEditor.revisionHistory} ({revisions.length})
          </div>
          <div style={{ padding: 14, maxHeight: 400, overflowY: "auto" }}>
            {viewingRev && revContent !== null && (
              <div style={{ marginBottom: 14, padding: 10, border: `1px solid ${theme.colors.info}33`, borderRadius: theme.radii.md, background: `${theme.colors.info}08` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: theme.font.weights.medium, fontSize: theme.font.sizes.sm }}>{t.storyEditor.viewing} {viewingRev}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button variant="primary" size="sm" onClick={() => { setEditContent(revContent); setDirty(true); }}>
                      {t.storyEditor.restore}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setViewingRev(null); setRevContent(null); }}>
                      {t.storyEditor.close}
                    </Button>
                  </div>
                </div>
                <pre style={{ fontSize: theme.font.sizes.xs, maxHeight: 200, overflowY: "auto", whiteSpace: "pre-wrap", margin: 0 }}>
                  {revContent.slice(0, 2000)}{revContent.length > 2000 ? "..." : ""}
                </pre>
              </div>
            )}
            {revisions.length === 0 ? (
              <div style={{ color: theme.colors.text.muted, fontSize: theme.font.sizes.sm }}>{t.storyEditor.noRevisions}</div>
            ) : (
              revisions.map((rev) => (
                <Button key={rev.id} variant="ghost" size="sm" onClick={async () => {
                  const res = await fetch(`/api/plans/${selectedId}/revisions/${rev.id}`);
                  const data = await res.json();
                  if (data.ok) { setViewingRev(rev.id); setRevContent(data.data); }
                }} style={{
                  display: "block", width: "100%", textAlign: "left",
                  marginBottom: 4,
                }}>
                  <span style={{ color: theme.colors.text.secondary }}>{rev.id.replace(/-/g, (m, o) => o < 10 ? "-" : o === 10 ? " " : o < 19 ? ":" : "")}</span>
                  <span style={{ marginLeft: 8, color: theme.colors.text.tertiary, fontSize: theme.font.sizes.xs }}>
                    {Math.round(rev.size / 1024)}KB
                  </span>
                </Button>
              ))
            )}
          </div>
        </div>
      )}
      </div>
      {showAdvisor && (
        <AdvisorPanelBase
          agentName="sg-story-advisor"
          title={t.storyEditor.advisor}
          titleColor={theme.colors.primaryDark}
          contextLabel={plans.find((p) => p.seriesId === selectedId)?.seriesName ?? t.storyEditor.title}
          historyKey="story-editor-advisor"
          systemPrefix={`Context: Story Editor. Series: ${selectedId || "none"}. Assisting with narrative structure and character development.`}
          placeholder={t.storyEditor.advisorPlaceholder}
          messages={advisorMsgs}
          setMessages={setAdvisorMsgs}
          preferredAgents={["sg-story-advisor", "studio-advisor"]}
        />
      )}
    </div>
  );
}

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  const tabs: { id: ViewMode; label: string }[] = [
    { id: "sections", label: t.storyEditor.sections },
    { id: "structure", label: t.storyEditor.structure },
    { id: "edit", label: t.storyEditor.raw },
    { id: "preview", label: t.storyEditor.preview },
  ];
  return (
    <div style={{ display: "flex", gap: 0, border: `1px solid ${theme.colors.border.medium}`, borderRadius: theme.radii.lg, overflow: "hidden" }}>
      {tabs.map((t) => (
        <Button
          key={t.id}
          variant="outline"
          size="sm"
          onClick={() => onChange(t.id)}
          style={{
            borderRight: `1px solid ${theme.colors.border.medium}`,
          }}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
}

function QualityHints({ data }: { data: PlanData }) {
  const theme = useTheme();
  const { t } = useI18n();
  const hints: { icon: string; msg: string; level: "warn" | "info" }[] = [];
  const { parsed } = data;

  if (!parsed.characters || parsed.characters.length === 0) {
    hints.push({ icon: "!", msg: "No characters defined. Add a ## Characters section with id, name, voice, gender columns.", level: "warn" });
  } else {
    const missingVoice = parsed.characters.filter((c) => !c.voice);
    if (missingVoice.length > 0) {
      hints.push({ icon: "!", msg: `${missingVoice.length} character(s) missing voice assignment: ${missingVoice.map((c) => c.name).join(", ")}`, level: "warn" });
    }
    const missingColor = parsed.characters.filter((c) => !c.color);
    if (missingColor.length > 0) {
      hints.push({ icon: "i", msg: `${missingColor.length} character(s) missing color: ${missingColor.map((c) => c.name).join(", ")}`, level: "info" });
    }
  }

  if (!parsed.episodeGuide || parsed.episodeGuide.length === 0) {
    hints.push({ icon: "!", msg: "No episode guide defined. Add a ## Episode Guide section.", level: "warn" });
  } else {
    const pending = parsed.episodeGuide.filter((e) => e.status === "pending" || e.status === "planned");
    if (pending.length > 0) {
      hints.push({ icon: "i", msg: `${pending.length} episode(s) still pending/planned`, level: "info" });
    }
  }

  if (!parsed.storyArcs || parsed.storyArcs.length === 0) {
    hints.push({ icon: "i", msg: "No story arcs defined. Consider adding a ## Story Arcs section for continuity tracking.", level: "info" });
  }

  if (parsed.chapters.length === 0) {
    hints.push({ icon: "!", msg: "No chapters detected. Ensure episode IDs follow the pattern: series-chN-epM.", level: "warn" });
  }

  if (hints.length === 0) return null;

  return (
    <div style={{
      marginBottom: theme.spacing.lg,
      border: `1px solid ${theme.colors.warningLight}`, borderRadius: theme.radii.lg,
      overflow: "hidden",
    }}>
      <div style={{ padding: "8px 14px", background: theme.colors.warningLight, fontWeight: theme.font.weights.medium, fontSize: theme.font.sizes.sm }}>
        {t.storyEditor.qualityHints} ({hints.length})
      </div>
      <div style={{ padding: "8px 14px" }}>
        {hints.map((h, i) => (
          <div key={i} style={{
            display: "flex", gap: 8, alignItems: "flex-start",
            marginBottom: i < hints.length - 1 ? 6 : 0,
            fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary,
          }}>
            <span style={{
              flexShrink: 0, width: 18, height: 18, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: h.level === "warn" ? theme.colors.warningLight : theme.colors.info + "22",
              color: h.level === "warn" ? theme.colors.warningDark : theme.colors.info,
              fontSize: 11, fontWeight: 700,
            }}>
              {h.icon}
            </span>
            {h.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionsView({ data }: { data: PlanData }) {
  const theme = useTheme();
  const { t } = useI18n();
  const { parsed } = data;
  return (
    <div style={{ display: "grid", gap: theme.spacing.xl }}>
      {parsed.characters && parsed.characters.length > 0 && (
        <SectionCard title={`${t.storyEditor.characters} (${parsed.characters.length})`}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.base }}>
            <thead>
              <tr>
                <th style={thStyle(theme)}>ID</th>
                <th style={thStyle(theme)}>Name</th>
                <th style={thStyle(theme)}>Voice</th>
                <th style={thStyle(theme)}>Gender</th>
                <th style={thStyle(theme)}>Color</th>
              </tr>
            </thead>
            <tbody>
              {parsed.characters.map((c) => (
                <tr key={c.id}>
                  <td style={tdStyle(theme)}>{c.id}</td>
                  <td style={tdStyle(theme)}>{c.name}</td>
                  <td style={tdStyle(theme)}>{c.voice}</td>
                  <td style={tdStyle(theme)}>{c.gender}</td>
                  <td style={tdStyle(theme)}>{c.color ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {parsed.episodeGuide && parsed.episodeGuide.length > 0 && (
        <SectionCard title={`${t.storyEditor.episodeGuide} (${parsed.episodeGuide.length})`}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.base }}>
            <thead>
              <tr>
                <th style={thStyle(theme)}>ID</th>
                <th style={thStyle(theme)}>Title</th>
                <th style={thStyle(theme)}>Status</th>
              </tr>
            </thead>
            <tbody>
              {parsed.episodeGuide.map((ep) => (
                <tr key={ep.id}>
                  <td style={tdStyle(theme)}><code>{ep.id}</code></td>
                  <td style={tdStyle(theme)}>{ep.title}</td>
                  <td style={tdStyle(theme)}><StatusBadge status={ep.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {parsed.chapters.length > 0 && (
        <SectionCard title={`${t.storyEditor.chapters} (${parsed.chapters.length})`}>
          <div style={{ display: "flex", gap: theme.spacing.md, flexWrap: "wrap" }}>
            {parsed.chapters.map((ch) => (
              <div
                key={ch.chapter}
                style={{
                  padding: `10px ${theme.spacing.xl}px`,
                  borderRadius: theme.radii.xl,
                  background: ch.status === "complete" ? theme.colors.successLight : ch.status === "in_progress" ? theme.colors.warningLight : theme.colors.bg.muted,
                  border: `1px solid ${theme.colors.border.medium}`,
                  minWidth: 140,
                }}
              >
                <div style={{ fontWeight: theme.font.weights.semibold }}>Chapter {ch.chapter}</div>
                <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary }}>
                  {ch.completedCount}/{ch.episodeCount} done
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {parsed.storyArcs && parsed.storyArcs.length > 0 && (
        <SectionCard title={`${t.storyEditor.storyArcs} (${parsed.storyArcs.length})`}>
          {parsed.storyArcs.map((arc) => (
            <div key={arc.chapter} style={{ marginBottom: theme.spacing.sm, padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, background: theme.colors.bg.muted, borderRadius: theme.radii.lg }}>
              <strong>Chapter {arc.chapter}: {arc.title}</strong>
              {arc.theme && <span style={{ marginLeft: theme.spacing.sm, color: theme.colors.text.tertiary, fontSize: theme.font.sizes.base }}>({arc.theme})</span>}
            </div>
          ))}
        </SectionCard>
      )}

      {parsed.runningGags && (
        <SectionCard title={`${t.storyEditor.runningGags} (${parsed.runningGags.gagTypes.length})`}>
          <div style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.tertiary }}>
            {parsed.runningGags.gagTypes.join(", ")}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <div style={{ border: `1px solid ${theme.colors.border.default}`, borderRadius: theme.radii.xl, overflow: "hidden" }}>
      <div style={{ padding: `10px ${theme.spacing.xl}px`, background: theme.colors.bg.surface, borderBottom: `1px solid ${theme.colors.border.default}`, fontWeight: theme.font.weights.semibold, fontSize: theme.font.sizes.md }}>
        {title}
      </div>
      <div style={{ padding: theme.spacing.xl }}>{children}</div>
    </div>
  );
}

function MarkdownEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const theme = useTheme();
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        minHeight: "70vh",
        fontFamily: theme.font.mono,
        fontSize: theme.font.sizes.base,
        padding: theme.spacing.xl,
        border: `1px solid ${theme.colors.border.medium}`,
        borderRadius: theme.radii.xl,
        resize: "vertical",
        lineHeight: 1.6,
        tabSize: 2,
      }}
      spellCheck={false}
    />
  );
}

function MarkdownPreview({ raw }: { raw: string }) {
  const theme = useTheme();
  const lines = raw.split("\n");
  return (
    <div
      style={{
        padding: theme.spacing.xxl,
        border: `1px solid ${theme.colors.border.medium}`,
        borderRadius: theme.radii.xl,
        background: theme.colors.bg.page,
        lineHeight: 1.7,
        fontSize: theme.font.sizes.md,
        fontFamily: theme.font.family,
      }}
    >
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i} style={{ borderBottom: `1px solid ${theme.colors.border.light}`, paddingBottom: theme.spacing.sm }}>{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} style={{ marginTop: theme.spacing.xxl, color: theme.colors.text.primary }}>{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} style={{ marginTop: theme.spacing.xl, color: theme.colors.text.secondary }}>{line.slice(4)}</h3>;
        if (line.startsWith("|")) return <div key={i} style={{ fontFamily: theme.font.mono, fontSize: theme.font.sizes.sm, color: "#444" }}>{line}</div>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} style={{ marginLeft: theme.spacing.xl }}>• {line.slice(2)}</div>;
        if (line.trim() === "") return <br key={i} />;
        return <div key={i}>{line}</div>;
      })}
    </div>
  );
}

function thStyle(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    textAlign: "left",
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    borderBottom: `2px solid ${theme.colors.border.default}`,
    fontWeight: theme.font.weights.semibold,
    fontSize: theme.font.sizes.base,
  };
}

function tdStyle(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    padding: `6px ${theme.spacing.md}px`,
    borderBottom: `1px solid ${theme.colors.border.light}`,
    fontSize: theme.font.sizes.base,
  };
}
