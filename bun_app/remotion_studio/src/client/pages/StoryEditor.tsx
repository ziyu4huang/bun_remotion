import { useState, useEffect, useRef, useCallback } from "react";
import { Button, PageHeader, SectionEditor, type ChatMessage } from "../components";
import { StoryEditorHints } from "../components/StoryEditorHints";
import { StoryEditorSections } from "../components/StoryEditorSections";
import { StoryEditorRevision } from "../components/StoryEditorRevision";
import { StoryArcTracker } from "../components/StoryArcTracker";
import { SceneReorderList } from "../components/SceneReorderList";
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
    storyArcs: { chapter: number; title: string; theme: string; episodes: { id: string; title: string; description: string }[] }[] | null;
    runningGags: { gagTypes: string[]; episodeColumns: string[] } | null;
    chapters: { chapter: number; episodeCount: number; completedCount: number; status: string }[];
  };
}

type ViewMode = "sections" | "structure" | "edit" | "preview" | "arcs";

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
  const [reorderMode, setReorderMode] = useState(false);
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
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: theme.spacing.sm }}>
            <Button
              variant={reorderMode ? "primary" : "outline"}
              size="sm"
              onClick={() => setReorderMode(!reorderMode)}
            >
              {t.storyEditor.reorderScenes}
            </Button>
          </div>
          {reorderMode ? (
            <SceneReorderList
              sections={planData.sections}
              raw={editContent}
              onReorder={(newRaw) => { setEditContent(newRaw); setDirty(true); autoSave(newRaw); }}
            />
          ) : (
            <>
              <StoryEditorHints data={planData} />
              <StoryEditorSections data={planData} />
            </>
          )}
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
      {planData && viewMode === "arcs" && (
        <StoryArcTracker
          storyArcs={planData.parsed.storyArcs ?? []}
          seriesId={selectedId}
          onSwitchToEdit={() => setViewMode("edit")}
        />
      )}

      {showRevisions && (
        <StoryEditorRevision
          revisions={revisions}
          selectedId={selectedId}
          viewingRev={viewingRev}
          revContent={revContent}
          onViewRev={(id, content) => { setViewingRev(id); setRevContent(content); }}
          onRestore={(content) => { setEditContent(content); setDirty(true); }}
          onCloseRev={() => { setViewingRev(null); setRevContent(null); }}
        />
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
    { id: "arcs", label: t.storyEditor.arcs },
  ];
  return (
    <div style={{ display: "flex", gap: 0, border: `1px solid ${theme.colors.border.medium}`, borderRadius: theme.radii.lg, overflow: "hidden" }}>
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={mode === tab.id ? "primary" : "outline"}
          size="sm"
          onClick={() => onChange(tab.id)}
          style={{
            borderRight: `1px solid ${theme.colors.border.medium}`,
          }}
        >
          {tab.label}
        </Button>
      ))}
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
