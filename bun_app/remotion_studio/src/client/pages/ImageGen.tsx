import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { PageHeader, LoadingSpinner, AdvisorPanelBase, type ChatMessage, loadHistory, saveHistory } from "../components";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import type { Project, ImageStatus, Job, JobProgress, CharacterProfile } from "../../shared/types";

type AssetKind = "character" | "background";

interface DesignBrief {
  name: string;
  artStyle: string;
  gender: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  outfit: string;
  accessories: string;
  expression: string;
  extra: string;
}

const EMPTY_BRIEF: DesignBrief = {
  name: "", artStyle: "anime", gender: "", hairColor: "", hairStyle: "",
  eyeColor: "", outfit: "", accessories: "", expression: "neutral", extra: "",
};

const ART_STYLES = ["anime", "watercolor", "chibi", "realistic", "pixel art", "comic"];
const EXPRESSIONS = ["neutral", "happy", "angry", "sad", "surprised", "smirking", "determined"];

function briefToPrompt(b: DesignBrief): string {
  const parts: string[] = [];
  if (b.artStyle) parts.push(b.artStyle);
  if (b.gender) parts.push(b.gender);
  if (b.name) parts.push(`character named ${b.name}`);
  if (b.hairColor || b.hairStyle) {
    const hair = [b.hairStyle, b.hairColor].filter(Boolean).join(" ");
    parts.push(`${hair} hair`);
  }
  if (b.eyeColor) parts.push(`${b.eyeColor} eyes`);
  if (b.outfit) parts.push(`wearing ${b.outfit}`);
  if (b.accessories) parts.push(b.accessories);
  if (b.expression) parts.push(`${b.expression} expression`);
  if (b.extra) parts.push(b.extra);
  return parts.join(", ");
}

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
  const [showBrief, setShowBrief] = useState(false);
  const [brief, setBrief] = useState<DesignBrief>({ ...EMPTY_BRIEF });

  // Character profiles
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

  // Load character profiles when series changes
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

    // Auto-populate prompt from basePrompt or appearance
    if (char.basePrompt) {
      setPrompt(char.basePrompt);
    } else if (char.appearance) {
      setPrompt(char.appearance);
    }

    // Auto-set facing from first variant
    if (char.variants.length > 0) {
      setFacing(char.variants[0].facing === "RIGHT" ? "RIGHT" : "LEFT");
    }

    // Auto-prefix filename
    setFilename((prev) => {
      const existing = prev.replace(/^[a-z]+-/, "");
      return `${charId}-${existing || "new.png"}`;
    });
  };

  const handleVariantClick = (variantPrompt: string) => {
    setPrompt(variantPrompt);
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
        if (p.progress >= 100) {
          loadStatus();
          setJob(null);
        }
      });
    }
  };

  if (loading) return <LoadingSpinner />;

  const inputStyle: React.CSSProperties = { padding: `6px ${theme.spacing.sm}px`, borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border.medium}`, fontFamily: "inherit" };

  return (
    <div style={{ display: "flex", gap: theme.spacing.xl }}>
      <div style={{ flex: 1 }}>
      <PageHeader title={t.imageGen.title} description={t.imageGen.description}>
        <button
          onClick={() => setShowAdvisor(!showAdvisor)}
          style={{
            padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
            background: showAdvisor ? theme.colors.primaryDark : theme.colors.primaryLight,
            color: showAdvisor ? theme.colors.bg.page : theme.colors.primaryDark,
            border: `1px solid ${theme.colors.primaryDark}`,
            borderRadius: theme.radii.md,
            cursor: "pointer",
            fontSize: theme.font.sizes.sm,
          }}
        >
          {showAdvisor ? t.imageGen.hideAdvisor : t.imageGen.askAdvisor}
        </button>
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
        <select
          value={selectedSeries}
          onChange={(e) => setSelectedSeries(e.target.value)}
          style={{ ...inputStyle, width: 300 }}
        >
          <option value="">Select series...</option>
          {projects.map((p) => (
            <option key={p.seriesId} value={p.seriesId}>{p.name} ({p.seriesId})</option>
          ))}
        </select>
      </div>

      {/* Status */}
      {status && (
        <div style={{ marginBottom: theme.spacing.lg, display: "flex", gap: theme.spacing.lg }}>
          <span style={{ padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`, background: theme.colors.primaryLight, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.base }}>
            Characters: {status.characters}
          </span>
          <span style={{ padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`, background: theme.colors.primaryLight, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.base }}>
            Backgrounds: {status.backgrounds}
          </span>
        </div>
      )}

      {/* Asset kind */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <label style={{ display: "block", marginBottom: theme.spacing.xs, fontWeight: theme.font.weights.semibold }}>{t.imageGen.assetType}</label>
        <div style={{ display: "flex", gap: theme.spacing.sm }}>
          {(["character", "background"] as const).map((k) => (
            <button
              key={k}
              onClick={() => {
                setKind(k);
                setAspectRatio(k === "character" ? "1:1" : "16:9");
              }}
              style={{
                padding: "6px 14px",
                borderRadius: theme.radii.lg,
                border: kind === k ? `2px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border.medium}`,
                background: kind === k ? theme.colors.primaryLight : theme.colors.bg.page,
                cursor: "pointer",
              }}
            >
              {k === "character" ? t.imageGen.character : t.imageGen.background}
            </button>
          ))}
        </div>
      </div>

      {/* Design Brief (collapsible, character only) */}
      {kind === "character" && (
        <div style={{ marginBottom: theme.spacing.lg, border: `1px solid ${theme.colors.border.default}`, borderRadius: theme.radii.lg }}>
          <button onClick={() => setShowBrief(!showBrief)}
            style={{
              width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", border: "none", background: theme.colors.bg.muted,
              borderRadius: theme.radii.lg, cursor: "pointer", fontSize: theme.font.sizes.sm,
            }}>
            <span style={{ fontWeight: theme.font.weights.medium }}>{t.imageGen.designBrief} — {t.imageGen.designBriefDesc}</span>
            <span>{showBrief ? "▲" : "▼"}</span>
          </button>
          {showBrief && (
            <div style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
              <BriefField label="Name" value={brief.name} onChange={(v) => setBrief({ ...brief, name: v })} theme={theme} />
              <BriefField label="Art Style" value={brief.artStyle} onChange={(v) => setBrief({ ...brief, artStyle: v })} theme={theme} options={ART_STYLES} />
              <BriefField label="Gender" value={brief.gender} onChange={(v) => setBrief({ ...brief, gender: v })} theme={theme} placeholder="e.g. girl, boy, androgynous" />
              <BriefField label="Expression" value={brief.expression} onChange={(v) => setBrief({ ...brief, expression: v })} theme={theme} options={EXPRESSIONS} />
              <BriefField label="Hair Color" value={brief.hairColor} onChange={(v) => setBrief({ ...brief, hairColor: v })} theme={theme} placeholder="e.g. silver, blue, black" />
              <BriefField label="Hair Style" value={brief.hairStyle} onChange={(v) => setBrief({ ...brief, hairStyle: v })} theme={theme} placeholder="e.g. long, short, twin-tails" />
              <BriefField label="Eye Color" value={brief.eyeColor} onChange={(v) => setBrief({ ...brief, eyeColor: v })} theme={theme} placeholder="e.g. red, green, gold" />
              <BriefField label="Outfit" value={brief.outfit} onChange={(v) => setBrief({ ...brief, outfit: v })} theme={theme} placeholder="e.g. school uniform, armor, casual" />
              <BriefField label="Accessories" value={brief.accessories} onChange={(v) => setBrief({ ...brief, accessories: v })} theme={theme} placeholder="e.g. sword, glasses, hat" />
              <div style={{ gridColumn: "1 / -1" }}>
                <BriefField label="Extra details" value={brief.extra} onChange={(v) => setBrief({ ...brief, extra: v })} theme={theme} placeholder="Any additional details..." />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={handleApplyBrief}
                  style={{
                    padding: "6px 16px", borderRadius: theme.radii.md,
                    border: `1px solid ${theme.colors.primary}`, background: theme.colors.primary,
                    color: "#fff", cursor: "pointer", fontSize: theme.font.sizes.sm,
                  }}>
                  Apply to Prompt
                </button>
                <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted }}>
                  Generated: {briefToPrompt(brief) || "(empty)"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Character selector (only when kind=character and profiles loaded) */}
      {kind === "character" && profiles.length > 0 && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          <label style={{ display: "block", marginBottom: theme.spacing.xs, fontWeight: theme.font.weights.semibold }}>{t.imageGen.characterLabel}</label>
          <select
            value={selectedCharId}
            onChange={(e) => handleSelectChar(e.target.value)}
            style={{ ...inputStyle, width: 300 }}
          >
            <option value="">{t.imageGen.customManual}</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id}) — {p.variants.length} variant{p.variants.length !== 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Facing toggle (only when character selected) */}
      {selectedChar && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          <label style={{ display: "block", marginBottom: theme.spacing.xs, fontWeight: theme.font.weights.semibold, fontSize: theme.font.sizes.base }}>{t.imageGen.facing}</label>
          <div style={{ display: "flex", gap: theme.spacing.sm }}>
            {(["LEFT", "RIGHT"] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setFacing(dir)}
                style={{
                  padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
                  borderRadius: theme.radii.lg,
                  border: facing === dir ? `2px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border.medium}`,
                  background: facing === dir ? theme.colors.primaryLight : theme.colors.bg.page,
                  cursor: "pointer",
                  fontSize: theme.font.sizes.base,
                }}
              >
                {dir === "LEFT" ? t.imageGen.left : t.imageGen.right}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Variant gallery (only when character selected) */}
      {selectedChar && selectedChar.variants.length > 0 && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          <label style={{ display: "block", marginBottom: theme.spacing.xs, fontWeight: theme.font.weights.semibold, fontSize: theme.font.sizes.base }}>
            {t.imageGen.variants} ({t.imageGen.variantsClick})
          </label>
          <div style={{ display: "flex", gap: theme.spacing.sm, flexWrap: "wrap" }}>
            {selectedChar.variants.map((v) => (
              <button
                key={v.file}
                onClick={() => handleVariantClick(v.prompt)}
                title={v.prompt}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: theme.radii.lg,
                  border: `1px solid ${theme.colors.border.medium}`,
                  overflow: "hidden",
                  cursor: "pointer",
                  position: "relative",
                  padding: 0,
                  background: theme.colors.bg.muted,
                }}
              >
                <img
                  src={api.assetFileUrl(`${selectedSeries}/assets/characters/${v.file}`)}
                  alt={v.emotion ?? v.type}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <span style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: theme.colors.bg.overlayLight,
                  color: theme.colors.bg.page,
                  fontSize: 9,
                  textAlign: "center",
                  padding: "1px 0",
                }}>
                  {v.emotion ?? v.type}
                </span>
              </button>
            ))}
          </div>
        </div>
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

      {/* Filename + options row */}
      <div style={{ display: "flex", gap: theme.spacing.md, marginBottom: theme.spacing.lg, flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", marginBottom: theme.spacing.xs, fontWeight: theme.font.weights.semibold, fontSize: theme.font.sizes.base }}>{t.imageGen.filename}</label>
          <input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder={t.imageGen.filenamePlaceholder}
            style={{ ...inputStyle, width: 200 }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: theme.spacing.xs, fontWeight: theme.font.weights.semibold, fontSize: theme.font.sizes.base }}>{t.imageGen.aspectRatio}</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            style={inputStyle}
          >
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

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!selectedSeries || !prompt || !filename || !!job}
        style={{
          padding: "10px 24px",
          borderRadius: theme.radii.xl,
          border: "none",
          background: (!selectedSeries || !prompt || !filename || !!job) ? theme.colors.border.medium : theme.colors.primary,
          color: theme.colors.bg.page,
          fontWeight: theme.font.weights.semibold,
          cursor: (!selectedSeries || !prompt || !filename || !!job) ? "not-allowed" : "pointer",
        }}
      >
        {t.imageGen.generate}{selectedChar ? ` (${selectedChar.name})` : ""}
      </button>

      {/* Progress */}
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

function BriefField({ label, value, onChange, theme, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  theme: ReturnType<typeof useTheme>; options?: string[]; placeholder?: string;
}) {
  const style: React.CSSProperties = {
    padding: "4px 8px", borderRadius: theme.radii.md,
    border: `1px solid ${theme.colors.border.medium}`, width: "100%",
    fontSize: theme.font.sizes.sm, fontFamily: "inherit",
  };
  return (
    <div>
      <label style={{ display: "block", fontSize: theme.font.sizes.xs, color: theme.colors.text.muted, marginBottom: 2 }}>{label}</label>
      {options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} style={style}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} />
      )}
    </div>
  );
}
