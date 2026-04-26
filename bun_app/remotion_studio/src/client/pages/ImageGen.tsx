import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import type { Project, ImageStatus, Job, JobProgress, CharacterProfile } from "../../shared/types";

type AssetKind = "character" | "background";

export function ImageGen() {
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

  // Character profiles
  const [profiles, setProfiles] = useState<CharacterProfile[]>([]);
  const [selectedCharId, setSelectedCharId] = useState("");
  const [facing, setFacing] = useState<"LEFT" | "RIGHT">("LEFT");

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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Image Generation</h2>

      {/* Series selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Series</label>
        <select
          value={selectedSeries}
          onChange={(e) => setSelectedSeries(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6, width: 300 }}
        >
          <option value="">Select series...</option>
          {projects.map((p) => (
            <option key={p.seriesId} value={p.seriesId}>{p.name} ({p.seriesId})</option>
          ))}
        </select>
      </div>

      {/* Status */}
      {status && (
        <div style={{ marginBottom: 16, display: "flex", gap: 16 }}>
          <span style={{ padding: "4px 10px", background: "#e3f2fd", borderRadius: 6, fontSize: 13 }}>
            Characters: {status.characters}
          </span>
          <span style={{ padding: "4px 10px", background: "#e3f2fd", borderRadius: 6, fontSize: 13 }}>
            Backgrounds: {status.backgrounds}
          </span>
        </div>
      )}

      {/* Asset kind */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Asset Type</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["character", "background"] as const).map((k) => (
            <button
              key={k}
              onClick={() => {
                setKind(k);
                setAspectRatio(k === "character" ? "1:1" : "16:9");
              }}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: kind === k ? "2px solid #1976d2" : "1px solid #ccc",
                background: kind === k ? "#e3f2fd" : "white",
                cursor: "pointer",
              }}
            >
              {k === "character" ? "Character (1:1)" : "Background (16:9)"}
            </button>
          ))}
        </div>
      </div>

      {/* Character selector (only when kind=character and profiles loaded) */}
      {kind === "character" && profiles.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Character</label>
          <select
            value={selectedCharId}
            onChange={(e) => handleSelectChar(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, width: 300 }}
          >
            <option value="">Custom — manual prompt</option>
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
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 13 }}>Facing</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["LEFT", "RIGHT"] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setFacing(dir)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  border: facing === dir ? "2px solid #1976d2" : "1px solid #ccc",
                  background: facing === dir ? "#e3f2fd" : "white",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {dir === "LEFT" ? "← Left" : "Right →"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Variant gallery (only when character selected) */}
      {selectedChar && selectedChar.variants.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 13 }}>
            Existing Variants (click to copy prompt)
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {selectedChar.variants.map((v) => (
              <button
                key={v.file}
                onClick={() => handleVariantClick(v.prompt)}
                title={v.prompt}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  overflow: "hidden",
                  cursor: "pointer",
                  position: "relative",
                  padding: 0,
                  background: "#f5f5f5",
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
                  background: "rgba(0,0,0,0.6)",
                  color: "white",
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
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder={kind === "character" ? "A warrior with a sword, blue hair..." : "Mountain temple at sunset..."}
          style={{ width: "100%", maxWidth: 600, padding: 8, borderRadius: 6, border: "1px solid #ccc", fontFamily: "inherit" }}
        />
        {selectedChar && (
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            Prompt will be enhanced with facing direction + magenta background + anime style
          </div>
        )}
      </div>

      {/* Filename + options row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 13 }}>Filename</label>
          <input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="hero-angry.png"
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", width: 200 }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 13 }}>Aspect Ratio</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc" }}
          >
            <option value="1:1">1:1</option>
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="4:3">4:3</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
            <input type="checkbox" checked={skipExisting} onChange={(e) => setSkipExisting(e.target.checked)} />
            Skip existing
          </label>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!selectedSeries || !prompt || !filename || !!job}
        style={{
          padding: "10px 24px",
          borderRadius: 8,
          border: "none",
          background: (!selectedSeries || !prompt || !filename || !!job) ? "#ccc" : "#1976d2",
          color: "white",
          fontWeight: 600,
          cursor: (!selectedSeries || !prompt || !filename || !!job) ? "not-allowed" : "pointer",
        }}
      >
        Generate Image{selectedChar ? ` (${selectedChar.name})` : ""}
      </button>

      {/* Progress */}
      {job && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Job {job.id}</div>
          <div style={{ background: "#eee", borderRadius: 6, height: 24, overflow: "hidden" }}>
            <div style={{ width: `${job.progress}%`, height: "100%", background: "#1976d2", transition: "width 0.3s" }} />
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{job.progress}%</div>
        </div>
      )}
    </div>
  );
}
