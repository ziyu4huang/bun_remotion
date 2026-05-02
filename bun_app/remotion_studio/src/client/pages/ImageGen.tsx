import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { PageHeader, LoadingSpinner, Button, type ChatMessage, loadHistory, saveHistory } from "../components";
import { ImageDesignBrief, type DesignBrief, EMPTY_BRIEF, briefToPrompt } from "../components/ImageDesignBrief";
import { ImageVariantGallery } from "../components/ImageVariantGallery";
import { AdvisorPanelBase } from "../components/AdvisorPanelBase";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import type { Project, ImageStatus, Job, JobProgress, CharacterProfile } from "../../shared/types";

type AssetKind = "character" | "background";

export function ImageGen() {
  const theme = useTheme();
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedSeries, setSelectedSeries] = useState("");
  const [status, setStatus] = useState<ImageStatus | null>(null);
  const [kind, setKind] = useState<AssetKind>("character");
  const [prompt, setPrompt] = useState("");
  const [filename, setFilename] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [skipExisting, setSkipExisting] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState<DesignBrief>({ ...EMPTY_BRIEF });

  const [profiles, setProfiles] = useState<CharacterProfile[]>([]);
  const [selectedCharId, setSelectedCharId] = useState("");
  const [facing, setFacing] = useState<"LEFT" | "RIGHT">("LEFT");
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [advisorMsgs, setAdvisorMsgs] = useState<ChatMessage[]>([]);

  const loadProjects = useCallback(async () => {
    const res = await api.listProjects();
    if (res.data) setProjects(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const loadStatus = useCallback(async () => {
    if (!selectedSeries) { setStatus(null); return; }
    const res = await api.getImageStatus(selectedSeries);
    if (res.data) setStatus(res.data);
  }, [selectedSeries]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  useEffect(() => {
    if (!selectedSeries || kind !== "character") {
      setProfiles([]);
      setSelectedCharId("");
      return;
    }
    api.getCharacterProfiles(selectedSeries).then((res) => {
      setProfiles(res.data ?? []);
    });
    setSelectedCharId("");
  }, [selectedSeries, kind]);

  const selectedChar = profiles.find((p) => p.id === selectedCharId) ?? null;

  const handleSelectChar = (charId: string) => {
    setSelectedCharId(charId);
    if (!charId) return;
    const char = profiles.find((p) => p.id === charId);
    if (!char) return;
    if (char.basePrompt) setPrompt(char.basePrompt);
    else if (char.appearance) setPrompt(char.appearance);
    if (char.variants.length > 0) setFacing(char.variants[0].facing === "RIGHT" ? "RIGHT" : "LEFT");
    setFilename((prev) => {
      const existing = prev.replace(/^[a-z]+-/, "");
      return `${charId}-${existing || "new.png"}`;
    });
  };

  const handleApplyBrief = () => {
    const generated = briefToPrompt(brief);
    if (generated) {
      setPrompt(generated);
      if (brief.name && !filename) {
        setFilename(`${brief.name.toLowerCase().replace(/\s+/g, "-")}-new.png`);
      }
    }
  };

  const handleGenerate = async () => {
    if (!selectedSeries || !prompt || !filename) return;
    const res = await api.generateImages({
      seriesId: selectedSeries,
      images: [{ filename, prompt, aspectRatio }],
      skipExisting,
      ...(kind === "character" && selectedCharId ? { enhanceWithCharacter: { facing } } : {}),
    });
    if (res.data) {
      setJob(res.data);
      api.streamJob(res.data.id, (p: JobProgress) => {
        setJob((prev) => prev ? { ...prev, progress: p.progress } : null);
        if (p.progress >= 100) { loadStatus(); setJob(null); }
      });
    }
  };

  if (loading) return <LoadingSpinner />;

  const inputStyle: React.CSSProperties = { padding: `6px ${theme.spacing.sm}px`, borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border.medium}`, fontFamily: "inherit" };

  return (
    <div style={{ display: "flex", gap: theme.spacing.xl }}>
      <div style={{ flex: 1 }}>
      <PageHeader title={t.imageGen.title} description={t.imageGen.description}>
        <Button variant="outline" size="sm" onClick={() => setShowAdvisor(!showAdvisor)}>
          {showAdvisor ? t.imageGen.hideAdvisor : t.imageGen.askAdvisor}
        </Button>
      </PageHeader>

      <div style={{
        padding: "8px 14px", marginBottom: theme.spacing.lg,
        border: `1px solid ${theme.colors.info}33`, borderRadius: theme.radii.md,
        background: `${theme.colors.info}08`, fontSize: theme.font.sizes.sm,
        color: theme.colors.text.secondary, lineHeight: 1.6,
      }}>
        <strong>{t.imageGen.promptTips}</strong> Be specific about art style (anime, watercolor, chibi), hair color, eye color, outfit details.
        For characters, include facing direction and expression. Example: <em>"anime girl, long silver hair, red eyes, school uniform, smiling, facing left"</em>
      </div>

      {/* Series selector */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <label style={{ display: "block", marginBottom: theme.spacing.xs, fontWeight: theme.font.weights.semibold }}>Series</label>
        <select value={selectedSeries} onChange={(e) => setSelectedSeries(e.target.value)} style={{ ...inputStyle, width: 300 }}>
          <option value="">Select series...</option>
          {projects.map((p) => (
            <option key={p.seriesId} value={p.seriesId}>{p.name} ({p.seriesId})</option>
          ))}
        </select>
      </div>

      {/* Status */}
      {status && (
        <div style={{ marginBottom: theme.spacing.lg, display: "flex", gap: theme.spacing.lg }}>
          <span style={{ padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`, background: theme.colors.primaryLight, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.base }}>Characters: {status.characters}</span>
          <span style={{ padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`, background: theme.colors.primaryLight, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.base }}>Backgrounds: {status.backgrounds}</span>
        </div>
      )}

      {/* Asset kind */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <label style={{ display: "block", marginBottom: theme.spacing.xs, fontWeight: theme.font.weights.semibold }}>{t.imageGen.assetType}</label>
        <div style={{ display: "flex", gap: theme.spacing.sm }}>
          {(["character", "background"] as const).map((k) => (
            <Button key={k} variant="outline" size="sm" onClick={() => { setKind(k); setAspectRatio(k === "character" ? "1:1" : "16:9"); }}>
              {k === "character" ? t.imageGen.character : t.imageGen.background}
            </Button>
          ))}
        </div>
      </div>

      {/* Design Brief */}
      {kind === "character" && (
        <ImageDesignBrief brief={brief} onChange={setBrief} onApply={handleApplyBrief} title={t.imageGen.designBrief} description={t.imageGen.designBriefDesc} />
      )}

      {/* Character selector */}
      {kind === "character" && profiles.length > 0 && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          <label style={{ display: "block", marginBottom: theme.spacing.xs, fontWeight: theme.font.weights.semibold }}>{t.imageGen.characterLabel}</label>
          <select value={selectedCharId} onChange={(e) => handleSelectChar(e.target.value)} style={{ ...inputStyle, width: 300 }}>
            <option value="">{t.imageGen.customManual}</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.id}) — {p.variants.length} variant{p.variants.length !== 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>
      )}

      {/* Facing toggle */}
      {selectedChar && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          <label style={{ display: "block", marginBottom: theme.spacing.xs, fontWeight: theme.font.weights.semibold, fontSize: theme.font.sizes.base }}>{t.imageGen.facing}</label>
          <div style={{ display: "flex", gap: theme.spacing.sm }}>
            {(["LEFT", "RIGHT"] as const).map((dir) => (
              <Button key={dir} variant="outline" size="sm" onClick={() => setFacing(dir)}>
                {dir === "LEFT" ? t.imageGen.left : t.imageGen.right}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Variant gallery */}
      {selectedChar && (
        <ImageVariantGallery
          seriesId={selectedSeries}
          character={selectedChar}
          onSelectVariant={setPrompt}
          variantsLabel={t.imageGen.variants}
          clickHint={t.imageGen.variantsClick}
        />
      )}

      {/* Prompt */}
      <div style={{ marginBottom: theme.spacing.md }}>
        <label style={{ display: "block", marginBottom: theme.spacing.xs, fontWeight: theme.font.weights.semibold }}>{t.imageGen.promptLabel}</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder={kind === "character" ? t.imageGen.characterPlaceholder : t.imageGen.backgroundPlaceholder}
          style={{ ...inputStyle, width: "100%", maxWidth: 600, padding: theme.spacing.sm }}
        />
        {selectedChar && (
          <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.faint, marginTop: 2 }}>
            Prompt will be enhanced with facing direction + magenta background + anime style
          </div>
        )}
      </div>

      {/* Filename + options */}
      <div style={{ display: "flex", gap: theme.spacing.md, marginBottom: theme.spacing.lg, flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", marginBottom: theme.spacing.xs, fontWeight: theme.font.weights.semibold, fontSize: theme.font.sizes.base }}>{t.imageGen.filename}</label>
          <input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder={t.imageGen.filenamePlaceholder} style={{ ...inputStyle, width: 200 }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: theme.spacing.xs, fontWeight: theme.font.weights.semibold, fontSize: theme.font.sizes.base }}>{t.imageGen.aspectRatio}</label>
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} style={inputStyle}>
            <option value="1:1">1:1</option>
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="4:3">4:3</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <label style={{ display: "flex", alignItems: "center", gap: theme.spacing.xs, fontSize: theme.font.sizes.base }}>
            <input type="checkbox" checked={skipExisting} onChange={(e) => setSkipExisting(e.target.checked)} />
            {t.imageGen.skipExisting}
          </label>
        </div>
      </div>

      <Button variant="primary" onClick={handleGenerate} disabled={!selectedSeries || !prompt || !filename || !!job}>
        {t.imageGen.generate}{selectedChar ? ` (${selectedChar.name})` : ""}
      </Button>

      {job && (
        <div style={{ marginTop: theme.spacing.lg }}>
          <div style={{ fontWeight: theme.font.weights.semibold, marginBottom: theme.spacing.xs }}>Job {job.id}</div>
          <div style={{ background: theme.colors.border.light, borderRadius: theme.radii.lg, height: 24, overflow: "hidden" }}>
            <div style={{ width: `${job.progress}%`, height: "100%", background: theme.colors.primary, transition: "width 0.3s" }} />
          </div>
          <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary, marginTop: theme.spacing.xs }}>{job.progress}%</div>
        </div>
      )}
      </div>
      {showAdvisor && (
        <AdvisorPanelBase
          agentName="studio-image"
          title={t.imageGen.advisor}
          titleColor={theme.colors.primaryDark}
          contextLabel={selectedSeries || t.imageGen.title}
          historyKey="image-gen-advisor"
          systemPrefix={`Context: Image Generation. Asset type: ${kind}. Series: ${selectedSeries || "none"}. Prompt writing and visual design guidance.`}
          placeholder={t.imageGen.advisorPlaceholder}
          messages={advisorMsgs}
          setMessages={setAdvisorMsgs}
          preferredAgents={["studio-image", "studio-advisor"]}
        />
      )}
    </div>
  );
}
