import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import type { AssetSummary, SeriesAssets, Asset } from "../../shared/types";

type Tab = "characters" | "backgrounds" | "audio";

export function Assets() {
  const [summaries, setSummaries] = useState<AssetSummary[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [assets, setAssets] = useState<SeriesAssets | null>(null);
  const [tab, setTab] = useState<Tab>("characters");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Asset | null>(null);

  const loadSummaries = useCallback(async () => {
    const res = await api.listAssets();
    if (res.data) setSummaries(res.data);
    setLoading(false);
  }, []);

  const loadAssets = useCallback(async (seriesId: string) => {
    if (!seriesId) return;
    const res = await api.getAssets(seriesId);
    if (res.data) setAssets(res.data);
  }, []);

  useEffect(() => { loadSummaries(); }, [loadSummaries]);

  useEffect(() => {
    if (selected) loadAssets(selected);
    else setAssets(null);
  }, [selected, loadAssets]);

  if (loading) return <div style={{ color: "#666" }}>Loading...</div>;

  const currentList: Asset[] = assets
    ? tab === "characters" ? assets.characters
      : tab === "backgrounds" ? assets.backgrounds
      : assets.audio
    : [];

  // Group audio by episode
  const audioByEpisode = new Map<string, Asset[]>();
  for (const a of currentList) {
    const key = a.episodeId ?? "unknown";
    if (!audioByEpisode.has(key)) audioByEpisode.set(key, []);
    audioByEpisode.get(key)!.push(a);
  }

  const tabs: { id: Tab; label: string; count: number }[] = assets ? [
    { id: "characters", label: "Characters", count: assets.characters.length },
    { id: "backgrounds", label: "Backgrounds", count: assets.backgrounds.length },
    { id: "audio", label: "Audio", count: assets.audio.length },
  ] : [];

  return (
    <div>
      <h2 style={{ margin: "0 0 16px" }}>Assets</h2>

      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: 6, fontSize: 14 }}
        >
          <option value="">Select series...</option>
          {summaries.map((s) => (
            <option key={s.seriesId} value={s.seriesId}>
              {s.seriesName} ({s.characters} chars, {s.backgrounds} bgs, {s.audio} audio)
            </option>
          ))}
        </select>
      </div>

      {assets && (
        <>
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "6px 14px",
                  border: "1px solid #ddd",
                  background: tab === t.id ? "#e3f2fd" : "#fff",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          {tab !== "audio" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {currentList.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setPreview(asset)}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 8,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "#fafafa",
                  }}
                >
                  <img
                    src={api.assetFileUrl(asset.seriesId + "/" + (asset.episodeId ? asset.episodeId + "/" : "") + asset.id.split("/").pop())}
                    alt={asset.name}
                    style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                    loading="lazy"
                  />
                  <div style={{ padding: "4px 8px", fontSize: 11, color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {asset.name}
                  </div>
                </div>
              ))}
              {currentList.length === 0 && <div style={{ color: "#999" }}>No {tab} found.</div>}
            </div>
          ) : (
            <div>
              {[...audioByEpisode.entries()].map(([epId, files]) => (
                <div key={epId} style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#555" }}>{epId}</h4>
                  {files.map((asset) => (
                    <div key={asset.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "#777", minWidth: 120 }}>{asset.name}</span>
                      <audio
                        controls
                        src={api.assetFileUrl(asset.seriesId + "/" + asset.id)}
                        style={{ height: 32 }}
                      />
                      <span style={{ fontSize: 11, color: "#aaa" }}>{formatSize(asset.size)}</span>
                    </div>
                  ))}
                </div>
              ))}
              {currentList.length === 0 && <div style={{ color: "#999" }}>No audio found.</div>}
            </div>
          )}
        </>
      )}

      {!selected && summaries.length === 0 && (
        <div style={{ color: "#999" }}>No series with assets found.</div>
      )}

      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 16, maxWidth: "90vw", maxHeight: "90vh" }}>
            <img
              src={api.assetFileUrl(preview.seriesId + "/" + (preview.episodeId ? preview.episodeId + "/" : "") + preview.id.split("/").pop())}
              alt={preview.name}
              style={{ maxWidth: "80vw", maxHeight: "75vh", display: "block", borderRadius: 8 }}
            />
            <div style={{ marginTop: 8, fontSize: 13, color: "#555" }}>
              {preview.name} ({preview.format}, {formatSize(preview.size)})
            </div>
            <button onClick={() => setPreview(null)} style={{ marginTop: 8, padding: "4px 12px", borderRadius: 4, border: "1px solid #ddd", cursor: "pointer" }}>Close</button>
          </div>
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
